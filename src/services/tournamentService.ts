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
import { notificationService } from "./notificationService";

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
      let totalRounds = this.calculateTotalRounds(participants.length, data.eliminationType);

      // For round robin, use the maxRounds from the data if provided
      if (data.eliminationType === "round_robin" && data.maxRounds) {
        totalRounds = data.maxRounds;
      }

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

      // checks if there is a match where there is a bye and advance handleBye on the match
      const { data: matchesToAdvance, error: matchesToAdvanceError } = await supabase
        .from("tournament_matches")
        .select("*")
        .eq("room_id", data.roomId)
        .eq("status", "pending")
        .eq("player1_id", null)
        .eq("player2_id", null);

      if (matchesToAdvanceError) throw matchesToAdvanceError;
      if (!matchesToAdvance) return;
      for (const match of matchesToAdvance) {
        await this.advanceWinnerToNextRound(match as TournamentMatch, data.roomId);
      }

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
        matches_played: participant.tournament_matches_played || 0,
        matches_won: participant.tournament_wins || 0,
        tournament_points: participant.tournament_points || 0,
        tournament_wins: participant.tournament_wins || 0,
        tournament_draws: participant.tournament_draws || 0,
        tournament_losses: participant.tournament_losses || 0,
        tournament_matches_played: participant.tournament_matches_played || 0,
        tournament_goals_for: participant.tournament_goals_for || 0,
        tournament_goals_against: participant.tournament_goals_against || 0,
        tournament_goal_difference: participant.tournament_goal_difference || 0,
        tournament_final_position: participant.tournament_final_position || null,
        tournament_performance_data: {},
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

  // Private helper methods
  private calculateTotalRounds(participantCount: number, eliminationType: string): number {
    switch (eliminationType) {
      case "single":
        return Math.ceil(Math.log2(participantCount));
      case "round_robin":
        // For round robin, we'll use the maxRounds from the room data
        // This will be set when creating the tournament
        return Math.ceil(Math.log2(participantCount)); // Fallback to log2 if maxRounds not set
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
        return this.generateSingleEliminationBracket(shuffledParticipants);
      case "round_robin":
        return this.generateRoundRobinBracket(shuffledParticipants, totalRounds);
      default:
        throw new Error(`Unsupported elimination type: ${eliminationType}`);
    }
  }

  private generateSingleEliminationBracket(
    participants: { user_id: string;[key: string]: unknown }[],
  ): { player1_id: string; player2_id: string | null; player3_id?: string | null; player4_id?: string | null; status: Status }[][] {
    const bracket: { player1_id: string; player2_id: string | null; status: Status }[][] = [];
    const currentRound = participants;
    const numOfPlayers = participants.length;
    const nearestPowerOfTwo = Math.pow(2, Math.ceil(Math.log2(numOfPlayers)));
    // Calculate total rounds needed for a full bracket
    const totalRounds = Math.log2(nearestPowerOfTwo);
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

  private generateRoundRobinBracket(
    participants: { user_id: string;[key: string]: unknown }[],
    totalRounds: number
  ): {
    player1_id: string;
    player2_id: string | null;
    status: Status;
  }[][] {
    const bracket: {
      player1_id: string;
      player2_id: string | null;
      status: Status;
    }[][] = [];

    const players = [...participants];
    const numPlayers = players.length;

    // If odd number of players, add a dummy "bye"
    if (numPlayers % 2 !== 0) {
      players.push({ user_id: "BYE" });
    }

    const n = players.length;

    // Generate round-robin schedule (circle method)
    const fixed = players[0];
    const rotating = players.slice(1);

    for (let repeat = 0; repeat < totalRounds; repeat++) {
      for (let round = 0; round < n - 1; round++) {
        const roundMatches: {
          player1_id: string;
          player2_id: string | null;
          status: Status;
        }[] = [];

        const pairings = [fixed, ...rotating];
        for (let i = 0; i < n / 2; i++) {
          const p1 = pairings[i];
          const p2 = pairings[n - 1 - i];

          if (p1.user_id !== "BYE" && p2.user_id !== "BYE") {
            roundMatches.push({
              player1_id: p1.user_id,
              player2_id: p2.user_id,
              status: "pending",
            });
          } else {
            // Bye round
            const realPlayer = p1.user_id === "BYE" ? p2 : p1;
            roundMatches.push({
              player1_id: realPlayer.user_id,
              player2_id: null,
              status: "pending",
            });
          }
        }

        bracket.push(roundMatches);

        // Rotate players for next round
        rotating.unshift(rotating.pop()!);
      }
    }

    return bracket;
  }

  /**
   * Handles the bye situation for a match
   * @param match - The match to handle
   * @returns 
   */
  private handleBye(match: TournamentMatch): string | null {
    if (match.status === "completed") {
      return match.winner_id;
    }
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

    if (!["single", "round_robin"].includes(data.eliminationType)) {
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
    if (eliminationType !== "round_robin" && count % 2 !== 0) {
      throw new Error(`${eliminationType} elimination requires an even number of players`);
    }

    // Specific validation for different tournament types
    switch (eliminationType) {
      case "single":
        if (count < 2) {
          throw new Error("Single elimination requires at least 2 players");
        }
        break;
      case "round_robin":
        if (count < 2) {
          throw new Error("Round robin system requires at least 2 players");
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
      case "round_robin":
        return {
          min: 2,
          max: 20,
          recommended: [4, 6, 8, 10, 12],
        };
      default:
        return {
          min: 2,
          max: 64,
          recommended: [2, 4, 8, 16],
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

  /**
   *  
   * @param roomId - The ID of the room
   * @param matchId - The ID of the match
   * @param score - The score to submit
   * @returns void
   * */
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
        const { data: room } = await supabase.from("game_rooms").select("name").eq("id", roomId).single();
        await this.determineMatchWinner(matchId, submittedScores, room.name);
      }
      logger.info(`Score submitted: ${score} for match ${matchId}`);
    } catch (error) {
      logger.error("Error submitting score:", error);
      logger.trace("Error trace:", (error as Error).stack)
      throw error;
    }
  }

  /**
   * Submits scores for the participants in the match and advance the match 
   * @param roomId - The ID of the room
   * @param matchId - The ID of the match
   * @param scores - The scores of the participants
   * @returns void
   */
  async submitMultiplayerScore(roomId: string, matchId: string, scores: Record<string, number>): Promise<void> {
    try {
      const match = await this.getMatchById(matchId);
      if (!match) throw new Error("Match not found");
      if (match.room_id !== roomId) throw new Error("Match does not belong to this room");
      const { data: room, error: roomError } = await supabase.from("game_rooms").select("name").eq("id", roomId).single();
      if (roomError) throw roomError;
      await this.determineMatchWinner(matchId, scores, room.name);
      logger.success(`Multiplayer score submitted: ${scores} for match ${matchId}`);
    } catch (error) {
      logger.error("Error submitting multiplayer score:", error);
      throw error;
    }

  }

  /**
   * Determine winner of a highscore match
   * @param matchId - The ID of the match
   * @param scores - The scores of the participants
   * @param roomName - The name of the room
   * @returns void
   */
  private async determineMatchWinner(matchId: string, scores: Record<string, number>, roomName: string): Promise<void> {
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


      if (!winnerId) throw new Error("No winner determined");

      // Complete the match
      await this.completeMatch(matchId, winnerId, roomName, scores);

      logger.info(`Highscore match ${matchId} completed. Winner: ${winnerId} with score: ${highestScore}`);
    } catch (error) {
      logger.error("Error determining highscore match winner:", error);
      throw error;
    }
  }

  // Complete a match
  async completeMatch(matchId: string, winnerId: string, roomName: string, scores?: Record<string, number>): Promise<TournamentMatch> {
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
        .select("tournament_rounds, elimination_type, current_round, status, name")
        .eq("id", match.room_id)
        .single();

      if (roomError) throw roomError;
      if (room.elimination_type === "single") await this.advanceWinnerToNextRound(match as TournamentMatch, room.name);
      else this.updateRoundRobinStandings(match as TournamentMatch, room.name)
      await this.checkRoundCompletion(match.room_id, room.current_round);
      return match as TournamentMatch;
    } catch (error) {
      logger.error("Error completing match:", error);
      throw error;
    }
  }

  // Advance winner to next round
  private async advanceWinnerToNextRound(match: TournamentMatch, roomName: string): Promise<void> {
    try {
      const nextRound = match.round_number + 1;
      // check if match has a bye and handleBye on the match
      let winnerId = match.winner_id;
      if (!winnerId) {
        winnerId = this.handleBye(match);
      }
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
            updates.player1_id = winnerId;
          } else if (availableMatch.player2_id === null) {
            updates.player2_id = winnerId;
          } else if (availableMatch.player3_id === null) {
            updates.player3_id = winnerId;
          } else if (availableMatch.player4_id === null) {
            updates.player4_id = winnerId;
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

          if (winnerId) {
            await notificationService.createNotification(
              match.winner_id,
              "tournament_advance", { tournament_name: roomName, next_round: `Round ${match.round_number + 1}` },
              {
                sendEmail: true, priority: "high"
              }
            );
          }

          // Notify eliminated players
          const eliminatedPlayerIds = [
            match.player1_id,
            match.player2_id,
            match.player3_id,
            match.player4_id,
          ].filter((id) => id && id !== winnerId);

          await notificationService.createBulkNotifications(eliminatedPlayerIds, "tournament_elimination", {
            tournament_name: roomName,
            final_rank: 0
          }, { sendEmail: true, priority: "medium" })
        }
      }
    } catch (error) {
      logger.error("Error advancing winner to next round:", error);
      throw error;
    }
  }

  private async updateRoundRobinStandings(match: TournamentMatch, roomName: string): Promise<void> {
    try {
      const scores = match.match_data?.scores || {};
      const roomId = match.room_id;

      // Get all participants in this room
      const { data: participants, error: participantsError } = await supabase
        .from("game_room_participants")
        .select("*")
        .eq("room_id", roomId)
        .eq("is_active", true);

      if (participantsError) throw participantsError;
      if (!participants) return;

      // Get match participants
      const matchParticipants = [
        match.player1_id,
        match.player2_id,
        match.player3_id,
        match.player4_id
      ].filter(Boolean);

      // Update each participant's tournament stats
      for (const participantId of matchParticipants) {
        const participant = participants.find(p => p.user_id === participantId);
        if (!participant) continue;

        const playerScore = scores[participantId];
        const currentStats = {
          tournament_matches_played: participant.tournament_matches_played,
          tournament_wins: participant.tournament_wins,
          tournament_draws: participant.tournament_draws,
          tournament_losses: participant.tournament_losses,
          tournament_points: participant.tournament_points,
          tournament_goals_for: participant.tournament_goals_for,
          tournament_goals_against: participant.tournament_goals_against,
          tournament_goal_difference: participant.tournament_goal_difference,
        };

        // Determine match result for this player
        const isWinner = match.winner_id === participantId;
        const isDraw = match.winner_id === null; // Assuming null winner means draw

        // Update stats based on match result
        const updatedStats = {
          tournament_matches_played: currentStats.tournament_matches_played + 1,
          tournament_goals_for: currentStats.tournament_goals_for + playerScore,
          tournament_goals_against: currentStats.tournament_goals_against + this.calculateGoalsAgainst(participantId, matchParticipants, scores),
          tournament_wins: currentStats.tournament_wins,
          tournament_draws: currentStats.tournament_draws,
          tournament_losses: currentStats.tournament_losses,
          tournament_points: currentStats.tournament_points,
          tournament_goal_difference: 0, // Will be calculated below
        };

        if (isDraw) {
          updatedStats.tournament_draws = currentStats.tournament_draws + 1;
          updatedStats.tournament_points = currentStats.tournament_points + 1; // 1 point for draw
        } else if (isWinner) {
          updatedStats.tournament_wins = currentStats.tournament_wins + 1;
          updatedStats.tournament_points = currentStats.tournament_points + 2; // 2 points for win
        } else {
          updatedStats.tournament_losses = currentStats.tournament_losses + 1;
          // 0 points for loss (no change)
        }

        // Calculate goal difference
        updatedStats.tournament_goal_difference = updatedStats.tournament_goals_for - updatedStats.tournament_goals_against;

        // Update participant in database
        const { data: updatedParticipant, error: updateError } = await supabase
          .from("game_room_participants")
          .update(updatedStats)
          .eq("id", participant.id);

        if (updateError) {
          logger.error(`Error updating participant ${participantId} stats:`, updateError);
          throw updateError;
        }

        logger.debug(`Updated tournament stats for participant ${participantId}:`, updatedStats);
      }

      // Update final standings/positions after all participants are updated
      await this.updateTournamentPositions(roomId);

      logger.success(`Updated round robin standings for room ${roomId}`);
    } catch (error) {
      logger.error("Error updating round robin standings:", error);
      throw error;
    }
  }

  // Helper method to calculate goals against for a player
  private calculateGoalsAgainst(playerId: string, matchParticipants: string[], scores: Record<string, number>): number {
    let goalsAgainst = 0;

    for (const opponentId of matchParticipants) {
      if (opponentId !== playerId) {
        goalsAgainst += scores[opponentId] || 0;
      }
    }

    return goalsAgainst;
  }

  // Update tournament positions based on current standings
  private async updateTournamentPositions(roomId: string): Promise<void> {
    try {
      // Get all participants with their updated stats
      const { data: participants, error: participantsError } = await supabase
        .from("game_room_participants")
        .select("*")
        .eq("room_id", roomId)
        .eq("is_active", true);

      if (participantsError) throw participantsError;
      if (!participants) return;

      // Sort participants by tournament points (descending), then goal difference (descending), then goals for (descending)
      const sortedParticipants = participants.sort((a, b) => {
        // Primary sort: tournament points
        if ((b.tournament_points || 0) !== (a.tournament_points || 0)) {
          return (b.tournament_points || 0) - (a.tournament_points || 0);
        }

        // Secondary sort: goal difference
        if ((b.tournament_goal_difference || 0) !== (a.tournament_goal_difference || 0)) {
          return (b.tournament_goal_difference || 0) - (a.tournament_goal_difference || 0);
        }

        // Tertiary sort: goals for
        return (b.tournament_goals_for || 0) - (a.tournament_goals_for || 0);
      });

      // Update positions
      for (let i = 0; i < sortedParticipants.length; i++) {
        const participant = sortedParticipants[i];
        const position = i + 1;

        const { error: updateError } = await supabase
          .from("game_room_participants")
          .update({
            tournament_final_position: position,
            tournament_seed: position, // Use position as seed for round robin
          })
          .eq("id", participant.id);

        if (updateError) {
          logger.error(`Error updating position for participant ${participant.user_id}:`, updateError);
          throw updateError;
        }
      }

      logger.debug(`Updated tournament positions for room ${roomId}`);
    } catch (error) {
      logger.error("Error updating tournament positions:", error);
      throw error;
    }
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

  // Advance to next round
  async advanceToNextRound(roomId: string): Promise<void> {
    try {
      const { data: room, error: roomError } = await supabase
        .from("game_rooms")
        .select("current_round, tournament_rounds, elimination_type")
        .eq("id", roomId)
        .single();

      if (roomError) throw roomError;

      const nextRound = (room.current_round || 1) + 1;

      if (nextRound > (room.tournament_rounds || 0)) {
        // Tournament complete
        await this.completeTournament(roomId)
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

  private async startNextRoundMatches(roomId: string, roundNumber: number): Promise<void> {
    try {
      // First, populate the next round matches with winners from previous round
      await this.setAllNextRoundMatchesToActive(roomId, roundNumber);

      // Then set the status to active to start the round
      const { error } = await supabase
        .from("tournament_matches")
        .update({ status: "active" })
        .eq("room_id", roomId)
        .eq("round_number", roundNumber);

      if (error) throw error;
    } catch (error) {
      logger.error("Error starting next round matches:", error);
      throw error;
    }
  }

  private async setAllNextRoundMatchesToActive(roomId: string, roundNumber: number): Promise<void> {
    try {
      const { data: matchesToUpdate, error: matchesToUpdateError } = await supabase
        .from("tournament_matches")
        .select("*")
        .eq("room_id", roomId)
        .eq("round_number", roundNumber)
        .eq("status", "pending");

      if (matchesToUpdateError) throw matchesToUpdateError;
      if (!matchesToUpdate) return;
      for (const match of matchesToUpdate) {
        await supabase
          .from("tournament_matches")
          .update({ status: "active" })
          .eq("id", match.id);
      }

    } catch (error) {
      logger.error("Error populating next round matches:", error);
      throw error;
    }
  }

  async completeTournament(roomId: string): Promise<void> {
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

      // For round robin tournaments, determine top performers based on standings
      let rank1 = null;
      let rank2 = null;
      const scores: Record<string, number> = {};

      if (room.elimination_type === "round_robin") {
        // Sort participants by tournament points to get top performers
        const sortedParticipants = participants.sort((a, b) => {
          const pointsA = a.tournament_points || 0;
          const pointsB = b.tournament_points || 0;
          if (pointsB !== pointsA) return pointsB - pointsA;

          const goalDiffA = a.tournament_goal_difference || 0;
          const goalDiffB = b.tournament_goal_difference || 0;
          if (goalDiffB !== goalDiffA) return goalDiffB - goalDiffA;

          return (b.tournament_goals_for || 0) - (a.tournament_goals_for || 0);
        });

        rank1 = sortedParticipants[0]?.user_id;
        scores[rank1] = sortedParticipants[0]?.tournament_points;
        rank2 = sortedParticipants[1]?.user_id;
        scores[rank2] = sortedParticipants[1]?.tournament_points;
      } else if (room.elimination_type === "single") {
        // get last tournament match
        const { data: lastMatch, error: lastMatchError } = await supabase
          .from("tournament_matches")
          .select("*")
          .eq("room_id", roomId)
          .order("updated_at", { ascending: false })
          .limit(1)
          .single();

        if (lastMatchError) throw lastMatchError;
        rank1 = lastMatch.winner_id;
        const matchData = lastMatch.match_data as TournamentMatch["match_data"];
        // sort the scores by descending order
        const sortedScores = Object.keys(matchData.scores).sort((a, b) => matchData.scores[b] - matchData.scores[a]);
        rank2 = sortedScores[1];
        scores[rank1] = matchData.scores[rank1];
        scores[rank2] = matchData.scores[rank2];
      }

      const winners = await this.determineTournamentWinner(participants, room, rank1, rank2, scores);
      await this.submitWinnersToSmartContractAndDistributePrizes(winners, room as GameRoom);
      const participantIds = participants.map(p => p.user_id).filter(Boolean);
      try {
        await notificationService.createBulkNotifications(participantIds, "room_completed", {
          room_id: roomId,
          room_name: room.name
        }, {
          sendEmail: true,
          priority: "high"
        })
      } catch (error) {
        logger.error("Error sending room completion notification", error)
      }
    } catch (error) {
      logger.error("Error completing tournament:", error);
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