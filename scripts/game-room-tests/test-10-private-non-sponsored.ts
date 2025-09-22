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
 * Test 10: Private Non-Sponsored Room
 * 
 * Purpose: Verify that private non-sponsored rooms work correctly with room codes, 
 * requiring both the correct code and entry fee to join.
 */
async function testPrivateNonSponsoredRoom(): Promise<void> {
    const testName = "Private Non-Sponsored Room";
    const testNumber = 10;

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
        const entryFee = 0.01; // 0.01 USDC entry fee
        const roomName = `Private Room ${Date.now()}`;
        const gameId = "test-game-10";
        const maxPlayers = 2;
        const isPrivate = true;
        const roomCode = `PRIV${Date.now().toString().slice(-6)}`; // Generate unique room code
        const winnerSplitRule = "winner_takes_all";
        const startTimeMs = Date.now() + 60000; // Start in 1 minute
        const endTimeMs = Date.now() + 300000; // End in 5 minutes

        console.log(`\nTest Parameters:`);
        console.log(`  Entry Fee: ${formatUSDC(entryFee)} USDC`);
        console.log(`  Room Name: ${roomName}`);
        console.log(`  Max Players: ${maxPlayers}`);
        console.log(`  Room Code: ${roomCode}`);
        console.log(`  Winner Split Rule: ${winnerSplitRule}`);
        console.log(`  Private: Yes`);
        console.log(`  Sponsored: No`);

        // Create GameRoom instance
        console.log("\nCreating GameRoom instance...");
        const gameRoom = new GameRoom(client);
        console.log("GameRoom instance created successfully");

        // Step 1: Create private non-sponsored room
        console.log("\nStep 1: Creating private non-sponsored room...");
        console.log(`Creating private room with ${formatUSDC(entryFee)} USDC entry fee and room code ${roomCode}...`);

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
                isSpecial: false,
                currency: CURRENCY.USDC as "USDC" | "USDT",
            });
        });

        if (!createResult.success || !createResult.roomId) {
            throw new Error(`Private room creation failed: ${createResult}`);
        }

        console.log(`Private room created successfully: ${createResult.roomId}`);
        console.log(`Transaction digest: ${createResult.digest}`);
        console.log(`Room code: ${roomCode}`);
        console.log(`Entry fee deducted: ${formatUSDC(entryFee)} USDC`);

        // Wait a moment for transaction to be processed
        await sleep(2000);

        // Check balance after room creation to confirm entry fee deduction
        console.log("\nChecking balance after room creation...");
        const balanceAfterCreate = await getBalances(client, [keypair1]);
        const balanceAfterCreate1 = balanceAfterCreate.find(b => b.name === "Key 1 (Creator)")!.balance;

        console.log(`Balance after room creation: ${formatUSDC(balanceAfterCreate1)} USDC`);
        console.log(`Expected balance: ${formatUSDC(initialBalance1 - entryFee)} USDC`);

        // Step 2: Join room with correct room code and entry fee
        console.log("\nStep 2: Joining private room with room code and entry fee...");
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
            throw new Error(`Join private room failed: ${joinResult}`);
        }

        console.log("User joined private room successfully");
        console.log(`Transaction digest: ${joinResult.digest}`);
        console.log(`Entry fee deducted: ${formatUSDC(entryFee)} USDC`);

        // Wait a moment for transaction to be processed
        await sleep(2000);

        // Check balance after joining to confirm entry fee deduction
        console.log("\nChecking balance after joining...");
        const balanceAfterJoin = await getBalances(client, [keypair2]);
        const balanceAfterJoin2 = balanceAfterJoin.find(b => b.name === "Key 2 (Joiner)")!.balance;

        console.log(`Balance after joining: ${formatUSDC(balanceAfterJoin2)} USDC`);
        console.log(`Expected balance: ${formatUSDC(initialBalance2 - entryFee)} USDC`);

        // Step 3: Complete game with Key 1 as winner
        console.log("\nStep 3: Completing game with Key 1 as winner...");
        console.log("Completing game...");

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

        console.log("Game completed successfully");
        console.log(`Transaction digest: ${completeResult.digest}`);
        console.log(`Winner: Key 1 (Creator)`);

        // Wait a moment for transaction to be processed
        await sleep(3000);

        // Step 4: Verify final balances
        console.log("\nStep 4: Verifying final balances...");
        const finalBalances = await getBalances(client, [keypair1, keypair2]);
        logBalances(finalBalances, "Final Balances");

        // Get final balances
        const finalBalance1 = finalBalances.find(b => b.name === "Key 1 (Creator)")!.balance;
        const finalBalance2 = finalBalances.find(b => b.name === "Key 2 (Joiner)")!.balance;

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
            completeDigest: completeResult.digest,
            balance1Correct,
            balance2Correct,
            roomCode,
            entryFee,
            totalPrizePool,
            platformFee,
            winnerPrize,
            balanceAfterCreate: balanceAfterCreate1,
            balanceAfterJoin: balanceAfterJoin2
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
    testPrivateNonSponsoredRoom()
        .then(() => {
            console.log("\nTest completed successfully");
            process.exit(0);
        })
        .catch((error) => {
            console.error("\nTest failed:", error);
            process.exit(1);
        });
}

export { testPrivateNonSponsoredRoom };
