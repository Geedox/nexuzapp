import { config } from "dotenv";
config();
import { SuiClient } from "@mysten/sui.js/client";
import {
  createKeypair,
  createSuiClient,
  validateEnvironment,
  transferSUI,
  transferUSDC,
  getSUIBalance,
  getUSDCBalance,
  getAllBalances,
  logAllBalances,
  fundAddressWithSUI,
  fundAddressWithUSDC,
  checkTestReadiness,
  sleep
} from "./utils";

/**
 * Example script demonstrating transfer utility functions
 * 
 * This script shows how to:
 * 1. Transfer SUI between addresses
 * 2. Transfer USDC between addresses
 * 3. Check balances before and after transfers
 * 4. Fund addresses for testing
 * 5. Verify test readiness
 */

async function transfer(): Promise<void> {
  console.log("=== Transfer Utility Functions Example ===\n");

  try {
    // Validate environment variables
    const { key1, key2 } = validateEnvironment();

    // Create Sui client
    const client = createSuiClient();

    // Create keypairs
    const keypair1 = createKeypair(key1, "Key 1 (Sender)");
    const keypair2 = createKeypair(key2, "Key 2 (Recipient)");

    console.log("Created keypairs successfully");
    console.log(`Sender address: ${keypair1.address}`);
    console.log(`Recipient address: ${keypair2.address}\n`);

    // Check initial balances
    console.log("=== Initial Balances ===");
    const initialBalances = await getAllBalances(client, [keypair1, keypair2]);
    logAllBalances(initialBalances, "Initial Balances");

    // Check test readiness
    console.log("\n=== Checking Test Readiness ===");
    const readiness1 = await checkTestReadiness(client, keypair1.address, 0.1, 0.1);
    const readiness2 = await checkTestReadiness(client, keypair2.address, 0.1, 0.1);

    console.log(`Key 1 ready: ${readiness1.ready ? '✓' : '✗'}`);
    console.log(`  SUI: ${readiness1.sui.balance.toFixed(9)} (${readiness1.sui.sufficient ? 'Sufficient' : 'Insufficient'})`);
    console.log(`  USDC: ${readiness1.usdc.balance.toFixed(6)} (${readiness1.usdc.sufficient ? 'Sufficient' : 'Insufficient'})`);

    console.log(`Key 2 ready: ${readiness2.ready ? '✓' : '✗'}`);
    console.log(`  SUI: ${readiness2.sui.balance.toFixed(9)} (${readiness2.sui.sufficient ? 'Sufficient' : 'Insufficient'})`);
    console.log(`  USDC: ${readiness2.usdc.balance.toFixed(6)} (${readiness2.usdc.sufficient ? 'Sufficient' : 'Insufficient'})`);

    //1: Transfer SUI
    // console.log("\n=== SUI Transfer ===");
    // const suiTransferAmount = 0.5; // 0.5 SUI

    // if (readiness1.sui.sufficient) {
    //   console.log(`Transferring ${suiTransferAmount} SUI from Key 1 to Key 2...`);

    //   const suiResult = await transferSUI(client, keypair1.keypair, keypair2.address, suiTransferAmount);

    //   if (suiResult.success) {
    //     console.log(`SUI transfer successful! Digest: ${suiResult.digest}`);

    //     // Wait for transaction to be processed
    //     await sleep(2000);

    //     // Check balances after SUI transfer
    //     console.log("\n=== Balances After SUI Transfer ===");
    //     const afterSuiBalances = await getAllBalances(client, [keypair1, keypair2]);
    //     logAllBalances(afterSuiBalances, "Balances After SUI Transfer");
    //   } else {
    //     console.error(`SUI transfer failed: ${suiResult.error}`);
    //   }
    // } else {
    //   console.log("Skipping SUI transfer - insufficient balance");
    // }

    // Example 2: Transfer USDC
    console.log("\n=== USDC Transfer ===");
    const usdcTransferAmount = 0.05; // 0.05 USDC

    if (readiness1.usdc.sufficient) {
      console.log(`Transferring ${usdcTransferAmount} USDC from Key 1 to Key 2...`);

      const usdcResult = await transferUSDC(client, keypair1.keypair, keypair2.address, usdcTransferAmount);

      if (usdcResult.success) {
        console.log(`USDC transfer successful! Digest: ${usdcResult.digest}`);

        // Wait for transaction to be processed
        await sleep(2000);

        // Check balances after USDC transfer
        console.log("\n=== Balances After USDC Transfer ===");
        const afterUsdcBalances = await getAllBalances(client, [keypair1, keypair2]);
        logAllBalances(afterUsdcBalances, "Balances After USDC Transfer");
      } else {
        console.error(`USDC transfer failed: ${usdcResult.error}`);
      }
    } else {
      console.log("Skipping USDC transfer - insufficient balance");
    }

    // Example 3: Funding addresses (if needed)
    console.log("\n=== Funding Addresses ===");

    // Check if Key 2 needs funding
    const finalReadiness2 = await checkTestReadiness(client, keypair2.address, 0.05, 0.05);

    if (!finalReadiness2.ready) {
      console.log("Key 2 needs funding for testing...");

      // Fund with SUI if needed
      if (!finalReadiness2.sui.sufficient) {
        const neededSUI = 0.05 - finalReadiness2.sui.balance;
        console.log(`Funding Key 2 with ${neededSUI.toFixed(9)} SUI...`);

        if (readiness1.sui.sufficient) {
          const fundSuiResult = await fundAddressWithSUI(client, keypair1.keypair, keypair2.address, neededSUI);
          if (fundSuiResult.success) {
            console.log("SUI funding successful!");
            await sleep(2000);
          }
        }
      }

      // Fund with USDC if needed
      if (!finalReadiness2.usdc.sufficient) {
        const neededUSDC = 0.05 - finalReadiness2.usdc.balance;
        console.log(`Funding Key 2 with ${neededUSDC.toFixed(6)} USDC...`);

        if (readiness1.usdc.sufficient) {
          const fundUsdcResult = await fundAddressWithUSDC(client, keypair1.keypair, keypair2.address, neededUSDC);
          if (fundUsdcResult.success) {
            console.log("USDC funding successful!");
            await sleep(2000);
          }
        }
      }
    } else {
      console.log("Key 2 already has sufficient balances for testing");
    }

    // Final balance check
    console.log("\n=== Final Balances ===");
    const finalBalances = await getAllBalances(client, [keypair1, keypair2]);
    logAllBalances(finalBalances, "Final Balances");

    // Final readiness check
    console.log("\n=== Final Test Readiness Check ===");
    const finalReadiness1 = await checkTestReadiness(client, keypair1.address, 0.05, 0.05);
    const finalReadiness2Updated = await checkTestReadiness(client, keypair2.address, 0.05, 0.05);

    console.log(`Key 1 ready: ${finalReadiness1.ready ? '✓' : '✗'}`);
    console.log(`Key 2 ready: ${finalReadiness2Updated.ready ? '✓' : '✗'}`);

    console.log("\n=== Transfer Example Completed Successfully ===");

  } catch (error) {
    console.error("Transfer example failed:", error);
    throw error;
  }
}

// Run the example if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  transfer()
    .then(() => {
      console.log("\nTransfer completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\nTransfer failed:", error);
      process.exit(1);
    });
}

export { transfer };  