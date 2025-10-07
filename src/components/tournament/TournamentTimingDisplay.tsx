import React, { useState, useEffect } from "react";
import { tournamentTimingService } from "@/services/tournamentTimingService";

interface TournamentTimingDisplayProps {
  roomId: string;
  currentMatchId?: string;
  currentRound: number;
  totalRounds: number;
}

export const TournamentTimingDisplay: React.FC<
  TournamentTimingDisplayProps
> = ({ roomId, currentMatchId, currentRound, totalRounds }) => {
  const [matchTimeRemaining, setMatchTimeRemaining] = useState<number | null>(
    null
  );
  const [roundTimeRemaining, setRoundTimeRemaining] = useState<number | null>(
    null
  );
  const [isActive, setIsActive] = useState(false);

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

  // Update timing display
  useEffect(() => {
    const updateTiming = async () => {
      try {
        // Get match remaining time
        if (currentMatchId) {
          const matchTime = await tournamentTimingService.getMatchRemainingTime(
            currentMatchId
          );
          setMatchTimeRemaining(matchTime);
        }

        // Get round remaining time
        const roundTime = await tournamentTimingService.getRoundRemainingTime(
          roomId
        );
        setRoundTimeRemaining(roundTime);

        // Check if timing is active
        const activeTimers = tournamentTimingService.getActiveTimers();
        setIsActive(
          activeTimers.matchTimers.length > 0 ||
            activeTimers.roundTimers.length > 0
        );
      } catch (error) {
        console.error("Error updating timing:", error);
      }
    };

    // Update immediately
    updateTiming();

    // Update every second
    const interval = setInterval(updateTiming, 1000);

    return () => clearInterval(interval);
  }, [roomId, currentMatchId]);

  if (!isActive) {
    return (
      <div className="bg-gradient-to-br from-card to-secondary border border-primary/20 rounded-xl p-4">
        <div className="text-center">
          <div className="text-2xl mb-2">⏰</div>
          <h3 className="text-lg font-cyber font-bold text-primary mb-1">
            Tournament Timing
          </h3>
          <p className="text-sm text-muted-foreground">
            Timing system is not active
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-card to-secondary border border-primary/20 rounded-xl p-4">
      <div className="mb-4">
        <h3 className="text-lg font-cyber font-bold text-primary mb-2">
          Tournament Timing
        </h3>
        <div className="text-sm text-muted-foreground">
          Round {currentRound} of {totalRounds}
        </div>
      </div>

      <div className="space-y-4">
        {/* Round Timer */}
        {roundTimeRemaining !== null && (
          <div className="bg-secondary/50 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-cyber font-bold text-primary">
                Round Timer
              </span>
              <div
                className={`text-lg font-cyber font-bold ${getTimeColor(
                  roundTimeRemaining
                )}`}
              >
                {formatTime(roundTimeRemaining)}
              </div>
            </div>
            <div className="w-full bg-secondary/30 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-1000 ${
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
            <div className="text-xs text-muted-foreground mt-1">
              Round will auto-advance when timer expires
            </div>
          </div>
        )}

        {/* Match Timer */}
        {matchTimeRemaining !== null && (
          <div className="bg-secondary/50 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-cyber font-bold text-primary">
                Match Timer
              </span>
              <div
                className={`text-lg font-cyber font-bold ${getTimeColor(
                  matchTimeRemaining
                )}`}
              >
                {formatTime(matchTimeRemaining)}
              </div>
            </div>
            <div className="w-full bg-secondary/30 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-1000 ${
                  matchTimeRemaining <= 60
                    ? "bg-gradient-to-r from-red-500 to-red-600"
                    : matchTimeRemaining <= 300
                    ? "bg-gradient-to-r from-yellow-500 to-yellow-600"
                    : "bg-gradient-to-r from-green-500 to-green-600"
                }`}
                style={{
                  width: `${Math.max(
                    0,
                    Math.min(100, (matchTimeRemaining / 1800) * 100)
                  )}%`, // Assuming 30 minutes max
                }}
              />
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Match will timeout when timer expires
            </div>
          </div>
        )}

        {/* Timing Status */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Timing Status</span>
          <span className="text-green-400 font-cyber font-bold">Active</span>
        </div>
      </div>
    </div>
  );
};
