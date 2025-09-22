# Game Room Lifecycle Testing Documentation

## Overview

This document provides comprehensive details for testing the complete lifecycle of game rooms using the Sui Move smart contract. The test suite covers all major scenarios from room creation to game completion, ensuring proper functionality of entry fees, refunds, prize distribution, and platform fee collection.

## Test Environment Setup

### Prerequisites

- Two private keys available in environment variables:
  - `VITE_KEY_1` - Primary test key (room creator)
  - `VITE_KEY_2` - Secondary test key (room joiner)
- Sui network connection (mainnet/testnet as configured)
- Sufficient USDC balances for testing
- Access to game room smart contract

### Test Parameters

- **Entry Fee**: 0.01 USDC (10,000 smallest units with 6 decimals)
- **Platform Fee**: 7% of total prize pool
- **Room Duration**: Short duration for testing efficiency
- **Max Players**: 2-3 players per test room
- **Winner Split Rules**: Various configurations to test all scenarios

## Test Scenarios

### Test 1: Room Creation → Join → Cancel → Refund

#### Purpose

Verify that when a room is cancelled, all participants receive full refunds of their entry fees.

#### Test Flow

1. **Setup**: Check initial balances of both keys
2. **Room Creation**: Key 1 creates room with 0.01 USDC entry fee
3. **Join Room**: Key 2 joins room with 0.01 USDC entry fee
4. **Cancel Room**: Key 1 cancels the room
5. **Verification**: Confirm both keys receive full refunds

#### Expected Outcomes

- **Key 1 (Creator)**: Final balance = Initial balance - 0.01 USDC + 0.01 USDC = Initial balance
- **Key 2 (Joiner)**: Final balance = Initial balance - 0.01 USDC + 0.01 USDC = Initial balance
- **Room Status**: Changed to "cancelled"
- **Smart Contract**: Room marked as cancelled, all funds returned

#### Success Criteria

- Room creation transaction succeeds
- Join transaction succeeds
- Cancel transaction succeeds
- Both users receive full refunds
- No platform fees deducted (cancellations are fully refunded)

#### Console Output Example

```
=== Test 1: Room Creation → Join → Cancel → Refund ===
Initial Balances:
  Key 1 (Creator): 100.00 USDC
  Key 2 (Joiner): 50.00 USDC

Creating room with 0.01 USDC entry fee...
Room created successfully: 0x1234...
Entry fee deducted: 0.01 USDC

Joining room...
User joined successfully
Entry fee deducted: 0.01 USDC

Cancelling room...
Room cancelled successfully

Final Balances:
  Key 1 (Creator): 100.00 USDC (Expected: 100.00 USDC) ✓
  Key 2 (Joiner): 50.00 USDC (Expected: 50.00 USDC) ✓

Test Result: PASSED ✓
```

---

### Test 2: Room Creation → Join → Leave → Cancel

#### Purpose

Verify that users can leave rooms and receive refunds, and creators can cancel rooms after participants leave.

#### Test Flow

1. **Setup**: Check initial balances of both keys
2. **Room Creation**: Key 1 creates room with 0.01 USDC entry fee
3. **Join Room**: Key 2 joins room with 0.01 USDC entry fee
4. **Leave Room**: Key 2 leaves the room
5. **Cancel Room**: Key 1 cancels the room
6. **Verification**: Confirm proper refunds for both scenarios

#### Expected Outcomes

- **Key 1 (Creator)**: Final balance = Initial balance - 0.01 USDC + 0.01 USDC = Initial balance
- **Key 2 (Joiner)**: Final balance = Initial balance - 0.01 USDC + 0.01 USDC = Initial balance
- **Leave Transaction**: Key 2 receives immediate refund
- **Cancel Transaction**: Key 1 receives refund of remaining funds

#### Success Criteria

- Room creation succeeds
- Join transaction succeeds
- Leave transaction succeeds with immediate refund
- Cancel transaction succeeds
- All users receive appropriate refunds
- No platform fees deducted

#### Console Output Example

```
=== Test 2: Room Creation → Join → Leave → Cancel ===
Initial Balances:
  Key 1 (Creator): 100.00 USDC
  Key 2 (Joiner): 50.00 USDC

Creating room with 0.01 USDC entry fee...
Room created successfully: 0x1234...

Joining room...
User joined successfully

Leaving room...
User left successfully
Refund received: 0.01 USDC

Cancelling room...
Room cancelled successfully

Final Balances:
  Key 1 (Creator): 100.00 USDC (Expected: 100.00 USDC) ✓
  Key 2 (Joiner): 50.00 USDC (Expected: 50.00 USDC) ✓

Test Result: PASSED ✓
```

---

### Test 3: Sponsored Room → Join → Leave → Cancel

#### Purpose

Verify that sponsored rooms don't provide refunds when users leave, as they didn't pay entry fees.

#### Test Flow

1. **Setup**: Check initial balances of both keys
2. **Sponsored Room Creation**: Key 1 creates sponsored room with 0.01 USDC prize pool
3. **Join Room**: Key 2 joins room (no entry fee required)
4. **Leave Room**: Key 2 leaves the room
5. **Cancel Room**: Key 1 cancels the room
6. **Verification**: Confirm no refund is provided

#### Expected Outcomes

- **Key 1 (Creator)**: Final balance = Initial balance - 0.01 USDC (sponsor amount) + 0.01 USDC (refund) = Initial balance
- **Key 2 (Joiner)**: Final balance = Initial balance (no change - no entry fee paid)
- **Room Status**: Remains active or changes based on remaining participants
- **No Refund**: Key 2 receives no refund as they didn't pay entry fee

#### Success Criteria

- Sponsored room creation succeeds
- Join transaction succeeds without entry fee
- Leave transaction succeeds without refund
- Creator's balance reflects sponsor amount deduction
- Joiner's balance remains unchanged

#### Console Output Example

```
=== Test 3: Sponsored Room → Join → Leave ===
Initial Balances:
  Key 1 (Creator): 100.00 USDC
  Key 2 (Joiner): 50.00 USDC

Creating sponsored room with 0.01 USDC prize pool...
Sponsored room created successfully: 0x1234...
Sponsor amount deducted: 0.01 USDC

Joining room (no entry fee)...
User joined successfully

Leaving room...
User left successfully
No refund provided (sponsored room)

Final Balances:
  Key 1 (Creator): 99.99 USDC (Expected: 99.99 USDC) ✓
  Key 2 (Joiner): 50.00 USDC (Expected: 50.00 USDC) ✓

Test Result: PASSED ✓
```

---

### Test 4: Sponsored Room Cancellation

#### Purpose

Verify that when a sponsored room is cancelled, the creator receives the full prize pool back.

#### Test Flow

1. **Setup**: Check initial balances of both keys
2. **Sponsored Room Creation**: Key 1 creates sponsored room with 0.01 USDC prize pool
3. **Join Room**: Key 2 joins room (no entry fee)
4. **Cancel Room**: Key 1 cancels the sponsored room
5. **Verification**: Confirm creator receives full prize pool refund

#### Expected Outcomes

- **Key 1 (Creator)**: Final balance = Initial balance - 0.01 USDC + 0.01 USDC = Initial balance
- **Key 2 (Joiner)**: Final balance = Initial balance (no change)
- **Room Status**: Changed to "cancelled"
- **Sponsor Refund**: Creator receives full sponsor amount back

#### Success Criteria

- Sponsored room creation succeeds
- Join transaction succeeds
- Cancel transaction succeeds
- Creator receives full sponsor amount refund
- Joiner's balance remains unchanged
- Room marked as cancelled

#### Console Output Example

```
=== Test 4: Sponsored Room Cancellation ===
Initial Balances:
  Key 1 (Creator): 100.00 USDC
  Key 2 (Joiner): 50.00 USDC

Creating sponsored room with 0.01 USDC prize pool...
Sponsored room created successfully: 0x1234...
Sponsor amount deducted: 0.01 USDC

Joining room (no entry fee)...
User joined successfully

Cancelling sponsored room...
Room cancelled successfully
Sponsor amount refunded: 0.01 USDC

Final Balances:
  Key 1 (Creator): 100.00 USDC (Expected: 100.00 USDC) ✓
  Key 2 (Joiner): 50.00 USDC (Expected: 50.00 USDC) ✓

Test Result: PASSED ✓
```

---

### Test 5: Game Completion with No Winners

#### Purpose

Verify that when a game is completed with no winners, all participants receive refunds minus the platform fee.

#### Test Flow

1. **Setup**: Check initial balances of both keys
2. **Room Creation**: Key 1 creates room with 0.01 USDC entry fee
3. **Join Room**: Key 2 joins room with 0.01 USDC entry fee
4. **Complete Game**: Complete game with empty winner array
5. **Verification**: Confirm refunds minus 7% platform fee

#### Expected Outcomes

- **Total Prize Pool**: 0.02 USDC (0.01 + 0.01)
- **Platform Fee**: 0.0014 USDC (7% of 0.02)
- **Refundable Amount**: 0.0186 USDC (0.02 - 0.0014)
- **Key 1 Refund**: 0.0093 USDC (50% of refundable amount)
- **Key 2 Refund**: 0.0093 USDC (50% of refundable amount)

#### Success Criteria

- Room creation succeeds
- Join transaction succeeds
- Game completion succeeds
- Platform fee is correctly calculated and deducted
- Both users receive proportional refunds
- Room status changes to "completed"

#### Console Output Example

```
=== Test 5: Game Completion with No Winners ===
Initial Balances:
  Key 1 (Creator): 100.00 USDC
  Key 2 (Joiner): 50.00 USDC

Creating room with 0.01 USDC entry fee...
Room created successfully: 0x1234...

Joining room...
User joined successfully

Completing game with no winners...
Game completed successfully

Prize Pool Distribution:
  Total Prize Pool: 0.02 USDC
  Platform Fee (7%): 0.0014 USDC
  Refundable Amount: 0.0186 USDC
  Key 1 Refund: 0.0093 USDC
  Key 2 Refund: 0.0093 USDC

Final Balances:
  Key 1 (Creator): 99.99 USDC (Expected: 99.99 USDC) ✓
  Key 2 (Joiner): 49.99 USDC (Expected: 49.99 USDC) ✓

Test Result: PASSED ✓
```

---

### Test 6: Game Completion with Single Winner

#### Purpose

Verify that when a game is completed with one winner, the winner receives the full prize pool minus the platform fee.

#### Test Flow

1. **Setup**: Check initial balances of both keys
2. **Room Creation**: Key 1 creates room with 0.01 USDC entry fee
3. **Join Room**: Key 2 joins room with 0.01 USDC entry fee
4. **Complete Game**: Complete game with Key 1 as winner
5. **Verification**: Confirm winner receives 93% of total prize pool

#### Expected Outcomes

- **Total Prize Pool**: 0.02 USDC (0.01 + 0.01)
- **Platform Fee**: 0.0014 USDC (7% of 0.02)
- **Winner Prize**: 0.0186 USDC (93% of 0.02)
- **Key 1 (Winner)**: Final balance = Initial balance - 0.01 + 0.0186
- **Key 2 (Loser)**: Final balance = Initial balance - 0.01 (no refund)

#### Success Criteria

- Room creation succeeds
- Join transaction succeeds
- Game completion succeeds
- Platform fee is correctly deducted
- Winner receives full prize minus platform fee
- Loser receives no refund
- Room status changes to "completed"

#### Console Output Example

```
=== Test 6: Game Completion with Single Winner ===
Initial Balances:
  Key 1 (Creator): 100.00 USDC
  Key 2 (Joiner): 50.00 USDC

Creating room with 0.01 USDC entry fee...
Room created successfully: 0x1234...

Joining room...
User joined successfully

Completing game with Key 1 as winner...
Game completed successfully

Prize Distribution:
  Total Prize Pool: 0.02 USDC
  Platform Fee (7%): 0.0014 USDC
  Winner Prize: 0.0186 USDC
  Winner: Key 1

Final Balances:
  Key 1 (Winner): 100.01 USDC (Expected: 100.01 USDC) ✓
  Key 2 (Loser): 49.99 USDC (Expected: 49.99 USDC) ✓

Test Result: PASSED ✓
```

---

### Test 7: Game Completion with Top 2 Winners

#### Purpose

Verify that when a game is completed with two winners, prizes are distributed according to the top_2 split rule (60% to 1st, 40% to 2nd) minus platform fees.

#### Test Flow

1. **Setup**: Check initial balances of all three keys
2. **Room Creation**: Key 1 creates room with 0.01 USDC entry fee
3. **Join Rooms**: Key 2 and Key 3 join room with 0.01 USDC entry fee each
4. **Complete Game**: Complete game with Key 1 as 1st place, Key 2 as 2nd place
5. **Verification**: Confirm prizes distributed according to split rule

#### Expected Outcomes

- **Total Prize Pool**: 0.03 USDC (0.01 + 0.01 + 0.01)
- **Platform Fee**: 0.0021 USDC (7% of 0.03)
- **Refundable Amount**: 0.0279 USDC (0.03 - 0.0021)
- **1st Place (Key 1)**: 0.01674 USDC (60% of 0.0279)
- **2nd Place (Key 2)**: 0.01116 USDC (40% of 0.0279)
- **3rd Place (Key 3)**: 0 USDC (no prize)

#### Success Criteria

- Room creation succeeds
- Both join transactions succeed
- Game completion succeeds
- Platform fee is correctly calculated
- Prizes distributed according to top_2 split rule
- 3rd place receives no prize
- Room status changes to "completed"

#### Console Output Example

```
=== Test 7: Game Completion with Top 2 Winners ===
Initial Balances:
  Key 1 (Creator): 100.00 USDC
  Key 2 (Joiner): 50.00 USDC
  Key 3 (Joiner): 25.00 USDC

Creating room with 0.01 USDC entry fee...
Room created successfully: 0x1234...

Joining room (Key 2)...
User joined successfully

Joining room (Key 3)...
User joined successfully

Completing game with top 2 winners...
Game completed successfully

Prize Distribution (Top 2 Split):
  Total Prize Pool: 0.03 USDC
  Platform Fee (7%): 0.0021 USDC
  Refundable Amount: 0.0279 USDC
  1st Place (Key 1): 0.01674 USDC (60% of 0.0279)
  2nd Place (Key 2): 0.01116 USDC (40% of 0.0279)
  3rd Place (Key 3): 0 USDC

Final Balances:
  Key 1 (1st Place): 100.01 USDC (Expected: 100.01 USDC) ✓
  Key 2 (2nd Place): 50.01 USDC (Expected: 50.01 USDC) ✓
  Key 3 (3rd Place): 24.99 USDC (Expected: 24.99 USDC) ✓

Test Result: PASSED ✓
```

---

### Test 8: Sponsored Game Room with No Winner

#### Purpose

Verify that when a sponsored game is completed with no winners, the sponsor receives a refund minus the platform fee.

#### Test Flow

1. **Setup**: Check initial balances of both keys
2. **Sponsored Room Creation**: Key 1 creates sponsored room with 0.01 USDC prize pool
3. **Join Room**: Key 2 joins room (no entry fee)
4. **Complete Game**: Complete game with empty winner array
5. **Verification**: Confirm sponsor receives 93% refund

#### Expected Outcomes

- **Total Prize Pool**: 0.01 USDC (sponsor amount)
- **Platform Fee**: 0.0007 USDC (7% of 0.01)
- **Sponsor Refund**: 0.0093 USDC (93% of 0.01)
- **Key 1 (Sponsor)**: Final balance = Initial - 0.01 + 0.0093
- **Key 2 (Joiner)**: Final balance = Initial (no change)

#### Success Criteria

- Sponsored room creation succeeds
- Join transaction succeeds
- Game completion succeeds
- Platform fee correctly deducted
- Sponsor receives 93% refund
- Joiner balance unchanged

---

### Test 9: Private Sponsored Room

#### Purpose

Verify that private sponsored rooms work correctly with room codes, requiring the correct code to join but no entry fees for participants.

#### Test Flow

1. **Setup**: Check initial balances of both keys
2. **Private Sponsored Room Creation**: Key 1 creates private sponsored room with room code and 0.01 USDC prize pool
3. **Join Room with Code**: Key 2 joins room using correct room code (no entry fee)
4. **Complete Game**: Complete game with Key 2 as winner
5. **Verification**: Confirm winner receives prize minus platform fee

#### Expected Outcomes

- **Total Prize Pool**: 0.01 USDC (sponsor amount)
- **Platform Fee**: 0.0007 USDC (7% of 0.01)
- **Winner Prize**: 0.0093 USDC (93% of 0.01)
- **Key 1 (Sponsor)**: Final balance = Initial - 0.01 (no refund - not winner)
- **Key 2 (Winner)**: Final balance = Initial + 0.0093

#### Success Criteria

- Private sponsored room creation succeeds
- Room requires correct code to join
- Join succeeds with correct code
- No entry fee required for joining
- Winner receives full prize minus platform fee
- Sponsor receives no refund (not winner)

---

### Test 10: Private Non-Sponsored Room

#### Purpose

Verify that private non-sponsored rooms work correctly with room codes, requiring both the correct code and entry fee to join.

#### Test Flow

1. **Setup**: Check initial balances of both keys
2. **Private Room Creation**: Key 1 creates private room with room code and 0.01 USDC entry fee
3. **Join Room with Code**: Key 2 joins room using correct room code and pays entry fee
4. **Complete Game**: Complete game with Key 1 as winner
5. **Verification**: Confirm winner receives full prize pool minus platform fee

#### Expected Outcomes

- **Total Prize Pool**: 0.02 USDC (0.01 + 0.01)
- **Platform Fee**: 0.0014 USDC (7% of 0.02)
- **Winner Prize**: 0.0186 USDC (93% of 0.02)
- **Key 1 (Winner)**: Final balance = Initial - 0.01 + 0.0186 = Initial + 0.0086
- **Key 2 (Loser)**: Final balance = Initial - 0.01

#### Success Criteria

- Private room creation succeeds
- Room requires correct code to join
- Join succeeds with correct code and entry fee
- Entry fee properly collected
- Winner receives full prize minus platform fee
- Loser receives no refund

---

### Test 11: Special Room with Signature Collection

#### Purpose

Verify that special rooms (which are private by default) work correctly with signature collection requirements before game completion.

#### Test Flow

1. **Setup**: Check initial balances of both keys
2. **Special Room Creation**: Key 1 creates special room with room code and 0.01 USDC entry fee
3. **Join Room**: Key 2 joins room using room code and pays entry fee
4. **Collect Signatures**: Both Key 1 (creator) and Key 2 (participant) provide completion signatures
5. **Complete Game**: Complete game with signatures validated and Key 1 as winner
6. **Verification**: Confirm winner receives prize after signature validation

#### Expected Outcomes

- **Total Prize Pool**: 0.02 USDC (0.01 + 0.01)
- **Platform Fee**: 0.0014 USDC (7% of 0.02)
- **Winner Prize**: 0.0186 USDC (93% of 0.02)
- **Key 1 (Winner)**: Final balance = Initial - 0.01 + 0.0186 = Initial + 0.0086
- **Key 2 (Loser)**: Final balance = Initial - 0.01
- **Signature Requirements**: 2 signatures required (creator + participant)

#### Success Criteria

- Special room creation succeeds (automatically private)
- Room requires room code to join
- Join succeeds with correct code and entry fee
- Signature collection from both creator and participant
- Game completion requires sufficient signatures
- Winner receives full prize minus platform fee
- Room status changes to "completed"

#### Console Output Example

```
=== Test 11: Special Room with Signature Collection ===
Initial Balances:
  Key 1 (Creator): 100.00 USDC
  Key 2 (Participant): 50.00 USDC

Creating special room with room code...
Special room created successfully: 0x1234...
Room code: SPEC123

Joining room with room code...
User joined successfully

Collecting creator signature...
Creator signature collected successfully

Collecting participant signature...
Participant signature collected successfully
Signature status: 2/2 signatures collected ✓

Completing game with Key 1 as winner...
Game completed successfully (signatures validated)

Prize Distribution:
  Total Prize Pool: 0.02 USDC
  Platform Fee (7%): 0.0014 USDC
  Winner Prize: 0.0186 USDC

Final Balances:
  Key 1 (Winner): 100.01 USDC (Expected: 100.01 USDC) ✓
  Key 2 (Loser): 49.99 USDC (Expected: 49.99 USDC) ✓

Test Result: PASSED ✓
```

## Technical Implementation Details

### Smart Contract Integration

- **Contract Address**: `0x6e51446bb0d7c9d9fa516f8a962ab8543412b1ef8375c3caad5e806f5d20a97b::game_room::game_room`
- **Store ID**: `0x1f19c53319e4774508a60194feaf86865aacd6642aa890e795e88891b1045360`
- **Network**: As configured in constants (mainnet/testnet)

### Transaction Flow

1. **Room Creation**: `create_room_with_usdc` function call
2. **Room Joining**: `join_room` function call
3. **Room Leaving**: `leave_room` function call (admin-sponsored)
4. **Room Cancellation**: `cancel_room` function call (admin-sponsored)
5. **Game Completion**: `complete_game` function call

### Balance Tracking

- **Pre-test**: Log initial balances for all test keys
- **Post-test**: Log final balances and expected values
- **Verification**: Compare actual vs expected balances
- **Success Marking**: ✓ for passed tests, ✗ for failed tests

### Error Handling

- **Network Failures**: Retry logic with exponential backoff
- **Insufficient Balances**: Clear error messages and test failure
- **Transaction Failures**: Detailed error logging and rollback
- **Smart Contract Errors**: Specific error code interpretation

### Test Execution

- **Sequential Execution**: Tests run one after another
- **Independent Tests**: Each test can run standalone
- **Clean State**: Each test starts with fresh room creation
- **Result Summary**: Overall pass/fail summary at completion

## Expected Test Results

### All Tests Should Pass

- Room creation and management (public, private, sponsored, special)
- Entry fee collection and refunds
- Prize distribution calculations
- Platform fee deductions
- Winner split rule enforcement
- Room code validation for private rooms
- Signature collection for special rooms
- Transaction success verification

### Balance Verification

- All refunds should be accurate
- Platform fees should be exactly 7%
- Winner prizes should match split rules
- No funds should be lost in the process
- Private room access control works correctly
- Special room signature requirements enforced

### Smart Contract Validation

- All transactions should succeed
- Room states should update correctly
- Events should be emitted properly
- Gas costs should be reasonable
- Private room codes validated properly
- Special room signatures collected and verified

## Troubleshooting

### Common Issues

1. **Insufficient Balance**: Ensure test keys have adequate USDC
2. **Network Congestion**: Allow extra time for transaction confirmation
3. **Gas Estimation**: Smart contract may need gas budget adjustments
4. **Contract Updates**: Verify contract addresses are current

### Debug Information

- Transaction digests for all operations
- Detailed balance change logs
- Smart contract event emissions
- Error messages and stack traces

### Recovery Procedures

- Failed tests can be re-run individually
- Balance verification after each test
- Transaction rollback on failures
- Manual balance checks if needed

## Conclusion

This comprehensive test suite validates the complete game room lifecycle, ensuring that:

- Entry fees are properly collected and refunded
- Prize distribution follows configured split rules
- Platform fees are accurately calculated and deducted
- All smart contract operations succeed as expected
- User balances are correctly maintained throughout the process

### New Test Coverage (Tests 9-11)

The expanded test suite now includes comprehensive coverage for:

**Private Rooms (Tests 9-10):**

- Room code validation for access control
- Private sponsored rooms (no entry fees for participants)
- Private non-sponsored rooms (entry fees + room codes required)
- Proper isolation between private and public room mechanics

**Special Rooms (Test 11):**

- Signature collection requirements from creators and participants
- Validation that games cannot complete without sufficient signatures
- Automatic private room behavior for special rooms
- Proper signature verification before prize distribution

### Test Suite Benefits

The complete 11-test suite provides:

- **Full Coverage**: Every room type and configuration tested
- **Edge Cases**: Private access, sponsored mechanics, signature requirements
- **Production Readiness**: All scenarios that could occur in live environments
- **Regression Protection**: Changes to smart contract can be validated against all scenarios
- **Documentation**: Living examples of how each room type should behave

The tests provide confidence in the smart contract's reliability and correctness for production use across all supported room types and configurations.
