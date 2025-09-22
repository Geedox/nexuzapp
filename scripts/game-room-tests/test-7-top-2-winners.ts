import { SuiClient } from "@mysten/sui.js/client";
import { GameRoom } from "../../src/integrations/smartcontracts/gameRoom";
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
import { CURRENCY } from "../../src/constants";

/**
 * Test 7: Game Completion with Top 2 Winners
 * 
 * Purpose: Verify that when a game is completed with two winners, 
 * prizes are distributed according to the top_2 split rule (60% to 1st, 40% to 2nd) 
 * minus platform fees.
 */
async function testGameCompletionTop2Winners(): Promise<void> {
  const testName = "Game Completion with Top 2 Winners";
  const testNumber = 7;

  logTestHeader(testName, testNumber);

  try {
    // Validate environment variables
    const { key1, key2 } = validateEnvironment();

    // Create Sui client
    const client = createSuiClient();

    // Create keypairs
    const keypair1 = createKeypair(key1, "Key 1 (Creator/1st Place)");
    const keypair2 = createKeypair(key2, "Key 2 (Joiner/2nd Place)");

    console.log("Created keypairs successfully");
    console.log(`Creator/1st Place address: ${keypair1.address}`);
    console.log(`Joiner/2nd Place address: ${keypair2.address}`);

    // Get initial balances
    console.log("\nGetting initial balances...");
    const initialBalances = await getBalances(client, [keypair1, keypair2]);
    logBalances(initialBalances, "Initial Balances");

    // Store initial balances for comparison
    const initialBalance1 = initialBalances.find(b => b.name === "Key 1 (Creator/1st Place)")!.balance;
    const initialBalance2 = initialBalances.find(b => b.name === "Key 2 (Joiner/2nd Place)")!.balance;

    // Test parameters
    const entryFee = 0.01; // 0.01 USDC
    const entryFeeSmallest = toSmallestUnits(entryFee);
    const roomName = `Test Room ${Date.now()}`;
    const gameId = "test-game-7";
    const maxPlayers = 2;
    const isPrivate = false;
    const winnerSplitRule = "top_2"; // 60% to 1st, 40% to 2nd
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
        isSpecial: false,
        currency: CURRENCY.USDC as "USDC" | "USDT",
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
        isSponsored: false,
        currency: CURRENCY.USDC as "USDC" | "USDT",
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

    // Step 3: Complete game with top 2 winners
    console.log("\nStep 3: Completing game with top 2 winners...");
    console.log("Completing game with top 2 winners...");

    const completeResult = await retryWithBackoff(async () => {
      return await gameRoom.completeGame({
        roomId: createResult.roomId!,
        winnerAddresses: [keypair1.address, keypair2.address], // Key 1 is 1st, Key 2 is 2nd
        scores: [100, 80], // Score for Key 1 (1st), Score for Key 2 (2nd)
        currency: CURRENCY.USDC as "USDC" | "USDT",
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
    const finalBalance1 = finalBalances.find(b => b.name === "Key 1 (Creator/1st Place)")!.balance;
    const finalBalance2 = finalBalances.find(b => b.name === "Key 2 (Joiner/2nd Place)")!.balance;

    // Calculate expected outcomes
    const totalPrizePool = entryFee * 2; // 0.02 USDC (0.01 + 0.01)
    const platformFee = calculatePlatformFee(totalPrizePool); // 0.0021 USDC (7% of 0.02)
    const refundableAmount = calculateRefundableAmount(totalPrizePool); // 0.0186 USDC (93% of 0.02)

    // Top 2 split: 60% to 1st place, 40% to 2nd place
    const firstPlacePrize = refundableAmount * 0.6; // 0.01116 USDC (60% of 0.0186)
    const secondPlacePrize = refundableAmount * 0.4; // 0.00744 USDC (40% of 0.0186)

    console.log("\nPrize Distribution (Top 2 Split):");
    console.log(`  Total Prize Pool: ${formatUSDC(totalPrizePool)} USDC`);
    console.log(`  Platform Fee (7%): ${formatUSDC(platformFee)} USDC`);
    console.log(`  Refundable Amount: ${formatUSDC(refundableAmount)} USDC`);
    console.log(`  1st Place (Key 1): ${formatUSDC(firstPlacePrize)} USDC (60% of ${formatUSDC(refundableAmount)})`);
    console.log(`  2nd Place (Key 2): ${formatUSDC(secondPlacePrize)} USDC (40% of ${formatUSDC(refundableAmount)})`);

    // Calculate expected balances
    // Key 1 (1st Place): Initial - entry fee + 1st place prize
    // Key 2 (2nd Place): Initial - entry fee + 2nd place prize
    const expectedBalance1 = initialBalance1 - entryFee + firstPlacePrize;
    const expectedBalance2 = initialBalance2 - entryFee + secondPlacePrize;

    console.log("\nBalance Verification:");
    logBalanceChange("Key 1 (1st Place)", initialBalance1, finalBalance1, expectedBalance1);
    logBalanceChange("Key 2 (2nd Place)", initialBalance2, finalBalance2, expectedBalance2);

    // Check if test passed
    const balance1Correct = Math.abs(finalBalance1 - expectedBalance1) < 0.000001;
    const balance2Correct = Math.abs(finalBalance2 - expectedBalance2) < 0.000001;
    const testPassed = balance1Correct && balance2Correct;

    // Log test result
    logTestResult(testName, testPassed, {
      roomId: createResult.roomId,
      createDigest: createResult.digest,
      joinDigest: joinResult.digest,
      completeDigest: completeResult.digest,
      balance1Correct,
      balance2Correct,
      totalPrizePool,
      platformFee,
      refundableAmount,
      firstPlacePrize,
      secondPlacePrize,
      expectedBalance1,
      expectedBalance2,
      winnerAddresses: [keypair1.address, keypair2.address],
      scores: [100, 80]
    });

  } catch (error) {
    console.error(`\nTest failed with error:`, error);
    logTestResult(testName, false, { error: error.message });
    throw error;
  }
}

// Run the test if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testGameCompletionTop2Winners()
    .then(() => {
      console.log("\nTest completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\nTest failed:", error);
      process.exit(1);
    });
}

export { testGameCompletionTop2Winners }; 