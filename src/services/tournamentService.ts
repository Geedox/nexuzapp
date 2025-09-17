import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/utils/logger";
import type { Database, TablesInsert, Tables } from "@/integrations/supabase/types";

export interface TournamentMatch {
    id: string;
    room_id: string;
    round_number: number;
    match_number: number;
    player1_id: string | null;
    player2_id: string | null;
    player3_id: string | null;
    player4_id: string | null;
    winner_id: string | null;
    status: "pending" | "active" | "completed" | "timeout";
    started_at: string | null;
    completed_at: string | null;
    time_limit_minutes: number | null;
    match_data: {
        elimination_type?: string;
        players_per_match?: number;
        round_duration_minutes?: number;
        scores?: Record<string, number>;
        metadata?: Record<string, unknown>;
    };
    created_at: string | null;
    updated_at: string | null;
}

export interface TournamentBracket {
    rounds: TournamentRound[];
    totalRounds: number;
    currentRound: number;
    isComplete: boolean;
}

export interface TournamentRound {
    roundNumber: number;
    matches: TournamentMatch[];
    isComplete: boolean;
    isActive: boolean;
}

export interface TournamentParticipant {
    id: string;
    user_id: string;
    room_id: string;
    seed: number | null;
    is_eliminated: boolean;
    elimination_round: number | null;
    total_score: number;
    matches_played: number;
    matches_won: number;
    user?: {
        id: string;
        username?: string;
        display_name?: string;
        avatar_url?: string;
        email?: string;
    };
}

export interface CreateTournamentData {
    roomId: string;
    eliminationType: "single" | "double" | "swiss";
    maxRounds?: number;
    playersPerMatch?: number;
    roundDurationMinutes?: number;
    timeLimitMinutes?: number;
}

export interface TournamentStats {
    totalParticipants: number;
    completedMatches: number;
    totalMatches: number;
    currentRound: number;
    totalRounds: number;
    isComplete: boolean;
    winner?: string;
}

class TournamentService {
    // Create tournament matches for a room
    async createTournamentMatches(data: CreateTournamentData): Promise<TournamentMatch[]> {
        try {
            // Validate input data
            this.validateTournamentData(data);

            // Get all active participants
            const { data: participants, error: participantsError } = await supabase
                .from("game_room_participants")
                .select("*, user:profiles(*)")
                .eq("room_id", data.roomId)
                .eq("is_active", true);

            if (participantsError) throw participantsError;

            if (!participants || participants.length === 0) {
                throw new Error("No active participants found");
            }

            // Validate participant count
            this.validateParticipantCount(participants.length, data.eliminationType);

            // Check if tournament already exists
            const existingMatches = await this.getTournamentMatches(data.roomId);
            if (existingMatches.length > 0) {
                throw new Error("Tournament already exists for this room");
            }

            // Calculate number of rounds needed
            const totalRounds = this.calculateTotalRounds(participants.length, data.eliminationType);

            // Generate bracket structure
            const bracket = this.generateBracket(participants, data.eliminationType, totalRounds);

            // Create matches in database
            const matches: TablesInsert<"tournament_matches">[] = [];
            let matchNumber = 1;

            for (let round = 1; round <= totalRounds; round++) {
                const roundMatches = bracket[round - 1] || [];

                for (const match of roundMatches) {
                    matches.push({
                        room_id: data.roomId,
                        round_number: round,
                        match_number: matchNumber++,
                        player1_id: match.player1_id,
                        player2_id: match.player2_id,
                        player3_id: match.player3_id || null,
                        player4_id: match.player4_id || null,
                        status: "pending",
                        time_limit_minutes: data.timeLimitMinutes || 30,
                        match_data: {
                            elimination_type: data.eliminationType,
                            players_per_match: data.playersPerMatch || 2,
                            round_duration_minutes: data.roundDurationMinutes || 60,
                        },
                    });
                }
            }

            const { data: createdMatches, error: matchesError } = await supabase
                .from("tournament_matches")
                .insert(matches)
                .select();

            if (matchesError) throw matchesError;

            // Update room with tournament data
            await supabase
                .from("game_rooms")
                .update({
                    tournament_rounds: totalRounds,
                    current_round: 1,
                    tournament_ready: true,
                    bracket_data: {
                        elimination_type: data.eliminationType,
                        total_rounds: totalRounds,
                        participants: participants.map(p => ({
                            id: p.user_id,
                            seed: null,
                            is_eliminated: false,
                        })),
                    },
                })
                .eq("id", data.roomId);

            logger.success(`Created ${createdMatches.length} tournament matches for room ${data.roomId}`);
            return createdMatches as TournamentMatch[];

        } catch (error) {
            logger.error("Error creating tournament matches:", error);
            throw error;
        }
    }

    // Get tournament matches for a room
    async getTournamentMatches(roomId: string): Promise<TournamentMatch[]> {
        try {
            const { data, error } = await supabase
                .from("tournament_matches")
                .select("*")
                .eq("room_id", roomId)
                .order("round_number", { ascending: true })
                .order("match_number", { ascending: true });

            if (error) throw error;
            return (data as TournamentMatch[]) || [];
        } catch (error) {
            logger.error("Error fetching tournament matches:", error);
            throw error;
        }
    }

    // Get tournament bracket structure
    async getTournamentBracket(roomId: string): Promise<TournamentBracket> {
        try {
            const matches = await this.getTournamentMatches(roomId);

            if (matches.length === 0) {
                return { rounds: [], totalRounds: 0, currentRound: 0, isComplete: false };
            }

            const rounds: TournamentRound[] = [];
            const totalRounds = Math.max(...matches.map(m => m.round_number));
            let currentRound = 1;

            for (let roundNum = 1; roundNum <= totalRounds; roundNum++) {
                const roundMatches = matches.filter(m => m.round_number === roundNum);
                const isComplete = roundMatches.every(m => m.status === "completed");
                const isActive = roundMatches.some(m => m.status === "active");

                if (isActive) currentRound = roundNum;

                rounds.push({
                    roundNumber: roundNum,
                    matches: roundMatches,
                    isComplete,
                    isActive,
                });
            }

            const isComplete = rounds.every(r => r.isComplete);

            return {
                rounds,
                totalRounds,
                currentRound,
                isComplete,
            };
        } catch (error) {
            logger.error("Error getting tournament bracket:", error);
            throw error;
        }
    }

    // Start a tournament match
    async startMatch(matchId: string): Promise<TournamentMatch> {
        try {
            const { data, error } = await supabase
                .from("tournament_matches")
                .update({
                    status: "active",
                    started_at: new Date().toISOString(),
                })
                .eq("id", matchId)
                .select()
                .single();

            if (error) throw error;
            return data as TournamentMatch;
        } catch (error) {
            logger.error("Error starting match:", error);
            throw error;
        }
    }

    // Complete a tournament match
    async completeMatch(matchId: string, winnerId: string, matchData?: Record<string, unknown>): Promise<TournamentMatch> {
        try {
            const { data, error } = await supabase
                .from("tournament_matches")
                .update({
                    status: "completed",
                    winner_id: winnerId,
                    completed_at: new Date().toISOString(),
                    match_data: matchData as Database["public"]["Tables"]["tournament_matches"]["Update"]["match_data"],
                })
                .eq("id", matchId)
                .select()
                .single();

            if (error) throw error;

            // Check if this was the last match of the round
            const match = data as TournamentMatch;
            await this.checkRoundCompletion(match.room_id, match.round_number);

            return match;
        } catch (error) {
            logger.error("Error completing match:", error);
            throw error;
        }
    }

    // Handle match timeout
    async timeoutMatch(matchId: string): Promise<TournamentMatch> {
        try {
            const { data, error } = await supabase
                .from("tournament_matches")
                .update({
                    status: "timeout",
                    completed_at: new Date().toISOString(),
                })
                .eq("id", matchId)
                .select()
                .single();

            if (error) throw error;
            return data as TournamentMatch;
        } catch (error) {
            logger.error("Error timing out match:", error);
            throw error;
        }
    }

    // Get tournament participants
    async getTournamentParticipants(roomId: string): Promise<TournamentParticipant[]> {
        try {
            const { data, error } = await supabase
                .from("game_room_participants")
                .select(`
          *,
          user:profiles(*)
        `)
                .eq("room_id", roomId)
                .eq("is_active", true)
                .order("score", { ascending: false });

            if (error) throw error;

            // Map the data to TournamentParticipant interface
            const mappedData: TournamentParticipant[] = (data || []).map(participant => ({
                id: participant.id,
                user_id: participant.user_id,
                room_id: participant.room_id,
                seed: null,
                is_eliminated: false,
                elimination_round: null,
                total_score: participant.score || 0,
                matches_played: 0,
                matches_won: 0,
                user: participant.user,
            }));

            return mappedData;
        } catch (error) {
            logger.error("Error fetching tournament participants:", error);
            throw error;
        }
    }

    // Get tournament statistics
    async getTournamentStats(roomId: string): Promise<TournamentStats> {
        try {
            const [matches, participants, room] = await Promise.all([
                this.getTournamentMatches(roomId),
                this.getTournamentParticipants(roomId),
                supabase.from("game_rooms").select("current_round, tournament_rounds").eq("id", roomId).single(),
            ]);

            const totalMatches = matches.length;
            const completedMatches = matches.filter(m => m.status === "completed").length;
            const currentRound = room.data?.current_round || 1;
            const totalRounds = room.data?.tournament_rounds || 0;
            const isComplete = completedMatches === totalMatches;

            // Find winner from final round
            let winner: string | undefined;
            if (isComplete && totalRounds > 0) {
                const finalRoundMatches = matches.filter(m => m.round_number === totalRounds);
                const finalMatch = finalRoundMatches.find(m => m.winner_id);
                winner = finalMatch?.winner_id || undefined;
            }

            return {
                totalParticipants: participants.length,
                completedMatches,
                totalMatches,
                currentRound,
                totalRounds,
                isComplete,
                winner,
            };
        } catch (error) {
            logger.error("Error getting tournament stats:", error);
            throw error;
        }
    }

    // Advance to next round
    async advanceToNextRound(roomId: string): Promise<void> {
        try {
            const { data: room, error: roomError } = await supabase
                .from("game_rooms")
                .select("current_round, tournament_rounds")
                .eq("id", roomId)
                .single();

            if (roomError) throw roomError;

            const nextRound = (room.current_round || 1) + 1;

            if (nextRound > (room.tournament_rounds || 0)) {
                // Tournament complete
                await supabase
                    .from("game_rooms")
                    .update({
                        status: "completed",
                        actual_end_time: new Date().toISOString(),
                    })
                    .eq("id", roomId);
            } else {
                // Advance to next round
                await supabase
                    .from("game_rooms")
                    .update({
                        current_round: nextRound,
                    })
                    .eq("id", roomId);

                // Start next round matches
                await this.startNextRoundMatches(roomId, nextRound);
            }
        } catch (error) {
            logger.error("Error advancing to next round:", error);
            throw error;
        }
    }

    // Private helper methods
    private calculateTotalRounds(participantCount: number, eliminationType: string): number {
        switch (eliminationType) {
            case "single":
                return Math.ceil(Math.log2(participantCount));
            case "double":
                return Math.ceil(Math.log2(participantCount)) * 2;
            case "swiss":
                return Math.ceil(Math.log2(participantCount));
            default:
                return Math.ceil(Math.log2(participantCount));
        }
    }

    private generateBracket(
        participants: { user_id: string;[key: string]: unknown }[],
        eliminationType: string,
        totalRounds: number
    ): { player1_id: string; player2_id: string | null; player3_id?: string | null; player4_id?: string | null }[][] {
        const bracket: { player1_id: string; player2_id: string | null; player3_id?: string | null; player4_id?: string | null }[][] = [];
        const shuffledParticipants = [...participants].sort(() => Math.random() - 0.5);

        if (eliminationType === "single") {
            // Single elimination bracket
            let currentRound = shuffledParticipants;

            for (let round = 0; round < totalRounds; round++) {
                const roundMatches: { player1_id: string; player2_id: string | null }[] = [];

                for (let i = 0; i < currentRound.length; i += 2) {
                    if (i + 1 < currentRound.length) {
                        roundMatches.push({
                            player1_id: currentRound[i].user_id,
                            player2_id: currentRound[i + 1].user_id,
                        });
                    } else {
                        // Bye for odd player
                        roundMatches.push({
                            player1_id: currentRound[i].user_id,
                            player2_id: null,
                        });
                    }
                }

                bracket.push(roundMatches);
                currentRound = roundMatches.map(() => ({ user_id: "", placeholder: true })); // Winners will be filled in later
            }
        }

        return bracket;
    }

    private async checkRoundCompletion(roomId: string, roundNumber: number): Promise<void> {
        try {
            const { data: roundMatches, error } = await supabase
                .from("tournament_matches")
                .select("status")
                .eq("room_id", roomId)
                .eq("round_number", roundNumber);

            if (error) throw error;

            const allCompleted = roundMatches?.every(m =>
                m.status === "completed" || m.status === "timeout"
            );

            if (allCompleted) {
                await this.advanceToNextRound(roomId);
            }
        } catch (error) {
            logger.error("Error checking round completion:", error);
            throw error;
        }
    }

    private async startNextRoundMatches(roomId: string, roundNumber: number): Promise<void> {
        try {
            const { error } = await supabase
                .from("tournament_matches")
                .update({ status: "pending" })
                .eq("room_id", roomId)
                .eq("round_number", roundNumber);

            if (error) throw error;
        } catch (error) {
            logger.error("Error starting next round matches:", error);
            throw error;
        }
    }

    // Validation methods
    private validateTournamentData(data: CreateTournamentData): void {
        if (!data.roomId) {
            throw new Error("Room ID is required");
        }

        if (!data.eliminationType) {
            throw new Error("Elimination type is required");
        }

        if (!["single", "double", "swiss"].includes(data.eliminationType)) {
            throw new Error("Invalid elimination type");
        }

        if (data.timeLimitMinutes && (data.timeLimitMinutes < 5 || data.timeLimitMinutes > 120)) {
            throw new Error("Time limit must be between 5 and 120 minutes");
        }

        if (data.roundDurationMinutes && (data.roundDurationMinutes < 10 || data.roundDurationMinutes > 240)) {
            throw new Error("Round duration must be between 10 and 240 minutes");
        }

        if (data.playersPerMatch && ![2, 4].includes(data.playersPerMatch)) {
            throw new Error("Players per match must be 2 or 4");
        }

        if (data.maxRounds && data.maxRounds > 10) {
            throw new Error("Maximum rounds cannot exceed 10");
        }
    }

    private validateParticipantCount(count: number, eliminationType: string): void {
        if (count < 2) {
            throw new Error("Tournament requires at least 2 participants");
        }

        if (count > 64) {
            throw new Error("Tournament cannot have more than 64 participants");
        }

        // For elimination tournaments, require even number of players
        if (eliminationType !== "swiss" && count % 2 !== 0) {
            throw new Error(`${eliminationType} elimination requires an even number of players`);
        }

        // Specific validation for different tournament types
        switch (eliminationType) {
            case "single":
                if (count < 2) {
                    throw new Error("Single elimination requires at least 2 players");
                }
                break;
            case "double":
                if (count < 4) {
                    throw new Error("Double elimination requires at least 4 players");
                }
                break;
            case "swiss":
                if (count < 4) {
                    throw new Error("Swiss system requires at least 4 players");
                }
                break;
        }
    }

    // Utility methods for tournament validation
    isValidTournamentSize(participantCount: number, eliminationType: string): boolean {
        try {
            this.validateParticipantCount(participantCount, eliminationType);
            return true;
        } catch {
            return false;
        }
    }

    getRecommendedPlayerCount(eliminationType: string): { min: number; max: number; recommended: number[] } {
        switch (eliminationType) {
            case "single":
                return {
                    min: 2,
                    max: 64,
                    recommended: [4, 8, 16, 32],
                };
            case "double":
                return {
                    min: 4,
                    max: 32,
                    recommended: [4, 8, 16],
                };
            case "swiss":
                return {
                    min: 4,
                    max: 64,
                    recommended: [6, 8, 12, 16],
                };
            default:
                return {
                    min: 2,
                    max: 64,
                    recommended: [4, 8, 16],
                };
        }
    }
}

export const tournamentService = new TournamentService();