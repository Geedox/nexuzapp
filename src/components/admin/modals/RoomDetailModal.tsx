import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Users,
  Crown,
  DollarSign,
  Clock,
  User,
  Trophy,
  Calendar,
} from "lucide-react";
import { GameRoom } from "@/types/gameroom";

interface RoomDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string | null;
  room: GameRoom;
}

const RoomDetailModal = ({
  isOpen,
  onClose,
  roomId,
  room,
}: RoomDetailModalProps) => {
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
              <div className="text-xl">{room.name}</div>
              <div className="text-sm text-muted-foreground">
                {room.game.name || room.game_name}
              </div>
            </div>
            <Badge
              variant="outline"
              className="text-green-500 border-green-500/30"
            >
              {room.status}
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
                    <span className="font-bold">
                      {room.entry_fee} {room.currency}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Pool:</span>
                    <span className="font-bold text-green-500">
                      {room.total_prize_pool} {room.currency}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Currency:</span>
                    <Badge variant="secondary">{room.currency}</Badge>
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
                    <span className="text-muted-foreground">
                      Current Players:
                    </span>
                    <span className="font-bold">{room.current_players}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Max Players:</span>
                    <span className="font-bold">{room.max_players}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Room Type:</span>
                    <Badge
                      variant={room.is_private ? "destructive" : "default"}
                    >
                      {room.is_private ? "Private" : "Public"}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Room Code:</span>
                    <code className="text-sm bg-secondary px-2 py-1 rounded">
                      {room.room_code}
                    </code>
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
                    <span>{room.created_at}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Started:</span>
                    <span>{room.actual_start_time}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Est. End:</span>
                    <span>{room.end_time}</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* <Card>
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
                        <TableCell className="font-medium">
                          {prize.position}
                        </TableCell>
                        <TableCell>{prize.percentage}%</TableCell>
                        <TableCell className="font-mono">
                          {prize.amount} {room.currency}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card> */}
          </TabsContent>

          <TabsContent value="participants">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="w-5 h-5" />
                  <span>
                    Current Participants ({room.current_players.toString()}/
                    {room.max_players.toString()})
                  </span>
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
                    {room.participants
                      .sort((a, b) => (a.score ?? 0) - (b.score ?? 0))
                      .map((participant, index) => (
                        <TableRow key={participant.id}>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <span className="font-bold">#{index}</span>
                              {index === 0 && (
                                <Crown className="w-4 h-4 text-yellow-500" />
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">
                            {participant.user.display_name}
                          </TableCell>
                          <TableCell className="font-mono">
                            {participant.score.toLocaleString()}
                          </TableCell>
                          <TableCell className="font-mono text-green-500">
                            {participant.earnings > 0
                              ? `${participant.earnings} ${room.currency}`
                              : "-"}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className="text-blue-500 border-blue-500/30"
                            >
                              {participant.is_active ? "Active" : "Not active"}
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
                      <h3 className="text-lg font-semibold">
                        @{room.creator.username}
                      </h3>
                    </div>
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center space-x-4 text-sm">
                        <span className="text-muted-foreground">
                          Room Created:
                        </span>
                        <span className="font-medium">{room.created_at}</span>
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
                <div className="space-y-4">Coming soon...</div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default RoomDetailModal;
