/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-explicit-any */
// @ts-nocheck

import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useWallet } from '@/contexts/WalletContext';
import { useTransaction } from '@/contexts/TransactionContext';

interface GameRoom {
  id: string;
  name: string;
  game_id: string;
  game_instance_id: string | null;
  creator_id: string;
  entry_fee: number;
  currency: 'USDC' | 'USDT' | 'NGN';
  max_players: number;
  current_players: number;
  min_players_to_start: number;
  is_private: boolean;
  room_code: string | null;
  is_sponsored: boolean;
  sponsor_amount: number;
  winner_split_rule: string;
  status: 'waiting' | 'starting' | 'ongoing' | 'completed' | 'cancelled';
  start_time: string;
  end_time: string;
  actual_start_time: string | null;
  actual_end_time: string | null;
  total_prize_pool: number;
  platform_fee_collected: number;
  created_at: string;
  updated_at: string;
  game?: any;
  creator?: any;
  participants?: GameRoomParticipant[];
}

interface GameRoomParticipant {
  id: string;
  room_id: string;
  user_id: string;
  wallet_id: string;
  entry_transaction_id: string | null;
  payment_currency: 'USDC' | 'USDT' | 'NGN';
  payment_amount: number;
  score: number;
  final_position: number | null;
  earnings: number;
  payout_transaction_id: string | null;
  joined_at: string;
  left_at: string | null;
  is_active: boolean;
  user?: any;
}

interface CreateRoomData {
  name: string;
  gameId: string;
  entryFee: number;
  currency: 'USDC' | 'USDT' | 'NGN';
  maxPlayers: number;
  isPrivate: boolean;
  winnerSplitRule: string;
  startTime: Date;
  endTime: Date;
  isSponsored?: boolean;
  sponsorAmount?: number;
}

interface GameRoomContextType {
  rooms: GameRoom[];
  loading: boolean;
  creating: boolean;
  joining: boolean;
  refreshRooms: () => Promise<void>;
  createRoom: (data: CreateRoomData) => Promise<GameRoom>;
  joinRoom: (roomId: string, roomCode?: string) => Promise<void>;
  leaveRoom: (roomId: string) => Promise<void>;
  cancelRoom: (roomId: string) => Promise<void>;
  getRoomDetails: (roomId: string) => Promise<GameRoom | null>;
  getRoomParticipants: (roomId: string) => Promise<GameRoomParticipant[]>;
  updateGameScore: (roomId: string, score: number) => Promise<void>;
  completeGame: (roomId: string, winners: { userId: string; position: number }[]) => Promise<void>;
}

const GameRoomContext = createContext<GameRoomContextType | undefined>(undefined);

export const useGameRoom = () => {
  const context = useContext(GameRoomContext);
  if (context === undefined) {
    throw new Error('useGameRoom must be used within a GameRoomProvider');
  }
  return context;
};

export const GameRoomProvider = ({ children }: { children: React.ReactNode }) => {
  const [rooms, setRooms] = useState<GameRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const { wallets, refreshWallets } = useWallet();
  const { refreshTransactions } = useTransaction();

  // Fetch all public rooms and user's private rooms
  const fetchRooms = async () => {
    try {
      // First, update room statuses based on time
      await updateRoomStatuses();
      
      const { data, error } = await supabase
        .from('game_rooms')
        .select(`
          *,
          game:games(*),
          creator:profiles(*),
          participants:game_room_participants(*)
        `)
        .or('is_private.eq.false,creator_id.eq.' + user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRooms(data || []);
    } catch (error) {
      console.error('Error fetching rooms:', error);
      toast({
        title: "Error",
        description: "Failed to fetch game rooms",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Update room statuses based on time
  const updateRoomStatuses = async () => {
    try {
      const now = new Date().toISOString();
      
      // Get rooms that need status updates
      const { data: roomsToUpdate } = await supabase
        .from('game_rooms')
        .select('id, status, start_time, end_time, current_players, min_players_to_start')
        .in('status', ['waiting', 'ongoing']);

      if (!roomsToUpdate) return;

      for (const room of roomsToUpdate) {
        let newStatus = room.status;
        let updates: any = {};

        const startTime = new Date(room.start_time);
        const endTime = new Date(room.end_time);
        const currentTime = new Date();

        // Check if room should be ongoing (only if enough players)
        if (room.status === 'waiting' && currentTime >= startTime && room.current_players >= room.min_players_to_start) {
          newStatus = 'ongoing';
          updates = {
            status: 'ongoing',
            actual_start_time: now
          };
        }
        
        // Check if room should be completed
        if ((room.status === 'ongoing' || room.status === 'waiting') && currentTime >= endTime) {
          newStatus = 'completed';
          updates = {
            status: 'completed',
            actual_end_time: now
          };
        }

        // Update if status changed
        if (newStatus !== room.status) {
          await supabase
            .from('game_rooms')
            .update(updates)
            .eq('id', room.id);
        }
      }
    } catch (error) {
      console.error('Error updating room statuses:', error);
    }
  };

  const refreshRooms = async () => {
    await fetchRooms();
  };

  // Create a new game room
  const createRoom = async (data: CreateRoomData): Promise<GameRoom> => {
    if (!user) throw new Error('User not authenticated');

    setCreating(true);
    try {
      // For sponsored rooms, check sponsor balance
      if (data.isSponsored) {
        const wallet = wallets.find(w => w.currency === data.currency);
        if (!wallet || (wallet.balance || 0) < (data.sponsorAmount || 0)) {
          throw new Error(`Insufficient ${data.currency} balance for sponsorship`);
        }
      }

      // Create game instance first
      const { data: instanceData, error: instanceError } = await supabase
        .from('game_instances')
        .insert({
          game_id: data.gameId,
          instance_data: {}
        })
        .select()
        .single();

      if (instanceError) {
        console.error('Game instance error:', instanceError);
        throw new Error(instanceError.message || 'Failed to create game instance');
      }

      // Generate room code for private rooms
      const roomCode = data.isPrivate ? Math.random().toString(36).substring(2, 8).toUpperCase() : null;

      // Create the room
      const { data: roomData, error: roomError } = await supabase
        .from('game_rooms')
        .insert({
          name: data.name,
          game_id: data.gameId,
          game_instance_id: instanceData.id,
          creator_id: user.id,
          entry_fee: data.isSponsored ? 0 : data.entryFee,
          currency: data.currency,
          max_players: data.maxPlayers,
          is_private: data.isPrivate,
          room_code: roomCode,
          winner_split_rule: data.winnerSplitRule,
          start_time: data.startTime.toISOString(),
          end_time: data.endTime.toISOString(),
          is_sponsored: data.isSponsored || false,
          sponsor_amount: data.sponsorAmount || 0,
          total_prize_pool: data.isSponsored ? (data.sponsorAmount || 0) : 0,
          min_players_to_start: 2 // Default minimum players
        })
        .select()
        .single();

      if (roomError) {
        console.error('Room creation error:', roomError);
        throw new Error(roomError.message || 'Failed to create room');
      }

      // Update game instance with room_id
      await supabase
        .from('game_instances')
        .update({ room_id: roomData.id })
        .eq('id', instanceData.id);

      // Get the wallet for transactions
      const wallet = wallets.find(w => w.currency === data.currency);
      if (!wallet) throw new Error('Wallet not found');

      // Handle payment and auto-join for creator
      if (data.isSponsored && data.sponsorAmount) {
        // Create sponsor transaction
        const { data: sponsorTx } = await supabase
          .from('transactions')
          .insert({
            user_id: user.id,
            room_id: roomData.id,
            type: 'fee',
            amount: data.sponsorAmount,
            currency: data.currency,
            status: 'completed',
            description: `Sponsorship for room: ${data.name}`
          })
          .select()
          .single();

        // Update wallet balance for sponsorship
        await supabase
          .from('wallets')
          .update({ 
            balance: (wallet.balance || 0) - data.sponsorAmount,
            updated_at: new Date().toISOString()
          })
          .eq('id', wallet.id);
      } else if (data.entryFee > 0) {
        // For non-sponsored rooms, creator pays entry fee
        const { data: entryTx } = await supabase
          .from('transactions')
          .insert({
            user_id: user.id,
            room_id: roomData.id,
            type: 'fee',
            amount: data.entryFee,
            currency: data.currency,
            status: 'completed',
            description: `Entry fee for room: ${data.name} (Creator)`
          })
          .select()
          .single();

        // Update wallet balance for entry fee
        await supabase
          .from('wallets')
          .update({ 
            balance: (wallet.balance || 0) - data.entryFee,
            updated_at: new Date().toISOString()
          })
          .eq('id', wallet.id);

        // Auto-join creator as first participant
        await supabase
          .from('game_room_participants')
          .insert({
            room_id: roomData.id,
            user_id: user.id,
            wallet_id: wallet.id,
            entry_transaction_id: entryTx.id,
            payment_currency: data.currency,
            payment_amount: data.entryFee,
            is_active: true
          });

        // Update room's current_players count and prize pool
        await supabase
          .from('game_rooms')
          .update({ 
            current_players: 1,
            total_prize_pool: data.entryFee
          })
          .eq('id', roomData.id);
      } else {
        // Free room (sponsored with 0 entry fee) - just join creator
        await supabase
          .from('game_room_participants')
          .insert({
            room_id: roomData.id,
            user_id: user.id,
            wallet_id: wallet.id,
            entry_transaction_id: null,
            payment_currency: data.currency,
            payment_amount: 0,
            is_active: true
          });

        // Update room's current_players count
        await supabase
          .from('game_rooms')
          .update({ 
            current_players: 1
          })
          .eq('id', roomData.id);
      }

      await refreshRooms();
      await refreshWallets();
      await refreshTransactions();
      
      toast({
        title: "Success",
        description: "Game room created successfully",
      });

      return roomData;
    } catch (error: any) {
      console.error('Error creating room:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create game room",
        variant: "destructive",
      });
      throw error;
    } finally {
      setCreating(false);
    }
  };

  // Join a game room
  const joinRoom = async (roomId: string, roomCode?: string) => {
    if (!user) throw new Error('User not authenticated');

    setJoining(true);
    try {
      // Get room details
      const { data: room, error: roomError } = await supabase
        .from('game_rooms')
        .select('*')
        .eq('id', roomId)
        .single();

      if (roomError) throw roomError;

      // Check if room is private and verify code
      if (room.is_private && room.room_code !== roomCode) {
        throw new Error('Invalid room code');
      }

      // Check if room is full
      if (room.current_players >= room.max_players) {
        throw new Error('Room is full');
      }

      // Check if user has sufficient balance (only for non-sponsored rooms)
      const wallet = wallets.find(w => w.currency === room.currency);
      if (!room.is_sponsored && (!wallet || (wallet.balance || 0) < room.entry_fee)) {
        throw new Error(`Insufficient ${room.currency} balance`);
      }

      // Create entry fee transaction (only for non-sponsored rooms)
      let transaction = null;
      if (!room.is_sponsored && room.entry_fee > 0) {
        const { data: txData, error: txError } = await supabase
          .from('transactions')
          .insert({
            user_id: user.id,
            room_id: roomId,
            type: 'fee',
            amount: room.entry_fee,
            currency: room.currency,
            status: 'completed',
            description: `Entry fee for room: ${room.name}`
          })
          .select()
          .single();

        if (txError) throw txError;
        transaction = txData;
      }

      // Join the room
      const { error: joinError } = await supabase
        .from('game_room_participants')
        .insert({
          room_id: roomId,
          user_id: user.id,
          wallet_id: wallet?.id || null,
          entry_transaction_id: transaction?.id || null,
          payment_currency: room.currency,
          payment_amount: room.is_sponsored ? 0 : room.entry_fee
        });

      if (joinError) throw joinError;

      // Update wallet balance (only for non-sponsored rooms)
      if (!room.is_sponsored && room.entry_fee > 0 && wallet) {
        await supabase
          .from('wallets')
          .update({ 
            balance: (wallet.balance || 0) - room.entry_fee,
            updated_at: new Date().toISOString()
          })
          .eq('id', wallet.id);
      }

      await refreshWallets();
      await refreshTransactions();
      await refreshRooms();

      toast({
        title: "Success",
        description: "Joined room successfully",
      });
    } catch (error: any) {
      console.error('Error joining room:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to join room",
        variant: "destructive",
      });
      throw error;
    } finally {
      setJoining(false);
    }
  };

  // Leave a game room
  const leaveRoom = async (roomId: string) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const { error } = await supabase
        .from('game_room_participants')
        .update({ 
          is_active: false,
          left_at: new Date().toISOString()
        })
        .eq('room_id', roomId)
        .eq('user_id', user.id);

      if (error) throw error;

      await refreshRooms();

      toast({
        title: "Success",
        description: "Left room successfully",
      });
    } catch (error) {
      console.error('Error leaving room:', error);
      toast({
        title: "Error",
        description: "Failed to leave room",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Cancel a room (creator only)
  const cancelRoom = async (roomId: string) => {
    if (!user) throw new Error('User not authenticated');

    try {
      // Get room and participants
      const { data: room, error: roomError } = await supabase
        .from('game_rooms')
        .select(`
          *,
          participants:game_room_participants(*)
        `)
        .eq('id', roomId)
        .single();

      if (roomError) throw roomError;

      if (room.creator_id !== user.id) {
        throw new Error('Only room creator can cancel');
      }

      if (room.status !== 'waiting') {
        throw new Error('Can only cancel rooms in waiting status');
      }

      // Refund all participants
      for (const participant of room.participants) {
        if (participant.payment_amount > 0) {
          // Create refund transaction
          await supabase
            .from('transactions')
            .insert({
              user_id: participant.user_id,
              room_id: roomId,
              type: 'deposit',
              amount: participant.payment_amount,
              currency: participant.payment_currency,
              status: 'completed',
              description: `Refund for cancelled room: ${room.name}`
            });

          // Update wallet balance
          await supabase
            .from('wallets')
            .update({ 
              balance: supabase.raw('balance + ?', [participant.payment_amount])
            })
            .eq('id', participant.wallet_id);
        }
      }

      // Update room status
      await supabase
        .from('game_rooms')
        .update({ 
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', roomId);

      await refreshRooms();
      await refreshWallets();
      await refreshTransactions();

      toast({
        title: "Success",
        description: "Room cancelled and participants refunded",
      });
    } catch (error: any) {
      console.error('Error cancelling room:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to cancel room",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Get room details
  const getRoomDetails = async (roomId: string): Promise<GameRoom | null> => {
    try {
      const { data, error } = await supabase
        .from('game_rooms')
        .select(`
          *,
          game:games(*),
          creator:profiles(*),
          participants:game_room_participants(
            *,
            user:profiles(*)
          )
        `)
        .eq('id', roomId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching room details:', error);
      return null;
    }
  };

  // Get room participants
  const getRoomParticipants = async (roomId: string): Promise<GameRoomParticipant[]> => {
    try {
      const { data, error } = await supabase
        .from('game_room_participants')
        .select(`
          *,
          user:profiles(*)
        `)
        .eq('room_id', roomId)
        .eq('is_active', true)
        .order('score', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching participants:', error);
      return [];
    }
  };

  // Update game score
  const updateGameScore = async (roomId: string, score: number) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const { error } = await supabase
        .from('game_room_participants')
        .update({ score })
        .eq('room_id', roomId)
        .eq('user_id', user.id);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating score:', error);
      throw error;
    }
  };

  // Complete game and distribute winnings
  const completeGame = async (roomId: string, winners: { userId: string; position: number }[]) => {
    try {
      // Get room details
      const { data: room, error: roomError } = await supabase
        .from('game_rooms')
        .select('*')
        .eq('id', roomId)
        .single();

      if (roomError) throw roomError;

      // Calculate platform fee (10%)
      const platformFee = room.total_prize_pool * 0.1;
      const distributablePrize = room.total_prize_pool - platformFee;

      // Get winner split percentages
      const { data: splits, error: splitsError } = await supabase
        .rpc('calculate_winner_splits', { rule: room.winner_split_rule });

      if (splitsError) throw splitsError;

      // Update participant positions and calculate earnings
      for (const winner of winners) {
        const split = splits.find((s: any) => s.winner_position === winner.position);
        if (split) {
          const earnings = distributablePrize * (split.prize_percentage / 100);

          // Update participant
          const { data: participant, error: pError } = await supabase
            .from('game_room_participants')
            .update({
              final_position: winner.position,
              earnings: earnings
            })
            .eq('room_id', roomId)
            .eq('user_id', winner.userId)
            .select()
            .single();

          if (pError) throw pError;

          // Create winning transaction
          const { data: transaction, error: txError } = await supabase
            .from('transactions')
            .insert({
              user_id: winner.userId,
              room_id: roomId,
              type: 'win',
              amount: earnings,
              currency: room.currency,
              status: 'completed',
              description: `Winnings from room: ${room.name} (Position: ${winner.position})`
            })
            .select()
            .single();

          if (txError) throw txError;

          // Update wallet balance
          await supabase
            .from('wallets')
            .update({
              balance: supabase.raw('balance + ?', [earnings])
            })
            .eq('user_id', winner.userId)
            .eq('currency', room.currency);

          // Update payout transaction id
          await supabase
            .from('game_room_participants')
            .update({ payout_transaction_id: transaction.id })
            .eq('id', participant.id);

          // Record in winners table
          await supabase
            .from('game_room_winners')
            .insert({
              room_id: roomId,
              participant_id: participant.id,
              position: winner.position,
              prize_percentage: split.prize_percentage,
              prize_amount: earnings
            });
        }
      }

      // Update room status
      await supabase
        .from('game_rooms')
        .update({
          status: 'completed',
          actual_end_time: new Date().toISOString(),
          platform_fee_collected: platformFee
        })
        .eq('id', roomId);

      // Update leaderboards
      for (const participant of winners) {
        // Update global leaderboard
        await supabase.rpc('update_leaderboard', {
          p_user_id: participant.userId,
          p_game_id: room.game_id,
          p_won: winners.findIndex(w => w.userId === participant.userId) === 0,
          p_earnings: participant.position <= winners.length ? 
            distributablePrize * (splits.find((s: any) => s.winner_position === participant.position)?.prize_percentage || 0) / 100 : 0
        });
      }

      // Update user profiles
      for (const winner of winners) {
        if (winner.position === 1) {
          await supabase.rpc('increment_user_stats', {
            p_user_id: winner.userId,
            p_games_played: 1,
            p_wins: 1,
            p_earnings: distributablePrize * (splits[0]?.prize_percentage || 0) / 100
          });
        }
      }

      await refreshRooms();
      await refreshWallets();
      await refreshTransactions();

      toast({
        title: "Success",
        description: "Game completed and winnings distributed",
      });
    } catch (error) {
      console.error('Error completing game:', error);
      toast({
        title: "Error",
        description: "Failed to complete game",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Load rooms when user changes
  useEffect(() => {
    if (user) {
      fetchRooms();
    } else {
      setRooms([]);
      setLoading(false);
    }
  }, [user]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!user) return;

    const roomsSubscription = supabase
      .channel('game_rooms_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'game_rooms'
      }, () => {
        fetchRooms();
      })
      .subscribe();

    const participantsSubscription = supabase
      .channel('participants_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'game_room_participants'
      }, () => {
        fetchRooms();
      })
      .subscribe();

    return () => {
      roomsSubscription.unsubscribe();
      participantsSubscription.unsubscribe();
    };
  }, [user]);

  const value = {
    rooms,
    loading,
    creating,
    joining,
    refreshRooms,
    createRoom,
    joinRoom,
    leaveRoom,
    cancelRoom,
    getRoomDetails,
    getRoomParticipants,
    updateGameScore,
    completeGame,
  };

  return <GameRoomContext.Provider value={value}>{children}</GameRoomContext.Provider>;
};