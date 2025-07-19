import { useState } from 'react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Trophy, Crown, Medal, Star, TrendingUp, Gamepad2 } from 'lucide-react';

interface LeaderboardSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const LeaderboardSidebar = ({ isOpen, onClose }: LeaderboardSidebarProps) => {
  const [selectedGame, setSelectedGame] = useState('all');

  const globalLeaderboard = [
    { rank: 1, username: 'arena_master', totalWins: 156, totalEarnings: 3420.80, winRate: 89.2, level: 25 },
    { rank: 2, username: 'crypto_gamer', totalWins: 47, totalEarnings: 1250.50, winRate: 67.1, level: 15 },
    { rank: 3, username: 'player_pro', totalWins: 32, totalEarnings: 890.25, winRate: 72.3, level: 12 },
    { rank: 4, username: 'speed_demon', totalWins: 28, totalEarnings: 675.40, winRate: 68.5, level: 11 },
    { rank: 5, username: 'game_lord', totalWins: 25, totalEarnings: 598.75, winRate: 64.8, level: 10 }
  ];

  const gameLeaderboards = {
    'endless-runner': [
      { rank: 1, username: 'speed_demon', score: 15420, earnings: 425.50, games: 45 },
      { rank: 2, username: 'arena_master', score: 14850, earnings: 380.25, games: 52 },
      { rank: 3, username: 'crypto_gamer', score: 14200, earnings: 325.75, games: 38 }
    ],
    'flappy-bird': [
      { rank: 1, username: 'player_pro', score: 287, earnings: 290.80, games: 28 },
      { rank: 2, username: 'game_lord', score: 264, earnings: 245.60, games: 32 },
      { rank: 3, username: 'arena_master', score: 251, earnings: 220.45, games: 24 }
    ],
    'racing-legends': [
      { rank: 1, username: 'arena_master', score: 9875, earnings: 520.75, games: 35 },
      { rank: 2, username: 'crypto_gamer', score: 9234, earnings: 445.80, games: 29 },
      { rank: 3, username: 'speed_demon', score: 8956, earnings: 398.25, games: 31 }
    ]
  };

  const topPerformers = [
    { metric: 'Highest Single Win', username: 'arena_master', value: '$245.80', game: 'Racing Legends' },
    { metric: 'Best Win Streak', username: 'crypto_gamer', value: '12 games', game: 'Endless Runner' },
    { metric: 'Most Games Today', username: 'player_pro', value: '8 games', game: 'Flappy Bird Pro' },
    { metric: 'Highest Score', username: 'speed_demon', value: '15,420', game: 'Endless Runner' }
  ];

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Crown className="w-5 h-5 text-yellow-500" />;
      case 2: return <Medal className="w-5 h-5 text-gray-400" />;
      case 3: return <Medal className="w-5 h-5 text-amber-600" />;
      default: return <span className="w-5 h-5 flex items-center justify-center text-sm font-bold">#{rank}</span>;
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-screen md:w-[500px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center space-x-2">
            <Trophy className="w-5 h-5 text-primary" />
            <span>Leaderboards & Rankings</span>
          </SheetTitle>
          <SheetDescription>
            View global and game-specific player rankings
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6">
          <Tabs value={selectedGame} onValueChange={setSelectedGame}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="all">Global</TabsTrigger>
              <TabsTrigger value="games">By Game</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Crown className="w-4 h-4 text-yellow-500" />
                    <span>Global Leaderboard</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {globalLeaderboard.map((player) => (
                      <div key={player.rank} className="flex items-center space-x-3 p-3 border rounded-lg">
                        <div className="flex items-center justify-center w-8 h-8">
                          {getRankIcon(player.rank)}
                        </div>
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="text-xs">
                            {player.username.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="font-medium text-sm">{player.username}</div>
                          <div className="text-xs text-muted-foreground">
                            {player.totalWins} wins • {player.winRate}% win rate
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-sm">${player.totalEarnings.toFixed(2)}</div>
                          <Badge variant="outline" className="text-xs">
                            Lvl {player.level}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Star className="w-4 h-4 text-primary" />
                    <span>Top Performers</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {topPerformers.map((performer, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="font-medium text-sm">{performer.metric}</div>
                          <div className="text-xs text-muted-foreground">{performer.game}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-sm">{performer.value}</div>
                          <div className="text-xs text-muted-foreground">{performer.username}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="games" className="space-y-6">
              <div className="space-y-4">
                {Object.entries(gameLeaderboards).map(([gameKey, leaderboard]) => (
                  <Card key={gameKey}>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2 text-sm">
                        <Gamepad2 className="w-4 h-4" />
                        <span>{gameKey.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {leaderboard.map((player) => (
                          <div key={player.rank} className="flex items-center space-x-3 p-2 border rounded">
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
                                Score: {player.score.toLocaleString()}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-xs">${player.earnings.toFixed(2)}</div>
                              <div className="text-xs text-muted-foreground">{player.games} games</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-sm flex items-center space-x-2">
                <TrendingUp className="w-4 h-4" />
                <span>Platform Statistics</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground text-sm">Total Players:</span>
                <span className="font-bold">12,847</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground text-sm">Active Today:</span>
                <span className="font-bold">3,247</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground text-sm">Total Games Played:</span>
                <span className="font-bold">45,679</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground text-sm">Total Earnings Paid:</span>
                <span className="font-bold text-green-500">$89,432.50</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default LeaderboardSidebar;