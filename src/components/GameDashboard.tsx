
const GameDashboard = () => {
  const featuredGames = [
    {
      title: "Crypto Blaster",
      genre: "Arcade",
      players: 1250,
      prize: 500,
      difficulty: "Medium",
      image: "🚀",
      status: "LIVE"
    },
    {
      title: "DeFi Runner",
      genre: "Endless",
      players: 890,
      prize: 300,
      difficulty: "Easy",
      image: "🏃",
      status: "LIVE"
    },
    {
      title: "NFT Wars",
      genre: "Strategy",
      players: 650,
      prize: 750,
      difficulty: "Hard",
      image: "⚔️",
      status: "STARTING"
    },
    {
      title: "Block Puzzle",
      genre: "Puzzle",
      players: 420,
      prize: 200,
      difficulty: "Easy",
      image: "🧩",
      status: "LIVE"
    }
  ];

  const gameStats = [
    { label: "Active Tournaments", value: "156", icon: "🏆", color: "text-yellow-400" },
    { label: "Total Prize Pool", value: "$25.6K", icon: "💰", color: "text-green-400" },
    { label: "Players Online", value: "8.9K", icon: "👥", color: "text-blue-400" },
    { label: "Games Available", value: "342", icon: "🎮", color: "text-purple-400" }
  ];

  return (
    <section className="py-20 bg-gradient-to-b from-background to-secondary/20 relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="cyber-grid opacity-5 absolute inset-0"></div>
        <div className="floating-particles"></div>
      </div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="font-gaming text-4xl md:text-6xl font-bold mb-6 text-primary glow-text">
            GAME DASHBOARD
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Discover trending games, join live tournaments, and track your gaming performance in real-time.
          </p>
        </div>

        {/* Game Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-16">
          {gameStats.map((stat, index) => (
            <div 
              key={index}
              className="bg-black/40 backdrop-blur-lg border border-primary/20 rounded-xl p-6 text-center hover:border-primary/40 transition-all duration-300 hover:scale-105 animate-slide-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="text-4xl mb-3 animate-bounce-slow">{stat.icon}</div>
              <div className={`text-3xl font-bold font-cyber ${stat.color} mb-2`}>{stat.value}</div>
              <div className="text-muted-foreground text-sm">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Featured Games */}
        <div className="mb-16">
          <h3 className="font-gaming text-3xl font-bold text-center mb-12 text-accent glow-text">
            🔥 TRENDING GAMES
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredGames.map((game, index) => (
              <div 
                key={index}
                className="bg-gradient-to-b from-card to-secondary/20 border border-primary/20 rounded-xl overflow-hidden hover:border-primary/40 transition-all duration-300 hover:scale-105 group animate-slide-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-6xl group-hover:scale-110 transition-transform">{game.image}</div>
                    <div className={`px-2 py-1 rounded-full text-xs font-bold ${
                      game.status === 'LIVE' 
                        ? 'bg-green-500/20 text-green-400' 
                        : 'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {game.status}
                    </div>
                  </div>
                  
                  <h4 className="font-gaming text-lg font-bold text-primary mb-2">{game.title}</h4>
                  <p className="text-muted-foreground text-sm mb-4">{game.genre}</p>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Players:</span>
                      <span className="text-foreground font-bold">{game.players}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Prize:</span>
                      <span className="text-accent font-bold">${game.prize}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Difficulty:</span>
                      <span className={`font-bold ${
                        game.difficulty === 'Easy' ? 'text-green-400' :
                        game.difficulty === 'Medium' ? 'text-yellow-400' : 'text-red-400'
                      }`}>
                        {game.difficulty}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="px-6 pb-6">
                  <button className="w-full bg-gradient-to-r from-primary to-accent text-background font-gaming font-bold py-2 px-4 rounded-lg hover:scale-105 transition-all duration-300">
                    {game.status === 'LIVE' ? 'JOIN NOW' : 'REGISTER'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions Dashboard */}
        <div className="bg-black/40 backdrop-blur-lg border border-accent/30 rounded-2xl p-8 animate-fade-in">
          <h3 className="font-cyber text-2xl font-bold text-center text-accent mb-8 glow-text">
            ⚡ QUICK ACTIONS
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <button className="bg-gradient-to-r from-primary/20 to-primary/10 border border-primary/30 rounded-xl p-6 hover:border-primary/50 transition-all duration-300 hover:scale-105 group">
              <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">🎮</div>
              <h4 className="font-gaming text-lg font-bold text-primary mb-2">CREATE GAME</h4>
              <p className="text-muted-foreground text-sm">Build your own game and start earning</p>
            </button>
            
            <button className="bg-gradient-to-r from-accent/20 to-accent/10 border border-accent/30 rounded-xl p-6 hover:border-accent/50 transition-all duration-300 hover:scale-105 group">
              <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">🏆</div>
              <h4 className="font-gaming text-lg font-bold text-accent mb-2">HOST TOURNAMENT</h4>
              <p className="text-muted-foreground text-sm">Create custom tournaments with prizes</p>
            </button>
            
            <button className="bg-gradient-to-r from-green-500/20 to-green-500/10 border border-green-500/30 rounded-xl p-6 hover:border-green-500/50 transition-all duration-300 hover:scale-105 group">
              <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">💰</div>
              <h4 className="font-gaming text-lg font-bold text-green-400 mb-2">VIEW EARNINGS</h4>
              <p className="text-muted-foreground text-sm">Track your gaming profits and rewards</p>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default GameDashboard;
