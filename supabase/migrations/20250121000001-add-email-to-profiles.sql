-- Add email field to profiles table for notification system
-- This allows storing user emails for notification purposes

-- Add email column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- Create index for email lookups
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- Add constraint to ensure email is unique (optional, uncomment if needed)
-- ALTER TABLE public.profiles ADD CONSTRAINT unique_email UNIQUE (email);

-- Create a function to sync email from auth.users to profiles
CREATE OR REPLACE FUNCTION sync_user_email()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the profile email when auth.users email changes
    UPDATE public.profiles 
    SET email = NEW.email 
    WHERE id = NEW.id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically sync email from auth.users
DROP TRIGGER IF EXISTS sync_email_trigger ON auth.users;
CREATE TRIGGER sync_email_trigger
    AFTER INSERT OR UPDATE OF email ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION sync_user_email();

-- Update existing profiles with emails from auth.users
UPDATE public.profiles 
SET email = auth_users.email
FROM auth.users
WHERE profiles.id = auth_users.id 
AND profiles.email IS NULL;

-- Add comment explaining the email field
COMMENT ON COLUMN public.profiles.email IS 'User email address synced from auth.users for notification purposes';
