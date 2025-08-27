import { config } from "dotenv";
config();
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
  validateEnvironment,
  createSuiClient,
  retryWithBackoff,
  sleep
} from "./utils";

/**
 * Test 1: Room Creation → Join → Cancel → Refund
 * 
 * Purpose: Verify that when a room is cancelled, all participants receive 
 * full refunds of their entry fees.
 */
async function testRoomCreationJoinCancelRefund() {
  const testName = "Room Creation → Join → Cancel → Refund";
  const testNumber = 1;

  logTestHeader(testName, testNumber);

  try {
    // Validate environment variables
    const { key1, key2 } = validateEnvironment();

    // Create Sui client
    const client = createSuiClient();

    // Create keypairs
    const keypair1 = createKeypair(key1, "Key 1 (Creator)");
    const keypair2 = createKeypair(key2, "Key 2 (Joiner)");

    console.log("Created keypairs successfully");
    console.log(`Creator address: ${keypair1.address}`);
    console.log(`Joiner address: ${keypair2.address}`);

    // Get initial balances
    console.log("\nGetting initial balances...");
    const initialBalances = await getBalances(client, [keypair1, keypair2]);
    logBalances(initialBalances, "Initial Balances");

    // Store initial balances for comparison
    const initialBalance1 = initialBalances.find(b => b.name === "Key 1 (Creator)")!.balance;
    const initialBalance2 = initialBalances.find(b => b.name === "Key 2 (Joiner)")!.balance;

    // Test parameters
    const entryFee = 0.001; // 0.001 USDC
    const entryFeeSmallest = toSmallestUnits(entryFee);
    const roomName = `Test Room ${Date.now()}`;
    const gameId = "test-game-1";
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

    // Step 3: Cancel room
    console.log("\nStep 3: Cancelling room...");
    console.log("Cancelling room...");

    const cancelResult = await retryWithBackoff(async () => {
      return await gameRoom.cancelRoom({
        walletKeyPair: keypair1.keypair,
        roomId: createResult.roomId!,
      });
    });

    if (!cancelResult.success) {
      throw new Error(`Cancel room failed: ${cancelResult}`);
    }

    console.log("Room cancelled successfully");
    console.log(`Transaction digest: ${cancelResult.digest}`);

    // Wait a moment for transaction to be processed
    await sleep(2000);

    // Step 4: Verify final balances
    console.log("\nStep 4: Verifying final balances...");
    const finalBalances = await getBalances(client, [keypair1, keypair2]);
    logBalances(finalBalances, "Final Balances");

    // Get final balances
    const finalBalance1 = finalBalances.find(b => b.name === "Key 1 (Creator)")!.balance;
    const finalBalance2 = finalBalances.find(b => b.name === "Key 2 (Joiner)")!.balance;

    // Calculate expected balances
    // Both users should get full refunds, so final balance = initial balance
    const expectedBalance1 = initialBalance1;
    const expectedBalance2 = initialBalance2;

    console.log("\nBalance Verification:");
    logBalanceChange("Key 1 (Creator)", initialBalance1, finalBalance1, expectedBalance1);
    logBalanceChange("Key 2 (Joiner)", initialBalance2, finalBalance2, expectedBalance2);

    // Check if test passed
    const balance1Correct = Math.abs(finalBalance1 - expectedBalance1) < 0.000001;
    const balance2Correct = Math.abs(finalBalance2 - expectedBalance2) < 0.000001;
    const testPassed = balance1Correct && balance2Correct;

    // Log test result
    const result = logTestResult(testName, testPassed, {
      roomId: createResult.roomId,
      createDigest: createResult.digest,
      joinDigest: joinResult.digest,
      cancelDigest: cancelResult.digest,
      balance1Correct,
      balance2Correct
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
  testRoomCreationJoinCancelRefund()
    .then(() => {
      console.log("\nTest completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\nTest failed:", error);
      process.exit(1);
    });
}

export { testRoomCreationJoinCancelRefund }; 