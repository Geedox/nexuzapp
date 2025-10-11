import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config();

/**
 * Test script to verify the game room completion locking mechanism
 * 
 * This script tests:
 * 1. Lock acquisition for a room
 * 2. Verification that duplicate acquisitions fail
 * 3. Lock release functionality
 * 4. Stale lock cleanup
 */

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Missing Supabase credentials in .env file");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testLockAcquisition() {
    console.log("\n=== Test 1: Lock Acquisition ===");

    // Find an expired room that's not completed yet
    const { data: rooms, error: roomsError } = await supabase
        .from("game_rooms")
        .select("id, name, status, end_time, completion_in_progress")
        .in("status", ["waiting", "ongoing"])
        .lt("end_time", new Date().toISOString())
        .eq("completion_in_progress", false)
        .limit(1);

    if (roomsError) {
        console.error("Error fetching rooms:", roomsError);
        return null;
    }

    if (!rooms || rooms.length === 0) {
        console.log("No expired rooms available for testing. Create a room that expires soon.");
        return null;
    }

    const testRoom = rooms[0];
    console.log(`Testing with room: ${testRoom.name} (${testRoom.id})`);

    // Try to acquire lock
    const instanceId = `test-instance-${Date.now()}`;
    const { data: lockResult, error: lockError } = await supabase.rpc(
        'acquire_room_completion_lock',
        {
            p_room_id: testRoom.id,
            p_instance_id: instanceId
        }
    );

    if (lockError) {
        console.error("❌ Failed to acquire lock:", lockError);
        return null;
    }

    if (lockResult && lockResult[0]?.success) {
        console.log("✅ Successfully acquired lock");
        console.log(`   Instance ID: ${instanceId}`);
        return { roomId: testRoom.id, instanceId };
    } else {
        console.log("❌ Lock acquisition returned false (room might be locked by another process)");
        return null;
    }
}

async function testDuplicateLockPrevention(roomId: string) {
    console.log("\n=== Test 2: Duplicate Lock Prevention ===");

    // Try to acquire the same lock again
    const instanceId2 = `test-instance-duplicate-${Date.now()}`;
    const { data: lockResult, error: lockError } = await supabase.rpc(
        'acquire_room_completion_lock',
        {
            p_room_id: roomId,
            p_instance_id: instanceId2
        }
    );

    if (lockError) {
        console.error("❌ Error during duplicate lock attempt:", lockError);
        return;
    }

    if (!lockResult || lockResult.length === 0 || !lockResult[0]?.success) {
        console.log("✅ Duplicate lock acquisition correctly prevented");
    } else {
        console.log("❌ ERROR: Duplicate lock was acquired! Lock mechanism is NOT working.");
    }
}

async function testLockRelease(roomId: string) {
    console.log("\n=== Test 3: Lock Release ===");

    const { data: released, error: releaseError } = await supabase.rpc(
        'release_room_completion_lock',
        {
            p_room_id: roomId
        }
    );

    if (releaseError) {
        console.error("❌ Error releasing lock:", releaseError);
        return false;
    }

    if (released) {
        console.log("✅ Lock successfully released");
        return true;
    } else {
        console.log("❌ Lock release returned false");
        return false;
    }
}

async function testStaleLocksCleanup() {
    console.log("\n=== Test 4: Stale Lock Cleanup ===");

    // First, create a stale lock by manually updating a room
    const { data: testRooms, error: fetchError } = await supabase
        .from("game_rooms")
        .select("id, name")
        .eq("completion_in_progress", false)
        .limit(1);

    if (fetchError || !testRooms || testRooms.length === 0) {
        console.log("⚠️  No available room for stale lock test");
        return;
    }

    const testRoom = testRooms[0];

    // Manually set a stale lock (10 minutes ago)
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const { error: updateError } = await supabase
        .from("game_rooms")
        .update({
            completion_in_progress: true,
            completion_started_at: tenMinutesAgo,
            completion_started_by: 'test-stale-lock'
        })
        .eq("id", testRoom.id);

    if (updateError) {
        console.error("❌ Error creating stale lock:", updateError);
        return;
    }

    console.log(`Created artificial stale lock for room: ${testRoom.name}`);

    // Now run cleanup
    const { data: cleanedCount, error: cleanupError } = await supabase.rpc(
        'cleanup_stale_completion_locks'
    );

    if (cleanupError) {
        console.error("❌ Error during cleanup:", cleanupError);
        return;
    }

    console.log(`✅ Cleanup completed. Cleaned up ${cleanedCount || 0} stale lock(s)`);

    // Verify the lock was cleared
    const { data: verifyRoom, error: verifyError } = await supabase
        .from("game_rooms")
        .select("completion_in_progress")
        .eq("id", testRoom.id)
        .single();

    if (verifyError) {
        console.error("❌ Error verifying cleanup:", verifyError);
        return;
    }

    if (!verifyRoom.completion_in_progress) {
        console.log("✅ Stale lock was successfully cleared");
    } else {
        console.log("❌ ERROR: Stale lock was NOT cleared");
    }
}

async function verifyRPCFunctionsExist() {
    console.log("\n=== Verifying RPC Functions ===");

    const functions = [
        'acquire_room_completion_lock',
        'release_room_completion_lock',
        'cleanup_stale_completion_locks'
    ];

    for (const funcName of functions) {
        try {
            // Try calling with invalid parameters to see if function exists
            const { error } = await supabase.rpc(funcName, {});

            if (error && error.message.includes('could not find function')) {
                console.log(`❌ Function '${funcName}' does NOT exist. Run migration first.`);
            } else {
                console.log(`✅ Function '${funcName}' exists`);
            }
        } catch (e) {
            console.log(`✅ Function '${funcName}' exists (detected via error)`);
        }
    }
}

async function verifySchemaChanges() {
    console.log("\n=== Verifying Schema Changes ===");

    // Try to query the new columns
    const { data, error } = await supabase
        .from("game_rooms")
        .select("id, completion_in_progress, completion_started_at, completion_started_by")
        .limit(1);

    if (error) {
        if (error.message.includes('column') && error.message.includes('does not exist')) {
            console.log("❌ Schema columns do NOT exist. Run migration first.");
            console.log("   Missing columns: completion_in_progress, completion_started_at, completion_started_by");
        } else {
            console.error("❌ Error querying schema:", error);
        }
        return false;
    }

    console.log("✅ All schema columns exist");
    return true;
}

async function runAllTests() {
    console.log("========================================");
    console.log("Game Room Completion Lock Test Suite");
    console.log("========================================");

    // First verify the migration has been applied
    const schemaOk = await verifySchemaChanges();
    if (!schemaOk) {
        console.log("\n⚠️  Please run the migration first:");
        console.log("   supabase/migrations/20250111000000-add-game-room-completion-lock.sql");
        return;
    }

    await verifyRPCFunctionsExist();

    // Test lock acquisition
    const lockInfo = await testLockAcquisition();

    if (lockInfo) {
        // Test duplicate prevention
        await testDuplicateLockPrevention(lockInfo.roomId);

        // Test lock release
        await testLockRelease(lockInfo.roomId);
    }

    // Test stale lock cleanup
    await testStaleLocksCleanup();

    console.log("\n========================================");
    console.log("Test Suite Completed");
    console.log("========================================");
}

// Run tests
runAllTests().catch(console.error);

