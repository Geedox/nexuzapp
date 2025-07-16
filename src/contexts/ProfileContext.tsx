/* eslint-disable no-useless-catch */
import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Profile {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  country: string | null;
  email_verified: boolean | null;
  total_earnings: number | null;
  total_games_played: number | null;
  total_wins: number | null;
  current_win_streak: number | null;
  longest_win_streak: number | null;
  level: number | null;
  experience_points: number | null;
  current_rank?: string;
  is_online: boolean | null;
  last_seen: string | null;
  created_at: string | null;
  updated_at: string | null;
  sui_wallet_data: {
    address: string;
    publicKey: string;
    privateKey: string;
    createdAt: string;
    balance: number;
  } | null;
}

interface RoomStats {
  totalRoomsJoined: number;
  totalRoomsCreated: number;
  activeRooms: number;
  completedRooms: number;
  totalRoomWinnings: number;
  roomWinRate: number;
  favoriteGame: string | null;
}

interface GameStats {
  gameId: string;
  gameName: string;
  gamesPlayed: number;
  wins: number;
  earnings: number;
  winRate: number;
  averagePosition: number;
}

interface ProfileContextType {
  profile: Profile | null;
  loading: boolean;
  roomStats: RoomStats | null;
  gameStats: GameStats[];
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  checkUsernameAvailability: (username: string) => Promise<boolean>;
  setUsername: (username: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
  refreshStats: () => Promise<void>;
  refreshProfileStats: () => Promise<void>; // New function
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
};

export const ProfileProvider = ({ children }: { children: React.ReactNode }) => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roomStats, setRoomStats] = useState<RoomStats | null>(null);
  const [gameStats, setGameStats] = useState<GameStats[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch room statistics
  const fetchRoomStats = async (userId: string): Promise<RoomStats> => {
    try {
      // Get room statistics from game_room_participants and game_rooms
      const { data: participantData } = await supabase
        .from('game_room_participants')
        .select(`
          *,
          room:game_rooms(*)
        `)
        .eq('user_id', userId);

      if (!participantData) {
        return {
          totalRoomsJoined: 0,
          totalRoomsCreated: 0,
          activeRooms: 0,
          completedRooms: 0,
          totalRoomWinnings: 0,
          roomWinRate: 0,
          favoriteGame: null
        };
      }

      const totalRoomsJoined = participantData.length;
      const activeRooms = participantData.filter(p => p.room?.status === 'ongoing' || p.room?.status === 'waiting').length;
      const completedRooms = participantData.filter(p => p.room?.status === 'completed').length;
      const wins = participantData.filter(p => p.final_position === 1).length;
      const totalRoomWinnings = participantData.reduce((sum, p) => sum + (p.earnings || 0), 0);
      const roomWinRate = completedRooms > 0 ? (wins / completedRooms) * 100 : 0;

      // Get created rooms
      const { data: createdRooms } = await supabase
        .from('game_rooms')
        .select('*')
        .eq('creator_id', userId);

      const totalRoomsCreated = createdRooms?.length || 0;

      return {
        totalRoomsJoined,
        totalRoomsCreated,
        activeRooms,
        completedRooms,
        totalRoomWinnings,
        roomWinRate,
        favoriteGame: null // You can implement this based on most played game
      };
    } catch (error) {
      console.error('Error fetching room stats:', error);
      return {
        totalRoomsJoined: 0,
        totalRoomsCreated: 0,
        activeRooms: 0,
        completedRooms: 0,
        totalRoomWinnings: 0,
        roomWinRate: 0,
        favoriteGame: null
      };
    }
  };

  // Fetch game-specific statistics
  const fetchGameStats = async (userId: string): Promise<GameStats[]> => {
    try {
      const { data: leaderboardData } = await supabase
        .from('leaderboards')
        .select(`
          *,
          game:games(name)
        `)
        .eq('user_id', userId)
        .eq('period', 'all-time')
        .not('game_id', 'is', null);

      if (!leaderboardData) return [];

      const gameStats: GameStats[] = leaderboardData.map(entry => ({
        gameId: entry.game_id,
        gameName: entry.game?.name || 'Unknown Game',
        gamesPlayed: entry.games_played || 0,
        wins: entry.wins || 0,
        earnings: Number(entry.total_earnings || 0),
        winRate: entry.games_played > 0 ? (entry.wins / entry.games_played) * 100 : 0,
        averagePosition: 0 // You can calculate this from game_room_participants if needed
      }));

      return gameStats;
    } catch (error) {
      console.error('Error fetching game stats:', error);
      return [];
    }
  };

  // Fetch profile data
  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setProfile(data);

      // Fetch room and game stats
      const [roomStatsData, gameStatsData] = await Promise.all([
        fetchRoomStats(userId),
        fetchGameStats(userId)
      ]);

      setRoomStats(roomStatsData);
      setGameStats(gameStatsData);
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast({
        title: "Error",
        description: "Failed to fetch profile data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Refresh profile data
  const refreshProfile = async () => {
    if (!user) return;
    await fetchProfile(user.id);
  };

  // Refresh only statistics
  const refreshStats = async () => {
    if (!user) return;

    try {
      const [roomStatsData, gameStatsData] = await Promise.all([
        fetchRoomStats(user.id),
        fetchGameStats(user.id)
      ]);

      setRoomStats(roomStatsData);
      setGameStats(gameStatsData);
    } catch (error) {
      console.error('Error refreshing stats:', error);
    }
  };

  // NEW: Refresh profile stats using the SQL function
  const refreshProfileStats = async () => {
    if (!user) return;

    try {
      // Use the SQL function to update profile stats
      await supabase.rpc('update_user_profile_stats', { p_user_id: user.id });

      // Then refresh the profile data
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setProfile(data);

      toast({
        title: "Success",
        description: "Profile stats refreshed successfully",
      });
    } catch (error) {
      console.error('Error refreshing profile stats:', error);
      toast({
        title: "Error",
        description: "Failed to refresh profile stats",
        variant: "destructive",
      });
    }
  };

  // Update profile
  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;

      setProfile(data);
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Check if username is available
  const checkUsernameAvailability = async (username: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', username)
        .maybeSingle();

      if (error) throw error;

      // If data is null, username is available
      return data === null;
    } catch (error) {
      console.error('Error checking username:', error);
      return false;
    }
  };

  // Set username
  const setUsername = async (username: string) => {
    if (!user) return;

    try {
      // First check if username is available
      const isAvailable = await checkUsernameAvailability(username);

      if (!isAvailable) {
        toast({
          title: "Error",
          description: "Username is already taken",
          variant: "destructive",
        });
        throw new Error("Username is already taken");
      }

      // Update username
      await updateProfile({ username });
    } catch (error) {
      throw error;
    }
  };

  // Load profile when user changes
  useEffect(() => {
    if (user) {
      fetchProfile(user.id);
    } else {
      setProfile(null);
      setRoomStats(null);
      setGameStats([]);
      setLoading(false);
    }
  }, [user]);

  // Set up real-time subscription for profile updates
  useEffect(() => {
    if (!user) return;

    const subscription = supabase
      .channel('profile_changes')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'profiles',
        filter: `id=eq.${user.id}`
      }, (payload) => {
        setProfile(payload.new as Profile);
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  const value = {
    profile,
    loading,
    roomStats,
    gameStats,
    updateProfile,
    checkUsernameAvailability,
    setUsername,
    refreshProfile,
    refreshStats,
    refreshProfileStats, // New function added
  };

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
};