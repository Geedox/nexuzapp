# Game Room Completion Lock Implementation

## Overview

This document describes the database-level locking mechanism implemented to prevent duplicate `complete_game` smart contract calls when multiple browser tabs or users attempt to auto-complete expired game rooms simultaneously.

## Problem Statement

Before this implementation, the system was experiencing 39+ duplicate `complete_game` smart contract transactions for a single room due to:

1. **30-second auto-completion interval** in `GameRoomContext.tsx` repeatedly checking for expired rooms
2. **Real-time subscriptions** triggering status updates on any room change
3. **No coordination mechanism** between different browser tabs or user sessions
4. **Race conditions** where the room status wasn't updated before the on-chain call completed

## Solution

### 1. Database Schema Changes

Added three new columns to the `game_rooms` table:

- `completion_in_progress` (BOOLEAN, default false) - Indicates if completion is currently being processed
- `completion_started_at` (TIMESTAMP) - Tracks when completion was initiated for stale lock cleanup
- `completion_started_by` (TEXT) - Stores the instance ID that acquired the lock for debugging

**Migration file:** `supabase/migrations/20250111000000-add-game-room-completion-lock.sql`

### 2. Supabase RPC Functions

Created three PostgreSQL functions for atomic lock operations:

#### `acquire_room_completion_lock(p_room_id, p_instance_id)`

- Atomically attempts to acquire the completion lock
- Uses a WHERE clause to ensure only one process can acquire the lock
- Returns success status and room data
- **Key constraint:** Only acquires lock if `completion_in_progress = false` AND `status IN ('waiting', 'ongoing')` AND `end_time < NOW()`

#### `release_room_completion_lock(p_room_id)`

- Releases the completion lock for a specific room
- Used for error recovery when completion fails

#### `cleanup_stale_completion_locks()`

- Cleans up locks older than 5 minutes
- Prevents indefinite locks from crashes or network failures
- Returns the count of cleaned locks

### 3. Code Changes

#### `src/services/gameRoomService.ts`

**Instance ID Generation:**

```typescript
private instanceId: string;

constructor() {
  // ...
  this.instanceId = crypto.randomUUID();
  logger.debug(`GameRoomService initialized with instance ID: ${this.instanceId}`);
}
```

**Lock Acquisition in `autoCompleteGame()`:**

```typescript
// Try to acquire the completion lock atomically
const { data: lockResult, error: lockError } = await supabase.rpc(
  "acquire_room_completion_lock",
  {
    p_room_id: room.id,
    p_instance_id: this.instanceId,
  }
);

if (!lockResult || !lockResult[0]?.success) {
  logger.debug(`Room completion already in progress. Skipping.`);
  return; // Gracefully exit without attempting completion
}
```

**Lock Release on Error:**

```typescript
catch (error) {
  logger.error(`Failed to complete game for room ${room.id}:`, error);

  // Release the lock on failure
  await supabase.rpc('release_room_completion_lock', {
    p_room_id: room.id
  });

  throw error;
}
```

**Lock Release on Success:**

```typescript
await supabase
  .from("game_rooms")
  .update({
    status: "completed",
    // ... other fields
    completion_in_progress: false,
    completion_started_at: null,
    completion_started_by: null,
  })
  .eq("id", room.id);
```

**Stale Lock Cleanup in `autoCompleteExpiredGames()`:**

```typescript
// First, cleanup stale locks (older than 5 minutes)
const { data: cleanedCount } = await supabase.rpc(
  "cleanup_stale_completion_locks"
);

if (cleanedCount && cleanedCount > 0) {
  logger.info(`Cleaned up ${cleanedCount} stale completion locks`);
}
```

**Filter Locked Rooms:**

```typescript
const { data: expiredRooms } = await supabase
  .from("game_rooms")
  .select("*")
  .in("status", ["waiting", "ongoing"])
  .lt("end_time", now)
  .eq("is_special", false)
  .eq("completion_in_progress", false); // Skip locked rooms
```

#### `src/contexts/GameRoomContext.tsx`

**Lock Check in Manual Completion:**

```typescript
// Check if completion is already in progress
if (roomData.completion_in_progress) {
  throw new Error(
    "Room completion is already in progress. Please wait or refresh to see the latest status."
  );
}
```

**Increased Interval:**

- Changed auto-completion interval from 30 seconds to 60 seconds
- Reduces unnecessary database queries while maintaining responsiveness

#### `src/types/gameroom.ts`

**Added Lock Fields to GameRoom Interface:**

```typescript
// Completion locking fields
completion_in_progress?: boolean;
completion_started_at?: string | null;
completion_started_by?: string | null;
```

## How It Works

### Normal Flow

1. **Timer triggers** `autoCompleteExpiredGames()` (every 60 seconds)
2. **Stale lock cleanup** runs first, clearing any locks older than 5 minutes
3. **Query expired rooms** excluding those with `completion_in_progress = true`
4. For each expired room:
   - Call `acquire_room_completion_lock()` RPC function
   - **Atomic check**: If lock acquired successfully, proceed
   - **If lock fails**: Another instance is processing, skip gracefully
5. **Complete on-chain** transaction
6. **Distribute prizes** and update database
7. **Clear lock** by setting `completion_in_progress = false` in the final status update

### Error Flow

1. If on-chain transaction fails or any error occurs:
2. **Catch block** calls `release_room_completion_lock()`
3. Lock is released for retry by another process
4. Error is logged and rethrown

### Stale Lock Recovery

1. If a process crashes or network fails mid-completion:
2. Lock remains set with `completion_started_at` timestamp
3. Next time `autoCompleteExpiredGames()` runs:
4. **Cleanup function** identifies locks older than 5 minutes
5. Automatically clears them for retry

## Benefits

1. **Prevents duplicate on-chain transactions** - Only one process can complete a room
2. **Cross-tab coordination** - Multiple browser tabs won't interfere with each other
3. **Cross-user coordination** - Multiple users/admins won't trigger duplicate completions
4. **Automatic recovery** - Stale locks are cleaned up after 5 minutes
5. **Visibility** - `completion_started_by` field shows which instance acquired the lock
6. **Graceful degradation** - If lock acquisition fails, the process exits cleanly

## Testing Recommendations

### Test Case 1: Multiple Browser Tabs

1. Open 3 browser tabs logged in as the same user
2. Create a game room that expires in 2 minutes
3. Wait for expiration
4. **Expected:** Only one `complete_game` transaction should occur
5. **Verify:** Check transaction logs and `completion_started_by` field

### Test Case 2: Concurrent Users

1. Have 2-3 users logged in simultaneously
2. Create game rooms that expire at the same time
3. **Expected:** Each room is completed exactly once
4. **Verify:** No duplicate transactions in blockchain explorer

### Test Case 3: Stale Lock Cleanup

1. Manually set `completion_in_progress = true` for a room in database
2. Set `completion_started_at` to 10 minutes ago
3. Wait for next auto-completion cycle (60 seconds)
4. **Expected:** Lock should be cleared and room should complete
5. **Verify:** Room status changes to 'completed'

### Test Case 4: Error Recovery

1. Create a room that will fail completion (e.g., invalid on-chain state)
2. Let it expire naturally
3. **Expected:** Lock is released after error
4. **Verify:** `completion_in_progress` is set back to false
5. Fix the issue and verify retry works

### Test Case 5: Real-time Subscription Load

1. Create multiple rooms with short durations
2. Have multiple tabs open watching the rooms list
3. Let rooms expire naturally
4. **Expected:** Real-time updates work without triggering duplicate completions
5. **Verify:** Each room has exactly one completion transaction

## Monitoring

### Key Metrics to Monitor

1. **Lock acquisition failures** - Log entries showing "already in progress"
2. **Stale lock cleanups** - Count of locks cleaned per cycle
3. **Completion duration** - Time from lock acquisition to release
4. **Lock holder distribution** - Which instance IDs are acquiring locks

### Log Patterns to Watch

```typescript
// Successful lock acquisition
"Successfully acquired completion lock for room {roomId} (instance: {instanceId})";

// Lock already held
"Room {roomId} completion is already in progress by another instance. Skipping.";

// Stale lock cleanup
"Cleaned up {count} stale completion locks";

// Lock release on error
"Released completion lock for room {roomId} after error";
```

## Troubleshooting

### Issue: Room not completing despite being expired

**Possible causes:**

1. Lock is held by crashed process (wait 5 minutes for stale lock cleanup)
2. Room is marked as special (requires manual completion)
3. Error in on-chain transaction (check logs)

**Resolution:**

- Check `completion_in_progress`, `completion_started_at` fields
- If lock is stale, manually call `cleanup_stale_completion_locks()`
- Check error logs for on-chain transaction failures

### Issue: Multiple completions still occurring

**Possible causes:**

1. Migration not applied to database
2. RPC functions not created
3. Code not deployed to all instances

**Resolution:**

- Verify migration ran: Check `game_rooms` schema
- Test RPC functions: Call them directly from Supabase SQL editor
- Ensure all running instances have updated code

## Performance Considerations

1. **Lock acquisition is fast** - Single atomic UPDATE query
2. **Minimal overhead** - Only adds one RPC call per completion attempt
3. **Index added** - On `completion_in_progress` for faster queries
4. **Cleanup is efficient** - Runs once per cycle, only updates stale locks

## Future Enhancements

1. **Distributed lock timeout** - Make 5-minute timeout configurable
2. **Lock metrics dashboard** - Visualize lock acquisition patterns
3. **Alert on repeated failures** - Notify if same room fails multiple times
4. **Lock priority** - Allow manual admin completions to take priority
