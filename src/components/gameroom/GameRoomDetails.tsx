import { useState, useEffect, useCallback } from "react";
import { useGameRoom } from "@/hooks/gameroom";
import { GameRoom, GameRoomParticipant } from "@/types/gameroom";
import { useAuth } from "@/hooks/auth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { TournamentDisplay } from "@/components/tournament";
import { AdminPanel } from "@/components/gameroom/AdminPanel";
import { ApprovalSection } from "@/components/gameroom/ApprovalSection";
import { logger } from "@/utils";
import { gameRoomService } from "@/services/gameRoomService";
import { useTournament } from "@/hooks/tournament";

const GameRoomDetails = ({ roomId, onBack, onJoinRoom }) => {
  const {
    getRoomDetails,
    leaveRoom,
    cancelRoom,
    playGame,
    completeGame,
    initiateRoomCompletion,
    getSignaturesAndStatus,
  } = useGameRoom();
  const { fetchTournamentData } = useTournament();
  const { user } = useAuth();
  const { toast } = useToast();
  const [room, setRoom] = useState<GameRoom | null>(null);
  const [participants, setParticipants] = useState<GameRoomParticipant[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isLaunchingGame, setIsLaunchingGame] = useState(false);
  const [winners, setWinners] = useState([]);
  const [isCompletingSpecialRoom, setIsCompletingSpecialRoom] = useState(false);
  const [showCompletionConfirmation, setShowCompletionConfirmation] =
    useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "tournament">(
    "tournament"
  );
  const [signaturesAndStatus, setSignaturesAndStatus] = useState<{
    collected: number;
    required: number;
    hasCreatorSignature: boolean;
    hasParticipantSignature: boolean;
    signers: {
      id: string;
      participant_id: string | null;
      room_id: string | null;
      created_at: string;
    }[];
  } | null>(null);
  const [completionInitiated, setCompletionInitiated] = useState(false);

  // Function to get signature status and signers
  const getSignatureStatus = useCallback(async () => {
    const sigStatus = await getSignaturesAndStatus(roomId);
    setSignaturesAndStatus(sigStatus);
  }, [roomId, getSignaturesAndStatus]);

  // Enhanced loadRoomData function
  const loadRoomData = useCallback(
    async (showLoader = false) => {
      if (showLoader) {
        setLoading(true);
      }
      try {
        const [roomData, participantsData] = await Promise.all([
          getRoomDetails(roomId),
          gameRoomService.getRoomParticipants(roomId),
          fetchTournamentData(roomId, true),
        ]);

        if (roomData) {
          setRoom(roomData);

          // Check if completion has been initiated (admin_has_approved is not null means initiation happened)
          setCompletionInitiated(!!roomData.start_signing);

          // If room is completed, determine winners for display
          if (roomData.status === "completed") {
            const activeParticipants = participantsData || [];
            const sortedParticipants = activeParticipants.sort(
              (a, b) => (b.score || 0) - (a.score || 0)
            );
            const winnersWithEarnings = sortedParticipants
              .filter((p) => p.final_position && p.earnings > 0)
              .sort((a, b) => a.final_position - b.final_position);
            setWinners(winnersWithEarnings);
          }
        }
        if (participantsData) {
          setParticipants(participantsData);
        }

        // Load signature status for special rooms
        if (roomData?.is_special) {
          try {
            await getSignatureStatus();
          } catch (error) {
            logger.error("Error loading signature status:", error);
          }
        }
        setLoading(false);
      } catch (error) {
        logger.error("Error loading room data:", error);
        toast({
          title: "Error",
          description: "Failed to load room details",
          variant: "destructive",
        });
      } finally {
        if (showLoader) {
          setLoading(false);
        }
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [getRoomDetails, roomId, fetchTournamentData, getSignatureStatus]
  );
  // Function to check if room should auto-complete
  const checkForAutoCompletion = useCallback(async () => {
    if (!room) return;

    const now = new Date();
    const endTime = new Date(room.end_time);

    // Special rooms should not auto-complete - they require manual completion
    if (room.is_special) {
      return;
    }

    // If current time has passed end time and room is still ongoing/waiting
    if (
      now >= endTime &&
      (room.status === "ongoing" || room.status === "waiting")
    ) {
      logger.info("Room should auto-complete, refreshing data...");
      // Refresh room data to get the updated status after auto-completion
      await loadRoomData(false);
    }
  }, [loadRoomData, room]);

  useEffect(() => {
    loadRoomData();

    // Update current time every second for accurate countdown
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]); // Include loadRoomData as dependency

  // Check for auto-completion more frequently
  useEffect(() => {
    if (!room) return;

    const autoCompleteCheckInterval = setInterval(() => {
      checkForAutoCompletion();
    }, 10000); // Check every 10 seconds

    return () => clearInterval(autoCompleteCheckInterval);
  }, [checkForAutoCompletion, room]); // Include room as dependency

  // Real-time subscription for room updates
  useEffect(() => {
    if (!roomId) return;

    const subscription = supabase
      .channel(`room_${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "game_rooms",
          filter: `id=eq.${roomId}`,
        },
        () => {
          logger.info("Room updated, refreshing data...");
          loadRoomData(false);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "game_room_participants",
          filter: `room_id=eq.${roomId}`,
        },
        () => {
          logger.info("Participants updated, refreshing data...");
          loadRoomData(false);
        }
      )

      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [roomId, loadRoomData]); // Include loadRoomData as dependency

  // Determine actual room status based on time
  const getActualStatus = useCallback(() => {
    if (!room) return "waiting";

    const now = currentTime;
    const startTime = new Date(room.start_time);
    const endTime = new Date(room.end_time);

    // If room was manually cancelled or completed
    if (room.status === "cancelled" || room.status === "completed") {
      return room.status;
    }

    // Check time-based status
    if (now < startTime) {
      return "waiting";
    } else if (now >= startTime && now < endTime) {
      return "ongoing";
    } else if (now >= endTime && !room.is_special) {
      return "completed";
    }

    return room.status;
  }, [room, currentTime]);

  // Updated game interaction handler
  const handlePlayGame = async () => {
    try {
      setIsLaunchingGame(true);
      await playGame(roomId);

      // Refresh room data after game launch
      setTimeout(() => {
        loadRoomData(false);
      }, 1000);
    } catch (error) {
      logger.error("Error launching game:", error);
    } finally {
      setIsLaunchingGame(false);
    }
  };

  const handleLeaveRoom = async () => {
    try {
      await leaveRoom(roomId);
      toast({
        title: "Success",
        description: "You have left the room",
      });
      onBack();
    } catch (error) {
      logger.error("Error leaving room:", error);
      toast({
        title: "Error",
        description: "Failed to leave room",
        variant: "destructive",
      });
    }
  };

  const handleCancelRoom = async () => {
    try {
      await cancelRoom(roomId);
      toast({
        title: "Success",
        description: "Room cancelled and all participants fully refunded",
      });
      onBack();
    } catch (error) {
      logger.error("Error cancelling room:", error);
      toast({
        title: "Error",
        description: "Failed to cancel room",
        variant: "destructive",
      });
    }
  };

  const confirmSpecialRoomCompletion = async () => {
    setIsCompletingSpecialRoom(true);
    try {
      await completeGame(roomId);

      toast({
        title: "Success",
        description: "Special room completed and prizes distributed!",
      });

      setShowCompletionConfirmation(false);
      // Refresh room data
      await loadRoomData(false);
    } catch (error) {
      logger.error("Error completing special room:", error);
      toast({
        title: "Error",
        description: "Failed to complete special room",
        variant: "destructive",
      });
    } finally {
      setIsCompletingSpecialRoom(false);
    }
  };

  // Handler for initiating room completion
  const handleInitiateCompletion = async () => {
    try {
      await initiateRoomCompletion(roomId);
      await loadRoomData(false);
      await getSignatureStatus();
    } catch (error) {
      logger.error("Error initiating completion:", error);
    }
  };

  // Handler for participants update from AdminPanel
  const handleParticipantsUpdate = async () => {
    await loadRoomData(false);
  };

  // Handler for approval submission from ApprovalSection
  const handleApprovalSubmitted = async () => {
    await loadRoomData(false);
    await getSignatureStatus();
  };

  // Helper functions
  const formatDateTime = (date: string | number | Date) => {
    return new Date(date).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTimeRemaining = (startTime: string | number | Date) => {
    const start = new Date(startTime);
    const diff = start.getTime() - currentTime.getTime();

    if (diff <= 0) return "Game can start now!";

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    if (hours > 0) return `Starts in ${hours}h ${minutes}m`;
    if (minutes > 0) return `Starts in ${minutes}m ${seconds}s`;
    return `Starts in ${seconds}s`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "waiting":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "starting":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "ongoing":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "completed":
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
      case "cancelled":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const getWinnerSplitDisplay = (rule: string | number) => {
    const splits = {
      winner_takes_all: "Winner Takes All (100%)",
      top_2: "Top 2 Players (60% / 40%)",
      top_3: "Top 3 Players (50% / 30% / 20%)",
      top_4: "Top 4 Players (40% / 30% / 20% / 10%)",
      top_5: "Top 5 Players",
      top_10: "Top 10 Players",
    };
    return splits[rule] || rule;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Room not found</p>
        <button onClick={onBack} className="mt-4 text-primary hover:underline">
          ← Back to Rooms
        </button>
      </div>
    );
  }

  const isCreator = room.creator_id === user?.id;
  const isParticipant = participants.some(
    (p) => p.user_id === user?.id && p.is_active
  );
  const actualStatus = getActualStatus();
  const hasReachedStartTime = currentTime >= new Date(room.start_time);
  const hasEnoughPlayers = room.current_players >= room.min_players_to_start;
  const canPlayGame = isParticipant && actualStatus === "ongoing";
  const canCancelRoom =
    isCreator &&
    actualStatus === "waiting" &&
    currentTime < new Date(room.start_time);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
        >
          <span className="text-2xl">←</span>
          <span className="font-cyber">Back to Rooms</span>
        </button>
        <div className="flex items-center gap-4">
          {room?.mode === "tournament" && (
            <div className="flex bg-secondary/30 rounded-lg p-1">
              <button
                onClick={() => setActiveTab("tournament")}
                className={`px-4 py-2 rounded-md font-cyber font-bold text-sm transition-all ${
                  activeTab === "tournament"
                    ? "bg-primary text-background"
                    : "text-foreground hover:bg-secondary/50"
                }`}
              >
                🏆 Tournament
              </button>
            </div>
          )}
          <div
            className={`px-4 py-2 rounded-full text-sm font-bold font-cyber border ${getStatusColor(
              actualStatus
            )}`}
          >
            {actualStatus.toUpperCase()}
          </div>
        </div>
      </div>

      {/* Room Info Card */}
      <div className="bg-gradient-to-br from-card to-secondary/20 border-2 border-primary/30 rounded-2xl p-8 cyber-border">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="font-cyber text-3xl font-bold text-primary glow-text mb-2">
              {room.name}
            </h1>
            <p className="text-muted-foreground font-cyber">
              Game:{" "}
              <span className="text-foreground">
                {room.is_special
                  ? room.game_name || "Unknown Game"
                  : room.game?.name || "Unknown Game"}
              </span>
            </p>
            {room.game?.game_url && (
              <p className="text-xs text-muted-foreground font-cyber mt-1">
                Game URL: {room.game.game_url}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-3">
            {room.is_private && (isParticipant || isCreator) && (
              <div className="bg-purple-500/20 border border-purple-500/30 rounded-lg px-4 py-2">
                <p className="text-xs font-cyber text-purple-400">ROOM CODE</p>
                <p className="font-cyber text-xl text-purple-300">
                  {room.room_code}
                </p>
              </div>
            )}
            {room.is_special && (
              <div className="bg-purple-500/20 border border-purple-500/30 rounded-lg px-4 py-2">
                <p className="text-xs font-cyber text-purple-400">
                  SPECIAL ROOM
                </p>
                <p className="font-cyber text-sm text-purple-300">
                  Custom Game Configuration
                </p>
              </div>
            )}
            {room.on_chain_create_digest && (
              <button
                onClick={() =>
                  window.open(
                    `https://suiexplorer.com/txblock/${room.on_chain_create_digest}`,
                    "_blank"
                  )
                }
                className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 rounded-lg px-4 py-2 hover:from-cyan-500/30 hover:to-blue-500/30 transition-all duration-200 group"
              >
                <p className="text-xs font-cyber text-cyan-400 mb-1">
                  ON-CHAIN
                </p>
                <p className="font-cyber text-sm text-cyan-300 group-hover:text-cyan-200 transition-colors">
                  View Transaction
                </p>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-xs text-cyan-400">🔗</span>
                  <span className="text-xs text-cyan-400 font-mono">
                    {room.on_chain_create_digest.slice(0, 8)}...
                  </span>
                </div>
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Prize Pool */}
          <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-xl p-4">
            <p className="text-sm font-cyber text-green-400 mb-1">Prize Pool</p>
            <p className="text-2xl font-cyber font-bold text-white glow-text-subtle">
              {room.total_prize_pool} {room.currency}
            </p>
            {room.is_sponsored && (
              <p className="text-xs font-cyber text-green-300 mt-1">
                Sponsored
              </p>
            )}
            {actualStatus === "completed" &&
              room.platform_fee_collected > 0 && (
                <p className="text-xs font-cyber text-green-300 mt-1">
                  Platform Fee: {room.platform_fee_collected} {room.currency}
                </p>
              )}
          </div>

          {/* Players */}
          <div className="bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-blue-500/30 rounded-xl p-4">
            <p className="text-sm font-cyber text-blue-400 mb-1">Players</p>
            <p className="text-2xl font-cyber font-bold text-white">
              {room.current_players} / {room.max_players}
            </p>
            <p className="text-xs font-cyber text-blue-300 mt-1">
              Min to start: {room.min_players_to_start}
            </p>
          </div>

          {/* Entry Fee */}
          <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-xl p-4">
            <p className="text-sm font-cyber text-yellow-400 mb-1">Entry Fee</p>
            <p className="text-2xl font-cyber font-bold text-white">
              {room.is_sponsored
                ? "FREE"
                : `${room.entry_fee} ${room.currency}`}
            </p>
            <p className="text-xs font-cyber text-yellow-300 mt-1">
              {room.is_sponsored ? "Sponsored Entry" : "Per Player"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <div className="bg-secondary/30 rounded-lg p-4 border border-primary/20">
            <p className="text-sm font-cyber text-muted-foreground mb-1">
              Winner Split
            </p>
            <p className="font-cyber text-foreground">
              {getWinnerSplitDisplay(room.winner_split_rule)}
            </p>
          </div>
          <div className="bg-secondary/30 rounded-lg p-4 border border-primary/20">
            <p className="text-sm font-cyber text-muted-foreground mb-1">
              Host
            </p>
            <p className="font-cyber text-foreground">
              {room.creator?.username || "Unknown"}
            </p>
          </div>
          <div className="bg-secondary/30 rounded-lg p-4 border border-primary/20">
            <p className="text-sm font-cyber text-muted-foreground mb-1">
              Start Time
            </p>
            <p className="font-cyber text-foreground">
              {formatDateTime(room.start_time)}
            </p>
            {actualStatus === "waiting" && (
              <p className="text-xs font-cyber text-accent mt-1">
                {getTimeRemaining(room.start_time)}
              </p>
            )}
          </div>
          <div className="bg-secondary/30 rounded-lg p-4 border border-primary/20">
            <p className="text-sm font-cyber text-muted-foreground mb-1">
              End Time
            </p>
            <p className="font-cyber text-foreground">
              {formatDateTime(room.end_time)}
            </p>
            {room.actual_end_time && (
              <p className="text-xs font-cyber text-green-400 mt-1">
                Completed: {formatDateTime(room.actual_end_time)}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Winners Section - Only show if game is completed and there are winners */}
      {actualStatus === "completed" && winners.length > 0 && (
        <div className="bg-gradient-to-br from-card to-secondary/20 border-2 border-primary/30 rounded-2xl p-6 cyber-border">
          <h2 className="font-cyber text-xl font-bold text-primary mb-4">
            🏆 Winners
          </h2>
          <div className="space-y-3">
            {winners.map((winner, index) => (
              <div
                key={winner.id}
                className={`flex items-center justify-between rounded-lg p-4 border ${
                  winner.final_position === 1
                    ? "bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border-yellow-500/30"
                    : winner.final_position === 2
                    ? "bg-gradient-to-r from-gray-300/20 to-gray-400/20 border-gray-400/30"
                    : winner.final_position === 3
                    ? "bg-gradient-to-r from-amber-600/20 to-orange-600/20 border-amber-600/30"
                    : "bg-secondary/30 border-primary/20"
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="text-2xl">
                    {winner.final_position === 1 && "🥇"}
                    {winner.final_position === 2 && "🥈"}
                    {winner.final_position === 3 && "🥉"}
                    {winner.final_position > 3 && `#${winner.final_position}`}
                  </div>
                  <div>
                    <p className="font-cyber text-foreground font-bold">
                      {winner.user?.username || "Unknown Player"}
                      {winner.user_id === user?.id && (
                        <span className="text-xs text-accent ml-2">(You)</span>
                      )}
                    </p>
                    <p className="text-sm font-cyber text-muted-foreground">
                      Score: {winner.score || 0} points
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-cyber text-lg font-bold text-green-400">
                    +{winner.earnings} {room.currency}
                  </p>
                  <p className="text-xs font-cyber text-muted-foreground">
                    Position {winner.final_position}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Participants */}
      <div className="bg-gradient-to-br from-card to-secondary/20 border-2 border-primary/30 rounded-2xl p-6 cyber-border">
        <h2 className="font-cyber text-xl font-bold text-primary mb-4">
          Participants
        </h2>
        <div className="space-y-2">
          {participants.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              No participants yet
            </p>
          ) : (
            participants
              .sort((a, b) => (b.score || 0) - (a.score || 0)) // Sort by score descending
              .map((participant, index) => (
                <div
                  key={participant.id}
                  className="flex items-center justify-between bg-secondary/30 rounded-lg p-3 border border-primary/20"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-cyber text-lg text-primary">
                      #{index + 1}
                    </span>
                    <div>
                      <p className="font-cyber text-foreground">
                        {participant.user?.username || "Unknown Player"}
                        {participant.user_id === user?.id && (
                          <span className="text-xs text-accent ml-2">
                            (You)
                          </span>
                        )}
                        {participant.user_id === room.creator_id && (
                          <span className="text-xs text-yellow-400 ml-2">
                            (Host)
                          </span>
                        )}
                      </p>
                      <p className="text-xs font-cyber text-muted-foreground">
                        Joined:{" "}
                        {new Date(participant.joined_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  {(actualStatus === "ongoing" ||
                    actualStatus === "completed") && (
                    <div className="text-right">
                      <p className="font-cyber text-sm text-muted-foreground">
                        Score
                      </p>
                      <p className="font-cyber text-lg text-accent">
                        {participant.score || 0}
                      </p>
                      {actualStatus === "completed" &&
                        participant.earnings > 0 && (
                          <p className="text-xs font-cyber text-green-400">
                            Won: {participant.earnings} {room.currency}
                          </p>
                        )}
                    </div>
                  )}
                </div>
              ))
          )}
        </div>
      </div>

      {/* Special Room Admin Panel */}
      {room.is_special &&
        room.mode !== "tournament" &&
        isCreator &&
        actualStatus === "ongoing" && (
          <AdminPanel
            room={room}
            participants={participants}
            onParticipantsUpdate={handleParticipantsUpdate}
            onInitiateCompletion={handleInitiateCompletion}
            isCompletingRoom={isCompletingSpecialRoom}
            setShowCompletionConfirmation={setShowCompletionConfirmation}
          />
        )}

      {/* Approval Section for Special Rooms */}
      {room.is_special &&
        room.mode !== "tournament" &&
        (isCreator || isParticipant) &&
        actualStatus === "ongoing" && (
          <ApprovalSection
            room={room}
            participants={participants}
            signaturesAndStatus={signaturesAndStatus}
            onApprovalSubmitted={handleApprovalSubmitted}
            completionInitiated={completionInitiated}
          />
        )}

      {/* Action Buttons */}
      <div className="flex gap-4">
        {/* Play Game Button - Updated to use new tab functionality */}
        {canPlayGame && !room.is_special && room.mode !== "tournament" && (
          <button
            onClick={handlePlayGame}
            disabled={isLaunchingGame}
            className="flex-1 bg-gradient-to-r from-primary to-accent text-background font-cyber font-bold py-3 rounded-xl hover:scale-105 transition-all cyber-button shadow-lg hover:shadow-primary/50 disabled:opacity-50 disabled:hover:scale-100"
          >
            {isLaunchingGame ? (
              <span className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-background"></div>
                Launching Game...
              </span>
            ) : (
              "🎮 Play Game"
            )}
          </button>
        )}

        {/* Special Room Status */}
        {room.is_special && actualStatus === "ongoing" && (
          <div className="flex-1 bg-purple-600/20 border border-purple-500/30 text-purple-400 font-cyber font-bold py-3 rounded-xl text-center">
            ⭐ Special Room
          </div>
        )}

        {/* Special Room Past End Time */}
        {room.is_special &&
          actualStatus === "ongoing" &&
          currentTime >= new Date(room.end_time) && (
            <div className="flex-1 bg-orange-600/20 border border-orange-500/30 text-orange-400 font-cyber font-bold py-3 rounded-xl text-center">
              ⚠️ Special Room - Time expired, awaiting manual completion
            </div>
          )}

        {/* Waiting for players message */}
        {actualStatus === "waiting" &&
          hasReachedStartTime &&
          !hasEnoughPlayers && (
            <div className="flex-1 bg-yellow-600/20 border border-yellow-500/30 text-yellow-400 font-cyber font-bold py-3 rounded-xl text-center">
              ⏳ Waiting for minimum {room.min_players_to_start} players
              (Currently: {room.current_players})
            </div>
          )}

        {/* Waiting for start time */}
        {actualStatus === "waiting" &&
          !hasReachedStartTime &&
          isParticipant && (
            <div className="flex-1 bg-blue-600/20 border border-blue-500/30 text-blue-400 font-cyber font-bold py-3 rounded-xl text-center">
              ⏰ Game starts {getTimeRemaining(room.start_time)}
            </div>
          )}

        {/* Game Completed */}
        {actualStatus === "completed" && (
          <div className="flex-1 bg-gray-600/50 text-gray-300 font-cyber font-bold py-3 rounded-xl text-center">
            🏁 Game Completed - Prizes Distributed
          </div>
        )}

        {/* Game Cancelled */}
        {actualStatus === "cancelled" && (
          <div className="flex-1 bg-red-600/50 text-red-300 font-cyber font-bold py-3 rounded-xl text-center">
            ❌ Game Cancelled - Participants Refunded
          </div>
        )}

        {/* Leave Room - Only before game starts */}
        {actualStatus === "waiting" &&
          isParticipant &&
          !isCreator &&
          !hasReachedStartTime && (
            <button
              onClick={() => setShowLeaveConfirm(true)}
              className="flex-1 bg-gradient-to-r from-red-500 to-red-600 text-white font-cyber font-bold py-3 rounded-xl hover:scale-105 transition-all shadow-lg hover:shadow-red-500/50"
            >
              Leave Room
            </button>
          )}

        {/* Cancel Room - Only before start time */}
        {canCancelRoom && (
          <button
            onClick={() => setShowCancelConfirm(true)}
            className="flex-1 bg-gradient-to-r from-red-500 to-red-600 text-white font-cyber font-bold py-3 rounded-xl hover:scale-105 transition-all shadow-lg hover:shadow-red-500/50"
          >
            Cancel Room
          </button>
        )}

        {/* Disabled Cancel - After start time */}
        {isCreator && actualStatus === "waiting" && hasReachedStartTime && (
          <div className="flex-1 bg-gray-600/30 text-gray-500 font-cyber font-bold py-3 rounded-xl text-center cursor-not-allowed">
            Cannot Cancel - Game Time Reached
          </div>
        )}

        {/* If user is not a participant and the room is not full, show the join room button */}
        {!isParticipant && room.current_players < room.max_players && (
          <button
            onClick={() => onJoinRoom(room)}
            className="flex-1 bg-green-500 text-white font-cyber font-bold py-3 rounded-xl hover:scale-105 transition-all shadow-lg hover:shadow-green-500/50"
          >
            Join Room
          </button>
        )}
      </div>

      {/* Leave Confirmation Modal */}
      {showLeaveConfirm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-card border-2 border-primary/50 rounded-2xl p-6 max-w-md w-full mx-4">
            <h3 className="font-cyber text-xl font-bold text-primary mb-4">
              Leave Room?
            </h3>
            <p className="text-muted-foreground mb-6">
              Are you sure you want to leave this room? You will forfeit your
              entry fee.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleLeaveRoom}
                className="flex-1 bg-red-500 text-white font-cyber font-bold py-2 rounded-lg hover:bg-red-600 transition-colors"
              >
                Leave Room
              </button>
              <button
                onClick={() => setShowLeaveConfirm(false)}
                className="flex-1 bg-secondary border border-primary/30 font-cyber font-bold py-2 rounded-lg hover:bg-secondary/80 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-card border-2 border-primary/50 rounded-2xl p-6 max-w-md w-full mx-4">
            <h3 className="font-cyber text-xl font-bold text-primary mb-4">
              Cancel Room?
            </h3>
            <p className="text-muted-foreground mb-6">
              Are you sure you want to cancel this room? All participants will
              receive full refunds (no platform fee charged).
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleCancelRoom}
                className="flex-1 bg-red-500 text-white font-cyber font-bold py-2 rounded-lg hover:bg-red-600 transition-colors"
              >
                Cancel Room
              </button>
              <button
                onClick={() => setShowCancelConfirm(false)}
                className="flex-1 bg-secondary border border-primary/30 font-cyber font-bold py-2 rounded-lg hover:bg-secondary/80 transition-colors"
              >
                Keep Room
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Special Room Completion Confirmation Modal */}
      {showCompletionConfirmation && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-card border-2 border-primary/50 rounded-2xl p-6 max-w-2xl w-full mx-4">
            <h3 className="font-cyber text-xl font-bold text-primary mb-4">
              ⭐ Complete Special Room?
            </h3>
            <p className="text-muted-foreground mb-6">
              You are about to complete this special room and distribute prizes
              based on the positions and scores you've assigned. This action
              cannot be undone.
            </p>

            <div className="space-y-3 mb-6">
              <h4 className="font-cyber text-lg font-bold text-foreground">
                Final Rankings:
              </h4>
              {participants
                .sort((a, b) => a.final_position - b.final_position)
                .map((participant, index) => (
                  <div
                    key={participant.id}
                    className="flex items-center justify-between bg-secondary/30 rounded-lg p-3 border border-primary/20"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-cyber text-lg text-primary">
                        #{participant.final_position}
                      </span>
                      <div>
                        <p className="font-cyber text-foreground">
                          {participant.user?.username || "Unknown Player"}
                        </p>
                        <p className="text-xs font-cyber text-muted-foreground">
                          Score: {participant.score}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-cyber text-green-400">
                        Position {index + 1}
                      </p>
                    </div>
                  </div>
                ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={confirmSpecialRoomCompletion}
                disabled={isCompletingSpecialRoom}
                className="flex-1 bg-green-500 text-white font-cyber font-bold py-3 rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
              >
                {isCompletingSpecialRoom ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                    Completing...
                  </span>
                ) : (
                  "Complete & Distribute Prizes"
                )}
              </button>
              <button
                onClick={() => {
                  setShowCompletionConfirmation(false);
                }}
                disabled={isCompletingSpecialRoom}
                className="flex-1 bg-secondary border border-primary/30 font-cyber font-bold py-3 rounded-lg hover:bg-secondary/80 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {room?.mode === "tournament" && <TournamentDisplay room={room} />}

      {/* Regular Room Content */}
      {activeTab === "overview" && (
        <>
          {/* Winners Section - Only show if game is completed and there are winners */}
          {actualStatus === "completed" && winners.length > 0 && (
            <div className="bg-gradient-to-br from-card to-secondary/20 border-2 border-primary/30 rounded-2xl p-6 cyber-border">
              <h2 className="font-cyber text-xl font-bold text-primary mb-4">
                🏆 Winners
              </h2>
              <div className="space-y-3">
                {winners.map((winner, index) => (
                  <div
                    key={winner.id}
                    className={`flex items-center justify-between rounded-lg p-4 border ${
                      winner.final_position === 1
                        ? "bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border-yellow-500/30"
                        : winner.final_position === 2
                        ? "bg-gradient-to-r from-gray-300/20 to-gray-400/20 border-gray-400/30"
                        : winner.final_position === 3
                        ? "bg-gradient-to-r from-amber-600/20 to-orange-600/20 border-amber-600/30"
                        : "bg-secondary/30 border-primary/20"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-2xl">
                        {winner.final_position === 1 && "🥇"}
                        {winner.final_position === 2 && "🥈"}
                        {winner.final_position === 3 && "🥉"}
                        {winner.final_position > 3 &&
                          `#${winner.final_position}`}
                      </div>
                      <div>
                        <p className="font-cyber text-foreground font-bold">
                          {winner.user?.username || "Unknown Player"}
                          {winner.user_id === user?.id && (
                            <span className="text-xs text-accent ml-2">
                              (You)
                            </span>
                          )}
                        </p>
                        <p className="text-sm font-cyber text-muted-foreground">
                          Score: {winner.score || 0} points
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-cyber text-lg font-bold text-green-400">
                        +{winner.earnings} {room.currency}
                      </p>
                      <p className="text-xs font-cyber text-muted-foreground">
                        Position {winner.final_position}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default GameRoomDetails;
