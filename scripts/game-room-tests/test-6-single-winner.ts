import { SuiClient } from "@mysten/sui.js/client";
import { GameRoom } from "@/integrations/smartcontracts/gameRoom";
import {
  createKeypair,
  getBalances,
  logBalances,
  logTestHeader,
  logTestResult,
  logBalanceChange,
  calculateExpectedBalance,
  formatUSDC,
  toSmallestUnits,
  calculatePlatformFee,
  calculateRefundableAmount,
  validateEnvironment,
  createSuiClient,
  retryWithBackoff,
  sleep
} from "./utils";

/**
 * Test 6: Game Completion with Single Winner
 * 
 * Purpose: Verify that when a game is completed with one winner, 
 * the winner receives the full prize pool minus the platform fee.
 */
async function testGameCompletionSingleWinner(): Promise<void> {
  const testName = "Game Completion with Single Winner";
  const testNumber = 6;

  logTestHeader(testName, testNumber);

  try {
    // Validate environment variables
    const { key1, key2 } = validateEnvironment();

    // Create Sui client
    const client = createSuiClient();

    // Create keypairs
    const keypair1 = createKeypair(key1, "Key 1 (Creator/Winner)");
    const keypair2 = createKeypair(key2, "Key 2 (Joiner/Loser)");

    console.log("Created keypairs successfully");
    console.log(`Creator/Winner address: ${keypair1.address}`);
    console.log(`Joiner/Loser address: ${keypair2.address}`);

    // Get initial balances
    console.log("\nGetting initial balances...");
    const initialBalances = await getBalances(client, [keypair1, keypair2]);
    logBalances(initialBalances, "Initial Balances");

    // Store initial balances for comparison
    const initialBalance1 = initialBalances.find(b => b.name === "Key 1 (Creator/Winner)")!.balance;
    const initialBalance2 = initialBalances.find(b => b.name === "Key 2 (Joiner/Loser)")!.balance;

    // Test parameters
    const entryFee = 0.01; // 0.01 USDC
    const entryFeeSmallest = toSmallestUnits(entryFee);
    const roomName = `Test Room ${Date.now()}`;
    const gameId = "test-game-6";
    const maxPlayers = 2;
    const isPrivate = false;
    const winnerSplitRule = "winner_takes_all";
    const startTimeMs = Date.now() + 60000; // Start in 1 minute
    const endTimeMs = Date.now() + 300000; // End in 5 minutes

    console.log(`\nTest Parameters:`);
    console.log(`  Entry Fee: ${formatUSDC(entryFee)} USDC`);
    console.log(`  Room Name: ${roomName}`);
    console.log(`  Max Players: ${maxPlayers}`);
    console.log(`  Winner Split Rule: ${winnerSplitRule}`);

    // Create GameRoom instance
    console.log("\nCreating GameRoom instance...");
    const gameRoom = new GameRoom(client);
    console.log("GameRoom instance created successfully");

    // Step 1: Create room
    console.log("\nStep 1: Creating room...");
    console.log(`Creating room with ${formatUSDC(entryFee)} USDC entry fee...`);

    const createResult = await retryWithBackoff(async () => {
      return await gameRoom.createGameRoom({
        walletKeyPair: keypair1.keypair,
        name: roomName,
        gameId,
        entryFee,
        maxPlayers,
        isPrivate,
        roomCode: "",
        isSponsored: false,
        sponsorAmount: 0,
        winnerSplitRule: winnerSplitRule as any,
        startTimeMs,
        endTimeMs,
      });
    });

    if (!createResult.success || !createResult.roomId) {
      throw new Error(`Room creation failed: ${createResult}`);
    }

    console.log(`Room created successfully: ${createResult.roomId}`);
    console.log(`Transaction digest: ${createResult.digest}`);
    console.log(`Entry fee deducted: ${formatUSDC(entryFee)} USDC`);

    // Wait a moment for transaction to be processed
    await sleep(2000);

    // Step 2: Join room
    console.log("\nStep 2: Joining room...");
    console.log("Joining room...");

    const joinResult = await retryWithBackoff(async () => {
      return await gameRoom.joinGameRoom({
        walletKeyPair: keypair2.keypair,
        roomId: createResult.roomId!,
        roomCode: "",
        entryFee,
      });
    });

    if (!joinResult.success) {
      throw new Error(`Join room failed: ${joinResult}`);
    }

    console.log("User joined successfully");
    console.log(`Transaction digest: ${joinResult.digest}`);
    console.log(`Entry fee deducted: ${formatUSDC(entryFee)} USDC`);

    // Wait a moment for transaction to be processed
    await sleep(2000);

    // Step 3: Complete game with Key 1 as winner
    console.log("\nStep 3: Completing game with Key 1 as winner...");
    console.log("Completing game with Key 1 as winner...");

    const completeResult = await retryWithBackoff(async () => {
      return await gameRoom.completeGame({
        walletKeyPair: keypair1.keypair,
        roomId: createResult.roomId!,
        winnerAddresses: [keypair1.address], // Key 1 is the winner
        scores: [100], // Score for Key 1
      });
    });

    if (!completeResult.success) {
      throw new Error(`Game completion failed: ${completeResult}`);
    }

    console.log("Game completed successfully");
    console.log(`Transaction digest: ${completeResult.digest}`);

    // Wait a moment for transaction to be processed
    await sleep(2000);

    // Step 4: Verify final balances
    console.log("\nStep 4: Verifying final balances...");
    const finalBalances = await getBalances(client, [keypair1, keypair2]);
    logBalances(finalBalances, "Final Balances");

    // Get final balances
    const finalBalance1 = finalBalances.find(b => b.name === "Key 1 (Creator/Winner)")!.balance;
    const finalBalance2 = finalBalances.find(b => b.name === "Key 2 (Joiner/Loser)")!.balance;

    // Calculate expected outcomes
    const totalPrizePool = entryFee * 2; // 0.02 USDC (0.01 + 0.01)
    const platformFee = calculatePlatformFee(totalPrizePool); // 0.0014 USDC (7% of 0.02)
    const winnerPrize = calculateRefundableAmount(totalPrizePool); // 0.0186 USDC (93% of 0.02)

    console.log("\nPrize Distribution:");
    console.log(`  Total Prize Pool: ${formatUSDC(totalPrizePool)} USDC`);
    console.log(`  Platform Fee (7%): ${formatUSDC(platformFee)} USDC`);
    console.log(`  Winner Prize: ${formatUSDC(winnerPrize)} USDC`);
    console.log(`  Winner: Key 1`);

    // Calculate expected balances
    // Key 1 (Winner): Initial - entry fee + winner prize
    // Key 2 (Loser): Initial - entry fee (no refund)
    const expectedBalance1 = initialBalance1 - entryFee + winnerPrize;
    const expectedBalance2 = initialBalance2 - entryFee;

    console.log("\nBalance Verification:");
    logBalanceChange("Key 1 (Winner)", initialBalance1, finalBalance1, expectedBalance1);
    logBalanceChange("Key 2 (Loser)", initialBalance2, finalBalance2, expectedBalance2);

    // Check if test passed
    const balance1Correct = Math.abs(finalBalance1 - expectedBalance1) < 0.000001;
    const balance2Correct = Math.abs(finalBalance2 - expectedBalance2) < 0.000001;
    const testPassed = balance1Correct && balance2Correct;

    // Log test result
    const result = logTestResult(testName, testPassed, {
      roomId: createResult.roomId,
      createDigest: createResult.digest,
      joinDigest: joinResult.digest,
      completeDigest: completeResult.digest,
      balance1Correct,
      balance2Correct,
      totalPrizePool,
      platformFee,
      winnerPrize,
      expectedBalance1,
      expectedBalance2,
      winnerAddress: keypair1.address
    });

    return result;

  } catch (error) {
    console.error(`\nTest failed with error:`, error);
    logTestResult(testName, false, { error: error.message });
    throw error;
  }
}

// Run the test if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testGameCompletionSingleWinner()
    .then(() => {
      console.log("\nTest completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\nTest failed:", error);
      process.exit(1);
    });
}

export { testGameCompletionSingleWinner }; 