import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Filter, Eye, Users, Clock, DollarSign, Crown } from 'lucide-react';
import RoomDetailModal from '../modals/RoomDetailModal';
import RewardsSidebar from '../RewardsSidebar';

const AdminRooms = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [isRoomDetailOpen, setIsRoomDetailOpen] = useState(false);
  const [isRewardsOpen, setIsRewardsOpen] = useState(false);

  const rooms = [
    { 
      id: '1', 
      name: 'Pro League Championship', 
      game: 'Endless Runner', 
      host: 'crypto_gamer', 
      status: 'active', 
      players: 8, 
      maxPlayers: 10, 
      entryFee: 50.00, 
      currency: 'USDC',
      created: '2024-01-22 14:30'
    },
    { 
      id: '2', 
      name: 'Casual Sunday', 
      game: 'Flappy Bird Pro', 
      host: 'player_pro', 
      status: 'waiting', 
      players: 3, 
      maxPlayers: 6, 
      entryFee: 10.00, 
      currency: 'USDT',
      created: '2024-01-22 13:15'
    },
    { 
      id: '3', 
      name: 'High Stakes Arena', 
      game: 'Racing Legends', 
      host: 'arena_master', 
      status: 'finished', 
      players: 12, 
      maxPlayers: 12, 
      entryFee: 100.00, 
      currency: 'USDC',
      created: '2024-01-22 11:00'
    },
    { 
      id: '4', 
      name: 'Newbie Tournament', 
      game: 'Puzzle Master', 
      host: 'newbie_123', 
      status: 'active', 
      players: 4, 
      maxPlayers: 8, 
      entryFee: 5.00, 
      currency: 'NGN',
      created: '2024-01-22 12:45'
    },
    { 
      id: '5', 
      name: 'Speed Challenge', 
      game: 'Card Battle Arena', 
      host: 'casual_player', 
      status: 'cancelled', 
      players: 0, 
      maxPlayers: 4, 
      entryFee: 25.00, 
      currency: 'USDC',
      created: '2024-01-22 10:15'
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500/20 text-green-500 border-green-500/30';
      case 'waiting': return 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30';
      case 'finished': return 'bg-blue-500/20 text-blue-500 border-blue-500/30';
      case 'cancelled': return 'bg-red-500/20 text-red-500 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-500 border-gray-500/30';
    }
  };

  const handleViewDetails = (roomId: string) => {
    setSelectedRoomId(roomId);
    setIsRoomDetailOpen(true);
  };

  const filteredRooms = rooms.filter(room => 
    room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    room.game.toLowerCase().includes(searchTerm.toLowerCase()) ||
    room.host.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-cyber font-bold text-primary">Room Management</h1>
            <p className="text-muted-foreground">Monitor and manage game rooms</p>
          </div>
          <Button onClick={() => setIsRewardsOpen(true)} className="bg-primary hover:bg-primary/80">
            <Crown className="w-4 h-4 mr-2" />
            Sponsor Rooms
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border-primary/20 bg-card/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold font-cyber text-green-500">156</div>
                  <p className="text-sm text-muted-foreground">Total Rooms</p>
                </div>
                <Users className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-primary/20 bg-card/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold font-cyber text-blue-500">43</div>
                  <p className="text-sm text-muted-foreground">Active Rooms</p>
                </div>
                <Clock className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-primary/20 bg-card/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold font-cyber text-yellow-500">247</div>
                  <p className="text-sm text-muted-foreground">Active Players</p>
                </div>
                <Users className="w-8 h-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-primary/20 bg-card/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold font-cyber text-purple-500">$12,450</div>
                  <p className="text-sm text-muted-foreground">Total Pool</p>
                </div>
                <DollarSign className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-primary/20 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Game Rooms</CardTitle>
                <CardDescription>All active and recent game rooms</CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search rooms..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
                <Button variant="outline" size="icon">
                  <Filter className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Room Name</TableHead>
                  <TableHead>Game</TableHead>
                  <TableHead>Host</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Players</TableHead>
                  <TableHead>Entry Fee</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRooms.map((room) => (
                  <TableRow key={room.id}>
                    <TableCell className="font-medium">{room.name}</TableCell>
                    <TableCell>{room.game}</TableCell>
                    <TableCell>{room.host}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getStatusColor(room.status)}>
                        {room.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        <span>{room.players}/{room.maxPlayers}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <span className="font-mono">{room.entryFee}</span>
                        <Badge variant="secondary" className="text-xs">{room.currency}</Badge>
                      </div>
                    </TableCell>
                    <TableCell>{new Date(room.created).toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleViewDetails(room.id)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <RoomDetailModal
        isOpen={isRoomDetailOpen}
        onClose={() => setIsRoomDetailOpen(false)}
        roomId={selectedRoomId}
      />

      <RewardsSidebar
        isOpen={isRewardsOpen}
        onClose={() => setIsRewardsOpen(false)}
      />
    </>
  );
};

export default AdminRooms;