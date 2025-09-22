import { CURRENCY } from "../../src/constants";
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
 * Test 2: Room Creation → Join → Leave → Cancel
 * 
 * Purpose: Verify that users can leave rooms and receive refunds, 
 * and creators can cancel rooms after participants leave.
 */
async function testRoomCreationJoinLeaveCancel(): Promise<void> {
  const testName = "Room Creation → Join → Leave → Cancel";
  const testNumber = 2;

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
    const entryFee = 0.01; // 0.01 USDC
    const entryFeeSmallest = toSmallestUnits(entryFee);
    const roomName = `Test Room ${Date.now()}`;
    const gameId = "test-game-2";
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

    // Step 3: Leave room (Key 2 leaves)
    console.log("\nStep 3: Leaving room...");
    console.log("Leaving room...");

    const leaveResult = await retryWithBackoff(async () => {
      return await gameRoom.leaveRoom({
        walletKeyPair: keypair2.keypair,
        roomId: createResult.roomId!,
        currency: CURRENCY.USDC as "USDC" | "USDT",
      });
    });

    if (!leaveResult.success) {
      throw new Error(`Leave room failed: ${leaveResult}`);
    }

    console.log("User left successfully");
    console.log(`Transaction digest: ${leaveResult.digest}`);
    console.log(`Refund received: ${formatUSDC(entryFee)} USDC`);

    // Wait a moment for transaction to be processed
    await sleep(2000);

    // Check balance after leaving to confirm refund
    console.log("\nChecking balance after leaving...");
    const balanceAfterLeave = await getBalances(client, [keypair2]);
    const balanceAfterLeave2 = balanceAfterLeave.find(b => b.name === "Key 2 (Joiner)")!.balance;

    console.log(`Balance after leaving: ${formatUSDC(balanceAfterLeave2)} USDC`);
    console.log(`Expected balance: ${formatUSDC(initialBalance2)} USDC`);

    // Step 4: Cancel room (Key 1 cancels)
    console.log("\nStep 4: Cancelling room...");
    console.log("Cancelling room...");

    const cancelResult = await retryWithBackoff(async () => {
      return await gameRoom.cancelRoom({
        walletKeyPair: keypair1.keypair,
        roomId: createResult.roomId!,
        currency: CURRENCY.USDC as "USDC" | "USDT",
      });
    });

    if (!cancelResult.success) {
      throw new Error(`Cancel room failed: ${cancelResult}`);
    }

    console.log("Room cancelled successfully");
    console.log(`Transaction digest: ${cancelResult.digest}`);

    // Wait a moment for transaction to be processed
    await sleep(2000);

    // Step 5: Verify final balances
    console.log("\nStep 5: Verifying final balances...");
    const finalBalances = await getBalances(client, [keypair1, keypair2]);
    logBalances(finalBalances, "Final Balances");

    // Get final balances
    const finalBalance1 = finalBalances.find(b => b.name === "Key 1 (Creator)")!.balance;
    const finalBalance2 = finalBalances.find(b => b.name === "Key 2 (Joiner)")!.balance;

    // Calculate expected balances
    // Key 1 (Creator): Initial - entry fee + entry fee = Initial (full refund)
    // Key 2 (Joiner): Initial - entry fee + entry fee = Initial (full refund from leaving)
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
      leaveDigest: leaveResult.digest,
      cancelDigest: cancelResult.digest,
      balance1Correct,
      balance2Correct,
      balanceAfterLeave: balanceAfterLeave2
    });
  } catch (error) {
    console.error(`\nTest failed with error:`, error);
    logTestResult(testName, false, { error: error.message });
    throw error;
  }
}

// Run the test if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testRoomCreationJoinLeaveCancel()
    .then(() => {
      console.log("\nTest completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\nTest failed:", error);
      process.exit(1);
    });
}

export { testRoomCreationJoinLeaveCancel }; 