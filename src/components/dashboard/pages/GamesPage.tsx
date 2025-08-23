import React, { useState, useEffect } from 'react';
import { useGame } from '@/contexts/GameContext';
import { useLeaderboard } from '@/contexts/LeaderboardContext';
import { supabase } from '@/integrations/supabase/client';
import Banner from '@/components/Banner';


const GamesPage = () => {
  const [selectedGame, setSelectedGame] = useState(null);
  const [showGamePlayer, setShowGamePlayer] = useState(false);
  const [showGameDetails, setShowGameDetails] = useState(false);
  const [detailsGame, setDetailsGame] = useState(null);
  const [isLoadingGame, setIsLoadingGame] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [activeUsers, setActiveUsers] = useState({});

  const { initializeGame, handleGameMessage, playerRank, endGameSession } = useGame();
  const { fetchLeaderboard, subscribeToLeaderboard, getTopPlayers } = useLeaderboard();

  // Game data with UUID IDs matching the database
  const games = [
    {
      id: '11111111-1111-1111-1111-111111111111',
      name: "Endless Runner",
      players: 2150,
      status: "LIVE",
      image: "🏃",
      gameUrl: "https://cheerful-entremet-2dbb07.netlify.app/",
      instructions: "Press SPACE or Click to jump. Hold for higher jumps. Collect gems for bonus points! Difficulty increases every 100 points."
    },
    {
      id: '22222222-2222-2222-2222-222222222222',
      name: "Flappy Bird",
      players: 1840,
      status: "LIVE",
      image: "🐦",
      gameUrl: "https://stirring-unicorn-441851.netlify.app/",
      instructions: "Tap or click to flap. Navigate through pipes without hitting them! How far can you fly?"
    },
    {
      id: '33333333-3333-3333-3333-333333333333',
      name: "Crypto Jump",
      players: 890,
      status: "LIVE",
      image: "🏎️",
      gameUrl: "https://ornate-lamington-115e41.netlify.app/", // Replace with actual URL
      instructions: "Jump over obstacles and collect coins to score points. Use arrow keys to move left/right."
    },
  ];

  // Fetch active users for all games
  useEffect(() => {
    const fetchActiveUsers = async () => {
      const gameIds = ['11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333'];
      const counts = {};

      for (const gameId of gameIds) {
        try {
          const { data, error } = await supabase
            .rpc('get_active_users_count', { p_game_id: gameId });

          if (!error && data !== null) {
            counts[gameId] = data;
          }
        } catch (error) {
          console.error('Error fetching active users:', error);
        }
      }

      setActiveUsers(counts);
    };

    // Fetch immediately
    fetchActiveUsers();

    // Update every 30 seconds
    const interval = setInterval(fetchActiveUsers, 30000);

    return () => clearInterval(interval);
  }, []);

  // Listen for messages from game iframe
  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data.type === 'EXIT_GAME') {
        closeGamePlayer();
      } else {
        handleGameMessage(event);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [handleGameMessage]);

  // Handle playing a game
  const handlePlayGame = async (game) => {
    if (!game.gameUrl) return;

    setIsLoadingGame(true);

    // Initialize session and get current user info (you may already have this in context)
    const { data: { user } } = await supabase.auth.getUser(); // or use from context
    const userId = user?.id || 'guest';
    const sessionToken = Math.random().toString(36).substring(2); // generate one or use real token
    const gameId = game.id;

    // Construct URL with query params
    const url = new URL(game.gameUrl);
    url.searchParams.set('user_id', userId);
    url.searchParams.set('game_id', gameId);
    url.searchParams.set('session_token', sessionToken);
    url.searchParams.set('game_name', game.name);
    url.searchParams.set('instructions', game.instructions);
    url.searchParams.set('status', game.status);
    url.searchParams.set('players', game.players.toString());


    // Open in new tab or window
    const gameWindow = window.open(url.toString(), '_blank');

    // Track when user closes the game tab
    const interval = setInterval(() => {
      if (gameWindow?.closed) {
        clearInterval(interval);
        endGameSession(); // clean up session
        console.log(`Game session ended for ${game.name}`);
      }
    }, 1000);

    setIsLoadingGame(false);
  };



  // Handle showing game details
  const handleShowDetails = async (game) => {
    setIsLoadingDetails(true);
    setDetailsGame(game);

    // Only fetch leaderboard for games that exist in database
    if (game.id === '11111111-1111-1111-1111-111111111111' ||
      game.id === '22222222-2222-2222-2222-222222222222') {
      await fetchLeaderboard(game.id);
      subscribeToLeaderboard(game.id);
    }

    setShowGameDetails(true);
    setIsLoadingDetails(false);
  };

  // Close game player modal
  const closeGamePlayer = async () => {
    await endGameSession();
    setShowGamePlayer(false);
    setSelectedGame(null);
  };

  // Close game details modal
  const closeGameDetails = () => {
    setShowGameDetails(false);
    setDetailsGame(null);
  };

  // Game Details Modal Component
  const GameDetailsModal = () => {
    if (!detailsGame) return null;

    const topPlayers = getTopPlayers(detailsGame.id, 10);
    const hasLeaderboard = detailsGame.id === '11111111-1111-1111-1111-111111111111' ||
      detailsGame.id === '22222222-2222-2222-2222-222222222222';

    return (
      <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 animate-fade-in">
        <div className="bg-background border border-primary/30 rounded-xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-primary/20">
            <h3 className="font-cyber text-xl text-primary">{detailsGame.name} - Details</h3>
            <button
              onClick={closeGameDetails}
              className="text-muted-foreground hover:text-primary transition-colors text-2xl font-bold"
            >
              ✕
            </button>
          </div>

          <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
            {/* Game Instructions */}
            <div className="mb-6">
              <h4 className="font-cyber text-lg text-primary mb-2">📖 How to Play</h4>
              <p className="text-muted-foreground bg-secondary/20 p-4 rounded-lg">
                {detailsGame.instructions}
              </p>
            </div>

            Game Stats
            <div className="mb-6 flex gap-4">
              <div className="bg-secondary/20 p-4 rounded-lg flex-1">
                <div className="text-sm text-muted-foreground mb-1">Status</div>
                <div className={`font-cyber font-bold ${detailsGame.status === 'LIVE' ? 'text-green-400' :
                  detailsGame.status === 'STARTING' ? 'text-yellow-400' :
                    'text-gray-400'
                  }`}>
                  {detailsGame.status}
                </div>
              </div>
              <div className="bg-secondary/20 p-4 rounded-lg flex-1">
                <div className="text-sm text-muted-foreground mb-1">Active Players</div>
                <div className="font-cyber font-bold text-primary">
                  {detailsGame.players.toLocaleString()}
                </div>
              </div>
            </div>

            {/* Leaderboard */}
            {hasLeaderboard && (
              <div>
                <h4 className="font-cyber text-lg text-primary mb-4">🏆 Leaderboard</h4>
                <div className="space-y-2">
                  {topPlayers.length === 0 ? (
                    <div className="text-muted-foreground text-center py-8 bg-secondary/20 rounded-lg">
                      <p className="text-lg mb-2">No scores yet!</p>
                      <p className="text-sm">Be the first to set a high score</p>
                    </div>
                  ) : (
                    topPlayers.map((entry, index) => (
                      <div
                        key={entry.id}
                        className="flex items-center justify-between bg-secondary/20 p-3 rounded-lg hover:bg-secondary/30 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span className={`font-cyber text-lg min-w-[40px] ${index === 0 ? 'text-yellow-400' :
                            index === 1 ? 'text-gray-300' :
                              index === 2 ? 'text-orange-400' :
                                'text-muted-foreground'
                            }`}>
                            {index < 3 ? ['🥇', '🥈', '🥉'][index] : `#${entry.rank}`}
                          </span>
                          <span className="text-primary font-semibold">
                            {entry.user?.display_name || entry.user?.username || 'Anonymous'}
                          </span>
                        </div>
                        <span className="font-cyber text-accent">
                          {entry.total_score.toLocaleString()} pts
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {!hasLeaderboard && detailsGame.status !== 'LIVE' && (
              <div className="text-center py-8 bg-secondary/20 rounded-lg">
                <p className="text-muted-foreground">Leaderboard will be available when the game goes live!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Game Player Modal Component
  // const GamePlayerModal = () => {
  //   useEffect(() => {
  //     // Send player rank to iframe when it changes
  //     if (selectedGame && playerRank && showGamePlayer) {
  //       const iframe = document.querySelector('iframe');
  //       if (iframe && iframe.contentWindow) {
  //         iframe.contentWindow.postMessage({
  //           type: 'PLAYER_RANK',
  //           rank: playerRank.rank,
  //           totalPlayers: playerRank.total_players,
  //           highScore: playerRank.high_score || 0
  //         }, '*');
  //       }
  //     }
  //   }, [playerRank, selectedGame, showGamePlayer]);

  //   if (!selectedGame) return null;

  //   return (
  //     <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 animate-fade-in">
  //       <div className="bg-background border border-primary/30 rounded-xl w-full max-w-5xl max-h-[90vh] overflow-hidden">
  //         <div className="flex items-center justify-between p-4 border-b border-primary/20">
  //           <div className="flex items-center gap-4">
  //             <h3 className="font-cyber text-xl text-primary">{selectedGame.name}</h3>
  //           </div>
  //           <button 
  //             onClick={closeGamePlayer}
  //             className="text-muted-foreground hover:text-primary transition-colors text-2xl font-bold"
  //           >
  //             ✕
  //           </button>
  //         </div>
  //         <div className="relative w-full h-[600px] bg-black">
  //           <iframe
  //             src={selectedGame.gameUrl}
  //             className="w-full h-full border-0"
  //             title={selectedGame.name}
  //             sandbox="allow-scripts allow-same-origin"
  //           />
  //         </div>
  //       </div>
  //     </div>
  //   );
  // };

  return (
    <>
      <div className="space-y-8 animate-fade-in">
        {/* Page Header */}
        <Banner pathname='/games' />

        {/* Games Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {games.map((game) => (
            <div
              key={game.id}
              className="bg-gradient-to-br from-card to-secondary/20 border border-primary/20 rounded-xl p-6 hover:border-primary/40 transition-all duration-300 hover:scale-105 group"
            >
              {/* Game Icon */}
              <div className="text-6xl mb-4 text-center group-hover:scale-110 transition-transform">
                {game.image}
              </div>

              {/* Game Name */}
              <h3 className="font-cyber text-lg font-bold text-primary mb-2">
                {game.name}
              </h3>

              {/* Game Info */}
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm text-muted-foreground font-cyber">
                  {activeUsers[game.id] || 0} active users
                </span>
                <div className={`px-2 py-1 rounded-full text-xs font-bold font-cyber ${game.status === 'LIVE' ? 'bg-green-500/20 text-green-400' :
                  game.status === 'STARTING' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-gray-500/20 text-gray-400'
                  }`}>
                  {game.status}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => handlePlayGame(game)}
                  className="flex-1 bg-gradient-to-r from-primary to-accent text-background font-cyber font-bold py-2 rounded-lg hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 relative"
                  disabled={!game.gameUrl || isLoadingGame}
                >
                  {isLoadingGame && selectedGame?.id === game.id ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="animate-spin">⚡</span> Loading...
                    </span>
                  ) : (
                    game.gameUrl ? 'Play' : 'Coming Soon'
                  )}
                </button>
                <button
                  onClick={() => handleShowDetails(game)}
                  className="px-4 bg-secondary/50 text-primary font-cyber font-bold py-2 rounded-lg hover:bg-secondary/70 transition-all duration-300 relative"
                  disabled={isLoadingDetails && detailsGame?.id === game.id}
                >
                  {isLoadingDetails && detailsGame?.id === game.id ? (
                    <span className="animate-spin">⚡</span>
                  ) : (
                    'Details'
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modals */}
      {/* {showGamePlayer && selectedGame && <GamePlayerModal />} */}
      {showGameDetails && detailsGame && <GameDetailsModal />}
    </>
  );
};

export default GamesPage;