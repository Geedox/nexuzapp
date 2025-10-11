# Game Room Completion Lock Setup Guide

This guide walks through setting up the completion locking mechanism to prevent duplicate on-chain transactions.

## Prerequisites

- Supabase project configured
- Database migrations capability
- Access to Supabase SQL Editor or CLI

## Step 1: Apply Database Migration

### Option A: Using Supabase CLI (Recommended)

```bash
# Navigate to project root
cd /path/to/nexuzapp

# Apply the migration
supabase db push
```

### Option B: Using Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Open the migration file: `supabase/migrations/20250111000000-add-game-room-completion-lock.sql`
4. Copy and paste the entire contents into the SQL Editor
5. Click **Run** to execute the migration

### Option C: Manual Execution

If using a direct PostgreSQL connection:

```bash
psql -h [your-db-host] -U postgres -d postgres -f supabase/migrations/20250111000000-add-game-room-completion-lock.sql
```

## Step 2: Verify Migration

Run the test script to verify the migration was applied correctly:

```bash
npm run test:completion-lock
```

Expected output:

```
========================================
Game Room Completion Lock Test Suite
========================================

=== Verifying Schema Changes ===
✅ All schema columns exist

=== Verifying RPC Functions ===
✅ Function 'acquire_room_completion_lock' exists
✅ Function 'release_room_completion_lock' exists
✅ Function 'cleanup_stale_completion_locks' exists
```

If you see any ❌ errors, the migration wasn't applied correctly.

## Step 3: Test the Locking Mechanism

### Create a Test Room

1. Log into your application
2. Create a game room that expires in 2-3 minutes
3. Wait for the room to expire

### Monitor Completion

Watch the browser console and server logs for:

```
Successfully acquired completion lock for room {roomId} (instance: {instanceId})
```

### Test Multiple Tabs

1. Open the application in 3 different browser tabs
2. Let the room expire naturally
3. Check that only ONE completion transaction occurs

You can verify this by:

- Checking your blockchain explorer for the room's on-chain ID
- Looking at the `complete_digest` in the database
- Reviewing application logs

## Step 4: Deployment

### Development Environment

The changes are automatically active once:

1. Migration is applied to database
2. Frontend code is rebuilt and running

### Production Deployment

1. **Apply migration to production database first:**

   ```bash
   supabase db push --db-url [production-database-url]
   ```

2. **Deploy updated application code:**

   - Build: `npm run build`
   - Deploy to your hosting platform (Vercel, etc.)

3. **Verify in production:**
   - Monitor logs for lock acquisition messages
   - Check that completion transactions are not duplicated

## Rollback Plan

If you need to rollback the changes:

### Rollback Migration

```sql
-- Remove RPC functions
DROP FUNCTION IF EXISTS acquire_room_completion_lock(UUID, TEXT);
DROP FUNCTION IF EXISTS release_room_completion_lock(UUID);
DROP FUNCTION IF EXISTS cleanup_stale_completion_locks();

-- Remove columns
ALTER TABLE game_rooms
DROP COLUMN IF EXISTS completion_in_progress,
DROP COLUMN IF EXISTS completion_started_at,
DROP COLUMN IF EXISTS completion_started_by;

-- Remove index
DROP INDEX IF EXISTS idx_game_rooms_completion_in_progress;
```

### Rollback Code

```bash
git revert [commit-hash]
```

Then rebuild and redeploy the application.

## Monitoring After Deployment

### Key Queries

**Check for active locks:**

```sql
SELECT
  id,
  name,
  status,
  completion_in_progress,
  completion_started_at,
  completion_started_by,
  end_time
FROM game_rooms
WHERE completion_in_progress = true;
```

**Check for stale locks:**

```sql
SELECT
  id,
  name,
  completion_started_at,
  completion_started_by,
  NOW() - completion_started_at AS lock_age
FROM game_rooms
WHERE completion_in_progress = true
  AND completion_started_at < (NOW() - INTERVAL '5 minutes');
```

**Count completions by instance:**

```sql
SELECT
  completion_started_by,
  COUNT(*) as completions
FROM game_rooms
WHERE completion_started_by IS NOT NULL
  AND status = 'completed'
  AND actual_end_time > NOW() - INTERVAL '24 hours'
GROUP BY completion_started_by
ORDER BY completions DESC;
```

### Log Monitoring

Set up alerts for these log patterns:

1. **Multiple lock failures** - May indicate performance issues

   ```
   Pattern: "Room .* completion is already in progress"
   Alert if: > 10 occurrences per minute
   ```

2. **Stale lock cleanups** - Indicates crashes or network issues

   ```
   Pattern: "Cleaned up .* stale completion locks"
   Alert if: cleanedCount > 0
   ```

3. **Lock release errors** - Critical failures
   ```
   Pattern: "Failed to release lock for room"
   Alert: Always
   Priority: High
   ```

## Troubleshooting

### Issue: Migration fails with "relation already exists"

**Solution:** The migration may have been partially applied. Drop the objects manually:

```sql
-- Check what exists
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'game_rooms'
  AND column_name LIKE 'completion_%';

-- If columns exist but functions don't, create only the functions
-- If both exist, the migration was already applied successfully
```

### Issue: Test script shows "columns do not exist"

**Causes:**

1. Migration not applied
2. Connected to wrong database
3. Cache issue in Supabase

**Solutions:**

1. Verify migration was applied in Supabase dashboard
2. Check `VITE_SUPABASE_URL` in `.env` file
3. Restart Supabase local services if using local development

### Issue: Rooms not completing even with migration applied

**Diagnosis:**

```sql
-- Check if any room is stuck with a lock
SELECT * FROM game_rooms
WHERE completion_in_progress = true;

-- Manually clean up if needed
UPDATE game_rooms
SET completion_in_progress = false,
    completion_started_at = NULL,
    completion_started_by = NULL
WHERE completion_in_progress = true;
```

### Issue: Application errors after deployment

Check for:

1. TypeScript compilation errors - run `npm run build`
2. Missing environment variables
3. Supabase RPC permissions - ensure functions are callable by authenticated users

## Performance Optimization

After deployment, if you notice performance issues:

### Reduce Auto-Completion Frequency

In `src/contexts/GameRoomContext.tsx`:

```typescript
// Current: 60 seconds
const expiredGamesInterval = setInterval(() => {
  gameRoomService.autoCompleteExpiredGames();
}, 60000);

// Can increase to 120 seconds (2 minutes) if needed
}, 120000);
```

### Add Additional Indexes

If queries are slow:

```sql
-- Index on end_time for faster expired room queries
CREATE INDEX IF NOT EXISTS idx_game_rooms_end_time
ON game_rooms(end_time)
WHERE status IN ('waiting', 'ongoing');

-- Composite index for expired non-special rooms
CREATE INDEX IF NOT EXISTS idx_game_rooms_auto_complete
ON game_rooms(end_time, status, is_special, completion_in_progress)
WHERE status IN ('waiting', 'ongoing')
  AND is_special = false
  AND completion_in_progress = false;
```

## Success Criteria

The implementation is successful when:

1. ✅ Migration applied without errors
2. ✅ Test script passes all checks
3. ✅ Only one `complete_game` transaction per room in blockchain explorer
4. ✅ No duplicate completion errors in logs
5. ✅ Stale locks are automatically cleaned up
6. ✅ Multiple browser tabs don't cause duplicate completions

## Support

If you encounter issues not covered in this guide:

1. Check the detailed implementation documentation: `docs/COMPLETION_LOCK_IMPLEMENTATION.md`
2. Review application logs for specific error messages
3. Verify database state using the monitoring queries above
4. Run the test script with verbose logging

## Additional Resources

- [Supabase Migration Documentation](https://supabase.com/docs/guides/cli/local-development#database-migrations)
- [PostgreSQL Transaction Isolation](https://www.postgresql.org/docs/current/transaction-iso.html)
- Implementation details: `docs/COMPLETION_LOCK_IMPLEMENTATION.md`
- Test script: `scripts/test-completion-lock.ts`
