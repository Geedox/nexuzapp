import React, { useState, useEffect, useCallback } from "react";
import { useLeaderboard } from "@/contexts/LeaderboardContext";
import { useGameRoom } from "@/contexts/GameRoomContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface RecentWinner {
  name: string;
  game: string;
  prize: string;
  time: string;
  currency: string;
}

interface LiveStats {
  activePlayers: number;
  liveRooms: number;
  prizePoolToday: number;
}

const DashboardRightPanel = () => {
  const { globalLeaderboard, fetchGlobalLeaderboard } = useLeaderboard();
  const { rooms } = useGameRoom();
  const [recentWinners, setRecentWinners] = useState<RecentWinner[]>([]);
  const [liveStats, setLiveStats] = useState<LiveStats>({
    activePlayers: 0,
    liveRooms: 0,
    prizePoolToday: 0,
  });
  const navigate = useNavigate();

  // Fetch recent winners from transactions
  const fetchRecentWinners = useCallback(async () => {
    try {
      // Fetch recent winning transactions with user and room details
      const { data, error } = await supabase
        .from("transactions")
        .select(
          `
          *,
          user:profiles(username, display_name),
          room:game_rooms(
            name,
            currency,
            game:games(name)
          )
        `
        )
        .eq("type", "win")
        .eq("status", "completed")
        .order("created_at", { ascending: false })
        .limit(3);

      if (error) throw error;

      const winners: RecentWinner[] = (data || []).map((transaction: any) => {
        const timeAgo = getTimeAgo(new Date(transaction.created_at));
        const userName =
          transaction.user?.display_name ||
          transaction.user?.username ||
          "Anonymous";
        const gameName =
          transaction.room?.game?.name ||
          transaction.room?.name ||
          "Unknown Game";

        return {
          name: userName,
          game: gameName,
          prize: `$${Number(transaction.amount).toFixed(2)}`,
          time: timeAgo,
          currency: transaction.currency || "USDC",
        };
      });

      setRecentWinners(winners);
    } catch (error) {
      console.error("Error fetching recent winners:", error);
    }
  }, []);

  // Calculate live statistics
  const calculateLiveStats = useCallback(async () => {
    try {
      // Get active players (users who have been active in last 24 hours)
      const { data: activeUsers, error: activeError } = await supabase
        .from("profiles")
        .select("id")
        .gte(
          "updated_at",
          new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
        );

      // Get today's prize pool from completed transactions
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data: todayWinnings, error: winningsError } = await supabase
        .from("transactions")
        .select("amount")
        .eq("type", "win")
        .eq("status", "completed")
        .gte("created_at", today.toISOString());

      const activePlayers = activeUsers?.length || 0;
      const liveRooms = rooms.filter(
        (room) => room.status === "ongoing" || room.status === "waiting"
      ).length;

      const prizePoolToday = (todayWinnings || []).reduce(
        (sum, transaction) => sum + Number(transaction.amount),
        0
      );

      setLiveStats({
        activePlayers,
        liveRooms,
        prizePoolToday,
      });
    } catch (error) {
      console.error("Error calculating live stats:", error);
    }
  }, [rooms]);

  // Helper function to calculate time ago
  const getTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return `${diffInSeconds} sec ago`;
    if (diffInSeconds < 3600)
      return `${Math.floor(diffInSeconds / 60)} min ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)} hr ago`;
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
  };

  // Get badge for player based on wins
  const getBadge = (wins: number) => {
    if (wins >= 100)
      return { name: "LEGEND", style: "bg-yellow-500/20 text-yellow-400" };
    if (wins >= 50)
      return { name: "ELITE", style: "bg-purple-500/20 text-purple-400" };
    if (wins >= 25)
      return { name: "PRO", style: "bg-blue-500/20 text-blue-400" };
    if (wins >= 10)
      return { name: "EXPERT", style: "bg-green-500/20 text-green-400" };
    return { name: "ROOKIE", style: "bg-gray-500/20 text-gray-400" };
  };

  // Get avatar based on rank
  const getAvatar = (rank: number) => {
    if (rank === 1) return "🏆";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    if (rank <= 5) return "⚡";
    return "🎮";
  };

  // Load data on component mount
  useEffect(() => {
    fetchGlobalLeaderboard(5); // Get top 5 for sidebar
    fetchRecentWinners();
    calculateLiveStats();

    // Set up intervals for real-time updates
    const winnersInterval = setInterval(fetchRecentWinners, 30000); // Update every 30 seconds
    const statsInterval = setInterval(calculateLiveStats, 60000); // Update every minute

    return () => {
      clearInterval(winnersInterval);
      clearInterval(statsInterval);
    };
  }, [fetchGlobalLeaderboard, fetchRecentWinners, calculateLiveStats]);

  // Update live stats when rooms change
  useEffect(() => {
    calculateLiveStats();
  }, [rooms, calculateLiveStats]);

  const topGamers = globalLeaderboard.slice(0, 5).map((player, index) => ({
    rank: index + 1,
    name: player.user?.display_name || player.user?.username || "Anonymous",
    score: player.wins || 0,
    avatar: getAvatar(index + 1),
    badge: getBadge(player.wins || 0).name,
    badgeStyle: getBadge(player.wins || 0).style,
  }));

  return (
    <aside className="pt-20 bg-card/50 backdrop-blur-lg h-full fixed right-0 w-full lg:w-1/5 2xl:w-1/6 border-l border-secondary/20 z-10 overflow-y-scroll">
      <div className="p-3 lg:p-6 space-y-6 lg:space-y-8 ">
        {/* Top Gamers Leaderboard */}
        <div className="animate-slide-up">
          <h3 className="font-cyber text-lg lg:text-xl font-bold text-primary mb-4 lg:mb-6 flex items-center">
            🏆 Top Gamers
          </h3>

          <div className="space-y-2 lg:space-y-3">
            {topGamers.length > 0 ? (
              topGamers.map((gamer, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-between p-2 lg:p-3 rounded-lg border transition-all duration-300 hover:scale-105 cursor-pointer ${
                    gamer.rank === 1
                      ? "bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-yellow-500/50"
                      : gamer.rank === 2
                      ? "bg-gradient-to-r from-gray-400/20 to-gray-500/20 border-gray-400/50"
                      : gamer.rank === 3
                      ? "bg-gradient-to-r from-amber-600/20 to-amber-700/20 border-amber-600/50"
                      : "bg-secondary/20 border-primary/20 hover:border-primary/40"
                  }`}
                  onClick={() => navigate("/leaderboards")}
                >
                  <div className="flex items-center space-x-2 lg:space-x-3">
                    <div
                      className={`text-sm lg:text-lg font-bold font-cyber ${
                        gamer.rank <= 3
                          ? "text-accent"
                          : "text-muted-foreground"
                      }`}
                    >
                      #{gamer.rank}
                    </div>
                    <div className="text-lg lg:text-2xl">{gamer.avatar}</div>
                    <div>
                      <div className="font-cyber text-xs lg:text-sm text-foreground truncate max-w-[100px] lg:max-w-none">
                        {gamer.name}
                      </div>
                      <div
                        className={`text-xs px-1 lg:px-2 py-1 rounded-full font-bold inline-block font-cyber ${gamer.badgeStyle}`}
                      >
                        {gamer.badge}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-cyber text-xs lg:text-sm text-primary">
                      {gamer.score} wins
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4">
                <p className="text-muted-foreground text-sm">No players yet</p>
                <p className="text-xs text-muted-foreground">
                  Start playing to appear here!
                </p>
              </div>
            )}
          </div>

          <button
            onClick={() => navigate("/dashboard/leaderboards")}
            className="w-full mt-3 lg:mt-4 text-center text-accent hover:text-primary transition-colors font-cyber text-xs lg:text-sm"
          >
            View Full Leaderboard →
          </button>
        </div>

        {/* Recent Winners */}
        <div className="animate-slide-up" style={{ animationDelay: "0.2s" }}>
          <h3 className="font-cyber text-lg lg:text-xl font-bold text-accent mb-4 lg:mb-6 flex items-center">
            💰 Recent Winners
          </h3>

          <div className="space-y-2 lg:space-y-3">
            {recentWinners.length > 0 ? (
              recentWinners.map((winner, index) => (
                <div
                  key={index}
                  className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-lg p-2 lg:p-4 hover:border-green-500/40 transition-all duration-300"
                >
                  <div className="flex items-center justify-between mb-1 lg:mb-2">
                    <div className="font-cyber text-xs lg:text-sm text-green-400 truncate max-w-[100px] lg:max-w-none">
                      {winner.name}
                    </div>
                    <div className="text-xs text-muted-foreground font-cyber whitespace-nowrap">
                      {winner.time}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground mb-1 font-cyber truncate">
                    {winner.game}
                  </div>
                  <div className="font-bold text-green-300 font-cyber text-xs lg:text-sm">
                    {winner.prize} {winner.currency}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4">
                <p className="text-muted-foreground text-sm">
                  No recent winners
                </p>
                <p className="text-xs text-muted-foreground">
                  Be the first to win!
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Live Statistics */}
        <div className="animate-slide-up" style={{ animationDelay: "0.4s" }}>
          <h3 className="font-cyber text-lg lg:text-xl font-bold text-primary mb-4 lg:mb-6">
            📊 Live Stats
          </h3>

          <div className="space-y-3 lg:space-y-4">
            <div className="bg-black/40 backdrop-blur-lg border border-primary/30 rounded-lg p-2 lg:p-4">
              <div className="flex justify-between items-center mb-1 lg:mb-2">
                <span className="text-xs lg:text-sm text-muted-foreground font-cyber">
                  Active Players
                </span>
                <span className="text-sm lg:text-lg font-bold text-primary font-cyber">
                  {liveStats.activePlayers.toLocaleString()}
                </span>
              </div>
              <div className="w-full bg-secondary/20 rounded-full h-1 lg:h-2">
                <div
                  className="bg-gradient-to-r from-primary to-accent h-1 lg:h-2 rounded-full animate-pulse transition-all duration-1000"
                  style={{
                    width: `${Math.min(
                      100,
                      (liveStats.activePlayers / 100) * 100
                    )}%`,
                  }}
                ></div>
              </div>
            </div>

            <div className="bg-black/40 backdrop-blur-lg border border-accent/30 rounded-lg p-2 lg:p-4">
              <div className="flex justify-between items-center mb-1 lg:mb-2">
                <span className="text-xs lg:text-sm text-muted-foreground font-cyber">
                  Live Rooms
                </span>
                <span className="text-sm lg:text-lg font-bold text-accent font-cyber">
                  {liveStats.liveRooms}
                </span>
              </div>
              <div className="w-full bg-secondary/20 rounded-full h-1 lg:h-2">
                <div
                  className="bg-gradient-to-r from-accent to-primary h-1 lg:h-2 rounded-full animate-pulse transition-all duration-1000"
                  style={{
                    width: `${Math.min(
                      100,
                      (liveStats.liveRooms / 50) * 100
                    )}%`,
                  }}
                ></div>
              </div>
            </div>

            <div className="bg-black/40 backdrop-blur-lg border border-green-500/30 rounded-lg p-2 lg:p-4">
              <div className="flex justify-between items-center mb-1 lg:mb-2">
                <span className="text-xs lg:text-sm text-muted-foreground font-cyber">
                  Prize Pool Today
                </span>
                <span className="text-sm lg:text-lg font-bold text-green-400 font-cyber">
                  $
                  {liveStats.prizePoolToday.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
              <div className="w-full bg-secondary/20 rounded-full h-1 lg:h-2">
                <div
                  className="bg-gradient-to-r from-green-400 to-emerald-400 h-1 lg:h-2 rounded-full animate-pulse transition-all duration-1000"
                  style={{
                    width: `${Math.min(
                      100,
                      (liveStats.prizePoolToday / 1000) * 100
                    )}%`,
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default DashboardRightPanel;
