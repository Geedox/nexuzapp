import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Filter, UserCheck, UserX, Eye, MoreHorizontal, Gift } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import UserDetailModal from '../modals/UserDetailModal';
import RewardsSidebar from '../RewardsSidebar';

const AdminUsers = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isUserDetailOpen, setIsUserDetailOpen] = useState(false);
  const [isRewardsOpen, setIsRewardsOpen] = useState(false);

  const users = [
    { id: '1', username: 'crypto_gamer', email: 'crypto@example.com', status: 'active', totalEarnings: 1250.50, gamesPlayed: 47, joinDate: '2024-01-15', verified: true },
    { id: '2', username: 'player_pro', email: 'player@example.com', status: 'active', totalEarnings: 890.25, gamesPlayed: 32, joinDate: '2024-02-03', verified: true },
    { id: '3', username: 'newbie_123', email: 'newbie@example.com', status: 'suspended', totalEarnings: 45.75, gamesPlayed: 8, joinDate: '2024-06-10', verified: false },
    { id: '4', username: 'arena_master', email: 'master@example.com', status: 'active', totalEarnings: 3420.80, gamesPlayed: 156, joinDate: '2023-11-22', verified: true },
    { id: '5', username: 'casual_player', email: 'casual@example.com', status: 'inactive', totalEarnings: 234.10, gamesPlayed: 19, joinDate: '2024-03-18', verified: true },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500/20 text-green-500 border-green-500/30';
      case 'inactive': return 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30';
      case 'suspended': return 'bg-red-500/20 text-red-500 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-500 border-gray-500/30';
    }
  };

  const handleViewDetails = (userId: string) => {
    setSelectedUserId(userId);
    setIsUserDetailOpen(true);
  };

  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row gap-4 md:gap-0 text-center md:text-start items-center justify-between">
          <div>
            <h1 className="text-3xl font-cyber font-bold text-primary">User Management</h1>
            <p className="text-muted-foreground">Manage and monitor platform users</p>
          </div>
          <Button onClick={() => setIsRewardsOpen(true)} className="bg-primary hover:bg-primary/80">
            <Gift className="w-4 h-4 mr-2" />
            Send Rewards
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border-primary/20 bg-card/50">
            <CardContent className="p-6">
              <div className="text-2xl font-bold font-cyber text-green-500">12,847</div>
              <p className="text-sm text-muted-foreground">Total Users</p>
            </CardContent>
          </Card>
          <Card className="border-primary/20 bg-card/50">
            <CardContent className="p-6">
              <div className="text-2xl font-bold font-cyber text-blue-500">3,247</div>
              <p className="text-sm text-muted-foreground">Active Users</p>
            </CardContent>
          </Card>
          <Card className="border-primary/20 bg-card/50">
            <CardContent className="p-6">
              <div className="text-2xl font-bold font-cyber text-yellow-500">156</div>
              <p className="text-sm text-muted-foreground">New This Week</p>
            </CardContent>
          </Card>
          <Card className="border-primary/20 bg-card/50">
            <CardContent className="p-6">
              <div className="text-2xl font-bold font-cyber text-red-500">23</div>
              <p className="text-sm text-muted-foreground">Suspended</p>
            </CardContent>
          </Card>
        </div>

        <Card className="border-primary/20 bg-card/50 backdrop-blur-sm overflow-x-scroll w-full max-w-[350px] md:max-w-none mx-auto md:mx-0">
          <CardHeader>
            <div className="flex flex-col md:flex-row gap-4 md:gap-0 text-center md:text-start items-center justify-between">
              <div className='space-y-4 md:space-y-0'>
                <CardTitle>Users</CardTitle>
                <CardDescription>Complete list of platform users</CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search users..."
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
            <Table >
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Earnings</TableHead>
                  <TableHead>Games</TableHead>
                  <TableHead>Join Date</TableHead>
                  <TableHead>Verified</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{user.username}</div>
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getStatusColor(user.status)}>
                        {user.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono">${user.totalEarnings.toFixed(2)}</TableCell>
                    <TableCell>{user.gamesPlayed}</TableCell>
                    <TableCell>{new Date(user.joinDate).toLocaleDateString()}</TableCell>
                    <TableCell>
                      {user.verified ? (
                        <UserCheck className="w-4 h-4 text-green-500" />
                      ) : (
                        <UserX className="w-4 h-4 text-red-500" />
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewDetails(user.id)}>
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            Edit User
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">
                            Suspend User
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <UserDetailModal
        isOpen={isUserDetailOpen}
        onClose={() => setIsUserDetailOpen(false)}
        userId={selectedUserId}
      />

      <RewardsSidebar
        isOpen={isRewardsOpen}
        onClose={() => setIsRewardsOpen(false)}
      />
    </>
  );
};

export default AdminUsers;