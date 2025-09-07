// import { CreateRoomData } from "@/contexts/GameRoomContext";
// import { Profile } from "@/contexts/ProfileContext";
// import { GameRoom } from "@/integrations/smartcontracts/gameRoom";
// import { supabase } from "@/integrations/supabase/client";
// import { TablesInsert, Database } from "@/integrations/supabase/types";
// import { logger } from "@/utils";
// import { toast } from "sonner";

// export class GameRoomHelpers {

//     static getPrizeSplitPercentages = (splitRule: string) => {
//         const splits = {
//             winner_takes_all: [{ position: 1, percentage: 100 }],
//             top_2: [
//                 { position: 1, percentage: 60 },
//                 { position: 2, percentage: 40 },
//             ],
//             top_3: [
//                 { position: 1, percentage: 50 },
//                 { position: 2, percentage: 30 },
//                 { position: 3, percentage: 20 },
//             ],
//             top_4: [
//                 { position: 1, percentage: 40 },
//                 { position: 2, percentage: 30 },
//                 { position: 3, percentage: 20 },
//                 { position: 4, percentage: 10 },
//             ],
//             top_5: [
//                 { position: 1, percentage: 30 },
//                 { position: 2, percentage: 25 },
//                 { position: 3, percentage: 20 },
//                 { position: 4, percentage: 15 },
//                 { position: 5, percentage: 10 },
//             ],
//             top_10: [
//                 { position: 1, percentage: 20 },
//                 { position: 2, percentage: 15 },
//                 { position: 3, percentage: 12 },
//                 { position: 4, percentage: 10 },
//                 { position: 5, percentage: 8 },
//                 { position: 6, percentage: 8 },
//                 { position: 7, percentage: 7 },
//                 { position: 8, percentage: 7 },
//                 { position: 9, percentage: 7 },
//                 { position: 10, percentage: 6 },
//             ],
//         };

//         return splits[splitRule];
//     };

//     // Function to determine winners based on scores and split rule
//     static determineWinners = (
//         participants: Database["public"]["Tables"]["game_room_participants"]["Row"][],
//         splitRule: string
//     ) => {
//         // check if all participants have 0 score or do not have a score
//         if (participants.every((p) => p.score === 0 || p.score === null)) {
//             return [];
//         }

//         // Sort participants by score in descending order
//         const sortedParticipants = [...participants].sort(
//             (a, b) => (b.score || 0) - (a.score || 0)
//         );

//         const winnerCounts = {
//             winner_takes_all: 1,
//             top_2: 2,
//             top_3: 3,
//             top_4: 4,
//             top_5: 5,
//             top_10: 10,
//         };

//         const maxWinners = winnerCounts[splitRule] || 1;
//         const actualWinners = Math.min(maxWinners, sortedParticipants.length);

//         return sortedParticipants
//             .slice(0, actualWinners)
//             .map((participant, index) => ({
//                 userId: participant.user_id,
//                 position: index + 1,
//                 participantId: participant.id,
//             }));
//     };

//     // Function to map on-chain transaction effects to winners
//     static mapOnChainTransactionToWinners = (
//         onChainResult: any,
//         winners: any[],
//         room: any
//     ) => {
//         if (!onChainResult?.effects || !onChainResult?.events) {
//             return null;
//         }

//         const transactionMapping: any = {
//             digest: onChainResult.digest,
//             roomId: room.on_chain_room_id,
//             effects: onChainResult.effects,
//             events: onChainResult.events,
//             gameCompletedEvent: onChainResult.gameCompletedEvent,
//             winnerTransactions: [],
//         };

//         // Extract transfer events for winners
//         const transferEvents = onChainResult.events.filter(
//             (ev: any) =>
//                 ev.type === "0x2::coin::TransferEvent" ||
//                 ev.type.includes("TransferEvent")
//         );

//         // Map transfers to winners based on addresses
//         for (const winner of winners) {
//             const participant = room.participants?.find(
//                 (p: any) => p.user_id === winner.userId
//             );
//             if (participant?.user?.sui_wallet_data?.address) {
//                 const winnerAddress = participant.user.sui_wallet_data.address;

//                 // Find transfer event for this winner
//                 const transferEvent = transferEvents.find((ev: any) => {
//                     const eventData = ev.parsedJson || ev.data;
//                     return (
//                         eventData?.recipient === winnerAddress ||
//                         eventData?.to === winnerAddress ||
//                         ev.recipient === winnerAddress
//                     );
//                 });

//                 if (transferEvent) {
//                     transactionMapping.winnerTransactions.push({
//                         userId: winner.userId,
//                         position: winner.position,
//                         address: winnerAddress,
//                         transferEvent: transferEvent,
//                         amount:
//                             transferEvent.parsedJson?.amount ||
//                             transferEvent.data?.amount ||
//                             0,
//                     });
//                 }
//             }
//         }

//         return transactionMapping;
//     };

//     // Updated distributePrizes function with profile updates and on-chain transaction mapping
//     static distributePrizes = async (
//         room: Database["public"]["Tables"]["game_rooms"]["Row"],
//         participants: Database["public"]["Tables"]["game_room_participants"]["Row"][],
//         winners: {
//             userId: string | null;
//             position: number;
//             participantId: string;
//         }[],
//         onChainResult?: any
//     ) => {
//         try {
//             logger.info(`Starting prize distribution for room ${room.id}`);

//             // Calculate platform fee (10%)
//             const platformFee = (room.total_prize_pool ?? 0) * 0.07;
//             const distributablePrize = (room.total_prize_pool ?? 0) - platformFee;

//             // Get prize split percentages
//             const prizeSplits = GameRoomHelpers.getPrizeSplitPercentages(room.winner_split_rule);

//             logger.info(`Prize distribution details:`, {
//                 totalPrizePool: room.total_prize_pool,
//                 platformFee,
//                 distributablePrize,
//                 winnersCount: winners.length,
//             });

//             // Track users who need profile updates
//             const usersToUpdateProfile = new Set<string>();

//             // Update participant positions and distribute prizes
//             for (const winner of winners) {
//                 const split = prizeSplits.find((s) => s.position === winner.position);
//                 if (!split) continue;

//                 const earnings = distributablePrize * (split.percentage / 100);

//                 // Find participant data
//                 const participant = participants.find(
//                     (p) => p.user_id === winner.userId
//                 );
//                 if (!participant) continue;

//                 logger.info(
//                     `Processing winner - Position ${winner.position}: ${earnings} ${room.currency}`
//                 );

//                 // Update participant with final position and earnings
//                 const { error: participantError } = await supabase
//                     .from("game_room_participants")
//                     .update({
//                         final_position: winner.position,
//                         earnings: earnings,
//                     })
//                     .eq("room_id", room.id)
//                     .eq("user_id", winner.userId);

//                 if (participantError) {
//                     logger.error("Error updating participant:", participantError);
//                     continue;
//                 }

//                 // Update payout transaction id
//                 await supabase
//                     .from("game_room_participants")
//                     .update({ payout_transaction_id: onChainResult?.digest })
//                     .eq("room_id", room.id)
//                     .eq("user_id", winner.userId);

//                 // Record in winners table
//                 try {
//                     await supabase.from("game_room_winners").insert({
//                         room_id: room.id,
//                         participant_id: participant.id,
//                         position: winner.position,
//                         prize_percentage: split.percentage,
//                         prize_amount: earnings,
//                     });
//                 } catch (winnersTableError) {
//                     logger.error("Error inserting winner record:", winnersTableError);
//                 }

//                 // Update game-specific leaderboard
//                 const isFirstPlace = winner.position === 1;
//                 const currentScore = participant.score || 0;

//                 try {
//                     // Update or create game-specific leaderboard entry
//                     const { data: existingGameEntry } = await supabase
//                         .from("leaderboards")
//                         .select("*")
//                         .eq("user_id", winner.userId)
//                         .eq("game_id", room.game_id)
//                         .eq("period", "all-time")
//                         .single();

//                     if (existingGameEntry) {
//                         await supabase
//                             .from("leaderboards")
//                             .update({
//                                 total_score: Math.max(
//                                     existingGameEntry.total_score || 0,
//                                     currentScore
//                                 ),
//                                 games_played: (existingGameEntry.games_played || 0) + 1,
//                                 wins: (existingGameEntry.wins || 0) + (isFirstPlace ? 1 : 0),
//                                 total_earnings:
//                                     (existingGameEntry.total_earnings || 0) + earnings,
//                                 updated_at: new Date().toISOString(),
//                             })
//                             .eq("id", existingGameEntry.id);
//                     } else {
//                         await supabase.from("leaderboards").insert({
//                             user_id: winner.userId,
//                             game_id: room.game_id,
//                             period: "all-time",
//                             total_score: currentScore,
//                             games_played: 1,
//                             wins: isFirstPlace ? 1 : 0,
//                             total_earnings: earnings,
//                         });
//                     }

//                     // Update or create global leaderboard entry (game_id = NULL)
//                     const { data: existingGlobal } = await supabase
//                         .from("leaderboards")
//                         .select("*")
//                         .eq("user_id", winner.userId)
//                         .is("game_id", null)
//                         .eq("period", "all-time")
//                         .single();

//                     if (existingGlobal) {
//                         await supabase
//                             .from("leaderboards")
//                             .update({
//                                 games_played: (existingGlobal.games_played || 0) + 1,
//                                 wins: (existingGlobal.wins || 0) + (isFirstPlace ? 1 : 0),
//                                 total_earnings: (existingGlobal.total_earnings || 0) + earnings,
//                                 updated_at: new Date().toISOString(),
//                             })
//                             .eq("id", existingGlobal.id);
//                     } else {
//                         await supabase.from("leaderboards").insert({
//                             user_id: winner.userId,
//                             game_id: null,
//                             period: "all-time",
//                             total_score: 0,
//                             games_played: 1,
//                             wins: isFirstPlace ? 1 : 0,
//                             total_earnings: earnings,
//                         });
//                     }

//                     logger.success(
//                         `Updated leaderboards for user ${winner.userId}: position=${winner.position}, earnings=${earnings}`
//                     );
//                 } catch (leaderboardError) {
//                     logger.error("Leaderboard update failed:", leaderboardError);
//                 }

//                 // Mark user for profile update
//                 usersToUpdateProfile.add(winner.userId);
//             }

//             // Update leaderboard for non-winners (they played a game but didn't win)
//             for (const participant of participants) {
//                 const isWinner = winners.some((w) => w.userId === participant.user_id);
//                 if (isWinner) continue; // Already handled above

//                 try {
//                     const currentScore = participant.score || 0;

//                     // Update game-specific leaderboard for non-winner
//                     const { data: existingEntry } = await supabase
//                         .from("leaderboards")
//                         .select("*")
//                         .eq("user_id", participant.user_id)
//                         .eq("game_id", room.game_id)
//                         .eq("period", "all-time")
//                         .single();

//                     if (existingEntry) {
//                         await supabase
//                             .from("leaderboards")
//                             .update({
//                                 total_score: Math.max(
//                                     existingEntry.total_score || 0,
//                                     currentScore
//                                 ),
//                                 games_played: (existingEntry.games_played || 0) + 1,
//                                 updated_at: new Date().toISOString(),
//                             })
//                             .eq("id", existingEntry.id);
//                     } else {
//                         await supabase.from("leaderboards").insert({
//                             user_id: participant.user_id,
//                             game_id: room.game_id,
//                             period: "all-time",
//                             total_score: currentScore,
//                             games_played: 1,
//                             wins: 0,
//                             total_earnings: 0,
//                         });
//                     }

//                     // Update global leaderboard for non-winner
//                     const { data: existingGlobal } = await supabase
//                         .from("leaderboards")
//                         .select("*")
//                         .eq("user_id", participant.user_id)
//                         .is("game_id", null)
//                         .eq("period", "all-time")
//                         .single();

//                     if (existingGlobal) {
//                         await supabase
//                             .from("leaderboards")
//                             .update({
//                                 games_played: (existingGlobal.games_played || 0) + 1,
//                                 updated_at: new Date().toISOString(),
//                             })
//                             .eq("id", existingGlobal.id);
//                     } else {
//                         await supabase.from("leaderboards").insert({
//                             user_id: participant.user_id,
//                             game_id: null,
//                             period: "all-time",
//                             total_score: 0,
//                             games_played: 1,
//                             wins: 0,
//                             total_earnings: 0,
//                         });
//                     }

//                     // Mark user for profile update
//                     usersToUpdateProfile.add(participant.user_id);
//                 } catch (error) {
//                     logger.error(
//                         `Error updating leaderboard for non-winner ${participant.user_id}:`,
//                         error
//                     );
//                 }
//             }

//             // Update profile stats for all affected users using the SQL function
//             logger.info(
//                 `Updating profile stats for ${usersToUpdateProfile.size} users`
//             );
//             for (const userId of usersToUpdateProfile) {
//                 try {
//                     await supabase.rpc("update_user_profile_stats", {
//                         p_user_id: userId,
//                     });
//                     logger.success(`Profile stats updated for user ${userId}`);
//                 } catch (profileError) {
//                     logger.error(
//                         `Error updating profile stats for user ${userId}:`,
//                         profileError
//                     );

//                     // Fallback: manual profile update
//                     try {
//                         // Get aggregated stats from transactions
//                         const { data: userTransactions } = await supabase
//                             .from("transactions")
//                             .select("type, amount")
//                             .eq("user_id", userId)
//                             .eq("status", "completed");

//                         if (userTransactions) {
//                             const totalEarnings = userTransactions
//                                 .filter((t) => t.type === "win")
//                                 .reduce((sum, t) => sum + Number(t.amount), 0);

//                             const totalWins = userTransactions.filter(
//                                 (t) => t.type === "win"
//                             ).length;

//                             const { data: gameRooms } = await supabase
//                                 .from("game_room_participants")
//                                 .select("room_id")
//                                 .eq("user_id", userId)
//                                 .eq("is_active", true);

//                             const totalGames = gameRooms ? gameRooms.length : 0;
//                             const experiencePoints = totalGames * 100 + totalWins * 500;

//                             await supabase
//                                 .from("profiles")
//                                 .update({
//                                     total_earnings: totalEarnings,
//                                     total_wins: totalWins,
//                                     total_games_played: totalGames,
//                                     experience_points: experiencePoints,
//                                     level: Math.max(1, Math.floor(experiencePoints / 1000)),
//                                     updated_at: new Date().toISOString(),
//                                 })
//                                 .eq("id", userId);

//                             logger.success(
//                                 `Manual profile update completed for user ${userId}`
//                             );
//                         }
//                     } catch (fallbackError) {
//                         logger.debug(
//                             `Fallback profile update also failed for user ${userId}:`,
//                             fallbackError
//                         );
//                     }
//                 }
//             }

//             // Update room status to completed
//             await supabase
//                 .from("game_rooms")
//                 .update({
//                     status: "completed",
//                     actual_end_time: new Date().toISOString(),
//                     platform_fee_collected: platformFee,
//                 })
//                 .eq("id", room.id);

//             // Store complete transaction mapping in database for verification
//             if (onChainResult?.digest) {
//                 try {
//                     const transactionMapping = mapOnChainTransactionToWinners(
//                         onChainResult,
//                         winners,
//                         room
//                     );
//                     if (transactionMapping) {
//                         // Store the mapping in a dedicated table or as JSON in the room
//                         await supabase
//                             .from("game_rooms")
//                             .update({
//                                 on_chain_completion_digest: onChainResult.digest,
//                                 on_chain_completion_events: JSON.stringify(
//                                     onChainResult.events
//                                 ),
//                                 on_chain_completion_effects: JSON.stringify(
//                                     onChainResult.effects
//                                 ),
//                                 on_chain_completion_mapping: JSON.stringify(transactionMapping),
//                                 updated_at: new Date().toISOString(),
//                             })
//                             .eq("id", room.id);

//                         logger.success(
//                             `Stored on-chain transaction mapping for room ${room.id}`
//                         );
//                     }
//                 } catch (mappingError) {
//                     logger.error("Error storing transaction mapping:", mappingError);
//                     // Don't fail the entire operation for mapping storage errors
//                 }
//             }

//             logger.success(
//                 `Successfully completed game room ${room.id} and updated ${usersToUpdateProfile.size} user profiles`
//             );
//         } catch (error) {
//             logger.error("Error distributing prizes:", error);
//             throw error;
//         }
//     };

//     // Create a new game room
//     static createRoom = async (data: CreateRoomData): Promise<GameRoom> => {
//         if (!user) throw new Error("User not authenticated");

//         setCreating(true);
//         try {
//             // For sponsored rooms, check sponsor balance
//             if (data.isSponsored) {
//                 const balance =
//                     data.currency === "USDC"
//                         ? usdcBalance
//                         : data.currency === "USDT"
//                             ? usdtBalance
//                             : suiBalance;
//                 if (!balance || balance < (data.sponsorAmount || 0)) {
//                     throw new Error(
//                         `Insufficient ${data.currency} balance for sponsorship`
//                     );
//                 }
//             }

//             // Create game instance first
//             const { data: instanceData, error: instanceError } = await supabase
//                 .from("game_instances")
//                 .insert({
//                     game_id: data.gameId,
//                     instance_data: {},
//                 })
//                 .select()
//                 .single();

//             if (instanceError) {
//                 logger.error("Game instance error:", instanceError);
//                 throw new Error(
//                     instanceError.message || "Failed to create game instance"
//                 );
//             }

//             // Generate room code for private rooms
//             const roomCode = data.isPrivate
//                 ? Math.random().toString(36).substring(2, 8).toUpperCase()
//                 : null;

//             // On-chain room creation MUST be successful before proceeding with database updates
//             if (data.currency === "USDC" && onChainGameRoom) {
//                 const signer = getWalletKeypair();
//                 if (!signer)
//                     throw new Error("Missing wallet signer for on-chain room creation");

//                 logger.info(`Creating game room on-chain: ${data.name}`);
//                 const chainResult = await onChainGameRoom.createGameRoom({
//                     walletKeyPair: signer,
//                     name: data.name,
//                     gameId: data.gameId,
//                     entryFee: data.entryFee || 0,
//                     maxPlayers: data.maxPlayers,
//                     isPrivate: data.isPrivate,
//                     roomCode: roomCode || "",
//                     isSponsored: !!data.isSponsored,
//                     sponsorAmount: data.sponsorAmount || 0,
//                     winnerSplitRule: data.winnerSplitRule as
//                         | "winner_takes_all"
//                         | "top_2"
//                         | "top_3"
//                         | "top_4"
//                         | "top_5"
//                         | "top_10"
//                         | "equal",
//                     startTimeMs: data.startTime.getTime(),
//                     endTimeMs: data.endTime.getTime(),
//                 });

//                 if (!chainResult?.roomId || !chainResult?.digest) {
//                     throw new Error(
//                         "On-chain room creation failed - missing room ID or transaction digest"
//                     );
//                 }

//                 logger.success(
//                     `Successfully created game room on-chain: ${data.name} with ID: ${chainResult.roomId}`
//                 );

//                 // Only proceed with database updates after successful on-chain creation
//                 const insertPayload: TablesInsert<"game_rooms"> = {
//                     name: data.name,
//                     game_id: data.gameId,
//                     game_instance_id: instanceData.id,
//                     creator_id: user.id,
//                     entry_fee: data.isSponsored ? 0 : data.entryFee,
//                     currency: data.currency,
//                     max_players: data.maxPlayers,
//                     is_private: data.isPrivate,
//                     room_code: roomCode,
//                     on_chain_room_id: chainResult.roomId,
//                     on_chain_create_digest: chainResult.digest,
//                     winner_split_rule:
//                         data.winnerSplitRule as Database["public"]["Enums"]["winner_split_rule"],
//                     start_time: data.startTime.toISOString(),
//                     end_time: data.endTime.toISOString(),
//                     is_sponsored: data.isSponsored || false,
//                     sponsor_amount: data.sponsorAmount || 0,
//                     total_prize_pool: data.isSponsored ? data.sponsorAmount || 0 : 0,
//                     min_players_to_start: 2,
//                 };

//                 const { data: roomData, error: roomError } = await supabase
//                     .from("game_rooms")
//                     .insert(insertPayload)
//                     .select()
//                     .single();

//                 if (roomError) {
//                     logger.error("Room creation error:", roomError);
//                     throw new Error(roomError.message || "Failed to create room");
//                 }

//                 // Update game instance with room_id
//                 await supabase
//                     .from("game_instances")
//                     .update({ room_id: roomData.id })
//                     .eq("id", instanceData.id);

//                 if (data.isSponsored && data.sponsorAmount) {
//                     // Create sponsor transaction
//                     const { data: sponsorTx } = await supabase
//                         .from("transactions")
//                         .insert({
//                             user_id: user.id,
//                             room_id: roomData.id,
//                             type: "fee",
//                             amount: data.sponsorAmount,
//                             currency: data.currency,
//                             status: "completed",
//                             description: `Sponsorship for room: ${data.name}`,
//                         })
//                         .select()
//                         .single();
//                 } else if (data.entryFee > 0) {
//                     // For non-sponsored rooms, creator pays entry fee
//                     const { data: entryTx } = await supabase
//                         .from("transactions")
//                         .insert({
//                             user_id: user.id,
//                             room_id: roomData.id,
//                             type: "fee",
//                             amount: data.entryFee,
//                             currency: data.currency,
//                             status: "completed",
//                             description: `Entry fee for room: ${data.name} (Creator)`,
//                         })
//                         .select()
//                         .single();

//                     // Auto-join creator as first participant
//                     await supabase.from("game_room_participants").insert({
//                         room_id: roomData.id,
//                         user_id: user.id,
//                         wallet_id: null,
//                         entry_transaction_id: entryTx.id,
//                         payment_currency: data.currency,
//                         payment_amount: data.entryFee,
//                         is_active: true,
//                     });

//                     // Update room's current_players count and prize pool
//                     await supabase
//                         .from("game_rooms")
//                         .update({
//                             current_players: 1,
//                             total_prize_pool: data.entryFee,
//                         })
//                         .eq("id", roomData.id);
//                 } else {
//                     // Free room (sponsored with 0 entry fee) - just join creator
//                     await supabase.from("game_room_participants").insert({
//                         room_id: roomData.id,
//                         user_id: user.id,
//                         wallet_id: null,
//                         entry_transaction_id: null,
//                         payment_currency: data.currency,
//                         payment_amount: 0,
//                         is_active: true,
//                     });

//                     // Update room's current_players count
//                     await supabase
//                         .from("game_rooms")
//                         .update({
//                             current_players: 1,
//                         })
//                         .eq("id", roomData.id);
//                 }

//                 await refreshRooms();
//                 await refreshBalances();
//                 await refreshTransactions();

//                 toast({
//                     title: "Success",
//                     description: "Game room created successfully",
//                 });

//                 return roomData as GameRoom;
//             } else {
//                 throw new Error("On-chain room creation is required for USDC rooms");
//             }
//         } catch (error: any) {
//             logger.error("Error creating room:", error);
//             toast({
//                 title: "Error",
//                 description: error.message || "Failed to create game room",
//                 variant: "destructive",
//             });
//             throw error;
//         } finally {
//             setCreating(false);
//         }
//     };

//     // Join a game room
//     static joinRoom = async (roomId: string, roomCode?: string) => {
//         if (!user) throw new Error("User not authenticated");

//         setJoining(true);
//         try {
//             // Get room details
//             const { data: room, error: roomError } = await supabase
//                 .from("game_rooms")
//                 .select("*")
//                 .eq("id", roomId)
//                 .single();

//             if (roomError) throw roomError;

//             // Check if room is private and verify code
//             if (room.is_private && room.room_code !== roomCode) {
//                 throw new Error("Invalid room code");
//             }

//             // Check if room is full
//             if (room.current_players >= room.max_players) {
//                 throw new Error("Room is full");
//             }

//             // Check if user has sufficient balance (only for non-sponsored rooms)
//             if (
//                 !room.is_sponsored &&
//                 ((room.currency === "USDC" && usdcBalance < room.entry_fee) ||
//                     (room.currency === "USDT" && usdtBalance < room.entry_fee))
//             ) {
//                 throw new Error(`Insufficient ${room.currency} balance`);
//             }

//             // Create entry fee transaction (only for non-sponsored rooms)
//             let transaction = null;
//             if (!room.is_sponsored && room.entry_fee > 0) {
//                 const { data: txData, error: txError } = await supabase
//                     .from("transactions")
//                     .insert({
//                         user_id: user.id,
//                         room_id: roomId,
//                         type: "fee",
//                         amount: room.entry_fee,
//                         currency: room.currency,
//                         status: "completed",
//                         description: `Entry fee for room: ${room.name}`,
//                     })
//                     .select()
//                     .single();

//                 if (txError) throw txError;
//                 transaction = txData;
//             }

//             // On-chain join MUST be successful before proceeding with database updates
//             if (
//                 room.currency === "USDC" &&
//                 onChainGameRoom &&
//                 room.on_chain_room_id
//             ) {
//                 const signer = getWalletKeypair();
//                 if (!signer) throw new Error("Missing wallet signer for on-chain join");

//                 logger.info(`Joining room on-chain: ${roomId}`);
//                 await onChainGameRoom.joinGameRoom({
//                     isSponsored: room.is_sponsored,
//                     walletKeyPair: signer,
//                     roomId: room.on_chain_room_id,
//                     roomCode: roomCode || "",
//                     entryFee: room.is_sponsored ? 0 : Number(room.entry_fee || 0),
//                 });
//                 logger.success(`Successfully joined room on-chain: ${roomId}`);
//             }

//             // Only proceed with database updates after successful on-chain join
//             const { error: joinError } = await supabase
//                 .from("game_room_participants")
//                 .insert({
//                     room_id: roomId,
//                     user_id: user.id,
//                     wallet_id: null,
//                     entry_transaction_id: transaction?.id || null,
//                     payment_currency: room.currency,
//                     payment_amount: room.is_sponsored ? 0 : room.entry_fee,
//                 });

//             if (joinError) throw joinError;

//             await refreshBalances();
//             await refreshTransactions();
//             await refreshRooms();

//             toast({
//                 title: "Success",
//                 description: "Joined room successfully",
//             });
//         } catch (error: any) {
//             logger.error("Error joining room:", error);
//             toast({
//                 title: "Error",
//                 description: error.message || "Failed to join room",
//                 variant: "destructive",
//             });
//             throw error;
//         } finally {
//             setJoining(false);
//         }
//     };

//     // Leave a game room
//     static leaveRoom = async (roomId: string) => {
//         if (!user) throw new Error("User not authenticated");

//         try {
//             // Fetch room to check for on-chain id
//             const { data: room } = await supabase
//                 .from("game_rooms")
//                 .select("id, currency, on_chain_room_id, status")
//                 .eq("id", roomId)
//                 .single();

//             if (room.status !== "waiting") {
//                 throw new Error("Can only leave rooms in waiting status");
//             }

//             // On-chain leave MUST be successful before proceeding with database updates
//             if (
//                 room?.currency === "USDC" &&
//                 onChainGameRoom &&
//                 room?.on_chain_room_id
//             ) {
//                 const signer = getWalletKeypair();
//                 if (!signer)
//                     throw new Error("Missing wallet signer for on-chain leave");

//                 logger.info(`Leaving room on-chain: ${roomId}`);
//                 await onChainGameRoom.leaveRoom({
//                     walletKeyPair: signer,
//                     roomId: room.on_chain_room_id,
//                 });
//                 logger.success(`Successfully left room on-chain: ${roomId}`);
//             }

//             // Only proceed with database updates after successful on-chain leave
//             const { error } = await supabase
//                 .from("game_room_participants")
//                 .update({
//                     is_active: false,
//                     left_at: new Date().toISOString(),
//                 })
//                 .eq("room_id", roomId)
//                 .eq("user_id", user.id);

//             if (error) throw error;

//             await refreshRooms();

//             toast({
//                 title: "Success",
//                 description: "Left room successfully",
//             });
//         } catch (error) {
//             logger.error("Error leaving room:", error);
//             toast({
//                 title: "Error",
//                 description: "Failed to leave room",
//                 variant: "destructive",
//             });
//             throw error;
//         }
//     };

//     // Enhanced cancel room function with proper refunds (no 10% charge)
//     static cancelRoom = async (roomId: string) => {
//         if (!user) throw new Error("User not authenticated");

//         try {
//             // Get room and participants
//             const { data: room, error: roomError } = await supabase
//                 .from("game_rooms")
//                 .select(
//                     `
//           *,
//           participants:game_room_participants(*)
//         `
//                 )
//                 .eq("id", roomId)
//                 .single();

//             if (roomError) throw roomError;

//             if (room.creator_id !== user.id) {
//                 throw new Error("Only room creator can cancel");
//             }

//             if (room.status !== "waiting") {
//                 throw new Error("Can only cancel rooms in waiting status");
//             }

//             logger.info(
//                 `Cancelling room ${roomId} and refunding ${room.participants.length} participants`
//             );

//             // On-chain cancel (refunds) MUST be successful before proceeding with database updates
//             if (
//                 room.currency === "USDC" &&
//                 onChainGameRoom &&
//                 room.on_chain_room_id
//             ) {
//                 const signer = getWalletKeypair();
//                 if (!signer)
//                     throw new Error("Missing wallet signer for on-chain cancel");

//                 logger.info(`Cancelling room on-chain: ${roomId}`);
//                 await onChainGameRoom.cancelRoom({
//                     walletKeyPair: signer,
//                     roomId: room.on_chain_room_id,
//                 });
//                 logger.success(`Successfully cancelled room on-chain: ${roomId}`);

//                 // Only proceed with database updates after successful on-chain cancel
//                 // Refund all participants (NO 10% platform fee on cancellations)
//                 for (const participant of room.participants) {
//                     if (participant.payment_amount > 0) {
//                         // Create refund transaction
//                         const { data: refundTx, error: refundError } = await supabase
//                             .from("transactions")
//                             .insert({
//                                 user_id: participant.user_id,
//                                 room_id: roomId,
//                                 type: "deposit",
//                                 amount: participant.payment_amount, // Full refund - no platform fee
//                                 currency: participant.payment_currency,
//                                 status: "completed",
//                                 description: `Full refund for cancelled room: ${room.name}`,
//                             })
//                             .select()
//                             .single();

//                         if (refundError) {
//                             logger.error("Error creating refund transaction:", refundError);
//                             continue;
//                         }
//                     }
//                 }

//                 // If the room was sponsored, refund the sponsor amount too
//                 if (room.is_sponsored && room.sponsor_amount > 0) {
//                     // Create sponsor refund transaction
//                     await supabase.from("transactions").insert({
//                         user_id: room.creator_id,
//                         room_id: roomId,
//                         type: "deposit",
//                         amount: room.sponsor_amount,
//                         currency: room.currency,
//                         status: "completed",
//                         description: `Sponsor refund for cancelled room: ${room.name}`,
//                     });
//                 }

//                 // Update room status to cancelled
//                 await supabase
//                     .from("game_rooms")
//                     .update({
//                         status: "cancelled",
//                         updated_at: new Date().toISOString(),
//                     })
//                     .eq("id", roomId);

//                 await refreshRooms();
//                 await refreshBalances();
//                 await refreshTransactions();

//                 toast({
//                     title: "Success",
//                     description: "Room cancelled and all participants fully refunded",
//                 });
//             } else {
//                 throw new Error("Room cannot be cancelled without on-chain support");
//             }
//         } catch (error: any) {
//             logger.error("Error cancelling room:", error);
//             toast({
//                 title: "Error",
//                 description: error.message || "Failed to cancel room",
//                 variant: "destructive",
//             });
//             throw error;
//         }
//     };

//     // Get room details
//     static getRoomDetails = async (roomId: string): Promise<GameRoom | null> => {
//         try {
//             const { data, error } = await supabase
//                 .from("game_rooms")
//                 .select(
//                     `
//           *,
//           game:games(*),
//           creator:profiles(*),
//           participants:game_room_participants(
//             *,
//             user:profiles(*)
//           )
//         `
//                 )
//                 .eq("id", roomId)
//                 .single();

//             if (error) throw error;
//             return data as GameRoom;
//         } catch (error) {
//             logger.error("Error fetching room details:", error);
//             return null;
//         }
//     };

//     // Get room participants
//     static getRoomParticipants = async (
//         roomId: string
//     ): Promise<GameRoomParticipant[]> => {
//         try {
//             const { data, error } = await supabase
//                 .from("game_room_participants")
//                 .select(
//                     `
//           *,
//           user:profiles(*)
//         `
//                 )
//                 .eq("room_id", roomId)
//                 .eq("is_active", true)
//                 .order("score", { ascending: false });

//             if (error) throw error;
//             return (data as GameRoomParticipant[]) || [];
//         } catch (error) {
//             logger.error("Error fetching participants:", error);
//             return [];
//         }
//     };

//     // Manual complete game function (for admin use)
//     static completeGame = async (
//         roomId: string,
//         winners: { userId: string; position: number; participantId: string }[]
//     ) => {
//         try {
//             // Get room details
//             const { data: room, error: roomError } = await supabase
//                 .from("game_rooms")
//                 .select("*, participants:game_room_participants(*, user:profiles(*))")
//                 .eq("id", roomId)
//                 .single();

//             if (roomError) throw roomError;

//             // Get participants
//             const { data: participants, error: participantsError } = await supabase
//                 .from("game_room_participants")
//                 .select("*")
//                 .eq("room_id", roomId)
//                 .eq("is_active", true);

//             if (participantsError) throw participantsError;

//             // On-chain completion MUST be successful before proceeding with database updates
//             let onChainResult = null;
//             if (
//                 room.currency === "USDC" &&
//                 onChainGameRoom &&
//                 room.on_chain_room_id
//             ) {
//                 const signer = getWalletKeypair();
//                 if (!signer)
//                     throw new Error("Missing wallet signer for on-chain completion");

//                 logger.info(`Completing game on-chain for room ${roomId}`);

//                 const activeParticipants = (room.participants || []).filter(
//                     (p) => p.is_active
//                 );
//                 const winnersSorted = winners.sort((a, b) => a.position - b.position);
//                 const winnerAddresses: string[] = [];
//                 const scores: number[] = [];

//                 for (const w of winnersSorted) {
//                     const participant = activeParticipants.find(
//                         (p) => p.user_id === w.userId
//                     );
//                     const addr = (
//                         participant?.user?.sui_wallet_data as Profile["sui_wallet_data"]
//                     )?.address;
//                     if (!addr) throw new Error("Missing winner on-chain address");
//                     winnerAddresses.push(addr);
//                     scores.push(Number(participant?.score || 0));
//                 }

//                 // Call smart contract first - this must succeed
//                 onChainResult = await onChainGameRoom.completeGame({
//                     roomId: room.on_chain_room_id,
//                     winnerAddresses,
//                     scores,
//                 });

//                 logger.success(
//                     `Successfully completed game on-chain for room ${roomId} with digest: ${onChainResult.digest}`
//                 );
//             }

//             // Only proceed with database updates after successful on-chain completion
//             // Distribute prizes in DB using the enhanced function with on-chain transaction details
//             await distributePrizes(room, participants, winners, onChainResult);

//             await refreshRooms();
//             await refreshBalances();
//             await refreshTransactions();

//             toast({
//                 title: "Success",
//                 description: "Game completed and winnings distributed",
//             });
//         } catch (error) {
//             logger.error("Error completing game:", error);
//             toast({
//                 title: "Error",
//                 description: "Failed to complete game",
//                 variant: "destructive",
//             });
//             throw error;
//         }
//     };
// }