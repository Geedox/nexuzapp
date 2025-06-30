import React, { useState, useEffect, useCallback } from 'react';
import { useGameRoom } from '@/contexts/GameRoomContext';
import { useAuth } from '@/contexts/AuthContext';
import { useWallet } from '@/contexts/WalletContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import GameRoomDetails from '@/components/gameroom/GameRoomDetails';
import { Download, Share2, Trophy, Star, Sparkles, Crown, Medal, Award } from 'lucide-react';

// Winner Celebration Modal Component
const WinnerCelebrationModal = ({ isOpen, onClose, winner }) => {
  const [showFireworks, setShowFireworks] = useState(false);
  const [animationStep, setAnimationStep] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setShowFireworks(true);
      const timeouts = [
        setTimeout(() => setAnimationStep(1), 500),
        setTimeout(() => setAnimationStep(2), 1000),
        setTimeout(() => setAnimationStep(3), 1500),
      ];
      return () => timeouts.forEach(clearTimeout);
    }
  }, [isOpen]);

  const getPositionText = (position) => {
    switch (position) {
      case 1: return "🏆 CHAMPION";
      case 2: return "🥈 RUNNER-UP";
      case 3: return "🥉 THIRD PLACE";
      default: return `🏅 ${position}th PLACE`;
    }
  };

  const getPositionColor = (position) => {
    switch (position) {
      case 1: return "from-yellow-400 via-yellow-500 to-yellow-600";
      case 2: return "from-gray-300 via-gray-400 to-gray-500";
      case 3: return "from-amber-400 via-amber-500 to-amber-600";
      default: return "from-blue-400 via-blue-500 to-blue-600";
    }
  };

  const getCelebrationMessage = (position) => {
    switch (position) {
      case 1: return "ABSOLUTELY LEGENDARY! You dominated the competition!";
      case 2: return "INCREDIBLE PERFORMANCE! You're among the elite!";
      case 3: return "OUTSTANDING ACHIEVEMENT! You've earned your podium!";
      default: return "AMAZING WIN! You've proven your skills!";
    }
  };

  const downloadWinnerCard = () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;

    canvas.width = 1200;
    canvas.height = 800;

    // Background gradient based on position
    const gradient = ctx.createLinearGradient(0, 0, 1200, 800);
    if (winner.position === 1) {
      gradient.addColorStop(0, '#1a1a2e');
      gradient.addColorStop(0.5, '#ffd700');
      gradient.addColorStop(1, '#ff8c00');
    } else if (winner.position === 2) {
      gradient.addColorStop(0, '#1a1a2e');
      gradient.addColorStop(0.5, '#c0c0c0');
      gradient.addColorStop(1, '#808080');
    } else if (winner.position === 3) {
      gradient.addColorStop(0, '#1a1a2e');
      gradient.addColorStop(0.5, '#cd7f32');
      gradient.addColorStop(1, '#8b4513');
    } else {
      gradient.addColorStop(0, '#1a1a2e');
      gradient.addColorStop(0.5, '#4169e1');
      gradient.addColorStop(1, '#191970');
    }
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1200, 800);

    // Add trophy/medal emoji
    ctx.font = 'bold 150px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(winner.position === 1 ? '🏆' : winner.position === 2 ? '🥈' : winner.position === 3 ? '🥉' : '🏅', 600, 200);

    // Winner text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 60px Arial';
    ctx.fillText('WINNER!', 600, 280);

    // Position
    ctx.font = 'bold 48px Arial';
    ctx.fillText(getPositionText(winner.position), 600, 340);

    // Player name
    ctx.font = 'bold 40px Arial';
    ctx.fillText(winner.playerName, 600, 400);

    // Earnings
    ctx.fillStyle = '#00ff88';
    ctx.font = 'bold 56px Arial';
    ctx.fillText(`${winner.earnings} ${winner.currency}`, 600, 480);

    // Game info
    ctx.fillStyle = '#cccccc';
    ctx.font = '32px Arial';
    ctx.fillText(`${winner.gameName} - ${winner.roomName}`, 600, 540);
    ctx.fillText(`Score: ${winner.score.toLocaleString()} | ${winner.totalParticipants} Players`, 600, 580);

    // Date
    ctx.font = '24px Arial';
    ctx.fillText(new Date().toLocaleDateString(), 600, 620);

    // Download
    const link = document.createElement('a');
    link.download = `winner-${winner.playerName}-${winner.position}-${Date.now()}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  const shareWin = async () => {
    const shareText = `🏆 I just won ${getPositionText(winner.position)} in ${winner.gameName}!\n\n💰 Prize: ${winner.earnings} ${winner.currency}\n📊 Score: ${winner.score.toLocaleString()}\n👥 Beat ${winner.totalParticipants - 1} other players!\n\n${getCelebrationMessage(winner.position)}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `🏆 ${getPositionText(winner.position)} Winner!`,
          text: shareText,
          url: window.location.origin
        });
      } catch (err) {
        console.log('Share cancelled or failed');
      }
    } else {
      navigator.clipboard.writeText(shareText);
      alert('Victory details copied to clipboard! 🎉');
    }
  };

  if (!isOpen || !winner) return null;

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-sm flex items-center justify-center z-50 overflow-hidden">
      {/* Animated Background Effects */}
      {showFireworks && (
        <>
          {/* Fireworks */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(30)].map((_, i) => (
              <div
                key={`firework-${i}`}
                className="absolute animate-ping"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 3}s`,
                  animationDuration: `${1 + Math.random() * 2}s`
                }}
              >
                <Sparkles className="text-yellow-400 w-6 h-6" />
              </div>
            ))}
          </div>

          {/* Confetti */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(100)].map((_, i) => (
              <div
                key={`confetti-${i}`}
                className="absolute w-3 h-3 animate-bounce"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `-20px`,
                  backgroundColor: ['#ffd700', '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#f9ca24', '#f0932b'][Math.floor(Math.random() * 7)],
                  animationDelay: `${Math.random() * 5}s`,
                  animationDuration: `${3 + Math.random() * 3}s`,
                  transform: `rotate(${Math.random() * 360}deg)`,
                  borderRadius: Math.random() > 0.5 ? '50%' : '0'
                }}
              />
            ))}
          </div>
        </>
      )}

      {/* Main Modal */}
      <div className="relative max-w-2xl font-cyber w-full mx-4 bg-gradient-to-br from-gray-900/95 to-black/95 backdrop-blur-xl border-4 border-yellow-400 rounded-3xl overflow-hidden">
        
        {/* Glow Effect */}
        <div className={`absolute font-cyber inset-0 bg-gradient-to-r ${getPositionColor(winner.position)} opacity-20 rounded-3xl blur-2xl`}></div>
        
        {/* Content */}
        <div className="relative font-cyber z-10 p-6 text-center space-y-4">
          
          {/* Animated Trophy */}
          <div className={`text-6xl mb-6 font-cyber ${animationStep >= 1 ? 'animate-bounce' : 'opacity-0 scale-0'} transition-all duration-1000`}>
            {winner.position === 1 ? '🏆' : winner.position === 2 ? '🥈' : winner.position === 3 ? '🥉' : '🏅'}
          </div>

          {/* Position Badge */}
          <div className={`${animationStep >= 1 ? 'scale-100 opacity-100' : 'scale-0 opacity-0'} transition-all font-cyber duration-700`}>
            <div className={`inline-block px-12 py-4 bg-gradient-to-r ${getPositionColor(winner.position)} font-cyber rounded-full shadow-2xl border-2 border-white/20`}>
              <span className="text-white font-bold text-3xl tracking-wider font-cyber drop-shadow-lg">
                {getPositionText(winner.position)}
              </span>
            </div>
          </div>

          {/* Main Congratulations */}
          <div className={`${animationStep >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'} transition-all duration-700`}>
            <h1 className="text-5xl md:text-6xl font-cyber font-bold bg-gradient-to-r from-white via-yellow-200 to-white bg-clip-text text-transparent mb-4 drop-shadow-2xl">
              CONGRATULATIONS!
            </h1>
            <p className="text-2xl text-gray-200 font-semibold max-w-2xl mx-auto font-cyber leading-relaxed">
              {getCelebrationMessage(winner.position)}
            </p>
          </div>

          {/* Player Info */}
          <div className={`${animationStep >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'} font-cyber transition-all duration-700 delay-300`}>
            <h2 className="text-4xl font-bold text-white mb-3 drop-shadow-lg">{winner.playerName}</h2>
            <div className="flex items-center justify-center gap-4 text-gray-300 text-lg">
              <div className="flex items-center gap-2">
                <Star className="w-6 h-6 text-yellow-400" />
                <span>Score: {winner.score.toLocaleString()}</span>
              </div>
              <span>•</span>
              <span>Out of {winner.totalParticipants} players</span>
            </div>
          </div>

          {/* Prize Amount */}
          <div className={`${animationStep >= 3 ? 'opacity-100 scale-100' : 'opacity-0 scale-0'} font-cyber transition-all duration-1000`}>
            <div className="bg-gradient-to-r from-green-500/30 to-emerald-500/30 border-2 border-green-400/50 rounded-3xl p-8 mb-8 backdrop-blur-sm">
              <p className="text-green-300 text-2xl mb-3 font-semibold">YOU WON</p>
              <p className="text-5xl font-bold text-green-400 glow-text-strong mb-2">
                {winner.earnings}
              </p>
              <p className="text-4xl font-bold text-green-300 mb-3">{winner.currency}</p>
              <p className="text-gray-300 text-lg">From: {winner.roomName}</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col font-cyber sm:flex-row gap-4 justify-center pt-6">
            <button
              onClick={shareWin}
              className="flex items-center justify-center gap-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:scale-105 transition-all shadow-2xl hover:shadow-blue-500/50"
            >
              <Share2 className="w-6 h-6" />
              Share Victory
            </button>
            
            <button
              onClick={downloadWinnerCard}
              className="flex items-center justify-center gap-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:scale-105 transition-all shadow-2xl hover:shadow-purple-500/50"
            >
              <Download className="w-6 h-6" />
              Download Card
            </button>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="mt-8 bg-gray-700/50 hover:bg-gray-600/50 font-cyber backdrop-blur-sm text-white px-10 py-4 rounded-2xl font-bold text-lg transition-all border border-gray-500/30"
          >
            Continue Gaming
          </button>
        </div>

        {/* Decorative Corner Elements */}
        <div className="absolute top-6 left-6 text-yellow-400 opacity-60">
          <Crown className="w-12 h-12 animate-pulse" />
        </div>
        <div className="absolute top-6 right-6 text-yellow-400 opacity-60">
          <Medal className="w-12 h-12 animate-pulse" style={{ animationDelay: '0.5s' }} />
        </div>
        <div className="absolute bottom-6 left-6 text-yellow-400 opacity-60">
          <Award className="w-10 h-10 animate-spin" style={{ animationDuration: '4s' }} />
        </div>
        <div className="absolute bottom-6 right-6 text-yellow-400 opacity-60">
          <Star className="w-10 h-10 animate-spin" style={{ animationDuration: '4s', animationDelay: '2s' }} />
        </div>
      </div>

      <style jsx>{`
        .glow-text-strong {
          text-shadow: 0 0 30px currentColor, 0 0 60px currentColor, 0 0 90px currentColor;
        }
      `}</style>
    </div>
  );
};

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
  const [userWins, setUserWins] = useState({}); // Track user wins per room
  
  // Winner celebration state
  const [showCelebration, setShowCelebration] = useState(false);
  const [winnerData, setWinnerData] = useState(null);
  
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

  // Function to close celebration modal
  const closeCelebration = useCallback(() => {
    setShowCelebration(false);
    setWinnerData(null);
  }, []);

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

  // Fetch user wins for completed rooms
  useEffect(() => {
    const fetchUserWins = async () => {
      if (!user) return;

      try {
        const completedRoomIds = rooms
          .filter(room => room.status === 'completed')
          .map(room => room.id);

        if (completedRoomIds.length === 0) return;

        const { data: wins } = await supabase
          .from('game_room_participants')
          .select('room_id, final_position, earnings, score')
          .eq('user_id', user.id)
          .in('room_id', completedRoomIds)
          .not('final_position', 'is', null)
          .gt('earnings', 0);

        const winsMap = {};
        wins?.forEach(win => {
          winsMap[win.room_id] = win;
        });
        setUserWins(winsMap);
      } catch (error) {
        console.error('Error fetching user wins:', error);
      }
    };

    if (rooms.length > 0) {
      fetchUserWins();
    }
  }, [rooms, user]);

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

  // Function to show win celebration for a specific room
  const showWinCelebration = (room) => {
    const win = userWins[room.id];
    if (!win) return;

    const celebration = {
      position: win.final_position,
      earnings: win.earnings,
      currency: room.currency,
      roomName: room.name,
      gameName: room.game?.name || 'Game',
      totalParticipants: room.current_players,
      playerName: user.username || user.email?.split('@')[0] || 'Champion',
      score: win.score || 0,
      roomId: room.id
    };

    setWinnerData(celebration);
    setShowCelebration(true);
  };

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

  const userWonInRoom = (room) => {
    return userWins[room.id] !== undefined;
  };

  const handleRoomAction = (room) => {
    // If user won in this completed room, show celebration
    if (room.status === 'completed' && userWonInRoom(room)) {
      showWinCelebration(room);
      return;
    }

    // If user is already in room (including creator), show room details
    if (isUserInRoom(room)) {
      setSelectedRoomId(room.id);
    } else if (canJoinRoom(room)) {
      // Show join modal
      setSelectedRoom(room);
      setShowJoinModal(true);
    } else if (room.status === 'completed') {
      // For completed rooms where user didn't win, show room details
      setSelectedRoomId(room.id);
    }
  };

  const getActionButtonText = (room) => {
    if (room.status === 'completed') {
      if (userWonInRoom(room)) {
        const win = userWins[room.id];
        return `🏆 View Win (${win.earnings} ${room.currency})`;
      }
      return 'View Results';
    }
    
    if (room.current_players >= room.max_players && !isUserInRoom(room)) {
      return 'Room Full';
    }
    
    if (isUserInRoom(room)) {
      return 'Enter Room';
    }
    
    return 'Join Room';
  };

  const getActionButtonClass = (room) => {
    if (room.status === 'completed' && userWonInRoom(room)) {
      return 'bg-gradient-to-r from-yellow-500 to-amber-500 text-background hover:scale-105 cyber-button';
    }
    
    if (isUserInRoom(room) || canJoinRoom(room) || room.status === 'completed') {
      return 'bg-gradient-to-r from-primary to-accent text-background hover:scale-105 cyber-button';
    }
    
    return 'bg-gray-600 text-gray-400 cursor-not-allowed';
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
    <>
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
                className={`relative bg-gradient-to-br from-card to-secondary/20 border rounded-xl p-6 hover:border-primary/40 transition-all duration-300 hover:scale-105 group cyber-border ${
                  userWonInRoom(room) ? 'border-yellow-500/50 shadow-lg shadow-yellow-500/20' : 'border-primary/20'
                }`}
              >
                {/* Winner Badge */}
                {userWonInRoom(room) && (
                  <div className="absolute -top-2 -right-2 bg-gradient-to-r from-yellow-400 to-amber-500 text-black px-3 py-1 rounded-full text-xs font-bold font-cyber z-10">
                    🏆 WINNER
                  </div>
                )}

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
                  
                  {/* Show win details for completed rooms where user won */}
                  {userWonInRoom(room) && (
                    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-2 mt-2">
                      <div className="flex justify-between text-xs font-cyber">
                        <span className="text-yellow-400">Your Position:</span>
                        <span className="text-yellow-300">#{userWins[room.id].final_position}</span>
                      </div>
                      <div className="flex justify-between text-xs font-cyber">
                        <span className="text-yellow-400">Earnings:</span>
                        <span className="text-yellow-300 font-bold">{userWins[room.id].earnings} {room.currency}</span>
                      </div>
                    </div>
                  )}

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
                  disabled={joining || (!isUserInRoom(room) && !canJoinRoom(room) && room.status !== 'completed')}
                  className={`w-full font-cyber font-bold py-2 rounded-lg transition-all duration-300 ${getActionButtonClass(room)}`}
                >
                  {joining && selectedRoom?.id === room.id ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-background"></div>
                      Joining...
                    </span>
                  ) : (
                    getActionButtonText(room)
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
                        
                        // Calculate the minimum end time (start time + 10 minutes)
                        const minEndTime = new Date(newStartTime.getTime() + 10 * 60 * 1000);
                        
                        // If current end time is before the new minimum, adjust it
                        let newEndTime = formData.endTime;
                        if (formData.endTime <= newStartTime) {
                          newEndTime = new Date(newStartTime.getTime() + 60 * 60 * 1000); // Default to 1 hour
                        }
                        
                        setFormData({
                          ...formData, 
                          startTime: newStartTime,
                          endTime: newEndTime
                        });
                      }}
                      className="w-full bg-secondary/50 border border-primary/30 rounded-lg px-4 py-2 font-cyber text-foreground focus:border-primary focus:outline-none"
                      min={new Date().toISOString().slice(0, 16)}
                    />
                    <p className="text-xs font-cyber text-muted-foreground mt-1">
                      Game will start at this time
                    </p>
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
                        
                        // Validate that end time is after start time
                        if (newEndTime <= formData.startTime) {
                          toast({
                            title: "Invalid End Time",
                            description: "End time must be after start time",
                            variant: "destructive",
                          });
                          return;
                        }
                        
                        // Check minimum duration (10 minutes)
                        const minDuration = 10 * 60 * 1000; // 10 minutes in milliseconds
                        if (newEndTime.getTime() - formData.startTime.getTime() < minDuration) {
                          toast({
                            title: "Invalid Duration",
                            description: "Game must last at least 10 minutes",
                            variant: "destructive",
                          });
                          return;
                        }
                        
                        setFormData({...formData, endTime: newEndTime});
                      }}
                      className="w-full bg-secondary/50 border border-primary/30 rounded-lg px-4 py-2 font-cyber text-foreground focus:border-primary focus:outline-none"
                    />
                    <p className="text-xs font-cyber text-muted-foreground mt-1">
                      Game will end at this time (minimum 10 minutes after start)
                    </p>
                    {formData.startTime && formData.endTime && formData.endTime > formData.startTime && (
                      <p className="text-xs font-cyber text-accent mt-1">
                        Duration: {Math.round((formData.endTime.getTime() - formData.startTime.getTime()) / (1000 * 60))} minutes
                      </p>
                    )}
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

      {/* Winner Celebration Modal */}
      <WinnerCelebrationModal
        isOpen={showCelebration}
        onClose={closeCelebration}
        winner={winnerData}
      />
    </>
  );
};

export default RoomsPage;