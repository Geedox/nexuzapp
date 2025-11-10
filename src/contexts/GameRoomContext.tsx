import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/hooks/auth";
import { supabase } from "../integrations/supabase/client";
import { useToast } from "../hooks/use-toast";
import { useWallet } from "@/hooks/wallet";
import { useProfile } from "@/hooks/profile";
import { useTransaction } from "../contexts/TransactionContext";
import type { Database, TablesInsert } from "../integrations/supabase/types";
import { logger } from "../utils/logger";
import { verifyCoinForRoomCreation } from "../lib/utils";
import { gameRoomService } from "../services/gameRoomService";
import {
  GameRoomFilters,
  GameRoom,
  GameRoomContextType,
  GameSession,
  GameRoomParticipant,
  CreateRoomData,
} from "../types/gameroom";
import { GameRoomContext } from "../hooks/gameroom";
import { tournamentService } from "../services/tournamentService";
import { useNotification } from "../hooks/useNotification";
import { useCommunityChatContext } from "./CommunityChatContext";
import { storage } from "../lib/session-storage";
import { useActiveAccount } from "panna-sdk/react";
import { GameRoom as OnChainGameRoom } from "../integrations/smartcontracts/gameRoom";

export const GameRoomProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [rooms, setRooms] = useState<GameRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRooms, setTotalRooms] = useState(0);
  const refreshRoom = useRef(null);
  const [roomsPerPage] = useState(12); // Show 12 rooms per page (3x4 grid)
  // Filter state
  const [filters, setFiltersState] = useState<GameRoomFilters>({
    sortBy: "created_at",
    sortOrder: "desc",
  });
  const { user } = useAuth();
  const { toast } = useToast();
  const { refreshBalances, usdcBalance, usdtBalance, suiBalance } = useWallet();
  const { profile } = useProfile();
  const {
    notifyRoomCreated,
    notifyPlayerJoined,
    notifyPlayerLeft,
    notifyRoomCancelled,
    notifyHighscoreBeaten,
  } = useNotification();
  const { friends } = useCommunityChatContext();
  const [activeGameSessions, setActiveGameSessions] = useState<
    Map<string, GameSession>
  >(new Map());
  const activeAccount = useActiveAccount();

  const { refreshTransactions } = useTransaction();

  // Updated playGame function
  const playGame = async (roomId: string): Promise<void> => {
    if (!user) throw new Error("User not authenticated");

    try {
      // Get room details
      const { data: room, error: roomError } = await supabase
        .from("game_rooms")
        .select(
          `
        *,
        game:games(*),
        participants:game_room_participants(*)
      `
        )
        .eq("id", roomId)
        .single();

      if (roomError) throw roomError;

      // Check if user is in the room
      const userParticipant = room.participants?.find(
        (p: GameRoomParticipant) => p.user_id === user.id && p.is_active
      );

      if (!userParticipant) {
        throw new Error("You must join the room before playing");
      }

      // Check if room is ongoing
      if (room.status !== "ongoing") {
        throw new Error("Room is not currently active for playing");
      }

      // Generate session token
      const sessionToken = storage.generateSessionToken();

      // Create game session with expiration (24 hours)
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      const gameSession: GameSession = {
        roomId: room.id,
        userId: user.id,
        sessionToken,
        gameUrl: room.game?.game_url || "",
        startTime: new Date(),
        expiresAt,
      };

      // Store session in both state and localStorage
      setActiveGameSessions((prev) =>
        new Map(prev).set(sessionToken, gameSession)
      );
      storage.saveSessionToStorage(sessionToken, gameSession);

      // Rest of your URL construction code remains the same...
      const gameUrl = new URL(room.game?.game_url || "");
      gameUrl.searchParams.set("user_id", user.id);
      gameUrl.searchParams.set("room_id", room.id);
      gameUrl.searchParams.set("on_chain_room_id", room.on_chain_room_id || "");
      gameUrl.searchParams.set("session_token", sessionToken);
      gameUrl.searchParams.set("game_name", room.game?.name || "Game");
      gameUrl.searchParams.set("game_id", room.game_id);
      gameUrl.searchParams.set("currency", room.currency);
      gameUrl.searchParams.set("entry_fee", room.entry_fee.toString());
      gameUrl.searchParams.set(
        "total_prize_pool",
        room.total_prize_pool.toString()
      );
      gameUrl.searchParams.set("max_players", room.max_players.toString());
      gameUrl.searchParams.set(
        "current_players",
        room.current_players.toString()
      );
      gameUrl.searchParams.set("winner_split_rule", room.winner_split_rule);
      gameUrl.searchParams.set("instructions", room.game?.description || "");
      gameUrl.searchParams.set("status", room.status);
      gameUrl.searchParams.set("players", room.current_players.toString());

      // Open game in new tab
      const gameWindow = window.open(gameUrl.toString(), "_blank");

      if (!gameWindow) {
        throw new Error("Please allow popups to play the game");
      }

      toast({
        title: "Game Launched",
        description: "Game opened in new tab. Play and submit your score!",
      });
    } catch (error: unknown) {
      logger.error("Error launching game:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to launch game",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Updated handleGameMessage - DON'T remove session after score submission
  const handleGameMessage = async (event: MessageEvent) => {
    const allowedOrigins = [
      "https://flappy-bird-nexuz.netlify.app",
      "https://doodle-jump-nexuz.netlify.app",
      "https://endless-runner-nexuz.netlify.app",
    ];

    if (!allowedOrigins.includes(event.origin)) {
      logger.debug("Message from unauthorized origin:", event.origin);
      return;
    }

    const { type, score, userId, roomId, gameId, sessionToken, metadata } =
      event.data;

    logger.debug("Received message:", {
      type,
      score,
      userId,
      roomId,
      sessionToken,
    });

    if (type === "SUBMIT_SCORE") {
      try {
        // Try to get session from state first, then fallback to localStorage
        let session = activeGameSessions.get(sessionToken);

        if (!session) {
          const storedSessions = storage.getSessionsFromStorage();
          session = storedSessions[sessionToken];

          // If found in storage, restore to state
          if (session) {
            setActiveGameSessions((prev) =>
              new Map(prev).set(sessionToken, session)
            );
            logger.debug("Restored session from localStorage:", sessionToken);
          } else {
            logger.error("Invalid session token:", sessionToken);
            logger.debug(
              "Available sessions in state:",
              Array.from(activeGameSessions.keys())
            );
            logger.debug(
              "Available sessions in storage:",
              Object.keys(storage.getSessionsFromStorage())
            );

            // Send error back to game
            if (event.source) {
              event.source.postMessage(
                {
                  type: "SCORE_SUBMISSION_ERROR",
                  error: "Invalid session token",
                },
                { targetOrigin: event.origin }
              );
            }
            return;
          }
        }

        if (session.userId !== userId || session.roomId !== roomId) {
          logger.error("Session validation failed");
          return;
        }

        // Update score in database
        const result = await updateGameScore(roomId, score, userId, gameId);

        // Send success response back to game
        if (event.source) {
          event.source.postMessage(
            {
              type: "SCORE_SUBMISSION_SUCCESS",
              updated: result.updated,
              previousScore: result.previousScore,
              newScore: result.newScore,
            },
            { targetOrigin: event.origin }
          );
        }

        // Show appropriate message
        if (result.tournamentMatch) {
          toast({
            title: "Tournament Score Submitted! 🏆",
            description: `Your score of ${result.newScore.toLocaleString()} has been recorded for the tournament match!`,
          });
        } else if (result.updated) {
          toast({
            title: "New High Score! 🎉",
            description: `Your score improved from ${result.previousScore.toLocaleString()} to ${result.newScore.toLocaleString()}!`,
          });
        } else {
          toast({
            title: "Score Submitted",
            description: `Score: ${result.newScore.toLocaleString()} (Current best: ${result.previousScore.toLocaleString()})`,
          });
        }

        // Refresh room data
        await refreshRooms();
        refreshRoom.current = { refresh: true };

        logger.info("Score submission result:", {
          roomId,
          userId,
          scoreSubmitted: score,
          previousScore: result.previousScore,
          newScore: result.newScore,
          wasUpdated: result.updated,
          sessionToken,
          metadata,
        });
      } catch (error) {
        logger.error("Error handling score submission:", error);

        // Send error back to game
        if (event.source) {
          event.source.postMessage(
            {
              type: "SCORE_SUBMISSION_ERROR",
              error: error.message,
            },
            { targetOrigin: event.origin }
          );
        }

        toast({
          title: "Score Submission Failed",
          description:
            "There was an error recording your score. Please try again.",
          variant: "destructive",
        });
      }
    } else if (type === "EXIT_GAME") {
      logger.debug("User exited game, keeping session active:", sessionToken);
    } else if (type === "GAME_READY") {
      logger.debug("Game ready, session:", sessionToken);
    }
  };

  // Updated updateGameScore with extensive debugging
  const updateGameScore = async (
    roomId: string,
    score: number,
    userId?: string,
    gameId?: string,
    multiplayerScores?: Record<string, number>
  ) => {
    const userIdToUse = userId || user?.id;

    if (!userIdToUse) throw new Error("User not authenticated");

    try {
      logger.debug(
        `Starting score update for user ${userIdToUse}, room ${roomId}, new score: ${score}`
      );
      const { data: roomData, error: roomError } = await supabase
        .from("game_rooms")
        .select("mode, play_mode, game_name, game:games(*)")
        .eq("id", roomId)
        .single();
      if (roomError) throw roomError;
      // The highest score in the room
      const { data: highestScoreParticipantData, error: highestScoreError } =
        await supabase
          .from("game_room_participants")
          .select("score, user_id, id")
          .eq("room_id", roomId)
          .order("score", { ascending: false })
          .limit(1);
      if (highestScoreError) {
        logger.debug(
          "Error fetching highest score participant:",
          highestScoreError
        );
        // throw highestScoreError;
      }
      // First, get the current participant data
      const { data: currentParticipant, error: fetchError } = await supabase
        .from("game_room_participants")
        .select("*")
        .eq("room_id", roomId)
        .eq("user_id", userIdToUse)
        .single();

      if (fetchError) {
        logger.debug("Error fetching current participant:", fetchError);
        throw fetchError;
      }

      logger.debug("Current participant data:", currentParticipant);
      const highestScoreParticipant = highestScoreParticipantData[0];
      const currentScore = currentParticipant.score;
      const currentScoreNum = Number(currentScore);
      const newScoreNum = Number(score);
      const highScoreBeaten =
        highestScoreParticipant &&
        currentParticipant.id !== highestScoreParticipant.id &&
        newScoreNum > highestScoreParticipant.score;
      let result: {
        updated: boolean;
        previousScore: number;
        newScore: number;
        tournamentMatch: boolean;
        highScoreBeaten: boolean;
        highScoreBeatenUserId: string;
      } = {
        updated: false,
        previousScore: currentScoreNum,
        newScore: newScoreNum,
        tournamentMatch: false,
        highScoreBeaten,
        highScoreBeatenUserId: highestScoreParticipant.user_id,
      };

      // Only update if new score is higher
      if (newScoreNum > currentScoreNum) {
        logger.debug(
          `Updating score from ${currentScoreNum} to ${newScoreNum}`
        );

        // FIX: Use userIdToUse instead of user.id which might be null
        if (gameId) {
          await supabase.from("game_scores").insert({
            game_id: gameId,
            player_id: userIdToUse, // Changed from user.id to userIdToUse
            score,
          });
        }
        const { data: updateResult, error: updateError } = await supabase
          .from("game_room_participants")
          .update({ score: newScoreNum })
          .eq("room_id", roomId)
          .eq("user_id", userIdToUse)
          .select();

        if (updateError) {
          logger.debug("Error updating score:", updateError);
          throw updateError;
        }

        logger.debug("Update result:", updateResult);

        result = {
          ...result,
          updated: true,
          previousScore: currentScoreNum,
          newScore: newScoreNum,
          tournamentMatch: false,
        };
      } else {
        logger.debug(
          `Score ${newScoreNum} not higher than current ${currentScoreNum}, no update needed`
        );
        result = {
          ...result,
          updated: false,
          previousScore: currentScoreNum,
          newScore: newScoreNum,
          tournamentMatch: false,
        };
      }
      if (roomData.mode === "tournament") {
        const tournamentMatches = await tournamentService.getTournamentMatches(
          roomId
        );
        if (tournamentMatches.length > 0) {
          // Find active match for this user
          const activeMatch = tournamentMatches.find(
            (match) =>
              (match.player1_id === userId ||
                match.player2_id === userId ||
                match.player3_id === userId ||
                match.player4_id === userId) &&
              match.status === "active"
          );
          logger.debug("Active match:", activeMatch);
          if (activeMatch) {
            if (roomData.play_mode === "multiplayer") {
              await tournamentService.submitMultiplayerScore(
                roomId,
                activeMatch.id,
                multiplayerScores
              );
            } else {
              await tournamentService.submitScore(
                roomId,
                activeMatch.id,
                newScoreNum
              );
            }
            logger.debug(
              "Score submitted: ",
              await tournamentService.getMatchById(activeMatch.id)
            );
            result = {
              ...result,
              updated: true,
              previousScore: currentScoreNum,
              newScore: newScoreNum,
              tournamentMatch: !!activeMatch,
            };
          } else {
            result = {
              ...result,
              updated: false,
              previousScore: currentScoreNum,
              newScore: newScoreNum,
              tournamentMatch: false,
            };
          }
        }
      }
      // Send highscore beaten notification if applicable
      try {
        if (result.updated && result.highScoreBeaten && user && profile) {
          await notifyHighscoreBeaten(
            result.highScoreBeatenUserId,
            roomData.game_name || roomData.game.name,
            profile.display_name || profile.username,
            result.newScore
          );
        }
      } catch (notificationError) {
        logger.error(
          "Error sending highscore beaten notification:",
          notificationError
        );
        // Don't throw error to prevent breaking score update
      }
      return result;
    } catch (error) {
      logger.error("Error in updateGameScore:", error);
      throw error;
    }
  };

  // Admin function to update participant scores (allows lower scores and multiple updates)
  const updateParticipantScore = async (
    roomId: string,
    participants: {
      participantId: string;
      newScore: number;
    }[]
  ) => {
    if (!user) throw new Error("User not authenticated");

    try {
      // Verify user is admin (room creator or has admin privileges)
      const { data: room, error: roomError } = await supabase
        .from("game_rooms")
        .select("creator_id, status")
        .eq("id", roomId)
        .single();

      if (roomError) throw roomError;

      const isRoomCreator = room.creator_id === user.id;
      if (!isRoomCreator) {
        throw new Error("Only room creators can update participant scores");
      }

      // Check if room is still active (not completed)
      if (room.status === "completed" || room.status === "cancelled") {
        throw new Error(
          "Cannot update scores for completed or cancelled rooms"
        );
      }
      const result: {
        success: boolean;
        score: number;
      }[] = [];

      for (const participantData of participants) {
        logger.debug(
          `Admin updating participant ${participantData.participantId} score in room ${roomId} to ${participantData.newScore}`
        );

        const newScoreNum = Number(participantData.newScore);
        // Get current participant data
        const { data: participant, error: participantError } = await supabase
          .from("game_room_participants")
          .update({
            score: newScoreNum,
          })
          .eq("room_id", roomId)
          .eq("id", participantData.participantId)
          .select("id, score")
          .single();
        if (participantError) throw participantError;
        logger.success(
          `Successfully updated participant ${participant.id} score from ${participant.score} to ${newScoreNum}`
        );

        result.push({
          success: true,
          score: newScoreNum,
        });
      }
      toast({
        title: "Score Updated",
        description: `Participant scores updated`,
      });

      return result;
    } catch (error) {
      logger.error("Error updating participant score:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to update score",
        variant: "destructive",
      });
      throw error;
    }
  };
  const onChainGameRoom = new OnChainGameRoom();

  // Add message listener in useEffect
  useEffect(() => {
    // Listen for messages from game windows
    window.addEventListener("message", handleGameMessage);

    return () => {
      window.removeEventListener("message", handleGameMessage);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Restore sessions from localStorage on component mount
    const storedSessions = storage.getSessionsFromStorage();
    const sessionsMap = new Map();

    Object.entries(storedSessions).forEach(([token, session]) => {
      sessionsMap.set(token, session);
    });

    if (sessionsMap.size > 0) {
      setActiveGameSessions(sessionsMap);
      logger.debug("Restored sessions on mount:", Object.keys(storedSessions));
    }
  }, []); // Empty dependency array - only runs on mount

  // 2. UPDATED existing useEffect - Keep your current cleanup logic but add localStorage cleanup
  useEffect(() => {
    const cleanupExpiredSessions = () => {
      const now = new Date();
      const sessionsToDelete = [];

      for (const [sessionToken, session] of activeGameSessions.entries()) {
        // Find the corresponding room
        const room = rooms.find((r) => r.id === session.roomId);

        if (room) {
          const roomEndTime = new Date(room.end_time);

          // Clean up sessions for rooms that have ended
          if (
            now > roomEndTime ||
            room.status === "completed" ||
            room.status === "cancelled"
          ) {
            sessionsToDelete.push(sessionToken);
            logger.debug(
              `Cleaning up expired session for completed room: ${sessionToken}`
            );
          }
        } else {
          // Room doesn't exist anymore, clean up session
          sessionsToDelete.push(sessionToken);
          logger.debug(
            `Cleaning up session for non-existent room: ${sessionToken}`
          );
        }
      }

      // Remove expired sessions from both state and localStorage
      if (sessionsToDelete.length > 0) {
        setActiveGameSessions((prev) => {
          const newMap = new Map(prev);
          sessionsToDelete.forEach((token) => {
            newMap.delete(token);
            storage.removeSessionFromStorage(token); // ADD THIS LINE - cleanup localStorage too
          });
          return newMap;
        });

        logger.debug(`Cleaned up ${sessionsToDelete.length} expired sessions`);
      }
    };

    // Run cleanup every 30 seconds
    const cleanupInterval = setInterval(cleanupExpiredSessions, 30000);

    // Run initial cleanup
    cleanupExpiredSessions();

    return () => clearInterval(cleanupInterval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch all public rooms and user's private rooms with filtering
  const fetchRooms = async (silent: boolean) => {
    try {
      if (!silent) setLoading(true);
      // First, update room statuses based on time
      await gameRoomService.updateRoomStatuses();

      const start = (currentPage - 1) * roomsPerPage;

      // Build the base query - Show all rooms (public and private) to all users
      // Access control is handled at the join level with room codes
      let query = supabase.from("game_rooms").select(
        `
          *,
          game:games(*),
          creator:profiles(*),
          participants:game_room_participants(*)
        `,
        { count: "exact" }
      );

      // Apply filters
      if (filters.status && filters.status.length > 0) {
        query = query.in("status", filters.status);
      }

      if (filters.currency && filters.currency.length > 0) {
        query = query.in("currency", filters.currency);
      }

      if (filters.isPrivate !== undefined) {
        query = query.eq("is_private", filters.isPrivate);
      }

      if (filters.isSponsored !== undefined) {
        query = query.eq("is_sponsored", filters.isSponsored);
      }

      if (filters.minEntryFee !== undefined) {
        query = query.gte("entry_fee", filters.minEntryFee);
      }

      if (filters.maxEntryFee !== undefined) {
        query = query.lte("entry_fee", filters.maxEntryFee);
      }

      if (filters.minPlayers !== undefined) {
        query = query.gte("current_players", filters.minPlayers);
      }

      if (filters.maxPlayers !== undefined) {
        query = query.lte("max_players", filters.maxPlayers);
      }

      if (filters.gameId) {
        query = query.eq("game_id", filters.gameId);
      }

      if (filters.creatorId) {
        query = query.eq("creator_id", filters.creatorId);
      }

      // Apply sorting
      const sortBy = filters.sortBy || "created_at";
      const sortOrder = filters.sortOrder || "desc";
      query = query.order(sortBy, { ascending: sortOrder === "asc" });

      // Apply pagination
      query = query.range(start, start + roomsPerPage - 1);

      const { data, error, count } = await query;

      if (error) throw error;
      setRooms((data as GameRoom[]) || []);
      setTotalRooms(count || 0);
      setTotalPages(Math.ceil((count || 0) / roomsPerPage));
    } catch (error) {
      logger.error("Error fetching rooms:", error);
      toast({
        title: "Error",
        description: "Failed to fetch game rooms",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const refreshRooms = async () => {
    setCurrentPage(1); // Reset to first page when refreshing
    await fetchRooms(true);
  };

  // Filter functions
  const setFilters = (newFilters: Partial<GameRoomFilters>) => {
    setFiltersState((prev) => ({ ...prev, ...newFilters }));
  };

  const clearFilters = () => {
    setFiltersState({
      sortBy: "created_at",
      sortOrder: "desc",
    });
  };

  const applyFilters = async () => {
    setCurrentPage(1); // Reset to first page when applying filters
    await fetchRooms(false);
  };

  // Create a new game room
  const createRoom = async (data: CreateRoomData): Promise<GameRoom> => {
    if (!user) throw new Error("User not authenticated");
    logger.debug("Creating room:", data);
    setCreating(true);
    try {
      // For sponsored rooms, check sponsor balance
      if (data.isSponsored) {
        const balance =
          data.currency === "USDC"
            ? usdcBalance
            : data.currency === "USDT"
            ? usdtBalance
            : suiBalance;
        if (!balance || balance < (data.sponsorAmount || 0)) {
          throw new Error(
            `Insufficient ${data.currency} balance for sponsorship`
          );
        }
      }

      // Tournament validation
      if (data.mode === "tournament") {
        // Validate elimination type
        if (
          !data.eliminationType ||
          !["single", "round_robin"].includes(data.eliminationType)
        ) {
          throw new Error(
            "Tournament elimination type must be 'single' or 'round_robin'"
          );
        }

        // Validate play mode
        if (
          !data.playMode ||
          !["single", "multiplayer"].includes(data.playMode)
        ) {
          throw new Error(
            "Tournament play mode must be 'single' or 'multiplayer'"
          );
        }

        // Validate minimum participants
        const minParticipants = data.eliminationType === "single" ? 2 : 4;
        if (data.maxPlayers < minParticipants) {
          throw new Error(
            `Minimum ${minParticipants} players required for ${data.eliminationType} tournament`
          );
        }

        // Validate tournament configuration
        if (data.playMode === "multiplayer") {
          // Multiplayer tournament validation
          if (!data.playersPerMatch || data.playersPerMatch < 2) {
            throw new Error(
              "Players per match must be at least 2 for multiplayer tournaments"
            );
          }
        }

        // Validate auto-start for tournaments
        if (data.autoStart && data.maxPlayers < minParticipants) {
          throw new Error(
            `Auto-start requires minimum ${minParticipants} players. Consider disabling auto-start or increasing max players.`
          );
        }
      }

      // Create game instance first (skip for special rooms)
      let instanceData:
        | Database["public"]["Tables"]["game_instances"]["Row"]
        | null = null;
      if (!data.isSpecial) {
        const { data: instance, error: instanceError } = await supabase
          .from("game_instances")
          .insert({
            game_id: data.gameId,
            instance_data: {},
          })
          .select()
          .single();

        if (instanceError) {
          logger.error("Game instance error:", instanceError);
          throw new Error(
            instanceError.message || "Failed to create game instance"
          );
        }
        instanceData = instance;
      }

      // Generate room code for private rooms
      const roomCode = data.isPrivate
        ? Math.random().toString(36).substring(2, 8).toUpperCase()
        : null;

      // On-chain room creation MUST be successful before proceeding with database updates
      if (verifyCoinForRoomCreation(data.currency) && onChainGameRoom) {
        const signer = activeAccount;
        if (!signer)
          throw new Error("Missing wallet signer for on-chain room creation");

        logger.info(`Creating game room on-chain: ${data.name}`);
        logger.debug("Creating game room on-chain:", data);
        const chainResult = await onChainGameRoom.createGameRoom({
          account: signer,
          name: data.name,
          gameId: data.gameId,
          entryFee: data.entryFee || 0,
          maxPlayers: data.maxPlayers,
          isPrivate: data.isPrivate,
          isSpecial: data.isSpecial,
          roomCode: roomCode || "",
          isSponsored: !!data.isSponsored,
          sponsorAmount: data.sponsorAmount || 0,
          winnerSplitRule: data.winnerSplitRule as
            | "winner_takes_all"
            | "top_2"
            | "top_3"
            | "top_4"
            | "top_5"
            | "top_10",
          startTimeMs: data.startTime.getTime(),
          endTimeMs: data.endTime.getTime(),
          currency: data.currency,
        });

        if (!chainResult?.transactionHash) {
          throw new Error(
            "On-chain room creation failed - missing room ID or transaction digest"
          );
        }

        logger.success(
          `Successfully created game room on-chain: ${data.name}`
        );

        // Only proceed with database updates after successful on-chain creation
        const insertPayload: TablesInsert<"game_rooms"> = {
          name: data.name,
          game_id: data.isSpecial ? null : data.gameId,
          game_instance_id: instanceData?.id || null,
          creator_id: user.id,
          entry_fee: data.isSponsored ? 0 : data.entryFee,
          currency: data.currency,
          max_players: data.maxPlayers,
          is_private: data.isPrivate,
          game_name: data.gameName,
          room_code: roomCode,
          // on_chain_room_id: chainResult.roomId,
          on_chain_create_digest: chainResult.transactionHash,
          winner_split_rule:
            data.winnerSplitRule as Database["public"]["Enums"]["winner_split_rule"],
          start_time: data.startTime.toISOString(),
          end_time: data.endTime.toISOString(),
          timezone: data.timezone,
          is_sponsored: data.isSponsored || false,
          is_special: data.isSpecial || false,
          sponsor_amount: data.sponsorAmount || 0,
          total_prize_pool: data.isSponsored
            ? data.sponsorAmount
            : data.entryFee > 0
            ? data.entryFee
            : 0,
          min_players_to_start: 2,
          required_approvals: data.isSpecial ? 2 : 0,
          admin_has_approved: false,
          mode: data.mode as Database["public"]["Enums"]["room_mode"],
          play_mode: data.playMode,
          // Tournament-specific fields (rounds will be calculated when tournament starts)
          tournament_rounds: null, // Will be set when tournament starts based on player count
          round_duration_minutes: null,
          elimination_type:
            data.mode === "tournament" ? data.eliminationType : null,
          max_rounds: null, // Will be calculated automatically
          players_per_match:
            data.mode === "tournament" ? data.playersPerMatch : null,
        };

        const { data: roomData, error: roomError } = await supabase
          .from("game_rooms")
          .insert(insertPayload)
          .select()
          .single();

        if (roomError) {
          logger.error("Room creation error:", roomError);
          throw new Error(roomError.message || "Failed to create room");
        }

        // Update game instance with room_id (only for non-special rooms)
        if (instanceData) {
          await supabase
            .from("game_instances")
            .update({ room_id: roomData.id })
            .eq("id", instanceData.id);
        }

        // For non-sponsored rooms, creator pays entry fee
        // Auto-join creator as first participant
        const { data: creatorJoin, error: creatorJoinError } = await supabase
          .from("game_room_participants")
          .insert({
            room_id: roomData.id,
            user_id: user.id,
            wallet_id: null,
            entry_transaction_id: null,
            join_digest: chainResult.transactionHash,
            payout_digest: null,
            payment_currency: data.currency,
            payment_amount: data.entryFee > 0 ? data.entryFee : 0,
            is_active: true,
          })
          .select()
          .single();
        if (creatorJoin)
          logger.success("Creator auto-joined room", creatorJoin.id);
        if (creatorJoinError) throw creatorJoinError;

        await refreshRooms();
        await refreshBalances();
        await refreshTransactions();

        toast({
          title: "Success",
          description: "Game room created successfully",
        });

        // Send notification to friends/followers about new room
        try {
          if (user && profile) {
            // Get user's friends id. If the user is the requester, add the addressee id, if the user is the addressee, add the requester id
            const friendIds = friends.map((friend) =>
              friend.requester_id !== profile.id
                ? friend.requester_id
                : friend.addressee_id
            );
            await notifyRoomCreated(
              roomData.id,
              roomData.name,
              user.id,
              profile.display_name || profile.username,
              friendIds
            );
          }
        } catch (notificationError) {
          logger.error(
            "Error sending room creation notification:",
            notificationError
          );
          // Don't throw error to prevent breaking room creation
        }

        return roomData as GameRoom;
      } else {
        throw new Error("On-chain room creation is required for USDC rooms");
      }
    } catch (error: unknown) {
      logger.error("Error creating room:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to create game room",
        variant: "destructive",
      });
      throw error;
    } finally {
      setCreating(false);
    }
  };

  // Join a game room
  const joinRoom = async (roomId: string, roomCode?: string) => {
    if (!user) throw new Error("User not authenticated");

    setJoining(true);
    try {
      // Get room details
      const { data: room, error: roomError } = await supabase
        .from("game_rooms")
        .select("*")
        .eq("id", roomId)
        .single();

      if (roomError) throw roomError;

      // Check if room is private and verify code
      if (room.is_private && room.room_code !== roomCode) {
        throw new Error("Invalid room code");
      }

      // Check if room is full
      if (room.current_players >= room.max_players) {
        throw new Error("Room is full");
      }

      // Check if user has sufficient balance (only for non-sponsored rooms)
      if (
        !room.is_sponsored &&
        ((room.currency === "USDC" && usdcBalance < room.entry_fee) ||
          (room.currency === "USDT" && usdtBalance < room.entry_fee))
      ) {
        throw new Error(`Insufficient ${room.currency} balance`);
      }

      // On-chain join MUST be successful before proceeding with database updates
      if (
        verifyCoinForRoomCreation(room.currency) &&
        onChainGameRoom &&
        room.on_chain_room_id
      ) {
        const signer = activeAccount;
        if (!signer) throw new Error("Missing wallet signer for on-chain join");

        logger.info(`Joining room on-chain: ${roomId}`);
        const chainResult = await onChainGameRoom.joinGameRoom({
          isSponsored: room.is_sponsored,
          account: signer,
          roomId: room.on_chain_room_id,
          roomCode: roomCode || "",
          entryFee: room.is_sponsored ? 0 : Number(room.entry_fee || 0),
          currency: room.currency as "USDC" | "USDT",
        });
        logger.success(`Successfully joined room on-chain: ${roomId}`);
        // Only proceed with database updates after successful on-chain join
        const { error: joinError } = await supabase
          .from("game_room_participants")
          .insert({
            room_id: roomId,
            user_id: user.id,
            wallet_id: null,
            entry_transaction_id: null,
            join_digest: chainResult.transactionHash,
            payout_digest: null,
            payment_currency: room.currency,
            payment_amount: room.is_sponsored ? 0 : room.entry_fee,
          });

        if (joinError) throw joinError;
      }

      await refreshBalances();
      await refreshTransactions();
      await refreshRooms();

      toast({
        title: "Success",
        description: "Joined room successfully",
      });

      // Notify other participants about player joining
      try {
        if (user && profile) {
          const room = await getRoomDetails(roomId);
          if (room) {
            const participants = await gameRoomService.getRoomParticipants(
              roomId
            );
            const participantIds = participants
              .filter((p) => p.user_id !== user.id)
              .map((p) => p.user_id)
              .filter(Boolean) as string[];

            if (participantIds.length > 0) {
              await notifyPlayerJoined(
                roomId,
                room.name,
                user.id,
                profile.display_name || profile.username || "Unknown User",
                participantIds
              );
            }
          }
        }
      } catch (notificationError) {
        logger.error(
          "Error sending player joined notification:",
          notificationError
        );
        // Don't throw error to prevent breaking room join
      }
    } catch (error) {
      logger.error("Error joining room:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to join room",
        variant: "destructive",
      });
      throw error;
    } finally {
      setJoining(false);
    }
  };

  // Leave a game room
  const leaveRoom = async (roomId: string) => {
    if (!user) throw new Error("User not authenticated");

    try {
      // Fetch room to check for on-chain id
      const { data: room } = await supabase
        .from("game_rooms")
        .select("id, currency, on_chain_room_id, status")
        .eq("id", roomId)
        .single();

      if (room.status !== "waiting") {
        throw new Error("Can only leave rooms in waiting status");
      }

      // On-chain leave MUST be successful before proceeding with database updates
      if (
        verifyCoinForRoomCreation(room.currency) &&
        onChainGameRoom &&
        room?.on_chain_room_id
      ) {
        const signer = activeAccount;
        if (!signer)
          throw new Error("Missing wallet signer for on-chain leave");

        logger.info(`Leaving room on-chain: ${roomId}`);
        await onChainGameRoom.leaveRoom({
          account: signer,
          roomId: room.on_chain_room_id,
          currency: room.currency as "USDC" | "USDT",
        });
        logger.success(`Successfully left room on-chain: ${roomId}`);
      }

      // Only proceed with database updates after successful on-chain leave
      const { error } = await supabase
        .from("game_room_participants")
        .update({
          is_active: false,
          left_at: new Date().toISOString(),
        })
        .eq("room_id", roomId)
        .eq("user_id", user.id);

      if (error) throw error;

      await refreshRooms();

      toast({
        title: "Success",
        description: "Left room successfully",
      });

      // Notify other participants about player leaving
      try {
        if (user && profile) {
          const room = await getRoomDetails(roomId);
          if (room) {
            const participants = await gameRoomService.getRoomParticipants(
              roomId
            );
            const participantIds = participants
              .filter((p) => p.user_id !== user.id)
              .map((p) => p.user_id)
              .filter(Boolean) as string[];

            if (participantIds.length > 0) {
              await notifyPlayerLeft(
                roomId,
                room.name,
                user.id,
                profile.display_name || profile.username,
                participantIds
              );
            }
          }
        }
      } catch (notificationError) {
        logger.error(
          "Error sending player left notification:",
          notificationError
        );
        // Don't throw error to prevent breaking room leave
      }
    } catch (error) {
      logger.error("Error leaving room:", error);
      toast({
        title: "Error",
        description: "Failed to leave room",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Enhanced cancel room function with proper refunds (no 10% charge)
  const cancelRoom = async (roomId: string) => {
    if (!user) throw new Error("User not authenticated");

    try {
      // Get room and participants
      const { data: room, error: roomError } = await supabase
        .from("game_rooms")
        .select(
          `
          *,
          participants:game_room_participants(*)
        `
        )
        .eq("id", roomId)
        .single();

      if (roomError) throw roomError;

      if (room.creator_id !== user.id) {
        throw new Error("Only room creator can cancel");
      }

      if (room.status !== "waiting") {
        throw new Error("Can only cancel rooms in waiting status");
      }

      logger.info(
        `Cancelling room ${roomId} and refunding ${room.participants.length} participants`
      );

      // On-chain cancel (refunds) MUST be successful before proceeding with database updates
      if (
        verifyCoinForRoomCreation(room.currency) &&
        onChainGameRoom &&
        room.on_chain_room_id
      ) {
        if (!activeAccount)
          throw new Error("Missing wallet signer for on-chain cancel");

        logger.info(`Cancelling room on-chain: ${roomId}`);
        await onChainGameRoom.cancelRoom({
          account: activeAccount,
          roomId: room.on_chain_room_id,
          currency: room.currency as "USDC" | "USDT",
        });
        logger.success(`Successfully cancelled room on-chain: ${roomId}`);

        // Only proceed with database updates after successful on-chain cancel
        // Refund all participants (NO 10% platform fee on cancellations)
        for (const participant of room.participants) {
          if (participant.payment_amount > 0) {
            // Create refund transaction
            const { error: refundError } = await supabase
              .from("transactions")
              .insert({
                user_id: participant.user_id,
                room_id: roomId,
                type: "deposit",
                amount: participant.payment_amount, // Full refund - no platform fee
                currency: participant.payment_currency,
                status: "completed",
                description: `Full refund for cancelled room: ${room.name}`,
              })
              .select()
              .single();

            if (refundError) {
              logger.error("Error creating refund transaction:", refundError);
              continue;
            }
          }
        }

        // If the room was sponsored, refund the sponsor amount too
        if (room.is_sponsored && room.sponsor_amount > 0) {
          // Create sponsor refund transaction
          await supabase.from("transactions").insert({
            user_id: room.creator_id,
            room_id: roomId,
            type: "deposit",
            amount: room.sponsor_amount,
            currency: room.currency,
            status: "completed",
            description: `Sponsor refund for cancelled room: ${room.name}`,
          });
        }

        // Update room status to cancelled
        await supabase
          .from("game_rooms")
          .update({
            status: "cancelled",
            updated_at: new Date().toISOString(),
          })
          .eq("id", roomId);

        await refreshRooms();
        await refreshBalances();
        await refreshTransactions();

        toast({
          title: "Success",
          description: "Room cancelled and all participants fully refunded",
        });

        // Notify all participants about room cancellation
        try {
          if (user && profile) {
            const room = await getRoomDetails(roomId);
            if (room) {
              const participants = await gameRoomService.getRoomParticipants(
                roomId
              );
              const participantIds = participants
                .map((p) => p.user_id)
                .filter(Boolean) as string[];

              if (participantIds.length > 0) {
                await notifyRoomCancelled(
                  roomId,
                  room.name,
                  room.entry_fee.toString(),
                  participantIds
                );
              }
            }
          }
        } catch (notificationError) {
          logger.error(
            "Error sending room cancelled notification:",
            notificationError
          );
          // Don't throw error to prevent breaking room cancellation
        }
      } else {
        throw new Error("Room cannot be cancelled without on-chain support");
      }
    } catch (error: unknown) {
      logger.error("Error cancelling room:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to cancel room",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Get room details
  const getRoomDetails = async (roomId: string): Promise<GameRoom | null> => {
    try {
      const { data, error } = await supabase
        .from("game_rooms")
        .select(
          `
          *,
          game:games(*),
          creator:profiles(*),
          participants:game_room_participants(
            *,
            user:profiles(*)
          )
        `
        )
        .eq("id", roomId)
        .single();

      if (error) throw error;
      return data as unknown as GameRoom;
    } catch (error) {
      logger.error("Error fetching room details:", error);
      return null;
    }
  };

  // Initiate room completion (sets flag for participants to approve)
  const initiateRoomCompletion = async (roomId: string) => {
    try {
      if (!user) throw new Error("User not authenticated");

      // Get room details to verify user is creator
      const { data: room, error: roomError } = await supabase
        .from("game_rooms")
        .select("*, participants:game_room_participants(*)")
        .eq("id", roomId)
        .single();

      if (roomError) throw roomError;
      if (!room) throw new Error("Room not found");
      if (!room.is_special) throw new Error("Room is not a special room");
      if (room.creator_id !== user.id)
        throw new Error("Only room creator can initiate completion");

      // Validate that all participants have valid scores
      const participants = room.participants || [];
      const hasValidScores = participants.every(
        (p) => p.score !== null && p.score !== undefined && p.score >= 0
      );

      if (!hasValidScores) {
        throw new Error(
          "All participants must have valid scores before initiating completion"
        );
      }

      // Update room for users to start signing for completion approval
      await supabase
        .from("game_rooms")
        .update({
          start_signing: true,
        })
        .eq("id", roomId);

      logger.info(`Room completion initiated for room ${roomId}`);

      toast({
        title: "Completion Initiated",
        description:
          "Room completion process has been started. Participants can now provide their approval.",
      });

      // Refresh rooms to update UI
      await refreshRooms();
    } catch (error) {
      logger.error("Error initiating room completion:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to initiate completion",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Manual complete game function (for special room admin use)
  const completeGame = async (roomId: string) => {
    try {
      if (!user) throw new Error("User not authenticated");

      // Get room details
      const { data: roomData, error: roomError } = await supabase
        .from("game_rooms")
        .select("*, participants:game_room_participants(*, user:profiles(*))")
        .eq("id", roomId)
        .single();

      if (roomError) throw roomError;
      if (!roomData) throw new Error("Room not found");
      if (!roomData.is_special) throw new Error("Room is not a special room");

      // Verify user is the room creator
      if (roomData.creator_id !== user.id) {
        throw new Error("Only room creator can complete special rooms");
      }

      // Check if completion is already in progress
      if (roomData.completion_in_progress) {
        throw new Error(
          "Room completion is already in progress. Please wait or refresh to see the latest status."
        );
      }

      await gameRoomService.autoCompleteGame(roomData);
      logger.success(`Successfully completed room ${roomId}`);
    } catch (error) {
      logger.error("Error completing special room:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to complete game",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Special room signature functions
  const approveGameRoomCompletion = async (roomId: string) => {
    try {
      if (!user) throw new Error("User not authenticated");

      const signer = activeAccount;
      if (!signer) throw new Error("Wallet not connected");

      // Get room details to determine currency
      const room = await getRoomDetails(roomId);
      if (!room) throw new Error("Room not found");
      if (!room.is_special) throw new Error("Room is not a special room");

      // Debug: Log room details
      logger.debug(`[DEBUG] Room details:`, {
        roomId,
        onChainRoomId: room.on_chain_room_id,
        currency: room.currency,
        isSpecial: room.is_special,
        creatorId: room.creator_id,
        participants: room.participants?.map((p) => ({
          userId: p.user_id,
          isActive: p.is_active,
        })),
      });

      if (!onChainGameRoom)
        throw new Error("On-chain integration not available");

      // Call the smart contract function
      // await onChainGameRoom.approveGameRoomCompletion({
      //   walletKeyPair: signer,
      //   roomId: room.on_chain_room_id || roomId,
      //   currency: room.currency as "USDC" | "USDT",
      // });

      // Update database to track the signature
      const isCreator = room.creator_id === user.id;
      const isParticipant = room.participants?.some(
        (p) => p.user_id === user.id && p.is_active
      );

      if (!isCreator && !isParticipant) {
        throw new Error("User not authorized to sign for this room");
      }

      // Update approval status based on who is approving
      const updates: Partial<
        Database["public"]["Tables"]["game_rooms"]["Update"]
      > = {};

      if (isCreator) {
        updates.admin_has_approved = true;
      } else if (isParticipant) {
        updates.participant_has_approved = true;
      }

      // Insert approval record
      await supabase.from("approvals").insert({
        participant_id: isParticipant ? user.id : null,
        room_id: roomId,
        created_at: new Date().toISOString(),
      });

      logger.info("Signature submitted:", {
        room_id: roomId,
        user_id: user.id,
        is_creator: isCreator,
        is_participant: isParticipant,
        timestamp: new Date().toISOString(),
      });

      // Update room approval status
      if (Object.keys(updates).length > 0) {
        await supabase
          .from("game_rooms")
          .update({
            ...updates,
            updated_at: new Date().toISOString(),
          })
          .eq("id", roomId);
      }

      logger.success(
        `Signature submitted for room ${roomId} by ${
          isCreator ? "creator" : "participant"
        }`
      );

      // Refresh rooms to update UI
      await refreshRooms();

      toast({
        title: "Success",
        description: "Signature submitted successfully",
      });
    } catch (error) {
      logger.error("Error approving game room completion:", error);
      toast({
        title: "Error",
        description: "Failed to submit signature",
        variant: "destructive",
      });
      throw error;
    }
  };

  const getSignaturesAndStatus = async (roomId: string) => {
    try {
      if (!user) throw new Error("User not authenticated");

      // Get room details and signatures from database
      const { data: room, error } = await supabase
        .from("game_rooms")
        .select(
          `
          required_approvals, is_special, admin_has_approved, participant_has_approved`
        )
        .eq("id", roomId)
        .single();
      if (error) throw error;
      if (!room) throw new Error("Room not found");
      if (!room.is_special) throw new Error("Room is not a special room");
      const required = room.required_approvals || 2;
      const hasCreatorSignature = room.admin_has_approved;
      const hasParticipantSignature = room.participant_has_approved;
      let collected = 0;
      if (hasCreatorSignature) collected++;
      if (hasParticipantSignature) collected++;

      const { data: signers, error: signersError } = await supabase
        .from("approvals")
        .select("*")
        .eq("room_id", roomId);
      if (signersError) throw signersError;
      const signatures = {
        collected,
        required,
        hasCreatorSignature,
        hasParticipantSignature,
        signers,
      };

      logger.debug("Signature status for room", roomId, signatures);
      return signatures;
    } catch (error) {
      logger.error("Error getting signature status:", error);
      return {
        collected: 0,
        required: 2,
        hasCreatorSignature: false,
        hasParticipantSignature: false,
        signers: [],
      };
    }
  };
  // Load rooms when user changes, currentPage changes, or filters change
  useEffect(() => {
    if (user) {
      fetchRooms(true);
    } else {
      setRooms([]);
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, currentPage]);

  // Enhanced useEffect to periodically check for expired games
  useEffect(() => {
    if (!user) return;

    // Check for expired games every 60 seconds (reduced from 30s to minimize redundant checks)
    const expiredGamesInterval = setInterval(() => {
      gameRoomService.autoCompleteExpiredGames();
    }, 60000);

    // Also check immediately
    gameRoomService.autoCompleteExpiredGames();

    return () => {
      clearInterval(expiredGamesInterval);
    };
  }, [user]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!user) return;

    const roomsSubscription = supabase
      .channel("game_rooms_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "game_rooms",
        },
        () => {
          fetchRooms(true);
        }
      )
      .subscribe();

    const participantsSubscription = supabase
      .channel("participants_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "game_room_participants",
        },
        () => {
          fetchRooms(true);
        }
      )
      .subscribe();

    return () => {
      roomsSubscription.unsubscribe();
      participantsSubscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const value: GameRoomContextType = {
    rooms,
    loading,
    creating,
    joining,
    // Pagination state
    currentPage,
    totalPages,
    totalRooms,
    roomsPerPage,
    // Filter state
    filters,
    // Pagination functions
    goToPage: async (page: number) => {
      setCurrentPage(page);
      await fetchRooms(false);
    },
    nextPage: async () => {
      setCurrentPage((prev) => Math.min(prev + 1, totalPages));
      await fetchRooms(false);
    },
    prevPage: async () => {
      setCurrentPage((prev) => Math.max(prev - 1, 1));
      await fetchRooms(false);
    },
    refreshRooms,
    // Filter functions
    setFilters,
    clearFilters,
    applyFilters,
    createRoom,
    joinRoom,
    leaveRoom,
    cancelRoom,
    getRoomDetails,
    updateGameScore,
    // Admin score management functions
    updateParticipantScore,
    initiateRoomCompletion,
    completeGame,
    playGame,
    handleGameMessage,
    // Special room signature functions
    approveGameRoomCompletion,
    getSignaturesAndStatus,
    refreshRoom,
  };

  return (
    <GameRoomContext.Provider value={value}>
      {children}
    </GameRoomContext.Provider>
  );
};
