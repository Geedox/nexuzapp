import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/utils/logger";
import type { Database, TablesInsert } from "@/integrations/supabase/types";
import { CreateTournamentData, TournamentMatch, TournamentBracket, TournamentRound, TournamentParticipant, TournamentStats } from "@/types/tournament";
import { tournamentTimingService } from "./tournamentTimingService";
import { GameRoom, GameRoomParticipant, Wallet } from "@/types/gameroom";
import { Profile } from "@/contexts/ProfileContext";
import { Currency, GameRoom as OnChainGameRoom } from "@/integrations/smartcontracts/gameRoom";
import { NETWORK } from "@/constants";
import { getFullnodeUrl, SuiClient } from "@mysten/sui.js/client";
import { gameRoomService } from "./gameRoomService";

type Winner = {
  userId: string;
  position: number;
  participantId: string;
  address: Wallet["address"];
  score: number;
}


type Status = "pending" | "active" | "completed" | "timeout";
class TournamentService {
  private onChainGameRoom: OnChainGameRoom;
  constructor() {
    const suiClient = new SuiClient({ url: getFullnodeUrl(NETWORK) });
    this.onChainGameRoom = new OnChainGameRoom(suiClient);
  }
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
          const scores: Record<string, number> = {};
          if (match.player1_id) {
            scores[match.player1_id] = 0;
          }
          if (match.player2_id) {
            scores[match.player2_id] = 0;
          }
          if (match.player3_id) {
            scores[match.player3_id] = 0;
          }
          if (match.player4_id) {
            scores[match.player4_id] = 0;
          }
          matches.push({
            room_id: data.roomId,
            round_number: round,
            match_number: matchNumber++,
            player1_id: match.player1_id,
            player2_id: match.player2_id,
            player3_id: match.player3_id || null,
            player4_id: match.player4_id || null,
            status: match.status,
            time_limit_minutes: data.timeLimitMinutes,
            match_data: {
              elimination_type: data.eliminationType,
              players_per_match: data.playersPerMatch,
              round_duration_minutes: data.roundDurationMinutes,
              scores: scores,
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

      // Start tournament timing system
      await this.startTournamentTiming(data.roomId, {
        matchTimeLimitMinutes: data.timeLimitMinutes,
        roundDurationMinutes: data.roundDurationMinutes,
        autoAdvanceRounds: true,
      });

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

      // Start match timer
      await tournamentTimingService.startMatchTimer(data as TournamentMatch, data.time_limit_minutes || 30);

      return data as TournamentMatch;
    } catch (error) {
      logger.error("Error starting match:", error);
      throw error;
    }
  }

  // Start tournament timing system
  async startTournamentTiming(roomId: string, config: {
    matchTimeLimitMinutes: number;
    roundDurationMinutes: number;
    autoAdvanceRounds: boolean;
  }): Promise<void> {
    try {
      await tournamentTimingService.startTournamentTiming({
        roomId,
        matchTimeLimitMinutes: config.matchTimeLimitMinutes,
        roundDurationMinutes: config.roundDurationMinutes,
        autoAdvanceRounds: config.autoAdvanceRounds,
      });

      logger.success(`Tournament timing started for room ${roomId}`);
    } catch (error) {
      logger.error("Error starting tournament timing:", error);
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
      const currentRound = room.data?.current_round;
      const totalRounds = room.data?.tournament_rounds;
      const isComplete = completedMatches !== 0 && completedMatches === totalMatches;

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
  ): { player1_id: string; player2_id: string | null; player3_id?: string | null; player4_id?: string | null; status: Status }[][] {
    const shuffledParticipants = [...participants].sort(() => Math.random() - 0.5);

    switch (eliminationType) {
      case "single":
        return this.generateSingleEliminationBracket(shuffledParticipants, totalRounds);
      case "double":
        return this.generateDoubleEliminationBracket(shuffledParticipants, totalRounds);
      case "swiss":
        return this.generateSwissBracket(shuffledParticipants, totalRounds);
      default:
        throw new Error(`Unsupported elimination type: ${eliminationType}`);
    }
  }

  private generateSingleEliminationBracket(
    participants: { user_id: string;[key: string]: unknown }[],
    totalRounds: number
  ): { player1_id: string; player2_id: string | null; player3_id?: string | null; player4_id?: string | null; status: Status }[][] {
    const bracket: { player1_id: string; player2_id: string | null; status: Status }[][] = [];
    const currentRound = participants;

    for (let round = 0; round < totalRounds; round++) {
      const roundMatches: { player1_id: string; player2_id: string | null; status: Status }[] = [];

      if (round === 0) {
        // First round - pair up all participants
        for (let i = 0; i < currentRound.length; i += 2) {
          if (i + 1 < currentRound.length) {
            roundMatches.push({
              player1_id: currentRound[i].user_id,
              player2_id: currentRound[i + 1].user_id,
              status: "active"
            });
          } else {
            // Bye for odd player
            roundMatches.push({
              player1_id: currentRound[i].user_id,
              player2_id: null,
              status: "active"
            });
          }
        }
      } else {
        // Subsequent rounds - create placeholder matches for winners
        const expectedMatches = Math.ceil(bracket[round - 1].length / 2);
        for (let i = 0; i < expectedMatches; i++) {
          roundMatches.push({
            player1_id: null, // Will be filled by winner advancement
            player2_id: null, // Will be filled by winner advancement
            status: "pending",
          });
        }
      }

      bracket.push(roundMatches);
      // For subsequent rounds, we don't need to track currentRound as matches are populated by winner advancement
    }

    return bracket;
  }

  private generateDoubleEliminationBracket(
    participants: { user_id: string;[key: string]: unknown }[],
    totalRounds: number
  ): { player1_id: string; player2_id: string | null; player3_id?: string | null; player4_id?: string | null; status: Status }[][] {
    const bracket: { player1_id: string; player2_id: string | null; status: Status }[][] = [];
    const winnerRounds = Math.ceil(Math.log2(participants.length));
    const loserRounds = (winnerRounds - 1) * 2;

    // Generate winner bracket rounds
    for (let round = 0; round < winnerRounds; round++) {
      const roundMatches: { player1_id: string; player2_id: string | null; status: Status }[] = [];

      if (round === 0) {
        // First winner bracket round
        for (let i = 0; i < participants.length; i += 2) {
          if (i + 1 < participants.length) {
            roundMatches.push({
              player1_id: participants[i].user_id,
              player2_id: participants[i + 1].user_id,
              status: "active"
            });
          } else {
            roundMatches.push({
              player1_id: participants[i].user_id,
              player2_id: null,
              status: "active"
            });
          }
        }
      } else {
        // Subsequent winner bracket rounds
        const expectedMatches = Math.ceil(bracket[round - 1].length / 2);
        for (let i = 0; i < expectedMatches; i++) {
          roundMatches.push({
            player1_id: null,
            player2_id: null,
            status: "pending"
          });
        }
      }
      bracket.push(roundMatches);
    }

    // Generate loser bracket rounds
    for (let round = 0; round < loserRounds; round++) {
      const roundMatches: { player1_id: string; player2_id: string | null; status: Status }[] = [];
      // Calculate expected matches for loser bracket rounds
      const expectedMatches = round % 2 === 0 ?
        Math.ceil(participants.length / Math.pow(2, Math.floor(round / 2) + 2)) :
        Math.ceil(participants.length / Math.pow(2, Math.floor(round / 2) + 3));

      for (let i = 0; i < Math.max(1, expectedMatches); i++) {
        roundMatches.push({
          player1_id: null,
          player2_id: null,
          status: "active"
        });
      }
      bracket.push(roundMatches);
    }

    // Final match (winner of winner bracket vs winner of loser bracket)
    bracket.push([{
      player1_id: null,
      player2_id: null,
      status: "active"
    }]);

    return bracket;
  }

  private generateSwissBracket(
    participants: { user_id: string;[key: string]: unknown }[],
    totalRounds: number
  ): { player1_id: string; player2_id: string | null; player3_id?: string | null; player4_id?: string | null; status: Status }[][] {
    const bracket: { player1_id: string; player2_id: string | null; status: Status }[][] = [];

    for (let round = 0; round < totalRounds; round++) {
      const roundMatches: { player1_id: string; player2_id: string | null; status: Status }[] = [];

      if (round === 0) {
        // First round - random pairing
        const shuffled = [...participants].sort(() => Math.random() - 0.5);
        for (let i = 0; i < shuffled.length; i += 2) {
          if (i + 1 < shuffled.length) {
            roundMatches.push({
              player1_id: shuffled[i].user_id,
              player2_id: shuffled[i + 1].user_id,
              status: "active"
            });
          } else {
            // Bye for odd player
            roundMatches.push({
              player1_id: shuffled[i].user_id,
              player2_id: null,
              status: "active"
            });
          }
        }
      } else {
        // Subsequent rounds - pair by performance (will be handled by pairing algorithm)
        const matchCount = Math.ceil(participants.length / 2);
        for (let i = 0; i < matchCount; i++) {
          roundMatches.push({
            player1_id: null, // Will be filled by Swiss pairing algorithm
            player2_id: null,
            status: "pending"
          });
        }
      }

      bracket.push(roundMatches);
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
      // First, populate the next round matches with winners from previous round
      await this.populateNextRoundMatches(roomId, roundNumber);

      // Then set the status to pending to start the round
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

  private async populateNextRoundMatches(roomId: string, roundNumber: number): Promise<void> {
    try {
      // Get the previous round matches with winners
      const { data: previousRoundMatches, error: prevError } = await supabase
        .from("tournament_matches")
        .select("*")
        .eq("room_id", roomId)
        .eq("round_number", roundNumber - 1)
        .eq("status", "completed")
        .order("match_number");

      if (prevError) throw prevError;

      if (!previousRoundMatches || previousRoundMatches.length === 0) {
        throw new Error("No completed matches found in previous round");
      }

      // Get the current round matches that need to be populated
      const { data: currentRoundMatches, error: currError } = await supabase
        .from("tournament_matches")
        .select("*")
        .eq("room_id", roomId)
        .eq("round_number", roundNumber)
        .order("match_number");

      if (currError) throw currError;

      if (!currentRoundMatches || currentRoundMatches.length === 0) {
        throw new Error("No matches found for current round");
      }

      // Get tournament type to determine advancement logic
      const { data: room, error: roomError } = await supabase
        .from("game_rooms")
        .select("bracket_data")
        .eq("id", roomId)
        .single();

      if (roomError) throw roomError;

      const bracketData = room.bracket_data as { elimination_type?: string } | null;
      const eliminationType = bracketData?.elimination_type || "single";

      // Populate matches based on tournament type
      await this.advanceWinnersToNextRound(
        previousRoundMatches as TournamentMatch[],
        currentRoundMatches as TournamentMatch[],
        eliminationType,
        roundNumber
      );

    } catch (error) {
      logger.error("Error populating next round matches:", error);
      throw error;
    }
  }

  private async advanceWinnersToNextRound(
    previousMatches: TournamentMatch[],
    currentMatches: TournamentMatch[],
    eliminationType: string,
    roundNumber: number
  ): Promise<void> {
    const updates: { matchId: string; player1_id: string | null; player2_id: string | null; status: Status }[] = [];

    switch (eliminationType) {
      case "single":
        // Single elimination: pair winners from previous round
        for (let i = 0; i < currentMatches.length; i++) {
          const match1Index = i * 2;
          const match2Index = i * 2 + 1;

          const player1_id = match1Index < previousMatches.length ?
            (previousMatches[match1Index].winner_id || this.handleBye(previousMatches[match1Index])) : null;
          const player2_id = match2Index < previousMatches.length ?
            (previousMatches[match2Index].winner_id || this.handleBye(previousMatches[match2Index])) : null;

          updates.push({
            matchId: currentMatches[i].id,
            player1_id,
            player2_id,
            status: "active"
          });
        }
        break;


      default:
        throw new Error(`Unsupported elimination type: ${eliminationType}`);
    }

    // Apply updates
    for (const update of updates) {
      const { error } = await supabase
        .from("tournament_matches")
        .update({
          player1_id: update.player1_id,
          player2_id: update.player2_id,
          status: update.status
        })
        .eq("id", update.matchId);

      if (error) throw error;
    }
  }

  private handleBye(match: TournamentMatch): string | null {
    // If there's only one player (bye situation), that player advances
    if (match.player1_id && !match.player2_id) {
      return match.player1_id;
    }
    if (match.player2_id && !match.player1_id) {
      return match.player2_id;
    }
    return null;
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

    if (data.timeLimitMinutes && (data.timeLimitMinutes < 1)) {
      throw new Error("Time limit must be greater than 1 minute");
    }

    if (data.roundDurationMinutes && data.roundDurationMinutes < 1) {
      throw new Error("Round duration must be greater than 1 minute");
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

  // Get match by ID
  async getMatchById(matchId: string): Promise<TournamentMatch | null> {
    try {
      const { data: match, error } = await supabase
        .from("tournament_matches")
        .select("*")
        .eq("id", matchId)
        .single();

      if (error) throw error;
      if (!match) return null;
      return match as TournamentMatch;
    } catch (error) {
      logger.error("Error getting match by ID:", error);
      throw error;
    }
  }

  // Complete a match
  async completeMatch(matchId: string, winnerId: string, loserId: string, scores?: Record<string, number>): Promise<TournamentMatch> {
    try {
      const { data: matchData, error: matchDataError } = await supabase
        .from("tournament_matches")
        .select("match_data")
        .eq("id", matchId)
        .single();

      if (matchDataError) throw matchDataError;

      // Handle match_data which might be a string or object
      const matchDataJson = typeof matchData.match_data === 'string'
        ? JSON.parse(matchData.match_data)
        : matchData.match_data;
      const { data: match, error } = await supabase
        .from("tournament_matches")
        .update({
          winner_id: winnerId,
          status: "completed",
          completed_at: new Date().toISOString(),
          match_data: {
            ...matchDataJson,
            scores: scores,
          },
        })
        .eq("id", matchId)
        .select()
        .single();

      if (error) throw error;

      // Get room details to check if this is the last round
      const { data: room, error: roomError } = await supabase
        .from("game_rooms")
        .select("tournament_rounds, current_round, status")
        .eq("id", match.room_id)
        .single();

      if (roomError) throw roomError;

      // Check if this is the final round
      const isLastRound = room.current_round >= room.tournament_rounds;
      if (isLastRound) {
        // This is the final match - complete the entire tournament
        logger.info(`Final match completed for room ${match.room_id}. Completing tournament.`);
        // Complete the tournament using the existing game completion logic
        await this.completeTournament(match.room_id, winnerId, loserId, scores);
        logger.success(`Tournament completed for room ${match.room_id}`);
      } else {
        // Check if we need to advance winner to next round
        await this.advanceWinnerToNextRound(match as TournamentMatch);
      }
      return match as TournamentMatch;
    } catch (error) {
      logger.error("Error completing match:", error);
      throw error;
    }
  }

  async completeTournament(roomId: string, winnerId: string, loserId: string, scores: Record<string, number>): Promise<void> {
    try {
      // Get room and participants data
      const { data: room, error: roomError } = await supabase
        .from("game_rooms")
        .select(`
          *,
          participants:game_room_participants(*, user:profiles(*))
        `)
        .eq("id", roomId)
        .single();
      if (roomError) throw roomError;
      const participants = room.participants;
      const winners = await this.determineTournamentWinner(participants, room, winnerId, loserId, scores);
      await this.submitWinnersToSmartContractAndDistributePrizes(winners, room as GameRoom);
    } catch (error) {
      logger.error("Error completing tournament:", error);
      throw error;
    }
  }

  async determineTournamentWinner(participants: GameRoomParticipant[], room: GameRoom, rank1: string, rank2: string, scores: Record<string, number>): Promise<Winner[]> {
    try {
      // Get room win split rule
      const winnerSplitRule = room.winner_split_rule;
      const winners: Winner[] = [];
      const participant1 = participants.find(p => p.user_id === rank1)
      const participant2 = participants.find(p => p.user_id === rank2)
      switch (winnerSplitRule) {
        case "winner_takes_all":
          winners.push({
            userId: rank1,
            position: 1,
            participantId: participant1.id,
            address: (participant1.user.sui_wallet_data as Profile["sui_wallet_data"]).address,
            score: scores[rank1]

          });
          break;
        case "top_2":
          winners.push({
            userId: rank1,
            position: 1,
            participantId: participant1.id,
            address: (participant1.user.sui_wallet_data as Profile["sui_wallet_data"]).address,
            score: scores[rank1]
          });
          winners.push({
            userId: rank2,
            position: 2,
            participantId: participant2.id,
            address: (participant2.user.sui_wallet_data as Profile["sui_wallet_data"]).address,
            score: scores[rank2]
          });
          break;
        default:
          break;
      }
      return winners;
    } catch (error) {
      logger.error("Error determining tournament winner:", error);
      throw error;
    }
  }

  async submitWinnersToSmartContractAndDistributePrizes(winners: Winner[], room: GameRoom): Promise<void> {
    try {
      // Submit winners to smart contract
      const winnerAddresses = winners.map(winner => winner.address);
      const scores = winners.map(winner => winner.score);
      const onChainResult = await this.onChainGameRoom.completeGame({
        roomId: room.id,
        winnerAddresses,
        scores,
        currency: room.currency as Currency
      })
      if (!onChainResult?.digest) {
        throw new Error(
          `Failed to complete game on-chain for room ${room.id}: Missing transaction digest`
        );
      }
      await gameRoomService.distributePrizes(
        room as Database["public"]["Tables"]["game_rooms"]["Row"],
        room.participants as Database["public"]["Tables"]["game_room_participants"]["Row"][],
        winners,
        onChainResult
      );
      logger.success(
        `Successfully completed game on-chain for room ${room.id} with digest: ${onChainResult.digest}`
      );
    } catch (error) {
      logger.error("Error submitting winners to smart contract and distributing prizes:", error);
      throw error;
    }
  }

  // Submit score for highscore tournaments (match-based)
  async submitScore(roomId: string, matchId: string, score: number): Promise<void> {
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error("User not authenticated");

      // Get the match
      const match = await this.getMatchById(matchId);
      if (!match) throw new Error("Match not found");
      if (match.room_id !== roomId) throw new Error("Match does not belong to this room");

      // Verify user is a participant in this match
      const isParticipant = match.player1_id === user.id ||
        match.player2_id === user.id ||
        match.player3_id === user.id ||
        match.player4_id === user.id;

      if (!isParticipant) throw new Error("User is not a participant in this match");

      // Update match data with the score
      const currentMatchData = match.match_data;
      const updatedScores = {
        ...currentMatchData?.scores,
        [user.id]: score
      };

      logger.debug("Updated scores: ", updatedScores);
      logger.debug("Current match data: ", currentMatchData);

      const { data: matchData, error: updateError } = await supabase
        .from("tournament_matches")
        .update({
          match_data: {
            ...currentMatchData,
            scores: updatedScores,
          } as any,
        })
        .eq("id", matchId)
        .select("*")
        .single()


      if (updateError) {
        logger.debug("Update error");
        throw updateError;
      }
      logger.success("Successfully added Match data: ", matchData);

      // Check if all participants have submitted scores if game mode is multiplayer
      const participants = [match.player1_id, match.player2_id, match.player3_id, match.player4_id].filter(Boolean);
      const submittedScores = (matchData.match_data as TournamentMatch["match_data"]).scores;

      if (participants.length === submittedScores.length) {
        // All participants have submitted scores, determine winner
        const { data: room } = await supabase.from("game_rooms").select("play_mode").eq("id", roomId).single();
        if (room.play_mode === "multiplayer")
          await this.determineMatchWinner(matchId, submittedScores);
      }
      logger.info(`Score submitted: ${score} for match ${matchId}`);
    } catch (error) {
      logger.error("Error submitting score:", error);
      logger.trace("Error trace:", (error as Error).stack)
      throw error;
    }
  }

  // Determine winner of a highscore match
  private async determineMatchWinner(matchId: string, scores: Record<string, number>): Promise<void> {
    try {
      // Find the participant with the highest score
      let winnerId: string | null = null;
      let highestScore = -1;

      for (const [userId, score] of Object.entries(scores)) {
        if (score > highestScore) {
          highestScore = score;
          winnerId = userId;
        }
      }
      const loserId = Object.keys(scores).find((userId) => userId !== winnerId);

      if (!winnerId) throw new Error("No winner determined");

      // Complete the match
      await this.completeMatch(matchId, winnerId, loserId, scores);

      logger.info(`Highscore match ${matchId} completed. Winner: ${winnerId} with score: ${highestScore}`);
    } catch (error) {
      logger.error("Error determining highscore match winner:", error);
      throw error;
    }
  }

  // Advance winner to next round
  private async advanceWinnerToNextRound(match: TournamentMatch): Promise<void> {
    try {
      const nextRound = match.round_number + 1;

      // Check if there's a next round
      const { data: nextRoundMatches, error: nextRoundError } = await supabase
        .from("tournament_matches")
        .select("*")
        .eq("room_id", match.room_id)
        .eq("round_number", nextRound)
        .order("match_number", { ascending: true });

      if (nextRoundError) throw nextRoundError;

      if (nextRoundMatches && nextRoundMatches.length > 0) {
        // Find the next available match slot
        const availableMatch = nextRoundMatches.find(m =>
          m.player1_id === null || m.player2_id === null ||
          m.player3_id === null || m.player4_id === null
        );

        if (availableMatch) {
          // Add winner to the next match
          const updates: any = {};
          if (availableMatch.player1_id === null) {
            updates.player1_id = match.winner_id;
          } else if (availableMatch.player2_id === null) {
            updates.player2_id = match.winner_id;
          } else if (availableMatch.player3_id === null) {
            updates.player3_id = match.winner_id;
          } else if (availableMatch.player4_id === null) {
            updates.player4_id = match.winner_id;
          }

          // Check if match should start based on player count
          const playersPerMatch = (availableMatch.match_data as TournamentMatch["match_data"])?.players_per_match;
          const currentPlayerCount = [
            availableMatch.player1_id,
            availableMatch.player2_id,
            availableMatch.player3_id,
            availableMatch.player4_id
          ].filter(Boolean).length;

          // If we're adding a player and it will complete the match, start it
          if (currentPlayerCount + 1 === playersPerMatch) {
            updates.status = "active";
          }


          const { error: updateError } = await supabase
            .from("tournament_matches")
            .update(updates)
            .eq("id", availableMatch.id);

          if (updateError) throw updateError;
        }
      }
    } catch (error) {
      logger.error("Error advancing winner to next round:", error);
      throw error;
    }
  }

  // Stop tournament timing system
  async stopTournamentTiming(roomId: string): Promise<void> {
    try {
      await tournamentTimingService.stopTournamentTiming(roomId);
      logger.success(`Tournament timing stopped for room ${roomId}`);
    } catch (error) {
      logger.error("Error stopping tournament timing:", error);
      throw error;
    }
  }

}

export const tournamentService = new TournamentService();