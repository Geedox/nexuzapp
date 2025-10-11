-- Add completion locking fields to game_rooms table
ALTER TABLE game_rooms
ADD COLUMN IF NOT EXISTS completion_in_progress BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS completion_started_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS completion_started_by TEXT;

-- Create index for faster queries on completion_in_progress
CREATE INDEX IF NOT EXISTS idx_game_rooms_completion_in_progress 
ON game_rooms(completion_in_progress) 
WHERE completion_in_progress = true;

-- Create RPC function for atomic lock acquisition
CREATE OR REPLACE FUNCTION acquire_room_completion_lock(
  p_room_id UUID,
  p_instance_id TEXT
)
RETURNS TABLE(
  success BOOLEAN,
  room_data JSONB
) 
LANGUAGE plpgsql
AS $$
DECLARE
  v_updated_count INTEGER;
  v_room_data JSONB;
BEGIN
  -- Attempt to acquire the lock atomically
  UPDATE game_rooms
  SET 
    completion_in_progress = true,
    completion_started_at = NOW(),
    completion_started_by = p_instance_id
  WHERE id = p_room_id
    AND completion_in_progress = false
    AND status IN ('waiting', 'ongoing')
    AND end_time < NOW()
  RETURNING row_to_json(game_rooms.*)::JSONB INTO v_room_data;
  
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  
  -- Return success status and room data
  RETURN QUERY SELECT 
    (v_updated_count > 0)::BOOLEAN as success,
    v_room_data as room_data;
END;
$$;

-- Create RPC function to release the lock
CREATE OR REPLACE FUNCTION release_room_completion_lock(
  p_room_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  v_updated_count INTEGER;
BEGIN
  UPDATE game_rooms
  SET 
    completion_in_progress = false,
    completion_started_at = NULL,
    completion_started_by = NULL
  WHERE id = p_room_id;
  
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  
  RETURN (v_updated_count > 0);
END;
$$;

-- Create RPC function to clean up stale locks (older than 5 minutes)
CREATE OR REPLACE FUNCTION cleanup_stale_completion_locks()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_cleaned_count INTEGER;
BEGIN
  UPDATE game_rooms
  SET 
    completion_in_progress = false,
    completion_started_at = NULL,
    completion_started_by = NULL
  WHERE completion_in_progress = true
    AND completion_started_at < (NOW() - INTERVAL '5 minutes');
  
  GET DIAGNOSTICS v_cleaned_count = ROW_COUNT;
  
  RETURN v_cleaned_count;
END;
$$;

-- Add comment to explain the locking mechanism
COMMENT ON COLUMN game_rooms.completion_in_progress IS 'Indicates if room completion is currently in progress to prevent duplicate on-chain transactions';
COMMENT ON COLUMN game_rooms.completion_started_at IS 'Timestamp when completion was initiated, used for stale lock cleanup';
COMMENT ON COLUMN game_rooms.completion_started_by IS 'Instance ID that initiated the completion, useful for debugging';

