/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode, useRef } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

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
  rank?: number;
  user: LeaderboardUser;
}

interface LeaderboardContextType {
  leaderboards: Record<string, LeaderboardEntry[]>;
  globalLeaderboard: LeaderboardEntry[];
  isLoading: boolean;
  fetchLeaderboard: (gameId: string, limit?: number) => Promise<LeaderboardEntry[]>;
  fetchGlobalLeaderboard: (limit?: number) => Promise<LeaderboardEntry[]>;
  subscribeToLeaderboard: (gameId: string) => () => void;
  getTopPlayers: (gameId: string, limit?: number) => LeaderboardEntry[];
  getPlayerPosition: (gameId: string, playerId: string) => number | null;
}

// Create context
const LeaderboardContext = createContext<LeaderboardContextType | undefined>(undefined);

interface LeaderboardProviderProps {
  children: ReactNode;
}

export const LeaderboardProvider: React.FC<LeaderboardProviderProps> = ({ children }) => {
  const [leaderboards, setLeaderboards] = useState<Record<string, LeaderboardEntry[]>>({});
  const [globalLeaderboard, setGlobalLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Use useRef to store subscriptions to avoid dependency issues
  const subscriptionsRef = useRef<Record<string, RealtimeChannel>>({});

  // Fetch leaderboard for a specific game
  const fetchLeaderboard = useCallback(async (gameId: string, limit: number = 100): Promise<LeaderboardEntry[]> => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('leaderboards')
        .select(`
          *,
          user:profiles(
            id,
            username,
            display_name,
            avatar_url
          )
        `)
        .eq('game_id', gameId)
        .eq('period', 'all-time')
        .order('total_score', { ascending: false })
        .limit(limit);

      if (error) throw error;

      // Add rank to each entry
      const rankedData = (data || []).map((entry: any, index: number) => ({
        ...entry,
        rank: index + 1
      })) as LeaderboardEntry[];

      setLeaderboards(prev => ({
        ...prev,
        [gameId]: rankedData
      }));

      return rankedData;
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch global leaderboard
  const fetchGlobalLeaderboard = useCallback(async (limit: number = 100): Promise<LeaderboardEntry[]> => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .rpc('get_global_leaderboard', { limit_count: limit });

      if (error) throw error;

      // Transform data to match LeaderboardEntry format
      const transformedData = (data || []).map((entry: any) => ({
        id: entry.user_id,
        game_id: 'global',
        user_id: entry.user_id,
        total_score: entry.total_score,
        games_played: entry.total_games,
        wins: entry.total_wins,
        rank: entry.rank,
        user: {
          id: entry.user_id,
          username: entry.username,
          display_name: entry.display_name,
          avatar_url: entry.avatar_url
        }
      })) as LeaderboardEntry[];

      setGlobalLeaderboard(transformedData);
      return transformedData;
    } catch (error) {
      console.error('Error fetching global leaderboard:', error);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Subscribe to leaderboard changes
  const subscribeToLeaderboard = useCallback((gameId: string): (() => void) => {
    // Unsubscribe from previous subscription for this game if it exists
    if (subscriptionsRef.current[gameId]) {
      subscriptionsRef.current[gameId].unsubscribe();
    }

    const newSubscription = supabase
      .channel(`leaderboard-${gameId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'leaderboards',
          filter: `game_id=eq.${gameId}`
        },
        () => {
          // Refresh leaderboard when changes occur
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
  }, [fetchLeaderboard]);

  // Get top players for a game
  const getTopPlayers = useCallback((gameId: string, limit: number = 10): LeaderboardEntry[] => {
    const gameLeaderboard = leaderboards[gameId] || [];
    return gameLeaderboard.slice(0, limit);
  }, [leaderboards]);

  // Find player position
  const getPlayerPosition = useCallback((gameId: string, playerId: string): number | null => {
    const gameLeaderboard = leaderboards[gameId] || [];
    const position = gameLeaderboard.findIndex(entry => entry.user_id === playerId);
    return position === -1 ? null : position + 1;
  }, [leaderboards]);

  // Cleanup all subscriptions on unmount
  useEffect(() => {
    return () => {
      Object.values(subscriptionsRef.current).forEach(subscription => {
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
    getTopPlayers,
    getPlayerPosition
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
    throw new Error('useLeaderboard must be used within a LeaderboardProvider');
  }
  return context;
};