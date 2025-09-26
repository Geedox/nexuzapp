import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/utils/logger";
import type { Database, TablesInsert, Tables } from "@/integrations/supabase/types";
import { GameRoom, GameRoomParticipant, OnChainGameRoomResult, Wallet } from "@/types/gameroom";
import { Profile } from "@/contexts/ProfileContext";
import { NETWORK } from "@/constants";
import { getFullnodeUrl, SuiClient } from "@mysten/sui.js/client";
import { GameRoom as OnChainGameRoom } from "@/integrations/smartcontracts/gameRoom";
import { verifyCoinForRoomCreation } from "@/lib/utils";

class GameRoomService {
  private onChainGameRoom: OnChainGameRoom;
  constructor() {
    const suiClient = new SuiClient({ url: getFullnodeUrl(NETWORK) });
    this.onChainGameRoom = new OnChainGameRoom(suiClient);
  }
  // Function to automatically complete a single game
  autoCompleteGame = async (
    room: GameRoom & { participants?: GameRoomParticipant[] }
  ) => {
    // Call smart contract first to complete the game on-chain
    let onChainResult: OnChainGameRoomResult | null = null;
    try {
      // Get all active participants with their scores for on-chain completion
      const { data: participants } = await supabase
        .from("game_room_participants")
        .select("*, user:profiles(*)")
        .eq("room_id", room.id)
        .eq("is_active", true)
        .order("score", { ascending: false });
      if (
        verifyCoinForRoomCreation(room.currency) &&
        this.onChainGameRoom &&
        room.on_chain_room_id
      ) {
        logger.info(`Completing game on-chain for room ${room.id}`);

        if (participants && participants.length > 0) {
          // Determine winners for on-chain completion
          const winners = this.determineWinners(
            participants,
            room.winner_split_rule
          );
          const winnerAddresses: string[] = [];
          const scores: number[] = [];

          for (const winner of winners) {
            const participant = participants.find(
              (p) => p.user_id === winner.userId
            );
            const addr = (
              participant?.user?.sui_wallet_data as Profile["sui_wallet_data"]
            )?.address;
            if (addr) {
              winnerAddresses.push(addr);
              scores.push(Number(participant?.score || 0));
            }
          }

          if (winnerAddresses.length > 0) {
            onChainResult = await this.onChainGameRoom.completeGame({
              roomId: room.on_chain_room_id,
              winnerAddresses,
              scores,
              currency: room.currency as "USDC" | "USDT",
            });
            if (!onChainResult?.digest) {
              throw new Error(
                `Failed to complete game on-chain for room ${room.id}: Missing transaction digest`
              );
            }
            await this.distributePrizes(
              room as Database["public"]["Tables"]["game_rooms"]["Row"],
              participants,
              winners,
              onChainResult
            );
            logger.success(
              `Successfully completed game on-chain for room ${room.id} with digest: ${onChainResult.digest}`
            );
          } else {
            onChainResult = await this.onChainGameRoom.completeGame({
              roomId: room.on_chain_room_id,
              winnerAddresses: [],
              scores: [],
              currency: room.currency as "USDC" | "USDT",
            });
            // Still call distributePrizes even with no winners to update participant records
            await this.distributePrizes(
              room as Database["public"]["Tables"]["game_rooms"]["Row"],
              participants,
              [],
              onChainResult
            );
            logger.success(
              `Successfully completed game on-chain for room ${room.id} with digest: ${onChainResult.digest}`
            );
          }
          // Distribute prizes with on-chain transaction information
        }
        if (!participants || participants.length === 0) {
          // No participants - just mark as completed
          await supabase
            .from("game_rooms")
            .update({
              status: "completed",
              actual_end_time: new Date().toISOString(),
              platform_fee_collected: 0,
              complete_digest: onChainResult?.digest,
            })
            .eq("id", room.id);

          logger.info(`Room ${room.id} completed with no participants`);
          return;
        }
      }
    } catch (error) {
      logger.error(`Failed to complete game for room ${room.id}:`, error);
      throw error;
    }
  };

  // Function to automatically complete expired games
  autoCompleteExpiredGames = async () => {
    try {
      const now = new Date().toISOString();

      // Get rooms that have ended but are still marked as ongoing or waiting
      // Exclude special rooms as they require manual completion
      const { data: expiredRooms } = await supabase
        .from("game_rooms")
        .select(
          `
          *,
          participants:game_room_participants(*)
        `
        )
        .in("status", ["waiting", "ongoing"])
        .lt("end_time", now)
        .eq("is_special", false);

      if (!expiredRooms || expiredRooms.length === 0) return;

      logger.info(
        `Found ${expiredRooms.length} expired rooms to auto-complete (excluding special rooms)`
      );

      for (const room of expiredRooms) {
        await this.autoCompleteGame(
          room as GameRoom & { participants?: GameRoomParticipant[] }
        );
      }
    } catch (error) {
      logger.error("Error auto-completing expired games:", error);
    }
  };

  // Update room statuses based on time with auto-completion
  updateRoomStatuses = async () => {
    try {
      const now = new Date().toISOString();

      // Get rooms that need status updates
      const { data: roomsToUpdate } = await supabase
        .from("game_rooms")
        .select(
          "id, status, start_time, end_time, current_players, min_players_to_start, name, currency, on_chain_room_id, is_special, mode, elimination_type, max_rounds, players_per_match, round_duration_minutes, time_limit_minutes"
        )
        .in("status", ["waiting", "ongoing"]);

      if (!roomsToUpdate) return;

      for (const room of roomsToUpdate) {
        let newStatus = room.status;
        let updates: Partial<
          Database["public"]["Tables"]["game_rooms"]["Update"]
        > = {};

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

          // For tournament rooms, create tournament matches if not already created
          if (room.mode === "tournament") {
            try {
              // Check if tournament matches already exist
              const { data: existingMatches } = await supabase
                .from("tournament_matches")
                .select("id")
                .eq("room_id", room.id)
                .limit(1);

              if (!existingMatches || existingMatches.length === 0) {
                logger.info(`Creating tournament matches for room ${room.id}`);

                // Import tournament service dynamically to avoid circular imports
                const { tournamentService } = await import(
                  "@/services/tournamentService"
                );

                await tournamentService.createTournamentMatches({
                  roomId: room.id,
                  eliminationType: room.elimination_type,
                  maxRounds: room.max_rounds,
                  playersPerMatch: room.players_per_match,
                  roundDurationMinutes: room.round_duration_minutes,
                  timeLimitMinutes: room.time_limit_minutes,
                });

                logger.success(
                  `Tournament matches created for room ${room.id}`
                );
              }
            } catch (error) {
              logger.error(
                `Error creating tournament matches for room ${room.id}:`,
                error
              );
              // Don't fail the entire status update for tournament creation errors
            }
          }
        }

        // Check if room should be completed - AUTO COMPLETE WITH PRIZE DISTRIBUTION
        // Skip auto-completion for special rooms - they require manual completion
        if (
          (room.status === "ongoing" || room.status === "waiting") &&
          currentTime >= endTime &&
          !room.is_special
        ) {
          // Auto-complete the game instead of just updating status
          await this.autoCompleteGame(
            room as GameRoom & { participants?: GameRoomParticipant[] }
          );
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

  // Function to get prize split percentages based on winner split rule
  getPrizeSplitPercentages = (splitRule: string) => {
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
  determineWinners = (
    participants: Database["public"]["Tables"]["game_room_participants"]["Row"][],
    splitRule: string
  ) => {
    // check if all participants have 0 score or do not have a score
    if (participants.every((p) => p.score === 0 || p.score === null)) {
      return [];
    }

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

    const maxWinners = winnerCounts[splitRule];
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
  mapOnChainTransactionToWinners = (
    onChainResult: {
      digest: string;
      effects?: unknown;
      events?: Array<{
        type: string;
        parsedJson?: { amount?: number; recipient?: string; to?: string };
        data?: { amount?: number };
        recipient?: string;
      }>;
      gameCompletedEvent?: unknown;
    },
    winners: Array<{ userId: string; position: number; participantId: string }>,
    room: GameRoom
  ) => {
    if (!onChainResult?.effects || !onChainResult?.events) {
      return null;
    }

    const transactionMapping: {
      digest: string;
      roomId: string;
      effects: unknown;
      events: unknown;
      gameCompletedEvent: unknown;
      winnerTransactions: Array<{
        userId: string;
        position: number;
        address: string;
        transferEvent: unknown;
        amount: number;
      }>;
    } = {
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
      const wallet = participant?.user?.sui_wallet_data as Wallet;
      if (wallet) {
        const winnerAddress = wallet.address;

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
  distributePrizes = async (
    room: Database["public"]["Tables"]["game_rooms"]["Row"],
    participants: Database["public"]["Tables"]["game_room_participants"]["Row"][],
    winners: {
      userId: string | null;
      position: number;
      participantId: string;
    }[],
    onChainResult: OnChainGameRoomResult
  ) => {
    try {
      logger.info(`Starting prize distribution for room ${room.id}`);

      // Calculate platform fee (10%)
      const platformFee = (room.total_prize_pool ?? 0) * 0.07;
      const distributablePrize = (room.total_prize_pool ?? 0) - platformFee;

      // Get prize split percentages
      const prizeSplits = this.getPrizeSplitPercentages(room.winner_split_rule);

      logger.info(`Prize distribution details:`, {
        totalPrizePool: room.total_prize_pool,
        platformFee,
        distributablePrize,
        winnersCount: winners.length,
      });

      // Track users who need profile updates
      const usersToUpdateProfile = new Set<string>();

      // Handle case where there are no winners - set all participants as non-winners
      if (winners.length === 0) {
        logger.info(
          `No winners found for room ${room.id}, marking all participants as non-winners`
        );
        for (const participant of participants) {
          // Set final_position to 0 to indicate participation without winning
          await supabase
            .from("game_room_participants")
            .update({
              final_position: 0,
              earnings: 0,
            })
            .eq("room_id", room.id)
            .eq("user_id", participant.user_id);
        }
      }

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
        const { data: participantProfile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", winner.userId)
          .single();
        if (!participantProfile) continue;
        const createdObjects = onChainResult.changes.filter(
          (c) => c.type === "created"
        );
        const participantPayoutId = createdObjects.find(
          (c) =>
            c.owner ===
            (participantProfile.sui_wallet_data as Profile["sui_wallet_data"])
              ?.address
        ).digest;

        // Update participant with final position and earnings
        const { error: participantError } = await supabase
          .from("game_room_participants")
          .update({
            final_position: winner.position,
            earnings: earnings,
            payout_transaction_id: null,
            payout_digest: participantPayoutId,
          })
          .eq("room_id", room.id)
          .eq("user_id", winner.userId);

        if (participantError) {
          logger.error("Error updating participant:", participantError);
          continue;
        }

        // Record in winners table
        try {
          await supabase.from("game_room_winners").insert({
            room_id: room.id,
            participant_id: participant.id,
            position: winner.position,
            prize_percentage: split.percentage,
            prize_amount: earnings,
          });
        } catch (winnersTableError) {
          logger.error("Error inserting winner record:", winnersTableError);
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
          const transactionMapping = this.mapOnChainTransactionToWinners(
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
}

export const gameRoomService = new GameRoomService();