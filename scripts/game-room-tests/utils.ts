import { config } from "dotenv";
config();
import { SuiClient } from "@mysten/sui.js/client";
import { Ed25519Keypair } from "@mysten/sui.js/keypairs/ed25519";
import { TransactionBlock } from "@mysten/sui.js/transactions";
import { COIN_TYPES } from "../../src/constants";

export interface TestKeypair {
  keypair: Ed25519Keypair;
  address: string;
  name: string;
}

export interface BalanceInfo {
  address: string;
  balance: number;
  name: string;
}

export interface TestResult {
  testName: string;
  passed: boolean;
  error?: string;
  details?: any;
}

/**
 * Create Ed25519Keypair from private key string
 */
export function createKeypair(privateKey: string, name: string): TestKeypair {
  try {
    // Handle hex format (with or without 0x prefix)
    let cleanKey = privateKey;
    if (privateKey.startsWith('0x')) {
      cleanKey = privateKey.slice(2);
    }

    // Validate hex format and length
    if (cleanKey.length !== 64) {
      throw new Error(`Private key must be 64 hex characters, got ${cleanKey.length}`);
    }

    if (!/^[0-9a-fA-F]{64}$/.test(cleanKey)) {
      throw new Error("Private key contains invalid hex characters");
    }

    // Convert hex string to bytes
    const bytes = new Uint8Array(32);
    for (let i = 0; i < 32; i++) {
      const hexByte = cleanKey.substr(i * 2, 2);
      bytes[i] = parseInt(hexByte, 16);
    }

    // Create keypair from secret key
    const keypair = Ed25519Keypair.fromSecretKey(bytes);
    const address = keypair.getPublicKey().toSuiAddress();

    return { keypair, address, name };
  } catch (error) {
    throw new Error(`Failed to create keypair for ${name}: ${error.message}`);
  }
}

/**
 * Get USDC balance for a specific address
 */
export async function getUSDCBalance(client: SuiClient, address: string): Promise<number> {
  try {
    const coins = await client.getCoins({
      owner: address,
      coinType: COIN_TYPES.USDC
    });

    const totalBalance = coins.data.reduce((sum, coin) => {
      return sum + Number(coin.balance);
    }, 0);

    // Convert from smallest units (6 decimals) to USDC units
    return totalBalance / Math.pow(10, 6);
  } catch (error) {
    console.error(`Error getting USDC balance for ${address}:`, error);
    return 0;
  }
}

/**
 * Get balances for all test keypairs
 */
export async function getBalances(client: SuiClient, keypairs: TestKeypair[]): Promise<BalanceInfo[]> {
  const balances: BalanceInfo[] = [];

  for (const keypair of keypairs) {
    const balance = await getUSDCBalance(client, keypair.address);
    balances.push({
      address: keypair.address,
      balance,
      name: keypair.name
    });
  }

  return balances;
}

/**
 * Log balances in a formatted way
 */
export function logBalances(balances: BalanceInfo[], title: string = "Balances") {
  console.log(`\n${title}:`);
  balances.forEach(({ name, balance, address }) => {
    console.log(`  ${name}: ${balance.toFixed(6)} USDC (${address})`);
  });
}

/**
 * Calculate expected balance after operations
 */
export function calculateExpectedBalance(
  initialBalance: number,
  deductions: number[],
  additions: number[]
): number {
  const totalDeductions = deductions.reduce((sum, amount) => sum + amount, 0);
  const totalAdditions = additions.reduce((sum, amount) => sum + amount, 0);
  return initialBalance - totalDeductions + totalAdditions;
}

/**
 * Format USDC amount for display (6 decimal places)
 */
export function formatUSDC(amount: number): string {
  return amount.toFixed(6);
}

/**
 * Convert USDC amount to smallest units (6 decimals)
 */
export function toSmallestUnits(amount: number): number {
  return Math.floor(amount * Math.pow(10, 6));
}

/**
 * Convert smallest units back to USDC amount
 */
export function fromSmallestUnits(amount: number): number {
  return amount / Math.pow(10, 6);
}

/**
 * Calculate platform fee (7%)
 */
export function calculatePlatformFee(totalAmount: number): number {
  return totalAmount * 0.07;
}

/**
 * Calculate refundable amount after platform fee
 */
export function calculateRefundableAmount(totalAmount: number): number {
  return totalAmount - calculatePlatformFee(totalAmount);
}

/**
 * Wait for a specified amount of time
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry a function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt === maxRetries) {
        throw error;
      }

      const delay = baseDelay * Math.pow(2, attempt);
      console.log(`Attempt ${attempt + 1} failed, retrying in ${delay}ms...`);
      await sleep(delay);
    }
  }

  throw lastError!;
}

/**
 * Log test header
 */
export function logTestHeader(testName: string, testNumber: number) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`=== Test ${testNumber}: ${testName} ===`);
  console.log(`${'='.repeat(60)}`);
}

/**
 * Log test result
 */
export function logTestResult(testName: string, passed: boolean, details?: any) {
  const status = passed ? 'PASSED ✓' : 'FAILED ✗';
  console.log(`\nTest Result: ${status}`);

  if (details) {
    console.log('Details:', details);
  }

  return { testName, passed, details };
}

/**
 * Log balance change
 */
export function logBalanceChange(
  name: string,
  initialBalance: number,
  finalBalance: number,
  expectedBalance: number
) {
  const change = finalBalance - initialBalance;
  const changeText = change >= 0 ? `+${formatUSDC(change)}` : formatUSDC(change);
  const status = Math.abs(finalBalance - expectedBalance) < 0.000001 ? '✓' : '✗';

  console.log(`  ${name}: ${formatUSDC(finalBalance)} (Expected: ${formatUSDC(expectedBalance)}) ${status}`);

  if (Math.abs(change) > 0.000001) {
    console.log(`    Balance change: ${changeText} USDC`);
  }
}

/**
 * Validate environment variables
 */
export function validateEnvironment(): { key1: string; key2: string } {
  const key1 = process.env.VITE_KEY_1;
  const key2 = process.env.VITE_KEY_2;

  if (!key1) {
    throw new Error("VITE_KEY_1 environment variable is not set");
  }

  if (!key2) {
    throw new Error("VITE_KEY_2 environment variable is not set");
  }

  return { key1, key2 };
}

/**
 * Create Sui client based on network configuration
 */
export function createSuiClient(): SuiClient {
  // Default to mainnet, but can be overridden
  const network = process.env.SUI_NETWORK || "mainnet";
  const rpcUrl = process.env.SUI_RPC_URL || `https://fullnode.${network}.sui.io:443`;

  return new SuiClient({ url: rpcUrl });
}

/**
 * Transfer SUI coins from one address to another
 */
export async function transferSUI(
  client: SuiClient,
  fromKeypair: Ed25519Keypair,
  toAddress: string,
  amount: number
): Promise<{ success: boolean; digest?: string; error?: string }> {
  try {
    console.log(`Transferring ${amount} SUI from ${fromKeypair.getPublicKey().toSuiAddress()} to ${toAddress}...`);

    // Create transaction block
    const tx = new TransactionBlock();

    // Split coins from sender (amount in MIST - 9 decimals)
    const amountMist = Math.floor(amount * Math.pow(10, 9));
    const [coin] = tx.splitCoins(tx.gas, [amountMist]);

    // Transfer to recipient
    tx.transferObjects([coin], tx.pure(toAddress));

    // Execute transaction
    const result = await client.signAndExecuteTransactionBlock({
      signer: fromKeypair,
      transactionBlock: tx,
      options: {
        showEffects: true,
        showEvents: true,
      },
    });

    if (result.effects?.status.status === 'success') {
      console.log(`SUI transfer successful! Digest: ${result.digest}`);
      return { success: true, digest: result.digest };
    } else {
      const error = result.effects?.status.error || 'Unknown error';
      console.error(`SUI transfer failed: ${error}`);
      return { success: false, error };
    }
  } catch (error) {
    console.error(`SUI transfer error:`, error);
    return { success: false, error: error.message };
  }
}

/**
 * Transfer USDC coins from one address to another
 */
export async function transferUSDC(
  client: SuiClient,
  fromKeypair: Ed25519Keypair,
  toAddress: string,
  amount: number
): Promise<{ success: boolean; digest?: string; error?: string }> {
  try {
    console.log(`Transferring ${formatUSDC(amount)} USDC from ${fromKeypair.getPublicKey().toSuiAddress()} to ${toAddress}...`);

    // Create transaction block
    const tx = new TransactionBlock();

    // Split USDC coins from sender (amount in smallest units - 6 decimals)
    const amountSmallest = toSmallestUnits(amount);

    // Get USDC coins owned by sender
    const coins = await client.getCoins({
      owner: fromKeypair.getPublicKey().toSuiAddress(),
      coinType: COIN_TYPES.USDC,
    });

    if (coins.data.length === 0) {
      throw new Error('No USDC coins found for sender');
    }

    // Debug: Log all available coins
    console.log(`Found ${coins.data.length} USDC coins:`);
    coins.data.forEach((coin, index) => {
      console.log(`  Coin ${index}: objectId=${coin.coinObjectId}, balance=${coin.balance}`);
    });

    // Use the first coin that has sufficient balance
    let selectedCoin: typeof coins.data[0] | null = null;
    for (const coin of coins.data) {
      if (Number(coin.balance) >= amountSmallest) {
        selectedCoin = coin;
        break;
      }
    }

    if (!selectedCoin) {
      throw new Error(`Insufficient USDC balance. Required: ${formatUSDC(amount)}, Available: ${formatUSDC(coins.data.reduce((sum, c) => sum + Number(c.balance), 0) / Math.pow(10, 6))}`);
    }

    // Validate the selected coin has required properties
    if (!selectedCoin.coinObjectId) {
      throw new Error(`Invalid coin object: missing coinObjectId. Coin: ${JSON.stringify(selectedCoin)}`);
    }

    // Log the selected coin for debugging
    console.log(`Selected coin: ${selectedCoin.coinObjectId} with balance: ${selectedCoin.balance}`);

    // Split coins from the selected coin
    const [coin] = tx.splitCoins(tx.object(selectedCoin.coinObjectId), [amountSmallest]);

    // Transfer to recipient
    tx.transferObjects([coin], tx.pure(toAddress));

    // Execute transaction
    const result = await client.signAndExecuteTransactionBlock({
      signer: fromKeypair,
      transactionBlock: tx,
      options: {
        showEffects: true,
        showEvents: true,
      },
    });

    if (result.effects?.status.status === 'success') {
      console.log(`USDC transfer successful! Digest: ${result.digest}`);
      return { success: true, digest: result.digest };
    } else {
      const error = result.effects?.status.error || 'Unknown error';
      console.error(`USDC transfer failed: ${error}`);
      return { success: false, error };
    }
  } catch (error) {
    console.error(`USDC transfer error:`, error);
    return { success: false, error: error.message };
  }
}

/**
 * Get SUI balance for a specific address
 */
export async function getSUIBalance(client: SuiClient, address: string): Promise<number> {
  try {
    const coins = await client.getCoins({
      owner: address,
      coinType: '0x2::sui::SUI'
    });

    const totalBalance = coins.data.reduce((sum, coin) => {
      return sum + Number(coin.balance);
    }, 0);

    // Convert from MIST (9 decimals) to SUI units
    return totalBalance / Math.pow(10, 9);
  } catch (error) {
    console.error(`Error getting SUI balance for ${address}:`, error);
    return 0;
  }
}

/**
 * Get balances for all test keypairs (both SUI and USDC)
 */
export async function getAllBalances(client: SuiClient, keypairs: TestKeypair[]): Promise<{
  sui: BalanceInfo[];
  usdc: BalanceInfo[];
}> {
  const suiBalances: BalanceInfo[] = [];
  const usdcBalances: BalanceInfo[] = [];

  for (const keypair of keypairs) {
    const suiBalance = await getSUIBalance(client, keypair.address);
    const usdcBalance = await getUSDCBalance(client, keypair.address);

    suiBalances.push({
      address: keypair.address,
      balance: suiBalance,
      name: keypair.name
    });

    usdcBalances.push({
      address: keypair.address,
      balance: usdcBalance,
      name: keypair.name
    });
  }

  return { sui: suiBalances, usdc: usdcBalances };
}

/**
 * Log all balances (SUI and USDC) in a formatted way
 */
export function logAllBalances(
  balances: { sui: BalanceInfo[]; usdc: BalanceInfo[] },
  title: string = "Balances"
): void {
  console.log(`\n${title}:`);

  console.log(`  SUI Balances:`);
  balances.sui.forEach(({ name, balance, address }) => {
    console.log(`    ${name}: ${balance.toFixed(9)} SUI (${address})`);
  });

  console.log(`  USDC Balances:`);
  balances.usdc.forEach(({ name, balance, address }) => {
    console.log(`    ${name}: ${balance.toFixed(6)} USDC (${address})`);
  });
}

/**
 * Fund an address with SUI (useful for testing)
 */
export async function fundAddressWithSUI(
  client: SuiClient,
  fromKeypair: Ed25519Keypair,
  toAddress: string,
  amount: number
): Promise<{ success: boolean; digest?: string; error?: string }> {
  try {
    console.log(`Funding ${toAddress} with ${amount} SUI...`);

    const result = await transferSUI(client, fromKeypair, toAddress, amount);

    if (result.success) {
      console.log(`Funding successful! ${amount} SUI sent to ${toAddress}`);
    }

    return result;
  } catch (error) {
    console.error(`Funding error:`, error);
    return { success: false, error: error.message };
  }
}

/**
 * Fund an address with USDC (useful for testing)
 */
export async function fundAddressWithUSDC(
  client: SuiClient,
  fromKeypair: Ed25519Keypair,
  toAddress: string,
  amount: number
): Promise<{ success: boolean; digest?: string; error?: string }> {
  try {
    console.log(`Funding ${toAddress} with ${formatUSDC(amount)} USDC...`);

    const result = await transferUSDC(client, fromKeypair, toAddress, amount);

    if (result.success) {
      console.log(`Funding successful! ${formatUSDC(amount)} USDC sent to ${toAddress}`);
    }

    return result;
  } catch (error) {
    console.error(`Funding error:`, error);
    return { success: false, error: error.message };
  }
}

/**
 * Check if an address has sufficient balance for testing
 */
export async function checkTestReadiness(
  client: SuiClient,
  address: string,
  requiredSUI: number = 0.1,
  requiredUSDC: number = 0.1
): Promise<{
  ready: boolean;
  sui: { balance: number; sufficient: boolean };
  usdc: { balance: number; sufficient: boolean };
}> {
  const suiBalance = await getSUIBalance(client, address);
  const usdcBalance = await getUSDCBalance(client, address);

  const suiSufficient = suiBalance >= requiredSUI;
  const usdcSufficient = usdcBalance >= requiredUSDC;
  const ready = suiSufficient && usdcSufficient;

  return {
    ready,
    sui: { balance: suiBalance, sufficient: suiSufficient },
    usdc: { balance: usdcBalance, sufficient: usdcSufficient }
  };
} 