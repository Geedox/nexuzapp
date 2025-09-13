
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { logger } from '@/utils';

type Profile = Database['public']['Tables']['profiles']['Row'];
type Game = Database['public']['Tables']['games']['Row'];
type GameRoom = Database['public']['Tables']['game_rooms']['Row'];
type Transaction = Database['public']['Tables']['transactions']['Row'];
type Wallet = Database['public']['Tables']['wallets']['Row'];
type Friend = Database['public']['Tables']['friends']['Row'];
type Notification = Database['public']['Tables']['notifications']['Row'];

// Profile operations
export const profileService = {
  async getProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;
  },

  async updateProfile(userId: string, updates: Partial<Profile>) {
    const { data, error } = await supabase
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getTopEarners(limit = 10) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('total_earnings', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  },

  async getTopWinStreaks(limit = 10) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('current_win_streak', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  },

  async deleteAccount(userId: string) {
    try {
      // Start a transaction-like operation by deleting related data first
      // Note: In Supabase, we need to handle foreign key constraints carefully

      // 1. Delete notifications
      await supabase
        .from('notifications')
        .delete()
        .eq('user_id', userId);

      // 2. Delete friends relationships
      await supabase
        .from('friends')
        .delete()
        .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`);

      // 3. Delete leaderboard entries
      await supabase
        .from('leaderboards')
        .delete()
        .eq('user_id', userId);

      // 4. Delete game room participants
      await supabase
        .from('game_room_participants')
        .delete()
        .eq('user_id', userId);

      // 6. Delete game sessions
      await supabase
        .from('game_sessions')
        .delete()
        .eq('user_id', userId);

      // 7. Delete game scores
      await supabase
        .from('game_scores')
        .delete()
        .eq('player_id', userId);

      // 10. Delete chat room memberships
      await supabase
        .from('chat_room_members')
        .delete()
        .eq('user_id', userId);

      // 11. Delete chat messages sent by user
      await supabase
        .from('chat_messages')
        .delete()
        .eq('sender_id', userId);

      // 12. Delete chat rooms created by user
      await supabase
        .from('chat_rooms')
        .delete()
        .eq('creator_id', userId);

      // 13. Delete email queue entries
      await supabase
        .from('email_queue')
        .delete()
        .eq('user_id', userId);

      // 14. Finally, delete the profile
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (profileError) throw profileError;

      // 15. Delete user's avatar from storage
      try {
        await avatarService.deleteAvatar(userId);
      } catch (avatarError) {
        // Log but don't fail the deletion if avatar deletion fails
        console.warn('Failed to delete avatar:', avatarError);
      }

      // 16. Sign out the user
      await supabase.auth.signOut();

      return { success: true };
    } catch (error) {
      console.error('Error deleting account:', error);
      throw error;
    }
  }
};

// Game operations
export const gameService = {
  async getAllGames() {
    const { data, error } = await supabase
      .from('games')
      .select('*')
      .eq('is_active', true);

    if (error) throw error;
    return data;
  },

  async getGame(gameId: string) {
    const { data, error } = await supabase
      .from('games')
      .select('*')
      .eq('id', gameId)
      .single();

    if (error) throw error;
    return data;
  }
};

// Room operations
export const roomService = {
  async getAllRooms() {
    const { data, error } = await supabase
      .from('game_rooms')
      .select(`
        *,
        games(*),
        profiles(username, display_name, avatar_url)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async joinRoom(roomId: string, playerId: string) {
    const { data, error } = await supabase
      .from('room_participants')
      .insert({
        room_id: roomId,
        player_id: playerId
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getRoomParticipants(roomId: string) {
    const { data, error } = await supabase
      .from('room_participants')
      .select(`
        *,
        profiles(username, display_name, avatar_url)
      `)
      .eq('room_id', roomId);

    if (error) throw error;
    return data;
  }
};

// Wallet operations
export const walletService = {
  async getUserWallets(userId: string) {
    const { data, error } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', userId);

    if (error) throw error;
    return data;
  },

  async updateWalletBalance(userId: string, currency: Database['public']['Enums']['currency_type'], amount: number) {
    const { data, error } = await supabase
      .from('wallets')
      .update({
        balance: amount,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('currency', currency)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async connectWallet(userId: string, currency: Database['public']['Enums']['currency_type'], walletAddress: string) {
    const { data, error } = await supabase
      .from('wallets')
      .update({
        wallet_address: walletAddress,
        is_connected: true,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('currency', currency)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};

// Transaction operations
export const transactionService = {
  async getUserTransactions(userId: string, limit = 20) {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  },

  async createTransaction(transactionData: {
    user_id: string;
    type: Database['public']['Enums']['transaction_type'];
    amount: number;
    currency: Database['public']['Enums']['currency_type'];
    description?: string;
    room_id?: string;
    transaction_hash?: string;
  }) {
    const { data, error } = await supabase
      .from('transactions')
      .insert({
        user_id: transactionData.user_id,
        type: transactionData.type,
        amount: transactionData.amount,
        currency: transactionData.currency,
        description: transactionData.description,
        room_id: transactionData.room_id,
        transaction_hash: transactionData.transaction_hash
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};

// Friend operations
export const friendService = {
  async getUserFriends(userId: string) {
    const { data, error } = await supabase
      .from('friends')
      .select(`
        *,
        requester:profiles!friends_requester_id_fkey(username, display_name, avatar_url),
        addressee:profiles!friends_addressee_id_fkey(username, display_name, avatar_url)
      `)
      .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
      .eq('status', 'accepted');

    if (error) throw error;
    return data;
  },

  async sendFriendRequest(requesterId: string, addresseeId: string) {
    const { data, error } = await supabase
      .from('friends')
      .insert({
        requester_id: requesterId,
        addressee_id: addresseeId,
        status: 'pending'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async respondToFriendRequest(friendId: string, status: Database['public']['Enums']['friend_status']) {
    const { data, error } = await supabase
      .from('friends')
      .update({
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', friendId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};

// Notification operations
export const notificationService = {
  async getUserNotifications(userId: string, limit = 20) {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  },

  async createNotification(notificationData: {
    user_id: string;
    type: Database['public']['Enums']['notification_type'];
    title: string;
    message: string;
    data?: any;
  }) {
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: notificationData.user_id,
        type: notificationData.type,
        title: notificationData.title,
        message: notificationData.message,
        data: notificationData.data
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async markAsRead(notificationId: string) {
    const { data, error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};

// Leaderboard operations
export const leaderboardService = {
  async getLeaderboard(period = 'all_time', limit = 10) {
    const { data, error } = await supabase
      .from('leaderboards')
      .select(`
        *,
        profiles(username, display_name, avatar_url)
      `)
      .eq('period', period)
      .order('rank', { ascending: true })
      .limit(limit);

    if (error) throw error;
    return data;
  },

  async updateUserLeaderboard(userId: string, gameId: string, stats: {
    total_score?: number;
    total_earnings?: number;
    games_played?: number;
    wins?: number;
  }) {
    const { data, error } = await supabase
      .from('leaderboards')
      .upsert({
        user_id: userId,
        game_id: gameId,
        period: 'all_time',
        ...stats,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};

// Analytics operations
export const analyticsService = {
  async getUserGameStats(userId: string) {
    try {
      // Get all game room participations for the user
      const { data: participations, error } = await supabase
        .from('game_room_participants')
        .select(`
          *,
          room:game_rooms(
            id,
            name,
            status,
            created_at,
            game:games(name, image_url)
          )
        `)
        .eq('user_id', userId)
        .order('joined_at', { ascending: false });

      if (error) throw error;

      // Calculate statistics
      const totalGames = participations?.length || 0;
      const wins = participations?.filter(p => p.final_position === 1).length || 0;
      const totalWinnings = participations?.reduce((sum, p) => sum + (p.earnings || 0), 0) || 0;
      const winRate = totalGames > 0 ? (wins / totalGames) * 100 : 0;

      // Get recent games (last 10)
      const recentGames = participations?.slice(0, 10).map(p => ({
        game: p.room?.game?.name || 'Unknown Game',
        result: p.final_position === 1 ? 'WIN' : 'LOSS',
        amount: p.earnings ? (p.earnings > 0 ? `+$${p.earnings.toFixed(2)}` : `-$${Math.abs(p.earnings).toFixed(2)}`) : '$0.00',
        date: p.joined_at ? new Date(p.joined_at).toLocaleDateString() : 'Unknown',
        roomId: p.room_id,
        position: p.final_position
      })) || [];

      return {
        totalGames,
        wins,
        totalWinnings,
        winRate,
        recentGames,
        participations: participations || []
      };
    } catch (error) {
      console.error('Error fetching user game stats:', error);
      throw error;
    }
  },

  async getUserGameStatsByPeriod(userId: string, period: 'week' | 'month' | 'year' | 'all') {
    try {
      let startDate: string;
      const now = new Date();

      switch (period) {
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
          break;
        case 'month':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
          break;
        case 'year':
          startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000).toISOString();
          break;
        default:
          startDate = '1970-01-01T00:00:00.000Z';
      }

      const { data: participations, error } = await supabase
        .from('game_room_participants')
        .select(`
          *,
          room:game_rooms(
            id,
            name,
            status,
            created_at,
            game:games(name, image_url)
          )
        `)
        .eq('user_id', userId)
        .gte('joined_at', startDate)
        .order('joined_at', { ascending: false });

      if (error) throw error;

      const totalGames = participations?.length || 0;
      const wins = participations?.filter(p => p.final_position === 1).length || 0;
      const totalWinnings = participations?.reduce((sum, p) => sum + (p.earnings || 0), 0) || 0;
      const winRate = totalGames > 0 ? (wins / totalGames) * 100 : 0;

      return {
        totalGames,
        wins,
        totalWinnings,
        winRate,
        period
      };
    } catch (error) {
      console.error('Error fetching user game stats by period:', error);
      throw error;
    }
  }
};

// Avatar operations
export const avatarService = {
  checkSession: async () => {
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      logger.error("Error getting session:", error);
      return;
    }

    if (!data.session) {
      logger.info("No active session found. The user is not logged in.");
    } else {
      logger.info("Active session found:", data.session);
      logger.info("User ID from session:", data.session.user.id);
    }
  },
  async uploadAvatar(file: File): Promise<string> {
    try {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error('File must be an image');
      }

      // Validate file size (max 5MB)
      if (file.size > 2 * 1024 * 1024) {
        throw new Error('File size must be less than 2MB');
      }
      await this.checkSession();

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatar.${fileExt}`;
      logger.info(`Uploading avatar to Supabase Storage: ${fileName}`);
      // Upload file to Supabase Storage
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true // This allows overwriting existing avatars
        });

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading avatar:', error);
      throw error;
    }
  },

  async updateProfileAvatar(userId: string, file: File): Promise<string> {
    try {
      // Upload the new avatar
      const avatarUrl = await this.uploadAvatar(file);

      // Update the profile with the new avatar URL
      await profileService.updateProfile(userId, { avatar_url: avatarUrl });

      return avatarUrl;
    } catch (error) {
      console.error('Error updating profile avatar:', error);
      throw error;
    }
  },

  deleteAvatar: async (userId: string): Promise<void> => {
    try {
      const { data: files } = await supabase.storage.from('avatars').list(userId);
      if (files && files.length > 0) {
        const fileToDelete = files.find((f) => f.name.startsWith('avatar.'));
        if (fileToDelete) {
          const { error } = await supabase.storage.from('avatars').remove([`${userId}/${fileToDelete.name}`]);
          if (error) {
            logger.error('Error deleting avatar:', error);
            throw error;
          }
        }
      }
    } catch (error) {
      logger.error('Error deleting avatar:', error);
      throw error;
    }
  }

};