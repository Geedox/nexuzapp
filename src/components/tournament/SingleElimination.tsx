import React, { useCallback, useState, useMemo } from "react";
import { useTournament } from "@/hooks/tournament";
import { useAuth } from "@/hooks/auth";
import type { GameRoom } from "@/types/gameroom";
import type {
  TournamentBracket,
  TournamentParticipant,
  TournamentStats,
  TournamentMatch,
} from "@/types/tournament";
import { logger } from "@/utils";
import { toast } from "@/hooks/use-toast";
import { TournamentBracketDisplay } from "./TournamentBracketDisplay";

interface SingleEliminationProps {
  room: GameRoom;
  tournament: TournamentBracket;
  participants: TournamentParticipant[];
  stats: TournamentStats;
}

export const SingleElimination: React.FC<SingleEliminationProps> = ({
  room,
  tournament,
  participants,
  stats,
}) => {
  const { startTournament, starting } = useTournament();
  const { user } = useAuth();

  // Get current user's participant
  const getCurrentUserParticipant = useCallback(() => {
    if (!user) return null;
    return participants.find((p) => p.user_id === user.id);
  }, [user, participants]);

  const currentUserParticipant = useMemo(
    () => getCurrentUserParticipant(),
    [getCurrentUserParticipant]
  );

  // Get current user's active match
  const getCurrentUserActiveMatch = useCallback(() => {
    if (!user || !tournament.rounds.length) return null;
    for (const round of tournament.rounds) {
      for (const match of round.matches) {
        if (
          // match.status === "active" &&
          match.player1_id === user.id ||
          match.player2_id === user.id ||
          match.player3_id === user.id ||
          match.player4_id === user.id
        ) {
          return match;
        }
      }
    }
    logger.debug("No current user active match found");
    return null;
  }, [user, tournament.rounds]);

  const currentUserActiveMatch = useMemo(
    () => getCurrentUserActiveMatch(),
    [getCurrentUserActiveMatch]
  );

  // Check if user is admin/creator of the room
  const isAdmin = useMemo(
    () => user?.id === room.creator_id,
    [user?.id, room.creator_id]
  );

  // Check if tournament matches exist
  const hasTournamentMatches = useMemo(
    () => tournament.rounds.length > 0,
    [tournament.rounds.length]
  );

  // Handle starting tournament
  const handleStartTournament = async () => {
    if (!isAdmin) return;

    try {
      await startTournament(room.id);
    } catch (error) {
      console.error("Error starting tournament:", error);
      toast({
        title: "Failed to start tournament",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  // Render score submission
  const renderScoreSubmission = () => {
    if (!currentUserParticipant) {
      return (
        <div className="text-center py-8">
          <div className="text-4xl mb-4">👤</div>
          <h3 className="text-lg font-cyber font-bold text-primary mb-2">
            Not Participating
          </h3>
          <p className="text-muted-foreground">
            You are not participating in this tournament.
          </p>
        </div>
      );
    }

    if (!currentUserActiveMatch) {
      return (
        <div className="text-center py-8">
          <div className="text-4xl mb-4">⏳</div>
          <h3 className="text-lg font-cyber font-bold text-primary mb-2">
            Waiting for Your Match
          </h3>
          <p className="text-muted-foreground">
            You don't have an active match right now. Check back when your match
            is ready.
          </p>
        </div>
      );
    }
  };

  // Render tournament progress
  const renderProgress = () => {
    const progress = (stats.completedMatches / stats.totalMatches) * 100;

    return (
      <div className="bg-gradient-to-br from-card to-secondary border border-primary/20 rounded-xl p-6">
        <h3 className="text-lg font-cyber font-bold text-primary mb-4">
          Tournament Progress
        </h3>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-cyber text-muted-foreground">
              Match Progress
            </span>
            <span className="text-sm font-cyber font-bold text-primary">
              {stats.completedMatches} of {stats.totalMatches} matches
            </span>
          </div>

          <div className="w-full bg-secondary/50 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-primary to-accent h-2 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>0%</span>
            <span>100%</span>
          </div>
        </div>
      </div>
    );
  };

  // Render start tournament button for admins
  const renderStartTournamentButton = () => {
    if (isAdmin && !hasTournamentMatches && room.status !== "waiting")
      return (
        <div className="bg-gradient-to-br from-card to-secondary border border-primary/20 rounded-xl p-6">
          <div className="text-center">
            <div className="text-4xl mb-4">🎮</div>
            <h3 className="text-lg font-cyber font-bold text-primary mb-2">
              Tournament Not Started
            </h3>
            <p className="text-muted-foreground mb-4">
              As the room creator, you can manually start the tournament when
              you're ready.
            </p>
            <button
              onClick={handleStartTournament}
              disabled={starting}
              className="bg-gradient-to-r from-primary to-accent text-background font-cyber font-bold px-6 py-3 rounded-xl hover:scale-105 transition-all cyber-button shadow-lg hover:shadow-primary/50 disabled:opacity-50 disabled:hover:scale-100"
            >
              {starting ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-background"></div>
                  Starting Tournament...
                </span>
              ) : (
                "Start Tournament"
              )}
            </button>
          </div>
        </div>
      );
  };

  return (
    <div className="space-y-6">
      {/* Start Tournament Button */}
      {renderStartTournamentButton()}

      {/* Tournament Bracket Display */}
      {hasTournamentMatches && (
        <TournamentBracketDisplay
          tournament={tournament}
          participants={participants}
          currentUserId={user?.id}
          room={room}
        />
      )}

      {/* Tournament Progress */}
      {renderProgress()}

      {/* Score Submission */}
      {renderScoreSubmission()}
    </div>
  );
};
