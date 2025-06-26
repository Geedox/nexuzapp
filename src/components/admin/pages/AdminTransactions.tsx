/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Search, Filter, Download, TrendingUp, TrendingDown, DollarSign, Eye, Wallet } from 'lucide-react';

const AdminTransactions = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const transactions = [
    { 
      id: '1', 
      user: 'crypto_gamer', 
      type: 'deposit', 
      amount: 500.00, 
      currency: 'USDC', 
      status: 'completed', 
      date: '2024-01-22 14:30',
      hash: '0x7a8f2b3c...',
      walletBalance: { before: 250.25, after: 750.25 },
      fee: 0.50,
      network: 'Polygon'
    },
    { 
      id: '2', 
      user: 'player_pro', 
      type: 'withdrawal', 
      amount: 250.75, 
      currency: 'USDT', 
      status: 'completed', 
      date: '2024-01-22 13:15',
      hash: '0x9d4e6f1a...',
      walletBalance: { before: 570.75, after: 320.00 },
      fee: 2.50,
      network: 'Ethereum'
    },
    { 
      id: '3', 
      user: 'arena_master', 
      type: 'entry_fee', 
      amount: 50.00, 
      currency: 'USDC', 
      status: 'completed', 
      date: '2024-01-22 12:45',
      hash: '0x2b7c9e4f...',
      walletBalance: { before: 100.00, after: 50.00 },
      fee: 0.00,
      network: 'Polygon'
    },
    { 
      id: '4', 
      user: 'newbie_123', 
      type: 'winnings', 
      amount: 125.50, 
      currency: 'USDC', 
      status: 'pending', 
      date: '2024-01-22 11:20',
      hash: '0x5f8a3d2b...',
      walletBalance: { before: 45.75, after: 171.25 },
      fee: 0.00,
      network: 'Polygon'
    },
    { 
      id: '5', 
      user: 'casual_player', 
      type: 'deposit', 
      amount: 100.00, 
      currency: 'NGN', 
      status: 'failed', 
      date: '2024-01-22 10:15',
      hash: null,
      walletBalance: { before: 5000.00, after: 5000.00 },
      fee: 0.00,
      network: 'Bank Transfer'
    },
  ];

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'deposit': return 'bg-green-500/20 text-green-500 border-green-500/30';
      case 'withdrawal': return 'bg-red-500/20 text-red-500 border-red-500/30';
      case 'entry_fee': return 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30';
      case 'winnings': return 'bg-blue-500/20 text-blue-500 border-blue-500/30';
      default: return 'bg-gray-500/20 text-gray-500 border-gray-500/30';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500/20 text-green-500 border-green-500/30';
      case 'pending': return 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30';
      case 'failed': return 'bg-red-500/20 text-red-500 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-500 border-gray-500/30';
    }
  };

  const handleViewDetails = (transaction: any) => {
    setSelectedTransaction(transaction);
    setIsDetailOpen(true);
  };

  const filteredTransactions = transactions.filter(transaction => 
    transaction.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transaction.hash?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-cyber font-bold text-primary">Transaction Management</h1>
            <p className="text-muted-foreground">Monitor all platform transactions with detailed analytics</p>
          </div>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border-primary/20 bg-card/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold font-cyber text-green-500">$89,432</div>
                  <p className="text-sm text-muted-foreground">Total Volume</p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-primary/20 bg-card/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold font-cyber text-blue-500">1,247</div>
                  <p className="text-sm text-muted-foreground">Total Transactions</p>
                </div>
                <DollarSign className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-primary/20 bg-card/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold font-cyber text-yellow-500">23</div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                </div>
                <TrendingUp className="w-8 h-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-primary/20 bg-card/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold font-cyber text-red-500">5</div>
                  <p className="text-sm text-muted-foreground">Failed</p>
                </div>
                <TrendingDown className="w-8 h-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-primary/20 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Enhanced Transactions</CardTitle>
                <CardDescription>Detailed transaction history with wallet balances</CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search transactions..."
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
                  <TableHead>User</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Currency</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Wallet Balance</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell className="font-medium">{transaction.user}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getTypeColor(transaction.type)}>
                        {transaction.type.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono">{transaction.amount.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{transaction.currency}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getStatusColor(transaction.status)}>
                        {transaction.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1 text-sm">
                        <Wallet className="w-3 h-3 text-muted-foreground" />
                        <span className="text-red-500">{transaction.walletBalance.before}</span>
                        <span>→</span>
                        <span className="text-green-500">{transaction.walletBalance.after}</span>
                      </div>
                    </TableCell>
                    <TableCell>{transaction.date}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleViewDetails(transaction)}>
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

      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Transaction Details</DialogTitle>
          </DialogHeader>
          {selectedTransaction && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Transaction Info</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">ID:</span>
                      <span className="font-mono text-sm">{selectedTransaction.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">User:</span>
                      <span>{selectedTransaction.user}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Type:</span>
                      <Badge variant="outline" className={getTypeColor(selectedTransaction.type)}>
                        {selectedTransaction.type.replace('_', ' ')}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      <Badge variant="outline" className={getStatusColor(selectedTransaction.status)}>
                        {selectedTransaction.status}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Date:</span>
                      <span>{selectedTransaction.date}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Financial Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Amount:</span>
                      <span className="font-bold">{selectedTransaction.amount} {selectedTransaction.currency}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Fee:</span>
                      <span>{selectedTransaction.fee} {selectedTransaction.currency}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Network:</span>
                      <span>{selectedTransaction.network}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Before:</span>
                      <span className="text-red-500">{selectedTransaction.walletBalance.before} {selectedTransaction.currency}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">After:</span>
                      <span className="text-green-500">{selectedTransaction.walletBalance.after} {selectedTransaction.currency}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {selectedTransaction.hash && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Blockchain Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Transaction Hash:</span>
                      <code className="text-xs bg-secondary/50 px-2 py-1 rounded">
                        {selectedTransaction.hash}
                      </code>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AdminTransactions;