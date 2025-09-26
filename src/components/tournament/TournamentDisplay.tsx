import React, { useEffect, useState } from "react";
import { useTournament } from "@/hooks/tournament";
import { MultiplayerTournament } from "./MultiplayerTournament";
import { HighscoreTournament } from "./HighscoreTournament";
import type { GameRoom } from "@/types/gameroom";
import { logger } from "@/utils/logger";

interface TournamentDisplayProps {
  room: GameRoom;
  onTournamentComplete?: () => void;
}

export const TournamentDisplay: React.FC<TournamentDisplayProps> = ({
  room,
  onTournamentComplete,
}) => {
  const {
    currentTournament,
    tournamentParticipants,
    tournamentStats,
    activeMatch,
    loading,
    starting,
    completing,
    fetchTournamentData,
    subscribeToTournamentUpdates,
    unsubscribeFromTournamentUpdates,
    validateTournamentStart,
    startTournament,
  } = useTournament();

  const [canStartTournament, setCanStartTournament] = useState(false);
  const [startValidation, setStartValidation] = useState<{
    canStart: boolean;
    reason?: string;
  } | null>(null);

  // Determine tournament mode from room data
  const tournamentMode = room.play_mode || "multiplayer";
  const isHighscoreTournament = tournamentMode === "single";

  // Fetch tournament data when component mounts
  useEffect(() => {
    if (room.id) {
      fetchTournamentData(room.id);
      subscribeToTournamentUpdates(room.id);
      logger.info("Current Tournament:", currentTournament);
    }

    return () => {
      unsubscribeFromTournamentUpdates();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room.id]); // Only depend on room.id to prevent infinite loops

  // Validate tournament start capability
  useEffect(() => {
    const validateStart = async () => {
      if (room.id) {
        try {
          const validation = await validateTournamentStart(room.id);
          setStartValidation(validation);
          setCanStartTournament(validation.canStart);
        } catch (error) {
          logger.error("Error validating tournament start:", error);
          setCanStartTournament(false);
        }
      }
    };
    validateStart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room.id, tournamentParticipants.length]); // Remove validateTournamentStart to prevent infinite loops

  // Handle tournament start
  const handleStartTournament = async () => {
    if (!room.id) return;

    try {
      await startTournament(room.id);
    } catch (error) {
      console.error("Error starting tournament:", error);
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground font-cyber">
            Loading tournament...
          </p>
        </div>
      </div>
    );
  }

  // Show tournament not created state
  if (
    !currentTournament &&
    room.mode === "tournament" &&
    currentTournament &&
    currentTournament.rounds.length === 0
  ) {
    return (
      <div className="bg-gradient-to-br from-card to-secondary border border-primary/20 rounded-xl p-6">
        <div className="text-center">
          <div className="text-4xl mb-4">🏆</div>
          <h3 className="text-xl font-cyber font-bold text-primary mb-2">
            Tournament Not Started
          </h3>
          {/* <p className="text-muted-foreground mb-4">
            This room is configured for tournaments but no tournament has been
            created yet.
          </p> */}

          {/* {!canStartTournament && startValidation && (
            <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-4 mb-4">
              <p className="text-yellow-400 font-cyber text-sm">
                ⚠️ {startValidation.reason}
              </p>
            </div>
          )} */}

          <button
            onClick={handleStartTournament}
            disabled={starting}
            className="bg-gradient-to-r from-primary to-accent text-background font-cyber font-bold px-6 py-3 rounded-xl hover:scale-105 transition-all cyber-button shadow-lg hover:shadow-primary/50 disabled:opacity-50 disabled:hover:scale-100"
          >
            {starting ? (
              <span className="flex items-center gap-2">
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
  }

  // Show tournament in progress
  if (currentTournament && tournamentStats) {
    return (
      <div className="space-y-6">
        {/* Tournament Header */}
        <div className="bg-gradient-to-br from-card to-secondary border border-primary/20 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="text-3xl">🏆</div>
              <div>
                <h2 className="text-xl font-cyber font-bold text-primary">
                  {isHighscoreTournament
                    ? "Highscore Tournament"
                    : "Multiplayer Tournament"}
                </h2>
                <p className="text-muted-foreground font-cyber text-sm">
                  {room.elimination_type
                    ? `${
                        room.elimination_type.charAt(0).toUpperCase() +
                        room.elimination_type.slice(1)
                      } Elimination`
                    : "Tournament"}
                </p>
              </div>
            </div>

            <div className="text-right">
              <div className="text-2xl font-cyber font-bold text-accent">
                {tournamentStats.currentRound}/{tournamentStats.totalRounds}
              </div>
              <div className="text-xs text-muted-foreground">Round</div>
            </div>
          </div>

          {/* Tournament Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-lg font-cyber font-bold text-primary">
                {tournamentStats.totalParticipants}
              </div>
              <div className="text-xs text-muted-foreground">Participants</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-cyber font-bold text-accent">
                {tournamentStats.completedMatches}
              </div>
              <div className="text-xs text-muted-foreground">Matches Done</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-cyber font-bold text-green-400">
                {tournamentStats.totalMatches}
              </div>
              <div className="text-xs text-muted-foreground">Total Matches</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-cyber font-bold text-yellow-400">
                {tournamentStats.isComplete ? "Complete" : "Active"}
              </div>
              <div className="text-xs text-muted-foreground">Status</div>
            </div>
          </div>
        </div>

        {/* Tournament Content */}
        {isHighscoreTournament ? (
          <HighscoreTournament
            room={room}
            tournament={currentTournament}
            participants={tournamentParticipants}
            stats={tournamentStats}
          />
        ) : (
          <MultiplayerTournament
            room={room}
            tournament={currentTournament}
            participants={tournamentParticipants}
            stats={tournamentStats}
          />
        )}
      </div>
    );
  }
};
