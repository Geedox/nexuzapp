/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase } from '@/integrations/supabase/client';
import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';

// Types
interface PlayerRank {
  rank: number | null;
  total_players: number;
  high_score?: number;
}

interface GameContextType {
  currentGame: string | null;
  playerRank: PlayerRank | null;
  isLoading: boolean;
  sessionId: string | null;
  initializeGame: (gameId: string) => Promise<void>;
  submitScore: (gameId: string, score: number, metadata?: any) => Promise<{ success: boolean; error?: string }>;
  getPlayerRank: (gameId: string) => Promise<PlayerRank | null>;
  handleGameMessage: (event: MessageEvent) => Promise<void>;
  endGameSession: () => Promise<void>;
}

// Create context with default values
const GameContext = createContext<GameContextType | undefined>(undefined);

interface GameProviderProps {
  children: ReactNode;
}

export const GameProvider: React.FC<GameProviderProps> = ({ children }) => {
  const [currentGame, setCurrentGame] = useState<string | null>(null);
  const [playerRank, setPlayerRank] = useState<PlayerRank | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [pingInterval, setPingInterval] = useState<NodeJS.Timeout | null>(null);

  // Get player's rank in a specific game
  const getPlayerRank = useCallback(async (gameId: string): Promise<PlayerRank | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .rpc('get_player_rank', { 
          p_game_id: gameId, 
          p_player_id: user.id 
        });

      if (error) throw error;
      
      // Also get the player's high score
      const { data: scoreData } = await supabase
        .from('leaderboards')
        .select('total_score')
        .eq('game_id', gameId)
        .eq('user_id', user.id)
        .eq('period', 'all-time')
        .single();
      
      if (data && data.length > 0) {
        const rankData = {
          rank: data[0].rank,
          total_players: data[0].total_players,
          high_score: scoreData?.total_score || 0
        };
        setPlayerRank(rankData);
        return rankData;
      }
      return { rank: null, total_players: 0, high_score: 0 };
    } catch (error) {
      console.error('Error getting player rank:', error);
      return null;
    }
  }, []);

  // Submit game score
  const submitScore = useCallback(async (gameId: string, score: number, metadata: any = {}) => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Check if score is higher than current high score
      const currentHighScore = playerRank?.high_score || 0;
      
      if (score <= currentHighScore) {
        // Don't save the score, but still return success with a message
        return { 
          success: true, 
          message: 'Score not saved - not a new high score',
          isNewHighScore: false 
        };
      }

      // Score is higher, save it
      const { data, error } = await supabase
        .from('game_scores')
        .insert({
          game_id: gameId,
          player_id: user.id,
          score,
          metadata
        });

      if (error) throw error;

      // Refresh player rank
      await getPlayerRank(gameId);
      
      return { 
        success: true, 
        data,
        isNewHighScore: true,
        message: 'New high score saved!' 
      };
    } catch (error: any) {
      console.error('Error submitting score:', error);
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  }, [getPlayerRank, playerRank]);

  // Initialize game session
  const initializeGame = useCallback(async (gameId: string) => {
    try {
      setCurrentGame(gameId);
      setPlayerRank(null);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Create game session
      const { data: session, error } = await supabase
        .from('game_sessions')
        .insert({
          game_id: gameId,
          user_id: user.id
        })
        .select()
        .single();

      if (error) throw error;
      
      setSessionId(session.id);

      // Start ping interval to keep session active
      const interval = setInterval(async () => {
        if (session.id) {
          await supabase
            .from('game_sessions')
            .update({ last_ping_at: new Date().toISOString() })
            .eq('id', session.id);
        }
      }, 30000); // Ping every 30 seconds

      setPingInterval(interval);

      // Get player rank
      const rank = await getPlayerRank(gameId);
      if (!rank || rank.rank === null) {
        setPlayerRank({ rank: null, total_players: rank?.total_players || 0 });
      }
    } catch (error) {
      console.error('Error initializing game:', error);
    }
  }, [getPlayerRank]);

  // Handle messages from game iframe
  const handleGameMessage = useCallback(async (event: MessageEvent) => {
    if (event.data.type === 'SUBMIT_SCORE' && currentGame) {
      const result = await submitScore(
        currentGame,
        event.data.score,
        event.data.metadata
      );
      
      // Send result back to iframe
      if (event.source) {
        (event.source as Window).postMessage({
          type: 'SCORE_SUBMITTED',
          success: result.success,
          error: result.error,
          isNewHighScore: result.isNewHighScore,
          message: result.message
        }, '*');
      }
    }
  }, [currentGame, submitScore]);

  // End game session
  const endGameSession = useCallback(async () => {
    try {
      if (sessionId) {
        await supabase
          .from('game_sessions')
          .update({ ended_at: new Date().toISOString() })
          .eq('id', sessionId);
        
        setSessionId(null);
      }

      if (pingInterval) {
        clearInterval(pingInterval);
        setPingInterval(null);
      }

      setCurrentGame(null);
      setPlayerRank(null);
    } catch (error) {
      console.error('Error ending game session:', error);
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
          .from('game_sessions')
          .update({ ended_at: new Date().toISOString() })
          .eq('id', sessionId);
      }
    };
  }, [sessionId, pingInterval]);

  const value: GameContextType = {
    currentGame,
    playerRank,
    isLoading,
    sessionId,
    initializeGame,
    submitScore,
    getPlayerRank,
    handleGameMessage,
    endGameSession
  };

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = (): GameContextType => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};