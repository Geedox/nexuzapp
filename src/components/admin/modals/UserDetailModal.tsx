import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { User, Wallet, Calendar, Trophy, TrendingUp, Gamepad2 } from 'lucide-react';

interface UserDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string | null;
}

const UserDetailModal = ({ isOpen, onClose, userId }: UserDetailModalProps) => {
  // Dummy user data
  const userData = {
    id: userId,
    username: 'crypto_gamer',
    email: 'crypto@example.com',
    displayName: 'Crypto Gamer Pro',
    avatar: '/placeholder.svg',
    status: 'active',
    joinDate: '2024-01-15',
    lastSeen: '2024-01-22 14:30',
    country: 'Nigeria',
    verified: true,
    totalWins: 47,
    totalLosses: 23,
    totalGames: 70,
    winRate: 67.1,
    totalEarnings: 1250.50,
    currentStreak: 5,
    longestStreak: 12,
    level: 15,
    xp: 3420
  };

  const walletBalances = [
    { currency: 'USDC', balance: 750.25, connected: true, address: '0x7a8f...3c2b' },
    { currency: 'USDT', balance: 320.80, connected: true, address: '0x9d4e...1a5f' },
    { currency: 'NGN', balance: 125000.00, connected: true, address: 'NGN_WALLET_123' }
  ];

  const gameHistory = [
    { game: 'Endless Runner', lastPlayed: '2024-01-22', gamesPlayed: 25, wins: 18, earnings: 450.75 },
    { game: 'Flappy Bird Pro', lastPlayed: '2024-01-21', gamesPlayed: 20, wins: 12, earnings: 320.25 },
    { game: 'Racing Legends', lastPlayed: '2024-01-20', gamesPlayed: 15, wins: 10, earnings: 280.50 },
    { game: 'Puzzle Master', lastPlayed: '2024-01-19', gamesPlayed: 10, wins: 7, earnings: 199.00 }
  ];

  const transactions = [
    { id: '1', type: 'deposit', amount: 500.00, currency: 'USDC', status: 'completed', date: '2024-01-22 14:30' },
    { id: '2', type: 'winnings', amount: 125.50, currency: 'USDC', status: 'completed', date: '2024-01-22 13:15' },
    { id: '3', type: 'entry_fee', amount: 50.00, currency: 'USDC', status: 'completed', date: '2024-01-22 12:45' },
    { id: '4', type: 'withdrawal', amount: 200.00, currency: 'USDT', status: 'pending', date: '2024-01-22 11:20' }
  ];

  const gameRooms = [
    { id: '1', name: 'Pro Championship', game: 'Endless Runner', role: 'participant', earnings: 125.50, status: 'completed' },
    { id: '2', name: 'Weekly Challenge', game: 'Flappy Bird Pro', role: 'host', earnings: 320.75, status: 'active' },
    { id: '3', name: 'Speed Run', game: 'Racing Legends', role: 'participant', earnings: 0, status: 'waiting' }
  ];

  if (!userId) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-primary" />
            </div>
            <div>
              <div className="text-xl">{userData.displayName}</div>
              <div className="text-sm text-muted-foreground">@{userData.username}</div>
            </div>
            <Badge variant="outline" className={userData.status === 'active' ? 'text-green-500 border-green-500/30' : 'text-red-500 border-red-500/30'}>
              {userData.status}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="wallets">Wallets</TabsTrigger>
            <TabsTrigger value="games">Games</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="rooms">Rooms</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Profile Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Email:</span>
                    <span>{userData.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Country:</span>
                    <span>{userData.country}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Joined:</span>
                    <span>{userData.joinDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Last Seen:</span>
                    <span>{userData.lastSeen}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Verified:</span>
                    <Badge variant={userData.verified ? "default" : "secondary"}>
                      {userData.verified ? "Yes" : "No"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center space-x-2">
                    <Trophy className="w-4 h-4" />
                    <span>Gaming Stats</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Games:</span>
                    <span className="font-bold">{userData.totalGames}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Wins:</span>
                    <span className="text-green-500 font-bold">{userData.totalWins}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Losses:</span>
                    <span className="text-red-500 font-bold">{userData.totalLosses}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Win Rate:</span>
                    <span className="font-bold">{userData.winRate}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Current Streak:</span>
                    <span className="font-bold">{userData.currentStreak}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center space-x-2">
                    <TrendingUp className="w-4 h-4" />
                    <span>Earnings & Level</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Earnings:</span>
                    <span className="font-bold text-green-500">${userData.totalEarnings}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Level:</span>
                    <span className="font-bold">{userData.level}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Experience:</span>
                    <span className="font-bold">{userData.xp} XP</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Longest Streak:</span>
                    <span className="font-bold">{userData.longestStreak}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="wallets">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Wallet className="w-5 h-5" />
                  <span>Wallet Balances</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {walletBalances.map((wallet, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                          <span className="font-bold text-sm">{wallet.currency}</span>
                        </div>
                        <div>
                          <div className="font-medium">{wallet.currency}</div>
                          <div className="text-sm text-muted-foreground">
                            {wallet.address}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{wallet.balance.toFixed(2)}</div>
                        <Badge variant={wallet.connected ? "default" : "secondary"}>
                          {wallet.connected ? "Connected" : "Disconnected"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="games">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Gamepad2 className="w-5 h-5" />
                  <span>Game History</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Game</TableHead>
                      <TableHead>Last Played</TableHead>
                      <TableHead>Games</TableHead>
                      <TableHead>Wins</TableHead>
                      <TableHead>Win Rate</TableHead>
                      <TableHead>Earnings</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {gameHistory.map((game, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{game.game}</TableCell>
                        <TableCell>{game.lastPlayed}</TableCell>
                        <TableCell>{game.gamesPlayed}</TableCell>
                        <TableCell className="text-green-500">{game.wins}</TableCell>
                        <TableCell>{((game.wins / game.gamesPlayed) * 100).toFixed(1)}%</TableCell>
                        <TableCell className="font-mono">${game.earnings.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="transactions">
            <Card>
              <CardHeader>
                <CardTitle>Transaction History</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Currency</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>
                          <Badge variant="outline">
                            {transaction.type.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono">{transaction.amount.toFixed(2)}</TableCell>
                        <TableCell>{transaction.currency}</TableCell>
                        <TableCell>
                          <Badge variant={transaction.status === 'completed' ? 'default' : 'secondary'}>
                            {transaction.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{transaction.date}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="rooms">
            <Card>
              <CardHeader>
                <CardTitle>Room Participation</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Room Name</TableHead>
                      <TableHead>Game</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Earnings</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {gameRooms.map((room) => (
                      <TableRow key={room.id}>
                        <TableCell className="font-medium">{room.name}</TableCell>
                        <TableCell>{room.game}</TableCell>
                        <TableCell>
                          <Badge variant={room.role === 'host' ? 'default' : 'outline'}>
                            {room.role}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono">${room.earnings.toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {room.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default UserDetailModal;