import React, { useState, useEffect, useCallback, useMemo } from "react";
import { GameRoomParticipant, useGameRoom } from "@/contexts/GameRoomContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { TournamentDisplay } from "@/components/tournament";
import { TournamentProvider } from "@/contexts/TournamentContext";

const GameRoomDetails = ({ roomId, onBack }) => {
  const {
    getRoomDetails,
    getRoomParticipants,
    leaveRoom,
    cancelRoom,
    playGame,
    completeGame,
    approveGameRoomCompletion,
    getSignatureStatus,
    hasSigned,
  } = useGameRoom();
  const { user } = useAuth();
  const { toast } = useToast();
  const [room, setRoom] = useState(null);
  const [participants, setParticipants] = useState<GameRoomParticipant[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isLaunchingGame, setIsLaunchingGame] = useState(false);
  const [winners, setWinners] = useState([]);
  const [showSpecialRoomAdmin, setShowSpecialRoomAdmin] = useState(false);
  const [isCompletingSpecialRoom, setIsCompletingSpecialRoom] = useState(false);
  const [showCompletionConfirmation, setShowCompletionConfirmation] =
    useState(false);
  const [pendingCompletion, setPendingCompletion] = useState(null);
  const [signatureStatus, setSignatureStatus] = useState({
    collected: 0,
    required: 2,
    hasCreatorSignature: false,
    hasParticipantSignature: false,
  });
  const [isSubmittingApproval, setIsSubmittingApproval] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "tournament">(
    "overview"
  );

  // Enhanced loadRoomData function
  const loadRoomData = useCallback(
    async (showLoader = true) => {
      if (showLoader) {
        setLoading(true);
      }
      try {
        const [roomData, participantsData] = await Promise.all([
          getRoomDetails(roomId),
          getRoomParticipants(roomId),
        ]);

        if (roomData) {
          setRoom(roomData);

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
            const sigStatus = await getSignatureStatus(roomId);
            setSignatureStatus(sigStatus);
          } catch (error) {
            console.error("Error loading signature status:", error);
          }
        }
      } catch (error) {
        console.error("Error loading room data:", error);
        toast({
          title: "Error",
          description: "Failed to load room details",
          variant: "destructive",
        });
      } finally {
        if (showLoader) {
          setLoading(false);
        }
      }
    },
    [roomId, getRoomDetails, getRoomParticipants, getSignatureStatus, toast]
  );
  // Function to check if room should auto-complete
  const checkForAutoCompletion = useCallback(async () => {
    if (!room) return;

    const now = new Date();
    const endTime = new Date(room.end_time);

    // If current time has passed end time and room is still ongoing/waiting
    if (
      now >= endTime &&
      (room.status === "ongoing" || room.status === "waiting")
    ) {
      console.log("Room should auto-complete, refreshing data...");
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
  }, [loadRoomData]);

  // Check for auto-completion more frequently
  useEffect(() => {
    if (!room) return;

    const autoCompleteCheckInterval = setInterval(() => {
      checkForAutoCompletion();
    }, 10000); // Check every 10 seconds

    return () => clearInterval(autoCompleteCheckInterval);
  }, [checkForAutoCompletion, room]);

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
          console.log("Room updated, refreshing data...");
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
          console.log("Participants updated, refreshing data...");
          loadRoomData(false);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [roomId, loadRoomData]);

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
    } else if (now >= endTime) {
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
      console.error("Error launching game:", error);
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
      console.error("Error leaving room:", error);
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
      console.error("Error cancelling room:", error);
      toast({
        title: "Error",
        description: "Failed to cancel room",
        variant: "destructive",
      });
    }
  };

  const handleSpecialRoomCompletion = async () => {
    if (!room || !participants.length) return;

    // Check signature requirements first
    if (signatureStatus.collected < signatureStatus.required) {
      toast({
        title: "Insufficient Signatures",
        description: `Required ${signatureStatus.required} signatures, but only ${signatureStatus.collected} collected. Both creator and one participant must sign.`,
        variant: "destructive",
      });
      return;
    }

    if (
      !signatureStatus.hasCreatorSignature ||
      !signatureStatus.hasParticipantSignature
    ) {
      toast({
        title: "Missing Required Signatures",
        description:
          "Both creator and participant signatures are required to complete the game.",
        variant: "destructive",
      });
      return;
    }

    // Validate that all participants have positions and scores
    const participantsWithPositions = participants.filter(
      (p) =>
        p.final_position &&
        p.final_position > 0 &&
        p.score !== null &&
        p.score !== undefined
    );

    if (participantsWithPositions.length !== participants.length) {
      toast({
        title: "Incomplete Data",
        description: "All participants must have positions and scores assigned",
        variant: "destructive",
      });
      return;
    }

    // Check for duplicate positions
    const positions = participantsWithPositions.map((p) => p.final_position);
    const uniquePositions = new Set(positions);
    if (positions.length !== uniquePositions.size) {
      toast({
        title: "Invalid Positions",
        description: "Each participant must have a unique position",
        variant: "destructive",
      });
      return;
    }

    // Prepare winners data for completeGame function
    const winners = participantsWithPositions.map((participant) => ({
      userId: participant.user_id,
      position: participant.final_position,
      participantId: participant.id,
    }));

    setPendingCompletion({ winners, participants: participantsWithPositions });
    setShowCompletionConfirmation(true);
  };

  const confirmSpecialRoomCompletion = async () => {
    if (!pendingCompletion) return;

    setIsCompletingSpecialRoom(true);
    try {
      await completeGame(roomId, pendingCompletion.winners);

      toast({
        title: "Success",
        description: "Special room completed and prizes distributed!",
      });

      setShowCompletionConfirmation(false);
      setShowSpecialRoomAdmin(false);
      setPendingCompletion(null);

      // Refresh room data
      await loadRoomData(false);
    } catch (error) {
      console.error("Error completing special room:", error);
      toast({
        title: "Error",
        description: "Failed to complete special room",
        variant: "destructive",
      });
    } finally {
      setIsCompletingSpecialRoom(false);
    }
  };

  // Signature handling functions
  const handleApprovalSubmit = async () => {
    setIsSubmittingApproval(true);
    try {
      await approveGameRoomCompletion(roomId);

      // Refresh signature status
      const sigStatus = await getSignatureStatus(roomId);
      setSignatureStatus(sigStatus);

      // Refresh room data
      await loadRoomData(false);

      toast({
        title: "Success",
        description: "Approval submitted successfully",
      });
    } catch (error) {
      console.error("Error submitting approval:", error);
      toast({
        title: "Error",
        description: "Failed to submit approval",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingApproval(false);
    }
  };

  const checkUserSignatureStatus = async () => {
    if (!user || !room) return false;

    try {
      // Get user's wallet address
      const userProfile = user.user_metadata?.sui_wallet_data;
      if (!userProfile?.address) return false;

      return await hasSigned(roomId, userProfile.address);
    } catch (error) {
      console.error("Error checking user signature status:", error);
      return false;
    }
  };

  // Helper functions
  const formatDateTime = (date) => {
    return new Date(date).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTimeRemaining = (startTime) => {
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

  const getStatusColor = (status) => {
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

  const getWinnerSplitDisplay = (rule) => {
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
    <TournamentProvider>
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
                  onClick={() => setActiveTab("overview")}
                  className={`px-4 py-2 rounded-md font-cyber font-bold text-sm transition-all ${
                    activeTab === "overview"
                      ? "bg-primary text-background"
                      : "text-foreground hover:bg-secondary/50"
                  }`}
                >
                  Overview
                </button>
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
                    ? "Custom Game"
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
                  <p className="text-xs font-cyber text-purple-400">
                    ROOM CODE
                  </p>
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
              <p className="text-sm font-cyber text-green-400 mb-1">
                Prize Pool
              </p>
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
              <p className="text-sm font-cyber text-yellow-400 mb-1">
                Entry Fee
              </p>
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
        {room.is_special && isCreator && actualStatus === "ongoing" && (
          <div className="bg-gradient-to-br from-card to-secondary/20 border-2 border-primary/30 rounded-2xl p-6 cyber-border">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-cyber text-xl font-bold text-primary">
                ⭐ Special Room Admin Panel
              </h2>
              <button
                onClick={() => setShowSpecialRoomAdmin(!showSpecialRoomAdmin)}
                className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-4 py-2 rounded-lg font-cyber font-bold hover:scale-105 transition-all"
              >
                {showSpecialRoomAdmin ? "Hide Admin Panel" : "Manage Winners"}
              </button>
            </div>

            {showSpecialRoomAdmin && (
              <div className="space-y-4">
                <p className="text-sm font-cyber text-muted-foreground">
                  As the room creator, you can manually assign positions and
                  scores to participants. Both you and one participant must
                  approve the final results.
                </p>

                {/* Signature Status */}
                <div className="bg-purple-500/20 border border-purple-500/30 rounded-lg p-4">
                  <h3 className="font-cyber text-lg font-bold text-purple-400 mb-2">
                    📝 Signature Status
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-cyber text-purple-300">
                        Signatures Collected: {signatureStatus.collected} /{" "}
                        {signatureStatus.required}
                      </p>
                      <div className="w-full bg-purple-900/30 rounded-full h-2 mt-1">
                        <div
                          className="bg-purple-400 h-2 rounded-full transition-all duration-300"
                          style={{
                            width: `${
                              (signatureStatus.collected /
                                signatureStatus.required) *
                              100
                            }%`,
                          }}
                        ></div>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-cyber text-purple-300">
                        Status:{" "}
                        {signatureStatus.hasCreatorSignature &&
                        signatureStatus.hasParticipantSignature
                          ? "✅ Ready to Complete"
                          : "⏳ Pending Signatures"}
                      </p>
                    </div>
                  </div>

                  {/* Admin Approval Button */}
                  <div className="mt-4">
                    <button
                      onClick={handleApprovalSubmit}
                      disabled={isSubmittingApproval}
                      className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-4 py-2 rounded-lg font-cyber font-bold hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100"
                    >
                      {isSubmittingApproval ? (
                        <span className="flex items-center justify-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                          Submitting...
                        </span>
                      ) : (
                        "📝 Approve Game Completion"
                      )}
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  {participants.map((participant, index) => (
                    <div
                      key={participant.id}
                      className="flex items-center justify-between bg-secondary/30 rounded-lg p-4 border border-primary/20"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-cyber text-lg text-primary">
                          #{index + 1}
                        </span>
                        <div>
                          <p className="font-cyber text-foreground">
                            {participant.user?.username || "Unknown Player"}
                          </p>
                          <p className="text-xs font-cyber text-muted-foreground">
                            Joined:{" "}
                            {new Date(
                              participant.joined_at
                            ).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <label className="text-sm font-cyber text-muted-foreground">
                            Position:
                          </label>
                          <input
                            type="number"
                            min="1"
                            max={participants.length}
                            value={participant.final_position || ""}
                            onChange={(e) => {
                              const newParticipants = [...participants];
                              newParticipants[index] = {
                                ...participant,
                                final_position:
                                  parseInt(e.target.value) || null,
                              };
                              setParticipants(newParticipants);
                            }}
                            className="w-20 px-2 py-1 bg-secondary/50 border border-primary/30 rounded text-center text-sm font-cyber text-foreground focus:border-primary focus:outline-none"
                            placeholder="1"
                          />
                        </div>

                        <div className="flex items-center gap-2">
                          <label className="text-sm font-cyber text-muted-foreground">
                            Score:
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={participant.score || ""}
                            onChange={(e) => {
                              const newParticipants = [...participants];
                              newParticipants[index] = {
                                ...participant,
                                score: parseInt(e.target.value) || 0,
                              };
                              setParticipants(newParticipants);
                            }}
                            className="w-24 px-2 py-1 bg-secondary/50 border border-primary/30 rounded text-center text-sm font-cyber text-foreground focus:border-primary focus:outline-none"
                            placeholder="0"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleSpecialRoomCompletion}
                    disabled={
                      isCompletingSpecialRoom ||
                      signatureStatus.collected < signatureStatus.required ||
                      !signatureStatus.hasCreatorSignature ||
                      !signatureStatus.hasParticipantSignature
                    }
                    className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white font-cyber font-bold py-3 rounded-xl hover:scale-105 transition-all shadow-lg hover:shadow-green-500/50 disabled:opacity-50 disabled:hover:scale-100"
                  >
                    {isCompletingSpecialRoom ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                        Completing...
                      </span>
                    ) : signatureStatus.collected < signatureStatus.required ? (
                      `Complete Room (${signatureStatus.collected}/${signatureStatus.required} signatures)`
                    ) : (
                      "Complete Room & Distribute Prizes"
                    )}
                  </button>
                  <button
                    onClick={() => setShowSpecialRoomAdmin(false)}
                    disabled={isCompletingSpecialRoom}
                    className="px-6 bg-secondary border-2 border-primary/30 font-cyber font-bold py-3 rounded-xl hover:bg-secondary/80 hover:border-primary/50 transition-all disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Participant Signature Section for Special Rooms */}
        {room.is_special &&
          isParticipant &&
          !isCreator &&
          actualStatus === "ongoing" && (
            <div className="bg-gradient-to-br from-card to-secondary/20 border-2 border-primary/30 rounded-2xl p-6 cyber-border">
              <h2 className="font-cyber text-xl font-bold text-primary mb-4">
                📝 Approve Game Completion
              </h2>
              <p className="text-sm font-cyber text-muted-foreground mb-4">
                As a participant, you can approve the game completion. Both the
                room creator and one participant must approve before the game
                can be completed.
              </p>

              {/* Signature Status for Participants */}
              <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-4 mb-4">
                <h3 className="font-cyber text-lg font-bold text-blue-400 mb-2">
                  Signature Status
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-cyber text-blue-300">
                      Signatures Collected: {signatureStatus.collected} /{" "}
                      {signatureStatus.required}
                    </p>
                    <div className="w-full bg-blue-900/30 rounded-full h-2 mt-1">
                      <div
                        className="bg-blue-400 h-2 rounded-full transition-all duration-300"
                        style={{
                          width: `${
                            (signatureStatus.collected /
                              signatureStatus.required) *
                            100
                          }%`,
                        }}
                      ></div>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-cyber text-blue-300">
                      Status:{" "}
                      {signatureStatus.hasCreatorSignature &&
                      signatureStatus.hasParticipantSignature
                        ? "✅ Ready to Complete"
                        : "⏳ Pending Signatures"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Participant Approval Button */}
              <button
                onClick={handleApprovalSubmit}
                disabled={isSubmittingApproval}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-3 rounded-lg font-cyber font-bold hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100"
              >
                {isSubmittingApproval ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                    Submitting...
                  </span>
                ) : (
                  "📝 Submit My Approval"
                )}
              </button>
            </div>
          )}

        {/* Action Buttons */}
        <div className="flex gap-4">
          {/* Play Game Button - Updated to use new tab functionality */}
          {canPlayGame && !room.is_special && (
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
              ⭐ Special Room - Admin manages game completion
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
        {showCompletionConfirmation && pendingCompletion && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-card border-2 border-primary/50 rounded-2xl p-6 max-w-2xl w-full mx-4">
              <h3 className="font-cyber text-xl font-bold text-primary mb-4">
                ⭐ Complete Special Room?
              </h3>
              <p className="text-muted-foreground mb-6">
                You are about to complete this special room and distribute
                prizes based on the positions and scores you've assigned. This
                action cannot be undone.
              </p>

              <div className="space-y-3 mb-6">
                <h4 className="font-cyber text-lg font-bold text-foreground">
                  Final Rankings:
                </h4>
                {pendingCompletion.participants
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
                          Position {participant.final_position}
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
                    setPendingCompletion(null);
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

        {/* Tournament Content */}
        {room?.mode === "tournament" && activeTab === "tournament" && (
          <TournamentDisplay
            roomId={roomId}
            isCreator={isCreator}
            isMobile={window.innerWidth < 768}
          />
        )}

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
                              {new Date(
                                participant.joined_at
                              ).toLocaleTimeString()}
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
          </>
        )}

        <style>{`
        .cyber-border {
          position: relative;
          overflow: hidden;
        }
        
        .cyber-border::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 2px;
          background: linear-gradient(90deg, transparent, var(--primary), transparent);
          animation: scan 3s linear infinite;
        }
        
        .cyber-button {
          position: relative;
          overflow: hidden;
        }
        
        .cyber-button::after {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          width: 0;
          height: 0;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.2);
          transform: translate(-50%, -50%);
          transition: width 0.6s, height 0.6s;
        }
        
        .cyber-button:hover::after {
          width: 300px;
          height: 300px;
        }
        
        .glow-text {
          text-shadow: 0 0 10px currentColor, 0 0 20px currentColor;
        }
        
        .glow-text-subtle {
          text-shadow: 0 0 5px currentColor;
        }
        
        @keyframes scan {
          to {
            left: 100%;
          }
        }
        
        .animate-fade-in {
          animation: fadeIn 0.5s ease-out;
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
      </div>
    </TournamentProvider>
  );
};

export default GameRoomDetails;
