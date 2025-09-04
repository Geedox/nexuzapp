import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { Database } from '../src/integrations/supabase/types';
import { logger } from '../src/utils/logger';

config();

// Test configuration
const SUPABASE_URL = process.env.VITE_PUBLIC_SUPABASE_URL!;
const SUPABASE_PUBLISHABLE_KEY = process.env.VITE_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

// Mock data for testing
const mockRoom = {
    id: 'test-room-' + Date.now(),
    name: 'Test Game Room',
    game_id: 'test-game-1',
    creator_id: 'test-user-1',
    entry_fee: 10,
    currency: 'USDC' as const,
    max_players: 4,
    current_players: 4,
    min_players_to_start: 2,
    is_private: false,
    room_code: null,
    is_sponsored: false,
    sponsor_amount: 0,
    winner_split_rule: 'top_3' as const,
    status: 'ongoing' as const,
    start_time: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    end_time: new Date(Date.now() - 1800000).toISOString(), // 30 minutes ago
    actual_start_time: new Date(Date.now() - 3600000).toISOString(),
    actual_end_time: null,
    total_prize_pool: 40, // 4 players * 10 entry fee
    platform_fee_collected: 0,
    on_chain_create_digest: null,
    on_chain_room_id: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
};

const mockParticipants = [
    {
        id: 'participant-1',
        room_id: mockRoom.id,
        user_id: 'test-user-1',
        wallet_id: null,
        entry_transaction_id: 'tx-1',
        payment_currency: 'USDC' as const,
        payment_amount: 10,
        score: 1500, // Winner - 1st place
        final_position: null,
        earnings: 0,
        payout_transaction_id: null,
        joined_at: new Date().toISOString(),
        left_at: null,
        is_active: true,
    },
    {
        id: 'participant-2',
        room_id: mockRoom.id,
        user_id: 'test-user-2',
        wallet_id: null,
        entry_transaction_id: 'tx-2',
        payment_currency: 'USDC' as const,
        payment_amount: 10,
        score: 1200, // Winner - 2nd place
        final_position: null,
        earnings: 0,
        payout_transaction_id: null,
        joined_at: new Date().toISOString(),
        left_at: null,
        is_active: true,
    },
    {
        id: 'participant-3',
        room_id: mockRoom.id,
        user_id: 'test-user-3',
        wallet_id: null,
        entry_transaction_id: 'tx-3',
        payment_currency: 'USDC' as const,
        payment_amount: 10,
        score: 800, // Winner - 3rd place
        final_position: null,
        earnings: 0,
        payout_transaction_id: null,
        joined_at: new Date().toISOString(),
        left_at: null,
        is_active: true,
    },
    {
        id: 'participant-4',
        room_id: mockRoom.id,
        user_id: 'test-user-4',
        wallet_id: null,
        entry_transaction_id: 'tx-4',
        payment_currency: 'USDC' as const,
        payment_amount: 10,
        score: 500, // Non-winner
        final_position: null,
        earnings: 0,
        payout_transaction_id: null,
        joined_at: new Date().toISOString(),
        left_at: null,
        is_active: true,
    },
];

// Test users for leaderboard testing
const mockUsers = [
    {
        id: 'test-user-1',
        username: 'testuser1',
        email: 'test1@example.com',
        total_earnings: 0,
        total_wins: 0,
        total_games_played: 0,
        experience_points: 0,
        level: 1,
    },
    {
        id: 'test-user-2',
        username: 'testuser2',
        email: 'test2@example.com',
        total_earnings: 0,
        total_wins: 0,
        total_games_played: 0,
        experience_points: 0,
        level: 1,
    },
    {
        id: 'test-user-3',
        username: 'testuser3',
        email: 'test3@example.com',
        total_earnings: 0,
        total_wins: 0,
        total_games_played: 0,
        experience_points: 0,
        level: 1,
    },
    {
        id: 'test-user-4',
        username: 'testuser4',
        email: 'test4@example.com',
        total_earnings: 0,
        total_wins: 0,
        total_games_played: 0,
        experience_points: 0,
        level: 1,
    },
];

// Prize split percentages based on winner split rule
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

    return splits[splitRule] || splits.winner_takes_all;
};

// Determine winners based on scores and split rule
const determineWinners = (
    participants: Database["public"]["Tables"]["game_room_participants"]["Row"][],
    splitRule: string
) => {
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

// Main prize distribution function (without smart contract calls)
const distributePrizes = async (
    room: Database["public"]["Tables"]["game_rooms"]["Row"],
    participants: Database["public"]["Tables"]["game_room_participants"]["Row"][],
    winners: {
        userId: string | null;
        position: number;
        participantId: string;
    }[]
) => {
    try {
        logger.info(`Starting prize distribution for room ${room.id}`);

        // Calculate platform fee (7%)
        const platformFee = (room.total_prize_pool ?? 0) * 0.07;
        const distributablePrize = (room.total_prize_pool ?? 0) - platformFee;

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
                .eq("user_id", winner.userId!);

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
                logger.success(`Added winner to game_room_winners table: Position ${winner.position}`);
            } catch (winnersTableError) {
                logger.error("Error inserting into winners table:", winnersTableError);
            }

            // Update game-specific leaderboard
            const isFirstPlace = winner.position === 1;
            const currentScore = participant.score || 0;

            try {
                // Update or create game-specific leaderboard entry
                const { data: existingGameEntry } = await supabase
                    .from("leaderboards")
                    .select("*")
                    .eq("user_id", winner.userId!)
                    .eq("game_id", room.game_id!)
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
                    .eq("user_id", winner.userId!)
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
                        user_id: winner.userId!,
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
            usersToUpdateProfile.add(winner.userId!);
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
                    .eq("user_id", participant.user_id!)
                    .eq("game_id", room.game_id!)
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
                        user_id: participant.user_id!,
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
                    .eq("user_id", participant.user_id!)
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
                        user_id: participant.user_id!,
                        game_id: null,
                        period: "all-time",
                        total_score: 0,
                        games_played: 1,
                        wins: 0,
                        total_earnings: 0,
                    });
                }

                // Mark user for profile update
                usersToUpdateProfile.add(participant.user_id!);
            } catch (error) {
                logger.error(
                    `Error updating leaderboard for non-winner ${participant.user_id!}:`,
                    error
                );
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

        logger.success(
            `Successfully completed game room ${room.id} and updated ${usersToUpdateProfile.size} user profiles`
        );

        return {
            success: true,
            winnersProcessed: winners.length,
            participantsProcessed: participants.length,
            platformFee,
            distributablePrize,
        };
    } catch (error) {
        logger.error("Error distributing prizes:", error);
        throw error;
    }
};

// Test function to set up mock data
const setupMockData = async () => {
    try {
        logger.info("Setting up mock data...");

        // Create test users
        for (const user of mockUsers) {
            const { error } = await supabase
                .from("profiles")
                .upsert(user, { onConflict: 'id' });
            if (error) {
                logger.warn(`Error creating user ${user.id}:`, error);
            }
        }

        // Create test game
        const { error: gameError } = await supabase
            .from("games")
            .upsert({
                id: 'test-game-1',
                name: 'Test Game',
                description: 'A test game for completion testing',
                game_url: 'https://example.com/game',
                is_active: true,
            }, { onConflict: 'id' });

        if (gameError) {
            logger.warn("Error creating test game:", gameError);
        }

        // Create test room
        const { error: roomError } = await supabase
            .from("game_rooms")
            .upsert(mockRoom, { onConflict: 'id' });

        if (roomError) {
            logger.warn("Error creating test room:", roomError);
        }

        // Create test participants
        for (const participant of mockParticipants) {
            const { error } = await supabase
                .from("game_room_participants")
                .upsert(participant, { onConflict: 'id' });
            if (error) {
                logger.warn(`Error creating participant ${participant.id}:`, error);
            }
        }

        // Create entry transactions
        for (let i = 1; i <= 4; i++) {
            const { error } = await supabase
                .from("transactions")
                .upsert({
                    id: `tx-${i}`,
                    user_id: `test-user-${i}`,
                    room_id: mockRoom.id,
                    type: "fee",
                    amount: 10,
                    currency: "USDC",
                    status: "completed",
                    description: `Entry fee for test room`,
                }, { onConflict: 'id' });
            if (error) {
                logger.warn(`Error creating transaction tx-${i}:`, error);
            }
        }

        logger.success("Mock data setup completed");
    } catch (error) {
        logger.error("Error setting up mock data:", error);
        throw error;
    }
};

// Test function to verify results
const verifyResults = async (roomId: string) => {
    try {
        logger.info("Verifying test results...");

        // Check room status
        const { data: room } = await supabase
            .from("game_rooms")
            .select("*")
            .eq("id", roomId)
            .single();

        logger.info("Room status:", {
            id: room?.id,
            status: room?.status,
            platform_fee_collected: room?.platform_fee_collected,
            actual_end_time: room?.actual_end_time,
        });

        // Check participants with final positions and earnings
        const { data: participants } = await supabase
            .from("game_room_participants")
            .select("*")
            .eq("room_id", roomId)
            .order("final_position", { ascending: true });

        logger.info("Participants with final positions and earnings:");
        participants?.forEach((p, index) => {
            logger.info(`  ${index + 1}. User ${p.user_id}: Position ${p.final_position}, Score ${p.score}, Earnings ${p.earnings}`);
        });

        // Check winners table
        const { data: winners } = await supabase
            .from("game_room_winners")
            .select("*")
            .eq("room_id", roomId)
            .order("position", { ascending: true });

        logger.info("Winners table entries:");
        winners?.forEach((w, index) => {
            logger.info(`  ${index + 1}. Position ${w.position}: Prize ${w.prize_amount} (${w.prize_percentage}%)`);
        });

        // Check leaderboards
        const { data: gameLeaderboards } = await supabase
            .from("leaderboards")
            .select("*")
            .eq("game_id", room?.game_id || "")
            .eq("period", "all-time")
            .order("total_score", { ascending: false });

        logger.info("Game-specific leaderboards:");
        gameLeaderboards?.forEach((l, index) => {
            logger.info(`  ${index + 1}. User ${l.user_id}: Score ${l.total_score}, Games ${l.games_played}, Wins ${l.wins}, Earnings ${l.total_earnings}`);
        });

        const { data: globalLeaderboards } = await supabase
            .from("leaderboards")
            .select("*")
            .is("game_id", null)
            .eq("period", "all-time")
            .order("total_earnings", { ascending: false });

        logger.info("Global leaderboards:");
        globalLeaderboards?.forEach((l, index) => {
            logger.info(`  ${index + 1}. User ${l.user_id}: Games ${l.games_played}, Wins ${l.wins}, Earnings ${l.total_earnings}`);
        });

        // Check transactions
        const { data: transactions } = await supabase
            .from("transactions")
            .select("*")
            .eq("room_id", roomId)
            .eq("type", "win")
            .order("amount", { ascending: false });

        logger.info("Winning transactions:");
        transactions?.forEach((t, index) => {
            logger.info(`  ${index + 1}. User ${t.user_id}: Amount ${t.amount}, Description: ${t.description}`);
        });

        return {
            room,
            participants,
            winners,
            gameLeaderboards,
            globalLeaderboards,
            transactions,
        };
    } catch (error) {
        logger.error("Error verifying results:", error);
        throw error;
    }
};

// Cleanup function
const cleanupTestData = async () => {
    try {
        logger.info("Cleaning up test data...");

        const roomId = mockRoom.id;

        // Delete in reverse order of dependencies
        await supabase.from("game_room_winners").delete().eq("room_id", roomId);
        await supabase.from("transactions").delete().eq("room_id", roomId);
        await supabase.from("game_room_participants").delete().eq("room_id", roomId);
        await supabase.from("game_rooms").delete().eq("id", roomId);
        await supabase.from("games").delete().eq("id", "test-game-1");

        // Delete leaderboards for test users
        for (const user of mockUsers) {
            await supabase.from("leaderboards").delete().eq("user_id", user.id);
        }

        // Delete test users
        for (const user of mockUsers) {
            await supabase.from("profiles").delete().eq("id", user.id);
        }

        logger.success("Test data cleanup completed");
    } catch (error) {
        logger.error("Error cleaning up test data:", error);
    }
};

// Main test function
const runGameRoomCompletionTest = async () => {
    try {
        logger.info("Starting Game Room Completion Test...");
        logger.info("=".repeat(50));

        // Setup mock data
        await setupMockData();

        // Determine winners
        const winners = determineWinners(mockParticipants, mockRoom.winner_split_rule);
        logger.info("Determined winners:", winners);

        // Run prize distribution
        const result = await distributePrizes(mockRoom as Database["public"]["Tables"]["game_rooms"]["Row"], mockParticipants, winners);
        logger.info("Prize distribution result:", result);

        // Verify results
        const verification = await verifyResults(mockRoom.id);

        // Summary
        logger.info("=".repeat(50));
        logger.info("TEST SUMMARY:");
        logger.info(`✅ Room completed: ${verification.room?.status === 'completed'}`);
        logger.info(`✅ Winners processed: ${verification.winners?.length || 0}`);
        logger.info(`✅ Participants updated: ${verification.participants?.length || 0}`);
        logger.info(`✅ Leaderboard entries created: ${(verification.gameLeaderboards?.length || 0) + (verification.globalLeaderboards?.length || 0)}`);
        logger.info(`✅ Winning transactions created: ${verification.transactions?.length || 0}`);
        logger.info("=".repeat(50));

        return {
            success: true,
            verification,
        };
    } catch (error) {
        logger.error("Test failed:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    } finally {
        // Cleanup
        await cleanupTestData();
    }
};

// Export for use
export {
    runGameRoomCompletionTest,
    setupMockData,
    cleanupTestData,
    distributePrizes,
    determineWinners,
    verifyResults,
};

runGameRoomCompletionTest()
// .then((result) => {
//     if (result.success) {
//         logger.success("✅ All tests passed!");
//         process.exit(0);
//     } else {
//         logger.error("❌ Tests failed:", result.error);
//         process.exit(1);
//     }
// })
// .catch((error) => {
//     logger.error("❌ Test execution failed:", error);
//     process.exit(1);
// });