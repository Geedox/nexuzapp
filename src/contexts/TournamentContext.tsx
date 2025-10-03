import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/utils/logger";
import { tournamentService } from "@/services/tournamentService";
import { useNotification } from "@/hooks/useNotification";
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
import { RealtimeChannel } from "@supabase/supabase-js";

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

  // const [subscription, setSubscription] = useState<any>(null);

  // Get notification functions
  const {
    notifyTournamentAdvance,
    notifyTournamentElimination,
    notifyRoomStarted,
    notifyRoomCompleted,
  } = useNotification();

  // Get minimum participants for elimination type
  const getMinimumParticipants = useCallback(
    (eliminationType: string): number => {
      switch (eliminationType) {
        case "single":
          return 2;
        case "round_robin":
          return 2;
        default:
          return 2;
      }
    },
    []
  );

  // Fetch tournament data
  const fetchTournamentData = useCallback(
    async (roomId: string, silent: boolean = false): Promise<void> => {
      setLoading(!silent);
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

        // Send tournament completion notification to all participants
        try {
          const { data: participants } = await supabase
            .from("game_room_participants")
            .select("user_id")
            .eq("room_id", roomId)
            .eq("is_active", true);

          if (participants && tournamentRoom) {
            const participantIds = participants
              .map((p) => p.user_id)
              .filter(Boolean) as string[];

            await notifyRoomCompleted(
              roomId,
              tournamentRoom.name,
              participantIds
            );
          }
        } catch (notificationError) {
          logger.error(
            "Error sending tournament completion notifications:",
            notificationError
          );
          // Don't throw error to prevent breaking tournament completion
        }

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
    [notifyRoomCompleted, tournamentRoom]
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
          await fetchTournamentData(data.roomId, false);
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
          // Get current participants to calculate rounds
          const { data: participants, error: participantsError } =
            await supabase
              .from("game_room_participants")
              .select("*")
              .eq("room_id", roomId)
              .eq("is_active", true);

          if (participantsError) throw participantsError;

          const participantCount = participants?.length || 0;
          const eliminationType = tournamentRoom?.elimination_type || "single";

          // Calculate rounds automatically based on participant count
          const calculatedRounds = Math.ceil(Math.log2(participantCount));

          await createTournament({
            roomId,
            eliminationType,
            maxRounds: calculatedRounds,
            playersPerMatch: tournamentRoom?.players_per_match || 2,
            roundDurationMinutes: 60, // Default 60 minutes per round
            timeLimitMinutes: 30, // Default 30 minutes per match
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
        await fetchTournamentData(roomId, false);

        // Send tournament start notification to all participants
        try {
          const { data: participants } = await supabase
            .from("game_room_participants")
            .select("user_id")
            .eq("room_id", roomId)
            .eq("is_active", true);

          if (participants && tournamentRoom) {
            const participantIds = participants
              .map((p) => p.user_id)
              .filter(Boolean) as string[];

            await notifyRoomStarted(
              roomId,
              tournamentRoom.name,
              tournamentRoom.game_name || "Tournament",
              participantIds
            );
          }
        } catch (notificationError) {
          logger.error(
            "Error sending tournament start notification:",
            notificationError
          );
          // Don't throw error to prevent breaking tournament start
        }

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
      loserId: string,
      roomName: string,
      scores?: Record<string, number>
    ): Promise<void> => {
      setCompleting(true);
      try {
        logger.info("Completing match:", { matchId, winnerId, scores });

        await tournamentService.completeMatch(matchId, winnerId, roomName);

        // Check if tournament is complete
        const match = await tournamentService.getMatchById(matchId);
        if (match) {
          await fetchTournamentData(match.room_id, true);

          // Check if tournament is complete
          const bracket = await tournamentService.getTournamentBracket(
            match.room_id
          );
          if (bracket.isComplete) {
            await completeTournament(match.room_id);
          } else {
            try {
              // Get match details to determine advancement/elimination
              const completedMatch = await tournamentService.getMatchById(
                matchId
              );
              if (completedMatch && tournamentRoom) {
                // Notify winner of advancement
                if (winnerId) {
                  await notifyTournamentAdvance(
                    winnerId,
                    tournamentRoom.name,
                    `Round ${completedMatch.round_number + 1}`
                  );
                }

                // Notify eliminated players
                const eliminatedPlayerIds = [
                  completedMatch.player1_id,
                  completedMatch.player2_id,
                  completedMatch.player3_id,
                  completedMatch.player4_id,
                ].filter((id) => id && id !== winnerId);

                for (const eliminatedId of eliminatedPlayerIds) {
                  if (eliminatedId) {
                    await notifyTournamentElimination(
                      eliminatedId,
                      tournamentRoom.name,
                      completedMatch.round_number
                    );
                  }
                }
              }
            } catch (notificationError) {
              logger.error(
                "Error sending match completion notifications:",
                notificationError
              );
              // Don't throw error to prevent breaking match completion
            }
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
    [
      fetchTournamentData,
      completeTournament,
      tournamentRoom,
      notifyTournamentAdvance,
      notifyTournamentElimination,
    ]
  );

  // Submit score for highscore tournaments (match-based)
  const submitScore = useCallback(
    async (roomId: string, matchId: string, score: number): Promise<void> => {
      try {
        logger.info("Submitting score:", { roomId, matchId, score });

        await tournamentService.submitScore(roomId, matchId, score);

        // Fetch updated tournament data
        await fetchTournamentData(roomId, true);

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
    (roomId: string): RealtimeChannel => {
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
            await fetchTournamentData(roomId, true);
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
            await fetchTournamentData(roomId, true);
          }
        )
        .subscribe();
      return newSubscription;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [] // Remove fetchTournamentData to prevent circular dependency
  );

  // Unsubscribe from tournament updates
  const unsubscribeFromTournamentUpdates = useCallback(
    (subscription: RealtimeChannel): void => {
      if (subscription) {
        subscription.unsubscribe();
      }
    },
    []
  );

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
