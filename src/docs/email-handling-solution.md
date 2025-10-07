# Email Handling Solution for Notifications

## Problem

The Supabase `profiles` table doesn't have an `email` field, but email addresses are stored in `auth.users`. This creates a challenge for the notification system that needs to send emails to users.

## Solution

### 1. Database Migration

Created migration `20250121000001-add-email-to-profiles.sql` that:

- Adds `email` column to `profiles` table
- Creates a trigger to sync email from `auth.users` to `profiles`
- Updates existing profiles with emails from auth users
- Creates an index for email lookups

### 2. Notification Service Updates

Updated `src/services/notificationService.ts`:

- Added `recipient_email` field to `NotificationData` interface
- Modified `getUserEmail()` to fetch from profiles table (after migration)
- Updated `sendEmailNotification()` to use email from notification data or profiles table
- Added fallback handling for when email column doesn't exist yet

### 3. Hook Updates

Updated `src/hooks/useNotification.ts`:

- Added `recipient_email` field to `NotificationData` interface
- Added `getCurrentUserEmail()` helper function
- Updated notification methods to accept optional email parameter
- Added email parameter to friend request notifications

### 4. Email Service Integration

Fixed method signatures to match the actual email service:

- Removed `userId` parameter from email service calls
- Updated argument order to match service expectations
- Added proper error handling for missing email addresses

## Usage

### Before Migration (Current State)

```typescript
// Email notifications will be skipped with warning
await notifyFriendRequest(userId, senderName);
```

### After Migration

```typescript
// Email notifications will work automatically
await notifyFriendRequest(userId, senderName);

// Or explicitly pass email
await notifyFriendRequest(userId, senderName, "user@example.com");
```

### For Current User

```typescript
const { getCurrentUserEmail } = useNotification();
const email = await getCurrentUserEmail();
```

## Migration Steps

1. Run the migration:

   ```sql
   -- This will be applied automatically when you run supabase db push
   ```

2. Verify the migration:

   ```sql
   SELECT email FROM profiles LIMIT 5;
   ```

3. Test email notifications:
   ```typescript
   // This should now work without warnings
   await notifyFriendRequest(userId, senderName);
   ```

## Benefits

1. **Automatic Email Sync**: Emails are automatically synced from auth to profiles
2. **Backward Compatibility**: System works before and after migration
3. **Flexible**: Can pass email explicitly or use stored email
4. **Error Handling**: Graceful fallback when email is not available
5. **Performance**: Indexed email lookups for better performance

## Notes

- The migration includes a trigger that automatically syncs emails when users sign up or update their email
- Email notifications will be skipped with a warning if no email is available
- The system is designed to work both before and after the migration is applied
- All existing notification functionality remains unchanged
