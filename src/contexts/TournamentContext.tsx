import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  tournamentService,
  TournamentMatch,
  TournamentBracket,
  TournamentParticipant,
  TournamentStats,
  CreateTournamentData,
} from "@/services/tournamentService";
import { logger } from "@/utils/logger";
import { supabase } from "@/integrations/supabase/client";

interface TournamentContextType {
  // Tournament state
  currentTournament: TournamentBracket | null;
  participants: TournamentParticipant[];
  stats: TournamentStats | null;
  loading: boolean;
  error: string | null;

  // Tournament actions
  createTournament: (data: CreateTournamentData) => Promise<void>;
  startTournament: (roomId: string) => Promise<void>;
  startMatch: (matchId: string) => Promise<void>;
  completeMatch: (
    matchId: string,
    winnerId: string,
    matchData?: Record<string, unknown>
  ) => Promise<void>;
  timeoutMatch: (matchId: string) => Promise<void>;
  refreshTournament: (roomId: string) => Promise<void>;

  // Tournament queries
  getTournamentBracket: (roomId: string) => Promise<TournamentBracket | null>;
  getTournamentParticipants: (
    roomId: string
  ) => Promise<TournamentParticipant[]>;
  getTournamentStats: (roomId: string) => Promise<TournamentStats | null>;

  // Time management
  matchTimers: Map<string, number>;
  startMatchTimer: (matchId: string, durationMinutes: number) => void;
  stopMatchTimer: (matchId: string) => void;
  getMatchTimeRemaining: (matchId: string) => number;

  // Tournament progression
  canStartTournament: (roomId: string) => Promise<boolean>;
  isTournamentReady: (roomId: string) => Promise<boolean>;
  getCurrentRoundMatches: (roomId: string) => Promise<TournamentMatch[]>;
  getMatchDetails: (matchId: string) => Promise<TournamentMatch | null>;
  updateParticipantStats: (roomId: string) => Promise<void>;

  // Real-time updates
  subscribeToTournament: (roomId: string) => void;
  unsubscribeFromTournament: (roomId: string) => void;
}

const TournamentContext = createContext<TournamentContextType | undefined>(
  undefined
);

export const useTournament = () => {
  const context = useContext(TournamentContext);
  if (context === undefined) {
    throw new Error("useTournament must be used within a TournamentProvider");
  }
  return context;
};

export const TournamentProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [currentTournament, setCurrentTournament] =
    useState<TournamentBracket | null>(null);
  const [participants, setParticipants] = useState<TournamentParticipant[]>([]);
  const [stats, setStats] = useState<TournamentStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [matchTimers, setMatchTimers] = useState<Map<string, number>>(
    new Map()
  );
  const [activeSubscriptions, setActiveSubscriptions] = useState<Set<string>>(
    new Set()
  );
  const [subscriptionChannels, setSubscriptionChannels] = useState<
    Map<string, { matches: any; room: any }>
  >(new Map());

  const { user } = useAuth();
  const { toast } = useToast();

  // Error recovery state
  const [retryCount, setRetryCount] = useState<Map<string, number>>(new Map());
  const [lastError, setLastError] = useState<string | null>(null);

  // Timer references for cleanup
  const [timerRefs, setTimerRefs] = useState<Map<string, NodeJS.Timeout>>(
    new Map()
  );

  // Cleanup subscriptions and timers on unmount
  useEffect(() => {
    return () => {
      // Unsubscribe from all active tournaments
      subscriptionChannels.forEach((channels, roomId) => {
        try {
          supabase.removeChannel(channels.matches);
          supabase.removeChannel(channels.room);
        } catch (err) {
          logger.error(
            `Error cleaning up subscription for room ${roomId}:`,
            err
          );
        }
      });

      // Clear all active timers
      timerRefs.forEach((timerRef, matchId) => {
        try {
          clearTimeout(timerRef);
          logger.info(`Cleared timer for match ${matchId}`);
        } catch (err) {
          logger.error(`Error clearing timer for match ${matchId}:`, err);
        }
      });
    };
  }, [subscriptionChannels, timerRefs]);

  // Error recovery function
  const recoverFromError = useCallback(
    async (roomId: string, operation: string) => {
      const currentRetries = retryCount.get(`${roomId}-${operation}`) || 0;
      const maxRetries = 3;

      if (currentRetries >= maxRetries) {
        logger.error(`Max retries reached for ${operation} on room ${roomId}`);
        setError(
          `Failed to ${operation} after ${maxRetries} attempts. Please refresh the page.`
        );
        return false;
      }

      setRetryCount((prev) =>
        new Map(prev).set(`${roomId}-${operation}`, currentRetries + 1)
      );

      try {
        // Wait before retry with exponential backoff
        await new Promise((resolve) =>
          setTimeout(resolve, Math.pow(2, currentRetries) * 1000)
        );

        // Attempt to refresh tournament data
        const [bracket, participantsData, statsData] = await Promise.all([
          tournamentService.getTournamentBracket(roomId),
          tournamentService.getTournamentParticipants(roomId),
          tournamentService.getTournamentStats(roomId),
        ]);

        setCurrentTournament(bracket);
        setParticipants(participantsData);
        setStats(statsData);

        // Reset retry count on success
        setRetryCount((prev) => {
          const newMap = new Map(prev);
          newMap.delete(`${roomId}-${operation}`);
          return newMap;
        });

        setError(null);
        setLastError(null);
        return true;
      } catch (err) {
        logger.error(
          `Retry ${currentRetries + 1} failed for ${operation}:`,
          err
        );
        setLastError(
          `Retry ${currentRetries + 1} failed: ${
            err instanceof Error ? err.message : "Unknown error"
          }`
        );
        return false;
      }
    },
    [retryCount]
  );

  // Refresh tournament data
  const refreshTournament = useCallback(async (roomId: string) => {
    try {
      const [bracket, participantsData, statsData] = await Promise.all([
        tournamentService.getTournamentBracket(roomId),
        tournamentService.getTournamentParticipants(roomId),
        tournamentService.getTournamentStats(roomId),
      ]);

      setCurrentTournament(bracket);
      setParticipants(participantsData);
      setStats(statsData);

      // Clear any previous errors on successful refresh
      setError(null);
      setLastError(null);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to refresh tournament data";
      logger.error("Error refreshing tournament:", err);
      setError(errorMessage);
    }
  }, []);

  // Enhanced error handler
  const handleError = useCallback(
    (err: unknown, operation: string, roomId?: string) => {
      const errorMessage =
        err instanceof Error ? err.message : `Failed to ${operation}`;
      logger.error(`Tournament error in ${operation}:`, err);

      setError(errorMessage);
      setLastError(errorMessage);

      if (roomId) {
        // Attempt automatic recovery for critical operations
        const criticalOperations = ["refresh", "startMatch", "completeMatch"];
        if (criticalOperations.includes(operation)) {
          setTimeout(() => {
            recoverFromError(roomId, operation);
          }, 1000);
        }
      }

      toast({
        title: "Tournament Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
    [recoverFromError, toast]
  );

  // Create tournament
  const createTournament = useCallback(
    async (data: CreateTournamentData) => {
      if (!user) {
        throw new Error("User not authenticated");
      }

      setLoading(true);
      setError(null);

      try {
        await tournamentService.createTournamentMatches(data);

        // Refresh tournament data
        await refreshTournament(data.roomId);

        toast({
          title: "Tournament Created",
          description: "Tournament bracket has been generated successfully",
        });
      } catch (err: unknown) {
        handleError(err, "create tournament", data.roomId);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [user, toast, refreshTournament, handleError]
  );

  // Time management functions
  const stopMatchTimer = useCallback(
    (matchId: string) => {
      // Clear the timeout if it exists
      const timerRef = timerRefs.get(matchId);
      if (timerRef) {
        clearTimeout(timerRef);
        setTimerRefs((prev) => {
          const newMap = new Map(prev);
          newMap.delete(matchId);
          return newMap;
        });
      }

      // Remove from match timers
      setMatchTimers((prev) => {
        const newMap = new Map(prev);
        newMap.delete(matchId);
        return newMap;
      });
    },
    [timerRefs]
  );

  // Timeout match function
  const timeoutMatch = useCallback(
    async (matchId: string) => {
      try {
        const match = await tournamentService.timeoutMatch(matchId);

        // Stop timer for the match
        stopMatchTimer(matchId);

        // Refresh tournament data
        if (match.room_id) {
          await refreshTournament(match.room_id);
        }

        logger.info(`Match ${matchId} timed out`);
      } catch (err: unknown) {
        logger.error("Error timing out match:", err);
        throw err;
      }
    },
    [refreshTournament, stopMatchTimer]
  );

  const startMatchTimer = useCallback(
    (matchId: string, durationMinutes: number) => {
      // Clear any existing timer for this match
      const existingTimer = timerRefs.get(matchId);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }

      const durationMs = durationMinutes * 60 * 1000;
      const endTime = Date.now() + durationMs;

      setMatchTimers((prev) => new Map(prev).set(matchId, endTime));

      // Set timeout to handle match timeout
      const timeoutRef = setTimeout(() => {
        timeoutMatch(matchId).catch((err) => {
          logger.error("Error handling match timeout:", err);
        });
        // Clean up timer reference
        setTimerRefs((prev) => {
          const newMap = new Map(prev);
          newMap.delete(matchId);
          return newMap;
        });
      }, durationMs);

      // Store timer reference for cleanup
      setTimerRefs((prev) => new Map(prev).set(matchId, timeoutRef));
    },
    [timeoutMatch, timerRefs]
  );

  const getMatchTimeRemaining = useCallback(
    (matchId: string): number => {
      const endTime = matchTimers.get(matchId);
      if (!endTime) return 0;

      const remaining = Math.max(0, endTime - Date.now());
      return Math.ceil(remaining / 1000); // Return seconds
    },
    [matchTimers]
  );

  // Tournament action implementations
  const startTournament = useCallback(
    async (roomId: string) => {
      try {
        const bracket = await tournamentService.getTournamentBracket(roomId);
        if (!bracket) {
          throw new Error("Tournament not found");
        }

        // Start first round matches
        const firstRoundMatches = bracket.rounds[0]?.matches || [];
        for (const match of firstRoundMatches) {
          await tournamentService.startMatch(match.id);
          startMatchTimer(match.id, match.time_limit_minutes || 30);
        }

        setCurrentTournament(bracket);

        toast({
          title: "Tournament Started",
          description: "First round matches have begun",
        });
      } catch (err: unknown) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to start tournament";
        setError(errorMessage);
        logger.error("Error starting tournament:", err);

        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
        throw err;
      }
    },
    [startMatchTimer, toast]
  );

  const updateParticipantStats = useCallback(
    async (roomId: string): Promise<void> => {
      try {
        // Get all matches for the room
        const matches = await tournamentService.getTournamentMatches(roomId);

        // Calculate stats for each participant
        const participantStats = new Map<
          string,
          {
            matches_played: number;
            matches_won: number;
            total_score: number;
          }
        >();

        matches.forEach((match) => {
          const players = [
            match.player1_id,
            match.player2_id,
            match.player3_id,
            match.player4_id,
          ].filter(Boolean);

          players.forEach((playerId) => {
            if (!participantStats.has(playerId!)) {
              participantStats.set(playerId!, {
                matches_played: 0,
                matches_won: 0,
                total_score: 0,
              });
            }

            const stats = participantStats.get(playerId!)!;
            stats.matches_played++;

            if (match.status === "completed" && match.winner_id === playerId) {
              stats.matches_won++;
            }
          });
        });

        // Update participant stats in database
        // Since matches_played and matches_won may not exist in schema,
        // we'll store this data in a JSON field or create a separate tournament_participants table
        for (const [playerId, stats] of participantStats) {
          // First, try to update the existing participant record
          const { error: updateError } = await supabase
            .from("game_room_participants")
            .update({
              score: stats.total_score,
            })
            .eq("user_id", playerId)
            .eq("room_id", roomId);

          if (updateError) {
            logger.error("Error updating participant stats:", updateError);
          }

          // Store extended stats in participant metadata if needed
          // Note: tournament_participants table may not exist in current schema
          logger.info(
            `Updated stats for player ${playerId}: ${stats.matches_played} played, ${stats.matches_won} won`
          );
        }

        logger.info(`Updated participant stats for room ${roomId}`);
      } catch (err: unknown) {
        logger.error("Error updating participant stats:", err);
      }
    },
    []
  );

  const startMatch = useCallback(
    async (matchId: string) => {
      try {
        const match = await tournamentService.startMatch(matchId);

        // Start timer for the match
        if (match.time_limit_minutes) {
          startMatchTimer(matchId, match.time_limit_minutes);
        }

        // Refresh tournament data
        if (match.room_id) {
          await refreshTournament(match.room_id);
        }

        logger.info(`Match ${matchId} started`);
      } catch (err: unknown) {
        handleError(err, "startMatch", undefined);
        throw err;
      }
    },
    [startMatchTimer, refreshTournament, handleError]
  );

  const completeMatch = useCallback(
    async (
      matchId: string,
      winnerId: string,
      matchData?: Record<string, unknown>
    ) => {
      try {
        const match = await tournamentService.completeMatch(
          matchId,
          winnerId,
          matchData
        );

        // Stop timer for the match
        stopMatchTimer(matchId);

        // Update participant stats
        if (match.room_id) {
          await updateParticipantStats(match.room_id);
          await refreshTournament(match.room_id);
        }

        logger.info(`Match ${matchId} completed, winner: ${winnerId}`);
      } catch (err: unknown) {
        handleError(err, "completeMatch", undefined);
        throw err;
      }
    },
    [stopMatchTimer, refreshTournament, updateParticipantStats, handleError]
  );

  const getTournamentBracket = useCallback(
    async (roomId: string): Promise<TournamentBracket | null> => {
      try {
        return await tournamentService.getTournamentBracket(roomId);
      } catch (err: unknown) {
        logger.error("Error getting tournament bracket:", err);
        return null;
      }
    },
    []
  );

  const getTournamentParticipants = useCallback(
    async (roomId: string): Promise<TournamentParticipant[]> => {
      try {
        return await tournamentService.getTournamentParticipants(roomId);
      } catch (err: unknown) {
        logger.error("Error getting tournament participants:", err);
        return [];
      }
    },
    []
  );

  const getTournamentStats = useCallback(
    async (roomId: string): Promise<TournamentStats | null> => {
      try {
        return await tournamentService.getTournamentStats(roomId);
      } catch (err: unknown) {
        logger.error("Error getting tournament stats:", err);
        return null;
      }
    },
    []
  );

  const canStartTournament = useCallback(
    async (roomId: string): Promise<boolean> => {
      try {
        const participants = await getTournamentParticipants(roomId);
        const stats = await getTournamentStats(roomId);

        // Need at least 2 participants and tournament must be ready
        return (
          participants.length >= 2 &&
          stats !== null &&
          !stats.isComplete &&
          stats.completedMatches === 0
        );
      } catch (err: unknown) {
        logger.error("Error checking if tournament can start:", err);
        return false;
      }
    },
    [getTournamentParticipants, getTournamentStats]
  );

  const isTournamentReady = useCallback(
    async (roomId: string): Promise<boolean> => {
      try {
        const bracket = await getTournamentBracket(roomId);
        return bracket !== null && bracket.rounds.length > 0;
      } catch (err: unknown) {
        logger.error("Error checking if tournament is ready:", err);
        return false;
      }
    },
    [getTournamentBracket]
  );

  const getCurrentRoundMatches = useCallback(
    async (roomId: string): Promise<TournamentMatch[]> => {
      try {
        const bracket = await getTournamentBracket(roomId);
        if (!bracket || bracket.rounds.length === 0) {
          return [];
        }

        const currentRound = bracket.rounds.find(
          (round) =>
            round.isActive ||
            (!round.isComplete && round.roundNumber === bracket.currentRound)
        );

        return currentRound ? currentRound.matches : [];
      } catch (err: unknown) {
        logger.error("Error getting current round matches:", err);
        return [];
      }
    },
    [getTournamentBracket]
  );

  const subscribeToTournament = useCallback(
    (roomId: string) => {
      if (activeSubscriptions.has(roomId)) {
        logger.warn(`Already subscribed to tournament for room ${roomId}`);
        return;
      }

      try {
        // Subscribe to tournament matches changes
        const matchesSubscription = supabase
          .channel(`tournament_matches_${roomId}`)
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "tournament_matches",
              filter: `room_id=eq.${roomId}`,
            },
            (payload) => {
              logger.info("Tournament match updated:", payload);
              // Refresh tournament data when matches change
              refreshTournament(roomId).catch((err) =>
                logger.error(
                  "Error refreshing tournament after match update:",
                  err
                )
              );
            }
          )
          .subscribe();

        // Subscribe to game room changes (for tournament status)
        const roomSubscription = supabase
          .channel(`game_rooms_${roomId}`)
          .on(
            "postgres_changes",
            {
              event: "UPDATE",
              schema: "public",
              table: "game_rooms",
              filter: `id=eq.${roomId}`,
            },
            (payload) => {
              logger.info("Game room tournament status updated:", payload);
              // Refresh tournament data when room status changes
              refreshTournament(roomId).catch((err) =>
                logger.error(
                  "Error refreshing tournament after room update:",
                  err
                )
              );
            }
          )
          .subscribe();

        // Store subscription references
        setActiveSubscriptions((prev) => new Set(prev).add(roomId));
        setSubscriptionChannels((prev) =>
          new Map(prev).set(roomId, {
            matches: matchesSubscription,
            room: roomSubscription,
          })
        );

        logger.info(`Subscribed to tournament updates for room ${roomId}`);
      } catch (err: unknown) {
        logger.error("Error subscribing to tournament:", err);
      }
    },
    [activeSubscriptions, refreshTournament]
  );

  const unsubscribeFromTournament = useCallback(
    (roomId: string) => {
      if (!activeSubscriptions.has(roomId)) {
        logger.warn(`Not subscribed to tournament for room ${roomId}`);
        return;
      }

      try {
        const channels = subscriptionChannels.get(roomId);
        if (channels) {
          // Unsubscribe from tournament matches
          supabase.removeChannel(channels.matches);

          // Unsubscribe from game room changes
          supabase.removeChannel(channels.room);
        }

        // Remove from active subscriptions
        setActiveSubscriptions((prev) => {
          const newSet = new Set(prev);
          newSet.delete(roomId);
          return newSet;
        });

        // Remove from subscription channels
        setSubscriptionChannels((prev) => {
          const newMap = new Map(prev);
          newMap.delete(roomId);
          return newMap;
        });

        logger.info(`Unsubscribed from tournament updates for room ${roomId}`);
      } catch (err: unknown) {
        logger.error("Error unsubscribing from tournament:", err);
      }
    },
    [activeSubscriptions, subscriptionChannels]
  );

  const getMatchDetails = useCallback(
    async (matchId: string): Promise<TournamentMatch | null> => {
      try {
        const { data, error } = await supabase
          .from("tournament_matches")
          .select("*")
          .eq("id", matchId)
          .single();

        if (error) throw error;
        return data as TournamentMatch;
      } catch (err: unknown) {
        logger.error("Error getting match details:", err);
        return null;
      }
    },
    []
  );

  const value: TournamentContextType = {
    // Tournament state
    currentTournament,
    participants,
    stats,
    loading,
    error,

    // Tournament actions
    createTournament,
    startTournament,
    startMatch,
    completeMatch,
    timeoutMatch,
    refreshTournament,

    // Tournament queries
    getTournamentBracket,
    getTournamentParticipants,
    getTournamentStats,

    // Time management
    matchTimers,
    startMatchTimer,
    stopMatchTimer,
    getMatchTimeRemaining,

    // Tournament progression
    canStartTournament,
    isTournamentReady,
    getCurrentRoundMatches,
    getMatchDetails,
    updateParticipantStats,

    // Real-time updates
    subscribeToTournament,
    unsubscribeFromTournament,
  };

  return (
    <TournamentContext.Provider value={value}>
      {children}
    </TournamentContext.Provider>
  );
};
