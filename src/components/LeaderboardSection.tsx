
const LeaderboardSection = () => {
  const topPlayers = [
    { rank: 1, name: "CryptoGamer_X", score: 125680, earnings: 1250, avatar: "🏆", badge: "LEGEND" },
    { rank: 2, name: "BlockchainMaster", score: 118940, earnings: 980, avatar: "⚡", badge: "ELITE" },
    { rank: 3, name: "Web3Warrior", score: 112300, earnings: 750, avatar: "🚀", badge: "PRO" },
    { rank: 4, name: "DeFiDestroyer", score: 108750, earnings: 680, avatar: "💎", badge: "PRO" },
    { rank: 5, name: "NexuzHero", score: 105200, earnings: 620, avatar: "🎮", badge: "EXPERT" }
  ];

  const topCreators = [
    { rank: 1, name: "GameStudio_Alpha", games: 15, earnings: 8750, avatar: "🎨", rating: 4.9 },
    { rank: 2, name: "IndieGameDev", games: 8, earnings: 6200, avatar: "🔥", rating: 4.8 },
    { rank: 3, name: "PixelCrafter", games: 12, earnings: 5800, avatar: "🎯", rating: 4.7 }
  ];

  return (
    <section className="py-20 bg-gradient-to-b from-secondary/20 to-background relative overflow-hidden">
      <div className="absolute inset-0 cyber-grid opacity-10"></div>
      <div className="floating-particles"></div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="font-gaming text-5xl md:text-6xl font-bold mb-6 text-primary glow-text">
            GLOBAL LEADERBOARDS
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Compete with the best players and creators worldwide. Climb the ranks and earn your place in gaming history.
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-12 max-w-7xl mx-auto">
          {/* Top Players */}
          <div className="bg-black/40 backdrop-blur-lg border border-primary/30 rounded-2xl p-8 animate-slide-up">
            <div className="flex items-center justify-center mb-8">
              <h3 className="font-cyber text-3xl font-bold text-primary glow-text flex items-center">
                🏆 TOP PLAYERS
              </h3>
            </div>
            
            <div className="space-y-4">
              {topPlayers.map((player, index) => (
                <div 
                  key={index}
                  className={`flex items-center justify-between p-4 rounded-lg border transition-all duration-300 hover:scale-105 animate-slide-up ${
                    player.rank === 1 
                      ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-yellow-500/50' 
                      : player.rank === 2 
                      ? 'bg-gradient-to-r from-gray-400/20 to-gray-500/20 border-gray-400/50'
                      : player.rank === 3
                      ? 'bg-gradient-to-r from-amber-600/20 to-amber-700/20 border-amber-600/50'
                      : 'bg-card/50 border-primary/20 hover:border-primary/40'
                  }`}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex items-center space-x-4">
                    <div className={`text-2xl font-bold font-cyber ${
                      player.rank <= 3 ? 'text-accent' : 'text-muted-foreground'
                    }`}>
                      #{player.rank}
                    </div>
                    <div className="text-3xl">{player.avatar}</div>
                    <div>
                      <div className="font-gaming text-lg text-foreground">{player.name}</div>
                      <div className="flex items-center space-x-2">
                        <span className={`text-xs px-2 py-1 rounded-full font-bold ${
                          player.badge === 'LEGEND' ? 'bg-yellow-500/20 text-yellow-400' :
                          player.badge === 'ELITE' ? 'bg-purple-500/20 text-purple-400' :
                          player.badge === 'PRO' ? 'bg-blue-500/20 text-blue-400' :
                          'bg-green-500/20 text-green-400'
                        }`}>
                          {player.badge}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-cyber text-lg text-primary">{player.score.toLocaleString()}</div>
                    <div className="text-sm text-accent">${player.earnings} earned</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Creators */}
          <div className="bg-black/40 backdrop-blur-lg border border-accent/30 rounded-2xl p-8 animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <div className="flex items-center justify-center mb-8">
              <h3 className="font-cyber text-3xl font-bold text-accent glow-text flex items-center">
                🎨 TOP CREATORS
              </h3>
            </div>
            
            <div className="space-y-6">
              {topCreators.map((creator, index) => (
                <div 
                  key={index}
                  className={`p-6 rounded-lg border transition-all duration-300 hover:scale-105 animate-slide-up ${
                    creator.rank === 1 
                      ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-500/50' 
                      : 'bg-card/50 border-accent/20 hover:border-accent/40'
                  }`}
                  style={{ animationDelay: `${index * 0.1 + 0.3}s` }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <div className="text-2xl font-bold text-accent font-cyber">#{creator.rank}</div>
                      <div className="text-3xl">{creator.avatar}</div>
                      <div>
                        <div className="font-gaming text-lg text-foreground">{creator.name}</div>
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          <span>⭐ {creator.rating}</span>
                          <span>•</span>
                          <span>{creator.games} games</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-cyber text-lg text-accent">${creator.earnings}</div>
                      <div className="text-sm text-muted-foreground">total earned</div>
                    </div>
                  </div>
                </div>
              ))}
              
              <div className="text-center pt-4">
                <button className="bg-gradient-to-r from-accent to-primary text-background font-gaming font-bold px-6 py-3 rounded-lg hover:scale-105 transition-all duration-300">
                  VIEW ALL CREATORS
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Challenge Section */}
        <div className="mt-16 text-center">
          <div className="bg-gradient-to-r from-primary/20 to-accent/20 border border-primary/30 rounded-2xl p-8 inline-block animate-float">
            <h3 className="font-gaming text-2xl font-bold text-primary mb-4">🚀 THINK YOU CAN COMPETE?</h3>
            <p className="text-muted-foreground mb-6 max-w-md">Join thousands of players battling for the top spot and crypto rewards!</p>
            <button className="bg-gradient-to-r from-primary to-accent text-background font-gaming font-bold px-8 py-3 rounded-lg hover:scale-105 transition-all duration-300 neon-border">
              START COMPETING NOW
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LeaderboardSection;
