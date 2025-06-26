import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Play, Users, Clock, Trophy } from 'lucide-react';
import { useProfile } from '@/contexts/ProfileContext';
import { UsernameModal } from './UsernameModal';
import { useLocation } from 'react-router-dom';

const gameSlides = [
  {
    id: 1,
    title: "Crypto Blaster Elite",
    description: "High-octane space combat with crypto rewards",
    image: "🚀",
    gradient: "from-purple-500 to-pink-500",
    players: 1250,
    prize: "$2,500",
    status: "LIVE"
  },
  {
    id: 2,
    title: "DeFi Racing Championship",
    description: "Race through blockchain highways for USDC prizes",
    image: "🏎️",
    gradient: "from-blue-500 to-cyan-500",
    players: 890,
    prize: "$1,800",
    status: "STARTING"
  },
  {
    id: 3,
    title: "NFT Battle Arena",
    description: "Strategic combat using your NFT collection",
    image: "⚔️",
    gradient: "from-orange-500 to-red-500",
    players: 650,
    prize: "$3,200",
    status: "LIVE"
  }
];

const currentRooms = [
  { id: 1, name: "Elite Tournament", players: "45/50", prize: "$500", status: "Joining" },
  { id: 2, name: "Speed Run Challenge", players: "12/20", prize: "$200", status: "Live" },
  { id: 3, name: "Puzzle Masters", players: "8/10", prize: "$150", status: "Joining" },
];

const DashboardHome = () => {
  const location = useLocation();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const { profile, loading } = useProfile();
  const [activeSection, setActiveSection] = useState('home');

  // Check if username is needed
  useEffect(() => {
    if (!loading && profile && (!profile.username || profile.username === '')) {
      setShowUsernameModal(true);
    }
  }, [profile, loading]);

    // Handle navigation state
  useEffect(() => {
    if (location.state?.activeSection) {
      setActiveSection(location.state.activeSection);
    }
  }, [location]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % gameSlides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % gameSlides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + gameSlides.length) % gameSlides.length);
  };

  // Display username or fallback
  const displayName = profile?.username || profile?.display_name || 'Gamer';

  return (
    <>
      <div className="space-y-8 animate-fade-in">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-primary/20 to-accent/20 border border-primary/30 rounded-2xl p-6">
          <div className="flex items-center gap-4">
            {/* Avatar Display */}
            {profile?.avatar_url && (
              <div className="flex-shrink-0">
                {(() => {
                  // Extract avatar ID and emoji from avatar_url
                  const match = profile.avatar_url.match(/avatar_(\d+)_(.+)/);
                  if (match) {
                    const avatarId = parseInt(match[1]);
                    const emoji = match[2];
                    const avatar = [
                      { id: 1, color: 'from-purple-500 to-pink-500' },
                      { id: 2, color: 'from-blue-500 to-cyan-500' },
                      { id: 3, color: 'from-red-500 to-orange-500' },
                      { id: 4, color: 'from-green-500 to-emerald-500' },
                      { id: 5, color: 'from-yellow-500 to-amber-500' },
                      { id: 6, color: 'from-indigo-500 to-purple-500' },
                      { id: 7, color: 'from-gray-600 to-gray-800' },
                      { id: 8, color: 'from-orange-500 to-red-500' },
                      { id: 9, color: 'from-cyan-500 to-blue-500' },
                      { id: 10, color: 'from-yellow-400 to-orange-500' },
                    ].find(a => a.id === avatarId);
                    
                    return (
                      <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${avatar?.color || 'from-primary to-accent'} flex items-center justify-center text-4xl shadow-lg shadow-primary/30`}>
                        {decodeURIComponent(emoji)}
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>
            )}
            <div className="flex-1">
              <h1 className="font-gaming text-3xl font-bold text-primary mb-2">
                Welcome back, {displayName}! 🎮
              </h1>
              <p className="text-muted-foreground">Ready to dominate the leaderboards today?</p>
              <div className="flex items-center space-x-4 mt-4">
                <div className="bg-green-500/20 px-3 py-1 rounded-full text-green-400 text-sm">
                  Level {profile?.level || 1}
                </div>
                <div className="bg-yellow-500/20 px-3 py-1 rounded-full text-yellow-400 text-sm">
                  {profile?.current_rank || 'Junior'} Rank
                </div>
                <div className="bg-blue-500/20 px-3 py-1 rounded-full text-blue-400 text-sm">
                  {profile?.current_win_streak || 0} Win Streak
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Game Slider */}
        <div className="relative">
          <h2 className="font-gaming text-2xl font-bold text-accent mb-6">🔥 Featured Games</h2>
          <div className="relative bg-black/40 backdrop-blur-lg border border-primary/30 rounded-2xl overflow-hidden">
            <div className="relative h-96">
              {gameSlides.map((game, index) => (
                <div
                  key={game.id}
                  className={`absolute inset-0 transition-all duration-700 ease-in-out ${
                    index === currentSlide ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
                  }`}
                >
                  <div className={`bg-gradient-to-r ${game.gradient} h-full flex items-center justify-between p-12`}>
                    <div className="flex-1">
                      <div className="text-8xl mb-6 animate-bounce-slow">{game.image}</div>
                      <h3 className="font-gaming text-4xl font-bold text-white mb-4">{game.title}</h3>
                      <p className="text-xl text-white/80 mb-6">{game.description}</p>
                      <div className="flex items-center space-x-6 mb-6">
                        <div className="flex items-center text-white">
                          <Users className="w-5 h-5 mr-2" />
                          {game.players} players
                        </div>
                        <div className="flex items-center text-white">
                          <Trophy className="w-5 h-5 mr-2" />
                          {game.prize} prize
                        </div>
                        <div className={`px-3 py-1 rounded-full text-sm font-bold ${
                          game.status === 'LIVE' ? 'bg-green-500/30 text-green-300' : 'bg-yellow-500/30 text-yellow-300'
                        }`}>
                          {game.status}
                        </div>
                      </div>
                      <Button className="bg-white/20 backdrop-blur-lg text-white border border-white/30 hover:bg-white/30 hover:scale-105 transition-all duration-300">
                        <Play className="w-4 h-4 mr-2" />
                        {game.status === 'LIVE' ? 'Join Now' : 'Get Ready'}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Navigation Buttons */}
            <button
              onClick={prevSlide}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 backdrop-blur-lg p-3 rounded-full hover:bg-white/30 transition-all duration-300"
            >
              <ChevronLeft className="w-6 h-6 text-white" />
            </button>
            <button
              onClick={nextSlide}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 backdrop-blur-lg p-3 rounded-full hover:bg-white/30 transition-all duration-300"
            >
              <ChevronRight className="w-6 h-6 text-white" />
            </button>
            
            {/* Slide Indicators */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
              {gameSlides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    index === currentSlide ? 'bg-white' : 'bg-white/40'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Current Game Rooms */}
        <div>
          <h2 className="font-gaming text-2xl font-bold text-accent mb-6">🎯 Active Game Rooms</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {currentRooms.map((room) => (
              <div
                key={room.id}
                className="bg-gradient-to-br from-card to-secondary/20 border border-primary/20 rounded-xl p-6 hover:border-primary/40 transition-all duration-300 hover:scale-105 group"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-gaming text-lg font-bold text-primary">{room.name}</h3>
                  <div className={`px-2 py-1 rounded-full text-xs font-bold ${
                    room.status === 'Live' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'
                  }`}>
                    {room.status}
                  </div>
                </div>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Players:</span>
                    <span className="text-foreground font-bold">{room.players}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Prize Pool:</span>
                    <span className="text-accent font-bold">{room.prize}</span>
                  </div>
                </div>
                <Button className="w-full mt-4 bg-gradient-to-r from-primary to-accent text-background font-gaming font-bold hover:scale-105 transition-all duration-300">
                  {room.status === 'Live' ? 'Spectate' : 'Join Room'}
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-black/40 backdrop-blur-lg border border-primary/30 rounded-xl p-6 text-center">
            <div className="text-3xl mb-2">🎮</div>
            <div className="text-2xl font-bold text-primary font-cyber">{profile?.total_games_played || 0}</div>
            <div className="text-sm text-muted-foreground">Games Played</div>
          </div>
          <div className="bg-black/40 backdrop-blur-lg border border-accent/30 rounded-xl p-6 text-center">
            <div className="text-3xl mb-2">🏆</div>
            <div className="text-2xl font-bold text-accent font-cyber">{profile?.total_wins || 0}</div>
            <div className="text-sm text-muted-foreground">Victories</div>
          </div>
          <div className="bg-black/40 backdrop-blur-lg border border-green-500/30 rounded-xl p-6 text-center">
            <div className="text-3xl mb-2">💰</div>
            <div className="text-2xl font-bold text-green-400 font-cyber">
              ${profile?.total_earnings?.toFixed(2) || '0.00'}
            </div>
            <div className="text-sm text-muted-foreground">Total Earned</div>
          </div>
          <div className="bg-black/40 backdrop-blur-lg border border-yellow-500/30 rounded-xl p-6 text-center">
            <div className="text-3xl mb-2">⚡</div>
            <div className="text-2xl font-bold text-yellow-400 font-cyber">{profile?.current_win_streak || 0}</div>
            <div className="text-sm text-muted-foreground">Win Streak</div>
          </div>
        </div>
      </div>

      {/* Username Modal */}
      <UsernameModal
        open={showUsernameModal} 
        onClose={() => setShowUsernameModal(false)} 
      />
    </>
  );
};

export default DashboardHome;