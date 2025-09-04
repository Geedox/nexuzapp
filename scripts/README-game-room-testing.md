# Game Room Completion Testing Scripts

This directory contains testing scripts to verify the game room completion functionality without smart contract calls. These scripts test the database operations that occur when a game room completes.

## Overview

The testing scripts verify the following functionality:

1. **Winner Determination**: Correctly identifies winners based on scores and split rules
2. **Prize Distribution**: Calculates and distributes prizes according to the winner split rule
3. **Database Updates**: Updates all relevant database tables
4. **Leaderboard Updates**: Updates both game-specific and global leaderboards
5. **Transaction Creation**: Creates winning transactions for each winner

## Files

- `run-game-room-test.js` - Main test script (Node.js compatible)
- `test-game-room-completion.ts` - TypeScript version with full type safety
- `README-game-room-testing.md` - This documentation

## Prerequisites

1. **Environment Variables**: Set up your Supabase credentials

   ```bash
   export NEXT_PUBLIC_SUPABASE_URL="your-supabase-url"
   export NEXT_PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key"
   ```

2. **Dependencies**: Ensure you have the required packages installed
   ```bash
   npm install @supabase/supabase-js
   ```

## Running the Tests

### Option 1: Using npm script (Recommended)

```bash
npm run test:game-room-completion
```

### Option 3: TypeScript version

```bash
npx tsx scripts/test-game-room-completion.ts
```

## Test Data

The script creates the following test scenario:

- **Room**: 4-player game room with $10 entry fee each ($40 total prize pool)
- **Participants**: 4 players with different scores (1500, 1200, 800, 500)
- **Winner Split Rule**: Top 3 (50%, 30%, 20% distribution)
- **Platform Fee**: 7% of total prize pool

### Expected Results

1. **Winners**:

   - 1st place (1500 points): 50% of $37.2 = $18.60
   - 2nd place (1200 points): 30% of $37.2 = $11.16
   - 3rd place (800 points): 20% of $37.2 = $7.44
   - 4th place (500 points): No prize

2. **Database Updates**:
   - `game_rooms`: Status updated to "completed"
   - `game_room_participants`: Final positions and earnings updated
   - `game_room_winners`: Winner entries created
   - `leaderboards`: Both game-specific and global leaderboards updated
   - `transactions`: Winning transactions created

## What the Test Verifies

### ✅ Winner Entry Creation

- Verifies that winners are correctly identified based on scores
- Confirms entries are created in the `game_room_winners` table
- Validates prize amounts and percentages are correct

### ✅ Leaderboard Updates

- **Game-specific leaderboards**: Updates for the specific game
- **Global leaderboards**: Updates for overall player stats
- **Score tracking**: Highest scores are recorded
- **Win counting**: First-place wins are counted
- **Earnings tracking**: Total earnings are accumulated
- **Game count**: Games played counter is incremented

### ✅ Prize Distribution

- Calculates platform fee (7%)
- Distributes remaining prize pool according to split rule
- Creates winning transactions for each winner
- Updates participant records with final positions and earnings

### ✅ Database Integrity

- All foreign key relationships are maintained
- Transaction IDs are properly linked
- Room status is updated to "completed"
- Platform fee is recorded

## Test Output

The script provides detailed console output showing:

```
🚀 Starting Game Room Completion Test...
🔧 Setting up mock data...
✅ Mock data setup completed
🏆 Determined winners: [...]
🎯 Starting prize distribution for room test-room-1234567890
💰 Prize distribution details: {...}
🏆 Processing winner - Position 1: 18.6 USDC
✅ Added winner to game_room_winners table: Position 1
📊 Updated leaderboards for user test-user-1: position=1, earnings=18.6
...
📋 TEST SUMMARY:
✅ Room completed: true
✅ Winners processed: 3
✅ Participants updated: 4
✅ Leaderboard entries created: 8
✅ Winning transactions created: 3
🎉 All tests passed!
```

## Troubleshooting

### Common Issues

1. **Missing Environment Variables**

   ```
   ❌ Missing Supabase credentials. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
   ```

   **Solution**: Set the required environment variables

2. **Database Connection Issues**

   ```
   ❌ Error setting up mock data: [connection error]
   ```

   **Solution**: Check your Supabase URL and API key

3. **Permission Issues**
   ```
   ❌ Error creating user test-user-1: [permission error]
   ```
   **Solution**: Ensure your Supabase API key has the necessary permissions

### Debug Mode

To see more detailed logging, you can modify the script to include additional console.log statements or use a logging library.

## Customization

You can modify the test data by editing the mock data objects in the script:

- `mockRoom`: Change room parameters (entry fee, max players, etc.)
- `mockParticipants`: Modify participant scores and data
- `mockUsers`: Update test user information
- `winner_split_rule`: Test different split rules

## Database Schema Requirements

The test assumes the following database tables exist:

- `profiles` - User profiles
- `games` - Game definitions
- `game_rooms` - Game room data
- `game_room_participants` - Room participants
- `game_room_winners` - Winner records
- `leaderboards` - Player leaderboards
- `transactions` - Financial transactions

## Cleanup

The script automatically cleans up all test data after completion. If the script fails, you may need to manually clean up:

```sql
-- Clean up test data (replace 'test-room-1234567890' with actual room ID)
DELETE FROM game_room_winners WHERE room_id = 'test-room-1234567890';
DELETE FROM transactions WHERE room_id = 'test-room-1234567890';
DELETE FROM game_room_participants WHERE room_id = 'test-room-1234567890';
DELETE FROM game_rooms WHERE id = 'test-room-1234567890';
DELETE FROM games WHERE id = 'test-game-1';
DELETE FROM leaderboards WHERE user_id IN ('test-user-1', 'test-user-2', 'test-user-3', 'test-user-4');
DELETE FROM profiles WHERE id IN ('test-user-1', 'test-user-2', 'test-user-3', 'test-user-4');
```

## Contributing

When adding new tests or modifying existing ones:

1. Follow the existing naming conventions
2. Add comprehensive logging
3. Include cleanup functionality
4. Update this README with any new features
5. Test with different scenarios (different split rules, participant counts, etc.)
