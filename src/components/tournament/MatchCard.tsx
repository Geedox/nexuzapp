import React, { useState, useEffect } from "react";
import {
  TournamentMatch,
  TournamentParticipant,
} from "@/services/tournamentService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Clock, Trophy, User, Users } from "lucide-react";

interface MatchCardProps {
  match: TournamentMatch;
  participants: TournamentParticipant[];
  onStartMatch?: (matchId: string) => void;
  onCompleteMatch?: (matchId: string, winnerId: string) => void;
  onTimeoutMatch?: (matchId: string) => void;
  timeRemaining?: number;
  isAdmin?: boolean;
}

const MatchCard: React.FC<MatchCardProps> = ({
  match,
  participants,
  onStartMatch,
  onCompleteMatch,
  onTimeoutMatch,
  timeRemaining = 0,
  isAdmin = false,
}) => {
  const [selectedWinner, setSelectedWinner] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(timeRemaining);

  // Update time remaining
  useEffect(() => {
    setTimeLeft(timeRemaining);
  }, [timeRemaining]);

  // Auto-timeout when time reaches 0
  useEffect(() => {
    if (timeLeft > 0 && match.status === "active") {
      const timer = setTimeout(() => {
        if (onTimeoutMatch) {
          onTimeoutMatch(match.id);
        }
      }, timeLeft * 1000);

      return () => clearTimeout(timer);
    }
  }, [timeLeft, match.status, match.id, onTimeoutMatch]);

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

  const getPlayerAvatar = (playerId: string | null) => {
    if (!playerId) return null;
    const participant = participants.find((p) => p.user_id === playerId);
    return participant?.user?.avatar_url || null;
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

  const handleStartMatch = () => {
    if (onStartMatch) {
      onStartMatch(match.id);
    }
  };

  const isMatchActive = match.status === "active";
  const isMatchCompleted = match.status === "completed";
  const isMatchTimeout = match.status === "timeout";
  const isMatchPending = match.status === "pending";

  const getStatusColor = () => {
    if (isMatchCompleted) return "border-green-500 bg-green-50";
    if (isMatchTimeout) return "border-red-500 bg-red-50";
    if (isMatchActive) return "border-blue-500 bg-blue-50";
    return "border-gray-200 bg-white";
  };

  const getStatusBadge = () => {
    if (isMatchCompleted)
      return { variant: "default" as const, text: "Completed" };
    if (isMatchTimeout)
      return { variant: "destructive" as const, text: "Timeout" };
    if (isMatchActive) return { variant: "secondary" as const, text: "Active" };
    return { variant: "outline" as const, text: "Pending" };
  };

  const statusBadge = getStatusBadge();

  return (
    <Card className={`w-full transition-all duration-200 ${getStatusColor()}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">
            Match {match.match_number}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant={statusBadge.variant}>{statusBadge.text}</Badge>
            {isMatchActive && timeLeft > 0 && (
              <div className="flex items-center gap-1 text-sm text-orange-600 font-medium">
                <Clock className="h-4 w-4" />
                {formatTime(timeLeft)}
              </div>
            )}
          </div>
        </div>

        {/* Time Progress Bar for Active Matches */}
        {isMatchActive && timeLeft > 0 && match.time_limit_minutes && (
          <div className="mt-2">
            <div className="flex justify-between text-xs text-gray-600 mb-1">
              <span>Time Remaining</span>
              <span>{formatTime(timeLeft)}</span>
            </div>
            <Progress
              value={(timeLeft / (match.time_limit_minutes * 60)) * 100}
              className="h-2"
            />
          </div>
        )}
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-4">
          {/* Players */}
          <div className="space-y-3">
            {/* Player 1 */}
            <div
              className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                isMatchActive
                  ? "bg-blue-50 border border-blue-200"
                  : "bg-gray-50"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold text-sm">
                  {getPlayerAvatar(match.player1_id) ? (
                    <img
                      src={getPlayerAvatar(match.player1_id)}
                      alt={getPlayerName(match.player1_id)}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <User className="h-4 w-4" />
                  )}
                </div>
                <div>
                  <span className="font-medium text-gray-900">
                    {getPlayerName(match.player1_id)}
                  </span>
                  <div className="text-sm text-gray-600">
                    Score: {getPlayerScore(match.player1_id).toLocaleString()}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {isMatchCompleted && match.winner_id === match.player1_id && (
                  <Trophy className="h-5 w-5 text-yellow-500" />
                )}
                {isMatchActive && isAdmin && (
                  <input
                    type="radio"
                    name={`match-${match.id}`}
                    checked={selectedWinner === match.player1_id}
                    onChange={() => setSelectedWinner(match.player1_id)}
                    className="w-4 h-4 text-blue-600"
                  />
                )}
              </div>
            </div>

            {/* VS Divider */}
            <div className="flex items-center justify-center">
              <div className="text-xs font-semibold text-gray-400 bg-gray-100 px-2 py-1 rounded">
                VS
              </div>
            </div>

            {/* Player 2 */}
            {match.player2_id && (
              <div
                className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                  isMatchActive
                    ? "bg-red-50 border border-red-200"
                    : "bg-gray-50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center text-white font-semibold text-sm">
                    {getPlayerAvatar(match.player2_id) ? (
                      <img
                        src={getPlayerAvatar(match.player2_id)}
                        alt={getPlayerName(match.player2_id)}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <User className="h-4 w-4" />
                    )}
                  </div>
                  <div>
                    <span className="font-medium text-gray-900">
                      {getPlayerName(match.player2_id)}
                    </span>
                    <div className="text-sm text-gray-600">
                      Score: {getPlayerScore(match.player2_id).toLocaleString()}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {isMatchCompleted && match.winner_id === match.player2_id && (
                    <Trophy className="h-5 w-5 text-yellow-500" />
                  )}
                  {isMatchActive && isAdmin && (
                    <input
                      type="radio"
                      name={`match-${match.id}`}
                      checked={selectedWinner === match.player2_id}
                      onChange={() => setSelectedWinner(match.player2_id)}
                      className="w-4 h-4 text-red-600"
                    />
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Winner Display */}
          {isMatchCompleted && match.winner_id && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-green-100 border border-green-200">
              <Trophy className="h-5 w-5 text-yellow-600" />
              <span className="font-semibold text-green-800">
                Winner: {getPlayerName(match.winner_id)}
              </span>
            </div>
          )}

          {/* Match Actions */}
          {isAdmin && (
            <div className="flex gap-2 pt-2">
              {isMatchPending && onStartMatch && (
                <Button onClick={handleStartMatch} className="flex-1" size="sm">
                  <Users className="h-4 w-4 mr-2" />
                  Start Match
                </Button>
              )}
              {isMatchActive && selectedWinner && onCompleteMatch && (
                <Button
                  onClick={handleCompleteMatch}
                  className="flex-1"
                  size="sm"
                  variant="default"
                >
                  <Trophy className="h-4 w-4 mr-2" />
                  Complete Match
                </Button>
              )}
              {isMatchActive && onTimeoutMatch && (
                <Button
                  onClick={() => onTimeoutMatch(match.id)}
                  className="flex-1"
                  size="sm"
                  variant="destructive"
                >
                  <Clock className="h-4 w-4 mr-2" />
                  Timeout
                </Button>
              )}
            </div>
          )}

          {/* Match Info */}
          <div className="text-xs text-gray-500 pt-2 border-t">
            <div className="flex justify-between">
              <span>Round {match.round_number}</span>
              <span>Time Limit: {match.time_limit_minutes || 30} min</span>
            </div>
            {match.started_at && (
              <div className="mt-1">
                Started: {new Date(match.started_at).toLocaleTimeString()}
              </div>
            )}
            {match.completed_at && (
              <div className="mt-1">
                Completed: {new Date(match.completed_at).toLocaleTimeString()}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MatchCard;
