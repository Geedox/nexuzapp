import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users, Crown, DollarSign, Clock, User, Trophy, Calendar } from 'lucide-react';

interface RoomDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string | null;
}

const RoomDetailModal = ({ isOpen, onClose, roomId }: RoomDetailModalProps) => {
  // Dummy room data
  const roomData = {
    id: roomId,
    name: 'Pro League Championship',
    game: 'Endless Runner',
    description: 'Elite players only - High stakes championship round',
    host: {
      id: '1',
      username: 'crypto_gamer',
      displayName: 'Crypto Gamer Pro',
      avatar: '/placeholder.svg',
      level: 15,
      winRate: 67.1
    },
    status: 'active',
    entryFee: 50.00,
    currency: 'USDC',
    maxPlayers: 10,
    currentPlayers: 8,
    totalPrizePool: 400.00,
    created: '2024-01-22 14:30',
    started: '2024-01-22 15:00',
    estimatedEnd: '2024-01-22 16:30',
    isPrivate: false,
    roomCode: 'PRO-2024-001'
  };

  const participants = [
    { id: '1', username: 'crypto_gamer', score: 1250, earnings: 125.50, position: 1, status: 'playing' },
    { id: '2', username: 'player_pro', score: 1180, earnings: 0, position: 2, status: 'playing' },
    { id: '3', username: 'arena_master', score: 1050, earnings: 0, position: 3, status: 'playing' },
    { id: '4', username: 'speed_demon', score: 980, earnings: 0, position: 4, status: 'playing' },
    { id: '5', username: 'game_lord', score: 920, earnings: 0, position: 5, status: 'playing' },
    { id: '6', username: 'pro_gamer', score: 880, earnings: 0, position: 6, status: 'playing' },
    { id: '7', username: 'elite_player', score: 750, earnings: 0, position: 7, status: 'playing' },
    { id: '8', username: 'champion_x', score: 650, earnings: 0, position: 8, status: 'playing' }
  ];

  const prizeDistribution = [
    { position: '1st', percentage: 50, amount: 200.00 },
    { position: '2nd', percentage: 30, amount: 120.00 },
    { position: '3rd', percentage: 20, amount: 80.00 }
  ];

  const roomHistory = [
    { event: 'Room started', timestamp: '2024-01-22 15:00', user: 'System' },
    { event: 'Player joined', timestamp: '2024-01-22 14:58', user: 'champion_x' },
    { event: 'Player joined', timestamp: '2024-01-22 14:55', user: 'elite_player' },
    { event: 'Room created', timestamp: '2024-01-22 14:30', user: 'crypto_gamer' }
  ];

  if (!roomId) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <div>
              <div className="text-xl">{roomData.name}</div>
              <div className="text-sm text-muted-foreground">{roomData.game}</div>
            </div>
            <Badge variant="outline" className="text-green-500 border-green-500/30">
              {roomData.status}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="participants">Participants</TabsTrigger>
            <TabsTrigger value="creator">Creator</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center space-x-2">
                    <DollarSign className="w-4 h-4" />
                    <span>Financial Details</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Entry Fee:</span>
                    <span className="font-bold">{roomData.entryFee} {roomData.currency}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Pool:</span>
                    <span className="font-bold text-green-500">{roomData.totalPrizePool} {roomData.currency}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Currency:</span>
                    <Badge variant="secondary">{roomData.currency}</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center space-x-2">
                    <Users className="w-4 h-4" />
                    <span>Player Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Current Players:</span>
                    <span className="font-bold">{roomData.currentPlayers}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Max Players:</span>
                    <span className="font-bold">{roomData.maxPlayers}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Room Type:</span>
                    <Badge variant={roomData.isPrivate ? "destructive" : "default"}>
                      {roomData.isPrivate ? "Private" : "Public"}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Room Code:</span>
                    <code className="text-sm bg-secondary px-2 py-1 rounded">{roomData.roomCode}</code>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center space-x-2">
                    <Clock className="w-4 h-4" />
                    <span>Timing</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Created:</span>
                    <span>{roomData.created}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Started:</span>
                    <span>{roomData.started}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Est. End:</span>
                    <span>{roomData.estimatedEnd}</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Trophy className="w-5 h-5" />
                  <span>Prize Distribution</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Position</TableHead>
                      <TableHead>Percentage</TableHead>
                      <TableHead>Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {prizeDistribution.map((prize, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{prize.position}</TableCell>
                        <TableCell>{prize.percentage}%</TableCell>
                        <TableCell className="font-mono">{prize.amount} {roomData.currency}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="participants">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="w-5 h-5" />
                  <span>Current Participants ({roomData.currentPlayers}/{roomData.maxPlayers})</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Position</TableHead>
                      <TableHead>Player</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Earnings</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {participants.map((participant, index) => (
                      <TableRow key={participant.id}>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <span className="font-bold">#{participant.position}</span>
                            {index === 0 && <Crown className="w-4 h-4 text-yellow-500" />}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{participant.username}</TableCell>
                        <TableCell className="font-mono">{participant.score.toLocaleString()}</TableCell>
                        <TableCell className="font-mono text-green-500">
                          {participant.earnings > 0 ? `${participant.earnings} ${roomData.currency}` : '-'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-blue-500 border-blue-500/30">
                            {participant.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="creator">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="w-5 h-5" />
                  <span>Room Creator Details</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-4 p-6 border rounded-lg">
                  <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center">
                    <User className="w-8 h-8 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="text-lg font-semibold">{roomData.host.displayName}</h3>
                      <Badge variant="outline">Level {roomData.host.level}</Badge>
                    </div>
                    <p className="text-muted-foreground">@{roomData.host.username}</p>
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center space-x-4 text-sm">
                        <span className="text-muted-foreground">Win Rate:</span>
                        <span className="font-medium">{roomData.host.winRate}%</span>
                      </div>
                      <div className="flex items-center space-x-4 text-sm">
                        <span className="text-muted-foreground">Room Created:</span>
                        <span className="font-medium">{roomData.created}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="w-5 h-5" />
                  <span>Room Activity History</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {roomHistory.map((event, index) => (
                    <div key={index} className="flex items-center space-x-4 p-3 border-l-2 border-primary/20 pl-4">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                      <div className="flex-1">
                        <div className="font-medium">{event.event}</div>
                        <div className="text-sm text-muted-foreground">
                          {event.user} • {event.timestamp}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default RoomDetailModal;