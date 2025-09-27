import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/utils/logger";
import { tournamentService } from "./tournamentService";
import type { TournamentMatch } from "@/types/tournament";

interface TournamentTimingConfig {
    roomId: string;
    matchTimeLimitMinutes: number;
    roundDurationMinutes: number;
    autoAdvanceRounds: boolean;
}

interface MatchTimer {
    matchId: string;
    roomId: string;
    timeoutAt: Date;
    timerId: NodeJS.Timeout;
}

interface RoundTimer {
    roomId: string;
    roundNumber: number;
    timeoutAt: Date;
    timerId: NodeJS.Timeout;
}

class TournamentTimingService {
    private matchTimers: Map<string, MatchTimer> = new Map();
    private roundTimers: Map<string, RoundTimer> = new Map();

    // Start timing system for a tournament
    async startTournamentTiming(config: TournamentTimingConfig): Promise<void> {
        try {
            logger.info(`Starting tournament timing for room ${config.roomId}`);

            // Get all active matches for this room
            const matches = await tournamentService.getTournamentMatches(config.roomId);
            const activeMatches = matches.filter(match => match.status === "active");

            // Set up timers for each active match
            for (const match of activeMatches) {
                await this.startMatchTimer(match, config.matchTimeLimitMinutes);
            }

            // Set up round timer if auto-advance is enabled
            if (config.autoAdvanceRounds) {
                await this.startRoundTimer(config.roomId, config.roundDurationMinutes);
            }

            logger.success(`Tournament timing started for room ${config.roomId}`);
        } catch (error) {
            logger.error("Error starting tournament timing:", error);
            throw error;
        }
    }

    // Start timer for a specific match
    async startMatchTimer(match: TournamentMatch, timeLimitMinutes: number): Promise<void> {
        try {
            const timeoutAt = new Date(Date.now() + timeLimitMinutes * 60 * 1000);

            // Clear existing timer if any
            this.clearMatchTimer(match.id);

            const timerId = setTimeout(async () => {
                await this.handleMatchTimeout(match.id, match.room_id);
            }, timeLimitMinutes * 60 * 1000);

            this.matchTimers.set(match.id, {
                matchId: match.id,
                roomId: match.room_id,
                timeoutAt,
                timerId,
            });

            logger.info(`Match timer started for match ${match.id}, timeout at ${timeoutAt.toISOString()}`);
        } catch (error) {
            logger.error("Error starting match timer:", error);
            throw error;
        }
    }

    // Start timer for a round
    async startRoundTimer(roomId: string, roundDurationMinutes: number): Promise<void> {
        try {
            const timeoutAt = new Date(Date.now() + roundDurationMinutes * 60 * 1000);

            // Clear existing round timer if any
            this.clearRoundTimer(roomId);

            const timerId = setTimeout(async () => {
                await this.handleRoundTimeout(roomId);
            }, roundDurationMinutes * 60 * 1000);

            this.roundTimers.set(roomId, {
                roomId,
                roundNumber: await this.getCurrentRound(roomId),
                timeoutAt,
                timerId,
            });

            logger.info(`Round timer started for room ${roomId}, timeout at ${timeoutAt.toISOString()}`);
        } catch (error) {
            logger.error("Error starting round timer:", error);
            throw error;
        }
    }

    // Handle match timeout
    private async handleMatchTimeout(matchId: string, roomId: string): Promise<void> {
        try {
            logger.info(`Match ${matchId} timed out`);
            const { data: room } = await supabase.from("game_rooms").select("name").single()

            // Get the match details
            const match = await tournamentService.getMatchById(matchId);
            if (!match) {
                logger.error(`Match ${matchId} not found`);
                return;
            }

            // Check if match is still active
            if (match.status !== "active") {
                logger.info(`Match ${matchId} is no longer active, skipping timeout`);
                return;
            }

            // Determine winner based on submitted scores
            const scores = match.match_data?.scores || {};
            const participants = [match.player1_id, match.player2_id, match.player3_id, match.player4_id].filter(Boolean);

            let winnerId: string | null = null;
            let loserId: string | null = null;
            let highestScore = -1;

            // Find participant with highest score
            for (const participantId of participants) {
                const score = scores[participantId!] || 0;
                if (score > highestScore) {
                    highestScore = score;
                    winnerId = participantId;
                } else loserId = participantId
            }

            // If no scores submitted, advance first player (or random)
            if (!winnerId && participants.length > 0) {
                winnerId = participants[0]!;
                logger.info(`No scores submitted for match ${matchId}, advancing first player`);
            }

            if (winnerId) {
                // Complete the match with timeout status
                await tournamentService.completeMatch(matchId, winnerId, loserId, room.name, scores);
                logger.success(`Match ${matchId} completed due to timeout, winner: ${winnerId}`);
            } else {
                // Mark match as timeout without winner
                await tournamentService.timeoutMatch(matchId);
                logger.info(`Match ${matchId} timed out without winner`);
            }

            // Clear the timer
            this.clearMatchTimer(matchId);

            // Check if round is complete and advance if needed
            await this.checkAndAdvanceRound(roomId);
        } catch (error) {
            logger.error("Error handling match timeout:", error);
        }
    }

    // Handle round timeout
    private async handleRoundTimeout(roomId: string): Promise<void> {
        try {
            logger.info(`Round timeout for room ${roomId}`);

            // Get current round matches
            const matches = await tournamentService.getTournamentMatches(roomId);
            const currentRound = await this.getCurrentRound(roomId);
            const roundMatches = matches.filter(match => match.round_number === currentRound);

            // Timeout all active matches in current round
            for (const match of roundMatches) {
                if (match.status === "active") {
                    await this.handleMatchTimeout(match.id, roomId);
                }
            }

            // Clear round timer
            this.clearRoundTimer(roomId);

            // Advance to next round
            await tournamentService.advanceToNextRound(roomId);

            // Start timer for next round if tournament continues
            const tournamentStats = await tournamentService.getTournamentStats(roomId);
            if (!tournamentStats.isComplete) {
                const { data: room } = await supabase
                    .from("game_rooms")
                    .select("round_duration_minutes")
                    .eq("id", roomId)
                    .single();

                if (room?.round_duration_minutes) {
                    await this.startRoundTimer(roomId, room.round_duration_minutes);
                }
            }

            logger.success(`Round ${currentRound} completed for room ${roomId}`);
        } catch (error) {
            logger.error("Error handling round timeout:", error);
            throw error;
        }
    }

    // Check if round is complete and advance if needed
    private async checkAndAdvanceRound(roomId: string): Promise<void> {
        try {
            const currentRound = await this.getCurrentRound(roomId);
            const matches = await tournamentService.getTournamentMatches(roomId);
            const roundMatches = matches.filter(match => match.round_number === currentRound);

            // Check if all matches in current round are completed
            const allCompleted = roundMatches.every(match =>
                match.status === "completed" || match.status === "timeout"
            );

            if (allCompleted && roundMatches.length > 0) {
                logger.info(`All matches in round ${currentRound} completed for room ${roomId}`);

                // Clear round timer
                this.clearRoundTimer(roomId);

                // Advance to next round
                await tournamentService.advanceToNextRound(roomId);

                // Start timer for next round
                const { data: room } = await supabase
                    .from("game_rooms")
                    .select("round_duration_minutes")
                    .eq("id", roomId)
                    .single();

                if (room?.round_duration_minutes) {
                    await this.startRoundTimer(roomId, room.round_duration_minutes);
                }
            }
        } catch (error) {
            logger.error("Error checking and advancing round:", error);
        }
    }

    // Get current round for a room
    private async getCurrentRound(roomId: string): Promise<number> {
        try {
            const { data: room } = await supabase
                .from("game_rooms")
                .select("current_round")
                .eq("id", roomId)
                .single();

            return room?.current_round || 1;
        } catch (error) {
            logger.error("Error getting current round:", error);
            return 1;
        }
    }

    // Clear match timer
    private clearMatchTimer(matchId: string): void {
        const timer = this.matchTimers.get(matchId);
        if (timer) {
            clearTimeout(timer.timerId);
            this.matchTimers.delete(matchId);
            logger.debug(`Cleared timer for match ${matchId}`);
        }
    }

    // Clear round timer
    private clearRoundTimer(roomId: string): void {
        const timer = this.roundTimers.get(roomId);
        if (timer) {
            clearTimeout(timer.timerId);
            this.roundTimers.delete(roomId);
            logger.debug(`Cleared timer for room ${roomId}`);
        }
    }

    // Stop all timers for a room
    async stopTournamentTiming(roomId: string): Promise<void> {
        try {
            logger.info(`Stopping tournament timing for room ${roomId}`);

            // Clear round timer
            this.clearRoundTimer(roomId);

            // Clear all match timers for this room
            const matches = await tournamentService.getTournamentMatches(roomId);
            for (const match of matches) {
                this.clearMatchTimer(match.id);
            }

            logger.success(`Tournament timing stopped for room ${roomId}`);
        } catch (error) {
            logger.error("Error stopping tournament timing:", error);
            throw error;
        }
    }

    // Get remaining time for a match
    async getMatchRemainingTime(matchId: string): Promise<number | null> {
        const timer = this.matchTimers.get(matchId);
        if (!timer) return null;

        const remaining = timer.timeoutAt.getTime() - Date.now();
        return Math.max(0, Math.floor(remaining / 1000)); // Return seconds
    }

    // Get remaining time for a round
    async getRoundRemainingTime(roomId: string): Promise<number | null> {
        const timer = this.roundTimers.get(roomId);
        if (!timer) return null;

        const remaining = timer.timeoutAt.getTime() - Date.now();
        return Math.max(0, Math.floor(remaining / 1000)); // Return seconds
    }

    // Get all active timers
    getActiveTimers(): { matchTimers: MatchTimer[]; roundTimers: RoundTimer[] } {
        return {
            matchTimers: Array.from(this.matchTimers.values()),
            roundTimers: Array.from(this.roundTimers.values()),
        };
    }

    // Cleanup all timers (for shutdown)
    cleanup(): void {
        logger.info("Cleaning up tournament timing service");

        // Clear all match timers
        for (const timer of this.matchTimers.values()) {
            clearTimeout(timer.timerId);
        }
        this.matchTimers.clear();

        // Clear all round timers
        for (const timer of this.roundTimers.values()) {
            clearTimeout(timer.timerId);
        }
        this.roundTimers.clear();
        logger.success("Tournament timing service cleaned up");
    }
}

export const tournamentTimingService = new TournamentTimingService();
