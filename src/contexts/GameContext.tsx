import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { logger } from "@/utils";
import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
  useEffect,
} from "react";
import { useToast } from "@/hooks/use-toast";

// Types
interface PlayerRank {
  rank: number | null;
  total_players: number;
  high_score?: number;
}

// Extended game type with player count
type GameWithPlayerCount = Database["public"]["Tables"]["games"]["Row"] & {
  player_count: number;
};

interface GameContextType {
  games: GameWithPlayerCount[];
  currentGame: string | null;
  playerRank: PlayerRank | null;
  isLoading: boolean;
  sessionId: string | null;
  initializeGame: (gameId: string) => Promise<string>;
  submitScore: (
    gameId: string,
    score: number,
    metadata?: any
  ) => Promise<{ success: boolean; error?: string }>;
  getPlayerRank: (gameId: string) => Promise<PlayerRank | null>;
  handleGameMessage: (event: MessageEvent) => Promise<void>;
  endGameSession: () => Promise<void>;
}

// Create context with default values
const GameContext = createContext<GameContextType | undefined>(undefined);

interface GameProviderProps {
  children: ReactNode;
}

interface GameSession {
  userId: string;
  sessionToken: string;
  gameUrl: string;
  startTime: Date;
}

export const GameProvider: React.FC<GameProviderProps> = ({ children }) => {
  const [games, setGames] = useState<GameWithPlayerCount[]>([]);
  const [currentGame, setCurrentGame] = useState<string | null>(null);
  const [playerRank, setPlayerRank] = useState<PlayerRank | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [pingInterval, setPingInterval] = useState<NodeJS.Timeout | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [activeGameSessions, setActiveGameSessions] = useState<
    Map<string, Database["public"]["Tables"]["game_sessions"]["Row"]>
  >(new Map());
  const { toast } = useToast();
  // Get player's rank in a specific game
  const getPlayerRank = useCallback(
    async (gameId: string): Promise<PlayerRank | null> => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return null;

        const { data, error } = await supabase.rpc("get_player_rank", {
          p_game_id: gameId,
          p_player_id: user.id,
        });

        if (error) throw error;

        // Also get the player's high score
        const { data: scoreData } = await supabase
          .from("leaderboards")
          .select("total_score")
          .eq("game_id", gameId)
          .eq("user_id", user.id)
          .eq("period", "all-time")
          .single();

        if (data && data.length > 0) {
          const rankData = {
            rank: data[0].rank,
            total_players: data[0].total_players,
            high_score: scoreData?.total_score || 0,
          };
          setPlayerRank(rankData);
          return rankData;
        }
        return { rank: null, total_players: 0, high_score: 0 };
      } catch (error) {
        console.error("Error getting player rank:", error);
        return null;
      }
    },
    []
  );

  const fetchGames = useCallback(async () => {
    const { data, error } = await supabase.from("games").select("*");

    if (error) throw error;

    // Get unique player counts for each game
    const gamesWithPlayerCounts = await Promise.all(
      data.map(async (game) => {
        // Get unique player count by using a distinct query
        const { data: uniquePlayers } = await supabase
          .from("game_scores")
          .select("player_id")
          .eq("game_id", game.id);

        // Count unique players
        const uniquePlayerIds = new Set(
          uniquePlayers?.map((p) => p.player_id) || []
        );
        const playerCount = uniquePlayerIds.size;

        return {
          ...game,
          player_count: playerCount,
        };
      })
    );

    setGames(gamesWithPlayerCounts);
  }, []);

  useEffect(() => {
    fetchGames();
  }, [fetchGames]);

  // Add message listener in useEffect
  useEffect(() => {
    // Listen for messages from game windows
    window.addEventListener("message", handleGameMessage);

    return () => {
      window.removeEventListener("message", handleGameMessage);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Submit game score
  const submitScore = useCallback(
    async (gameId: string, score: number, metadata: any = {}) => {
      try {
        setIsLoading(true);
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) throw new Error("User not authenticated");

        // Check if score is higher than current high score
        const currentHighScore = playerRank?.high_score || 0;

        if (score <= currentHighScore) {
          // Don't save the score, but still return success with a message
          return {
            success: true,
            message: "Score not saved - not a new high score",
            isNewHighScore: false,
          };
        }

        // Score is higher, save it
        const { data, error } = await supabase.from("game_scores").insert({
          game_id: gameId,
          player_id: user.id,
          score,
          metadata,
        });

        if (error) throw error;

        // Refresh player rank
        await getPlayerRank(gameId);

        return {
          success: true,
          data,
          isNewHighScore: true,
          previousScore: currentHighScore,
          newScore: score,
          message: "New high score saved!",
        };
      } catch (error: any) {
        logger.error("Error submitting score:", error);
        return { success: false, error: error.message };
      } finally {
        setIsLoading(false);
      }
    },
    [getPlayerRank, playerRank]
  );

  // Initialize game session
  const initializeGame = useCallback(
    async (gameId: string) => {
      try {
        setCurrentGame(gameId);
        setPlayerRank(null);

        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        // Create game session
        const { data: session, error } = await supabase
          .from("game_sessions")
          .insert({
            game_id: gameId,
            user_id: user.id,
          })
          .select()
          .single();

        if (error) throw error;
        setActiveGameSessions((prev) => prev.set(session.id, session));
        setSessionId(session.id);

        // Start ping interval to keep session active
        const interval = setInterval(async () => {
          if (session.id) {
            await supabase
              .from("game_sessions")
              .update({ last_ping_at: new Date().toISOString() })
              .eq("id", session.id);
          }
        }, 30000); // Ping every 30 seconds

        setPingInterval(interval);

        // Get player rank
        const rank = await getPlayerRank(gameId);
        if (!rank || rank.rank === null) {
          setPlayerRank({
            rank: null,
            total_players: rank?.total_players || 0,
          });
        }
        return session.id;
      } catch (error) {
        console.error("Error initializing game:", error);
      }
    },
    [getPlayerRank]
  );

  // Handle messages from game
  const handleGameMessage = async (event: MessageEvent) => {
    // Verify the origin
    const allowedOrigins = [
      "https://cheerful-entremet-2dbb07.netlify.app",
      "https://stirring-unicorn-441851.netlify.app",
      "https://ornate-lamington-115e41.netlify.app",
      "https://flappy-bird-nexuz.netlify.app",
      "https://doodle-jump-nexuz.netlify.app",
      "https://endless-runner-nexuz.netlify.app",
    ];
    if (!allowedOrigins.includes(event.origin)) {
      logger.debug("Message from unauthorized origin:", event.origin);
      return;
    }

    const { type, score, userId, gameId, sessionToken, metadata } = event.data;

    logger.debug("Received message:", {
      type,
      score,
      userId,
      gameId,
      sessionToken,
    });
    logger.debug("Available sessions:", Array.from(activeGameSessions.keys()));

    if (type === "SUBMIT_SCORE") {
      try {
        // Verify session
        const session = activeGameSessions.get(sessionToken);
        if (!session) {
          logger.error("Invalid session token:", sessionToken);
          logger.debug(
            "Available sessions:",
            Array.from(activeGameSessions.keys())
          );

          // Send error back to game
          if (event.source) {
            event.source.postMessage(
              {
                type: "SCORE_SUBMISSION_ERROR",
                error: "Invalid session token",
              },
              { targetOrigin: event.origin }
            );
          }
          return;
        }

        if (session.user_id !== userId || session.game_id !== gameId) {
          logger.error("Session validation failed");
          return;
        }

        // Update score in database
        const result = await submitScore(gameId, score, metadata);

        // KEEP session active - don't remove it here

        // Send success response back to game
        if (event.source) {
          event.source.postMessage(
            {
              type: "SCORE_SUBMISSION_SUCCESS",
              updated: result.success,
              previousScore: result.previousScore,
              newScore: result.newScore,
            },
            { targetOrigin: event.origin }
          );
        }

        // Show appropriate message
        if (result.isNewHighScore) {
          toast({
            title: "New High Score! 🎉",
            description: `Your score improved from ${result.previousScore.toLocaleString()} to ${result.newScore.toLocaleString()}!`,
          });
        } else {
          toast({
            title: "Score Submitted",
            description: `Score: ${result.newScore.toLocaleString()} (Current best: ${result.previousScore.toLocaleString()})`,
          });
        }

        logger.info("Score submission result:", {
          gameId,
          userId,
          scoreSubmitted: score,
          previousScore: result.previousScore,
          newScore: result.newScore,
          wasUpdated: result.isNewHighScore,
          sessionToken,
          metadata,
        });
      } catch (error) {
        logger.error("Error handling score submission:", error);

        // Send error back to game
        if (event.source) {
          event.source.postMessage(
            {
              type: "SCORE_SUBMISSION_ERROR",
              error: error.message,
            },
            { targetOrigin: event.origin }
          );
        }

        toast({
          title: "Score Submission Failed",
          description:
            "There was an error recording your score. Please try again.",
          variant: "destructive",
        });
      }
    } else if (type === "EXIT_GAME") {
      // DON'T clean up session on exit - keep it for when user returns
      logger.debug(
        "User exited game, but keeping session active:",
        sessionToken
      );
    } else if (type === "GAME_READY") {
      // Game is ready, session should still be active
      logger.debug("Game ready, session:", sessionToken);
    }
  };

  // End game session
  const endGameSession = useCallback(async () => {
    try {
      if (sessionId) {
        await supabase
          .from("game_sessions")
          .update({ ended_at: new Date().toISOString() })
          .eq("id", sessionId);

        setSessionId(null);
      }

      if (pingInterval) {
        clearInterval(pingInterval);
        setPingInterval(null);
      }

      setCurrentGame(null);
      setPlayerRank(null);
    } catch (error) {
      console.error("Error ending game session:", error);
    }
  }, [sessionId, pingInterval]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pingInterval) {
        clearInterval(pingInterval);
      }
      if (sessionId) {
        supabase
          .from("game_sessions")
          .update({ ended_at: new Date().toISOString() })
          .eq("id", sessionId);
      }
    };
  }, [sessionId, pingInterval]);

  const value: GameContextType = {
    games,
    currentGame,
    playerRank,
    isLoading,
    sessionId,
    initializeGame,
    submitScore,
    getPlayerRank,
    handleGameMessage,
    endGameSession,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};

export const useGame = (): GameContextType => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error("useGame must be used within a GameProvider");
  }
  return context;
};
