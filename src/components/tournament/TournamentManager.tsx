import React, { useState, useEffect } from "react";
import { useGameRoom } from "@/contexts/GameRoomContext";
import { useTournament } from "@/contexts/TournamentContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Trophy,
  Users,
  Clock,
  Settings,
  Play,
  Target,
  AlertCircle,
  CheckCircle,
  Loader2,
} from "lucide-react";

interface TournamentManagerProps {
  roomId: string;
  isCreator: boolean;
}

const TournamentManager: React.FC<TournamentManagerProps> = ({
  roomId,
  isCreator,
}) => {
  const {
    createTournament,
    startTournament,
    canStartTournament,
    isTournamentReady,
    getTournamentStats,
  } = useGameRoom();

  const { currentTournament, participants, stats, loading, refreshTournament } =
    useTournament();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [canStart, setCanStart] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isStarting, setIsStarting] = useState(false);

  // Tournament creation form state
  const [formData, setFormData] = useState({
    eliminationType: "single" as "single" | "double" | "swiss",
    timeLimitMinutes: 30,
    roundDurationMinutes: 60,
    playersPerMatch: 2,
  });

  // Check tournament status
  useEffect(() => {
    const checkStatus = async () => {
      if (roomId) {
        const [canStartResult, isReadyResult] = await Promise.all([
          canStartTournament(roomId),
          isTournamentReady(roomId),
        ]);
        setCanStart(canStartResult);
        setIsReady(isReadyResult);
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 5000); // Check every 5 seconds
    return () => clearInterval(interval);
  }, [roomId, canStartTournament, isTournamentReady, participants]);

  // Refresh tournament data
  useEffect(() => {
    if (roomId) {
      refreshTournament(roomId);
    }
  }, [roomId, refreshTournament]);

  const handleCreateTournament = async () => {
    if (!roomId) return;

    setIsCreating(true);
    try {
      await createTournament(roomId, {
        eliminationType: formData.eliminationType,
        timeLimitMinutes: formData.timeLimitMinutes,
        roundDurationMinutes: formData.roundDurationMinutes,
        playersPerMatch: formData.playersPerMatch,
      });

      setShowCreateDialog(false);
      // Refresh status
      const [canStartResult, isReadyResult] = await Promise.all([
        canStartTournament(roomId),
        isTournamentReady(roomId),
      ]);
      setCanStart(canStartResult);
      setIsReady(isReadyResult);
    } catch (error) {
      console.error("Error creating tournament:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleStartTournament = async () => {
    if (!roomId) return;

    setIsStarting(true);
    try {
      await startTournament(roomId);
    } catch (error) {
      console.error("Error starting tournament:", error);
    } finally {
      setIsStarting(false);
    }
  };

  const getEliminationTypeLabel = (type: string) => {
    switch (type) {
      case "single":
        return "Single Elimination";
      case "double":
        return "Double Elimination";
      case "swiss":
        return "Swiss System";
      default:
        return type;
    }
  };

  const getTournamentStatusBadge = () => {
    if (!isReady) {
      return <Badge variant="outline">Not Created</Badge>;
    }

    if (currentTournament?.isComplete) {
      return <Badge variant="default">Complete</Badge>;
    }

    if (stats?.completedMatches === 0) {
      return <Badge variant="secondary">Ready to Start</Badge>;
    }

    return <Badge variant="destructive">In Progress</Badge>;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading tournament...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tournament Status Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Tournament Status
            </CardTitle>
            {getTournamentStatusBadge()}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Tournament Info */}
          {isReady && currentTournament && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {stats?.totalParticipants || 0}
                </div>
                <div className="text-sm text-muted-foreground">Players</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {stats?.totalRounds || 0}
                </div>
                <div className="text-sm text-muted-foreground">Rounds</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {stats?.completedMatches || 0}/{stats?.totalMatches || 0}
                </div>
                <div className="text-sm text-muted-foreground">Matches</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {stats?.currentRound || 0}
                </div>
                <div className="text-sm text-muted-foreground">
                  Current Round
                </div>
              </div>
            </div>
          )}

          {/* Progress Bar */}
          {isReady && stats && stats.totalMatches > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Tournament Progress</span>
                <span>
                  {stats.completedMatches}/{stats.totalMatches}
                </span>
              </div>
              <Progress
                value={(stats.completedMatches / stats.totalMatches) * 100}
                className="h-2"
              />
            </div>
          )}

          {/* Status Messages */}
          {!isReady && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Tournament bracket not created yet.{" "}
                {isCreator
                  ? "Create a tournament to get started."
                  : "Waiting for tournament to be created."}
              </AlertDescription>
            </Alert>
          )}

          {isReady && !canStart && (
            <Alert>
              <Users className="h-4 w-4" />
              <AlertDescription>
                Waiting for more players to join. Need at least 2 players to
                start the tournament.
              </AlertDescription>
            </Alert>
          )}

          {isReady && canStart && stats?.completedMatches === 0 && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Tournament is ready to start! All players have joined.
              </AlertDescription>
            </Alert>
          )}

          {currentTournament?.isComplete && stats?.winner && (
            <Alert>
              <Trophy className="h-4 w-4" />
              <AlertDescription>
                Tournament completed! Winner:{" "}
                {participants.find((p) => p.user_id === stats.winner)?.user
                  ?.display_name || "Unknown"}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Tournament Actions */}
      {isCreator && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Tournament Management
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3">
              {!isReady && (
                <Dialog
                  open={showCreateDialog}
                  onOpenChange={setShowCreateDialog}
                >
                  <DialogTrigger asChild>
                    <Button className="flex-1">
                      <Target className="h-4 w-4 mr-2" />
                      Create Tournament
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Create Tournament</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="eliminationType">Tournament Type</Label>
                        <Select
                          value={formData.eliminationType}
                          onValueChange={(
                            value: "single" | "double" | "swiss"
                          ) =>
                            setFormData({ ...formData, eliminationType: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="single">
                              Single Elimination
                            </SelectItem>
                            <SelectItem value="double">
                              Double Elimination
                            </SelectItem>
                            <SelectItem value="swiss">Swiss System</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="timeLimitMinutes">
                          Match Time Limit (minutes)
                        </Label>
                        <Input
                          id="timeLimitMinutes"
                          type="number"
                          min="5"
                          max="120"
                          value={formData.timeLimitMinutes}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              timeLimitMinutes: parseInt(e.target.value) || 30,
                            })
                          }
                        />
                      </div>

                      <div>
                        <Label htmlFor="roundDurationMinutes">
                          Round Duration (minutes)
                        </Label>
                        <Input
                          id="roundDurationMinutes"
                          type="number"
                          min="10"
                          max="240"
                          value={formData.roundDurationMinutes}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              roundDurationMinutes:
                                parseInt(e.target.value) || 60,
                            })
                          }
                        />
                      </div>

                      <div>
                        <Label htmlFor="playersPerMatch">
                          Players per Match
                        </Label>
                        <Select
                          value={formData.playersPerMatch.toString()}
                          onValueChange={(value) =>
                            setFormData({
                              ...formData,
                              playersPerMatch: parseInt(value),
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="2">2 Players</SelectItem>
                            <SelectItem value="4">4 Players</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          onClick={handleCreateTournament}
                          disabled={isCreating}
                          className="flex-1"
                        >
                          {isCreating ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Target className="h-4 w-4 mr-2" />
                          )}
                          Create Tournament
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setShowCreateDialog(false)}
                          disabled={isCreating}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              )}

              {isReady && canStart && stats?.completedMatches === 0 && (
                <Button
                  onClick={handleStartTournament}
                  disabled={isStarting}
                  className="flex-1"
                >
                  {isStarting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4 mr-2" />
                  )}
                  Start Tournament
                </Button>
              )}
            </div>

            {/* Tournament Configuration Display */}
            {isReady && (
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <h4 className="font-semibold text-sm">
                  Tournament Configuration
                </h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Type:</span>{" "}
                    <span className="font-medium">
                      {getEliminationTypeLabel(formData.eliminationType)}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Match Limit:</span>{" "}
                    <span className="font-medium">
                      {formData.timeLimitMinutes} min
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">
                      Round Duration:
                    </span>{" "}
                    <span className="font-medium">
                      {formData.roundDurationMinutes} min
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">
                      Players per Match:
                    </span>{" "}
                    <span className="font-medium">
                      {formData.playersPerMatch}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Participants List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Tournament Participants ({participants.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {participants.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No participants yet
            </div>
          ) : (
            <div className="space-y-2">
              {participants.map((participant, index) => (
                <div
                  key={participant.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium">
                        {participant.user?.display_name ||
                          participant.user?.username ||
                          "Unknown Player"}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Score: {participant.score?.toLocaleString() || 0}
                      </div>
                    </div>
                  </div>
                  {participant.is_eliminated && (
                    <Badge variant="destructive">Eliminated</Badge>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TournamentManager;

