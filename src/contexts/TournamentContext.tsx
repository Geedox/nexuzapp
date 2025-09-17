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

  const { user } = useAuth();
  const { toast } = useToast();

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
    } catch (err: unknown) {
      logger.error("Error refreshing tournament:", err);
      setError(
        err instanceof Error ? err.message : "Failed to refresh tournament data"
      );
    }
  }, []);

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
        const errorMessage =
          err instanceof Error ? err.message : "Failed to create tournament";
        setError(errorMessage);
        logger.error("Error creating tournament:", err);

        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [user, toast, refreshTournament]
  );

  // Time management functions
  const stopMatchTimer = useCallback((matchId: string) => {
    setMatchTimers((prev) => {
      const newMap = new Map(prev);
      newMap.delete(matchId);
      return newMap;
    });
  }, []);

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
      const durationMs = durationMinutes * 60 * 1000;
      const endTime = Date.now() + durationMs;

      setMatchTimers((prev) => new Map(prev).set(matchId, endTime));

      // Set timeout to handle match timeout
      setTimeout(() => {
        timeoutMatch(matchId).catch((err) => {
          logger.error("Error handling match timeout:", err);
        });
      }, durationMs);
    },
    [timeoutMatch]
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
        logger.error("Error starting match:", err);
        throw err;
      }
    },
    [startMatchTimer, refreshTournament]
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

        // Refresh tournament data
        if (match.room_id) {
          await refreshTournament(match.room_id);
        }

        logger.info(`Match ${matchId} completed, winner: ${winnerId}`);
      } catch (err: unknown) {
        logger.error("Error completing match:", err);
        throw err;
      }
    },
    [stopMatchTimer, refreshTournament]
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
      return [];
    },
    []
  );

  const getTournamentStats = useCallback(
    async (roomId: string): Promise<TournamentStats | null> => {
      return null;
    },
    []
  );

  const canStartTournament = useCallback(
    async (roomId: string): Promise<boolean> => {
      return false;
    },
    []
  );

  const isTournamentReady = useCallback(
    async (roomId: string): Promise<boolean> => {
      return false;
    },
    []
  );

  const getCurrentRoundMatches = useCallback(
    async (roomId: string): Promise<TournamentMatch[]> => {
      return [];
    },
    []
  );

  const subscribeToTournament = useCallback((roomId: string) => {
    // Implementation will be added
  }, []);

  const unsubscribeFromTournament = useCallback((roomId: string) => {
    // Implementation will be added
  }, []);

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
