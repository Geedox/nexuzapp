
const topGamers = [
  { rank: 1, name: "CryptoGamer_X", score: 125680, avatar: "🏆", badge: "LEGEND" },
  { rank: 2, name: "BlockchainMaster", score: 118940, avatar: "⚡", badge: "ELITE" },
  { rank: 3, name: "Web3Warrior", score: 112300, avatar: "🚀", badge: "PRO" },
  { rank: 4, name: "DeFiDestroyer", score: 108750, avatar: "💎", badge: "PRO" },
  { rank: 5, name: "NexuzHero", score: 105200, avatar: "🎮", badge: "EXPERT" }
];

const recentWinners = [
  { name: "SpeedRunner42", game: "Crypto Blaster", prize: "$150", time: "2 min ago" },
  { name: "PuzzleMaster", game: "Block Challenge", prize: "$75", time: "5 min ago" },
  { name: "RaceKing", game: "DeFi Racing", prize: "$200", time: "8 min ago" },
];

const DashboardRightPanel = () => {
  return (
    <aside className="bg-card/50 backdrop-blur-lg h-full">
      <div className="p-3 lg:p-6 space-y-6 lg:space-y-8">
        {/* Top Gamers Leaderboard */}
        <div className="animate-slide-up">
          <h3 className="font-cyber text-lg lg:text-xl font-bold text-primary mb-4 lg:mb-6 flex items-center">
            🏆 Top Gamers
          </h3>
          
          <div className="space-y-2 lg:space-y-3">
            {topGamers.map((gamer, index) => (
              <div 
                key={index}
                className={`flex items-center justify-between p-2 lg:p-3 rounded-lg border transition-all duration-300 hover:scale-105 ${
                  gamer.rank === 1 
                    ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-yellow-500/50' 
                    : gamer.rank === 2 
                    ? 'bg-gradient-to-r from-gray-400/20 to-gray-500/20 border-gray-400/50'
                    : gamer.rank === 3
                    ? 'bg-gradient-to-r from-amber-600/20 to-amber-700/20 border-amber-600/50'
                    : 'bg-secondary/20 border-primary/20 hover:border-primary/40'
                }`}
              >
                <div className="flex items-center space-x-2 lg:space-x-3">
                  <div className={`text-sm lg:text-lg font-bold font-cyber ${
                    gamer.rank <= 3 ? 'text-accent' : 'text-muted-foreground'
                  }`}>
                    #{gamer.rank}
                  </div>
                  <div className="text-lg lg:text-2xl">{gamer.avatar}</div>
                  <div>
                    <div className="font-cyber text-xs lg:text-sm text-foreground truncate max-w-[100px] lg:max-w-none">{gamer.name}</div>
                    <div className={`text-xs px-1 lg:px-2 py-1 rounded-full font-bold inline-block font-cyber ${
                      gamer.badge === 'LEGEND' ? 'bg-yellow-500/20 text-yellow-400' :
                      gamer.badge === 'ELITE' ? 'bg-purple-500/20 text-purple-400' :
                      gamer.badge === 'PRO' ? 'bg-blue-500/20 text-blue-400' :
                      'bg-green-500/20 text-green-400'
                    }`}>
                      {gamer.badge}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-cyber text-xs lg:text-sm text-primary">{gamer.score.toLocaleString()}</div>
                </div>
              </div>
            ))}
          </div>
          
          <button className="w-full mt-3 lg:mt-4 text-center text-accent hover:text-primary transition-colors font-cyber text-xs lg:text-sm">
            View Full Leaderboard →
          </button>
        </div>

        {/* Recent Winners */}
        <div className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <h3 className="font-cyber text-lg lg:text-xl font-bold text-accent mb-4 lg:mb-6 flex items-center">
            💰 Recent Winners
          </h3>
          
          <div className="space-y-2 lg:space-y-3">
            {recentWinners.map((winner, index) => (
              <div 
                key={index}
                className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-lg p-2 lg:p-4 hover:border-green-500/40 transition-all duration-300"
              >
                <div className="flex items-center justify-between mb-1 lg:mb-2">
                  <div className="font-cyber text-xs lg:text-sm text-green-400 truncate max-w-[100px] lg:max-w-none">{winner.name}</div>
                  <div className="text-xs text-muted-foreground font-cyber whitespace-nowrap">{winner.time}</div>
                </div>
                <div className="text-xs text-muted-foreground mb-1 font-cyber truncate">{winner.game}</div>
                <div className="font-bold text-green-300 font-cyber text-xs lg:text-sm">{winner.prize}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Live Statistics */}
        <div className="animate-slide-up" style={{ animationDelay: '0.4s' }}>
          <h3 className="font-cyber text-lg lg:text-xl font-bold text-primary mb-4 lg:mb-6">
            📊 Live Stats
          </h3>
          
          <div className="space-y-3 lg:space-y-4">
            <div className="bg-black/40 backdrop-blur-lg border border-primary/30 rounded-lg p-2 lg:p-4">
              <div className="flex justify-between items-center mb-1 lg:mb-2">
                <span className="text-xs lg:text-sm text-muted-foreground font-cyber">Active Players</span>
                <span className="text-sm lg:text-lg font-bold text-primary font-cyber">8,942</span>
              </div>
              <div className="w-full bg-secondary/20 rounded-full h-1 lg:h-2">
                <div className="bg-gradient-to-r from-primary to-accent h-1 lg:h-2 rounded-full w-3/4 animate-pulse"></div>
              </div>
            </div>
            
            <div className="bg-black/40 backdrop-blur-lg border border-accent/30 rounded-lg p-2 lg:p-4">
              <div className="flex justify-between items-center mb-1 lg:mb-2">
                <span className="text-xs lg:text-sm text-muted-foreground font-cyber">Live Tournaments</span>
                <span className="text-sm lg:text-lg font-bold text-accent font-cyber">24</span>
              </div>
              <div className="w-full bg-secondary/20 rounded-full h-1 lg:h-2">
                <div className="bg-gradient-to-r from-accent to-primary h-1 lg:h-2 rounded-full w-1/2 animate-pulse"></div>
              </div>
            </div>
            
            <div className="bg-black/40 backdrop-blur-lg border border-green-500/30 rounded-lg p-2 lg:p-4">
              <div className="flex justify-between items-center mb-1 lg:mb-2">
                <span className="text-xs lg:text-sm text-muted-foreground font-cyber">Prize Pool Today</span>
                <span className="text-sm lg:text-lg font-bold text-green-400 font-cyber">$45.2K</span>
              </div>
              <div className="w-full bg-secondary/20 rounded-full h-1 lg:h-2">
                <div className="bg-gradient-to-r from-green-400 to-emerald-400 h-1 lg:h-2 rounded-full w-4/5 animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default DashboardRightPanel;
