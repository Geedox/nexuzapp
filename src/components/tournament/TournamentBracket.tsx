import React, { useState, useEffect } from "react";
import { useTournament } from "@/contexts/TournamentContext";
import {
  TournamentMatch,
  TournamentBracket as TournamentBracketType,
  TournamentParticipant,
} from "@/services/tournamentService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Clock, Trophy, Users, Target } from "lucide-react";

interface TournamentBracketProps {
  roomId: string;
  isMobile?: boolean;
}

interface MatchCardProps {
  match: TournamentMatch;
  onStartMatch?: (matchId: string) => void;
  onCompleteMatch?: (matchId: string, winnerId: string) => void;
  timeRemaining?: number;
  participants: TournamentParticipant[];
}

const MatchCard: React.FC<MatchCardProps> = ({
  match,
  onStartMatch,
  onCompleteMatch,
  timeRemaining = 0,
  participants,
}) => {
  const [selectedWinner, setSelectedWinner] = useState<string | null>(null);

  const getPlayerName = (playerId: string | null) => {
    if (!playerId) return "Bye";
    const participant = participants.find((p) => p.user_id === playerId);
    return (
      participant?.user?.display_name ||
      participant?.user?.username ||
      "Unknown Player"
    );
  };

  const getPlayerScore = (playerId: string | null) => {
    if (!playerId) return 0;
    const participant = participants.find((p) => p.user_id === playerId);
    return participant?.total_score || 0;
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const handleCompleteMatch = () => {
    if (selectedWinner && onCompleteMatch) {
      onCompleteMatch(match.id, selectedWinner);
      setSelectedWinner(null);
    }
  };

  const isMatchActive = match.status === "active";
  const isMatchCompleted = match.status === "completed";
  const isMatchTimeout = match.status === "timeout";

  return (
    <Card
      className={`w-full ${
        isMatchActive
          ? "border-blue-500 bg-blue-50"
          : isMatchCompleted
          ? "border-green-500 bg-green-50"
          : isMatchTimeout
          ? "border-red-500 bg-red-50"
          : ""
      }`}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">
            Match {match.match_number}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge
              variant={
                isMatchCompleted
                  ? "default"
                  : isMatchActive
                  ? "secondary"
                  : isMatchTimeout
                  ? "destructive"
                  : "outline"
              }
            >
              {match.status}
            </Badge>
            {isMatchActive && timeRemaining > 0 && (
              <div className="flex items-center gap-1 text-sm text-orange-600">
                <Clock className="h-3 w-3" />
                {formatTime(timeRemaining)}
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          {/* Player 1 */}
          <div className="flex items-center justify-between p-2 rounded-md bg-gray-50">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              <span className="font-medium">
                {getPlayerName(match.player1_id)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">
                {getPlayerScore(match.player1_id)}
              </span>
              {isMatchActive && (
                <input
                  type="radio"
                  name={`match-${match.id}`}
                  checked={selectedWinner === match.player1_id}
                  onChange={() => setSelectedWinner(match.player1_id)}
                  className="w-4 h-4"
                />
              )}
            </div>
          </div>

          {/* Player 2 */}
          {match.player2_id && (
            <div className="flex items-center justify-between p-2 rounded-md bg-gray-50">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                <span className="font-medium">
                  {getPlayerName(match.player2_id)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">
                  {getPlayerScore(match.player2_id)}
                </span>
                {isMatchActive && (
                  <input
                    type="radio"
                    name={`match-${match.id}`}
                    checked={selectedWinner === match.player2_id}
                    onChange={() => setSelectedWinner(match.player2_id)}
                    className="w-4 h-4"
                  />
                )}
              </div>
            </div>
          )}

          {/* Winner Display */}
          {isMatchCompleted && match.winner_id && (
            <div className="flex items-center gap-2 p-2 rounded-md bg-green-100">
              <Trophy className="h-4 w-4 text-yellow-600" />
              <span className="font-medium text-green-800">
                Winner: {getPlayerName(match.winner_id)}
              </span>
            </div>
          )}

          {/* Match Actions */}
          <div className="flex gap-2">
            {match.status === "pending" && onStartMatch && (
              <Button
                size="sm"
                onClick={() => onStartMatch(match.id)}
                className="flex-1"
              >
                Start Match
              </Button>
            )}
            {isMatchActive && selectedWinner && onCompleteMatch && (
              <Button
                size="sm"
                onClick={handleCompleteMatch}
                className="flex-1"
              >
                Complete Match
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

interface RoundColumnProps {
  round: {
    roundNumber: number;
    matches: TournamentMatch[];
    isComplete: boolean;
    isActive: boolean;
  };
  participants: TournamentParticipant[];
  onStartMatch?: (matchId: string) => void;
  onCompleteMatch?: (matchId: string, winnerId: string) => void;
  timeRemaining?: Map<string, number>;
}

const RoundColumn: React.FC<RoundColumnProps> = ({
  round,
  participants,
  onStartMatch,
  onCompleteMatch,
  timeRemaining = new Map(),
}) => {
  return (
    <div className="flex flex-col gap-4 min-w-[300px]">
      <div className="text-center">
        <h3 className="font-semibold text-lg">
          {round.roundNumber === 1
            ? "First Round"
            : round.roundNumber === 2
            ? "Semi-Finals"
            : round.roundNumber === 3
            ? "Finals"
            : `Round ${round.roundNumber}`}
        </h3>
        <div className="flex items-center justify-center gap-2 mt-1">
          <Badge
            variant={
              round.isComplete
                ? "default"
                : round.isActive
                ? "secondary"
                : "outline"
            }
          >
            {round.isComplete
              ? "Complete"
              : round.isActive
              ? "Active"
              : "Pending"}
          </Badge>
        </div>
      </div>

      <div className="space-y-4">
        {round.matches.map((match: TournamentMatch) => (
          <MatchCard
            key={match.id}
            match={match}
            onStartMatch={onStartMatch}
            onCompleteMatch={onCompleteMatch}
            timeRemaining={timeRemaining.get(match.id)}
            participants={participants}
          />
        ))}
      </div>
    </div>
  );
};

const TournamentBracket: React.FC<TournamentBracketProps> = ({
  roomId,
  isMobile = false,
}) => {
  const {
    currentTournament,
    participants,
    stats,
    loading,
    startMatch,
    completeMatch,
    getMatchTimeRemaining,
    refreshTournament,
  } = useTournament();

  const [timeRemaining, setTimeRemaining] = useState<Map<string, number>>(
    new Map()
  );

  // Refresh tournament data on mount
  useEffect(() => {
    if (roomId) {
      refreshTournament(roomId);
    }
  }, [roomId, refreshTournament]);

  // Update match timers
  useEffect(() => {
    const interval = setInterval(() => {
      const newTimeRemaining = new Map<string, number>();

      if (currentTournament) {
        currentTournament.rounds.forEach((round) => {
          round.matches.forEach((match) => {
            if (match.status === "active") {
              const remaining = getMatchTimeRemaining(match.id);
              if (remaining > 0) {
                newTimeRemaining.set(match.id, remaining);
              }
            }
          });
        });
      }

      setTimeRemaining(newTimeRemaining);
    }, 1000);

    return () => clearInterval(interval);
  }, [currentTournament, getMatchTimeRemaining]);

  const handleStartMatch = async (matchId: string) => {
    try {
      await startMatch(matchId);
    } catch (error) {
      console.error("Error starting match:", error);
    }
  };

  const handleCompleteMatch = async (matchId: string, winnerId: string) => {
    try {
      await completeMatch(matchId, winnerId);
    } catch (error) {
      console.error("Error completing match:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading tournament bracket...</p>
        </div>
      </div>
    );
  }

  if (!currentTournament || currentTournament.rounds.length === 0) {
    return (
      <div className="text-center p-8">
        <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-600 mb-2">
          No Tournament Bracket
        </h3>
        <p className="text-gray-500">
          Tournament bracket will appear here once created.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Tournament Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Tournament Bracket</h2>
          {stats && (
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {stats.totalParticipants} players
              </div>
              <div className="flex items-center gap-1">
                <Target className="h-4 w-4" />
                {stats.completedMatches}/{stats.totalMatches} matches
              </div>
            </div>
          )}
        </div>

        {stats && (
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
      </div>

      {/* Bracket Display */}
      <div
        className={`${
          isMobile ? "space-y-6" : "flex gap-6 overflow-x-auto pb-4"
        }`}
      >
        {currentTournament.rounds.map((round, index) => (
          <RoundColumn
            key={round.roundNumber}
            round={round}
            participants={participants}
            onStartMatch={handleStartMatch}
            onCompleteMatch={handleCompleteMatch}
            timeRemaining={timeRemaining}
          />
        ))}
      </div>

      {/* Tournament Complete */}
      {stats?.isComplete && stats.winner && (
        <div className="mt-8 text-center">
          <Card className="max-w-md mx-auto">
            <CardContent className="pt-6">
              <Trophy className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                Tournament Complete!
              </h3>
              <p className="text-gray-600">
                Winner:{" "}
                {participants.find((p) => p.user_id === stats.winner)?.user
                  ?.display_name || "Unknown"}
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default TournamentBracket;
