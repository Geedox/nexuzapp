import React, { useState, useEffect, useCallback } from 'react';
import { Download, Share2, Trophy, Star, Sparkles, Crown, Medal, Award, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

// Winner Celebration Modal Component (same as before)
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
      <div className="relative max-w-4xl w-full mx-4 bg-gradient-to-br from-gray-900/95 to-black/95 backdrop-blur-xl border-4 border-yellow-400 rounded-3xl overflow-hidden">
        
        {/* Glow Effect */}
        <div className={`absolute inset-0 bg-gradient-to-r ${getPositionColor(winner.position)} opacity-20 rounded-3xl blur-2xl`}></div>
        
        {/* Content */}
        <div className="relative z-10 p-8 text-center space-y-6">
          
          {/* Animated Trophy */}
          <div className={`text-9xl mb-6 ${animationStep >= 1 ? 'animate-bounce' : 'opacity-0 scale-0'} transition-all duration-1000`}>
            {winner.position === 1 ? '🏆' : winner.position === 2 ? '🥈' : winner.position === 3 ? '🥉' : '🏅'}
          </div>

          {/* Position Badge */}
          <div className={`${animationStep >= 1 ? 'scale-100 opacity-100' : 'scale-0 opacity-0'} transition-all duration-700`}>
            <div className={`inline-block px-12 py-4 bg-gradient-to-r ${getPositionColor(winner.position)} rounded-full shadow-2xl border-2 border-white/20`}>
              <span className="text-white font-bold text-3xl tracking-wider drop-shadow-lg">
                {getPositionText(winner.position)}
              </span>
            </div>
          </div>

          {/* Main Congratulations */}
          <div className={`${animationStep >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'} transition-all duration-700`}>
            <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-white via-yellow-200 to-white bg-clip-text text-transparent mb-4 drop-shadow-2xl">
              CONGRATULATIONS!
            </h1>
            <p className="text-2xl text-gray-200 font-semibold max-w-2xl mx-auto leading-relaxed">
              {getCelebrationMessage(winner.position)}
            </p>
          </div>

          {/* Player Info */}
          <div className={`${animationStep >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'} transition-all duration-700 delay-300`}>
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
          <div className={`${animationStep >= 3 ? 'opacity-100 scale-100' : 'opacity-0 scale-0'} transition-all duration-1000`}>
            <div className="bg-gradient-to-r from-green-500/30 to-emerald-500/30 border-2 border-green-400/50 rounded-3xl p-8 mb-8 backdrop-blur-sm">
              <p className="text-green-300 text-2xl mb-3 font-semibold">YOU WON</p>
              <p className="text-7xl font-bold text-green-400 glow-text-strong mb-2">
                {winner.earnings}
              </p>
              <p className="text-4xl font-bold text-green-300 mb-3">{winner.currency}</p>
              <p className="text-gray-300 text-lg">From: {winner.roomName}</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
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
            className="mt-8 bg-gray-700/50 hover:bg-gray-600/50 backdrop-blur-sm text-white px-10 py-4 rounded-2xl font-bold text-lg transition-all border border-gray-500/30"
          >
            Continue Gaming
          </button>
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

// Enhanced hook with better debugging and fallback mechanisms
const useWinnerCelebration = () => {
  const [showCelebration, setShowCelebration] = useState(false);
  const [winnerData, setWinnerData] = useState(null);
  const [checkedWins, setCheckedWins] = useState(new Set());
  const [debugInfo, setDebugInfo] = useState([]);
  const [subscriptionStatus, setSubscriptionStatus] = useState('disconnected');
  const { user } = useAuth();

  // Add debug log
  const addDebugLog = useCallback((message, data = null) => {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = { timestamp, message, data };
    console.log(`[WinnerCelebration ${timestamp}]`, message, data);
    setDebugInfo(prev => [...prev.slice(-9), logEntry]);
  }, []);

  // Manual trigger function for external use
  const triggerCelebration = useCallback((celebrationData) => {
    addDebugLog('Manual celebration triggered', celebrationData);
    setWinnerData(celebrationData);
    setShowCelebration(true);
    setCheckedWins(prev => new Set([...prev, celebrationData.roomId]));
  }, [addDebugLog]);

  // Listen for custom events to trigger celebration
  useEffect(() => {
    const handleCustomCelebration = (event) => {
      triggerCelebration(event.detail);
    };

    window.addEventListener('showWinCelebration', handleCustomCelebration);
    return () => window.removeEventListener('showWinCelebration', handleCustomCelebration);
  }, [triggerCelebration]);

  // Check for wins with enhanced error handling
  const checkForWins = useCallback(async (source = 'manual') => {
    if (!user) {
      addDebugLog('No user found, skipping win check');
      return;
    }

    try {
      addDebugLog(`Checking for wins (source: ${source})`, { userId: user.id });

      // First, get recent completed rooms
      const { data: completedRooms, error: roomsError } = await supabase
        .from('game_rooms')
        .select(`
          id,
          name,
          status,
          currency,
          current_players,
          actual_end_time,
          game:games(name)
        `)
        .eq('status', 'completed')
        .gte('actual_end_time', new Date(Date.now() - 10 * 60 * 1000).toISOString())
        .order('actual_end_time', { ascending: false })
        .limit(10);

      if (roomsError) {
        addDebugLog('Error fetching completed rooms', roomsError);
        return;
      }

      if (!completedRooms?.length) {
        addDebugLog('No recent completed rooms found');
        return;
      }

      // Then get user's wins from those rooms
      const roomIds = completedRooms.map(room => room.id);
      
      const { data: userWins, error: winsError } = await supabase
        .from('game_room_participants')
        .select(`
          id,
          room_id,
          user_id,
          final_position,
          earnings,
          score,
          payout_transaction_id,
          joined_at
        `)
        .eq('user_id', user.id)
        .in('room_id', roomIds)
        .not('final_position', 'is', null)
        .gt('earnings', 0)
        .order('joined_at', { ascending: false });

      if (winsError) {
        addDebugLog('Error fetching user wins', winsError);
        return;
      }

      addDebugLog(`Found ${userWins?.length || 0} user wins`, userWins);

      if (!userWins?.length) {
        addDebugLog('No recent wins found for user');
        return;
      }

      // Combine the data
      const recentWins = userWins.map(win => {
        const room = completedRooms.find(r => r.id === win.room_id);
        return {
          ...win,
          room: room
        };
      }).filter(win => win.room); // Only include wins where we found the room data

      addDebugLog(`Combined data for ${recentWins.length} wins`, recentWins);

      // Find the newest win we haven't shown yet
      const newWin = recentWins.find(win => !checkedWins.has(win.room.id));
      
      if (newWin) {
        addDebugLog('Found new win to celebrate!', newWin);

        const celebration = {
          position: newWin.final_position,
          earnings: newWin.earnings,
          currency: newWin.room.currency,
          roomName: newWin.room.name,
          gameName: 'Game', // Default since we don't have game data
          totalParticipants: newWin.room.current_players,
          playerName: user.username || user.email?.split('@')[0] || 'Champion',
          score: newWin.score || 0,
          roomId: newWin.room.id
        };

        setWinnerData(celebration);
        setShowCelebration(true);
        setCheckedWins(prev => new Set([...prev, newWin.room.id]));

        // Store in localStorage to persist
        const stored = JSON.parse(localStorage.getItem('shownWins') || '[]');
        localStorage.setItem('shownWins', JSON.stringify([...stored, newWin.room.id]));

        addDebugLog('Celebration modal should now be showing', celebration);
      } else {
        addDebugLog('All recent wins have already been shown');
      }
    } catch (error) {
      addDebugLog('Error in checkForWins', error);
    }
  }, [user, checkedWins, addDebugLog]);

  const closeCelebration = useCallback(() => {
    addDebugLog('Closing celebration modal');
    setShowCelebration(false);
    setWinnerData(null);
  }, [addDebugLog]);

  // Manual check function for debugging
  const manualCheck = useCallback(() => {
    addDebugLog('Manual win check triggered');
    checkForWins('manual-button');
  }, [checkForWins, addDebugLog]);

  // Load previously shown wins
  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('shownWins') || '[]');
    setCheckedWins(new Set(stored));
    addDebugLog('Loaded previously shown wins', stored);
  }, [addDebugLog]);

  // Enhanced real-time subscription with better error handling
  useEffect(() => {
    if (!user) return;

    addDebugLog('Setting up real-time subscription');

    const subscription = supabase
      .channel('user_wins_enhanced')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'game_room_participants',
        filter: `user_id=eq.${user.id}`
      }, (payload) => {
        addDebugLog('Real-time update received', payload);
        
        if (payload.new && payload.new.earnings > 0 && payload.new.final_position) {
          addDebugLog('Win detected via real-time! Scheduling check...');
          setTimeout(() => checkForWins('realtime-update'), 2000);
        }
      })
      .subscribe((status) => {
        addDebugLog('Subscription status changed', status);
        setSubscriptionStatus(status);
      });

    return () => {
      addDebugLog('Cleaning up subscription');
      subscription.unsubscribe();
    };
  }, [user, checkForWins, addDebugLog]);

  // Fallback periodic check with exponential backoff
  useEffect(() => {
    if (!user) return;
    
    addDebugLog('Setting up periodic win checks');
    
    // Initial check
    setTimeout(() => checkForWins('initial'), 1000);
    
    // More frequent checks for the first 5 minutes
    const frequentInterval = setInterval(() => checkForWins('frequent-poll'), 10000); // Every 10 seconds
    
    // Less frequent checks after 5 minutes
    const slowInterval = setInterval(() => checkForWins('slow-poll'), 60000); // Every minute
    
    // Stop frequent checks after 5 minutes
    const stopFrequent = setTimeout(() => {
      clearInterval(frequentInterval);
      addDebugLog('Switched to slow polling mode');
    }, 5 * 60 * 1000);
    
    return () => {
      clearInterval(frequentInterval);
      clearInterval(slowInterval);
      clearTimeout(stopFrequent);
    };
  }, [user, checkForWins, addDebugLog]);

  return { 
    showCelebration, 
    winnerData, 
    closeCelebration, 
    checkForWins: manualCheck,
    debugInfo,
    subscriptionStatus
  };
};

// Debug panel component
const WinnerCelebrationDebugPanel = ({ debugInfo, subscriptionStatus, onManualCheck }) => {
  const [showDebug, setShowDebug] = useState(false);

  if (!showDebug) {
    return (
      <button
        onClick={() => setShowDebug(true)}
        className="fixed bottom-4 right-4 bg-red-500 text-white p-3 rounded-full shadow-lg z-40"
        title="Show Winner Debug Panel"
      >
        <AlertCircle className="w-6 h-6" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black/90 backdrop-blur-sm border border-red-500/50 rounded-lg p-4 max-w-md w-80 z-40 text-sm">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-red-400 font-bold">Winner Debug Panel</h3>
        <button onClick={() => setShowDebug(false)} className="text-gray-400">✕</button>
      </div>
      
      <div className="space-y-2 mb-3">
        <div className="flex justify-between">
          <span className="text-gray-400">Subscription:</span>
          <span className={`font-mono ${subscriptionStatus === 'SUBSCRIBED' ? 'text-green-400' : 'text-red-400'}`}>
            {subscriptionStatus}
          </span>
        </div>
        
        <button
          onClick={onManualCheck}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-3 rounded text-xs"
        >
          Manual Win Check
        </button>
      </div>

      <div className="max-h-48 overflow-y-auto space-y-1">
        <h4 className="text-gray-400 text-xs font-bold">Recent Logs:</h4>
        {debugInfo.slice(-10).map((log, i) => (
          <div key={i} className="text-xs border-l-2 border-gray-600 pl-2">
            <div className="text-gray-500">{log.timestamp}</div>
            <div className="text-gray-300">{log.message}</div>
            {log.data && (
              <div className="text-gray-500 font-mono text-xs">
                {JSON.stringify(log.data, null, 2).substring(0, 100)}...
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// Main provider component
const WinnerCelebrationProvider = ({ children }) => {
  const { showCelebration, winnerData, closeCelebration, checkForWins, debugInfo, subscriptionStatus } = useWinnerCelebration();

  return (
    <>
      {children}
      <WinnerCelebrationModal
        isOpen={showCelebration}
        onClose={closeCelebration}
        winner={winnerData}
      />
      <WinnerCelebrationDebugPanel
        debugInfo={debugInfo}
        subscriptionStatus={subscriptionStatus}
        onManualCheck={checkForWins}
      />
    </>
  );
};

export default WinnerCelebrationProvider;