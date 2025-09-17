import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  Clock,
  Play,
  Pause,
  Square,
  AlertTriangle,
  Timer,
  Hourglass,
} from "lucide-react";

interface TournamentTimerProps {
  matchId: string;
  initialTimeMinutes?: number;
  status: "pending" | "active" | "completed" | "timeout";
  onTimeout?: (matchId: string) => void;
  onStart?: (matchId: string) => void;
  onPause?: (matchId: string) => void;
  onResume?: (matchId: string) => void;
  isAdmin?: boolean;
}

const TournamentTimer: React.FC<TournamentTimerProps> = ({
  matchId,
  initialTimeMinutes = 30,
  status,
  onTimeout,
  onStart,
  onPause,
  onResume,
  isAdmin = false,
}) => {
  const [timeRemaining, setTimeRemaining] = useState(initialTimeMinutes * 60);
  const [isRunning, setIsRunning] = useState(status === "active");
  const [isPaused, setIsPaused] = useState(false);
  const [hasWarned, setHasWarned] = useState(false);

  const totalTime = initialTimeMinutes * 60;
  const warningThreshold = Math.min(300, totalTime * 0.2); // 5 minutes or 20% of total time

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRunning && !isPaused && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining((prev) => {
          const newTime = prev - 1;

          // Warning at threshold
          if (newTime <= warningThreshold && !hasWarned) {
            setHasWarned(true);
          }

          // Auto-timeout when time reaches 0
          if (newTime <= 0) {
            setIsRunning(false);
            if (onTimeout) {
              onTimeout(matchId);
            }
            return 0;
          }

          return newTime;
        });
      }, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [
    isRunning,
    isPaused,
    timeRemaining,
    warningThreshold,
    hasWarned,
    matchId,
    onTimeout,
  ]);

  // Update running state based on status
  useEffect(() => {
    setIsRunning(status === "active");
    if (status === "completed" || status === "timeout") {
      setIsRunning(false);
    }
  }, [status]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds
      .toString()
      .padStart(2, "0")}`;
  };

  const getProgressValue = () => {
    return ((totalTime - timeRemaining) / totalTime) * 100;
  };

  const getTimeStatus = () => {
    if (timeRemaining === 0) return "timeout";
    if (timeRemaining <= warningThreshold) return "warning";
    if (timeRemaining <= totalTime * 0.5) return "halfway";
    return "normal";
  };

  const getStatusColor = () => {
    const timeStatus = getTimeStatus();
    switch (timeStatus) {
      case "timeout":
        return "text-red-600";
      case "warning":
        return "text-orange-600";
      case "halfway":
        return "text-yellow-600";
      default:
        return "text-green-600";
    }
  };

  const getProgressColor = () => {
    const timeStatus = getTimeStatus();
    switch (timeStatus) {
      case "timeout":
        return "bg-red-500";
      case "warning":
        return "bg-orange-500";
      case "halfway":
        return "bg-yellow-500";
      default:
        return "bg-green-500";
    }
  };

  const getBadgeVariant = () => {
    if (status === "completed") return "default";
    if (status === "timeout") return "destructive";
    if (isPaused) return "secondary";
    if (isRunning) return "outline";
    return "outline";
  };

  const getBadgeText = () => {
    if (status === "completed") return "Completed";
    if (status === "timeout") return "Timed Out";
    if (isPaused) return "Paused";
    if (isRunning) return "Active";
    return "Pending";
  };

  const handleStart = () => {
    if (onStart) {
      onStart(matchId);
    }
    setIsRunning(true);
    setIsPaused(false);
  };

  const handlePause = () => {
    if (onPause) {
      onPause(matchId);
    }
    setIsPaused(true);
  };

  const handleResume = () => {
    if (onResume) {
      onResume(matchId);
    }
    setIsPaused(false);
  };

  const handleStop = () => {
    setIsRunning(false);
    setIsPaused(false);
    if (onTimeout) {
      onTimeout(matchId);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Timer className="h-5 w-5" />
            Match Timer
          </CardTitle>
          <Badge variant={getBadgeVariant()}>{getBadgeText()}</Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Time Display */}
        <div className="text-center">
          <div className={`text-4xl font-mono font-bold ${getStatusColor()}`}>
            {formatTime(timeRemaining)}
          </div>
          <div className="text-sm text-muted-foreground mt-1">
            {timeRemaining === 0 ? "Time's up!" : "Time remaining"}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Progress</span>
            <span>{Math.round(getProgressValue())}%</span>
          </div>
          <div className="relative">
            <Progress value={getProgressValue()} className="h-3" />
            <div
              className={`absolute inset-0 h-3 rounded-full transition-all duration-300 ${getProgressColor()}`}
              style={{ width: `${getProgressValue()}%` }}
            />
          </div>
        </div>

        {/* Warning Messages */}
        {timeRemaining <= warningThreshold && timeRemaining > 0 && (
          <div className="flex items-center gap-2 p-2 bg-orange-50 border border-orange-200 rounded-lg">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <span className="text-sm text-orange-800">
              {timeRemaining <= 60
                ? "Less than 1 minute remaining!"
                : "Time running low!"}
            </span>
          </div>
        )}

        {timeRemaining === 0 && (
          <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded-lg">
            <Hourglass className="h-4 w-4 text-red-600" />
            <span className="text-sm text-red-800">Match has timed out</span>
          </div>
        )}

        {/* Admin Controls */}
        {isAdmin && (
          <div className="flex gap-2">
            {status === "pending" && (
              <Button onClick={handleStart} size="sm" className="flex-1">
                <Play className="h-4 w-4 mr-1" />
                Start
              </Button>
            )}

            {isRunning && !isPaused && (
              <Button
                onClick={handlePause}
                size="sm"
                variant="outline"
                className="flex-1"
              >
                <Pause className="h-4 w-4 mr-1" />
                Pause
              </Button>
            )}

            {isPaused && (
              <Button onClick={handleResume} size="sm" className="flex-1">
                <Play className="h-4 w-4 mr-1" />
                Resume
              </Button>
            )}

            {(isRunning || isPaused) && (
              <Button
                onClick={handleStop}
                size="sm"
                variant="destructive"
                className="flex-1"
              >
                <Square className="h-4 w-4 mr-1" />
                Stop
              </Button>
            )}
          </div>
        )}

        {/* Time Information */}
        <div className="text-xs text-muted-foreground space-y-1">
          <div className="flex justify-between">
            <span>Total time:</span>
            <span>{formatTime(totalTime)}</span>
          </div>
          <div className="flex justify-between">
            <span>Elapsed:</span>
            <span>{formatTime(totalTime - timeRemaining)}</span>
          </div>
          {timeRemaining > 0 && (
            <div className="flex justify-between">
              <span>Remaining:</span>
              <span className={getStatusColor()}>
                {formatTime(timeRemaining)}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TournamentTimer;

