import React, { useState, useEffect } from "react";
import { useGameRoom } from "@/contexts/GameRoomContext";
import { useTournament } from "@/contexts/TournamentContext";
import { TournamentMatch } from "@/services/tournamentService";
import TournamentBracket from "./TournamentBracket";
import TournamentManager from "./TournamentManager";
import TournamentTimer from "./TournamentTimer";
import MatchCard from "./MatchCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Trophy,
  Users,
  Clock,
  Target,
  Play,
  Pause,
  RotateCcw,
  Info,
  TrendingUp,
} from "lucide-react";

interface TournamentDisplayProps {
  roomId: string;
  isCreator: boolean;
  isMobile?: boolean;
}

const TournamentDisplay: React.FC<TournamentDisplayProps> = ({
  roomId,
  isCreator,
  isMobile = false,
}) => {
  const {
    canStartTournament,
    isTournamentReady,
    getCurrentRoundMatches,
    startTournamentMatch,
    completeTournamentMatch,
    timeoutTournamentMatch,
  } = useGameRoom();

  const {
    currentTournament,
    participants,
    stats,
    loading,
    error,
    refreshTournament,
    getMatchTimeRemaining,
  } = useTournament();

  const [activeMatches, setActiveMatches] = useState<TournamentMatch[]>([]);
  const [canStart, setCanStart] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Load tournament status
  useEffect(() => {
    const loadStatus = async () => {
      if (roomId) {
        const [canStartResult, isReadyResult, currentMatches] =
          await Promise.all([
            canStartTournament(roomId),
            isTournamentReady(roomId),
            getCurrentRoundMatches(roomId),
          ]);

        setCanStart(canStartResult);
        setIsReady(isReadyResult);
        setActiveMatches(currentMatches);
      }
    };

    loadStatus();

    // Refresh status every 10 seconds
    const interval = setInterval(loadStatus, 10000);
    return () => clearInterval(interval);
  }, [roomId, canStartTournament, isTournamentReady, getCurrentRoundMatches]);

  // Refresh tournament data
  useEffect(() => {
    if (roomId) {
      refreshTournament(roomId);
    }
  }, [roomId, refreshTournament]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshTournament(roomId);
    } catch (error) {
      console.error("Error refreshing tournament:", error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleStartMatch = async (matchId: string) => {
    try {
      await startTournamentMatch(matchId);
      // Refresh current matches
      const currentMatches = await getCurrentRoundMatches(roomId);
      setActiveMatches(currentMatches);
    } catch (error) {
      console.error("Error starting match:", error);
    }
  };

  const handleCompleteMatch = async (matchId: string, winnerId: string) => {
    try {
      await completeTournamentMatch(matchId, winnerId);
      // Refresh current matches
      const currentMatches = await getCurrentRoundMatches(roomId);
      setActiveMatches(currentMatches);
    } catch (error) {
      console.error("Error completing match:", error);
    }
  };

  const handleTimeoutMatch = async (matchId: string) => {
    try {
      await timeoutTournamentMatch(matchId);
      // Refresh current matches
      const currentMatches = await getCurrentRoundMatches(roomId);
      setActiveMatches(currentMatches);
    } catch (error) {
      console.error("Error timing out match:", error);
    }
  };

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Error loading tournament: {error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tournament Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-6 w-6" />
              Tournament
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={refreshing}
              >
                <RotateCcw
                  className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
                />
              </Button>
              {stats && (
                <Badge variant={stats.isComplete ? "default" : "secondary"}>
                  {stats.isComplete ? "Complete" : "In Progress"}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>

        {stats && (
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {stats.totalParticipants}
                </div>
                <div className="text-sm text-muted-foreground">Players</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {stats.currentRound}/{stats.totalRounds}
                </div>
                <div className="text-sm text-muted-foreground">Round</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {stats.completedMatches}/{stats.totalMatches}
                </div>
                <div className="text-sm text-muted-foreground">Matches</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {Math.round(
                    (stats.completedMatches / stats.totalMatches) * 100
                  )}
                  %
                </div>
                <div className="text-sm text-muted-foreground">Progress</div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Tournament Tabs */}
      <Tabs defaultValue="bracket" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="bracket" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Bracket
          </TabsTrigger>
          <TabsTrigger value="matches" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Current Matches
          </TabsTrigger>
          <TabsTrigger value="participants" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Participants
          </TabsTrigger>
        </TabsList>

        {/* Tournament Bracket */}
        <TabsContent value="bracket" className="space-y-4">
          {isCreator && (
            <TournamentManager roomId={roomId} isCreator={isCreator} />
          )}
          <TournamentBracket roomId={roomId} isMobile={isMobile} />
        </TabsContent>

        {/* Current Round Matches */}
        <TabsContent value="matches" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Current Round Matches
                {stats && (
                  <Badge variant="outline">Round {stats.currentRound}</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activeMatches.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No active matches in current round</p>
                </div>
              ) : (
                <div
                  className={`grid gap-4 ${
                    isMobile ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2"
                  }`}
                >
                  {activeMatches.map((match) => (
                    <MatchCard
                      key={match.id}
                      match={match}
                      participants={participants}
                      onStartMatch={isCreator ? handleStartMatch : undefined}
                      onCompleteMatch={
                        isCreator ? handleCompleteMatch : undefined
                      }
                      onTimeoutMatch={
                        isCreator ? handleTimeoutMatch : undefined
                      }
                      timeRemaining={getMatchTimeRemaining(match.id)}
                      isAdmin={isCreator}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Participants */}
        <TabsContent value="participants" className="space-y-4">
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
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No participants in tournament</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {participants
                    .sort((a, b) => (b.total_score || 0) - (a.total_score || 0))
                    .map((participant, index) => (
                      <div
                        key={participant.id}
                        className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border"
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
                              Total Score:{" "}
                              {participant.total_score?.toLocaleString() || 0}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">
                            {participant.matches_won || 0}W /{" "}
                            {participant.matches_played || 0}P
                          </div>
                          {participant.is_eliminated && (
                            <Badge variant="destructive" className="mt-1">
                              Eliminated
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Tournament Complete */}
      {stats?.isComplete && stats.winner && (
        <Card className="border-green-500 bg-green-50">
          <CardContent className="pt-6">
            <div className="text-center">
              <Trophy className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-green-800 mb-2">
                Tournament Complete!
              </h2>
              <p className="text-green-700 text-lg">
                🏆 Winner:{" "}
                {participants.find((p) => p.user_id === stats.winner)?.user
                  ?.display_name || "Unknown"}
              </p>
              <div className="mt-4 flex items-center justify-center gap-4 text-sm text-green-600">
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {stats.totalParticipants} players
                </div>
                <div className="flex items-center gap-1">
                  <Target className="h-4 w-4" />
                  {stats.totalMatches} matches
                </div>
                <div className="flex items-center gap-1">
                  <TrendingUp className="h-4 w-4" />
                  {stats.totalRounds} rounds
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TournamentDisplay;
