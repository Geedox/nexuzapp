/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import { Check, X, Search, UserPlus, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCommunityChatContext } from '@/contexts/CommunityChatContext';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

const FriendRequests = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [processingRequests, setProcessingRequests] = useState<Set<string>>(new Set());

  const {
    friendRequests,
    loadingFriends,
    acceptFriendRequest,
    declineFriendRequest,
    sendFriendRequest,
    searchUsers,
  } = useCommunityChatContext();

  const { toast } = useToast();

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const results = await searchUsers(searchQuery.trim());
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching users:', error);
      toast({
        title: "Search Error",
        description: "Failed to search for users",
        variant: "destructive",
      });
    } finally {
      setSearching(false);
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    setProcessingRequests(prev => new Set([...prev, requestId]));
    try {
      await acceptFriendRequest(requestId);
    } catch (error) {
      console.error('Error accepting friend request:', error);
    } finally {
      setProcessingRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(requestId);
        return newSet;
      });
    }
  };

  const handleDeclineRequest = async (requestId: string) => {
    setProcessingRequests(prev => new Set([...prev, requestId]));
    try {
      await declineFriendRequest(requestId);
    } catch (error) {
      console.error('Error declining friend request:', error);
    } finally {
      setProcessingRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(requestId);
        return newSet;
      });
    }
  };

  const handleSendFriendRequest = async (username: string) => {
    try {
      await sendFriendRequest(username);
      // Remove from search results after sending request
      setSearchResults(prev => prev.filter(user => user.username !== username));
    } catch (error) {
      console.error('Error sending friend request:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search for Users */}
      <div className="bg-black/40 backdrop-blur-lg border border-primary/30 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-primary/20">
          <h2 className="font-cyber text-xl font-bold text-primary">🔍 Find Friends</h2>
          <p className="text-sm text-muted-foreground font-cyber">Search for users to send friend requests</p>
        </div>
        
        <div className="p-6 space-y-4">
          <div className="flex space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search by username or display name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10 font-cyber bg-black/40 border-primary/30 focus:border-primary"
              />
            </div>
            <Button
              onClick={handleSearch}
              disabled={!searchQuery.trim() || searching}
              className="bg-gradient-to-r from-primary to-accent text-background font-cyber px-6"
            >
              {searching ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-background"></div>
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-cyber text-muted-foreground">Search Results:</p>
              {searchResults.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 bg-secondary/20 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-sm font-bold">
                      {user.avatar_url ? (
                        <img 
                          src={user.avatar_url} 
                          alt={user.username}
                          className="w-full h-full object-cover rounded-full"
                        />
                      ) : (
                        user.username.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div>
                      <p className="font-cyber font-bold text-foreground">
                        {user.display_name || user.username}
                      </p>
                      <p className="text-sm text-muted-foreground">@{user.username}</p>
                    </div>
                    {user.is_online && (
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    )}
                  </div>
                  <Button
                    onClick={() => handleSendFriendRequest(user.username)}
                    size="sm"
                    className="bg-gradient-to-r from-primary to-accent text-background font-cyber"
                  >
                    <UserPlus className="h-4 w-4 mr-1" />
                    Add Friend
                  </Button>
                </div>
              ))}
            </div>
          )}

          {searchQuery && searchResults.length === 0 && !searching && (
            <div className="text-center py-4">
              <p className="text-muted-foreground font-cyber">No users found matching your search</p>
            </div>
          )}
        </div>
      </div>

      {/* Friend Requests */}
      <div className="bg-black/40 backdrop-blur-lg border border-primary/30 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-primary/20">
          <h2 className="font-cyber text-xl font-bold text-primary">📬 Friend Requests</h2>
          <p className="text-sm text-muted-foreground font-cyber">Pending friend requests from other players</p>
        </div>
        
        <div className="p-6">
          {loadingFriends ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-2 font-cyber text-muted-foreground">Loading requests...</span>
            </div>
          ) : friendRequests.length === 0 ? (
            <div className="text-center py-8">
              <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="font-cyber text-muted-foreground">No pending friend requests</p>
              <p className="text-sm text-muted-foreground mt-2">
                When other players send you friend requests, they'll appear here
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {friendRequests.map((request) => {
                const isProcessing = processingRequests.has(request.id);
                const requester = request.requester;
                
                return (
                  <div
                    key={request.id}
                    className="flex items-center justify-between p-4 bg-secondary/20 rounded-lg"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-lg font-bold">
                        {requester?.avatar_url ? (
                          <img 
                            src={requester.avatar_url} 
                            alt={requester.username}
                            className="w-full h-full object-cover rounded-full"
                          />
                        ) : (
                          requester?.username.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="font-cyber font-bold text-foreground">
                          {requester?.display_name || requester?.username}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          @{requester?.username}
                        </div>
                        <div className="text-xs text-muted-foreground font-cyber">
                          Sent {formatDistanceToNow(new Date(request.created_at!))} ago
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button
                        onClick={() => handleAcceptRequest(request.id)}
                        disabled={isProcessing}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white font-cyber"
                      >
                        {isProcessing ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        ) : (
                          <Check className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        onClick={() => handleDeclineRequest(request.id)}
                        disabled={isProcessing}
                        size="sm"
                        variant="outline"
                        className="border-red-500/30 text-red-400 hover:bg-red-500/20 font-cyber"
                      >
                        {isProcessing ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-400"></div>
                        ) : (
                          <X className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FriendRequests;