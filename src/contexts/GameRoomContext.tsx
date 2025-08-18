import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useWallet } from "@/contexts/WalletContext";
import { useProfile } from "@/contexts/ProfileContext";
import { Ed25519Keypair } from "@mysten/sui.js/keypairs/ed25519";
import { GameRoom as OnChainGameRoom } from "@/integrations/smartcontracts/gameRoom";
import { useMemo } from "react";
import { useTransaction } from "@/contexts/TransactionContext";

interface GameRoom {
  id: string;
  name: string;
  game_id: string;
  game_instance_id: string | null;
  creator_id: string;
  entry_fee: number;
  currency: "USDC" | "USDT" | "SUI";
  max_players: number;
  current_players: number;
  min_players_to_start: number;
  is_private: boolean;
  room_code: string | null;
  is_sponsored: boolean;
  sponsor_amount: number;
  winner_split_rule: string;
  status: "waiting" | "starting" | "ongoing" | "completed" | "cancelled";
  start_time: string;
  end_time: string;
  actual_start_time: string | null;
  actual_end_time: string | null;
  total_prize_pool: number;
  platform_fee_collected: number;
  created_at: string;
  updated_at: string;
  game?: any;
  creator?: any;
  participants?: GameRoomParticipant[];
}

interface GameRoomParticipant {
  id: string;
  room_id: string;
  user_id: string;
  wallet_id: string;
  entry_transaction_id: string | null;
  payment_currency: "USDC" | "USDT";
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
  currency: "USDC" | "USDT";
  maxPlayers: number;
  isPrivate: boolean;
  winnerSplitRule: string;
  startTime: Date;
  endTime: Date;
  isSponsored?: boolean;
  sponsorAmount?: number;
}

interface GameRoomContextType {
  rooms: GameRoom[];
  loading: boolean;
  creating: boolean;
  joining: boolean;
  refreshRooms: () => Promise<void>;
  createRoom: (data: CreateRoomData) => Promise<GameRoom>;
  joinRoom: (roomId: string, roomCode?: string) => Promise<void>;
  leaveRoom: (roomId: string) => Promise<void>;
  cancelRoom: (roomId: string) => Promise<void>;
  getRoomDetails: (roomId: string) => Promise<GameRoom | null>;
  getRoomParticipants: (roomId: string) => Promise<GameRoomParticipant[]>;
  updateGameScore: (roomId: string, score: number) => Promise<void>;
  completeGame: (
    roomId: string,
    winners: { userId: string; position: number }[]
  ) => Promise<void>;
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
  const { user } = useAuth();
  const { toast } = useToast();
  const { suiClient, refreshBalances, usdcBalance, usdtBalance, suiBalance } = useWallet();
  const { profile } = useProfile();

  const onChainGameRoom = useMemo(() => {
    try {
      if (!suiClient) return null;
      return new OnChainGameRoom(suiClient);
    } catch {
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
      console.warn("Unable to derive wallet keypair for on-chain ops:", e);
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

    return splits[splitRule] || splits["winner_takes_all"];
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

  // Updated distributePrizes function with profile updates - replace in your GameRoomContext
  const distributePrizes = async (
    room: any,
    participants: any[],
    winners: any[]
  ) => {
    try {
      console.log(`Starting prize distribution for room ${room.id}`);

      // Calculate platform fee (10%)
      const platformFee = room.total_prize_pool * 0.1;
      const distributablePrize = room.total_prize_pool - platformFee;

      // Get prize split percentages
      const prizeSplits = getPrizeSplitPercentages(room.winner_split_rule);

      console.log(`Prize distribution details:`, {
        totalPrizePool: room.total_prize_pool,
        platformFee,
        distributablePrize,
        winnersCount: winners.length,
      });

      // Track users who need profile updates
      const usersToUpdateProfile = new Set();

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

        console.log(
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
          console.error("Error updating participant:", participantError);
          continue;
        }

        // Create winning transaction
        const { data: transaction, error: txError } = await supabase
          .from("transactions")
          .insert({
            user_id: winner.userId,
            room_id: room.id,
            type: "win",
            amount: earnings,
            currency: room.currency,
            status: "completed",
            description: `Winnings from room: ${room.name} (Position: ${winner.position})`,
          })
          .select()
          .single();

        if (txError) {
          console.error("Error creating transaction:", txError);
          continue;
        }

        // Update wallet balance
        const { data: walletData, error: walletFetchError } = await supabase
          .from("wallets")
          .select("balance")
          .eq("user_id", winner.userId)
          .eq("currency", room.currency)
          .single();

        if (walletFetchError) {
          console.error("Error fetching wallet:", walletFetchError);
          continue;
        }

        const newBalance = (walletData.balance || 0) + earnings;

        const { error: updateWalletError } = await supabase
          .from("wallets")
          .update({
            balance: newBalance,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", winner.userId)
          .eq("currency", room.currency);

        if (updateWalletError) {
          console.error("Error updating wallet balance:", updateWalletError);
          continue;
        }

        console.log(
          `Wallet updated: ${winner.userId} - New balance: ${newBalance} ${room.currency}`
        );

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
          console.log("Winners table might not exist:", winnersTableError);
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

          console.log(
            `Updated leaderboards for user ${winner.userId}: position=${winner.position}, earnings=${earnings}`
          );
        } catch (leaderboardError) {
          console.error("Leaderboard update failed:", leaderboardError);
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
          console.error(
            `Error updating leaderboard for non-winner ${participant.user_id}:`,
            error
          );
        }
      }

      // Update profile stats for all affected users using the SQL function
      console.log(
        `Updating profile stats for ${usersToUpdateProfile.size} users`
      );
      for (const userId of usersToUpdateProfile) {
        try {
          await supabase.rpc("update_user_profile_stats", {
            p_user_id: userId,
          });
          console.log(`Profile stats updated for user ${userId}`);
        } catch (profileError) {
          console.error(
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

              console.log(`Manual profile update completed for user ${userId}`);
            }
          } catch (fallbackError) {
            console.error(
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

      console.log(
        `Successfully completed game room ${room.id} and updated ${usersToUpdateProfile.size} user profiles`
      );
    } catch (error) {
      console.error("Error distributing prizes:", error);
      throw error;
    }
  };

  // Function to automatically complete a single game
  const autoCompleteGame = async (room: any) => {
    try {
      console.log(`Auto-completing game room: ${room.id} (${room.name})`);

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

        console.log(`Room ${room.id} completed with no participants`);
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

      // Distribute prizes
      await distributePrizes(room, participants, winners);
    } catch (error) {
      console.error(`Error auto-completing game ${room.id}:`, error);

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
        console.error("Error updating room status as fallback:", statusError);
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

      console.log(
        `Found ${expiredRooms.length} expired rooms to auto-complete`
      );

      for (const room of expiredRooms) {
        await autoCompleteGame(room);
      }
    } catch (error) {
      console.error("Error auto-completing expired games:", error);
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
          "id, status, start_time, end_time, current_players, min_players_to_start, name"
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
      console.error("Error updating room statuses:", error);
    }
  };

  // Fetch all public rooms and user's private rooms
  const fetchRooms = async () => {
    try {
      // First, update room statuses based on time
      await updateRoomStatuses();

      const { data, error } = await supabase
        .from("game_rooms")
        .select(
          `
          *,
          game:games(*),
          creator:profiles(*),
          participants:game_room_participants(*)
        `
        )
        .or("is_private.eq.false,creator_id.eq." + user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRooms(data || []);
    } catch (error) {
      console.error("Error fetching rooms:", error);
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
    await fetchRooms();
  };

  // Create a new game room
  const createRoom = async (data: CreateRoomData): Promise<GameRoom> => {
    if (!user) throw new Error("User not authenticated");

    setCreating(true);
    try {
      // For sponsored rooms, check sponsor balance
      if (data.isSponsored) {
        const balance = data.currency === "USDC" ? usdcBalance : data.currency === "USDT" ? usdtBalance : suiBalance;
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
        console.error("Game instance error:", instanceError);
        throw new Error(
          instanceError.message || "Failed to create game instance"
        );
      }

      // Generate room code for private rooms
      const roomCode = data.isPrivate
        ? Math.random().toString(36).substring(2, 8).toUpperCase()
        : null;

      // Create the room (DB)
      const { data: roomData, error: roomError } = await supabase
        .from("game_rooms")
        .insert({
          name: data.name,
          game_id: data.gameId,
          game_instance_id: instanceData.id,
          creator_id: user.id,
          entry_fee: data.isSponsored ? 0 : data.entryFee,
          currency: data.currency,
          max_players: data.maxPlayers,
          is_private: data.isPrivate,
          room_code: roomCode,
          winner_split_rule: data.winnerSplitRule,
          start_time: data.startTime.toISOString(),
          end_time: data.endTime.toISOString(),
          is_sponsored: data.isSponsored || false,
          sponsor_amount: data.sponsorAmount || 0,
          total_prize_pool: data.isSponsored ? data.sponsorAmount || 0 : 0,
          min_players_to_start: 2, // Default minimum players
        })
        .select()
        .single();

      if (roomError) {
        console.error("Room creation error:", roomError);
        throw new Error(roomError.message || "Failed to create room");
      }

      try {
        if (data.currency === "USDC" && onChainGameRoom) {
          const signer = getWalletKeypair();
          if (!signer) throw new Error("Missing signer");
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
            winnerSplitRule: data.winnerSplitRule as "winner_takes_all" | "top_2" | "top_3" | "top_4" | "top_5" | "top_10" | "equal",
            startTimeMs: data.startTime.getTime(),
            endTimeMs: data.endTime.getTime(),
          });
          // Try to persist on-chain identifiers if columns exist
          if (chainResult?.roomId || chainResult?.digest) {
            try {
              await supabase
                .from("game_rooms")
                .update({
                  on_chain_room_id: chainResult.roomId || null,
                  on_chain_create_digest: chainResult.digest,
                } as any)
                .eq("id", roomData.id);
            } catch (e) {
              console.warn("Could not persist on-chain room metadata (optional):", e);
            }
          }
        }
      } catch (chainError) {
        console.error("On-chain room creation failed (DB created)", chainError);
        // Decide policy: keep DB room even if chain fails; inform user
      }

      // Update game instance with room_id
      await supabase
        .from("game_instances")
        .update({ room_id: roomData.id })
        .eq("id", instanceData.id);

      // Handle payment and auto-join for creator
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

      return roomData;
    } catch (error: any) {
      console.error("Error creating room:", error);
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
          (room.currency === "USDT" && usdtBalance < room.entry_fee) ||
          (room.currency === "SUI" && suiBalance < room.entry_fee))
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

      // On-chain join if on_chain_room_id available and currency supported
      try {
        if (room.currency === "USDC" && onChainGameRoom && room.on_chain_room_id) {
          const signer = getWalletKeypair();
          if (!signer) throw new Error("Missing signer");
          await onChainGameRoom.joinGameRoom({
            walletKeyPair: signer,
            roomId: room.on_chain_room_id,
            roomCode: roomCode || "",
            entryFee: room.is_sponsored ? 0 : Number(room.entry_fee || 0),
          });
        }
      } catch (e) {
        console.error("On-chain join failed; continuing with DB join", e);
      }

      // Join the room (DB)
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
      console.error("Error joining room:", error);
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

      // On-chain leave if possible
      try {
        if (room?.currency === "USDC" && onChainGameRoom && room?.on_chain_room_id) {
          const signer = getWalletKeypair();
          if (signer) {
            await onChainGameRoom.leaveRoom({ walletKeyPair: signer, roomId: room.on_chain_room_id });
          }
        }
      } catch (e) {
        console.error("On-chain leave failed; continuing with DB update", e);
      }

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
      console.error("Error leaving room:", error);
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

      console.log(
        `Cancelling room ${roomId} and refunding ${room.participants.length} participants`
      );

      // On-chain cancel (refunds) if possible
      try {
        if (room.currency === "USDC" && onChainGameRoom && room.on_chain_room_id) {
          const signer = getWalletKeypair();
          if (!signer) throw new Error("Missing signer");
          await onChainGameRoom.cancelRoom({ walletKeyPair: signer, roomId: room.on_chain_room_id });
        }
      } catch (e) {
        console.error("On-chain cancel failed; continuing with DB refunds", e);
      }

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
            console.error("Error creating refund transaction:", refundError);
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
    } catch (error: any) {
      console.error("Error cancelling room:", error);
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
      return data;
    } catch (error) {
      console.error("Error fetching room details:", error);
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
      return data || [];
    } catch (error) {
      console.error("Error fetching participants:", error);
      return [];
    }
  };

  // Update game score
  const updateGameScore = async (roomId: string, score: number) => {
    if (!user) throw new Error("User not authenticated");

    try {
      const { error } = await supabase
        .from("game_room_participants")
        .update({ score })
        .eq("room_id", roomId)
        .eq("user_id", user.id);

      if (error) throw error;
    } catch (error) {
      console.error("Error updating score:", error);
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

      // On-chain completion if possible: map winners to addresses and scores
      try {
        if (room.currency === "USDC" && onChainGameRoom && room.on_chain_room_id) {
          const signer = getWalletKeypair();
          if (!signer) throw new Error("Missing signer");
          const activeParticipants = (room.participants || []).filter((p: any) => p.is_active);
          const winnersSorted = winners.sort((a, b) => a.position - b.position);
          const winnerAddresses: string[] = [];
          const scores: number[] = [];
          for (const w of winnersSorted) {
            const participant = activeParticipants.find((p: any) => p.user_id === w.userId);
            const addr = participant?.user?.sui_wallet_data?.address;
            if (!addr) throw new Error("Missing winner on-chain address");
            winnerAddresses.push(addr);
            scores.push(Number(participant?.score || 0));
          }
          await onChainGameRoom.completeGame({
            walletKeyPair: signer,
            roomId: room.on_chain_room_id,
            winnerAddresses,
            scores,
          });
        }
      } catch (e) {
        console.error("On-chain complete_game failed; continuing with DB settlement", e);
      }

      // Distribute prizes in DB using the enhanced function
      await distributePrizes(room, participants, winners);

      await refreshRooms();
      await refreshBalances();
      await refreshTransactions();

      toast({
        title: "Success",
        description: "Game completed and winnings distributed",
      });
    } catch (error) {
      console.error("Error completing game:", error);
      toast({
        title: "Error",
        description: "Failed to complete game",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Load rooms when user changes
  useEffect(() => {
    if (user) {
      fetchRooms();
    } else {
      setRooms([]);
      setLoading(false);
    }
  }, [user]);

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
  }, [user]);

  const value = {
    rooms,
    loading,
    creating,
    joining,
    refreshRooms,
    createRoom,
    joinRoom,
    leaveRoom,
    cancelRoom,
    getRoomDetails,
    getRoomParticipants,
    updateGameScore,
    completeGame,
  };

  return (
    <GameRoomContext.Provider value={value}>
      {children}
    </GameRoomContext.Provider>
  );
};
