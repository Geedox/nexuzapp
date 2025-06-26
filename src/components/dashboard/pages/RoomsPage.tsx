import React, { useState, useEffect } from 'react';
import { useGameRoom } from '@/contexts/GameRoomContext';
import { useAuth } from '@/contexts/AuthContext';
import { useWallet } from '@/contexts/WalletContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import GameRoomDetails from '@/components/gameroom/GameRoomDetails';

const RoomsPage = () => {
  const { rooms, loading, creating, joining, createRoom, joinRoom, refreshRooms } = useGameRoom();
  const { user } = useAuth();
  const { wallets } = useWallet();
  const { toast } = useToast();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const [roomCode, setRoomCode] = useState('');
  const [selectedWallet, setSelectedWallet] = useState(null);
  const [games, setGames] = useState([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [roomStats, setRoomStats] = useState({
    totalRooms: 0,
    activeRooms: 0,
    totalPrizePool: 0,
    totalPlayers: 0
  });
  
  const [formData, setFormData] = useState({
    name: '',
    gameId: '',
    entryFee: 0,
    currency: 'USDC',
    maxPlayers: 10,
    isPrivate: false,
    winnerSplitRule: 'winner_takes_all',
    startTime: new Date(Date.now() + 3600000), // 1 hour from now
    endTime: new Date(Date.now() + 7200000), // 2 hours from now
    isSponsored: false,
    sponsorAmount: 0,
  });

  const winnerRules = [
    { value: 'winner_takes_all', label: 'Winner Takes All' },
    { value: 'top_2', label: 'Top 2 (60/40)' },
    { value: 'top_3', label: 'Top 3 (50/30/20)' },
    { value: 'top_4', label: 'Top 4 (40/30/20/10)' },
    { value: 'top_5', label: 'Top 5' },
    { value: 'top_10', label: 'Top 10' },
  ];

  // Fetch available games
  useEffect(() => {
    const fetchGames = async () => {
      const { data } = await supabase
        .from('games')
        .select('*')
        .eq('is_active', true);
      setGames(data || []);
    };
    fetchGames();
  }, []);

  // Calculate room statistics
  useEffect(() => {
    if (rooms.length > 0) {
      const stats = rooms.reduce((acc, room) => {
        acc.totalRooms++;
        if (room.status === 'waiting' || room.status === 'ongoing') {
          acc.activeRooms++;
        }
        acc.totalPrizePool += room.total_prize_pool || 0;
        acc.totalPlayers += room.current_players || 0;
        return acc;
      }, {
        totalRooms: 0,
        activeRooms: 0,
        totalPrizePool: 0,
        totalPlayers: 0
      });
      setRoomStats(stats);
    }
    setLoadingStats(false);
  }, [rooms]);

  // Set default wallet when wallets load
  useEffect(() => {
    if (wallets.length > 0 && !selectedWallet) {
      const defaultWallet = wallets.find(w => (w.balance || 0) > 0) || wallets[0];
      setSelectedWallet(defaultWallet);
      setFormData(prev => ({ ...prev, currency: defaultWallet.currency }));
    }
  }, [wallets]);

  const handleCreateRoom = async () => {
    if (!formData.name || !formData.gameId) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (!selectedWallet) {
      toast({
        title: "Error",
        description: "Please select a wallet",
        variant: "destructive",
      });
      return;
    }

    // Validate times
    if (formData.endTime <= formData.startTime) {
      toast({
        title: "Error",
        description: "End time must be after start time",
        variant: "destructive",
      });
      return;
    }

    // Check wallet balance for both sponsored rooms and entry fee
    if (formData.isSponsored) {
      if ((selectedWallet.balance || 0) < formData.sponsorAmount) {
        toast({
          title: "Error",
          description: "Insufficient balance for sponsorship amount",
          variant: "destructive",
        });
        return;
      }
    } else {
      if ((selectedWallet.balance || 0) < formData.entryFee) {
        toast({
          title: "Error",
          description: "Insufficient balance for entry fee",
          variant: "destructive",
        });
        return;
      }
    }

    try {
      const room = await createRoom({
        ...formData,
        currency: selectedWallet.currency,
      });
      
      setShowCreateModal(false);
      // Reset form
      setFormData({
        name: '',
        gameId: '',
        entryFee: 0,
        currency: selectedWallet.currency,
        maxPlayers: 10,
        isPrivate: false,
        winnerSplitRule: 'winner_takes_all',
        startTime: new Date(Date.now() + 3600000),
        endTime: new Date(Date.now() + 7200000),
        isSponsored: false,
        sponsorAmount: 0,
      });

      // Show room code if private
      if (room.is_private && room.room_code) {
        toast({
          title: "Room Created!",
          description: `Room Code: ${room.room_code} - Share this with players to join`,
          duration: 10000,
        });
      } else {
        toast({
          title: "Success",
          description: "Room created! You've been automatically joined.",
        });
      }
      
      // Navigate to the room details
      setTimeout(() => {
        setSelectedRoomId(room.id);
      }, 1000);
    } catch (error) {
      console.error('Error creating room:', error);
    }
  };

  const handleJoinRoom = async () => {
    if (!selectedRoom) return;
    try {
      await joinRoom(selectedRoom.id, selectedRoom.is_private ? roomCode : undefined);
      setShowJoinModal(false);
      setRoomCode('');
      setSelectedRoom(null);
    } catch (error) {
      console.error('Error joining room:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'waiting': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'starting': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'ongoing': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'completed': return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      case 'cancelled': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const canJoinRoom = (room) => {
    if (room.status !== 'waiting') return false;
    if (room.current_players >= room.max_players) return false;
    const userInRoom = room.participants?.some(p => p.user_id === user?.id && p.is_active);
    return !userInRoom;
  };

  const isUserInRoom = (room) => {
    return room.participants?.some(p => p.user_id === user?.id && p.is_active);
  };

  const handleRoomAction = (room) => {
    // If user is already in room (including creator), show room details
    if (isUserInRoom(room)) {
      setSelectedRoomId(room.id);
    } else if (canJoinRoom(room)) {
      // Show join modal
      setSelectedRoom(room);
      setShowJoinModal(true);
    }
  };

  const formatDateTime = (date) => {
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount, currency) => {
    return `${amount.toLocaleString()} ${currency}`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If a room is selected, show its details
  if (selectedRoomId) {
    return (
      <GameRoomDetails 
        roomId={selectedRoomId} 
        onBack={() => {
          setSelectedRoomId(null);
          refreshRooms();
        }} 
      />
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/30 rounded-2xl p-6">
        <h1 className="font-cyber text-3xl font-bold text-blue-400 mb-2 glow-text">
          🏠 Game Rooms
        </h1>
        <p className="text-muted-foreground">Join existing rooms or create your own gaming session</p>
      </div>

      {/* Room Statistics */}
      {!loadingStats && rooms.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-xl p-4">
            <p className="text-sm font-cyber text-purple-400 mb-1">Total Rooms</p>
            <p className="text-2xl font-cyber font-bold text-white">{roomStats.totalRooms}</p>
          </div>
          <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-xl p-4">
            <p className="text-sm font-cyber text-green-400 mb-1">Active Rooms</p>
            <p className="text-2xl font-cyber font-bold text-white">{roomStats.activeRooms}</p>
          </div>
          <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-xl p-4">
            <p className="text-sm font-cyber text-yellow-400 mb-1">Total Prize Pool</p>
            <p className="text-2xl font-cyber font-bold text-white">
              {roomStats.totalPrizePool.toLocaleString()}
            </p>
          </div>
          <div className="bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-blue-500/30 rounded-xl p-4">
            <p className="text-sm font-cyber text-blue-400 mb-1">Active Players</p>
            <p className="text-2xl font-cyber font-bold text-white">{roomStats.totalPlayers}</p>
          </div>
        </div>
      )}

      <div className="flex gap-4 mb-6">
        <button 
          onClick={() => setShowCreateModal(true)}
          disabled={creating}
          className="bg-gradient-to-r from-primary to-accent text-background font-cyber font-bold py-3 px-6 rounded-xl hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-primary/50 disabled:opacity-50 disabled:hover:scale-100"
        >
          {creating ? (
            <span className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-background"></div>
              Creating...
            </span>
          ) : (
            '🎮 Create New Room'
          )}
        </button>
        <button 
          onClick={refreshRooms}
          className="bg-gradient-to-r from-green-500 to-emerald-500 text-background font-cyber font-bold py-3 px-6 rounded-xl hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-green-500/50"
        >
          🔄 Refresh
        </button>
      </div>

      {/* Empty State */}
      {rooms.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="text-6xl mb-4">🎮</div>
          <h3 className="font-cyber text-2xl font-bold text-primary mb-2">No Rooms Available</h3>
          <p className="text-muted-foreground text-center max-w-md">
            Be the first to create a game room and start playing! 
            Click the "Create New Room" button to get started.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rooms.map((room) => (
            <div
              key={room.id}
              className="bg-gradient-to-br from-card to-secondary/20 border border-primary/20 rounded-xl p-6 hover:border-primary/40 transition-all duration-300 hover:scale-105 group cyber-border"
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-cyber text-lg font-bold text-primary glow-text-subtle">{room.name}</h3>
                <div className={`px-3 py-1 rounded-full text-xs font-bold font-cyber border ${getStatusColor(room.status)}`}>
                  {room.status.toUpperCase()}
                </div>
              </div>
              
              <div className="space-y-2 mb-4">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground font-cyber">Game:</span>
                  <span className="text-sm font-cyber text-foreground">{room.game?.name || 'Unknown'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground font-cyber">Players:</span>
                  <span className="text-sm font-cyber text-foreground">
                    <span className={room.current_players >= room.max_players ? 'text-red-400' : 'text-green-400'}>
                      {room.current_players}
                    </span>/{room.max_players}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground font-cyber">Host:</span>
                  <span className="text-sm font-cyber text-foreground">{room.creator?.username || 'Unknown'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground font-cyber">Entry:</span>
                  <span className="text-sm font-cyber text-accent font-bold">
                    {room.is_sponsored ? 'FREE' : formatCurrency(room.entry_fee, room.currency)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground font-cyber">Prize Pool:</span>
                  <span className="text-sm font-cyber text-green-400 font-bold glow-text-subtle">
                    {formatCurrency(room.total_prize_pool, room.currency)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground font-cyber">Start:</span>
                  <span className="text-xs font-cyber text-foreground">{formatDateTime(room.start_time)}</span>
                </div>
                {room.is_private && (
                  <div className="flex justify-center mt-2">
                    <span className="text-xs font-cyber text-purple-400">🔒 Private Room</span>
                  </div>
                )}
                {room.is_sponsored && (
                  <div className="flex justify-center mt-2">
                    <span className="text-xs font-cyber text-yellow-400">💰 Sponsored</span>
                  </div>
                )}
              </div>
              
              <button 
                onClick={() => handleRoomAction(room)}
                disabled={joining || (!isUserInRoom(room) && !canJoinRoom(room))}
                className={`w-full font-cyber font-bold py-2 rounded-lg transition-all duration-300 ${
                  isUserInRoom(room) || canJoinRoom(room)
                    ? 'bg-gradient-to-r from-primary to-accent text-background hover:scale-105 cyber-button'
                    : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                }`}
              >
                {joining && selectedRoom?.id === room.id ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-background"></div>
                    Joining...
                  </span>
                ) : (
                  room.status === 'completed' ? 'View Results' : 
                  room.current_players >= room.max_players && !isUserInRoom(room) ? 'Room Full' :
                  isUserInRoom(room) ? 'Enter Room' :
                  'Join Room'
                )}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Create Room Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-gradient-to-br from-card to-secondary border-2 border-primary/50 rounded-2xl p-8 max-w-2xl w-full mx-4 cyber-border shadow-2xl shadow-primary/20 max-h-[90vh] overflow-y-auto">
            <h2 className="font-cyber text-2xl font-bold text-primary mb-6 text-center glow-text">
              🎮 CREATE GAME ROOM
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-cyber text-primary mb-1 block">Room Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full bg-secondary/50 border border-primary/30 rounded-lg px-4 py-2 font-cyber text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="Epic Battle Arena"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-cyber text-primary mb-1 block">Select Game</label>
                  <select
                    value={formData.gameId}
                    onChange={(e) => setFormData({...formData, gameId: e.target.value})}
                    className="w-full bg-secondary/50 border border-primary/30 rounded-lg px-4 py-2 font-cyber text-foreground focus:border-primary focus:outline-none"
                  >
                    <option value="">Choose a game...</option>
                    {games.map(game => (
                      <option key={game.id} value={game.id}>{game.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-cyber text-primary mb-1 block">Select Wallet</label>
                  <select
                    value={selectedWallet?.id || ''}
                    onChange={(e) => {
                      const wallet = wallets.find(w => w.id === e.target.value);
                      setSelectedWallet(wallet);
                      if (wallet) setFormData({...formData, currency: wallet.currency});
                    }}
                    className="w-full bg-secondary/50 border border-primary/30 rounded-lg px-4 py-2 font-cyber text-foreground focus:border-primary focus:outline-none"
                  >
                    <option value="">Select wallet...</option>
                    {wallets.map(wallet => (
                      <option key={wallet.id} value={wallet.id}>
                        {wallet.currency} - Balance: {wallet.balance || 0}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="text-sm font-cyber text-primary mb-1 block">
                    {formData.isSponsored ? 'Sponsor Amount' : 'Entry Fee'}
                  </label>
                  <input
                    type="number"
                    value={formData.isSponsored ? formData.sponsorAmount : formData.entryFee}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value) || 0;
                      if (formData.isSponsored) {
                        setFormData({...formData, sponsorAmount: value});
                      } else {
                        setFormData({...formData, entryFee: value});
                      }
                    }}
                    className="w-full bg-secondary/50 border border-primary/30 rounded-lg px-4 py-2 font-cyber text-foreground focus:border-primary focus:outline-none"
                    min="0"
                    step="0.01"
                  />
                  {!formData.isSponsored && formData.entryFee > 0 && (
                    <p className="text-xs font-cyber text-yellow-400 mt-1">
                      You'll pay {formData.entryFee} {selectedWallet?.currency || ''} to join your own room
                    </p>
                  )}
                  {formData.isSponsored && formData.sponsorAmount > 0 && (
                    <p className="text-xs font-cyber text-yellow-400 mt-1">
                      You'll pay {formData.sponsorAmount} {selectedWallet?.currency || ''} to sponsor this room
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-cyber text-primary mb-1 block">Start Time</label>
                  <input
                    type="datetime-local"
                    value={formData.startTime.toISOString().slice(0, 16)}
                    onChange={(e) => {
                      const newStartTime = new Date(e.target.value);
                      setFormData({...formData, startTime: newStartTime});
                      // Adjust end time if it's now invalid
                      if (formData.endTime <= newStartTime) {
                        setFormData(prev => ({
                          ...prev, 
                          startTime: newStartTime,
                          endTime: new Date(newStartTime.getTime() + 3600000) // 1 hour after start
                        }));
                      }
                    }}
                    className="w-full bg-secondary/50 border border-primary/30 rounded-lg px-4 py-2 font-cyber text-foreground focus:border-primary focus:outline-none"
                    min={new Date().toISOString().slice(0, 16)}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-cyber text-primary mb-1 block">Max Players</label>
                  <input
                    type="number"
                    value={formData.maxPlayers}
                    onChange={(e) => setFormData({...formData, maxPlayers: parseInt(e.target.value) || 2})}
                    className="w-full bg-secondary/50 border border-primary/30 rounded-lg px-4 py-2 font-cyber text-foreground focus:border-primary focus:outline-none"
                    min="2"
                    max="100"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-cyber text-primary mb-1 block">Winner Split Rule</label>
                  <select
                    value={formData.winnerSplitRule}
                    onChange={(e) => setFormData({...formData, winnerSplitRule: e.target.value})}
                    className="w-full bg-secondary/50 border border-primary/30 rounded-lg px-4 py-2 font-cyber text-foreground focus:border-primary focus:outline-none"
                  >
                    {winnerRules.map(rule => (
                      <option key={rule.value} value={rule.value}>{rule.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-cyber text-primary mb-1 block">End Time</label>
                  <input
                    type="datetime-local"
                    value={formData.endTime.toISOString().slice(0, 16)}
                    onChange={(e) => {
                      const newEndTime = new Date(e.target.value);
                      // Ensure end time is after start time
                      if (newEndTime <= formData.startTime) {
                        toast({
                          title: "Invalid End Time",
                          description: "End time must be after start time",
                          variant: "destructive",
                        });
                        return;
                      }
                      setFormData({...formData, endTime: newEndTime});
                    }}
                    className="w-full bg-secondary/50 border border-primary/30 rounded-lg px-4 py-2 font-cyber text-foreground focus:border-primary focus:outline-none"
                    min={formData.startTime.toISOString().slice(0, 16)}
                  />
                </div>

                <div className="space-y-3 pt-2">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={formData.isPrivate}
                      onChange={(e) => setFormData({...formData, isPrivate: e.target.checked})}
                      className="w-5 h-5 rounded border-primary/30 text-primary focus:ring-primary"
                    />
                    <span className="text-sm font-cyber text-foreground group-hover:text-primary transition-colors">
                      🔒 Private Room (Requires Code)
                    </span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={formData.isSponsored}
                      onChange={(e) => setFormData({...formData, isSponsored: e.target.checked, entryFee: 0})}
                      className="w-5 h-5 rounded border-primary/30 text-primary focus:ring-primary"
                    />
                    <span className="text-sm font-cyber text-foreground group-hover:text-primary transition-colors">
                      💰 Sponsored Room (Free Entry)
                    </span>
                  </label>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 mt-8">
              <button
                onClick={handleCreateRoom}
                disabled={creating}
                className="flex-1 bg-gradient-to-r from-primary to-accent text-background font-cyber font-bold py-3 rounded-xl hover:scale-105 transition-all cyber-button shadow-lg hover:shadow-primary/50 disabled:opacity-50 disabled:hover:scale-100"
              >
                {creating ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-background"></div>
                    CREATING...
                  </span>
                ) : (
                  'CREATE ROOM'
                )}
              </button>
              <button
                onClick={() => setShowCreateModal(false)}
                disabled={creating}
                className="flex-1 bg-secondary border-2 border-primary/30 font-cyber font-bold py-3 rounded-xl hover:bg-secondary/80 hover:border-primary/50 transition-all disabled:opacity-50"
              >
                CANCEL
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Join Room Modal */}
      {showJoinModal && selectedRoom && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-gradient-to-br from-card to-secondary border-2 border-primary/50 rounded-2xl p-8 max-w-md w-full mx-4 cyber-border shadow-2xl shadow-primary/20">
            <h2 className="font-cyber text-2xl font-bold text-primary mb-6 text-center glow-text">
              🎮 JOIN ROOM
            </h2>
            <div className="space-y-4">
              <div className="bg-secondary/30 rounded-lg p-4 border border-primary/20">
                <p className="text-sm font-cyber text-muted-foreground">Room Name</p>
                <p className="font-cyber text-lg text-foreground">{selectedRoom.name}</p>
              </div>
              
              <div className="bg-secondary/30 rounded-lg p-4 border border-primary/20">
                <p className="text-sm font-cyber text-muted-foreground">Entry Fee</p>
                <p className="font-cyber text-lg text-accent">
                  {selectedRoom.is_sponsored ? 'FREE (Sponsored)' : formatCurrency(selectedRoom.entry_fee, selectedRoom.currency)}
                </p>
              </div>
              
              {selectedRoom.is_private && (
                <div>
                  <label className="text-sm font-cyber text-primary mb-2 block">Room Code</label>
                  <input
                    type="text"
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                    className="w-full bg-secondary/50 border border-primary/30 rounded-lg px-4 py-3 font-cyber text-foreground text-center text-xl tracking-wider focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="ENTER CODE"
                    maxLength="8"
                  />
                </div>
              )}
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleJoinRoom}
                  disabled={joining}
                  className="flex-1 bg-gradient-to-r from-primary to-accent text-background font-cyber font-bold py-3 rounded-xl hover:scale-105 transition-all cyber-button shadow-lg hover:shadow-primary/50 disabled:opacity-50 disabled:hover:scale-100"
                >
                  {joining ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-background"></div>
                      JOINING...
                    </span>
                  ) : (
                    selectedRoom.is_sponsored ? 'JOIN FREE' : 'PAY & JOIN'
                  )}
                </button>
                <button
                  onClick={() => {
                    setShowJoinModal(false);
                    setSelectedRoom(null);
                    setRoomCode('');
                  }}
                  disabled={joining}
                  className="flex-1 bg-secondary border-2 border-primary/30 font-cyber font-bold py-3 rounded-xl hover:bg-secondary/80 hover:border-primary/50 transition-all disabled:opacity-50"
                >
                  CANCEL
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .cyber-border {
          position: relative;
          overflow: hidden;
        }
        
        .cyber-border::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 2px;
          background: linear-gradient(90deg, transparent, var(--primary), transparent);
          animation: scan 3s linear infinite;
        }
        
        .cyber-button {
          position: relative;
          overflow: hidden;
        }
        
        .cyber-button::after {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          width: 0;
          height: 0;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.2);
          transform: translate(-50%, -50%);
          transition: width 0.6s, height 0.6s;
        }
        
        .cyber-button:hover::after {
          width: 300px;
          height: 300px;
        }
        
        .glow-text {
          text-shadow: 0 0 10px currentColor, 0 0 20px currentColor;
        }
        
        .glow-text-subtle {
          text-shadow: 0 0 5px currentColor;
        }
        
        @keyframes scan {
          to {
            left: 100%;
          }
        }
        
        .animate-fade-in {
          animation: fadeIn 0.5s ease-out;
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default RoomsPage;