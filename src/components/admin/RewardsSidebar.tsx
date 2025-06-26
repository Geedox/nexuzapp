import { useState } from 'react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Gift, User, Users, Gamepad2, Crown, DollarSign } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface RewardsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const RewardsSidebar = ({ isOpen, onClose }: RewardsSidebarProps) => {
  const [selectedRewardType, setSelectedRewardType] = useState('individual');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('USDC');
  const [recipient, setRecipient] = useState('');
  const [reason, setReason] = useState('');
  const { toast } = useToast();

  const handleSendReward = () => {
    toast({
      title: "Reward Sent",
      description: `${amount} ${currency} reward sent successfully!`,
    });
    onClose();
  };

  const recentRewards = [
    { id: '1', type: 'individual', recipient: 'crypto_gamer', amount: 100, currency: 'USDC', reason: 'Top performer', date: '2024-01-22' },
    { id: '2', type: 'room', recipient: 'Pro Championship', amount: 500, currency: 'USDC', reason: 'Room sponsorship', date: '2024-01-21' },
    { id: '3', type: 'promotion', recipient: 'Weekly Tournament', amount: 250, currency: 'USDT', reason: 'Event promotion', date: '2024-01-20' }
  ];

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-[600px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center space-x-2">
            <Gift className="w-5 h-5 text-primary" />
            <span>Rewards & Sponsorship</span>
          </SheetTitle>
          <SheetDescription>
            Send rewards to users, sponsor rooms, or promote events
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6">
          <Tabs value={selectedRewardType} onValueChange={setSelectedRewardType}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="individual">Individual</TabsTrigger>
              <TabsTrigger value="room">Room</TabsTrigger>
              <TabsTrigger value="promotion">Promotion</TabsTrigger>
            </TabsList>

            <TabsContent value="individual" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <User className="w-4 h-4" />
                    <span>Individual Reward</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="user-search">Search User</Label>
                    <Input
                      id="user-search"
                      placeholder="Enter username or email"
                      value={recipient}
                      onChange={(e) => setRecipient(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="amount">Amount</Label>
                      <Input
                        id="amount"
                        type="number"
                        placeholder="0.00"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="currency">Currency</Label>
                      <Select value={currency} onValueChange={setCurrency}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USDC">USDC</SelectItem>
                          <SelectItem value="USDT">USDT</SelectItem>
                          <SelectItem value="NGN">NGN</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reason">Reason</Label>
                    <Textarea
                      id="reason"
                      placeholder="Why are you sending this reward?"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                    />
                  </div>

                  <Button onClick={handleSendReward} className="w-full">
                    <Gift className="w-4 h-4 mr-2" />
                    Send Reward
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="room" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="w-4 h-4" />
                    <span>Room Sponsorship</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="room-search">Search Room</Label>
                    <Input
                      id="room-search"
                      placeholder="Enter room name or ID"
                      value={recipient}
                      onChange={(e) => setRecipient(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sponsorship-type">Sponsorship Type</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="prize-boost">Prize Pool Boost</SelectItem>
                        <SelectItem value="entry-discount">Entry Fee Discount</SelectItem>
                        <SelectItem value="featured">Featured Room</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="sponsor-amount">Amount</Label>
                      <Input
                        id="sponsor-amount"
                        type="number"
                        placeholder="0.00"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="sponsor-currency">Currency</Label>
                      <Select value={currency} onValueChange={setCurrency}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USDC">USDC</SelectItem>
                          <SelectItem value="USDT">USDT</SelectItem>
                          <SelectItem value="NGN">NGN</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sponsor-reason">Sponsorship Details</Label>
                    <Textarea
                      id="sponsor-reason"
                      placeholder="Describe the sponsorship details"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                    />
                  </div>

                  <Button onClick={handleSendReward} className="w-full">
                    <Crown className="w-4 h-4 mr-2" />
                    Sponsor Room
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="promotion" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Gamepad2 className="w-4 h-4" />
                    <span>Event Promotion</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="event-name">Event/Game Name</Label>
                    <Input
                      id="event-name"
                      placeholder="Enter event or game name"
                      value={recipient}
                      onChange={(e) => setRecipient(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="promotion-type">Promotion Type</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select promotion type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tournament">Tournament Boost</SelectItem>
                        <SelectItem value="daily-bonus">Daily Bonus</SelectItem>
                        <SelectItem value="special-event">Special Event</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="promo-amount">Promotion Budget</Label>
                      <Input
                        id="promo-amount"
                        type="number"
                        placeholder="0.00"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="promo-currency">Currency</Label>
                      <Select value={currency} onValueChange={setCurrency}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USDC">USDC</SelectItem>
                          <SelectItem value="USDT">USDT</SelectItem>
                          <SelectItem value="NGN">NGN</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="promo-details">Promotion Details</Label>
                    <Textarea
                      id="promo-details"
                      placeholder="Describe the promotion campaign"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                    />
                  </div>

                  <Button onClick={handleSendReward} className="w-full">
                    <DollarSign className="w-4 h-4 mr-2" />
                    Launch Promotion
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-sm">Recent Rewards</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentRewards.map((reward) => (
                  <div key={reward.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                        {reward.type === 'individual' && <User className="w-4 h-4" />}
                        {reward.type === 'room' && <Users className="w-4 h-4" />}
                        {reward.type === 'promotion' && <Gamepad2 className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="font-medium text-sm">{reward.recipient}</div>
                        <div className="text-xs text-muted-foreground">{reward.reason}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-sm">{reward.amount} {reward.currency}</div>
                      <div className="text-xs text-muted-foreground">{reward.date}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default RewardsSidebar;