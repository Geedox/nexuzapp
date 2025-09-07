# Game Room Lifecycle Testing Suite

This comprehensive test suite validates the complete lifecycle of game rooms using the Sui Move smart contract. The tests cover all major scenarios from room creation to game completion, ensuring proper functionality of entry fees, refunds, prize distribution, and platform fee collection.

## Overview

The test suite consists of 8 individual test scenarios that validate different aspects of the game room smart contract:

1. **Room Creation → Join → Cancel → Refund** - Tests full refunds when rooms are cancelled
2. **Room Creation → Join → Leave → Cancel** - Tests user leaving and creator cancellation
3. **Sponsored Room → Join → Leave** - Tests sponsored rooms with no refunds
4. **Sponsored Room Cancellation** - Tests creator getting prize pool back
5. **Game Completion with No Winners** - Tests refunds minus platform fees
6. **Game Completion with Single Winner** - Tests winner getting full prize minus platform fee
7. **Game Completion with Top 2 Winners** - Tests 60%/40% split rule enforcement
8. **Sponsored Game Room with No Winner** - Tests sponsor refund minus platform fee

## Prerequisites

### Environment Variables

Set the following environment variables before running tests:

```bash
# Required: Test private keys
export VITE_KEY_1="your_first_private_key_here"
export VITE_KEY_2="your_second_private_key_here"

# Optional: Network configuration
export SUI_NETWORK="mainnet"  # or "testnet"
export SUI_RPC_URL="https://fullnode.mainnet.sui.io:443"  # Custom RPC URL
```

### Requirements

- Two private keys with sufficient USDC balances for testing
- Access to Sui network (mainnet or testnet)
- Node.js and npm/yarn installed
- Sufficient USDC balances (recommended: at least 0.1 USDC per key)

## Installation

The test suite is part of the main project. Ensure all dependencies are installed:

```bash
npm install
# or
yarn install
```

## Usage

### Run All Tests

```bash
npm run test:game-room
# or
yarn test:game-room
```

### Run Specific Test

```bash
npm run test:game-room test-1
npm run test:game-room test-3
npm run test:game-room test-7
```

### Help

```bash
npm run test:game-room -- --help
```

### Transfer Utilities

```bash
npm run transfer
```

## Test Parameters

All tests use the following standardized parameters to minimize costs:

- **Entry Fee**: 0.01 USDC (10,000 smallest units with 6 decimals)
- **Platform Fee**: 7% of total prize pool
- **Room Duration**: Short duration for testing efficiency
- **Max Players**: 2-3 players per test room
- **Winner Split Rules**: Various configurations to test all scenarios

## Expected Outcomes

### Test 1: Room Creation → Join → Cancel → Refund

- Both users receive full refunds
- Final balances = Initial balances
- No platform fees deducted

### Test 2: Room Creation → Join → Leave → Cancel

- Key 2 gets immediate refund when leaving
- Key 1 gets refund when cancelling
- Final balances = Initial balances

### Test 3: Sponsored Room → Join → Leave

- Key 1 pays sponsor amount (no refund)
- Key 2 pays no entry fee and gets no refund
- Key 1 final balance = Initial - sponsor amount

### Test 4: Sponsored Room Cancellation

- Key 1 gets full sponsor amount back
- Key 2 balance unchanged
- Final balances restored to initial

### Test 5: Game Completion with No Winners

- Platform fee: 7% of total prize pool
- Both users get proportional refunds minus platform fee
- Room status: completed

### Test 6: Game Completion with Single Winner

- Platform fee: 7% of total prize pool
- Winner gets 93% of total prize pool
- Loser gets no refund
- Room status: completed

### Test 7: Game Completion with Top 2 Winners

- Platform fee: 7% of total prize pool
- 1st place: 60% of 93% prize pool
- 2nd place: 40% of 93% prize pool
- Room status: completed

### Test 8: Sponsored Game Room with No Winner

- Platform fee: 7% of sponsor amount
- Sponsor gets refund: 93% of sponsor amount
- Joiner balance unchanged (no entry fee paid)
- Room status: completed

## File Structure

```
scripts/game-room-tests/
├── README.md                 # This file
├── index.ts                  # Main test runner
├── utils.ts                  # Common utilities and helpers
├── transfer.ts               # Script for transfer functions
├── test-1-cancel-refund.ts  # Test 1: Cancel with refunds
├── test-2-leave-cancel.ts   # Test 2: Leave then cancel
├── test-3-sponsored-leave.ts # Test 3: Sponsored room leave
├── test-4-sponsored-cancel.ts # Test 4: Sponsored room cancel
├── test-5-no-winners.ts     # Test 5: No winners completion
├── test-6-single-winner.ts  # Test 6: Single winner
├── test-7-top-2-winners.ts # Test 7: Top 2 winners
└── test-8-sponsored-no-winner.ts # Test 8: Sponsored room no winner
```

## Smart Contract Integration

The tests interact with the following smart contract:

- **Contract Address**: `0x6e51446bb0d7c9d9fa516f8a962ab8543412b1ef8375c3caad5e806f5d20a97b::game_room::game_room`
- **Store ID**: `0x1f19c53319e4774508a60194feaf86865aacd6642aa890e795e88891b1045360`
- **Network**: As configured in constants (mainnet/testnet)

## Transfer Utilities

The test suite includes comprehensive utility functions for transferring SUI and USDC between addresses, which are useful for:

- **Funding test addresses** before running tests
- **Balancing accounts** for testing scenarios
- **Preparing test environments** with sufficient balances
- **Demonstrating transfer functionality** in examples

### Available Transfer Functions

#### `transferSUI(client, fromKeypair, toAddress, amount)`

Transfers SUI coins from one address to another.

- **Parameters**: Sui client, sender keypair, recipient address, amount in SUI
- **Returns**: Success status, transaction digest, and error details
- **Features**: Automatic gas coin splitting, transaction validation

#### `transferUSDC(client, fromKeypair, toAddress, amount)`

Transfers USDC coins from one address to another.

- **Parameters**: Sui client, sender keypair, recipient address, amount in USDC
- **Returns**: Success status, transaction digest, and error details
- **Features**: Coin selection, balance validation, proper decimal handling

#### `fundAddressWithSUI(client, fromKeypair, toAddress, amount)`

Convenience function to fund an address with SUI for testing.

- **Use case**: Preparing test accounts with sufficient SUI for gas fees

#### `fundAddressWithUSDC(client, fromKeypair, toAddress, amount)`

Convenience function to fund an address with USDC for testing.

- **Use case**: Preparing test accounts with sufficient USDC for entry fees

### Balance Checking Functions

#### `getSUIBalance(client, address)`

Gets the SUI balance for a specific address.

- **Returns**: Balance in SUI units (9 decimal precision)

#### `getAllBalances(client, keypairs)`

Gets both SUI and USDC balances for multiple keypairs.

- **Returns**: Structured balance information for both currencies

#### `checkTestReadiness(client, address, requiredSUI, requiredUSDC)`

Checks if an address has sufficient balances for testing.

- **Returns**: Readiness status and balance details for both currencies

### Example Usage

```typescript
import { transferSUI, transferUSDC, checkTestReadiness } from "./utils";

// Check if address is ready for testing
const readiness = await checkTestReadiness(client, address, 0.1, 0.1);

// Transfer SUI for gas fees
const suiResult = await transferSUI(
  client,
  senderKeypair,
  recipientAddress,
  0.05
);

// Transfer USDC for testing
const usdcResult = await transferUSDC(
  client,
  senderKeypair,
  recipientAddress,
  0.01
);
```

### Running the Transfer Example

```bash
npm run transfer
```

This example script demonstrates:

1. **Balance checking** before and after transfers
2. **SUI transfers** between addresses
3. **USDC transfers** between addresses
4. **Address funding** for testing preparation
5. **Test readiness verification**

## Error Handling

The test suite includes comprehensive error handling:

- **Network Failures**: Retry logic with exponential backoff
- **Insufficient Balances**: Clear error messages and test failure
- **Transaction Failures**: Detailed error logging and rollback
- **Smart Contract Errors**: Specific error code interpretation

## Troubleshooting

### Common Issues

1. **Insufficient Balance**

   - Ensure test keys have adequate USDC (at least 0.1 USDC each)
   - Check balances before running tests

2. **Network Congestion**

   - Allow extra time for transaction confirmation
   - Tests include built-in delays between operations

3. **Gas Estimation**

   - Smart contract may need gas budget adjustments
   - Tests use retry logic for failed transactions

4. **Contract Updates**
   - Verify contract addresses are current
   - Check network configuration

### Debug Information

Each test provides detailed logging:

- Transaction digests for all operations
- Detailed balance change logs
- Smart contract event emissions
- Error messages and stack traces

### Recovery Procedures

- Failed tests can be re-run individually
- Balance verification after each test
- Transaction rollback on failures
- Manual balance checks if needed

## Output Format

Tests provide clear, descriptive output:

```
=== Test 1: Room Creation → Join → Cancel → Refund ===
Initial Balances:
  Key 1 (Creator): 100.00 USDC
  Key 2 (Joiner): 50.00 USDC

Creating room with 0.01 USDC entry fee...
Room created successfully: 0x1234...

Joining room...
User joined successfully

Cancelling room...
Room cancelled successfully

Final Balances:
  Key 1 (Creator): 100.00 USDC (Expected: 100.00 USDC) ✓
  Key 2 (Joiner): 50.00 USDC (Expected: 50.00 USDC) ✓

Test Result: PASSED ✓
```

## Conclusion

This comprehensive test suite validates the complete game room lifecycle, ensuring that:

- Entry fees are properly collected and refunded
- Prize distribution follows configured split rules
- Platform fees are accurately calculated and deducted
- All smart contract operations succeed as expected
- User balances are correctly maintained throughout the process

The tests provide confidence in the smart contract's reliability and correctness for production use.

## Support

For issues or questions about the test suite:

1. Check the troubleshooting section above
2. Review test logs for specific error messages
3. Verify environment variables and network configuration
4. Ensure sufficient USDC balances for testing
