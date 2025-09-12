import Banner from "@/components/Banner";

const AnalyticsPage = () => {
  const analyticsData = [
    { label: "Games Played", value: "1,247", change: "+12%", trend: "up" },
    { label: "Total Winnings", value: "$8,450", change: "+8.5%", trend: "up" },
    { label: "Win Rate", value: "68%", change: "+2.1%", trend: "up" },
    { label: "Hours Played", value: "342h", change: "-5%", trend: "down" },
  ];

  const recentGames = [
    {
      game: "Crypto Blaster",
      result: "WIN",
      amount: "+$250",
      date: "2 hours ago",
    },
    {
      game: "DeFi Racing",
      result: "WIN",
      amount: "+$120",
      date: "5 hours ago",
    },
    { game: "NFT Arena", result: "LOSS", amount: "-$50", date: "1 day ago" },
    {
      game: "Space Mining",
      result: "WIN",
      amount: "+$180",
      date: "2 days ago",
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <Banner pathname="analytics" />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {analyticsData.map((stat, index) => (
          <div
            key={index}
            className="bg-black/40 backdrop-blur-lg border border-primary/30 rounded-xl p-6"
          >
            <div className="flex justify-between items-start mb-2">
              <div className="text-sm text-muted-foreground font-cyber">
                {stat.label}
              </div>
              <div
                className={`text-xs font-cyber font-bold ${
                  stat.trend === "up" ? "text-green-400" : "text-red-400"
                }`}
              >
                {stat.change}
              </div>
            </div>
            <div className="text-3xl font-bold text-primary font-cyber">
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      {/* Performance Chart Placeholder */}
      <div className="bg-black/40 backdrop-blur-lg border border-primary/30 rounded-2xl p-6">
        <h2 className="font-cyber text-xl font-bold text-primary mb-4">
          Weekly Performance
        </h2>
        <div className="h-64 bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4">📈</div>
            <div className="font-cyber text-lg text-muted-foreground">
              Performance Chart Coming Soon
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-black/40 backdrop-blur-lg border border-primary/30 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-primary/20">
          <h2 className="font-cyber text-xl font-bold text-primary">
            Recent Game Activity
          </h2>
        </div>

        <div className="space-y-2 p-6">
          {recentGames.map((game, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-4 bg-secondary/20 rounded-lg hover:bg-secondary/30 transition-all duration-300"
            >
              <div className="flex items-center space-x-4">
                <div
                  className={`text-2xl ${game.result === "WIN" ? "🏆" : "❌"}`}
                ></div>
                <div>
                  <div className="font-cyber font-bold text-foreground">
                    {game.game}
                  </div>
                  <div className="text-sm text-muted-foreground font-cyber">
                    {game.date}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div
                  className={`font-cyber font-bold text-lg ${
                    game.result === "WIN" ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {game.amount}
                </div>
                <div
                  className={`text-xs font-cyber ${
                    game.result === "WIN" ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {game.result}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Goals & Achievements */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-black/40 backdrop-blur-lg border border-primary/30 rounded-xl p-6">
          <h3 className="font-cyber text-lg font-bold text-primary mb-4">
            🎯 Monthly Goals
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-cyber text-muted-foreground">
                Games Won
              </span>
              <span className="text-sm font-cyber text-foreground">45/50</span>
            </div>
            <div className="w-full bg-secondary/20 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-primary to-accent h-2 rounded-full"
                style={{ width: "90%" }}
              ></div>
            </div>
          </div>
        </div>

        <div className="bg-black/40 backdrop-blur-lg border border-primary/30 rounded-xl p-6">
          <h3 className="font-cyber text-lg font-bold text-primary mb-4">
            🏆 Achievements
          </h3>
          <div className="flex space-x-2">
            <div className="text-2xl" title="100 Games Won">
              🥇
            </div>
            <div className="text-2xl" title="Crypto Master">
              💎
            </div>
            <div className="text-2xl" title="Speed Demon">
              ⚡
            </div>
            <div className="text-2xl" title="High Roller">
              🎰
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
