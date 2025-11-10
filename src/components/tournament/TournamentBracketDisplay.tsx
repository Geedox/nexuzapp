import React, { useState, useEffect, useCallback } from "react";
import type {
  TournamentBracket,
  TournamentMatch,
  TournamentParticipant,
  MatchApprovalStatus,
} from "@/types/tournament";
import { tournamentTimingService } from "@/services/tournamentTimingService";
import { GameRoom } from "@/types/gameroom";
import { useAuth } from "@/hooks/auth";
import { toast } from "@/hooks/use-toast";
import { tournamentService } from "@/services/tournamentService";
import { useGameRoom } from "@/hooks/gameroom";
import { AdminScoreSubmissionDialog } from "./AdminScoreSubmissionDialog";
import { ParticipantApprovalDialog } from "./ParticipantApprovalDialog";
import { supabase } from "@/integrations/supabase/client";
import { RealtimeChannel } from "@supabase/supabase-js";
import { logger } from "@/utils/logger";
import { ApprovalStatusDisplay } from "./ApprovalStatus";

interface TournamentBracketDisplayProps {
  tournament: TournamentBracket;
  participants: TournamentParticipant[];
  currentUserId?: string;
  room: GameRoom;
}

export const TournamentBracketDisplay: React.FC<
  TournamentBracketDisplayProps
> = ({ tournament, participants, currentUserId, room }) => {
  const [matchTimers, setMatchTimers] = useState<Map<string, number>>(
    new Map()
  );
  const [roundTimers, setRoundTimers] = useState<Map<number, number>>(
    new Map()
  );
  const { user } = useAuth();
  const [advancingMatch, setAdvancingMatch] = useState<string | null>(null);
  const { playGame } = useGameRoom();

  // Dialog states
  const [showAdminScoreDialog, setShowAdminScoreDialog] = useState(false);
  const [showParticipantApprovalDialog, setShowParticipantApprovalDialog] =
    useState(false);
  const [selectedMatch, setSelectedMatch] = useState<TournamentMatch | null>(
    null
  );

  // Real-time subscription state
  const [subscription, setSubscription] = useState<RealtimeChannel | null>(
    null
  );

  // Check if current user is admin (room creator)
  const isAdmin = user?.id === room.creator_id;

  // Handle starting a match (admin only) - Open admin score submission dialog
  const handleAddScores = async (match: TournamentMatch) => {
    if (!isAdmin) return;
    setSelectedMatch(match);
    setShowAdminScoreDialog(true);
  };

  // Handle approval status click
  const handleApprovalClick = async (match: TournamentMatch) => {
    setSelectedMatch(match);
    setShowParticipantApprovalDialog(true);
  };

  // Check if a match is ready to start
  const isMatchReady = (match: TournamentMatch): boolean => {
    if (match.status === "pending" || match.status === "completed")
      return false;

    const playersPerMatch = match.match_data?.players_per_match || 2;
    const currentPlayerCount = [
      match.player1_id,
      match.player2_id,
      match.player3_id,
      match.player4_id,
    ].filter(Boolean).length;
    logger.debug(
      `players per match: ${playersPerMatch}, current players: ${currentPlayerCount}`
    );
    const res = currentPlayerCount >= playersPerMatch;
    logger.info("Can start match", res);
    return res;
  };

  // Handle advancing a match (admin only)
  const handleAdvanceMatch = async (match: TournamentMatch) => {
    if (!isAdmin) return;

    // Check if scores have been submitted by admin
    if (!match.match_data?.admin_submitted_at) {
      toast({
        title: "No scores submitted",
        description: "Please submit scores first before advancing the match",
        variant: "destructive",
      });
      return;
    }

    // Check if scores are fully approved
    const approvalStatus = await tournamentService.getMatchApprovalStatus(
      match.id
    );
    if (!approvalStatus?.is_fully_approved) {
      toast({
        title: "Scores not approved",
        description: `Scores need approval from ${
          approvalStatus?.required_approvals || 0
        } participants. Currently approved by ${
          approvalStatus?.collected_approvals || 0
        }.`,
        variant: "destructive",
      });
      return;
    }

    // if both scores are zero, return
    if (
      match.match_data?.scores &&
      Object.values(match.match_data.scores).every((score) => score === 0)
    ) {
      toast({
        title: "No scores submitted",
        description: "Cannot advance match without scores",
        variant: "destructive",
      });
      return;
    }

    // if all scores are equal, return and toast cannot determine winner
    if (
      match.match_data?.scores &&
      Object.values(match.match_data.scores).every(
        (score) => score === Object.values(match.match_data.scores)[0]
      )
    ) {
      toast({
        title: "Cannot determine winner",
        description: "Cannot advance match without a clear winner",
        variant: "destructive",
      });
      return;
    }

    setAdvancingMatch(match.id);
    try {
      // Get match scores
      const scores = match.match_data?.scores || {};

      if (Object.keys(scores).length === 0) {
        toast({
          title: "No scores submitted",
          description: "Cannot advance match without scores",
          variant: "destructive",
        });
        return;
      }

      // Find winner with highest score
      let winnerId: string | null = null;
      let loserId: string | null = null;
      let highestScore = -1;

      for (const [userId, score] of Object.entries(scores)) {
        if (score > highestScore) {
          highestScore = score;
          winnerId = userId;
        }
      }
      const userIds = Object.keys(scores);
      loserId = userIds.find((userId) => userId !== winnerId);

      if (!winnerId) {
        toast({
          title: "No winner determined",
          description: "Cannot advance match without a clear winner",
          variant: "destructive",
        });
        return;
      }

      // Complete the match
      await tournamentService.completeMatch(
        match.id,
        winnerId,
        room.name,
        scores
      );

      toast({
        title: "Match advanced",
        description: `Match completed and winner advanced to next round`,
      });
    } catch (error) {
      console.error("Error advancing match:", error);
      toast({
        title: "Failed to advance match",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setAdvancingMatch(null);
    }
  };

  // Helper function to get participant info by user ID
  const getParticipantInfo = (userId: string | null) => {
    if (!userId) return null;
    return participants.find((p) => p.user_id === userId);
  };

  // Format time in MM:SS format
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds
      .toString()
      .padStart(2, "0")}`;
  };

  // Get time color based on remaining time
  const getTimeColor = (seconds: number): string => {
    if (seconds <= 60) return "text-red-400"; // Less than 1 minute - red
    if (seconds <= 300) return "text-yellow-400"; // Less than 5 minutes - yellow
    return "text-green-400"; // More than 5 minutes - green
  };

  // Update timing information
  useEffect(() => {
    const updateTiming = async () => {
      try {
        const newMatchTimers = new Map<string, number>();
        const newRoundTimers = new Map<number, number>();

        // Get timing for all matches
        for (const round of tournament.rounds) {
          for (const match of round.matches) {
            if (match.status === "active") {
              const remainingTime =
                await tournamentTimingService.getMatchRemainingTime(match.id);
              if (remainingTime !== null) {
                newMatchTimers.set(match.id, remainingTime);
              }
            }
          }

          // Get round timing (we need roomId for this)
          if (round.matches.length > 0) {
            const roomId = round.matches[0].room_id;
            const roundTime =
              await tournamentTimingService.getRoundRemainingTime(roomId);
            if (roundTime !== null) {
              newRoundTimers.set(round.roundNumber, roundTime);
            }
          }
        }

        setMatchTimers(newMatchTimers);
        setRoundTimers(newRoundTimers);
      } catch (error) {
        console.error("Error updating timing:", error);
      }
    };

    // Update immediately
    updateTiming();

    // Update every second
    const interval = setInterval(updateTiming, 1000);

    return () => clearInterval(interval);
  }, [tournament.rounds]);

  // Real-time subscription for tournament match updates
  useEffect(() => {
    if (!room.id) return;

    const channel = supabase
      .channel(`tournament_matches_${room.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tournament_matches",
          filter: `room_id=eq.${room.id}`,
        },
        (payload) => {
          logger.info("Tournament match updated:", payload);
        }
      )
      .subscribe();

    setSubscription(channel);

    return () => {
      channel.unsubscribe();
      setSubscription(null);
    };
  }, [room.id]);

  // Helper function to get match status styling
  const getMatchStatusClass = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500/20 border-green-500/30 text-green-400";
      case "active":
        return "bg-primary/20 border-primary/30 text-primary";
      case "pending":
        return "bg-secondary/50 border-primary/10 text-muted-foreground";
      case "timeout":
        return "bg-red-500/20 border-red-500/30 text-red-400";
      default:
        return "bg-secondary/50 border-primary/10 text-muted-foreground";
    }
  };

  // Helper function to render a single match
  const renderMatch = (match: TournamentMatch) => {
    const player1 = getParticipantInfo(match.player1_id);
    const player2 = getParticipantInfo(match.player2_id);
    const player3 = getParticipantInfo(match.player3_id);
    const player4 = getParticipantInfo(match.player4_id);

    const isCurrentUserMatch =
      currentUserId &&
      (match.player1_id === currentUserId ||
        match.player2_id === currentUserId ||
        match.player3_id === currentUserId ||
        match.player4_id === currentUserId);

    const players = [player1, player2, player3, player4].filter(Boolean);

    return (
      <div
        key={match.id}
        className={`relative p-3 rounded-lg border-2 transition-all ${getMatchStatusClass(
          match.status
        )} ${isCurrentUserMatch ? "ring-2 ring-primary/50" : ""}`}
      >
        {/* Match Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs font-cyber font-bold text-muted-foreground">
            Round {match.round_number} • Match {match.match_number}
          </div>
          {isCurrentUserMatch && (
            <div className="text-xs bg-primary/20 text-primary px-2 py-1 rounded">
              Your Match
            </div>
          )}
        </div>

        {/* Players */}
        <div className="space-y-2">
          {players.map((player, index) => {
            if (!player) return null;

            const isWinner = match.winner_id === player.user_id;
            const isCurrentUser = player.user_id === currentUserId;
            const playerScore = match.match_data?.scores?.[player.user_id];

            return (
              <div
                key={player.user_id}
                className={`flex items-center justify-between p-2 rounded-lg ${
                  isWinner
                    ? "bg-green-500/20 border border-green-500/30"
                    : isCurrentUser
                    ? "bg-primary/20 border border-primary/30"
                    : "bg-secondary/30"
                }`}
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-background font-cyber font-bold text-xs ${
                      isWinner
                        ? "bg-gradient-to-br from-green-400 to-green-600"
                        : "bg-gradient-to-br from-primary to-accent"
                    }`}
                  >
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-cyber font-bold text-foreground text-sm">
                      {player.user?.display_name ||
                        player.user?.username ||
                        "Unknown Player"}
                      {isCurrentUser && (
                        <span className="ml-1 text-xs text-primary">(You)</span>
                      )}
                      {isWinner && (
                        <span className="ml-1 text-xs text-green-400">👑</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  {playerScore !== undefined ? (
                    <div className="text-sm font-cyber font-bold text-accent">
                      {playerScore.toLocaleString()}
                    </div>
                  ) : (
                    <div className="text-xs text-muted-foreground">0</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Match Timing */}
        {match.status === "active" && matchTimers.has(match.id) && (
          <div className="mt-2 pt-2 border-t border-primary/10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-cyber font-bold text-primary">
                Match Timer
              </span>
              <div
                className={`text-sm font-cyber font-bold ${getTimeColor(
                  matchTimers.get(match.id)!
                )}`}
              >
                {formatTime(matchTimers.get(match.id)!)}
              </div>
            </div>
            <div className="w-full bg-secondary/30 rounded-full h-1.5">
              <div
                className={`h-1.5 rounded-full transition-all duration-1000 ${
                  matchTimers.get(match.id)! <= 60
                    ? "bg-gradient-to-r from-red-500 to-red-600"
                    : matchTimers.get(match.id)! <= 300
                    ? "bg-gradient-to-r from-yellow-500 to-yellow-600"
                    : "bg-gradient-to-r from-green-500 to-green-600"
                }`}
                style={{
                  width: `${Math.max(
                    0,
                    Math.min(100, (matchTimers.get(match.id)! / 1800) * 100)
                  )}%`, // Assuming 30 minutes max
                }}
              />
            </div>
          </div>
        )}

        {/* Match Status */}
        <div className="mt-2 pt-2 border-t border-primary/10">
          <div className="flex items-center justify-between text-xs">
            <span className="font-cyber font-bold capitalize">
              {match.status}
            </span>
            {match.completed_at && (
              <span className="text-muted-foreground">
                {new Date(match.completed_at).toLocaleTimeString()}
              </span>
            )}
          </div>

          {/* Approval Status Display */}
          {match.match_data?.admin_submitted_at && (
            <div className="mt-2">
              <ApprovalStatusDisplay
                match={match}
                currentUserId={currentUserId}
                onApprovalClick={() => handleApprovalClick(match)}
              />
            </div>
          )}

          {/* Play Game Button for Participants */}
          {isCurrentUserMatch &&
            match.status === "active" &&
            !room.is_special && (
              <div className="mt-2">
                <button
                  onClick={() => playGame(room.id)}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white text-xs font-cyber font-bold py-2 px-3 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <span>🎮</span>
                  Play Game
                </button>
              </div>
            )}

          {/* Admin Buttons */}
          {isAdmin && room.is_special && (
            <div className="mt-2 space-y-2">
              {/* Add Scores Button */}
              {isMatchReady(match) && room.is_special && (
                <button
                  onClick={() => handleAddScores(match)}
                  disabled={advancingMatch === match.id}
                  className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-gray-500 disabled:to-gray-600 text-white text-xs font-cyber font-bold py-2 px-3 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {advancingMatch === match.id ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                      Adding scores...
                    </div>
                  ) : (
                    "Add scores"
                  )}
                </button>
              )}

              {/* Advance Match Button */}
              {match.status === "active" &&
                match.match_data?.scores &&
                // room.play_mode === "single" &&
                Object.keys(match.match_data.scores).length > 0 &&
                room.is_special && (
                  <button
                    onClick={() => handleAdvanceMatch(match)}
                    disabled={advancingMatch === match.id}
                    className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-gray-500 disabled:to-gray-600 text-white text-xs font-cyber font-bold py-2 px-3 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {advancingMatch === match.id ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                        Advancing...
                      </div>
                    ) : (
                      "Advance Match"
                    )}
                  </button>
                )}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Helper function to render a round
  const renderRound = (round: any) => {
    const roundTimeRemaining = roundTimers.get(round.roundNumber);
    const hasActiveMatches = round.matches.some(
      (match: TournamentMatch) => match.status === "active"
    );

    return (
      <div key={round.roundNumber} className="flex flex-col">
        <div className="text-center mb-4">
          <h3 className="text-lg font-cyber font-bold text-primary">
            Round {round.roundNumber}
          </h3>
          <div className="text-xs text-muted-foreground">
            {round.matches.length} match{round.matches.length !== 1 ? "es" : ""}
          </div>

          {/* Round Timer */}
          {hasActiveMatches && roundTimeRemaining !== undefined && (
            <div className="mt-3 bg-secondary/50 rounded-lg p-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-cyber font-bold text-primary">
                  Round Timer
                </span>
                <div
                  className={`text-sm font-cyber font-bold ${getTimeColor(
                    roundTimeRemaining
                  )}`}
                >
                  {formatTime(roundTimeRemaining)}
                </div>
              </div>
              <div className="w-full bg-secondary/30 rounded-full h-1.5">
                <div
                  className={`h-1.5 rounded-full transition-all duration-1000 ${
                    roundTimeRemaining <= 60
                      ? "bg-gradient-to-r from-red-500 to-red-600"
                      : roundTimeRemaining <= 300
                      ? "bg-gradient-to-r from-yellow-500 to-yellow-600"
                      : "bg-gradient-to-r from-green-500 to-green-600"
                  }`}
                  style={{
                    width: `${Math.max(
                      0,
                      Math.min(100, (roundTimeRemaining / 3600) * 100)
                    )}%`, // Assuming 1 hour max
                  }}
                />
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          {round.matches.map((match: TournamentMatch) => renderMatch(match))}
        </div>
      </div>
    );
  };

  if (tournament.rounds.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-4">🏆</div>
        <h3 className="text-lg font-cyber font-bold text-primary mb-2">
          No Tournament Matches
        </h3>
        <p className="text-muted-foreground">
          Tournament matches will appear here once the tournament starts.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-card to-secondary border border-primary/20 rounded-xl p-6">
      <div className="mb-6">
        <h3 className="text-xl font-cyber font-bold text-primary mb-2">
          Tournament Bracket
        </h3>
        <div className="text-sm text-muted-foreground">
          Single Elimination • {participants.length} participants •{" "}
          {tournament.totalRounds} rounds
        </div>
      </div>

      {/* Bracket Display */}
      <div className="overflow-x-auto">
        <div className="flex justify-center gap-8 flex-wrap">
          {tournament.rounds.map((round) => (
            <div key={round.roundNumber} className="flex-shrink-0 min-w-60">
              {renderRound(round)}
            </div>
          ))}
        </div>
      </div>

      {/* Tournament Progress */}
      <div className="mt-6 pt-4 border-t border-primary/10">
        <div className="flex items-center justify-between text-sm">
          <span className="font-cyber font-bold text-primary">
            Tournament Progress
          </span>
          <span className="text-muted-foreground">
            {tournament.currentRound} of {tournament.totalRounds} rounds
          </span>
        </div>
        <div className="mt-2 w-full bg-secondary/50 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-primary to-accent h-2 rounded-full transition-all duration-500"
            style={{
              width: `${
                (tournament.currentRound / tournament.totalRounds) * 100
              }%`,
            }}
          />
        </div>
      </div>

      {/* Dialog Components */}
      {selectedMatch && (
        <>
          <AdminScoreSubmissionDialog
            match={selectedMatch}
            isOpen={showAdminScoreDialog}
            onClose={() => {
              setShowAdminScoreDialog(false);
              setSelectedMatch(null);
            }}
            onScoresSubmitted={() => {
              // Refresh tournament data or handle success
              setShowAdminScoreDialog(false);
              setSelectedMatch(null);
            }}
          />

          <ParticipantApprovalDialog
            match={selectedMatch}
            isOpen={showParticipantApprovalDialog}
            onClose={() => {
              setShowParticipantApprovalDialog(false);
              setSelectedMatch(null);
            }}
            onApprovalSubmitted={() => {
              // Refresh tournament data or handle success
              setShowParticipantApprovalDialog(false);
              setSelectedMatch(null);
            }}
          />
        </>
      )}
    </div>
  );
};
