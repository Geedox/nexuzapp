import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useGameRoom } from '@/contexts/GameRoomContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

// Simple GamePlayerModal - no unnecessary effects or dependencies
// const GamePlayerModal = React.memo(({ game, roomId, onClose }) => {
//   const gameUrls = {
//     '11111111-1111-1111-1111-111111111111': '/games/endless-runner/index.html',
//     '22222222-2222-2222-2222-222222222222': '/games/flappy-bird/index.html',
//   };

//   const gameUrl = gameUrls[game?.id];
  
//   if (!game || !gameUrl) {
//     return (
//       <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
//         <div className="bg-background border border-primary/30 rounded-xl p-8 text-center">
//           <p className="text-muted-foreground mb-4">This game is not available yet</p>
//           <button 
//             onClick={onClose}
//             className="bg-secondary text-primary font-cyber font-bold py-2 px-6 rounded-lg hover:bg-secondary/80 transition-colors"
//           >
//             Close
//           </button>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
//       <div className="bg-background border border-primary/30 rounded-xl w-full max-w-5xl max-h-[90vh] overflow-hidden">
//         <div className="flex items-center justify-between p-4 border-b border-primary/20">
//           <div className="flex items-center gap-4">
//             <h3 className="font-cyber text-xl text-primary">{game.name}</h3>
//             <span className="text-sm text-muted-foreground">Room: {roomId.slice(0, 8)}...</span>
//           </div>
//           <button 
//             onClick={onClose}
//             className="text-muted-foreground hover:text-primary transition-colors text-2xl font-bold"
//           >
//             ✕
//           </button>
//         </div>
//         <div className="relative w-full h-[600px] bg-black">
//           <iframe
//             src={gameUrl}
//             className="w-full h-full border-0"
//             title={game.name}
//             sandbox="allow-scripts allow-same-origin"
//           />
//         </div>
//       </div>
//     </div>
//   );
// });

const GameRoomDetails = ({ roomId, onBack }) => {
  const { getRoomDetails, getRoomParticipants, updateGameScore, leaveRoom, cancelRoom } = useGameRoom();
  const { user } = useAuth();
  const { toast } = useToast();
  const [room, setRoom] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showGamePlayer, setShowGamePlayer] = useState(false);
  const [isLoadingGame, setIsLoadingGame] = useState(false);

  const updateRoomStatusIfNeeded = useCallback(async (roomId) => {
    try {
      const { data: room, error } = await supabase
        .from('game_rooms')
        .select('status, start_time, end_time, current_players, min_players_to_start')
        .eq('id', roomId)
        .single();

      if (error) {
        console.error('Error fetching room for status update:', error);
        return;
      }

      if (!room) return;

      const now = new Date();
      const startTime = new Date(room.start_time);
      const endTime = new Date(room.end_time);
      let updates = null;

      if (room.status === 'waiting' && now >= startTime && room.current_players >= room.min_players_to_start) {
        updates = {
          status: 'ongoing',
          actual_start_time: now.toISOString()
        };
      } else if ((room.status === 'ongoing' || room.status === 'waiting') && now >= endTime) {
        updates = {
          status: 'completed',
          actual_end_time: now.toISOString()
        };
      }

      if (updates) {
        const { error: updateError } = await supabase
          .from('game_rooms')
          .update(updates)
          .eq('id', roomId);
          
        if (updateError) {
          console.error('Error updating room status:', updateError);
        }
      }
    } catch (error) {
      console.error('Error updating room status:', error);
    }
  }, []);

  // Stable loadRoomData function with optional loading state
  const loadRoomData = useCallback(async (showLoader = true) => {
    if (showLoader) {
      setLoading(true);
    }
    try {
      await updateRoomStatusIfNeeded(roomId);
      
      const [roomData, participantsData] = await Promise.all([
        getRoomDetails(roomId),
        getRoomParticipants(roomId)
      ]);
      
      if (roomData) {
        setRoom(roomData);
      }
      if (participantsData) {
        setParticipants(participantsData);
      }
    } catch (error) {
      console.error('Error loading room data:', error);
      toast({
        title: "Error",
        description: "Failed to load room details",
        variant: "destructive",
      });
    } finally {
      if (showLoader) {
        setLoading(false);
      }
    }
  }, [roomId, getRoomDetails, getRoomParticipants, updateRoomStatusIfNeeded, toast]);

  // Simplified handlers
  const handleCloseGame = () => {
    setShowGamePlayer(false);
    loadRoomData(false);
  };

   const handleMessage = useCallback(async (event) => {
    if (event.data.type === 'EXIT_GAME') {
      handleCloseGame();
    } else if (event.data.type === 'SUBMIT_SCORE') {
      try {
        const score = event.data.score;
        
        const { error } = await supabase
          .from('game_room_participants')
          .update({ score })
          .eq('room_id', roomId)
          .eq('user_id', user.id);

        if (error) {
          throw error;
        }
        
        event.source.postMessage({
          type: 'SCORE_SUBMITTED',
          success: true,
          isNewHighScore: true,
          message: 'Score submitted successfully!'
        }, '*');
        
        toast({
          title: "Score Updated!",
          description: `Your score: ${score} points`,
        });
        
        await loadRoomData(false);
      } catch (error) {
        console.error('Error updating score:', error);
        
        event.source.postMessage({
          type: 'SCORE_SUBMITTED',
          success: false,
          error: 'Failed to submit score'
        }, '*');
        
        toast({
          title: "Error",
          description: "Failed to update score",
          variant: "destructive",
        });
      }
    } else if (event.data.type === 'GAME_READY') {
      event.source.postMessage({
        type: 'ROOM_INFO',
        roomId: roomId,
        gameId: room?.game?.id,
        playerCurrentScore: participants.find(p => p.user_id === user?.id)?.score || 0
      }, '*');
    }
  }, [roomId, user, handleCloseGame, loadRoomData, toast, room, participants]);

  // Listen for messages from game iframe - stable dependencies
  useEffect(() => {
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [handleMessage]);

  // Listen for messages from game iframe - stable dependencies
  useEffect(() => {
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [handleMessage]);

  useEffect(() => {
    loadRoomData();
    
    // Update current time every second for accurate countdown
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    return () => clearInterval(timer);
  }, [loadRoomData]);

  // Check for status updates less frequently - memoized condition
  const shouldCheckStatus = useMemo(() => {
    if (!room) return false;
    return room.status === 'waiting' || room.status === 'ongoing';
  }, [room?.status]);

  useEffect(() => {
    if (!shouldCheckStatus) return;

    const checkInterval = setInterval(async () => {
      const now = new Date();
      const startTime = new Date(room.start_time);
      const endTime = new Date(room.end_time);
      
      const shouldReload = 
        (room.status === 'waiting' && now >= startTime) ||
        (room.status === 'ongoing' && now >= endTime);
        
      if (shouldReload) {
        await loadRoomData(false);
      }
    }, 10000);
    
    return () => clearInterval(checkInterval);
  }, [shouldCheckStatus, room?.start_time, room?.end_time, room?.status, loadRoomData]);

// Simple GamePlayerModal - no unnecessary effects or dependencies
// const GamePlayerModal = React.memo(({ game, roomId, onClose }) => {
//   const gameUrls = {
//     '11111111-1111-1111-1111-111111111111': '/games/endless-runner/index.html',
//     '22222222-2222-2222-2222-222222222222': '/games/flappy-bird/index.html',
//   };

//   const gameUrl = gameUrls[game?.id];
  
//   if (!game || !gameUrl) {
//     return (
//       <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
//         <div className="bg-background border border-primary/30 rounded-xl p-8 text-center">
//           <p className="text-muted-foreground mb-4">This game is not available yet</p>
//           <button 
//             onClick={onClose}
//             className="bg-secondary text-primary font-cyber font-bold py-2 px-6 rounded-lg hover:bg-secondary/80 transition-colors"
//           >
//             Close
//           </button>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
//       <div className="bg-background border border-primary/30 rounded-xl w-full max-w-5xl max-h-[90vh] overflow-hidden">
//         <div className="flex items-center justify-between p-4 border-b border-primary/20">
//           <div className="flex items-center gap-4">
//             <h3 className="font-cyber text-xl text-primary">{game.name}</h3>
//             <span className="text-sm text-muted-foreground">Room: {roomId.slice(0, 8)}...</span>
//           </div>
//           <button 
//             onClick={onClose}
//             className="text-muted-foreground hover:text-primary transition-colors text-2xl font-bold"
//           >
//             ✕
//           </button>
//         </div>
//         <div className="relative w-full h-[600px] bg-black">
//           <iframe
//             src={gameUrl}
//             className="w-full h-full border-0"
//             title={game.name}
//             sandbox="allow-scripts allow-same-origin"
//           />
//         </div>
//       </div>
//     </div>
//   );
// });

  // Determine actual room status based on time
  const getActualStatus = useCallback(() => {
    if (!room) return 'waiting';
    
    const now = currentTime;
    const startTime = new Date(room.start_time);
    const endTime = new Date(room.end_time);
    
    // If room was manually cancelled or completed
    if (room.status === 'cancelled' || room.status === 'completed') {
      return room.status;
    }
    
    // Check time-based status
    if (now < startTime) {
      return 'waiting';
    } else if (now >= startTime && now < endTime) {
      // Game should be ongoing if we're past start time
      return 'ongoing';
    } else if (now >= endTime) {
      return 'completed';
    }
    
    return room.status;
  }, [room, currentTime]);

  const handlePlayGame = async () => {
    try {
      setIsLoadingGame(true);
      
      // Small delay to show loading state
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setShowGamePlayer(true);
      
      toast({
        title: "Game Loaded",
        description: "Game is ready to play!",
      });
    } catch (error) {
      console.error('Error loading game:', error);
      toast({
        title: "Error",
        description: "Failed to load game",
        variant: "destructive",
      });
    } finally {
      setIsLoadingGame(false);
    }
  };

  const handleStartGame = async () => {
    try {
      // Update room status to ongoing
      const { error } = await supabase
        .from('game_rooms')
        .update({ 
          status: 'ongoing',
          actual_start_time: new Date().toISOString()
        })
        .eq('id', roomId);

      if (error) {
        throw error;
      }

      toast({
        title: "Success",
        description: "Game started!",
      });

      // Reload room data
      await loadRoomData();
    } catch (error) {
      console.error('Error starting game:', error);
      toast({
        title: "Error",
        description: "Failed to start game",
        variant: "destructive",
      });
    }
  };

  const handleLeaveRoom = async () => {
    try {
      await leaveRoom(roomId);
      toast({
        title: "Success",
        description: "You have left the room",
      });
      onBack();
    } catch (error) {
      console.error('Error leaving room:', error);
      toast({
        title: "Error",
        description: "Failed to leave room",
        variant: "destructive",
      });
    }
  };

  const handleCancelRoom = async () => {
    try {
      await cancelRoom(roomId);
      toast({
        title: "Success",
        description: "Room cancelled and participants refunded",
      });
      onBack();
    } catch (error) {
      console.error('Error cancelling room:', error);
      toast({
        title: "Error",
        description: "Failed to cancel room",
        variant: "destructive",
      });
    }
  };

  const formatDateTime = (date) => {
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimeRemaining = (startTime) => {
    const start = new Date(startTime);
    const diff = start - currentTime;
    
    if (diff <= 0) return 'Game can start now!';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    if (hours > 0) return `Starts in ${hours}h ${minutes}m`;
    if (minutes > 0) return `Starts in ${minutes}m ${seconds}s`;
    return `Starts in ${seconds}s`;
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

  const getWinnerSplitDisplay = (rule) => {
    const splits = {
      'winner_takes_all': 'Winner Takes All (100%)',
      'top_2': 'Top 2 Players (60% / 40%)',
      'top_3': 'Top 3 Players (50% / 30% / 20%)',
      'top_4': 'Top 4 Players (40% / 30% / 20% / 10%)',
      'top_5': 'Top 5 Players',
      'top_10': 'Top 10 Players'
    };
    return splits[rule] || rule;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Room not found</p>
        <button onClick={onBack} className="mt-4 text-primary hover:underline">
          ← Back to Rooms
        </button>
      </div>
    );
  }

  const isCreator = room.creator_id === user?.id;
  const isParticipant = participants.some(p => p.user_id === user?.id && p.is_active);
  const actualStatus = getActualStatus();
  const hasReachedStartTime = currentTime >= new Date(room.start_time);
  const hasEnoughPlayers = room.current_players >= room.min_players_to_start;
  const canStartGame = isCreator && actualStatus === 'waiting' && hasEnoughPlayers && hasReachedStartTime;
  const canPlayGame = isParticipant && actualStatus === 'ongoing';
  const canCancelRoom = isCreator && actualStatus === 'waiting' && currentTime < new Date(room.start_time);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
        >
          <span className="text-2xl">←</span>
          <span className="font-cyber">Back to Rooms</span>
        </button>
        <div className={`px-4 py-2 rounded-full text-sm font-bold font-cyber border ${getStatusColor(room.status)}`}>
          {room.status.toUpperCase()}
        </div>
      </div>

      {/* Room Info Card */}
      <div className="bg-gradient-to-br from-card to-secondary/20 border-2 border-primary/30 rounded-2xl p-8 cyber-border">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="font-cyber text-3xl font-bold text-primary glow-text mb-2">
              {room.name}
            </h1>
            <p className="text-muted-foreground font-cyber">
              Game: <span className="text-foreground">{room.game?.name || 'Unknown Game'}</span>
            </p>
          </div>
          {room.is_private && (
            <div className="bg-purple-500/20 border border-purple-500/30 rounded-lg px-4 py-2">
              <p className="text-xs font-cyber text-purple-400">ROOM CODE</p>
              <p className="font-cyber text-xl text-purple-300">{room.room_code}</p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Prize Pool */}
          <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-xl p-4">
            <p className="text-sm font-cyber text-green-400 mb-1">Prize Pool</p>
            <p className="text-2xl font-cyber font-bold text-white glow-text-subtle">
              {room.total_prize_pool} {room.currency}
            </p>
            {room.is_sponsored && (
              <p className="text-xs font-cyber text-green-300 mt-1">Sponsored</p>
            )}
          </div>

          {/* Players */}
          <div className="bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-blue-500/30 rounded-xl p-4">
            <p className="text-sm font-cyber text-blue-400 mb-1">Players</p>
            <p className="text-2xl font-cyber font-bold text-white">
              {room.current_players} / {room.max_players}
            </p>
            <p className="text-xs font-cyber text-blue-300 mt-1">
              Min to start: {room.min_players_to_start}
            </p>
          </div>

          {/* Entry Fee */}
          <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-xl p-4">
            <p className="text-sm font-cyber text-yellow-400 mb-1">Entry Fee</p>
            <p className="text-2xl font-cyber font-bold text-white">
              {room.is_sponsored ? 'FREE' : `${room.entry_fee} ${room.currency}`}
            </p>
            <p className="text-xs font-cyber text-yellow-300 mt-1">
              {room.is_sponsored ? 'Sponsored Entry' : 'Per Player'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <div className="bg-secondary/30 rounded-lg p-4 border border-primary/20">
            <p className="text-sm font-cyber text-muted-foreground mb-1">Winner Split</p>
            <p className="font-cyber text-foreground">{getWinnerSplitDisplay(room.winner_split_rule)}</p>
          </div>
          <div className="bg-secondary/30 rounded-lg p-4 border border-primary/20">
            <p className="text-sm font-cyber text-muted-foreground mb-1">Host</p>
            <p className="font-cyber text-foreground">{room.creator?.username || 'Unknown'}</p>
          </div>
          <div className="bg-secondary/30 rounded-lg p-4 border border-primary/20">
            <p className="text-sm font-cyber text-muted-foreground mb-1">Start Time</p>
            <p className="font-cyber text-foreground">{formatDateTime(room.start_time)}</p>
            <p className="text-xs font-cyber text-accent mt-1">{getTimeRemaining(room.start_time)}</p>
          </div>
          <div className="bg-secondary/30 rounded-lg p-4 border border-primary/20">
            <p className="text-sm font-cyber text-muted-foreground mb-1">End Time</p>
            <p className="font-cyber text-foreground">{formatDateTime(room.end_time)}</p>
          </div>
        </div>
      </div>

      {/* Participants */}
      <div className="bg-gradient-to-br from-card to-secondary/20 border-2 border-primary/30 rounded-2xl p-6 cyber-border">
        <h2 className="font-cyber text-xl font-bold text-primary mb-4">Participants</h2>
        <div className="space-y-2">
          {participants.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No participants yet</p>
          ) : (
            participants
              .sort((a, b) => (b.score || 0) - (a.score || 0)) // Sort by score descending
              .map((participant, index) => (
                <div 
                  key={participant.id}
                  className="flex items-center justify-between bg-secondary/30 rounded-lg p-3 border border-primary/20"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-cyber text-lg text-primary">#{index + 1}</span>
                    <div>
                      <p className="font-cyber text-foreground">
                        {participant.user?.username || 'Unknown Player'}
                        {participant.user_id === user?.id && (
                          <span className="text-xs text-accent ml-2">(You)</span>
                        )}
                        {participant.user_id === room.creator_id && (
                          <span className="text-xs text-yellow-400 ml-2">(Host)</span>
                        )}
                      </p>
                      <p className="text-xs font-cyber text-muted-foreground">
                        Joined: {new Date(participant.joined_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  {(room.status === 'ongoing' || room.status === 'completed') && (
                    <div className="text-right">
                      <p className="font-cyber text-sm text-muted-foreground">Score</p>
                      <p className="font-cyber text-lg text-accent">{participant.score || 0}</p>
                    </div>
                  )}
                </div>
              ))
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        {/* Play Game Button - Shows when conditions are met */}
        {canPlayGame && (
          <button 
            onClick={handlePlayGame}
            disabled={isLoadingGame}
            className="flex-1 bg-gradient-to-r from-primary to-accent text-background font-cyber font-bold py-3 rounded-xl hover:scale-105 transition-all cyber-button shadow-lg hover:shadow-primary/50 disabled:opacity-50 disabled:hover:scale-100"
          >
            {isLoadingGame ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin">⚡</span> Loading Game...
              </span>
            ) : (
              '🎮 Play Game'
            )}
          </button>
        )}

        {/* Waiting for players message */}
        {room.status === 'waiting' && hasReachedStartTime && !hasEnoughPlayers && (
          <div className="flex-1 bg-yellow-600/20 border border-yellow-500/30 text-yellow-400 font-cyber font-bold py-3 rounded-xl text-center">
            ⏳ Waiting for minimum {room.min_players_to_start} players (Currently: {room.current_players})
          </div>
        )}

        {/* Waiting for start time */}
        {room.status === 'waiting' && !hasReachedStartTime && isParticipant && (
          <div className="flex-1 bg-blue-600/20 border border-blue-500/30 text-blue-400 font-cyber font-bold py-3 rounded-xl text-center">
            ⏰ Game starts {getTimeRemaining(room.start_time)}
          </div>
        )}

        {/* Game Completed */}
        {room.status === 'completed' && (
          <div className="flex-1 bg-gray-600/50 text-gray-300 font-cyber font-bold py-3 rounded-xl text-center">
            Game Completed - View Results Coming Soon
          </div>
        )}

        {/* Leave Room - Only before game starts */}
        {room.status === 'waiting' && isParticipant && !isCreator && !hasReachedStartTime && (
          <button 
            onClick={() => setShowLeaveConfirm(true)}
            className="flex-1 bg-gradient-to-r from-red-500 to-red-600 text-white font-cyber font-bold py-3 rounded-xl hover:scale-105 transition-all shadow-lg hover:shadow-red-500/50"
          >
            Leave Room
          </button>
        )}

        {/* Cancel Room - Only before start time */}
        {canCancelRoom && (
          <button 
            onClick={() => setShowCancelConfirm(true)}
            className="flex-1 bg-gradient-to-r from-red-500 to-red-600 text-white font-cyber font-bold py-3 rounded-xl hover:scale-105 transition-all shadow-lg hover:shadow-red-500/50"
          >
            Cancel Room
          </button>
        )}

        {/* Disabled Cancel - After start time */}
        {isCreator && room.status === 'waiting' && hasReachedStartTime && (
          <div className="flex-1 bg-gray-600/30 text-gray-500 font-cyber font-bold py-3 rounded-xl text-center cursor-not-allowed">
            Cannot Cancel - Game Time Reached
          </div>
        )}
      </div>

      {/* Leave Confirmation Modal */}
      {showLeaveConfirm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-card border-2 border-primary/50 rounded-2xl p-6 max-w-md w-full mx-4">
            <h3 className="font-cyber text-xl font-bold text-primary mb-4">Leave Room?</h3>
            <p className="text-muted-foreground mb-6">
              Are you sure you want to leave this room? You will forfeit your entry fee.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleLeaveRoom}
                className="flex-1 bg-red-500 text-white font-cyber font-bold py-2 rounded-lg hover:bg-red-600 transition-colors"
              >
                Leave Room
              </button>
              <button
                onClick={() => setShowLeaveConfirm(false)}
                className="flex-1 bg-secondary border border-primary/30 font-cyber font-bold py-2 rounded-lg hover:bg-secondary/80 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-card border-2 border-primary/50 rounded-2xl p-6 max-w-md w-full mx-4">
            <h3 className="font-cyber text-xl font-bold text-primary mb-4">Cancel Room?</h3>
            <p className="text-muted-foreground mb-6">
              Are you sure you want to cancel this room? All participants will be refunded their entry fees.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleCancelRoom}
                className="flex-1 bg-red-500 text-white font-cyber font-bold py-2 rounded-lg hover:bg-red-600 transition-colors"
              >
                Cancel Room
              </button>
              <button
                onClick={() => setShowCancelConfirm(false)}
                className="flex-1 bg-secondary border border-primary/30 font-cyber font-bold py-2 rounded-lg hover:bg-secondary/80 transition-colors"
              >
                Keep Room
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Game Player Modal */}
      {showGamePlayer && room?.game && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
          <div className="bg-background border border-primary/30 rounded-xl w-full max-w-5xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-primary/20">
              <div className="flex items-center gap-4">
                <h3 className="font-cyber text-xl text-primary">{room.game.name}</h3>
                <span className="text-sm text-muted-foreground">Room: {roomId.slice(0, 8)}...</span>
              </div>
              <button 
                onClick={handleCloseGame}
                className="text-muted-foreground hover:text-primary transition-colors text-2xl font-bold"
              >
                ✕
              </button>
            </div>
            <div className="relative w-full h-[600px] bg-black">
              <iframe
                src={room.game.id === '11111111-1111-1111-1111-111111111111' ? '/games/endless-runner/index.html' : '/games/flappy-bird/index.html'}
                className="w-full h-full border-0"
                title={room.game.name}
                sandbox="allow-scripts allow-same-origin"
              />
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

export default GameRoomDetails;