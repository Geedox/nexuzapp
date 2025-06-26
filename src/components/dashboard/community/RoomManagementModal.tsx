/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { Search, UserPlus, UserMinus, Crown, Shield, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useCommunityChatContext } from '@/contexts/CommunityChatContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { ChatRoom } from '@/integrations/supabase/types';

interface RoomManagementModalProps {
  open: boolean;
  onClose: () => void;
  room: ChatRoom;
}

export const RoomManagementModal = ({ open, onClose, room }: RoomManagementModalProps) => {
  const [activeTab, setActiveTab] = useState<'members' | 'add'>('members');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  const { user } = useAuth();
  const { 
    getRoomMembers, 
    addUserToRoom, 
    removeUserFromRoom, 
    searchUsers 
  } = useCommunityChatContext();
  const { toast } = useToast();

  // Check if current user can manage the room
  const isCreator = room.creator_id === user?.id;
  const currentUserMember = members.find(m => m.user.id === user?.id);
  const isAdmin = currentUserMember?.role === 'admin';
  const canManage = isCreator || isAdmin;

  // Load room members
  useEffect(() => {
    if (open && room) {
      loadMembers();
    }
  }, [open, room]);

  const loadMembers = async () => {
    setLoading(true);
    try {
      const memberData = await getRoomMembers(room.id);
      setMembers(memberData);
    } catch (error) {
      console.error('Error loading members:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    try {
      const results = await searchUsers(searchQuery.trim());
      // Filter out users who are already members
      const memberIds = members.map(m => m.user.id);
      const filteredResults = results.filter(user => !memberIds.includes(user.id));
      setSearchResults(filteredResults);
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (username: string) => {
    try {
      await addUserToRoom(room.id, username);
      setSearchQuery('');
      setSearchResults([]);
      await loadMembers();
    } catch (error) {
      console.error('Error adding user:', error);
    }
  };

  const handleRemoveUser = async (userId: string, username: string) => {
    if (window.confirm(`Are you sure you want to remove ${username} from this room?`)) {
      try {
        await removeUserFromRoom(room.id, userId);
        await loadMembers();
      } catch (error) {
        console.error('Error removing user:', error);
      }
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Shield className="w-4 h-4 text-yellow-400" />;
      default:
        return null;
    }
  };

  const getRoleBadge = (role: string, isCreator: boolean) => {
    if (isCreator) {
      return (
        <span className="flex items-center gap-1 bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded-full text-xs font-cyber">
          <Crown className="w-3 h-3" />
          Creator
        </span>
      );
    }
    
    if (role === 'admin') {
      return (
        <span className="flex items-center gap-1 bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full text-xs font-cyber">
          <Shield className="w-3 h-3" />
          Admin
        </span>
      );
    }
    
    return (
      <span className="bg-gray-500/20 text-gray-400 px-2 py-1 rounded-full text-xs font-cyber">
        Member
      </span>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] bg-gradient-to-br from-background via-card to-secondary/20 border-primary/30 max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-gaming text-2xl text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
            🎮 Manage Room: {room.name}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground font-cyber">
            {canManage ? 'Manage room members and settings' : 'View room members'}
          </DialogDescription>
        </DialogHeader>

        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-black/40 backdrop-blur-lg border border-primary/30 rounded-xl p-1">
          <button
            onClick={() => setActiveTab('members')}
            className={`flex-1 py-2 px-4 rounded-lg font-cyber font-bold transition-all duration-300 ${
              activeTab === 'members'
                ? 'bg-gradient-to-r from-primary to-accent text-background'
                : 'text-muted-foreground hover:text-primary'
            }`}
          >
            👥 Members ({members.length})
          </button>
          {canManage && (
            <button
              onClick={() => setActiveTab('add')}
              className={`flex-1 py-2 px-4 rounded-lg font-cyber font-bold transition-all duration-300 ${
                activeTab === 'add'
                  ? 'bg-gradient-to-r from-primary to-accent text-background'
                  : 'text-muted-foreground hover:text-primary'
              }`}
            >
              ➕ Add Members
            </button>
          )}
        </div>

        {/* Content */}
        <div className="mt-4">
          {activeTab === 'members' && (
            <div className="space-y-4">
              <h3 className="font-cyber font-bold text-primary">Room Members</h3>
              
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <span className="ml-2 font-cyber text-muted-foreground">Loading members...</span>
                </div>
              ) : members.length === 0 ? (
                <div className="text-center py-8">
                  <p className="font-cyber text-muted-foreground">No members found</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {members.map((member) => {
                    const isMemberCreator = member.user.id === room.creator_id;
                    const canRemoveMember = canManage && !isMemberCreator && member.user.id !== user?.id;
                    
                    return (
                      <div
                        key={member.id}
                        className="flex items-center justify-between p-3 bg-secondary/20 rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="relative">
                            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-sm font-bold">
                              {member.user.avatar_url ? (
                                <img 
                                  src={member.user.avatar_url} 
                                  alt={member.user.username}
                                  className="w-full h-full object-cover rounded-full"
                                />
                              ) : (
                                member.user.username.charAt(0).toUpperCase()
                              )}
                            </div>
                            {member.user.is_online && (
                              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-background"></div>
                            )}
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-cyber font-bold text-foreground">
                                {member.user.display_name || member.user.username}
                              </span>
                              {getRoleIcon(member.role)}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              @{member.user.username}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          {getRoleBadge(member.role, isMemberCreator)}
                          
                          {canRemoveMember && (
                            <Button
                              onClick={() => handleRemoveUser(member.user.id, member.user.username)}
                              size="sm"
                              variant="outline"
                              className="border-red-500/30 text-red-400 hover:bg-red-500/20"
                            >
                              <UserMinus className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'add' && canManage && (
            <div className="space-y-4">
              <h3 className="font-cyber font-bold text-primary">Add New Members</h3>
              
              <div className="flex space-x-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search by username..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    className="pl-10 font-cyber bg-black/40 border-primary/30 focus:border-primary"
                  />
                </div>
                <Button
                  onClick={handleSearch}
                  disabled={!searchQuery.trim() || loading}
                  className="bg-gradient-to-r from-primary to-accent text-background font-cyber"
                >
                  {loading ? (
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
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {searchResults.map((searchUser) => (
                      <div
                        key={searchUser.id}
                        className="flex items-center justify-between p-3 bg-secondary/20 rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-sm font-bold">
                            {searchUser.avatar_url ? (
                              <img 
                                src={searchUser.avatar_url} 
                                alt={searchUser.username}
                                className="w-full h-full object-cover rounded-full"
                              />
                            ) : (
                              searchUser.username.charAt(0).toUpperCase()
                            )}
                          </div>
                          <div>
                            <p className="font-cyber font-bold text-foreground">
                              {searchUser.display_name || searchUser.username}
                            </p>
                            <p className="text-sm text-muted-foreground">@{searchUser.username}</p>
                          </div>
                          {searchUser.is_online && (
                            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                          )}
                        </div>
                        <Button
                          onClick={() => handleAddUser(searchUser.username)}
                          size="sm"
                          className="bg-gradient-to-r from-primary to-accent text-background font-cyber"
                        >
                          <UserPlus className="h-4 w-4 mr-1" />
                          Add
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {searchQuery && searchResults.length === 0 && !loading && (
                <div className="text-center py-4">
                  <p className="text-muted-foreground font-cyber">No users found matching your search</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Close Button */}
        <div className="flex justify-end mt-6">
          <Button
            onClick={onClose}
            variant="outline"
            className="font-cyber"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};