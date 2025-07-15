import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Gamepad2, CreditCard, TrendingUp, Activity, DollarSign, Trophy, Crown, Medal } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Bell, User } from 'lucide-react';


interface AdminOverviewProps {
  onOpenLeaderboard: () => void;
}

const AdminOverview = ({ onOpenLeaderboard }: AdminOverviewProps) => {
  const stats = [
    {
      title: "Total Users",
      value: "12,847",
      change: "+12%",
      icon: Users,
      color: "text-blue-500",
    },
    {
      title: "Active Games",
      value: "156",
      change: "+8%",
      icon: Gamepad2,
      color: "text-green-500",
    },
    {
      title: "Total Revenue",
      value: "$89,432",
      change: "+23%",
      icon: DollarSign,
      color: "text-yellow-500",
    },
    {
      title: "Live Players",
      value: "3,247",
      change: "+5%",
      icon: Activity,
      color: "text-purple-500",
    },
  ];

  const recentActivity = [
    { action: "New user registration", user: "player_8493", time: "2 minutes ago" },
    { action: "Tournament completed", game: "Flappy Bird Championship", time: "5 minutes ago" },
    { action: "Large transaction", amount: "$500 USDC", time: "8 minutes ago" },
    { action: "New room created", room: "Pro League #47", time: "12 minutes ago" },
    { action: "User verification", user: "crypto_gamer", time: "15 minutes ago" },
  ];

  const topPerformers = [
    {
      game: 'Endless Runner',
      player: 'speed_demon',
      score: 15420,
      earnings: 425.50,
      rank: 1
    },
    {
      game: 'Flappy Bird Pro',
      player: 'player_pro',
      score: 287,
      earnings: 290.80,
      rank: 1
    },
    {
      game: 'Racing Legends',
      player: 'arena_master',
      score: 9875,
      earnings: 520.75,
      rank: 1
    },
    {
      game: 'Puzzle Master',
      player: 'crypto_gamer',
      score: 2845,
      earnings: 180.25,
      rank: 1
    }
  ];

  const globalLeaderboard = [
    { rank: 1, username: 'arena_master', totalWins: 156, totalEarnings: 3420.80, winRate: 89.2 },
    { rank: 2, username: 'crypto_gamer', totalWins: 47, totalEarnings: 1250.50, winRate: 67.1 },
    { rank: 3, username: 'player_pro', totalWins: 32, totalEarnings: 890.25, winRate: 72.3 },
    { rank: 4, username: 'speed_demon', totalWins: 28, totalEarnings: 675.40, winRate: 68.5 },
    { rank: 5, username: 'game_lord', totalWins: 25, totalEarnings: 598.75, winRate: 64.8 }
  ];

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Crown className="w-4 h-4 text-yellow-500" />;
      case 2: return <Medal className="w-4 h-4 text-gray-400" />;
      case 3: return <Medal className="w-4 h-4 text-amber-600" />;
      default: return <span className="w-4 h-4 flex items-center justify-center text-xs font-bold">#{rank}</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-center justify-between text-center md:text-start">
        <div>
          <h1 className="text-3xl font-cyber font-bold text-primary">Admin Dashboard</h1>
          <p className="text-muted-foreground">Comprehensive platform overview and analytics</p>
        </div>
        <Button onClick={onOpenLeaderboard} variant="outline" className='mt-3 md:mt-0'>
          <Trophy className="w-4 h-4 mr-2" />
          View Leaderboards
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="border-primary/20 bg-card/50 backdrop-blur-sm ">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-cyber">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-500">{stat.change}</span> from last month
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="border-primary/20 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="w-5 h-5 text-primary" />
              <span>System Status</span>
            </CardTitle>
            <CardDescription>Real-time system health monitoring</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span>API Response Time</span>
              <Badge variant="outline" className="text-green-500 border-green-500/30">
                142ms - Excellent
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Database Performance</span>
              <Badge variant="outline" className="text-green-500 border-green-500/30">
                98% - Optimal
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Server Uptime</span>
              <Badge variant="outline" className="text-green-500 border-green-500/30">
                99.9% - Stable
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Active Connections</span>
              <Badge variant="outline" className="text-yellow-500 border-yellow-500/30">
                3,247 - High Load
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/20 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              <span>Recent Activity</span>
            </CardTitle>
            <CardDescription>Latest platform activities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b border-primary/10 last:border-0">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{activity.action}</p>
                    <p className="text-xs text-muted-foreground">
                      {activity.user || activity.game || activity.amount || activity.room}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">{activity.time}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/20 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Crown className="w-5 h-5 text-primary" />
                <span>Global Rankings</span>
              </div>
              <Button variant="ghost" size="sm" onClick={onOpenLeaderboard}>
                View All
              </Button>
            </CardTitle>
            <CardDescription>Top platform performers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {globalLeaderboard.slice(0, 5).map((player) => (
                <div key={player.rank} className="flex items-center space-x-3">
                  <div className="flex items-center justify-center w-6 h-6">
                    {getRankIcon(player.rank)}
                  </div>
                  <Avatar className="w-6 h-6">
                    <AvatarFallback className="text-xs">
                      {player.username.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="font-medium text-xs">{player.username}</div>
                    <div className="text-xs text-muted-foreground">
                      {player.totalWins} wins • {player.winRate}%
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-xs">${player.totalEarnings.toFixed(0)}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-primary/20 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex flex-col md:flex-row gap-4 md:gap-0 text-center md:text-start items-center justify-between">
            <div className="flex  items-center space-x-2">
              <Trophy className="w-5 h-5 text-primary" />
              <span>Top Performers by Game</span>
            </div>
            <Button variant="ghost" size="sm" onClick={onOpenLeaderboard}>
              View Detailed Rankings
            </Button>
          </CardTitle>
          <CardDescription>Leading players in each game category</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {topPerformers.map((performer, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                    <Gamepad2 className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium text-sm">{performer.game}</div>
                    <div className="text-xs text-muted-foreground">
                      {performer.player} • Score: {performer.score.toLocaleString()}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-sm">${performer.earnings.toFixed(2)}</div>
                  <Badge variant="outline" className="text-xs">
                    #1 Player
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminOverview;