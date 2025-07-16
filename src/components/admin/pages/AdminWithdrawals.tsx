/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Search, Filter, Check, X, Eye, Clock, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const AdminWithdrawals = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const { toast } = useToast();

  const withdrawalRequests = [
    {
      id: '1',
      user: 'crypto_gamer',
      amount: 500.00,
      currency: 'USDC',
      walletAddress: '0x7a8f2b3c4d5e6f1a2b3c4d5e6f7a8b9c0d1e2f3a',
      status: 'pending',
      requestDate: '2024-01-22 14:30',
      userBalance: 750.25,
      notes: 'Regular withdrawal request'
    },
    {
      id: '2',
      user: 'player_pro',
      amount: 250.75,
      currency: 'USDT',
      walletAddress: '0x9d4e6f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e',
      status: 'approved',
      requestDate: '2024-01-22 13:15',
      processedDate: '2024-01-22 15:30',
      processedBy: 'Admin',
      userBalance: 320.00,
      notes: 'Verified user, processed immediately'
    },
    {
      id: '3',
      user: 'arena_master',
      amount: 1000.00,
      currency: 'USDC',
      walletAddress: '0x2b7c9e4f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d',
      status: 'pending',
      requestDate: '2024-01-22 12:45',
      userBalance: 1250.50,
      notes: 'Large withdrawal - requires additional verification'
    },
    {
      id: '4',
      user: 'newbie_123',
      amount: 50.00,
      currency: 'NGN',
      walletAddress: 'NGN_WALLET_456789',
      status: 'rejected',
      requestDate: '2024-01-22 11:20',
      processedDate: '2024-01-22 16:00',
      processedBy: 'Admin',
      userBalance: 45.75,
      notes: 'Insufficient balance after fees'
    },
    {
      id: '5',
      user: 'casual_player',
      amount: 150.00,
      currency: 'USDT',
      walletAddress: '0x5f8a3d2b1c4e7f9a2b3c4d5e6f7a8b9c0d1e2f3a',
      status: 'completed',
      requestDate: '2024-01-22 10:15',
      processedDate: '2024-01-22 18:45',
      processedBy: 'Admin',
      userBalance: 84.10,
      notes: 'Successfully processed'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30';
      case 'approved': return 'bg-blue-500/20 text-blue-500 border-blue-500/30';
      case 'completed': return 'bg-green-500/20 text-green-500 border-green-500/30';
      case 'rejected': return 'bg-red-500/20 text-red-500 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-500 border-gray-500/30';
    }
  };

  const handleApprove = (requestId: string) => {
    toast({
      title: "Withdrawal Approved",
      description: "The withdrawal request has been approved and will be processed shortly.",
    });
  };

  const handleReject = (requestId: string) => {
    toast({
      title: "Withdrawal Rejected",
      description: "The withdrawal request has been rejected.",
      variant: "destructive"
    });
  };

  const handleViewDetails = (request: any) => {
    setSelectedRequest(request);
    setAdminNotes(request.adminNotes || '');
    setIsDetailOpen(true);
  };

  const filteredRequests = withdrawalRequests.filter(request => 
    request.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.walletAddress.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row gap-4 md:gap-0 text-center md:text-start items-center justify-between">
          <div>
            <h1 className="text-3xl font-cyber font-bold text-primary">Withdrawal Requests</h1>
            <p className="text-muted-foreground">Manage manual withdrawal approvals</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border-primary/20 bg-card/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold font-cyber text-yellow-500">8</div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                </div>
                <Clock className="w-8 h-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-primary/20 bg-card/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold font-cyber text-green-500">156</div>
                  <p className="text-sm text-muted-foreground">Completed</p>
                </div>
                <Check className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-primary/20 bg-card/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold font-cyber text-red-500">12</div>
                  <p className="text-sm text-muted-foreground">Rejected</p>
                </div>
                <X className="w-8 h-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-primary/20 bg-card/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold font-cyber text-blue-500">$45,230</div>
                  <p className="text-sm text-muted-foreground">Total Pending</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-primary/20 bg-card/50 backdrop-blur-sm overflow-x-scroll w-full max-w-[350px] md:max-w-none mx-auto md:mx-0">
          <CardHeader>
            <div className="flex flex-col md:flex-row gap-4 md:gap-0 text-center md:text-start items-center justify-between">
              <div className='space-y-4 md:space-y-0'>
                <CardTitle>Withdrawal Requests</CardTitle>
                <CardDescription>Manual approval required for all withdrawals</CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search requests..."
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
                  <TableHead>Amount</TableHead>
                  <TableHead>Currency</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Request Date</TableHead>
                  <TableHead>User Balance</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium">{request.user}</TableCell>
                    <TableCell className="font-mono">{request.amount.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{request.currency}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getStatusColor(request.status)}>
                        {request.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{request.requestDate}</TableCell>
                    <TableCell className="font-mono">{request.userBalance.toFixed(2)} {request.currency}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-1">
                        {request.status === 'pending' && (
                          <>
                            <Button size="sm" variant="default" onClick={() => handleApprove(request.id)}>
                              <Check className="w-3 h-3" />
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => handleReject(request.id)}>
                              <X className="w-3 h-3" />
                            </Button>
                          </>
                        )}
                        <Button size="sm" variant="ghost" onClick={() => handleViewDetails(request)}>
                          <Eye className="w-3 h-3" />
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

      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Withdrawal Request Details</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Request Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">ID:</span>
                      <span className="font-mono text-sm">{selectedRequest.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">User:</span>
                      <span>{selectedRequest.user}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Amount:</span>
                      <span className="font-bold">{selectedRequest.amount} {selectedRequest.currency}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      <Badge variant="outline" className={getStatusColor(selectedRequest.status)}>
                        {selectedRequest.status}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Requested:</span>
                      <span>{selectedRequest.requestDate}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Wallet Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">User Balance:</span>
                      <span className="font-bold">{selectedRequest.userBalance} {selectedRequest.currency}</span>
                    </div>
                    <div className="space-y-1">
                      <span className="text-muted-foreground text-sm">Wallet Address:</span>
                      <code className="text-xs bg-secondary p-2 rounded block break-all">
                        {selectedRequest.walletAddress}
                      </code>
                    </div>
                    {selectedRequest.processedBy && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Processed By:</span>
                        <span>{selectedRequest.processedBy}</span>
                      </div>
                    )}
                    {selectedRequest.processedDate && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Processed:</span>
                        <span>{selectedRequest.processedDate}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm text-muted-foreground">Request Notes:</Label>
                      <p className="text-sm mt-1">{selectedRequest.notes}</p>
                    </div>
                    <div>
                      <Label htmlFor="admin-notes">Admin Notes:</Label>
                      <Textarea
                        id="admin-notes"
                        placeholder="Add notes about this withdrawal request..."
                        value={adminNotes}
                        onChange={(e) => setAdminNotes(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {selectedRequest.status === 'pending' && (
                <div className="flex space-x-3">
                  <Button onClick={() => handleApprove(selectedRequest.id)} className="flex-1">
                    <Check className="w-4 h-4 mr-2" />
                    Approve Withdrawal
                  </Button>
                  <Button variant="destructive" onClick={() => handleReject(selectedRequest.id)} className="flex-1">
                    <X className="w-4 h-4 mr-2" />
                    Reject Withdrawal
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AdminWithdrawals;