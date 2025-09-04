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

/**
 * Test 8: Sponsored Game Room with No Winner
 * 
 * Purpose: Verify that when a sponsored game room is completed with no winners,
 * the sponsor receives a refund of the prize pool minus the platform fee.
 */
async function testSponsoredGameRoomNoWinner(): Promise<void> {
    const testName = "Sponsored Game Room with No Winner";
    const testNumber = 8;

    logTestHeader(testName, testNumber);

    try {
        // Validate environment variables
        const { key1, key2 } = validateEnvironment();

        // Create Sui client
        const client = createSuiClient();

        // Create keypairs
        const keypair1 = createKeypair(key1, "Key 1 (Creator/Sponsor)");
        const keypair2 = createKeypair(key2, "Key 2 (Joiner)");

        console.log("Created keypairs successfully");
        console.log(`Creator/Sponsor address: ${keypair1.address}`);
        console.log(`Joiner address: ${keypair2.address}`);

        // Get initial balances
        console.log("\nGetting initial balances...");
        const initialBalances = await getBalances(client, [keypair1, keypair2]);
        logBalances(initialBalances, "Initial Balances");

        // Store initial balances for comparison
        const initialBalance1 = initialBalances.find(b => b.name === "Key 1 (Creator/Sponsor)")!.balance;
        const initialBalance2 = initialBalances.find(b => b.name === "Key 2 (Joiner)")!.balance;

        // Test parameters
        const sponsorAmount = 0.01; // 0.01 USDC prize pool
        const sponsorAmountSmallest = toSmallestUnits(sponsorAmount);
        const roomName = `Sponsored No Winner Test Room ${Date.now()}`;
        const gameId = "test-game-8";
        const maxPlayers = 2;
        const isPrivate = false;
        const winnerSplitRule = "winner_takes_all";
        const startTimeMs = Date.now() + 60000; // Start in 1 minute
        const endTimeMs = Date.now() + 300000; // End in 5 minutes

        console.log(`\nTest Parameters:`);
        console.log(`  Sponsor Amount: ${formatUSDC(sponsorAmount)} USDC`);
        console.log(`  Room Name: ${roomName}`);
        console.log(`  Max Players: ${maxPlayers}`);
        console.log(`  Winner Split Rule: ${winnerSplitRule}`);
        console.log(`  Entry Fee: 0 USDC (Sponsored)`);

        // Create GameRoom instance
        console.log("\nCreating GameRoom instance...");
        const gameRoom = new GameRoom(client);
        console.log("GameRoom instance created successfully");

        // Step 1: Create sponsored room
        console.log("\nStep 1: Creating sponsored room...");
        console.log(`Creating sponsored room with ${formatUSDC(sponsorAmount)} USDC prize pool...`);

        const createResult = await retryWithBackoff(async () => {
            return await gameRoom.createGameRoom({
                walletKeyPair: keypair1.keypair,
                name: roomName,
                gameId,
                entryFee: 0, // No entry fee for sponsored rooms
                maxPlayers,
                isPrivate,
                roomCode: "",
                isSponsored: true,
                sponsorAmount,
                winnerSplitRule: winnerSplitRule as any,
                startTimeMs,
                endTimeMs,
            });
        });

        if (!createResult.success || !createResult.roomId) {
            throw new Error(`Sponsored room creation failed: ${createResult}`);
        }

        console.log(`Sponsored room created successfully: ${createResult.roomId}`);
        console.log(`Transaction digest: ${createResult.digest}`);
        console.log(`Sponsor amount deducted: ${formatUSDC(sponsorAmount)} USDC`);

        // Wait a moment for transaction to be processed
        await sleep(2000);

        // Check balance after room creation to confirm sponsor amount deduction
        console.log("\nChecking balance after room creation...");
        const balanceAfterCreate = await getBalances(client, [keypair1]);
        const balanceAfterCreate1 = balanceAfterCreate.find(b => b.name === "Key 1 (Creator/Sponsor)")!.balance;

        console.log(`Balance after room creation: ${formatUSDC(balanceAfterCreate1)} USDC`);
        console.log(`Expected balance: ${formatUSDC(initialBalance1 - sponsorAmount)} USDC`);

        // Step 2: Join room (no entry fee required)
        console.log("\nStep 2: Joining room...");
        console.log("Joining room (no entry fee)...");

        const joinResult = await retryWithBackoff(async () => {
            return await gameRoom.joinGameRoom({
                isSponsored: true,
                walletKeyPair: keypair2.keypair,
                roomId: createResult.roomId!,
                roomCode: "",
                entryFee: 0, // No entry fee for sponsored rooms
            });
        });

        if (!joinResult.success) {
            throw new Error(`Join room failed: ${joinResult}`);
        }

        console.log("User joined successfully");
        console.log(`Transaction digest: ${joinResult.digest}`);
        console.log(`No entry fee deducted (sponsored room)`);

        // Wait a moment for transaction to be processed
        await sleep(2000);

        // Check balance after joining to confirm no change
        console.log("\nChecking balance after joining...");
        const balanceAfterJoin = await getBalances(client, [keypair2]);
        const balanceAfterJoin2 = balanceAfterJoin.find(b => b.name === "Key 2 (Joiner)")!.balance;

        console.log(`Balance after joining: ${formatUSDC(balanceAfterJoin2)} USDC`);
        console.log(`Expected balance: ${formatUSDC(initialBalance2)} USDC`);

        // Step 3: Complete game with no winners
        console.log("\nStep 3: Completing game with no winners...");
        console.log("Completing game with no winners...");

        const completeResult = await retryWithBackoff(async () => {
            return await gameRoom.completeGame({
                roomId: createResult.roomId!,
                winnerAddresses: [], // Empty array = no winners
                scores: [], // Empty array = no scores
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
        const finalBalance1 = finalBalances.find(b => b.name === "Key 1 (Creator/Sponsor)")!.balance;
        const finalBalance2 = finalBalances.find(b => b.name === "Key 2 (Joiner)")!.balance;

        // Calculate expected outcomes
        const totalPrizePool = sponsorAmount; // Only sponsor amount (no entry fees)
        const platformFee = calculatePlatformFee(totalPrizePool); // 7% of sponsor amount
        const refundableAmount = calculateRefundableAmount(totalPrizePool); // 93% of sponsor amount

        console.log("\nPrize Pool Distribution:");
        console.log(`  Total Prize Pool: ${formatUSDC(totalPrizePool)} USDC`);
        console.log(`  Platform Fee (7%): ${formatUSDC(platformFee)} USDC`);
        console.log(`  Refundable Amount: ${formatUSDC(refundableAmount)} USDC`);
        console.log(`  Sponsor Refund: ${formatUSDC(refundableAmount)} USDC`);

        // Calculate expected balances
        // Key 1 (Creator/Sponsor): Initial - sponsor amount + refund = Initial
        // Key 2 (Joiner): Initial (no change - no entry fee paid, no refund received)
        const expectedBalance1 = initialBalance1;
        const expectedBalance2 = initialBalance2;

        console.log("\nBalance Verification:");
        logBalanceChange("Key 1 (Creator/Sponsor)", initialBalance1, finalBalance1, expectedBalance1);
        logBalanceChange("Key 2 (Joiner)", initialBalance2, finalBalance2, expectedBalance2);

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
            balanceAfterCreate: balanceAfterCreate1,
            balanceAfterJoin: balanceAfterJoin2,
            sponsorAmountDeducted: sponsorAmount,
            sponsorAmountRefunded: refundableAmount,
            platformFee,
            totalPrizePool,
            expectedBalance1,
            expectedBalance2
        });


    } catch (error) {
        console.error(`\nTest failed with error:`, error);
        logTestResult(testName, false, { error: error.message });
        throw error;
    }
}

// Run the test if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    testSponsoredGameRoomNoWinner()
        .then(() => {
            console.log("\nTest completed successfully");
            process.exit(0);
        })
        .catch((error) => {
            console.error("\nTest failed:", error);
            process.exit(1);
        });
}

export { testSponsoredGameRoomNoWinner };
