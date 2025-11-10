import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, TrendingDown, Users, DollarSign, Gamepad2, Activity, Download, Calendar } from 'lucide-react';

const AdminAnalytics = () => {
  const revenueData = [
    { month: 'Jan', revenue: 12000, users: 450 },
    { month: 'Feb', revenue: 15000, users: 620 },
    { month: 'Mar', revenue: 18000, users: 780 },
    { month: 'Apr', revenue: 22000, users: 950 },
    { month: 'May', revenue: 28000, users: 1200 },
    { month: 'Jun', revenue: 35000, users: 1450 },
  ];

  const gamePopularity = [
    { name: 'Endless Runner', players: 8432, percentage: 35 },
    { name: 'Flappy Bird Pro', players: 5621, percentage: 23 },
    { name: 'Racing Legends', players: 9876, percentage: 42 },
  ];

  const transactionTypes = [
    { name: 'Deposits', value: 45, color: '#10B981' },
    { name: 'Withdrawals', value: 25, color: '#F59E0B' },
    { name: 'Entry Fees', value: 20, color: '#3B82F6' },
    { name: 'Winnings', value: 10, color: '#8B5CF6' },
  ];

  const dailyActivity = [
    { day: 'Mon', active: 2100, transactions: 156 },
    { day: 'Tue', active: 2300, transactions: 189 },
    { day: 'Wed', active: 2800, transactions: 223 },
    { day: 'Thu', active: 3200, transactions: 267 },
    { day: 'Fri', active: 3800, transactions: 312 },
    { day: 'Sat', active: 4200, transactions: 356 },
    { day: 'Sun', active: 3900, transactions: 289 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 md:gap-0 text-center md:text-start items-center justify-between">
        <div>
          <h1 className="text-3xl font-cyber font-bold text-primary">Analytics Dashboard</h1>
          <p className="text-muted-foreground">Comprehensive platform analytics and insights</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <Calendar className="w-4 h-4 mr-2" />
            Last 30 days
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-primary/20 bg-card/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold font-cyber text-green-500">$89,432</div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <div className="flex items-center mt-2 text-sm">
                  <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                  <span className="text-green-500">+23%</span>
                  <span className="text-muted-foreground ml-1">from last month</span>
                </div>
              </div>
              <DollarSign className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/20 bg-card/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold font-cyber text-blue-500">12,847</div>
                <p className="text-sm text-muted-foreground">Total Users</p>
                <div className="flex items-center mt-2 text-sm">
                  <TrendingUp className="w-4 h-4 text-blue-500 mr-1" />
                  <span className="text-blue-500">+12%</span>
                  <span className="text-muted-foreground ml-1">from last month</span>
                </div>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/20 bg-card/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold font-cyber text-purple-500">3,247</div>
                <p className="text-sm text-muted-foreground">Active Players</p>
                <div className="flex items-center mt-2 text-sm">
                  <TrendingUp className="w-4 h-4 text-purple-500 mr-1" />
                  <span className="text-purple-500">+8%</span>
                  <span className="text-muted-foreground ml-1">from yesterday</span>
                </div>
              </div>
              <Activity className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/20 bg-card/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold font-cyber text-yellow-500">156</div>
                <p className="text-sm text-muted-foreground">Active Rooms</p>
                <div className="flex items-center mt-2 text-sm">
                  <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                  <span className="text-red-500">-2%</span>
                  <span className="text-muted-foreground ml-1">from yesterday</span>
                </div>
              </div>
              <Gamepad2 className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <Card className="border-primary/20 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              <span>Revenue Trend</span>
            </CardTitle>
            <CardDescription>Monthly revenue and user growth</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="month" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px'
                  }}
                />
                <Line type="monotone" dataKey="revenue" stroke="#10B981" strokeWidth={3} />
                <Line type="monotone" dataKey="users" stroke="#3B82F6" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Daily Activity */}
        <Card className="border-primary/20 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="w-5 h-5 text-primary" />
              <span>Daily Activity</span>
            </CardTitle>
            <CardDescription>Active players and transactions by day</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dailyActivity}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="day" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="active" fill="#8B5CF6" />
                <Bar dataKey="transactions" fill="#F59E0B" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Game Popularity */}
        <Card className="border-primary/20 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Gamepad2 className="w-5 h-5 text-primary" />
              <span>Game Popularity</span>
            </CardTitle>
            <CardDescription>Most played games by user count</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {gamePopularity.map((game, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{game.name}</span>
                      <span className="text-sm text-muted-foreground">{game.players.toLocaleString()} players</span>
                    </div>
                    <div className="w-full bg-secondary/30 rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${game.percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Transaction Types */}
        <Card className="border-primary/20 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <DollarSign className="w-5 h-5 text-primary" />
              <span>Transaction Distribution</span>
            </CardTitle>
            <CardDescription>Breakdown of transaction types</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={transactionTypes}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={120}
                  dataKey="value"
                >
                  {transactionTypes.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {transactionTypes.map((type, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: type.color }}
                    />
                    <span className="text-sm">{type.name}</span>
                  </div>
                  <Badge variant="outline">{type.value}%</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminAnalytics;