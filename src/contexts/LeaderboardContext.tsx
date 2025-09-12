/* eslint-disable @typescript-eslint/no-explicit-any */
import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
  useRef,
} from "react";
import { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

// Types
interface LeaderboardUser {
  id: string;
  username: string;
  display_name?: string;
  avatar_url?: string;
}

interface LeaderboardEntry {
  id: string;
  game_id: string;
  user_id: string;
  total_score: number;
  games_played: number;
  wins?: number;
  total_earnings?: number;
  rank?: number;
  user: LeaderboardUser;
}

interface LeaderboardContextType {
  leaderboards: Record<string, LeaderboardEntry[]>;
  globalLeaderboard: LeaderboardEntry[];
  isLoading: boolean;
  fetchLeaderboard: (
    gameId: string,
    limit?: number
  ) => Promise<LeaderboardEntry[]>;
  fetchGlobalLeaderboard: (limit?: number) => Promise<LeaderboardEntry[]>;
  subscribeToLeaderboard: (gameId: string) => () => void;
  subscribeToGlobalLeaderboard: () => () => void;
  getTopPlayers: (gameId: string, limit?: number) => LeaderboardEntry[];
  getPlayerPosition: (gameId: string, playerId: string) => number | null;
  refreshAllLeaderboards: () => Promise<void>;
}

// Create context
const LeaderboardContext = createContext<LeaderboardContextType | undefined>(
  undefined
);

interface LeaderboardProviderProps {
  children: ReactNode;
}

export const LeaderboardProvider: React.FC<LeaderboardProviderProps> = ({
  children,
}) => {
  const [leaderboards, setLeaderboards] = useState<
    Record<string, LeaderboardEntry[]>
  >({});
  const [globalLeaderboard, setGlobalLeaderboard] = useState<
    LeaderboardEntry[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);

  // Use useRef to store subscriptions to avoid dependency issues
  const subscriptionsRef = useRef<Record<string, RealtimeChannel>>({});

  // Fetch leaderboard for a specific game
  const fetchLeaderboard = useCallback(
    async (
      gameId: string,
      limit: number = 100
    ): Promise<LeaderboardEntry[]> => {
      try {
        setIsLoading(true);

        const { data, error } = await supabase
          .from("leaderboards")
          .select(
            `
          *,
          user:profiles(
            id,
            username,
            display_name,
            avatar_url
          )
        `
          )
          .eq("game_id", gameId)
          .eq("period", "all-time")
          .order("total_score", { ascending: false })
          .limit(limit);

        if (error) {
          console.error("Error fetching game leaderboard:", error);
          throw error;
        }

        // Add rank to each entry
        const rankedData = (data || []).map((entry: any, index: number) => ({
          ...entry,
          rank: index + 1,
        })) as LeaderboardEntry[];

        setLeaderboards((prev) => ({
          ...prev,
          [gameId]: rankedData,
        }));

        console.log(
          `Fetched leaderboard for game ${gameId}:`,
          rankedData.length,
          "entries"
        );
        return rankedData;
      } catch (error) {
        console.error("Error fetching leaderboard:", error);
        return [];
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Fetch global leaderboard - improved with fallback
  const fetchGlobalLeaderboard = useCallback(
    async (limit: number = 100): Promise<LeaderboardEntry[]> => {
      try {
        setIsLoading(true);

        // First try the RPC function
        let data, error;
        try {
          const result = await supabase.rpc("get_global_leaderboard", {
            limit_count: limit,
          });
          data = result.data;
          error = result.error;
        } catch (rpcError) {
          console.log("RPC function not available, using fallback query");

          // Fallback: manual aggregation
          const result = await supabase
            .from("leaderboards")
            .select(
              `
            user_id,
            total_score,
            games_played,
            wins,
            total_earnings,
            user:profiles(
              id,
              username,
              display_name,
              avatar_url
            )
          `
            )
            .eq("period", "all-time")
            .is("game_id", null)
            .order("wins", { ascending: false })
            .order("total_earnings", { ascending: false })
            .limit(limit);

          if (result.error) throw result.error;

          // Process the data to aggregate by user
          const userStats = new Map();

          result.data?.forEach((entry: any) => {
            const userId = entry.user_id;
            // if (userStats.has(userId)) {
            //   const existing = userStats.get(userId);
            //   existing.total_score = Math.max(
            //     existing.total_score,
            //     entry.total_score
            //   );
            //   existing.games_played += entry.games_played;
            //   existing.wins += entry.wins || 0;
            //   existing.total_earnings += entry.total_earnings || 0;
            // } else {
            userStats.set(userId, {
              user_id: userId,
              username: entry.user?.username,
              display_name: entry.user?.display_name,
              avatar_url: entry.user?.avatar_url,
              total_score: entry.total_score || 0,
              total_games: entry.games_played || 0,
              total_wins: entry.wins || 0,
              total_earnings: entry.total_earnings || 0,
            });
            // }
          });

          // Convert to array and sort
          data = Array.from(userStats.values())
            .sort((a, b) => {
              if (b.total_earnings !== a.total_earnings)
                return b.total_earnings - a.total_earnings;
              return b.total_earnings - a.total_earnings;
            })
            .slice(0, limit);
        }

        if (error) {
          console.error("Error fetching global leaderboard:", error);
          throw error;
        }

        if (!data || data.length === 0) {
          console.log("No global leaderboard data found");
          setGlobalLeaderboard([]);
          return [];
        }

        // Transform data to match LeaderboardEntry format
        const transformedData = data.map((entry: any, index: number) => ({
          id: entry.user_id,
          game_id: "global",
          user_id: entry.user_id,
          total_score: entry.total_score || 0,
          games_played: entry.total_games || entry.games_played || 0,
          wins: entry.total_wins || entry.wins || 0,
          total_earnings: entry.total_earnings || 0,
          rank: index + 1,
          user: {
            id: entry.user_id,
            username: entry.username,
            display_name: entry.display_name,
            avatar_url: entry.avatar_url,
          },
        })) as LeaderboardEntry[];

        console.log(
          "Global leaderboard fetched:",
          transformedData.length,
          "entries"
        );
        setGlobalLeaderboard(transformedData);
        return transformedData;
      } catch (error) {
        console.error("Error fetching global leaderboard:", error);
        setGlobalLeaderboard([]);
        return [];
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Subscribe to leaderboard changes for a specific game
  const subscribeToLeaderboard = useCallback(
    (gameId: string): (() => void) => {
      // Unsubscribe from previous subscription for this game if it exists
      if (subscriptionsRef.current[gameId]) {
        subscriptionsRef.current[gameId].unsubscribe();
      }

      const newSubscription = supabase
        .channel(`leaderboard-${gameId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "leaderboards",
            filter: `game_id=eq.${gameId}`,
          },
          () => {
            console.log(`Leaderboard change detected for game ${gameId}`);
            fetchLeaderboard(gameId);
          }
        )
        .subscribe();

      subscriptionsRef.current[gameId] = newSubscription;

      return () => {
        if (subscriptionsRef.current[gameId]) {
          subscriptionsRef.current[gameId].unsubscribe();
          delete subscriptionsRef.current[gameId];
        }
      };
    },
    [fetchLeaderboard]
  );

  // Subscribe to global leaderboard changes
  const subscribeToGlobalLeaderboard = useCallback((): (() => void) => {
    const channelName = "global-leaderboard";

    // Unsubscribe from previous subscription if it exists
    if (subscriptionsRef.current[channelName]) {
      subscriptionsRef.current[channelName].unsubscribe();
    }

    const newSubscription = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "leaderboards",
        },
        () => {
          console.log("Global leaderboard change detected");
          fetchGlobalLeaderboard();
        }
      )
      .subscribe();

    subscriptionsRef.current[channelName] = newSubscription;

    return () => {
      if (subscriptionsRef.current[channelName]) {
        subscriptionsRef.current[channelName].unsubscribe();
        delete subscriptionsRef.current[channelName];
      }
    };
  }, [fetchGlobalLeaderboard]);

  // Get top players for a game
  const getTopPlayers = useCallback(
    (gameId: string, limit: number = 10): LeaderboardEntry[] => {
      const gameLeaderboard = leaderboards[gameId] || [];
      return gameLeaderboard.slice(0, limit);
    },
    [leaderboards]
  );

  // Find player position
  const getPlayerPosition = useCallback(
    (gameId: string, playerId: string): number | null => {
      const gameLeaderboard = leaderboards[gameId] || [];
      const position = gameLeaderboard.findIndex(
        (entry) => entry.user_id === playerId
      );
      return position === -1 ? null : position + 1;
    },
    [leaderboards]
  );

  // Refresh all leaderboards
  const refreshAllLeaderboards = useCallback(async () => {
    console.log("Refreshing all leaderboards...");
    await fetchGlobalLeaderboard();

    // Refresh all currently loaded game leaderboards
    const gameIds = Object.keys(leaderboards);
    await Promise.all(gameIds.map((gameId) => fetchLeaderboard(gameId)));
  }, [fetchGlobalLeaderboard, fetchLeaderboard, leaderboards]);

  // Cleanup all subscriptions on unmount
  useEffect(() => {
    return () => {
      Object.values(subscriptionsRef.current).forEach((subscription) => {
        subscription.unsubscribe();
      });
      subscriptionsRef.current = {};
    };
  }, []);

  const value: LeaderboardContextType = {
    leaderboards,
    globalLeaderboard,
    isLoading,
    fetchLeaderboard,
    fetchGlobalLeaderboard,
    subscribeToLeaderboard,
    subscribeToGlobalLeaderboard,
    getTopPlayers,
    getPlayerPosition,
    refreshAllLeaderboards,
  };

  return (
    <LeaderboardContext.Provider value={value}>
      {children}
    </LeaderboardContext.Provider>
  );
};

export const useLeaderboard = (): LeaderboardContextType => {
  const context = useContext(LeaderboardContext);
  if (!context) {
    throw new Error("useLeaderboard must be used within a LeaderboardProvider");
  }
  return context;
};
