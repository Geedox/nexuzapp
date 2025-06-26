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
      // For now, return empty stats to avoid errors
      // You can implement the actual fetching logic once the RLS policies are fixed
      return {
        totalRoomsJoined: 0,
        totalRoomsCreated: 0,
        activeRooms: 0,
        completedRooms: 0,
        totalRoomWinnings: 0,
        roomWinRate: 0,
        favoriteGame: null
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
      // For now, return empty array to avoid errors
      // You can implement the actual fetching logic once the RLS policies are fixed
      return [];
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

      // Temporarily disable room and game stats fetching
      // until RLS policies are properly fixed
      setRoomStats({
        totalRoomsJoined: 0,
        totalRoomsCreated: 0,
        activeRooms: 0,
        completedRooms: 0,
        totalRoomWinnings: 0,
        roomWinRate: 0,
        favoriteGame: null
      });
      setGameStats([]);
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
  };

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
};