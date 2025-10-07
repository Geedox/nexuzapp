import { Database } from "@/integrations/supabase/types";

export type Notification = Database["public"]["Tables"]["notifications"]["Row"];

export interface NotificationData {
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

export interface NotificationOptions {
    sendEmail?: boolean;
    priority?: 'high' | 'medium' | 'low';
}

export interface NotificationPreferences {
    email: Record<string, boolean>;
    in_app: Record<string, boolean>;
}

export interface NotificationStats {
    total: number;
    unread: number;
    byType: Record<string, number>;
}

export interface NotificationContextType {
    // State
    notifications: Notification[];
    unreadCount: number;
    stats: NotificationStats | null;
    preferences: NotificationPreferences | null;
    loading: boolean;

    // Actions
    loadNotifications: (limit?: number, offset?: number) => Promise<void>;
    markAsRead: (notificationId: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    deleteNotification: (notificationId: string) => Promise<void>;
    clearAllNotifications: () => Promise<void>;
    updatePreferences: (
        preferences: Partial<NotificationPreferences>
    ) => Promise<void>;
    refreshStats: () => Promise<void>;

    // Real-time
    subscribeToNotifications: () => void;
    unsubscribeFromNotifications: () => void;
}