/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useAuth } from '@/contexts/AuthContext';
import { Database, ChatRoom, ChatMessage, Friend } from '@/integrations/supabase/types';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

type SupabaseClient = ReturnType<typeof createClient<Database>>;

interface CommunityChatContextType {
  // Chat Rooms
  chatRooms: ChatRoom[];
  currentRoom: ChatRoom | null;
  loadingRooms: boolean;
  createChatRoom: (roomData: {
    name: string;
    description?: string;
    avatar_emoji: string;
    avatar_color: string;
    is_private: boolean;
    game_id?: string;
  }) => Promise<ChatRoom>;
  joinChatRoom: (roomId: string) => Promise<void>;
  leaveChatRoom: (roomId: string) => Promise<void>;
  setCurrentRoom: (room: ChatRoom | null) => void;
  addUserToRoom: (roomId: string, username: string) => Promise<void>;
  removeUserFromRoom: (roomId: string, userId: string) => Promise<void>;
  getRoomMembers: (roomId: string) => Promise<any[]>;
  
  // Messages
  messages: ChatMessage[];
  loadingMessages: boolean;
  sendMessage: (content: string, roomId?: string, receiverId?: string) => Promise<void>;
  
  // Friends
  friends: Friend[];
  friendRequests: Friend[];
  loadingFriends: boolean;
  sendFriendRequest: (username: string) => Promise<void>;
  acceptFriendRequest: (requestId: string) => Promise<void>;
  declineFriendRequest: (requestId: string) => Promise<void>;
  
  // Online Status
  onlineUsers: Set<string>;
  updateOnlineStatus: (isOnline: boolean) => Promise<void>;
  
  // Search
  searchUsers: (query: string) => Promise<any[]>;
}

const CommunityChatContext = createContext<CommunityChatContextType | undefined>(undefined);

export const useCommunityChatContext = () => {
  const context = useContext(CommunityChatContext);
  if (!context) {
    throw new Error('useCommunityChatContext must be used within a CommunityChatProvider');
  }
  return context;
};

interface CommunityChatProviderProps {
  children: React.ReactNode;
  // supabase: SupabaseClient;
}

export const CommunityChatProvider: React.FC<CommunityChatProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // State
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [currentRoom, setCurrentRoom] = useState<ChatRoom | null>(null);
  const [loadingRooms, setLoadingRooms] = useState(false);
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendRequests, setFriendRequests] = useState<Friend[]>([]);
  const [loadingFriends, setLoadingFriends] = useState(false);
  
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

  // Load chat rooms
  const loadChatRooms = useCallback(async () => {
    if (!user) return;
    
    setLoadingRooms(true);
    try {
      // Use the custom function to avoid RLS recursion
      const { data: roomsData, error: roomsError } = await supabase
        .rpc('get_user_rooms', { user_uuid: user.id });

      if (roomsError) throw roomsError;

      // For each room, fetch creator, game, and members info separately
      const roomsWithDetails = await Promise.all(
        (roomsData || []).map(async (room) => {
          // Get creator info
          const { data: creator } = await supabase
            .from('profiles')
            .select('id, username, display_name, avatar_url')
            .eq('id', room.creator_id)
            .single();

          // Get game info if game_id exists
          let game = null;
          if (room.game_id) {
            const { data: gameData } = await supabase
              .from('games')
              .select('id, name, image_url')
              .eq('id', room.game_id)
              .single();
            game = gameData;
          }

          // Get members info
          const { data: membersData } = await supabase
            .from('chat_room_members')
            .select(`
              id,
              role,
              user:profiles!user_id(id, username, display_name, avatar_url, is_online)
            `)
            .eq('room_id', room.id);

          return {
            ...room,
            creator,
            game,
            members: membersData || []
          };
        })
      );

      setChatRooms(roomsWithDetails);
    } catch (error) {
      console.error('Error loading chat rooms:', error);
      toast({
        title: "Error",
        description: "Failed to load chat rooms",
        variant: "destructive",
      });
    } finally {
      setLoadingRooms(false);
    }
  }, [user, supabase, toast]);

  // Load messages for current room
  const loadMessages = useCallback(async (roomId: string) => {
    if (!user) return;
    
    setLoadingMessages(true);
    try {
      // Use the custom function to get messages
      const { data: messagesData, error: messagesError } = await supabase
        .rpc('get_room_messages', { 
          room_uuid: roomId, 
          user_uuid: user.id 
        });

      if (messagesError) throw messagesError;

      // For each message, get sender info separately
      const messagesWithSenders = await Promise.all(
        (messagesData || []).map(async (msg) => {
          const { data: sender } = await supabase
            .from('profiles')
            .select('id, username, display_name, avatar_url')
            .eq('id', msg.sender_id)
            .single();

          let receiver = null;
          if (msg.receiver_id) {
            const { data: receiverData } = await supabase
              .from('profiles')
              .select('id, username, display_name, avatar_url')
              .eq('id', msg.receiver_id)
              .single();
            receiver = receiverData;
          }

          return {
            ...msg,
            sender,
            receiver
          };
        })
      );

      setMessages(messagesWithSenders);
    } catch (error) {
      console.error('Error loading messages:', error);
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "destructive",
      });
    } finally {
      setLoadingMessages(false);
    }
  }, [user, supabase, toast]);

  // Load friends
  const loadFriends = useCallback(async () => {
    if (!user) return;
    
    setLoadingFriends(true);
    try {
      // Load accepted friends
      const { data: friendsData, error: friendsError } = await supabase
        .from('friends')
        .select(`
          *,
          requester:profiles!requester_id(id, username, display_name, avatar_url, is_online),
          addressee:profiles!addressee_id(id, username, display_name, avatar_url, is_online)
        `)
        .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
        .eq('status', 'accepted');

      if (friendsError) throw friendsError;
      setFriends(friendsData || []);

      // Load pending friend requests (received)
      const { data: requestsData, error: requestsError } = await supabase
        .from('friends')
        .select(`
          *,
          requester:profiles!requester_id(id, username, display_name, avatar_url),
          addressee:profiles!addressee_id(id, username, display_name, avatar_url)
        `)
        .eq('addressee_id', user.id)
        .eq('status', 'pending');

      if (requestsError) throw requestsError;
      setFriendRequests(requestsData || []);
    } catch (error) {
      console.error('Error loading friends:', error);
      toast({
        title: "Error",
        description: "Failed to load friends",
        variant: "destructive",
      });
    } finally {
      setLoadingFriends(false);
    }
  }, [user, supabase, toast]);

  // Create chat room
  const createChatRoom = async (roomData: {
    name: string;
    description?: string;
    avatar_emoji: string;
    avatar_color: string;
    is_private: boolean;
    game_id?: string;
  }): Promise<ChatRoom> => {
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('chat_rooms')
      .insert({
        ...roomData,
        creator_id: user.id,
      })
      .select(`
        *,
        creator:profiles!creator_id(id, username, display_name, avatar_url),
        game:games(id, name, image_url)
      `)
      .single();

    if (error) throw error;

    await loadChatRooms();
    
    toast({
      title: "Success",
      description: "Chat room created successfully!",
    });

    return data;
  };

  // Update online status
  const updateOnlineStatus = async (isOnline: boolean) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          is_online: isOnline,
          last_seen: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating online status:', error);
    }
  };

  // Search users
  const searchUsers = async (query: string) => {
    if (!query.trim()) return [];

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url, is_online')
        .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
        .neq('id', user?.id)
        .limit(10);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error searching users:', error);
      return [];
    }
  };

  // Join chat room
  const joinChatRoom = async (roomId: string) => {
    if (!user) return;

    try {
      // First check if user is already a member
      const { data: existingMember, error: checkError } = await supabase
        .from('chat_room_members')
        .select('id')
        .eq('room_id', roomId)
        .eq('user_id', user.id)
        .single();

      // If user is already a member, just return success
      if (existingMember) {
        toast({
          title: "Already a member",
          description: "You're already a member of this room!",
        });
        return;
      }

      // If not a member, add them
      const { error } = await supabase
        .from('chat_room_members')
        .insert({
          room_id: roomId,
          user_id: user.id,
          role: 'member',
        });

      if (error) throw error;

      await loadChatRooms();
      
      toast({
        title: "Success",
        description: "Joined chat room successfully!",
      });
    } catch (error: any) {
      console.error('Error joining room:', error);
      // Don't show error if it's just a duplicate key (user already member)
      if (error.code !== '23505') {
        toast({
          title: "Error",
          description: error.message || "Failed to join chat room",
          variant: "destructive",
        });
      }
    }
  };

  // Leave chat room
  const leaveChatRoom = async (roomId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('chat_room_members')
        .delete()
        .eq('room_id', roomId)
        .eq('user_id', user.id);

      if (error) throw error;

      await loadChatRooms();
      
      if (currentRoom?.id === roomId) {
        setCurrentRoom(null);
        setMessages([]);
      }
      
      toast({
        title: "Success",
        description: "Left chat room successfully!",
      });
    } catch (error: any) {
      console.error('Error leaving room:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to leave chat room",
        variant: "destructive",
      });
    }
  };

  // Send message
  const sendMessage = async (content: string, roomId?: string, receiverId?: string) => {
    if (!user) return;
    if (!content.trim()) return;

    try {
      const messageData: any = {
        content: content.trim(),
        sender_id: user.id,
        message_type: 'text',
      };

      if (roomId) {
        messageData.room_id = roomId;
      } else if (receiverId) {
        messageData.receiver_id = receiverId;
      } else {
        throw new Error('Either roomId or receiverId must be provided');
      }

      const { data, error } = await supabase
        .from('chat_messages')
        .insert(messageData)
        .select('*')
        .single();

      if (error) throw error;

      // Immediately add the message to local state for instant display
      if (roomId && currentRoom?.id === roomId) {
        const newMessage = {
          ...data,
          sender: {
            id: user.id,
            username: user.user_metadata?.username || user.email?.split('@')[0] || 'Unknown',
            display_name: user.user_metadata?.display_name || null,
            avatar_url: user.user_metadata?.avatar_url || null
          },
          receiver: null
        };
        
        setMessages(prev => [...prev, newMessage]);
      }
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive",
      });
      throw error; // Re-throw so the UI can handle it
    }
  };

  // Send friend request
  const sendFriendRequest = async (username: string) => {
    if (!user) return;

    try {
      // First find the user by username
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', username)
        .single();

      if (userError || !userData) {
        throw new Error('User not found');
      }

      if (userData.id === user.id) {
        throw new Error('Cannot send friend request to yourself');
      }

      // Check if request already exists
      const { data: existingRequest } = await supabase
        .from('friends')
        .select('id')
        .or(`and(requester_id.eq.${user.id},addressee_id.eq.${userData.id}),and(requester_id.eq.${userData.id},addressee_id.eq.${user.id})`)
        .single();

      if (existingRequest) {
        throw new Error('Friend request already exists or you are already friends');
      }

      const { error } = await supabase
        .from('friends')
        .insert({
          requester_id: user.id,
          addressee_id: userData.id,
          status: 'pending',
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Friend request sent successfully!",
      });
    } catch (error: any) {
      console.error('Error sending friend request:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to send friend request",
        variant: "destructive",
      });
    }
  };

  // Accept friend request
  const acceptFriendRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('friends')
        .update({ status: 'accepted' })
        .eq('id', requestId);

      if (error) throw error;

      await loadFriends();
      
      toast({
        title: "Success",
        description: "Friend request accepted!",
      });
    } catch (error: any) {
      console.error('Error accepting friend request:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to accept friend request",
        variant: "destructive",
      });
    }
  };

  // Decline friend request
  const declineFriendRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('friends')
        .update({ status: 'declined' })
        .eq('id', requestId);

      if (error) throw error;

      await loadFriends();
      
      toast({
        title: "Success",
        description: "Friend request declined",
      });
    } catch (error: any) {
      console.error('Error declining friend request:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to decline friend request",
        variant: "destructive",
      });
    }
  };

  // Add user to room (for room creators/admins)
  const addUserToRoom = async (roomId: string, username: string) => {
    if (!user) return;

    try {
      // First find the user by username
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', username)
        .single();

      if (userError || !userData) {
        throw new Error('User not found');
      }

      // Check if current user can add members (creator or admin)
      const { data: memberData, error: memberError } = await supabase
        .from('chat_room_members')
        .select('role')
        .eq('room_id', roomId)
        .eq('user_id', user.id)
        .single();

      const { data: roomData, error: roomError } = await supabase
        .from('chat_rooms')
        .select('creator_id')
        .eq('id', roomId)
        .single();

      if (roomError || !roomData) {
        throw new Error('Room not found');
      }

      const isCreator = roomData.creator_id === user.id;
      const isAdmin = memberData?.role === 'admin';

      if (!isCreator && !isAdmin) {
        throw new Error('You do not have permission to add members to this room');
      }

      // Check if user is already a member
      const { data: existingMember } = await supabase
        .from('chat_room_members')
        .select('id')
        .eq('room_id', roomId)
        .eq('user_id', userData.id)
        .single();

      if (existingMember) {
        throw new Error('User is already a member of this room');
      }

      // Add the user
      const { error } = await supabase
        .from('chat_room_members')
        .insert({
          room_id: roomId,
          user_id: userData.id,
          role: 'member',
        });

      if (error) throw error;

      await loadChatRooms();
      
      toast({
        title: "Success",
        description: `${username} has been added to the room!`,
      });
    } catch (error: any) {
      console.error('Error adding user to room:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add user to room",
        variant: "destructive",
      });
    }
  };

  // Remove user from room (for room creators/admins)
  const removeUserFromRoom = async (roomId: string, userId: string) => {
    if (!user) return;

    try {
      // Check if current user can remove members (creator or admin)
      const { data: memberData, error: memberError } = await supabase
        .from('chat_room_members')
        .select('role')
        .eq('room_id', roomId)
        .eq('user_id', user.id)
        .single();

      const { data: roomData, error: roomError } = await supabase
        .from('chat_rooms')
        .select('creator_id')
        .eq('id', roomId)
        .single();

      if (roomError || !roomData) {
        throw new Error('Room not found');
      }

      const isCreator = roomData.creator_id === user.id;
      const isAdmin = memberData?.role === 'admin';

      if (!isCreator && !isAdmin) {
        throw new Error('You do not have permission to remove members from this room');
      }

      // Don't allow removing the creator
      if (userId === roomData.creator_id) {
        throw new Error('Cannot remove the room creator');
      }

      const { error } = await supabase
        .from('chat_room_members')
        .delete()
        .eq('room_id', roomId)
        .eq('user_id', userId);

      if (error) throw error;

      await loadChatRooms();
      
      toast({
        title: "Success",
        description: "User has been removed from the room",
      });
    } catch (error: any) {
      console.error('Error removing user from room:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to remove user from room",
        variant: "destructive",
      });
    }
  };

  // Get room members (for displaying in UI)
  const getRoomMembers = useCallback(async (roomId: string) => {
    try {
      const { data, error } = await supabase
        .from('chat_room_members')
        .select(`
          id,
          role,
          joined_at,
          user:profiles!user_id(id, username, display_name, avatar_url, is_online)
        `)
        .eq('room_id', roomId);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching room members:', error);
      return [];
    }
  }, [supabase]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!user) return;

    // Subscribe to chat room changes
    const roomsSubscription = supabase
      .channel('chat_rooms_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'chat_rooms' },
        () => loadChatRooms()
      )
      .subscribe();

    // Subscribe to friend changes
    const friendsSubscription = supabase
      .channel('friends_changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'friends' },
        () => loadFriends()
      )
      .subscribe();

    return () => {
      roomsSubscription.unsubscribe();
      friendsSubscription.unsubscribe();
    };
  }, [user, supabase, loadChatRooms, loadFriends]);

  // Separate subscription for messages when room changes
  useEffect(() => {
    if (!user || !currentRoom) return;

    // Subscribe to messages for current room
    const messagesSubscription = supabase
      .channel(`messages_${currentRoom.id}`)
      .on('postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'chat_messages',
          filter: `room_id=eq.${currentRoom.id}`
        },
        async (payload) => {
          // Only add if it's not our own message (to avoid duplicates)
          if (payload.new.sender_id !== user.id) {
            // Fetch the complete message data with sender info
            const { data: senderData } = await supabase
              .from('profiles')
              .select('id, username, display_name, avatar_url')
              .eq('id', payload.new.sender_id)
              .single();

            const newMessage = {
              ...payload.new,
              sender: senderData,
              receiver: null
            };

            setMessages(prev => [...prev, newMessage]);
          }
        }
      )
      .subscribe();

    return () => {
      messagesSubscription.unsubscribe();
    };
  }, [user, currentRoom, supabase]);

  // Separate subscription for online presence
  useEffect(() => {
    if (!user) return;

    const presenceSubscription = supabase
      .channel('online_users')
      .on('presence', { event: 'sync' }, () => {
        const state = presenceSubscription.presenceState();
        setOnlineUsers(new Set(Object.keys(state)));
      })
      .on('presence', { event: 'join' }, ({ key }) => {
        setOnlineUsers(prev => new Set([...prev, key]));
      })
      .on('presence', { event: 'leave' }, ({ key }) => {
        setOnlineUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(key);
          return newSet;
        });
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceSubscription.track({ user_id: user.id });
        }
      });

    return () => {
      presenceSubscription.unsubscribe();
    };
  }, [user, supabase]);

  // Load initial data
  useEffect(() => {
    if (user) {
      loadChatRooms();
      loadFriends();
      updateOnlineStatus(true);
    }
  }, [user, loadChatRooms, loadFriends]);

  // Load messages when current room changes
  useEffect(() => {
    if (currentRoom) {
      loadMessages(currentRoom.id);
    } else {
      setMessages([]);
    }
  }, [currentRoom, loadMessages]);

  // Update online status on window focus/blur
  useEffect(() => {
    const handleFocus = () => updateOnlineStatus(true);
    const handleBlur = () => updateOnlineStatus(false);
    const handleBeforeUnload = () => updateOnlineStatus(false);

    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  const value: CommunityChatContextType = {
    // Chat Rooms
    chatRooms,
    currentRoom,
    loadingRooms,
    createChatRoom,
    joinChatRoom,
    leaveChatRoom,
    setCurrentRoom,
    addUserToRoom,
    removeUserFromRoom,
    getRoomMembers,
    
    // Messages
    messages,
    loadingMessages,
    sendMessage,
    
    // Friends
    friends,
    friendRequests,
    loadingFriends,
    sendFriendRequest,
    acceptFriendRequest,
    declineFriendRequest,
    
    // Online Status
    onlineUsers,
    updateOnlineStatus,
    
    // Search
    searchUsers,
  };

  return (
    <CommunityChatContext.Provider value={value}>
      {children}
    </CommunityChatContext.Provider>
  );
};