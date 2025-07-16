import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Plus, Eye, Edit, Trash2, Users, Trophy } from 'lucide-react';

const AdminGames = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const games = [
    { 
      id: '1', 
      name: 'Endless Runner', 
      status: 'active', 
      totalPlayers: 8432, 
      totalRooms: 156, 
      revenue: 12450.75, 
      avgRating: 4.8,
      lastUpdate: '2024-01-20'
    },
    { 
      id: '2', 
      name: 'Flappy Bird Pro', 
      status: 'active', 
      totalPlayers: 5621, 
      totalRooms: 89, 
      revenue: 8930.25, 
      avgRating: 4.6,
      lastUpdate: '2024-01-18'
    },
    { 
      id: '3', 
      name: 'Puzzle Master', 
      status: 'maintenance', 
      totalPlayers: 3247, 
      totalRooms: 45, 
      revenue: 5680.50, 
      avgRating: 4.4,
      lastUpdate: '2024-01-15'
    },
    { 
      id: '4', 
      name: 'Racing Legends', 
      status: 'active', 
      totalPlayers: 9876, 
      totalRooms: 234, 
      revenue: 18750.80, 
      avgRating: 4.9,
      lastUpdate: '2024-01-22'
    },
    { 
      id: '5', 
      name: 'Card Battle Arena', 
      status: 'beta', 
      totalPlayers: 1543, 
      totalRooms: 23, 
      revenue: 2340.10, 
      avgRating: 4.2,
      lastUpdate: '2024-01-21'
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500/20 text-green-500 border-green-500/30';
      case 'maintenance': return 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30';
      case 'beta': return 'bg-blue-500/20 text-blue-500 border-blue-500/30';
      case 'inactive': return 'bg-red-500/20 text-red-500 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-500 border-gray-500/30';
    }
  };

  const filteredGames = games.filter(game => 
    game.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 md:gap-0 text-center md:text-start  items-center justify-between">
        <div>
          <h1 className="text-3xl font-cyber font-bold text-primary">Game Management</h1>
          <p className="text-muted-foreground">Manage and monitor platform games</p>
        </div>
        <Button className="bg-primary hover:bg-primary/80">
          <Plus className="w-4 h-4 mr-2" />
          Add New Game
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-primary/20 bg-card/50">
          <CardContent className="p-6">
            <div className="text-2xl font-bold font-cyber text-green-500">5</div>
            <p className="text-sm text-muted-foreground">Total Games</p>
          </CardContent>
        </Card>
        <Card className="border-primary/20 bg-card/50">
          <CardContent className="p-6">
            <div className="text-2xl font-bold font-cyber text-blue-500">4</div>
            <p className="text-sm text-muted-foreground">Active Games</p>
          </CardContent>
        </Card>
        <Card className="border-primary/20 bg-card/50">
          <CardContent className="p-6">
            <div className="text-2xl font-bold font-cyber text-yellow-500">28,719</div>
            <p className="text-sm text-muted-foreground">Total Players</p>
          </CardContent>
        </Card>
        <Card className="border-primary/20 bg-card/50">
          <CardContent className="p-6">
            <div className="text-2xl font-bold font-cyber text-purple-500">$48,152</div>
            <p className="text-sm text-muted-foreground">Total Revenue</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-primary/20 bg-card/50 backdrop-blur-sm overflow-x-scroll w-full max-w-[350px] md:max-w-none mx-auto md:mx-0">
        <CardHeader>
          <div className="flex flex-col md:flex-row gap-4 md:gap-0 text-center md:text-start items-center justify-between">
            <div className='space-y-4 md:space-y-0'>
              <CardTitle>Games</CardTitle>
              <CardDescription>Manage all platform games</CardDescription>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search games..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Game</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Players</TableHead>
                <TableHead>Rooms</TableHead>
                <TableHead>Revenue</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Last Update</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredGames.map((game) => (
                <TableRow key={game.id}>
                  <TableCell>
                    <div className="font-medium">{game.name}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getStatusColor(game.status)}>
                      {game.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <span>{game.totalPlayers.toLocaleString()}</span>
                    </div>
                  </TableCell>
                  <TableCell>{game.totalRooms}</TableCell>
                  <TableCell className="font-mono">${game.revenue.toFixed(2)}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <Trophy className="w-4 h-4 text-yellow-500" />
                      <span>{game.avgRating}</span>
                    </div>
                  </TableCell>
                  <TableCell>{new Date(game.lastUpdate).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <Button variant="ghost" size="icon">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminGames;