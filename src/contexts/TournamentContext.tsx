import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/utils/logger";
import { tournamentService } from "@/services/tournamentService";
import type {
  TournamentMatch,
  TournamentBracket,
  TournamentParticipant,
  TournamentStats,
  CreateTournamentData,
  TournamentContextType,
} from "@/types/tournament";
import type { GameRoom } from "@/types/gameroom";
import { TournamentContext } from "@/hooks/tournament";

export const TournamentProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [currentTournament, setCurrentTournament] =
    useState<TournamentBracket | null>(null);
  const [tournamentParticipants, setTournamentParticipants] = useState<
    TournamentParticipant[]
  >([]);
  const [tournamentStats, setTournamentStats] =
    useState<TournamentStats | null>(null);
  const [activeMatch, setActiveMatch] = useState<TournamentMatch | null>(null);
  const [tournamentRoom, setTournamentRoom] = useState<GameRoom | null>(null);

  const [loading, setLoading] = useState(false);
  const [starting, setStarting] = useState(false);
  const [completing, setCompleting] = useState(false);

  const [subscription, setSubscription] = useState<any>(null);

  // Get minimum participants for elimination type
  const getMinimumParticipants = useCallback(
    (eliminationType: string): number => {
      switch (eliminationType) {
        case "single":
          return 2;
        case "double":
          return 4;
        case "swiss":
          return 4;
        default:
          return 2;
      }
    },
    []
  );

  // Fetch tournament data
  const fetchTournamentData = useCallback(
    async (roomId: string): Promise<void> => {
      // setLoading(true);
      try {
        logger.info("Fetching tournament data for room:", roomId);

        // Fetch tournament bracket
        const bracket = await tournamentService.getTournamentBracket(roomId);
        logger.info("Tournament bracket:", bracket);
        setCurrentTournament(bracket);

        // Fetch participants
        const participants = await tournamentService.getTournamentParticipants(
          roomId
        );
        logger.info("Tournament participants:", participants);
        setTournamentParticipants(participants);

        // Fetch tournament stats
        const stats = await tournamentService.getTournamentStats(roomId);
        logger.info("Tournament stats:", stats);
        setTournamentStats(stats);

        // Find active match
        const activeMatches = bracket.rounds
          .flatMap((round) => round.matches)
          .filter((match) => match.status === "active");

        if (activeMatches.length > 0) {
          logger.info("Active match:", activeMatches[0]);
          setActiveMatch(activeMatches[0]);
        } else {
          logger.info("No active match");
          setActiveMatch(null);
        }

        // Fetch room data
        const { data: room, error: roomError } = await supabase
          .from("game_rooms")
          .select("*")
          .eq("id", roomId)
          .single();

        if (roomError) throw roomError;
        logger.info("Tournament room:", room);
        setTournamentRoom(room);

        logger.info("Tournament data fetched successfully");
      } catch (error) {
        logger.error("Error fetching tournament data:", error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [] // No dependencies needed since it only uses external services
  );

  // Validate if tournament can start
  const validateTournamentStart = useCallback(
    async (roomId: string): Promise<{ canStart: boolean; reason?: string }> => {
      try {
        // Get room data
        const { data: room, error: roomError } = await supabase
          .from("game_rooms")
          .select("*")
          .eq("id", roomId)
          .single();

        if (roomError) throw roomError;

        // Get participants
        const { data: participants, error: participantsError } = await supabase
          .from("game_room_participants")
          .select("*")
          .eq("room_id", roomId)
          .eq("is_active", true);

        if (participantsError) throw participantsError;

        const participantCount = participants?.length || 0;
        const minParticipants = getMinimumParticipants(
          room.elimination_type || "single"
        );

        if (participantCount < minParticipants) {
          logger.error(
            `Minimum ${minParticipants} participants required for ${room.elimination_type} tournament. Current: ${participantCount}`
          );
          return {
            canStart: false,
            reason: `Minimum ${minParticipants} participants required for ${room.elimination_type} tournament. Current: ${participantCount}`,
          };
        }

        // Check if tournament matches exist
        // const matches = await tournamentService.getTournamentMatches(roomId);
        // if (matches.length === 0) {
        //   logger.error("Tournament matches not created yet");
        //   return {
        //     canStart: false,
        //     reason: "Tournament matches not created yet",
        //   };
        // }

        return { canStart: true };
      } catch (error) {
        logger.error("Error validating tournament start:", error);
        return {
          canStart: false,
          reason: "Error validating tournament start",
        };
      }
    },
    [getMinimumParticipants]
  );

  // Complete a tournament
  const completeTournament = useCallback(
    async (roomId: string): Promise<void> => {
      setCompleting(true);
      try {
        logger.info("Completing tournament for room:", roomId);

        // Get tournament winner
        const bracket = await tournamentService.getTournamentBracket(roomId);
        const winner = bracket.winner;

        if (!winner) {
          throw new Error("No winner found for tournament");
        }

        // Update room status to completed
        const { error: roomError } = await supabase
          .from("game_rooms")
          .update({
            status: "completed",
            actual_end_time: new Date().toISOString(),
          })
          .eq("id", roomId);

        if (roomError) throw roomError;

        // Trigger prize distribution (this will be handled by the existing prize distribution system)
        logger.info("Tournament completed successfully");

        // Clear tournament state
        setCurrentTournament(null);
        setTournamentParticipants([]);
        setTournamentStats(null);
        setActiveMatch(null);
        setTournamentRoom(null);
      } catch (error) {
        logger.error("Error completing tournament:", error);
        throw error;
      } finally {
        setCompleting(false);
      }
    },
    []
  );

  // Create tournament matches for a room
  const createTournament = useCallback(
    async (data: CreateTournamentData): Promise<void> => {
      setLoading(true);
      try {
        logger.info("Creating tournament matches:", data);

        const matches = await tournamentService.createTournamentMatches(data);

        if (matches.length > 0) {
          logger.info(`Created ${matches.length} tournament matches`);

          // Fetch the updated tournament data
          await fetchTournamentData(data.roomId);
        }
      } catch (error) {
        logger.error("Error creating tournament:", error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [fetchTournamentData]
  );
  // Start a tournament
  const startTournament = useCallback(
    async (roomId: string): Promise<void> => {
      setStarting(true);
      try {
        logger.info("Starting tournament for room:", roomId);

        // Validate tournament can start
        const validation = await validateTournamentStart(roomId);
        if (!validation.canStart) {
          throw new Error(validation.reason || "Tournament cannot start");
        }
        // check if tournament matches exist
        const existingMatches = await tournamentService.getTournamentMatches(
          roomId
        );
        if (existingMatches.length === 0) {
          await createTournament({
            roomId,
            eliminationType: tournamentRoom?.elimination_type || "single",
            maxRounds: tournamentRoom?.max_rounds || 1,
            playersPerMatch: tournamentRoom?.players_per_match || 2,
            roundDurationMinutes: tournamentRoom?.round_duration_minutes || 2,
            timeLimitMinutes: tournamentRoom?.time_limit_minutes || 1,
          });
        }

        // Start the first round of matches
        const matches = await tournamentService.getTournamentMatches(roomId);
        const firstRoundMatches = matches.filter((m) => m.round_number === 1);

        for (const match of firstRoundMatches) {
          await tournamentService.startMatch(match.id);
        }

        // Update room status to ongoing
        const { error: roomError } = await supabase
          .from("game_rooms")
          .update({
            status: "ongoing",
            tournament_started_at: new Date().toISOString(),
            current_round: 1,
          })
          .eq("id", roomId);

        if (roomError) throw roomError;

        // Fetch updated tournament data
        await fetchTournamentData(roomId);

        logger.info("Tournament started successfully");
      } catch (error) {
        logger.error("Error starting tournament:", error);
        throw error;
      } finally {
        setStarting(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [validateTournamentStart, fetchTournamentData]
  );

  // Complete a tournament match
  const completeMatch = useCallback(
    async (
      matchId: string,
      winnerId: string,
      scores?: Record<string, number>
    ): Promise<void> => {
      setCompleting(true);
      try {
        logger.info("Completing match:", { matchId, winnerId, scores });

        await tournamentService.completeMatch(matchId, winnerId, scores);

        // Check if tournament is complete
        const match = await tournamentService.getMatchById(matchId);
        if (match) {
          await fetchTournamentData(match.room_id);

          // Check if tournament is complete
          const bracket = await tournamentService.getTournamentBracket(
            match.room_id
          );
          if (bracket.isComplete) {
            await completeTournament(match.room_id);
          }
        }

        logger.info("Match completed successfully");
      } catch (error) {
        logger.error("Error completing match:", error);
        throw error;
      } finally {
        setCompleting(false);
      }
    },
    [fetchTournamentData, completeTournament]
  );

  // Submit score for highscore tournaments (match-based)
  const submitScore = useCallback(
    async (roomId: string, matchId: string, score: number): Promise<void> => {
      try {
        logger.info("Submitting score:", { roomId, matchId, score });

        await tournamentService.submitScore(roomId, matchId, score);

        // Fetch updated tournament data
        await fetchTournamentData(roomId);

        logger.info("Score submitted successfully");
      } catch (error) {
        logger.error("Error submitting score:", error);
        throw error;
      }
    },
    [fetchTournamentData]
  );

  // Subscribe to tournament updates
  const subscribeToTournamentUpdates = useCallback(
    (roomId: string): void => {
      if (subscription) {
        subscription.unsubscribe();
      }

      const newSubscription = supabase
        .channel(`tournament-${roomId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "tournament_matches",
            filter: `room_id=eq.${roomId}`,
          },
          async () => {
            logger.info("Tournament match updated, refetching data");
            await fetchTournamentData(roomId);
          }
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "game_room_participants",
            filter: `room_id=eq.${roomId}`,
          },
          async () => {
            logger.info("Tournament participants updated, refetching data");
            await fetchTournamentData(roomId);
          }
        )
        .subscribe();

      setSubscription(newSubscription);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [subscription] // Remove fetchTournamentData to prevent circular dependency
  );

  // Unsubscribe from tournament updates
  const unsubscribeFromTournamentUpdates = useCallback((): void => {
    if (subscription) {
      subscription.unsubscribe();
      setSubscription(null);
    }
  }, [subscription]);

  // Cleanup subscription on unmount
  useEffect(() => {
    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [subscription]);

  const value: TournamentContextType = {
    // Tournament state
    currentTournament,
    tournamentParticipants,
    tournamentStats,
    activeMatch,
    tournamentRoom,

    // Loading states
    loading,
    starting,
    completing,

    // Tournament actions
    createTournament,
    startTournament,
    completeMatch,
    submitScore,
    completeTournament,

    // Tournament data fetching
    fetchTournamentData,
    subscribeToTournamentUpdates,
    unsubscribeFromTournamentUpdates,

    // Validation
    validateTournamentStart,
    getMinimumParticipants,
  };

  return (
    <TournamentContext.Provider value={value}>
      {children}
    </TournamentContext.Provider>
  );
};
