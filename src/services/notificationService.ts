import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/utils/logger";
import type { Database, TablesInsert } from "@/integrations/supabase/types";
import { EmailService } from "@/lib/emailService";

// Notification data interfaces
interface NotificationData {
    room_id?: string;
    game_id?: string;
    tournament_id?: string;
    match_id?: string;
    participant_id?: string;
    score?: number;
    previous_score?: number;
    prize_amount?: string;
    currency?: string;
    sender_name?: string;
    sender_id?: string;
    recipient_name?: string;
    recipient_email?: string; // Add email to notification data
    game_name?: string;
    room_name?: string;
    tournament_name?: string;
    next_round?: string;
    final_rank?: number;
    start_time?: string;
    end_time?: string;
    refund_amount?: string;
}

interface NotificationTemplate {
    title: string;
    message: string;
    emailSubject?: string;
    emailTemplate?: string;
    priority: 'high' | 'medium' | 'low';
    requiresEmail: boolean;
}

interface NotificationPreferences {
    email: Record<string, boolean>;
    in_app: Record<string, boolean>;
}

class NotificationService {
    private emailService: EmailService;

    constructor() {
        this.emailService = new EmailService();
    }

    // Notification templates for different event types
    private getNotificationTemplate(
        type: Database["public"]["Enums"]["notification_type"],
        data: NotificationData
    ): NotificationTemplate {
        const templates: Record<string, NotificationTemplate> = {
            // Room Events
            room_created: {
                title: "🎮 New Room Created",
                message: `${data.sender_name} created a new room: ${data.room_name}`,
                emailSubject: `🎮 New Room Created: ${data.room_name}`,
                priority: 'medium',
                requiresEmail: false
            },
            player_joined: {
                title: "👥 Player Joined",
                message: `${data.sender_name} joined ${data.room_name}`,
                priority: 'low',
                requiresEmail: false
            },
            player_left: {
                title: "👋 Player Left",
                message: `${data.sender_name} left ${data.room_name}`,
                priority: 'low',
                requiresEmail: false
            },
            room_start: {
                title: "🚀 Room Started!",
                message: `${data.room_name} has started! Join the battle!`,
                emailSubject: `🚀 ${data.room_name} has started!`,
                priority: 'high',
                requiresEmail: true
            },
            room_completed: {
                title: "🏁 Room Completed",
                message: `${data.room_name} has been completed. Check the results!`,
                emailSubject: `🏁 ${data.room_name} completed - Results available!`,
                priority: 'high',
                requiresEmail: true
            },
            room_cancelled: {
                title: "⚠️ Room Cancelled",
                message: `${data.room_name} has been cancelled. ${data.refund_amount ? `Refund: ${data.refund_amount}` : ''}`,
                emailSubject: `⚠️ ${data.room_name} cancelled - Refund processed`,
                priority: 'high',
                requiresEmail: true
            },
            room_reminder: {
                title: "⏰ Room Reminder",
                message: `${data.room_name} starts in 15 minutes! Get ready to play!`,
                emailSubject: `⏰ Reminder: ${data.room_name} starts soon!`,
                priority: 'medium',
                requiresEmail: true
            },

            // Game Events
            game_won: {
                title: "🏆 Victory!",
                message: `Congratulations! You won ${data.game_name}${data.prize_amount ? ` and earned ${data.prize_amount}` : ''}!`,
                emailSubject: `🏆 Victory! You won ${data.game_name}!`,
                priority: 'high',
                requiresEmail: true
            },
            highscore_beaten: {
                title: "📈 Highscore Challenge!",
                message: `${data.sender_name} beat your highscore in ${data.game_name}! New score: ${data.score?.toLocaleString()}`,
                emailSubject: `📈 Highscore Challenge: ${data.sender_name} beat your score!`,
                priority: 'medium',
                requiresEmail: true
            },
            prize_distributed: {
                title: "💰 Prize Distributed!",
                message: `Your prize of ${data.prize_amount} has been distributed from ${data.room_name}!`,
                emailSubject: `💰 Prize Distributed: ${data.prize_amount} from ${data.room_name}`,
                priority: 'high',
                requiresEmail: true
            },

            // Tournament Events
            tournament_advance: {
                title: "🚀 Tournament Advance!",
                message: `You advanced to ${data.next_round} in ${data.tournament_name}!`,
                emailSubject: `🚀 Tournament Advance: You're in ${data.next_round}!`,
                priority: 'high',
                requiresEmail: true
            },
            tournament_elimination: {
                title: "💪 Tournament Elimination",
                message: `You were eliminated from ${data.tournament_name}. Final rank: #${data.final_rank}`,
                emailSubject: `💪 Tournament Update: ${data.tournament_name} - Rank #${data.final_rank}`,
                priority: 'medium',
                requiresEmail: true
            },

            // Friend Events
            friend_request: {
                title: "👥 Friend Request",
                message: `${data.sender_name} wants to connect with you!`,
                emailSubject: `👥 ${data.sender_name} wants to connect with you!`,
                priority: 'high',
                requiresEmail: true
            },
            friend_request_accepted: {
                title: "✅ Friend Request Accepted",
                message: `${data.sender_name} accepted your friend request!`,
                emailSubject: `✅ ${data.sender_name} accepted your friend request!`,
                priority: 'medium',
                requiresEmail: true
            },
            friend_request_declined: {
                title: "❌ Friend Request Declined",
                message: `${data.sender_name} declined your friend request.`,
                priority: 'low',
                requiresEmail: false
            },

            // Payment Events
            payment: {
                title: "💳 Payment Update",
                message: `Payment of ${data.prize_amount} has been processed.`,
                emailSubject: `💳 Payment Update: ${data.prize_amount} processed`,
                priority: 'high',
                requiresEmail: true
            },

            // Achievement Events
            achievement: {
                title: "🎖️ Achievement Unlocked",
                message: `You unlocked a new achievement: ${data.game_name}!`,
                emailSubject: `🎖️ Achievement Unlocked: ${data.game_name}`,
                priority: 'medium',
                requiresEmail: true
            },

            // Wallet Events
            wallet_connect: {
                title: "🔗 Wallet Connected",
                message: `Your wallet has been successfully connected.`,
                emailSubject: `🔗 Wallet Connected Successfully`,
                priority: 'medium',
                requiresEmail: true
            },

            // Game Invite Events
            game_invite: {
                title: "🎮 Game Invitation",
                message: `${data.sender_name} invited you to play ${data.game_name}!`,
                emailSubject: `🎮 Game Invitation: ${data.sender_name} wants to play!`,
                priority: 'high',
                requiresEmail: true
            }
        };

        return templates[type] || {
            title: "📢 Notification",
            message: "You have a new notification.",
            priority: 'low',
            requiresEmail: false
        };
    }

    // Get user notification preferences
    async getUserNotificationPreferences(userId: string): Promise<NotificationPreferences> {
        try {
            const { data: profile, error } = await supabase
                .from('profiles')
                .select('notification_preferences')
                .eq('id', userId)
                .single();

            if (error) {
                logger.error('Error fetching notification preferences:', error);
                return this.getDefaultPreferences();
            }

            return profile?.notification_preferences as unknown as NotificationPreferences;
        } catch (error) {
            logger.error('Error getting notification preferences:', error);
            return this.getDefaultPreferences();
        }
    }

    // Get default notification preferences
    private getDefaultPreferences(): NotificationPreferences {
        return {
            email: {
                friend_requests: true,
                game_invites: true,
                room_start: true,
                room_completed: true,
                room_cancelled: true,
                highscore_beaten: true,
                tournament_advance: true,
                tournament_elimination: true,
                game_won: true,
                prize_distributed: true,
                room_reminder: true,
                friend_request_accepted: true,
                friend_request_declined: false
            },
            in_app: {
                room_created: true,
                player_joined: true,
                player_left: true,
                room_start: true,
                room_completed: true,
                room_cancelled: true,
                highscore_beaten: true,
                tournament_advance: true,
                tournament_elimination: true,
                game_won: true,
                prize_distributed: true,
                room_reminder: true,
                friend_request: true,
                friend_request_accepted: true,
                friend_request_declined: true
            }
        };
    }

    // Get user email address from profiles table (after migration)
    private async getUserEmail(userId: string): Promise<string | null> {
        try {
            // Note: This will work after running the migration that adds email to profiles
            // For now, we'll return null until the migration is applied
            const { data: profile, error } = await supabase
                .from('profiles')
                .select('email')
                .eq('id', userId)
                .single();

            if (error) {
                // If email column doesn't exist yet, return null
                if (error.message?.includes('column "email" does not exist')) {
                    logger.warn('Email column not found in profiles table. Run migration to add email support.');
                    return null;
                }
                logger.error('Error fetching user email from profiles:', error);
                return null;
            }

            return profile.email;
        } catch (error) {
            logger.error('Error getting user email:', error);
            return null;
        }
    }

    // Get user display name
    private async getUserDisplayName(userId: string): Promise<string> {
        try {
            const { data: profile, error } = await supabase
                .from('profiles')
                .select('display_name, username')
                .eq('id', userId)
                .single();

            if (error) {
                logger.error('Error fetching user display name:', error);
                return 'Unknown User';
            }

            return profile?.display_name || profile?.username || 'Unknown User';
        } catch (error) {
            logger.error('Error getting user display name:', error);
            return 'Unknown User';
        }
    }

    // Create a single notification
    async createNotification(
        userId: string,
        type: Database["public"]["Enums"]["notification_type"],
        data: NotificationData,
        options: {
            sendEmail?: boolean;
            priority?: 'high' | 'medium' | 'low';
        } = {}
    ): Promise<void> {
        try {
            // Get user preferences
            const preferences = await this.getUserNotificationPreferences(userId);
            const template = this.getNotificationTemplate(type, data);

            // Check if in-app notification is enabled
            const inAppEnabled = preferences.in_app[type] !== false;

            // Create in-app notification if enabled
            if (inAppEnabled) {
                const notificationData: TablesInsert<"notifications"> = {
                    user_id: userId,
                    type,
                    title: template.title,
                    message: template.message,
                    data: data as any,
                    is_read: false
                };

                const { error: notificationError } = await supabase
                    .from('notifications')
                    .insert(notificationData);

                if (notificationError) {
                    logger.error('Error creating notification:', notificationError);
                } else {
                    logger.info(`In-app notification created for user ${userId}: ${type}`);
                }
            }

            // Send email if required and enabled
            const emailEnabled = preferences.email[type] !== false;
            const shouldSendEmail = (options.sendEmail ?? template.requiresEmail) && emailEnabled;

            if (shouldSendEmail) {
                await this.sendEmailNotification(userId, type, data);
            }

        } catch (error) {
            logger.error('Error creating notification:', error);
            throw error;
        }
    }

    // Send email notification
    private async sendEmailNotification(
        userId: string,
        type: Database["public"]["Enums"]["notification_type"],
        data: NotificationData,
    ): Promise<void> {
        try {
            // Try to get email from notification data first, then fallback to profiles table
            let userEmail = data.recipient_email;

            if (!userEmail) {
                // If no email in data, try to get from profiles table
                userEmail = await this.getUserEmail(userId);
            }

            if (!userEmail) {
                logger.warn(`No email found for user ${userId}, skipping email notification`);
                return;
            }

            // Send appropriate email based on type
            switch (type) {
                case 'friend_request':
                    if (data.sender_name) {
                        await this.emailService.sendFriendRequestEmail(userEmail, data.sender_name);
                    }
                    break;
                case 'friend_request_accepted':
                    if (data.sender_name) {
                        await this.emailService.sendFriendRequestAcceptedEmail(userEmail, data.sender_name);
                    }
                    break;
                case 'room_start':
                    if (data.room_name && data.game_name && data.room_id) {
                        await this.emailService.sendRoomStartEmail(data.room_id, userEmail, data.room_name, data.game_name);
                    }
                    break;
                case 'room_reminder':
                    if (data.room_name && data.start_time && data.room_id) {
                        await this.emailService.sendRoomReminderEmail(data.room_id, userEmail, data.room_name, data.start_time);
                    }
                    break;
                case 'game_won':
                    if (data.game_name) {
                        await this.emailService.sendGameWonEmail(userEmail, data.game_name, data.prize_amount);
                    }
                    break;
                case 'tournament_advance':
                    if (data.tournament_name && data.next_round && data.room_id) {
                        await this.emailService.sendTournamentAdvanceEmail(userEmail, data.tournament_name, data.next_round, data.room_id);
                    }
                    break;
                case 'tournament_elimination':
                    if (data.tournament_name && data.final_rank && data.room_id) {
                        await this.emailService.sendTournamentEliminationEmail(data.room_id, userEmail, data.tournament_name, data.final_rank);
                    }
                    break;
                case 'highscore_beaten':
                    if (data.game_name && data.sender_name && data.score && data.room_id) {
                        await this.emailService.sendHighscoreBeatenEmail(data.room_id, userEmail, data.game_name, data.sender_name, data.score);
                    }
                    break;
                case 'prize_distributed':
                    if (data.prize_amount && data.tournament_name) {
                        await this.emailService.sendPrizeDistributionEmail(userEmail, data.prize_amount, data.tournament_name);
                    }
                    break;
                case 'room_cancelled':
                    if (data.room_name) {
                        await this.emailService.sendRoomCancelledEmail(userEmail, data.room_name, data.refund_amount);
                    }
                    break;
                default:
                    logger.warn(`No email template found for notification type: ${type}`);
            }

            logger.info(`Email notification sent to user ${userId}: ${type}`);
        } catch (error) {
            logger.error('Error sending email notification:', error);
            // Don't throw error to prevent breaking the main notification flow
        }
    }

    // Create multiple notifications (for room participants, etc.)
    async createBulkNotifications(
        userIds: string[],
        type: Database["public"]["Enums"]["notification_type"],
        data: NotificationData,
        options: {
            sendEmail?: boolean;
            priority?: 'high' | 'medium' | 'low';
        } = {}
    ): Promise<void> {
        try {
            const promises = userIds.map(userId =>
                this.createNotification(userId, type, data, options)
            );

            await Promise.allSettled(promises);
            logger.info(`Bulk notifications created for ${userIds.length} users: ${type}`);
        } catch (error) {
            logger.error('Error creating bulk notifications:', error);
            throw error;
        }
    }

    // Get user notifications
    async getUserNotifications(
        userId: string,
        limit: number = 20,
        offset: number = 0
    ): Promise<Database["public"]["Tables"]["notifications"]["Row"][]> {
        try {
            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .range(offset, offset + limit - 1);

            if (error) {
                logger.error('Error fetching user notifications:', error);
                throw error;
            }

            return data || [];
        } catch (error) {
            logger.error('Error getting user notifications:', error);
            throw error;
        }
    }

    // Mark notification as read
    async markNotificationAsRead(notificationId: string): Promise<void> {
        try {
            const { error } = await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('id', notificationId);

            if (error) {
                logger.error('Error marking notification as read:', error);
                throw error;
            }
        } catch (error) {
            logger.error('Error marking notification as read:', error);
            throw error;
        }
    }

    // Mark all notifications as read for a user
    async markAllNotificationsAsRead(userId: string): Promise<void> {
        try {
            const { error } = await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('user_id', userId)
                .eq('is_read', false);

            if (error) {
                logger.error('Error marking all notifications as read:', error);
                throw error;
            }
        } catch (error) {
            logger.error('Error marking all notifications as read:', error);
            throw error;
        }
    }

    // Get unread notification count
    async getUnreadNotificationCount(userId: string): Promise<number> {
        try {
            const { count, error } = await supabase
                .from('notifications')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', userId)
                .eq('is_read', false);

            if (error) {
                logger.error('Error getting unread notification count:', error);
                throw error;
            }

            return count || 0;
        } catch (error) {
            logger.error('Error getting unread notification count:', error);
            throw error;
        }
    }

    // Update notification preferences
    async updateNotificationPreferences(
        userId: string,
        preferences: Partial<NotificationPreferences>
    ): Promise<void> {
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ notification_preferences: preferences })
                .eq('id', userId);

            if (error) {
                logger.error('Error updating notification preferences:', error);
                throw error;
            }
        } catch (error) {
            logger.error('Error updating notification preferences:', error);
            throw error;
        }
    }

    // Delete notification
    async deleteNotification(notificationId: string): Promise<void> {
        try {
            const { error } = await supabase
                .from('notifications')
                .delete()
                .eq('id', notificationId);

            if (error) {
                logger.error('Error deleting notification:', error);
                throw error;
            }
        } catch (error) {
            logger.error('Error deleting notification:', error);
            throw error;
        }
    }

    // Clear all notifications for a user
    async clearAllNotifications(userId: string): Promise<void> {
        try {
            const { error } = await supabase
                .from('notifications')
                .delete()
                .eq('user_id', userId);

            if (error) {
                logger.error('Error clearing all notifications:', error);
                throw error;
            }
        } catch (error) {
            logger.error('Error clearing all notifications:', error);
            throw error;
        }
    }

    // Get notification statistics
    async getNotificationStats(userId: string): Promise<{
        total: number;
        unread: number;
        byType: Record<string, number>;
    }> {
        try {
            const [totalResult, unreadResult, byTypeResult] = await Promise.all([
                supabase
                    .from('notifications')
                    .select('*', { count: 'exact', head: true })
                    .eq('user_id', userId),
                supabase
                    .from('notifications')
                    .select('*', { count: 'exact', head: true })
                    .eq('user_id', userId)
                    .eq('is_read', false),
                supabase
                    .from('notifications')
                    .select('type')
                    .eq('user_id', userId)
            ]);

            if (totalResult.error) throw totalResult.error;
            if (unreadResult.error) throw unreadResult.error;
            if (byTypeResult.error) throw byTypeResult.error;

            const byType: Record<string, number> = {};
            byTypeResult.data?.forEach(notification => {
                byType[notification.type] = (byType[notification.type] || 0) + 1;
            });

            return {
                total: totalResult.count || 0,
                unread: unreadResult.count || 0,
                byType
            };
        } catch (error) {
            logger.error('Error getting notification stats:', error);
            throw error;
        }
    }
}

export const notificationService = new NotificationService();
