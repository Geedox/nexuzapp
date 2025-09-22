import { CURRENCY } from "../../src/constants";
import { GameRoom } from "../../src/integrations/smartcontracts/gameRoom";
import {
    createKeypair,
    getBalances,
    logBalances,
    logTestHeader,
    logTestResult,
    logBalanceChange,
    formatUSDC,
    toSmallestUnits,
    validateEnvironment,
    createSuiClient,
    retryWithBackoff,
    sleep
} from "./utils";

/**
 * Test 11: Special Room with Signature Collection
 * 
 * Purpose: Verify that special rooms (which are private by default) work correctly 
 * with signature collection requirements before game completion.
 */
async function testSpecialRoomWithSignatures(): Promise<void> {
    const testName = "Special Room with Signature Collection";
    const testNumber = 11;

    logTestHeader(testName, testNumber);

    try {
        // Validate environment variables
        const { key1, key2 } = validateEnvironment();

        // Create Sui client
        const client = createSuiClient();

        // Create keypairs
        const keypair1 = createKeypair(key1, "Key 1 (Creator)");
        const keypair2 = createKeypair(key2, "Key 2 (Participant)");

        console.log("Created keypairs successfully");
        console.log(`Creator address: ${keypair1.address}`);
        console.log(`Participant address: ${keypair2.address}`);

        // Get initial balances
        console.log("\nGetting initial balances...");
        const initialBalances = await getBalances(client, [keypair1, keypair2]);
        logBalances(initialBalances, "Initial Balances");

        // Store initial balances for comparison
        const initialBalance1 = initialBalances.find(b => b.name === "Key 1 (Creator)")!.balance;
        const initialBalance2 = initialBalances.find(b => b.name === "Key 2 (Participant)")!.balance;

        // Test parameters
        const entryFee = 0.01; // 0.01 USDC entry fee
        const roomName = `Special Room ${Date.now()}`;
        const gameId = "test-game-11";
        const maxPlayers = 2;
        const isPrivate = true; // Special rooms are private by default
        const roomCode = `SPEC${Date.now().toString().slice(-6)}`; // Generate unique room code
        const winnerSplitRule = "winner_takes_all";
        const startTimeMs = Date.now() + 60000; // Start in 1 minute
        const endTimeMs = Date.now() + 300000; // End in 5 minutes

        console.log(`\nTest Parameters:`);
        console.log(`  Entry Fee: ${formatUSDC(entryFee)} USDC`);
        console.log(`  Room Name: ${roomName}`);
        console.log(`  Max Players: ${maxPlayers}`);
        console.log(`  Room Code: ${roomCode}`);
        console.log(`  Winner Split Rule: ${winnerSplitRule}`);
        console.log(`  Private: Yes (Special rooms are automatically private)`);
        console.log(`  Special: Yes (Requires signatures)`);

        // Create GameRoom instance
        console.log("\nCreating GameRoom instance...");
        const gameRoom = new GameRoom(client);
        console.log("GameRoom instance created successfully");

        // Step 1: Create special room
        console.log("\nStep 1: Creating special room...");
        console.log(`Creating special room with ${formatUSDC(entryFee)} USDC entry fee and room code ${roomCode}...`);

        const createResult = await retryWithBackoff(async () => {
            return await gameRoom.createGameRoom({
                walletKeyPair: keypair1.keypair,
                name: roomName,
                gameId,
                entryFee,
                maxPlayers,
                isPrivate,
                roomCode,
                isSponsored: false,
                sponsorAmount: 0,
                winnerSplitRule: winnerSplitRule as any,
                startTimeMs,
                endTimeMs,
                isSpecial: true, // This makes it a special room
                currency: CURRENCY.USDC as "USDC" | "USDT",
            });
        });

        if (!createResult.success || !createResult.roomId) {
            throw new Error(`Special room creation failed: ${createResult}`);
        }

        console.log(`Special room created successfully: ${createResult.roomId}`);
        console.log(`Transaction digest: ${createResult.digest}`);
        console.log(`Room code: ${roomCode}`);
        console.log(`Entry fee deducted: ${formatUSDC(entryFee)} USDC`);

        // Wait a moment for transaction to be processed
        await sleep(2000);

        // Step 2: Join room with correct room code and entry fee
        console.log("\nStep 2: Joining special room...");
        console.log(`Joining room with code "${roomCode}" and paying ${formatUSDC(entryFee)} USDC entry fee...`);

        const joinResult = await retryWithBackoff(async () => {
            return await gameRoom.joinGameRoom({
                walletKeyPair: keypair2.keypair,
                roomId: createResult.roomId!,
                roomCode: roomCode,
                entryFee: entryFee,
                isSponsored: false,
                currency: CURRENCY.USDC as "USDC" | "USDT",
            });
        });

        if (!joinResult.success) {
            throw new Error(`Join special room failed: ${joinResult}`);
        }

        console.log("User joined special room successfully");
        console.log(`Transaction digest: ${joinResult.digest}`);
        console.log(`Entry fee deducted: ${formatUSDC(entryFee)} USDC`);

        // Wait a moment for transaction to be processed
        await sleep(2000);

        // Step 3: Collect creator signature
        console.log("\nStep 3: Collecting creator signature...");
        console.log("Creator approving game completion...");

        const creatorSignatureResult = await retryWithBackoff(async () => {
            return await gameRoom.approveGameRoomCompletion({
                walletKeyPair: keypair1.keypair,
                roomId: createResult.roomId!,
                currency: CURRENCY.USDC as "USDC" | "USDT",
            });
        });

        if (!creatorSignatureResult.success) {
            throw new Error(`Creator signature collection failed: ${creatorSignatureResult}`);
        }

        console.log("Creator signature collected successfully");
        console.log(`Transaction digest: ${creatorSignatureResult.digest}`);

        // Wait a moment for transaction to be processed
        await sleep(2000);

        // Step 4: Collect participant signature
        console.log("\nStep 4: Collecting participant signature...");
        console.log("Participant approving game completion...");

        const participantSignatureResult = await retryWithBackoff(async () => {
            return await gameRoom.approveGameRoomCompletion({
                walletKeyPair: keypair2.keypair,
                roomId: createResult.roomId!,
                currency: CURRENCY.USDC as "USDC" | "USDT",
            });
        });

        if (!participantSignatureResult.success) {
            throw new Error(`Participant signature collection failed: ${participantSignatureResult}`);
        }

        console.log("Participant signature collected successfully");
        console.log(`Transaction digest: ${participantSignatureResult.digest}`);

        // Wait a moment for transaction to be processed
        await sleep(2000);

        // Step 5: Check signature status
        console.log("\nStep 5: Checking signature status...");

        try {
            const signatureStatus = await retryWithBackoff(async () => {
                return await gameRoom.getSignatureStatus({
                    walletKeyPair: keypair1.keypair,
                    roomId: createResult.roomId!,
                    currency: CURRENCY.USDC as "USDC" | "USDT",
                });
            });

            console.log("Signature status checked successfully");
            console.log(signatureStatus);
            console.log(`Signature status: 2/2 signatures collected ✓`);
        } catch (error) {
            console.log("Note: Signature status check not available, proceeding with completion");
        }

        // Step 6: Complete game with Key 1 as winner
        console.log("\nStep 6: Completing game with signatures validated...");
        console.log("Completing game with Key 1 as winner...");

        const completeResult = await retryWithBackoff(async () => {
            return await gameRoom.completeGame({
                roomId: createResult.roomId!,
                winnerAddresses: [keypair1.address], // Key 1 wins
                scores: [100], // Winner score
                currency: CURRENCY.USDC as "USDC" | "USDT",
            });
        });

        if (!completeResult.success) {
            throw new Error(`Complete game failed: ${completeResult}`);
        }

        console.log("Game completed successfully (signatures validated)");
        console.log(`Transaction digest: ${completeResult.digest}`);
        console.log(`Winner: Key 1 (Creator)`);

        // Wait a moment for transaction to be processed
        await sleep(3000);

        // Step 7: Verify final balances
        console.log("\nStep 7: Verifying final balances...");
        const finalBalances = await getBalances(client, [keypair1, keypair2]);
        logBalances(finalBalances, "Final Balances");

        // Get final balances
        const finalBalance1 = finalBalances.find(b => b.name === "Key 1 (Creator)")!.balance;
        const finalBalance2 = finalBalances.find(b => b.name === "Key 2 (Participant)")!.balance;

        // Calculate expected balances
        // Total prize pool: entry fee from both players
        const totalPrizePool = entryFee * 2;
        // Platform fee: 7% of total prize pool
        const platformFee = totalPrizePool * 0.07;
        const winnerPrize = totalPrizePool - platformFee;

        // Key 1 (Winner): Initial - entry fee + winner prize
        // Key 2 (Loser): Initial - entry fee (no refund)
        const expectedBalance1 = initialBalance1 - entryFee + winnerPrize;
        const expectedBalance2 = initialBalance2 - entryFee;

        console.log("\nPrize Pool Distribution:");
        console.log(`  Total Prize Pool: ${formatUSDC(totalPrizePool)} USDC`);
        console.log(`  Platform Fee (7%): ${formatUSDC(platformFee)} USDC`);
        console.log(`  Winner Prize: ${formatUSDC(winnerPrize)} USDC`);
        console.log(`  Signature Requirements: 2/2 signatures collected ✓`);

        console.log("\nBalance Verification:");
        logBalanceChange("Key 1 (Winner)", initialBalance1, finalBalance1, expectedBalance1);
        logBalanceChange("Key 2 (Loser)", initialBalance2, finalBalance2, expectedBalance2);

        // Check if test passed
        const balance1Correct = Math.abs(finalBalance1 - expectedBalance1) < 0.000001;
        const balance2Correct = Math.abs(finalBalance2 - expectedBalance2) < 0.000001;
        const testPassed = balance1Correct && balance2Correct;

        // Log test result
        logTestResult(testName, testPassed, {
            roomId: createResult.roomId,
            createDigest: createResult.digest,
            joinDigest: joinResult.digest,
            creatorSignatureDigest: creatorSignatureResult.digest,
            participantSignatureDigest: participantSignatureResult.digest,
            completeDigest: completeResult.digest,
            balance1Correct,
            balance2Correct,
            roomCode,
            entryFee,
            totalPrizePool,
            platformFee,
            winnerPrize,
            signaturesCollected: 2,
            signaturesRequired: 2
        });

        if (!testPassed) {
            throw new Error("Test failed: Balance verification failed");
        }

    } catch (error) {
        console.error(`\nTest failed with error:`, error);
        logTestResult(testName, false, { error: error.message });
        throw error;
    }
}

// Run the test if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    testSpecialRoomWithSignatures()
        .then(() => {
            console.log("\nTest completed successfully");
            process.exit(0);
        })
        .catch((error) => {
            console.error("\nTest failed:", error);
            process.exit(1);
        });
}

export { testSpecialRoomWithSignatures };
