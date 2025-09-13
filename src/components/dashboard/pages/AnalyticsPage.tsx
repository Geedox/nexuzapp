import Banner from "@/components/Banner";
import {
  getAnalyticsData,
  getRecentGames,
  getTrendData,
  type AnalyticsData,
  type RecentGame,
  type TrendData,
} from "@/lib/analytics";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

const AnalyticsPage = () => {
  const { user } = useAuth();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(
    null
  );
  const [recentGames, setRecentGames] = useState<RecentGame[]>([]);
  const [trendData, setTrendData] = useState<TrendData | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<
    "week" | "month" | "year"
  >("month");
  const [loading, setLoading] = useState(true);
  const [trendLoading, setTrendLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) return;

      try {
        setLoading(true);
        const [analytics, games, trends] = await Promise.all([
          getAnalyticsData(user.id),
          getRecentGames(user.id, 10),
          getTrendData(user.id, selectedPeriod),
        ]);

        setAnalyticsData(analytics);
        setRecentGames(games);
        setTrendData(trends);
      } catch (err) {
        console.error("Error fetching analytics data:", err);
        setError("Failed to load analytics data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Handle period change
  const handlePeriodChange = async (period: "week" | "month" | "year") => {
    if (!user?.id || period === selectedPeriod) return;

    setSelectedPeriod(period);
    setTrendLoading(true);

    try {
      const trends = await getTrendData(user.id, period);
      setTrendData(trends);
    } catch (err) {
      console.error("Error fetching trend data:", err);
      setError("Failed to load trend data");
    } finally {
      setTrendLoading(false);
    }
  };

  // Format data for display
  const formattedAnalyticsData = analyticsData
    ? [
        {
          label: "Games Played",
          value: analyticsData.gamesPlayed.toLocaleString(),
          change: trendData
            ? `${
                trendData.gamesPlayed.change >= 0 ? "+" : ""
              }${trendData.gamesPlayed.change.toFixed(1)}%`
            : "0",
          trend: trendData ? trendData.gamesPlayed.trend : "up",
        },
        {
          label: "Total Winnings",
          value: `$${analyticsData.totalWinnings.toFixed(2)}`,
          change: trendData
            ? `${
                trendData.totalWinnings.change >= 0 ? "+" : ""
              }${trendData.totalWinnings.change.toFixed(1)}%`
            : "0",
          trend: trendData ? trendData.totalWinnings.trend : "up",
        },
        {
          label: "Win Rate",
          value: `${analyticsData.winRate.toFixed(1)}%`,
          change: trendData
            ? `${
                trendData.winRate.change >= 0 ? "+" : ""
              }${trendData.winRate.change.toFixed(1)}%`
            : "0",
          trend: trendData ? trendData.winRate.trend : "up",
        },
        {
          label: "Hours Played",
          value: `${analyticsData.hoursPlayed.toFixed(1)}h`,
          change: trendData
            ? `${
                trendData.hoursPlayed.change >= 0 ? "+" : ""
              }${trendData.hoursPlayed.change.toFixed(1)}%`
            : "0",
          trend: trendData ? trendData.hoursPlayed.trend : "up",
        },
      ]
    : [];

  if (loading) {
    return (
      <div className="space-y-8 animate-fade-in">
        <Banner pathname="analytics" />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <div className="font-cyber text-lg text-muted-foreground">
              Loading analytics data...
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8 animate-fade-in">
        <Banner pathname="analytics" />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <div className="font-cyber text-lg text-red-400">{error}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <Banner pathname="analytics" />

      {/* Period Selector */}
      <div className="flex flex-col items-center space-y-2">
        <div className="bg-black/40 backdrop-blur-lg border border-primary/30 rounded-xl p-2">
          <div className="flex space-x-2">
            {(["week", "month", "year"] as const).map((period) => (
              <button
                key={period}
                onClick={() => handlePeriodChange(period)}
                className={`px-4 py-2 rounded-lg font-cyber font-bold transition-all duration-300 ${
                  selectedPeriod === period
                    ? "bg-gradient-to-r from-primary to-accent text-background"
                    : "text-muted-foreground hover:text-primary hover:bg-primary/10"
                }`}
              >
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <div className="text-xs text-muted-foreground font-cyber text-center flex items-center gap-2">
          <span>Trends show change compared to previous {selectedPeriod}</span>
          {trendLoading && (
            <div className="animate-spin rounded-full h-3 w-3 border-b border-primary"></div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {formattedAnalyticsData.map((stat, index) => (
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
                {trendLoading ? (
                  <div className="animate-spin rounded-full h-3 w-3 border-b border-current"></div>
                ) : (
                  stat.change
                )}
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
          {recentGames.length > 0 ? (
            recentGames.map((game, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-secondary/20 rounded-lg hover:bg-secondary/30 transition-all duration-300"
              >
                <div className="flex items-center space-x-4">
                  <div
                    className={`text-2xl ${
                      game.result === "WIN" ? "🏆" : "❌"
                    }`}
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
            ))
          ) : (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">🎮</div>
              <div className="font-cyber text-lg text-muted-foreground">
                No recent games found
              </div>
            </div>
          )}
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
              <span className="text-sm font-cyber text-foreground">
                {analyticsData
                  ? `${Math.round(
                      (analyticsData.winRate / 100) * analyticsData.gamesPlayed
                    )}/${analyticsData.gamesPlayed}`
                  : "0/0"}
              </span>
            </div>
            <div className="w-full bg-secondary/20 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-primary to-accent h-2 rounded-full"
                style={{
                  width:
                    analyticsData && analyticsData.gamesPlayed > 0
                      ? `${Math.min((analyticsData.winRate / 100) * 100, 100)}%`
                      : "0%",
                }}
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
