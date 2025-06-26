
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

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

  async createRoom(roomData: {
    name: string;
    game_id: string;
    host_id: string;
    entry_fee: number;
    max_players: number;
    currency?: Database['public']['Enums']['currency_type'];
    is_private?: boolean;
  }) {
    const { data, error } = await supabase
      .from('game_rooms')
      .insert({
        name: roomData.name,
        game_id: roomData.game_id,
        host_id: roomData.host_id,
        entry_fee: roomData.entry_fee,
        max_players: roomData.max_players,
        currency: roomData.currency || 'USDC',
        is_private: roomData.is_private || false
      })
      .select()
      .single();
    
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
