/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import { Search, Plus, Users, MessageCircle, UserPlus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext'; // Add this import
// Import the components we created
import { useCommunityChatContext } from '@/contexts/CommunityChatContext';
import { formatDistanceToNow } from 'date-fns';
import { ChatRoom, Friend } from '@/integrations/supabase/types';
import ChatInterface from '../community/ChatInterface';
import FriendRequests from '../community/FriendRequest';
import { CreateChatRoomModal } from '../community/CreateChatRoomModal';
import Banner from '@/components/Banner';

interface CommunityPageProps {
  supabase?: any;
}

const CommunityPage = ({ supabase }: CommunityPageProps) => {
  const [activeView, setActiveView] = useState<'community' | 'chat'>('community');
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | Friend | null>(null);
  const [chatType, setChatType] = useState<'room' | 'individual'>('room');
  const [activeTab, setActiveTab] = useState<'rooms' | 'friends' | 'requests'>('rooms');
  const [createRoomOpen, setCreateRoomOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { user } = useAuth(); // Get current user

  const {
    chatRooms,
    friends,
    friendRequests,
    loadingRooms,
    loadingFriends,
    joinChatRoom,
    setCurrentRoom,
    onlineUsers,
  } = useCommunityChatContext();

  // Filter rooms based on search
  const filteredRooms = chatRooms.filter(room =>
    room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    room.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filter friends based on search
  const filteredFriends = friends.filter(friendship => {
    const friend = friendship.requester?.id === user?.id 
      ? friendship.addressee 
      : friendship.requester;
    return friend?.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
           friend?.display_name?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleRoomClick = async (room: ChatRoom) => {
    // Check if user is already a member
    const isMember = room.members?.some(member => member.user_id === user?.id);
    
    if (!isMember && !room.is_private) {
      try {
        await joinChatRoom(room.id);
      } catch (error) {
        return; // Error handled in context
      }
    }
    
    setSelectedRoom(room);
    setCurrentRoom(room);
    setChatType('room');
    setActiveView('chat');
  };

  const handleFriendClick = (friendship: Friend) => {
    setSelectedRoom(friendship); // Store the friendship, not just the friend
    setChatType('individual');
    setActiveView('chat');
  };

  const handleBackToCommunity = () => {
    setActiveView('community');
    setSelectedRoom(null);
    setCurrentRoom(null);
  };

  const getLastActivityText = (room: ChatRoom) => {
    if (!room.last_message_at) return 'No messages yet';
    return `${formatDistanceToNow(new Date(room.last_message_at))} ago`;
  };

  const getFriendStatus = (friendship: Friend) => {
    const friend = friendship.requester?.id === user?.id 
      ? friendship.addressee 
      : friendship.requester;
    return friend?.is_online ? 'online' : 'offline';
  };

  // Helper function to get the display name for selected room
  const getRoomDisplayName = () => {
    if (!selectedRoom) return '';
    
    if (chatType === 'room') {
      return (selectedRoom as ChatRoom).name;
    } else {
      // For individual chat, get the friend's info
      const friendship = selectedRoom as Friend;
      const friend = friendship.requester?.id === user?.id 
        ? friendship.addressee 
        : friendship.requester;
      return friend?.display_name || friend?.username || 'Unknown User';
    }
  };

  if (activeView === 'chat' && selectedRoom) {
    return (
      <div className="h-full animate-fade-in">
        <ChatInterface
          roomName={getRoomDisplayName()}
          onBack={handleBackToCommunity}
          type={chatType}
          memberCount={chatType === 'room' ? (selectedRoom as ChatRoom).participant_count : undefined}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <Banner pathname='community'/>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-black/40 backdrop-blur-lg border border-primary/30 rounded-xl p-6 text-center">
          <div className="text-4xl mb-2">👥</div>
          <div className="text-3xl font-bold text-primary font-cyber">{chatRooms.length}</div>
          <div className="text-sm text-muted-foreground font-cyber">Active Rooms</div>
        </div>
        <div className="bg-black/40 backdrop-blur-lg border border-green-500/30 rounded-xl p-6 text-center">
          <div className="text-4xl mb-2">🟢</div>
          <div className="text-3xl font-bold text-green-400 font-cyber">{onlineUsers.size}</div>
          <div className="text-sm text-muted-foreground font-cyber">Online Now</div>
        </div>
        <div className="bg-black/40 backdrop-blur-lg border border-blue-500/30 rounded-xl p-6 text-center">
          <div className="text-4xl mb-2">👨‍👩‍👧‍👦</div>
          <div className="text-3xl font-bold text-blue-400 font-cyber">{friends.length}</div>
          <div className="text-sm text-muted-foreground font-cyber">Friends</div>
        </div>
        <div className="bg-black/40 backdrop-blur-lg border border-accent/30 rounded-xl p-6 text-center">
          <div className="text-4xl mb-2">📬</div>
          <div className="text-3xl font-bold text-accent font-cyber">{friendRequests.length}</div>
          <div className="text-sm text-muted-foreground font-cyber">Pending Requests</div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-4">
        <Button
          onClick={() => setCreateRoomOpen(true)}
          className="bg-gradient-to-r from-primary to-accent text-background font-cyber font-bold py-3 px-6 rounded-xl hover:scale-105 transition-all duration-300"
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Chat Room
        </Button>
        <Button
          variant="outline"
          className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-500/30 text-purple-400 font-cyber font-bold py-3 px-6 rounded-xl hover:scale-105 transition-all duration-300"
        >
          <UserPlus className="mr-2 h-4 w-4" />
          Find Friends
        </Button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Search rooms, friends, or users..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 font-cyber bg-black/40 border-primary/30 focus:border-primary"
        />
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-black/40 backdrop-blur-lg border border-primary/30 rounded-xl p-1">
        <button
          onClick={() => setActiveTab('rooms')}
          className={`flex-1 py-3 px-4 rounded-lg font-cyber font-bold transition-all duration-300 ${
            activeTab === 'rooms'
              ? 'bg-gradient-to-r from-primary to-accent text-background'
              : 'text-muted-foreground hover:text-primary'
          }`}
        >
          💬 Chat Rooms ({chatRooms.length})
        </button>
        <button
          onClick={() => setActiveTab('friends')}
          className={`flex-1 py-3 px-4 rounded-lg font-cyber font-bold transition-all duration-300 ${
            activeTab === 'friends'
              ? 'bg-gradient-to-r from-primary to-accent text-background'
              : 'text-muted-foreground hover:text-primary'
          }`}
        >
          👨‍👩‍👧‍👦 Friends ({friends.length})
        </button>
        <button
          onClick={() => setActiveTab('requests')}
          className={`flex-1 py-3 px-4 rounded-lg font-cyber font-bold transition-all duration-300 ${
            activeTab === 'requests'
              ? 'bg-gradient-to-r from-primary to-accent text-background'
              : 'text-muted-foreground hover:text-primary'
          }`}
        >
          📬 Requests ({friendRequests.length})
        </button>
      </div>

      {/* Content based on active tab */}
      <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
        {activeTab === 'rooms' && (
          <div className="bg-black/40 backdrop-blur-lg border border-primary/30 rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-primary/20">
              <h2 className="font-cyber text-xl font-bold text-primary">💬 Chat Rooms</h2>
              <p className="text-sm text-muted-foreground font-cyber">Join active gaming communities</p>
            </div>
            
            <div className="p-6">
              {loadingRooms ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <span className="ml-2 font-cyber text-muted-foreground">Loading rooms...</span>
                </div>
              ) : filteredRooms.length === 0 ? (
                <div className="text-center py-8">
                  <MessageCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="font-cyber text-muted-foreground">
                    {searchQuery ? 'No rooms found matching your search' : 'No chat rooms available'}
                  </p>
                  {!searchQuery && (
                    <Button
                      onClick={() => setCreateRoomOpen(true)}
                      variant="outline"
                      className="mt-4 font-cyber"
                    >
                      Create the first room
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredRooms.map((room) => (
                    <div
                      key={room.id}
                      onClick={() => handleRoomClick(room)}
                      className="flex items-center justify-between p-4 bg-secondary/20 rounded-lg hover:bg-secondary/30 transition-all duration-300 cursor-pointer group"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="relative">
                          <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${room.avatar_color} flex items-center justify-center text-2xl`}>
                            {room.avatar_emoji}
                          </div>
                          {room.participant_count && room.participant_count > 0 && (
                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-400 rounded-full flex items-center justify-center text-xs font-bold text-black">
                              {room.participant_count}
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-cyber font-bold text-foreground group-hover:text-primary transition-colors">
                              {room.name}
                            </span>
                            {room.is_private && (
                              <span className="bg-red-500/20 text-red-400 px-2 py-1 rounded-full text-xs font-cyber">
                                PRIVATE
                              </span>
                            )}
                            {room.game && (
                              <span className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full text-xs font-cyber">
                                {room.game.name}
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground font-cyber">
                            {room.description || 'No description'}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-cyber text-primary">
                          {room.participant_count || 0} members
                        </div>
                        <div className="text-xs text-muted-foreground font-cyber">
                          {getLastActivityText(room)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'friends' && (
          <div className="bg-black/40 backdrop-blur-lg border border-primary/30 rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-primary/20">
              <h2 className="font-cyber text-xl font-bold text-primary">👨‍👩‍👧‍👦 Friends</h2>
              <p className="text-sm text-muted-foreground font-cyber">Chat with your gaming buddies</p>
            </div>
            
            <div className="p-6">
              {loadingFriends ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <span className="ml-2 font-cyber text-muted-foreground">Loading friends...</span>
                </div>
              ) : filteredFriends.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="font-cyber text-muted-foreground">
                    {searchQuery ? 'No friends found matching your search' : 'No friends yet'}
                  </p>
                  {!searchQuery && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Send friend requests to start building your network!
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredFriends.map((friendship) => {
                    const friend = friendship.requester?.id === user?.id 
                      ? friendship.addressee 
                      : friendship.requester;
                    const status = getFriendStatus(friendship);
                    
                    return (
                      <div
                        key={friendship.id}
                        onClick={() => handleFriendClick(friendship)}
                        className="flex items-center justify-between p-4 bg-secondary/20 rounded-lg hover:bg-secondary/30 transition-all duration-300 cursor-pointer group"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="relative">
                            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-xl">
                              {friend?.avatar_url ? (
                                <img 
                                  src={friend.avatar_url} 
                                  alt={friend.username}
                                  className="w-full h-full object-cover rounded-full"
                                />
                              ) : (
                                friend?.username.charAt(0).toUpperCase()
                              )}
                            </div>
                            <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-background ${
                              status === 'online' ? 'bg-green-400' : 'bg-gray-400'
                            }`}></div>
                          </div>
                          <div>
                            <div className="font-cyber font-bold text-foreground group-hover:text-primary transition-colors">
                              {friend?.display_name || friend?.username}
                            </div>
                            <div className="text-sm text-muted-foreground font-cyber">
                              @{friend?.username}
                            </div>
                          </div>
                        </div>
                        <div className={`text-xs font-cyber px-3 py-1 rounded-full ${
                          status === 'online' 
                            ? 'bg-green-500/20 text-green-400' 
                            : 'bg-gray-500/20 text-gray-400'
                        }`}>
                          {status.toUpperCase()}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'requests' && (
          <div>
            <FriendRequests />
          </div>
        )}
      </div>

      {/* Create Chat Room Modal */}
      <CreateChatRoomModal
        open={createRoomOpen}
        onClose={() => setCreateRoomOpen(false)}
        supabase={supabase}
      />
    </div>
  );
};

export default CommunityPage;