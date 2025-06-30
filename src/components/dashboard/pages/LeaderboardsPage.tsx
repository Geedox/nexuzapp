import { useLeaderboard } from '@/contexts/LeaderboardContext';
import React, { useState, useEffect, useRef } from 'react';

const LeaderboardsPage = () => {
  const [activeTab, setActiveTab] = useState('global');
  const { 
    leaderboards, 
    globalLeaderboard, 
    fetchLeaderboard, 
    fetchGlobalLeaderboard, 
    subscribeToLeaderboard,
    subscribeToGlobalLeaderboard,
    refreshAllLeaderboards,
    isLoading 
  } = useLeaderboard();

  // Use ref to track cleanup functions
  const unsubscribeRef = useRef<(() => void) | null>(null);

  const games = [
    { id: '11111111-1111-1111-1111-111111111111', name: 'Endless Runner', icon: '🏃' },
    { id: '22222222-2222-2222-2222-222222222222', name: 'Flappy Bird', icon: '🐦' }
  ];

  const tabs = [
    { id: 'global', name: 'Global Leaderboard', icon: '🌍' },
    ...games.map(game => ({ id: game.id, name: game.name, icon: game.icon }))
  ];

  // Fetch data on mount and tab change
  useEffect(() => {
    // Clean up previous subscription
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }

    if (activeTab === 'global') {
      fetchGlobalLeaderboard(50);
      unsubscribeRef.current = subscribeToGlobalLeaderboard();
    } else {
      fetchLeaderboard(activeTab, 50);
      unsubscribeRef.current = subscribeToLeaderboard(activeTab);
    }

    // Cleanup function
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [activeTab, fetchLeaderboard, fetchGlobalLeaderboard, subscribeToLeaderboard, subscribeToGlobalLeaderboard]);

  // Refresh button handler
  const handleRefresh = async () => {
    if (activeTab === 'global') {
      await fetchGlobalLeaderboard(50);
    } else {
      await fetchLeaderboard(activeTab, 50);
    }
  };

  // Get badge based on rank or performance
  const getBadge = (player) => {
    if (activeTab === 'global') {
      if (player.wins >= 100) return { name: 'LEGEND', style: 'bg-yellow-500/20 text-yellow-400' };
      if (player.wins >= 50) return { name: 'ELITE', style: 'bg-purple-500/20 text-purple-400' };
      if (player.wins >= 25) return { name: 'PRO', style: 'bg-blue-500/20 text-blue-400' };
      if (player.wins >= 10) return { name: 'EXPERT', style: 'bg-green-500/20 text-green-400' };
      if (player.wins >= 5) return { name: 'ADVANCED', style: 'bg-gray-500/20 text-gray-400' };
      return null;
    } else {
      // Game-specific badges based on score
      const score = player.total_score;
      if (activeTab === '11111111-1111-1111-1111-111111111111') { // Endless Runner
        if (score >= 5000) return { name: 'LEGEND', style: 'bg-yellow-500/20 text-yellow-400' };
        if (score >= 3000) return { name: 'ELITE', style: 'bg-purple-500/20 text-purple-400' };
        if (score >= 1500) return { name: 'PRO', style: 'bg-blue-500/20 text-blue-400' };
        if (score >= 800) return { name: 'EXPERT', style: 'bg-green-500/20 text-green-400' };
        if (score >= 400) return { name: 'ROOKIE', style: 'bg-gray-500/20 text-gray-400' };
      } else if (activeTab === '22222222-2222-2222-2222-222222222222') { // Flappy Bird
        if (score >= 100) return { name: 'LEGEND', style: 'bg-yellow-500/20 text-yellow-400' };
        if (score >= 50) return { name: 'ELITE', style: 'bg-purple-500/20 text-purple-400' };
        if (score >= 25) return { name: 'PRO', style: 'bg-blue-500/20 text-blue-400' };
        if (score >= 10) return { name: 'EXPERT', style: 'bg-green-500/20 text-green-400' };
        if (score >= 5) return { name: 'ROOKIE', style: 'bg-gray-500/20 text-gray-400' };
      }
      return null;
    }
  };

  // Get avatar emoji based on rank
  const getAvatar = (rank) => {
    if (rank === 1) return '🏆';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    if (rank <= 10) return '⭐';
    if (rank <= 25) return '💎';
    if (rank <= 50) return '🎮';
    return '🎯';
  };

  const renderLeaderboard = (players) => {
    if (isLoading) {
      return (
        <div className="text-center py-12">
          <div className="animate-spin text-4xl mb-4">⚡</div>
          <p className="text-muted-foreground">Loading leaderboard...</p>
        </div>
      );
    }

    if (!players || players.length === 0) {
      return (
        <div className="text-center py-12">
          <p className="text-muted-foreground text-lg mb-2">No scores yet!</p>
          <p className="text-sm text-muted-foreground">Be the first to set a high score</p>
          <button 
            onClick={handleRefresh}
            className="mt-4 px-4 py-2 bg-primary/20 text-primary rounded-lg font-cyber hover:bg-primary/30 transition-colors"
          >
            🔄 Refresh
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {players.map((player, index) => {
          const badge = getBadge(player);
          const isGlobal = activeTab === 'global';
          
          return (
            <div 
              key={player.id || player.user_id}
              className={`flex items-center justify-between p-4 rounded-lg border transition-all duration-300 hover:scale-[1.02] ${
                player.rank === 1 
                  ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-yellow-500/50' 
                  : player.rank === 2 
                  ? 'bg-gradient-to-r from-gray-400/20 to-gray-500/20 border-gray-400/50'
                  : player.rank === 3
                  ? 'bg-gradient-to-r from-amber-600/20 to-amber-700/20 border-amber-600/50'
                  : 'bg-secondary/20 border-primary/20 hover:border-primary/40'
              }`}
            >
              <div className="flex items-center space-x-4">
                <div className={`text-2xl font-bold font-cyber w-12 text-center ${
                  player.rank <= 3 ? 'text-accent glow-text' : 'text-muted-foreground'
                }`}>
                  #{player.rank}
                </div>
                <div className="text-3xl">{getAvatar(player.rank)}</div>
                <div>
                  <div className="font-cyber text-lg font-bold text-foreground">
                    {player.user?.display_name || player.user?.username || player.display_name || player.username || 'Anonymous'}
                  </div>
                  <div className="flex items-center space-x-3">
                    {badge && (
                      <div className={`text-xs px-3 py-1 rounded-full font-bold font-cyber ${badge.style}`}>
                        {badge.name}
                      </div>
                    )}
                    <span className="text-xs text-muted-foreground font-cyber">
                      {isGlobal 
                        ? `${player.total_wins || player.wins || 0} wins • ${player.total_games || player.games_played || 0} games`
                        : `${player.games_played || 0} games played`
                      }
                    </span>
                    {isGlobal && (player.total_earnings || 0) > 0 && (
                      <span className="text-xs text-green-400 font-cyber">
                        💰 ${Number(player.total_earnings || 0).toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-cyber text-xl font-bold text-primary">
                  {isGlobal 
                    ? `${player.total_wins || player.wins || 0} wins`
                    : `${(player.total_score || 0).toLocaleString()} pts`
                  }
                </div>
                <div className="text-xs text-muted-foreground font-cyber">
                  {isGlobal 
                    ? `${(player.total_score || 0).toLocaleString()} total score` 
                    : 'High Score'
                  }
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const getCurrentLeaderboard = () => {
    if (activeTab === 'global') {
      return globalLeaderboard;
    }
    return leaderboards[activeTab] || [];
  };

  const getTabTitle = () => {
    if (activeTab === 'global') {
      return 'Top Players by Wins';
    }
    const game = games.find(g => g.id === activeTab);
    return `${game?.name || 'Game'} High Scores`;
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="bg-gradient-to-r from-accent/20 to-primary/20 border border-accent/30 rounded-2xl p-6">
        <h1 className="font-cyber text-3xl font-bold text-accent mb-2 glow-text">
          🏆 Leaderboards
        </h1>
        <p className="text-muted-foreground">
          See where you rank among the best players worldwide
        </p>
        <button 
          onClick={refreshAllLeaderboards}
          className="mt-4 px-4 py-2 bg-accent/20 text-accent rounded-lg font-cyber hover:bg-accent/30 transition-colors"
          disabled={isLoading}
        >
          {isLoading ? '🔄 Refreshing...' : '🔄 Refresh All'}
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`font-cyber font-bold py-3 px-6 rounded-xl transition-all duration-300 hover:scale-105 ${
              activeTab === tab.id
                ? 'bg-gradient-to-r from-primary to-accent text-background'
                : 'bg-secondary/20 text-muted-foreground hover:text-foreground border border-primary/20'
            }`}
          >
            {tab.icon} {tab.name}
          </button>
        ))}
      </div>

      {/* Leaderboard Content */}
      <div className="bg-black/40 backdrop-blur-lg border border-primary/30 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-primary/20 flex justify-between items-center">
          <div>
            <h2 className="font-cyber text-xl font-bold text-primary">
              {getTabTitle()}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {activeTab === 'global' 
                ? 'Ranked by total wins across all games'
                : 'Ranked by highest score achieved'
              }
            </p>
          </div>
          <button 
            onClick={handleRefresh}
            className="px-3 py-2 bg-primary/20 text-primary rounded-lg font-cyber hover:bg-primary/30 transition-colors text-sm"
            disabled={isLoading}
          >
            {isLoading ? '⏳' : '🔄'}
          </button>
        </div>
        
        <div className="p-6">
          {renderLeaderboard(getCurrentLeaderboard())}
        </div>
      </div>

      {/* Legend */}
      <div className="bg-secondary/20 border border-primary/20 rounded-xl p-4">
        <h3 className="font-cyber text-sm font-bold text-primary mb-2">Badge Legend</h3>
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded-full font-cyber">LEGEND</span>
          <span className="bg-purple-500/20 text-purple-400 px-2 py-1 rounded-full font-cyber">ELITE</span>
          <span className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full font-cyber">PRO</span>
          <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded-full font-cyber">EXPERT</span>
          <span className="bg-gray-500/20 text-gray-400 px-2 py-1 rounded-full font-cyber">ROOKIE/ADVANCED</span>
        </div>
      </div>
    </div>
  );
};

export default LeaderboardsPage;