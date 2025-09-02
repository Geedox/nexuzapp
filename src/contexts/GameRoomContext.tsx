import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useWallet } from "@/contexts/WalletContext";
import { Profile, useProfile } from "@/contexts/ProfileContext";
import { Ed25519Keypair } from "@mysten/sui.js/keypairs/ed25519";
import { GameRoom as OnChainGameRoom } from "@/integrations/smartcontracts/gameRoom";
import { useMemo } from "react";
import { useTransaction } from "@/contexts/TransactionContext";
import type { Database, TablesInsert } from "@/integrations/supabase/types";
import { logger } from "@/utils/logger";

interface GameRoom {
  id: string;
  name: string;
  game_id: string;
  game_instance_id: string | null;
  creator_id: string;
  entry_fee: number;
  currency: Database["public"]["Enums"]["currency_type"];
  max_players: number;
  current_players: number;
  min_players_to_start: number;
  is_private: boolean;
  room_code: string | null;
  is_sponsored: boolean;
  sponsor_amount: number;
  winner_split_rule: Database["public"]["Enums"]["winner_split_rule"];
  status: Database["public"]["Enums"]["room_status"];
  start_time: string;
  end_time: string;
  actual_start_time: string | null;
  actual_end_time: string | null;
  total_prize_pool: number;
  platform_fee_collected: number;
  on_chain_create_digest: string | null;
  on_chain_room_id: string | null;
  created_at: string;
  updated_at: string;
  game?: any;
  creator?: any;
  participants?: GameRoomParticipant[];
}

interface GameSession {
  roomId: string;
  userId: string;
  sessionToken: string;
  gameUrl: string;
  startTime: Date;
}

interface GameRoomParticipant {
  id: string;
  room_id: string;
  user_id: string;
  wallet_id: string;
  entry_transaction_id: string | null;
  payment_currency: Database["public"]["Enums"]["currency_type"];
  payment_amount: number;
  score: number;
  final_position: number | null;
  earnings: number;
  payout_transaction_id: string | null;
  joined_at: string;
  left_at: string | null;
  is_active: boolean;
  user?: any;
}

export interface CreateRoomData {
  name: string;
  gameId: string;
  entryFee: number;
  currency: Extract<
    Database["public"]["Enums"]["currency_type"],
    "USDC" | "USDT"
  >;
  maxPlayers: number;
  isPrivate: boolean;
  winnerSplitRule: Database["public"]["Enums"]["winner_split_rule"];
  startTime: Date;
  endTime: Date;
  isSponsored?: boolean;
  sponsorAmount?: number;
}

export interface GameRoomFilters {
  status?: Database["public"]["Enums"]["room_status"][];
  currency?: Database["public"]["Enums"]["currency_type"][];
  isPrivate?: boolean;
  isSponsored?: boolean;
  minEntryFee?: number;
  maxEntryFee?: number;
  minPlayers?: number;
  maxPlayers?: number;
  gameId?: string;
  creatorId?: string;
  sortBy?:
    | "created_at"
    | "start_time"
    | "end_time"
    | "entry_fee"
    | "total_prize_pool"
    | "current_players";
  sortOrder?: "asc" | "desc";
  searchQuery?: string;
}

interface GameRoomContextType {
  rooms: GameRoom[];
  loading: boolean;
  creating: boolean;
  joining: boolean;
  // Pagination state
  currentPage: number;
  totalPages: number;
  totalRooms: number;
  roomsPerPage: number;
  // Filter state
  filters: GameRoomFilters;
  // Pagination functions
  goToPage: (page: number) => Promise<void>;
  nextPage: () => Promise<void>;
  prevPage: () => Promise<void>;
  refreshRooms: () => Promise<void>;
  // Filter functions
  setFilters: (filters: Partial<GameRoomFilters>) => void;
  clearFilters: () => void;
  applyFilters: () => Promise<void>;
  createRoom: (data: CreateRoomData) => Promise<GameRoom>;
  joinRoom: (roomId: string, roomCode?: string) => Promise<void>;
  leaveRoom: (roomId: string) => Promise<void>;
  cancelRoom: (roomId: string) => Promise<void>;
  getRoomDetails: (roomId: string) => Promise<GameRoom | null>;
  getRoomParticipants: (roomId: string) => Promise<GameRoomParticipant[]>;
  updateGameScore: (
    roomId: string,
    score: number,
    userId?: string
  ) => Promise<{ updated: boolean; previousScore: number; newScore: number }>;
  completeGame: (
    roomId: string,
    winners: { userId: string; position: number }[]
  ) => Promise<void>;
  playGame: (roomId: string) => Promise<void>;
  handleGameMessage: (event: MessageEvent) => void;
}

const GameRoomContext = createContext<GameRoomContextType | undefined>(
  undefined
);

export const useGameRoom = () => {
  const context = useContext(GameRoomContext);
  if (context === undefined) {
    throw new Error("useGameRoom must be used within a GameRoomProvider");
  }
  return context;
};

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
  const [roomsPerPage] = useState(12); // Show 12 rooms per page (3x4 grid)
  // Filter state
  const [filters, setFiltersState] = useState<GameRoomFilters>({
    sortBy: "created_at",
    sortOrder: "desc",
  });
  const { user } = useAuth();
  const { toast } = useToast();
  const { suiClient, refreshBalances, usdcBalance, usdtBalance, suiBalance } =
    useWallet();
  const { profile } = useProfile();
  const [activeGameSessions, setActiveGameSessions] = useState<
    Map<string, GameSession>
  >(new Map());

  const onChainGameRoom = useMemo(() => {
    logger.debug("Creating onChainGameRoom instance...");
    logger.debug("suiClient available:", !!suiClient);
    logger.debug(
      "suiClient details:",
      suiClient ? "Connected" : "Not connected"
    );

    try {
      if (!suiClient) {
        logger.debug("No suiClient available, returning null");
        return null;
      }

      logger.debug("Attempting to create OnChainGameRoom instance...");
      const instance = new OnChainGameRoom(suiClient);
      logger.debug(
        "OnChainGameRoom instance created successfully:",
        !!instance
      );
      return instance;
    } catch (error) {
      logger.error("[DEBUG] Error creating OnChainGameRoom:", error);
      logger.trace("[DEBUG] Error details:", {
        message: error.message,
        stack: error.stack,
        name: error.name,
      });
      return null;
    }
  }, [suiClient]);

  const getWalletKeypair = (): Ed25519Keypair | null => {
    try {
      const hex = profile?.sui_wallet_data?.privateKey as string | undefined;
      if (!hex || typeof hex !== "string" || hex.length < 64) return null;
      const bytes = new Uint8Array(32);
      for (let i = 0; i < 32; i++) {
        bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
      }
      return Ed25519Keypair.fromSecretKey(bytes);
    } catch (e) {
      logger.warn("Unable to derive wallet keypair for on-chain ops:", e);
      return null;
    }
  };
  const { refreshTransactions } = useTransaction();

  // Function to get prize split percentages based on winner split rule
  const getPrizeSplitPercentages = (splitRule: string) => {
    const splits = {
      winner_takes_all: [{ position: 1, percentage: 100 }],
      top_2: [
        { position: 1, percentage: 60 },
        { position: 2, percentage: 40 },
      ],
      top_3: [
        { position: 1, percentage: 50 },
        { position: 2, percentage: 30 },
        { position: 3, percentage: 20 },
      ],
      top_4: [
        { position: 1, percentage: 40 },
        { position: 2, percentage: 30 },
        { position: 3, percentage: 20 },
        { position: 4, percentage: 10 },
      ],
      top_5: [
        { position: 1, percentage: 30 },
        { position: 2, percentage: 25 },
        { position: 3, percentage: 20 },
        { position: 4, percentage: 15 },
        { position: 5, percentage: 10 },
      ],
      top_10: [
        { position: 1, percentage: 20 },
        { position: 2, percentage: 15 },
        { position: 3, percentage: 12 },
        { position: 4, percentage: 10 },
        { position: 5, percentage: 8 },
        { position: 6, percentage: 8 },
        { position: 7, percentage: 7 },
        { position: 8, percentage: 7 },
        { position: 9, percentage: 7 },
        { position: 10, percentage: 6 },
      ],
    };

    return splits[splitRule];
  };

  // Function to determine winners based on scores and split rule
  const determineWinners = (participants: any[], splitRule: string) => {
    // Sort participants by score in descending order
    const sortedParticipants = [...participants].sort(
      (a, b) => (b.score || 0) - (a.score || 0)
    );

    const winnerCounts = {
      winner_takes_all: 1,
      top_2: 2,
      top_3: 3,
      top_4: 4,
      top_5: 5,
      top_10: 10,
    };

    const maxWinners = winnerCounts[splitRule] || 1;
    const actualWinners = Math.min(maxWinners, sortedParticipants.length);

    return sortedParticipants
      .slice(0, actualWinners)
      .map((participant, index) => ({
        userId: participant.user_id,
        position: index + 1,
        participantId: participant.id,
      }));
  };

  // Function to map on-chain transaction effects to winners
  const mapOnChainTransactionToWinners = (
    onChainResult: any,
    winners: any[],
    room: any
  ) => {
    if (!onChainResult?.effects || !onChainResult?.events) {
      return null;
    }

    const transactionMapping: any = {
      digest: onChainResult.digest,
      roomId: room.on_chain_room_id,
      effects: onChainResult.effects,
      events: onChainResult.events,
      gameCompletedEvent: onChainResult.gameCompletedEvent,
      winnerTransactions: [],
    };

    // Extract transfer events for winners
    const transferEvents = onChainResult.events.filter(
      (ev: any) =>
        ev.type === "0x2::coin::TransferEvent" ||
        ev.type.includes("TransferEvent")
    );

    // Map transfers to winners based on addresses
    for (const winner of winners) {
      const participant = room.participants?.find(
        (p: any) => p.user_id === winner.userId
      );
      if (participant?.user?.sui_wallet_data?.address) {
        const winnerAddress = participant.user.sui_wallet_data.address;

        // Find transfer event for this winner
        const transferEvent = transferEvents.find((ev: any) => {
          const eventData = ev.parsedJson || ev.data;
          return (
            eventData?.recipient === winnerAddress ||
            eventData?.to === winnerAddress ||
            ev.recipient === winnerAddress
          );
        });

        if (transferEvent) {
          transactionMapping.winnerTransactions.push({
            userId: winner.userId,
            position: winner.position,
            address: winnerAddress,
            transferEvent: transferEvent,
            amount:
              transferEvent.parsedJson?.amount ||
              transferEvent.data?.amount ||
              0,
          });
        }
      }
    }

    return transactionMapping;
  };

  // Updated distributePrizes function with profile updates and on-chain transaction mapping
  const distributePrizes = async (
    room: any,
    participants: any[],
    winners: any[],
    onChainResult?: any
  ) => {
    try {
      logger.info(`Starting prize distribution for room ${room.id}`);

      // Calculate platform fee (10%)
      const platformFee = room.total_prize_pool * 0.07;
      const distributablePrize = room.total_prize_pool - platformFee;

      // Get prize split percentages
      const prizeSplits = getPrizeSplitPercentages(room.winner_split_rule);

      logger.info(`Prize distribution details:`, {
        totalPrizePool: room.total_prize_pool,
        platformFee,
        distributablePrize,
        winnersCount: winners.length,
      });

      // Track users who need profile updates
      const usersToUpdateProfile = new Set<string>();

      // Update participant positions and distribute prizes
      for (const winner of winners) {
        const split = prizeSplits.find((s) => s.position === winner.position);
        if (!split) continue;

        const earnings = distributablePrize * (split.percentage / 100);

        // Find participant data
        const participant = participants.find(
          (p) => p.user_id === winner.userId
        );
        if (!participant) continue;

        logger.info(
          `Processing winner - Position ${winner.position}: ${earnings} ${room.currency}`
        );

        // Update participant with final position and earnings
        const { error: participantError } = await supabase
          .from("game_room_participants")
          .update({
            final_position: winner.position,
            earnings: earnings,
          })
          .eq("room_id", room.id)
          .eq("user_id", winner.userId);

        if (participantError) {
          logger.error("Error updating participant:", participantError);
          continue;
        }

        // Create winning transaction with on-chain verification details
        const transactionData: any = {
          user_id: winner.userId,
          room_id: room.id,
          type: "win",
          amount: earnings,
          currency: room.currency,
          status: "completed",
          description: `Winnings from room: ${room.name} (Position: ${winner.position})`,
        };

        // Add on-chain transaction details if available
        if (onChainResult?.digest) {
          transactionData.on_chain_digest = onChainResult.digest;
          transactionData.on_chain_room_id = room.on_chain_room_id;

          // Add platform fee information from on-chain event if available
          if (onChainResult.gameCompletedEvent?.platform_fee) {
            transactionData.platform_fee =
              onChainResult.gameCompletedEvent.platform_fee;
          }

          // Map on-chain transaction to this specific winner
          const transactionMapping = mapOnChainTransactionToWinners(
            onChainResult,
            [winner],
            room
          );
          if (transactionMapping?.winnerTransactions?.[0]) {
            const winnerTx = transactionMapping.winnerTransactions[0];
            transactionData.on_chain_transfer_event = JSON.stringify(
              winnerTx.transferEvent
            );
            transactionData.on_chain_transfer_amount = winnerTx.amount;
          }
        }

        const { data: transaction, error: txError } = await supabase
          .from("transactions")
          .insert(transactionData)
          .select()
          .single();

        if (txError) {
          logger.error("Error creating transaction:", txError);
          continue;
        }

        // Update payout transaction id
        await supabase
          .from("game_room_participants")
          .update({ payout_transaction_id: transaction.id })
          .eq("room_id", room.id)
          .eq("user_id", winner.userId);

        // Try to record in winners table (optional - if table exists)
        try {
          await supabase.from("game_room_winners").insert({
            room_id: room.id,
            participant_id: participant.id,
            position: winner.position,
            prize_percentage: split.percentage,
            prize_amount: earnings,
          });
        } catch (winnersTableError) {
          logger.debug("Winners table might not exist:", winnersTableError);
        }

        // Update game-specific leaderboard
        const isFirstPlace = winner.position === 1;
        const currentScore = participant.score || 0;

        try {
          // Update or create game-specific leaderboard entry
          const { data: existingGameEntry } = await supabase
            .from("leaderboards")
            .select("*")
            .eq("user_id", winner.userId)
            .eq("game_id", room.game_id)
            .eq("period", "all-time")
            .single();

          if (existingGameEntry) {
            await supabase
              .from("leaderboards")
              .update({
                total_score: Math.max(
                  existingGameEntry.total_score || 0,
                  currentScore
                ),
                games_played: (existingGameEntry.games_played || 0) + 1,
                wins: (existingGameEntry.wins || 0) + (isFirstPlace ? 1 : 0),
                total_earnings:
                  (existingGameEntry.total_earnings || 0) + earnings,
                updated_at: new Date().toISOString(),
              })
              .eq("id", existingGameEntry.id);
          } else {
            await supabase.from("leaderboards").insert({
              user_id: winner.userId,
              game_id: room.game_id,
              period: "all-time",
              total_score: currentScore,
              games_played: 1,
              wins: isFirstPlace ? 1 : 0,
              total_earnings: earnings,
            });
          }

          // Update or create global leaderboard entry (game_id = NULL)
          const { data: existingGlobal } = await supabase
            .from("leaderboards")
            .select("*")
            .eq("user_id", winner.userId)
            .is("game_id", null)
            .eq("period", "all-time")
            .single();

          if (existingGlobal) {
            await supabase
              .from("leaderboards")
              .update({
                games_played: (existingGlobal.games_played || 0) + 1,
                wins: (existingGlobal.wins || 0) + (isFirstPlace ? 1 : 0),
                total_earnings: (existingGlobal.total_earnings || 0) + earnings,
                updated_at: new Date().toISOString(),
              })
              .eq("id", existingGlobal.id);
          } else {
            await supabase.from("leaderboards").insert({
              user_id: winner.userId,
              game_id: null,
              period: "all-time",
              total_score: 0,
              games_played: 1,
              wins: isFirstPlace ? 1 : 0,
              total_earnings: earnings,
            });
          }

          logger.success(
            `Updated leaderboards for user ${winner.userId}: position=${winner.position}, earnings=${earnings}`
          );
        } catch (leaderboardError) {
          logger.error("Leaderboard update failed:", leaderboardError);
        }

        // Mark user for profile update
        usersToUpdateProfile.add(winner.userId);
      }

      // Update leaderboard for non-winners (they played a game but didn't win)
      for (const participant of participants) {
        const isWinner = winners.some((w) => w.userId === participant.user_id);
        if (isWinner) continue; // Already handled above

        try {
          const currentScore = participant.score || 0;

          // Update game-specific leaderboard for non-winner
          const { data: existingEntry } = await supabase
            .from("leaderboards")
            .select("*")
            .eq("user_id", participant.user_id)
            .eq("game_id", room.game_id)
            .eq("period", "all-time")
            .single();

          if (existingEntry) {
            await supabase
              .from("leaderboards")
              .update({
                total_score: Math.max(
                  existingEntry.total_score || 0,
                  currentScore
                ),
                games_played: (existingEntry.games_played || 0) + 1,
                updated_at: new Date().toISOString(),
              })
              .eq("id", existingEntry.id);
          } else {
            await supabase.from("leaderboards").insert({
              user_id: participant.user_id,
              game_id: room.game_id,
              period: "all-time",
              total_score: currentScore,
              games_played: 1,
              wins: 0,
              total_earnings: 0,
            });
          }

          // Update global leaderboard for non-winner
          const { data: existingGlobal } = await supabase
            .from("leaderboards")
            .select("*")
            .eq("user_id", participant.user_id)
            .is("game_id", null)
            .eq("period", "all-time")
            .single();

          if (existingGlobal) {
            await supabase
              .from("leaderboards")
              .update({
                games_played: (existingGlobal.games_played || 0) + 1,
                updated_at: new Date().toISOString(),
              })
              .eq("id", existingGlobal.id);
          } else {
            await supabase.from("leaderboards").insert({
              user_id: participant.user_id,
              game_id: null,
              period: "all-time",
              total_score: 0,
              games_played: 1,
              wins: 0,
              total_earnings: 0,
            });
          }

          // Mark user for profile update
          usersToUpdateProfile.add(participant.user_id);
        } catch (error) {
          logger.error(
            `Error updating leaderboard for non-winner ${participant.user_id}:`,
            error
          );
        }
      }

      // Update profile stats for all affected users using the SQL function
      logger.info(
        `Updating profile stats for ${usersToUpdateProfile.size} users`
      );
      for (const userId of usersToUpdateProfile) {
        try {
          await supabase.rpc("update_user_profile_stats", {
            p_user_id: userId,
          });
          logger.success(`Profile stats updated for user ${userId}`);
        } catch (profileError) {
          logger.error(
            `Error updating profile stats for user ${userId}:`,
            profileError
          );

          // Fallback: manual profile update
          try {
            // Get aggregated stats from transactions
            const { data: userTransactions } = await supabase
              .from("transactions")
              .select("type, amount")
              .eq("user_id", userId)
              .eq("status", "completed");

            if (userTransactions) {
              const totalEarnings = userTransactions
                .filter((t) => t.type === "win")
                .reduce((sum, t) => sum + Number(t.amount), 0);

              const totalWins = userTransactions.filter(
                (t) => t.type === "win"
              ).length;

              const { data: gameRooms } = await supabase
                .from("game_room_participants")
                .select("room_id")
                .eq("user_id", userId)
                .eq("is_active", true);

              const totalGames = gameRooms ? gameRooms.length : 0;
              const experiencePoints = totalGames * 100 + totalWins * 500;

              await supabase
                .from("profiles")
                .update({
                  total_earnings: totalEarnings,
                  total_wins: totalWins,
                  total_games_played: totalGames,
                  experience_points: experiencePoints,
                  level: Math.max(1, Math.floor(experiencePoints / 1000)),
                  updated_at: new Date().toISOString(),
                })
                .eq("id", userId);

              logger.success(
                `Manual profile update completed for user ${userId}`
              );
            }
          } catch (fallbackError) {
            logger.debug(
              `Fallback profile update also failed for user ${userId}:`,
              fallbackError
            );
          }
        }
      }

      // Update room status to completed
      await supabase
        .from("game_rooms")
        .update({
          status: "completed",
          actual_end_time: new Date().toISOString(),
          platform_fee_collected: platformFee,
        })
        .eq("id", room.id);

      // Store complete transaction mapping in database for verification
      if (onChainResult?.digest) {
        try {
          const transactionMapping = mapOnChainTransactionToWinners(
            onChainResult,
            winners,
            room
          );
          if (transactionMapping) {
            // Store the mapping in a dedicated table or as JSON in the room
            await supabase
              .from("game_rooms")
              .update({
                on_chain_completion_digest: onChainResult.digest,
                on_chain_completion_events: JSON.stringify(
                  onChainResult.events
                ),
                on_chain_completion_effects: JSON.stringify(
                  onChainResult.effects
                ),
                on_chain_completion_mapping: JSON.stringify(transactionMapping),
                updated_at: new Date().toISOString(),
              })
              .eq("id", room.id);

            logger.success(
              `Stored on-chain transaction mapping for room ${room.id}`
            );
          }
        } catch (mappingError) {
          logger.error("Error storing transaction mapping:", mappingError);
          // Don't fail the entire operation for mapping storage errors
        }
      }

      logger.success(
        `Successfully completed game room ${room.id} and updated ${usersToUpdateProfile.size} user profiles`
      );
    } catch (error) {
      logger.error("Error distributing prizes:", error);
      throw error;
    }
  };

  const generateSessionToken = (): string => {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

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
        (p: any) => p.user_id === user.id && p.is_active
      );

      if (!userParticipant) {
        throw new Error("You must join the room before playing");
      }

      // Check if room is ongoing
      if (room.status !== "ongoing") {
        throw new Error("Room is not currently active for playing");
      }

      // Generate session token
      const sessionToken = generateSessionToken();

      // Create game session
      const gameSession: GameSession = {
        roomId: room.id,
        userId: user.id,
        sessionToken,
        gameUrl: room.game?.game_url || "",
        startTime: new Date(),
      };

      // Store session
      setActiveGameSessions(
        (prev) => new Map(prev.set(sessionToken, gameSession))
      );

      // Construct game URL with parameters
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
      // gameUrl.searchParams.set('instructions', room.game?.instructions || '');
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
    } catch (error: any) {
      logger.error("Error launching game:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to launch game",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Updated handleGameMessage - DON'T remove session after score submission
  // Updated handleGameMessage - Don't delete session on EXIT_GAME
  const handleGameMessage = async (event: MessageEvent) => {
    // Verify the origin
    const allowedOrigins = [
      "https://cheerful-entremet-2dbb07.netlify.app",
      "https://stirring-unicorn-441851.netlify.app",
      "https://ornate-lamington-115e41.netlify.app",
    ];
    if (!allowedOrigins.includes(event.origin)) {
      logger.debug("Message from unauthorized origin:", event.origin);
      return;
    }

    const { type, score, userId, roomId, sessionToken, metadata } = event.data;

    logger.debug("Received message:", {
      type,
      score,
      userId,
      roomId,
      sessionToken,
    });
    logger.debug("Available sessions:", Array.from(activeGameSessions.keys()));

    if (type === "SUBMIT_SCORE") {
      try {
        // Verify session
        const session = activeGameSessions.get(sessionToken);
        if (!session) {
          logger.error("Invalid session token:", sessionToken);
          logger.debug(
            "Available sessions:",
            Array.from(activeGameSessions.keys())
          );

          // Send error back to game
          if (event.source) {
            event.source.postMessage(
              {
                type: "SCORE_SUBMISSION_ERROR",
                error: "Invalid session token",
              },
              event.origin
            );
          }
          return;
        }

        if (session.userId !== userId || session.roomId !== roomId) {
          logger.error("Session validation failed");
          return;
        }

        // Update score in database
        const result = await updateGameScore(roomId, score, userId);

        // KEEP session active - don't remove it here

        // Send success response back to game
        if (event.source) {
          event.source.postMessage(
            {
              type: "SCORE_SUBMISSION_SUCCESS",
              updated: result.updated,
              previousScore: result.previousScore,
              newScore: result.newScore,
            },
            event.origin
          );
        }

        // Show appropriate message
        if (result.updated) {
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
            event.origin
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
      // DON'T clean up session on exit - keep it for when user returns
      logger.debug(
        "User exited game, but keeping session active:",
        sessionToken
      );
    } else if (type === "GAME_READY") {
      // Game is ready, session should still be active
      logger.debug("Game ready, session:", sessionToken);
    }
  };

  // Add message listener in useEffect
  useEffect(() => {
    // Listen for messages from game windows
    window.addEventListener("message", handleGameMessage);

    return () => {
      window.removeEventListener("message", handleGameMessage);
    };
  }, []);

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

      // Remove expired sessions
      if (sessionsToDelete.length > 0) {
        setActiveGameSessions((prev) => {
          const newMap = new Map(prev);
          sessionsToDelete.forEach((token) => newMap.delete(token));
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
  }, [rooms, activeGameSessions]);

  // Function to automatically complete a single game
  const autoCompleteGame = async (room: any) => {
    try {
      logger.info(`Auto-completing game room: ${room.id} (${room.name})`);

      // Call smart contract first to complete the game on-chain
      let onChainResult = null;
      try {
        if (
          room.currency === "USDC" &&
          onChainGameRoom &&
          room.on_chain_room_id
        ) {
          const signer = getWalletKeypair();
          if (!signer) {
            throw new Error(
              `Cannot complete game ${room.id} on-chain: Missing wallet signer`
            );
            // Continue with database completion as fallback
          } else {
            logger.info(`Completing game on-chain for room ${room.id}`);

            // Get all active participants with their scores for on-chain completion
            const { data: participants } = await supabase
              .from("game_room_participants")
              .select("*, user:profiles(*)")
              .eq("room_id", room.id)
              .eq("is_active", true)
              .order("score", { ascending: false });

            if (participants && participants.length > 0) {
              // Determine winners for on-chain completion
              const winners = determineWinners(
                participants,
                room.winner_split_rule
              );
              const winnerAddresses: string[] = [];
              const scores: number[] = [];

              for (const winner of winners) {
                const participant = participants.find(
                  (p: any) => p.user_id === winner.userId
                );
                const addr = (
                  participant?.user
                    ?.sui_wallet_data as Profile["sui_wallet_data"]
                )?.address;
                if (addr) {
                  winnerAddresses.push(addr);
                  scores.push(Number(participant?.score || 0));
                }
              }

              if (winnerAddresses.length > 0) {
                onChainResult = await onChainGameRoom.completeGame({
                  walletKeyPair: signer,
                  roomId: room.on_chain_room_id,
                  winnerAddresses,
                  scores,
                });
                if (!onChainResult?.digest) {
                  throw new Error(
                    `Failed to complete game on-chain for room ${room.id}: Missing transaction digest`
                  );
                }
                logger.success(
                  `Successfully completed game on-chain for room ${room.id} with digest: ${onChainResult.digest}`
                );
              }
            }
          }
        }
      } catch (onChainError) {
        logger.error(
          `Failed to complete game on-chain for room ${room.id}:`,
          onChainError
        );
        throw onChainError;
      }

      // Get all active participants with their scores
      const { data: participants } = await supabase
        .from("game_room_participants")
        .select("*")
        .eq("room_id", room.id)
        .eq("is_active", true)
        .order("score", { ascending: false });

      if (!participants || participants.length === 0) {
        // No participants - just mark as completed
        await supabase
          .from("game_rooms")
          .update({
            status: "completed",
            actual_end_time: new Date().toISOString(),
            platform_fee_collected: 0,
          })
          .eq("id", room.id);

        logger.info(`Room ${room.id} completed with no participants`);
        return;
      }

      // If only one participant, they win everything (minus platform fee)
      if (participants.length === 1) {
        const winners = [
          {
            userId: participants[0].user_id,
            position: 1,
            participantId: participants[0].id,
          },
        ];
        await distributePrizes(room, participants, winners);
        return;
      }

      // Determine winners based on winner split rule and scores
      const winners = determineWinners(participants, room.winner_split_rule);

      // Distribute prizes with on-chain transaction information
      await distributePrizes(room, participants, winners, onChainResult);
    } catch (error) {
      logger.error(`Error auto-completing game ${room.id}:`, error);

      // If auto-completion fails, at least update the status
      try {
        await supabase
          .from("game_rooms")
          .update({
            status: "completed",
            actual_end_time: new Date().toISOString(),
            platform_fee_collected: 0,
          })
          .eq("id", room.id);
      } catch (statusError) {
        logger.error("Error updating room status as fallback:", statusError);
      }
    }
  };

  // Function to automatically complete expired games
  const autoCompleteExpiredGames = async () => {
    try {
      const now = new Date().toISOString();

      // Get rooms that have ended but are still marked as ongoing or waiting
      const { data: expiredRooms } = await supabase
        .from("game_rooms")
        .select(
          `
          *,
          participants:game_room_participants(*)
        `
        )
        .in("status", ["waiting", "ongoing"])
        .lt("end_time", now);

      if (!expiredRooms || expiredRooms.length === 0) return;

      logger.info(
        `Found ${expiredRooms.length} expired rooms to auto-complete`
      );

      for (const room of expiredRooms) {
        await autoCompleteGame(room);
      }
    } catch (error) {
      logger.error("Error auto-completing expired games:", error);
    }
  };

  // Update room statuses based on time with auto-completion
  const updateRoomStatuses = async () => {
    try {
      const now = new Date().toISOString();

      // Get rooms that need status updates
      const { data: roomsToUpdate } = await supabase
        .from("game_rooms")
        .select(
          "id, status, start_time, end_time, current_players, min_players_to_start, name, currency, on_chain_room_id"
        )
        .in("status", ["waiting", "ongoing"]);

      if (!roomsToUpdate) return;

      for (const room of roomsToUpdate) {
        let newStatus = room.status;
        let updates: any = {};

        const startTime = new Date(room.start_time);
        const endTime = new Date(room.end_time);
        const currentTime = new Date();

        // Check if room should be ongoing (only if enough players)
        if (
          room.status === "waiting" &&
          currentTime >= startTime &&
          room.current_players >= room.min_players_to_start
        ) {
          newStatus = "ongoing";
          updates = {
            status: "ongoing",
            actual_start_time: now,
          };
        }

        // Check if room should be completed - AUTO COMPLETE WITH PRIZE DISTRIBUTION
        if (
          (room.status === "ongoing" || room.status === "waiting") &&
          currentTime >= endTime
        ) {
          // Auto-complete the game instead of just updating status
          await autoCompleteGame(room);
          continue; // Skip the manual status update since autoCompleteGame handles it
        }

        // Update if status changed (for non-completion updates)
        if (newStatus !== room.status) {
          await supabase.from("game_rooms").update(updates).eq("id", room.id);
        }
      }
    } catch (error) {
      logger.error("Error updating room statuses:", error);
    }
  };

  // Fetch all public rooms and user's private rooms with filtering
  const fetchRooms = async () => {
    try {
      setLoading(true);
      // First, update room statuses based on time
      await updateRoomStatuses();

      const start = (currentPage - 1) * roomsPerPage;

      // Build the base query
      let query = supabase
        .from("game_rooms")
        .select(
          `
          *,
          game:games(*),
          creator:profiles(*),
          participants:game_room_participants(*)
        `,
          { count: "exact" }
        )
        .or("is_private.eq.false,creator_id.eq." + user?.id);

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

      // Apply search query (search in room name and game name)
      if (filters.searchQuery) {
        query = query.or(
          `name.ilike.%${filters.searchQuery}%,game.name.ilike.%${filters.searchQuery}%`
        );
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
    await fetchRooms();
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
    await fetchRooms();
  };

  // Create a new game room
  const createRoom = async (data: CreateRoomData): Promise<GameRoom> => {
    if (!user) throw new Error("User not authenticated");

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

      // Create game instance first
      const { data: instanceData, error: instanceError } = await supabase
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

      // Generate room code for private rooms
      const roomCode = data.isPrivate
        ? Math.random().toString(36).substring(2, 8).toUpperCase()
        : null;

      // On-chain room creation MUST be successful before proceeding with database updates
      if (data.currency === "USDC" && onChainGameRoom) {
        const signer = getWalletKeypair();
        if (!signer)
          throw new Error("Missing wallet signer for on-chain room creation");

        logger.info(`Creating game room on-chain: ${data.name}`);
        const chainResult = await onChainGameRoom.createGameRoom({
          walletKeyPair: signer,
          name: data.name,
          gameId: data.gameId,
          entryFee: data.entryFee || 0,
          maxPlayers: data.maxPlayers,
          isPrivate: data.isPrivate,
          roomCode: roomCode || "",
          isSponsored: !!data.isSponsored,
          sponsorAmount: data.sponsorAmount || 0,
          winnerSplitRule: data.winnerSplitRule as
            | "winner_takes_all"
            | "top_2"
            | "top_3"
            | "top_4"
            | "top_5"
            | "top_10"
            | "equal",
          startTimeMs: data.startTime.getTime(),
          endTimeMs: data.endTime.getTime(),
        });

        if (!chainResult?.roomId || !chainResult?.digest) {
          throw new Error(
            "On-chain room creation failed - missing room ID or transaction digest"
          );
        }

        logger.success(
          `Successfully created game room on-chain: ${data.name} with ID: ${chainResult.roomId}`
        );

        // Only proceed with database updates after successful on-chain creation
        const insertPayload: TablesInsert<"game_rooms"> = {
          name: data.name,
          game_id: data.gameId,
          game_instance_id: instanceData.id,
          creator_id: user.id,
          entry_fee: data.isSponsored ? 0 : data.entryFee,
          currency: data.currency,
          max_players: data.maxPlayers,
          is_private: data.isPrivate,
          room_code: roomCode,
          on_chain_room_id: chainResult.roomId,
          on_chain_create_digest: chainResult.digest,
          winner_split_rule:
            data.winnerSplitRule as Database["public"]["Enums"]["winner_split_rule"],
          start_time: data.startTime.toISOString(),
          end_time: data.endTime.toISOString(),
          is_sponsored: data.isSponsored || false,
          sponsor_amount: data.sponsorAmount || 0,
          total_prize_pool: data.isSponsored ? data.sponsorAmount || 0 : 0,
          min_players_to_start: 2,
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

        // Update game instance with room_id
        await supabase
          .from("game_instances")
          .update({ room_id: roomData.id })
          .eq("id", instanceData.id);

        if (data.isSponsored && data.sponsorAmount) {
          // Create sponsor transaction
          const { data: sponsorTx } = await supabase
            .from("transactions")
            .insert({
              user_id: user.id,
              room_id: roomData.id,
              type: "fee",
              amount: data.sponsorAmount,
              currency: data.currency,
              status: "completed",
              description: `Sponsorship for room: ${data.name}`,
            })
            .select()
            .single();
        } else if (data.entryFee > 0) {
          // For non-sponsored rooms, creator pays entry fee
          const { data: entryTx } = await supabase
            .from("transactions")
            .insert({
              user_id: user.id,
              room_id: roomData.id,
              type: "fee",
              amount: data.entryFee,
              currency: data.currency,
              status: "completed",
              description: `Entry fee for room: ${data.name} (Creator)`,
            })
            .select()
            .single();

          // Auto-join creator as first participant
          await supabase.from("game_room_participants").insert({
            room_id: roomData.id,
            user_id: user.id,
            wallet_id: null,
            entry_transaction_id: entryTx.id,
            payment_currency: data.currency,
            payment_amount: data.entryFee,
            is_active: true,
          });

          // Update room's current_players count and prize pool
          await supabase
            .from("game_rooms")
            .update({
              current_players: 1,
              total_prize_pool: data.entryFee,
            })
            .eq("id", roomData.id);
        } else {
          // Free room (sponsored with 0 entry fee) - just join creator
          await supabase.from("game_room_participants").insert({
            room_id: roomData.id,
            user_id: user.id,
            wallet_id: null,
            entry_transaction_id: null,
            payment_currency: data.currency,
            payment_amount: 0,
            is_active: true,
          });

          // Update room's current_players count
          await supabase
            .from("game_rooms")
            .update({
              current_players: 1,
            })
            .eq("id", roomData.id);
        }

        await refreshRooms();
        await refreshBalances();
        await refreshTransactions();

        toast({
          title: "Success",
          description: "Game room created successfully",
        });

        return roomData as GameRoom;
      } else {
        throw new Error("On-chain room creation is required for USDC rooms");
      }
    } catch (error: any) {
      logger.error("Error creating room:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create game room",
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

      // Create entry fee transaction (only for non-sponsored rooms)
      let transaction = null;
      if (!room.is_sponsored && room.entry_fee > 0) {
        const { data: txData, error: txError } = await supabase
          .from("transactions")
          .insert({
            user_id: user.id,
            room_id: roomId,
            type: "fee",
            amount: room.entry_fee,
            currency: room.currency,
            status: "completed",
            description: `Entry fee for room: ${room.name}`,
          })
          .select()
          .single();

        if (txError) throw txError;
        transaction = txData;
      }

      // On-chain join MUST be successful before proceeding with database updates
      if (
        room.currency === "USDC" &&
        onChainGameRoom &&
        room.on_chain_room_id
      ) {
        const signer = getWalletKeypair();
        if (!signer) throw new Error("Missing wallet signer for on-chain join");

        logger.info(`Joining room on-chain: ${roomId}`);
        await onChainGameRoom.joinGameRoom({
          walletKeyPair: signer,
          roomId: room.on_chain_room_id,
          roomCode: roomCode || "",
          entryFee: room.is_sponsored ? 0 : Number(room.entry_fee || 0),
        });
        logger.success(`Successfully joined room on-chain: ${roomId}`);
      }

      // Only proceed with database updates after successful on-chain join
      const { error: joinError } = await supabase
        .from("game_room_participants")
        .insert({
          room_id: roomId,
          user_id: user.id,
          wallet_id: null,
          entry_transaction_id: transaction?.id || null,
          payment_currency: room.currency,
          payment_amount: room.is_sponsored ? 0 : room.entry_fee,
        });

      if (joinError) throw joinError;

      await refreshBalances();
      await refreshTransactions();
      await refreshRooms();

      toast({
        title: "Success",
        description: "Joined room successfully",
      });
    } catch (error: any) {
      logger.error("Error joining room:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to join room",
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
        room?.currency === "USDC" &&
        onChainGameRoom &&
        room?.on_chain_room_id
      ) {
        const signer = getWalletKeypair();
        if (!signer)
          throw new Error("Missing wallet signer for on-chain leave");

        logger.info(`Leaving room on-chain: ${roomId}`);
        await onChainGameRoom.leaveRoom({
          walletKeyPair: signer,
          roomId: room.on_chain_room_id,
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
        room.currency === "USDC" &&
        onChainGameRoom &&
        room.on_chain_room_id
      ) {
        const signer = getWalletKeypair();
        if (!signer)
          throw new Error("Missing wallet signer for on-chain cancel");

        logger.info(`Cancelling room on-chain: ${roomId}`);
        await onChainGameRoom.cancelRoom({
          walletKeyPair: signer,
          roomId: room.on_chain_room_id,
        });
        logger.success(`Successfully cancelled room on-chain: ${roomId}`);

        // Only proceed with database updates after successful on-chain cancel
        // Refund all participants (NO 10% platform fee on cancellations)
        for (const participant of room.participants) {
          if (participant.payment_amount > 0) {
            // Create refund transaction
            const { data: refundTx, error: refundError } = await supabase
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
      } else {
        throw new Error("Room cannot be cancelled without on-chain support");
      }
    } catch (error: any) {
      logger.error("Error cancelling room:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to cancel room",
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
      return data as GameRoom;
    } catch (error) {
      logger.error("Error fetching room details:", error);
      return null;
    }
  };

  // Get room participants
  const getRoomParticipants = async (
    roomId: string
  ): Promise<GameRoomParticipant[]> => {
    try {
      const { data, error } = await supabase
        .from("game_room_participants")
        .select(
          `
          *,
          user:profiles(*)
        `
        )
        .eq("room_id", roomId)
        .eq("is_active", true)
        .order("score", { ascending: false });

      if (error) throw error;
      return (data as GameRoomParticipant[]) || [];
    } catch (error) {
      logger.error("Error fetching participants:", error);
      return [];
    }
  };

  // Updated updateGameScore with extensive debugging
  const updateGameScore = async (
    roomId: string,
    score: number,
    userId?: string
  ) => {
    const userIdToUse = userId || user?.id;

    if (!userIdToUse) throw new Error("User not authenticated");

    try {
      logger.debug(
        `Starting score update for user ${userIdToUse}, room ${roomId}, new score: ${score}`
      );

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

      const currentScore = currentParticipant?.score || 0;

      logger.debug(`Score comparison details:`);
      logger.info(
        `  - Current score: ${currentScore} (type: ${typeof currentScore})`
      );
      logger.info(`  - New score: ${score} (type: ${typeof score})`);
      logger.info(`  - New score > current? ${score > currentScore}`);
      logger.info(`  - New score as number: ${Number(score)}`);
      logger.info(`  - Current score as number: ${Number(currentScore)}`);
      logger.info(
        `  - Number comparison: ${Number(score) > Number(currentScore)}`
      );

      // Convert both to numbers to ensure proper comparison
      const currentScoreNum = Number(currentScore);
      const newScoreNum = Number(score);

      // Only update if new score is higher
      if (newScoreNum > currentScoreNum) {
        logger.debug(
          `Updating score from ${currentScoreNum} to ${newScoreNum}`
        );

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

        // Verify the update worked
        const { data: verifyData } = await supabase
          .from("game_room_participants")
          .select("score")
          .eq("room_id", roomId)
          .eq("user_id", userIdToUse)
          .single();

        logger.debug("Verified updated score:", verifyData?.score);

        return {
          updated: true,
          previousScore: currentScoreNum,
          newScore: newScoreNum,
        };
      } else {
        logger.debug(
          `Score ${newScoreNum} not higher than current ${currentScoreNum}, no update needed`
        );
        return {
          updated: false,
          previousScore: currentScoreNum,
          newScore: newScoreNum,
        };
      }
    } catch (error) {
      logger.error("Error in updateGameScore:", error);
      throw error;
    }
  };

  // Manual complete game function (for admin use)
  const completeGame = async (
    roomId: string,
    winners: { userId: string; position: number }[]
  ) => {
    try {
      // Get room details
      const { data: room, error: roomError } = await supabase
        .from("game_rooms")
        .select("*, participants:game_room_participants(*, user:profiles(*))")
        .eq("id", roomId)
        .single();

      if (roomError) throw roomError;

      // Get participants
      const { data: participants, error: participantsError } = await supabase
        .from("game_room_participants")
        .select("*")
        .eq("room_id", roomId)
        .eq("is_active", true);

      if (participantsError) throw participantsError;

      // On-chain completion MUST be successful before proceeding with database updates
      let onChainResult = null;
      if (
        room.currency === "USDC" &&
        onChainGameRoom &&
        room.on_chain_room_id
      ) {
        const signer = getWalletKeypair();
        if (!signer)
          throw new Error("Missing wallet signer for on-chain completion");

        logger.info(`Completing game on-chain for room ${roomId}`);

        const activeParticipants = (room.participants || []).filter(
          (p: any) => p.is_active
        );
        const winnersSorted = winners.sort((a, b) => a.position - b.position);
        const winnerAddresses: string[] = [];
        const scores: number[] = [];

        for (const w of winnersSorted) {
          const participant = activeParticipants.find(
            (p: any) => p.user_id === w.userId
          );
          const addr = (
            participant?.user?.sui_wallet_data as Profile["sui_wallet_data"]
          )?.address;
          if (!addr) throw new Error("Missing winner on-chain address");
          winnerAddresses.push(addr);
          scores.push(Number(participant?.score || 0));
        }

        // Call smart contract first - this must succeed
        onChainResult = await onChainGameRoom.completeGame({
          walletKeyPair: signer,
          roomId: room.on_chain_room_id,
          winnerAddresses,
          scores,
        });

        logger.success(
          `Successfully completed game on-chain for room ${roomId} with digest: ${onChainResult.digest}`
        );
      }

      // Only proceed with database updates after successful on-chain completion
      // Distribute prizes in DB using the enhanced function with on-chain transaction details
      await distributePrizes(room, participants, winners, onChainResult);

      await refreshRooms();
      await refreshBalances();
      await refreshTransactions();

      toast({
        title: "Success",
        description: "Game completed and winnings distributed",
      });
    } catch (error) {
      logger.error("Error completing game:", error);
      toast({
        title: "Error",
        description: "Failed to complete game",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Load rooms when user changes, currentPage changes, or filters change
  useEffect(() => {
    if (user) {
      fetchRooms();
    } else {
      setRooms([]);
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, currentPage, filters]);

  // Enhanced useEffect to periodically check for expired games
  useEffect(() => {
    if (!user) return;

    // Check for expired games every 30 seconds
    const expiredGamesInterval = setInterval(() => {
      autoCompleteExpiredGames();
    }, 30000);

    // Also check immediately
    autoCompleteExpiredGames();

    return () => {
      clearInterval(expiredGamesInterval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
          fetchRooms();
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
          fetchRooms();
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
      await fetchRooms();
    },
    nextPage: async () => {
      setCurrentPage((prev) => Math.min(prev + 1, totalPages));
      await fetchRooms();
    },
    prevPage: async () => {
      setCurrentPage((prev) => Math.max(prev - 1, 1));
      await fetchRooms();
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
    getRoomParticipants,
    updateGameScore,
    completeGame,
    playGame,
    handleGameMessage,
  };

  return (
    <GameRoomContext.Provider value={value}>
      {children}
    </GameRoomContext.Provider>
  );
};
