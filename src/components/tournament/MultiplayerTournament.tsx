import React, { useCallback, useState, useMemo } from "react";
import { useTournament } from "@/hooks/tournament";
import { useAuth } from "@/contexts/AuthContext";
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

interface MultiplayerTournamentProps {
  room: GameRoom;
  tournament: TournamentBracket;
  participants: TournamentParticipant[];
  stats: TournamentStats;
}

export const MultiplayerTournament: React.FC<MultiplayerTournamentProps> = ({
  room,
  tournament,
  participants,
  stats,
}) => {
  const { completeMatch, completing, startTournament, starting } =
    useTournament();
  const { user } = useAuth();
  const [selectedWinner, setSelectedWinner] = useState<string | null>(null);

  // Get participant by ID
  const getParticipant = (id: string | null) => {
    if (!id) return null;
    return participants.find((p) => p.user_id === id);
  };

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
          match.status === "active" &&
          (match.player1_id === user.id ||
            match.player2_id === user.id ||
            match.player3_id === user.id ||
            match.player4_id === user.id)
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

  // Handle match completion
  const handleCompleteMatch = async (
    match: TournamentMatch,
    winnerId: string
  ) => {
    try {
      await completeMatch(match.id, winnerId);
      setSelectedWinner(null);
    } catch (error) {
      console.error("Error completing match:", error);
    }
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

  // Render match completion interface
  const renderMatchCompletion = () => {
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

    // If user has an active match, show match completion interface
    const match = currentUserActiveMatch;
    const player1 = getParticipant(match.player1_id);
    const player2 = getParticipant(match.player2_id);
    const player3 = getParticipant(match.player3_id);
    const player4 = getParticipant(match.player4_id);
    const players = [player1, player2, player3, player4].filter(Boolean);

    return (
      <div className="bg-gradient-to-br from-card to-secondary border border-primary/20 rounded-xl p-6">
        <h3 className="text-lg font-cyber font-bold text-primary mb-4">
          Complete Your Match
        </h3>

        <div className="space-y-3">
          {players.map((player, index) => {
            if (!player) return null;

            return (
              <div
                key={player.id}
                className="flex items-center justify-between p-3 rounded-lg bg-primary/10 border border-primary/20"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center text-background font-cyber font-bold text-sm">
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-cyber font-bold text-foreground">
                      {player.user?.display_name ||
                        player.user?.username ||
                        "Unknown Player"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Seed #{player.seed}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedWinner(player.user_id)}
                  className={`px-3 py-1 rounded-lg text-xs font-cyber font-bold transition-all ${
                    selectedWinner === player.user_id
                      ? "bg-accent text-background"
                      : "bg-primary/20 text-primary hover:bg-primary/30"
                  }`}
                >
                  Select Winner
                </button>
              </div>
            );
          })}
        </div>

        {selectedWinner && (
          <div className="mt-4 pt-4 border-t border-primary/20">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Complete match with winner:{" "}
                <span className="font-cyber font-bold text-primary">
                  {getParticipant(selectedWinner)?.user?.display_name ||
                    getParticipant(selectedWinner)?.user?.username}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedWinner(null)}
                  className="px-3 py-1 bg-secondary text-foreground text-xs font-cyber rounded-lg hover:bg-secondary/80 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleCompleteMatch(match, selectedWinner!)}
                  disabled={completing}
                  className="px-4 py-1 bg-gradient-to-r from-green-500 to-green-600 text-white text-xs font-cyber font-bold rounded-lg hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100"
                >
                  {completing ? "Completing..." : "Complete Match"}
                </button>
              </div>
            </div>
          </div>
        )}
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

      {/* Match Completion Interface */}
      {renderMatchCompletion()}

      {/* Tournament Complete */}
      {stats.isComplete && stats.winner && (
        <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 border border-green-500/30 rounded-xl p-6">
          <div className="text-center">
            <div className="text-4xl mb-4">🎉</div>
            <h3 className="text-xl font-cyber font-bold text-green-400 mb-2">
              Tournament Complete!
            </h3>
            <p className="text-green-300 mb-4">
              Winner:{" "}
              <span className="font-cyber font-bold">
                {getParticipant(stats.winner!)?.user?.display_name ||
                  getParticipant(stats.winner!)?.user?.username}
              </span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
