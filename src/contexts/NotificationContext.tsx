import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "../integrations/supabase/client";
import { logger } from "../utils/logger";
import { notificationService } from "../services/notificationService";
import { useAuth } from "@/hooks/auth";
import {
  Notification,
  NotificationPreferences,
  NotificationStats,
  NotificationContextType,
} from "../types/notification";
import { NotificationContext } from "../hooks/useNotification";

interface NotificationProviderProps {
  children: React.ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({
  children,
}) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [preferences, setPreferences] =
    useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(false);
  const [subscription, setSubscription] = useState<any>(null);

  // Load notifications
  const loadNotifications = useCallback(
    async (limit: number = 20, offset: number = 0) => {
      if (!user) return;

      try {
        setLoading(true);
        const data = await notificationService.getUserNotifications(
          user.id,
          limit,
          offset
        );
        setNotifications(data);
      } catch (error) {
        logger.error("Error loading notifications:", error);
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  // Refresh stats
  const refreshStats = useCallback(async () => {
    if (!user) return;

    try {
      const newStats = await notificationService.getNotificationStats(user.id);
      setStats(newStats);
      setUnreadCount(newStats.unread);
    } catch (error) {
      logger.error("Error refreshing notification stats:", error);
    }
  }, [user]);

  // Mark notification as read
  const markAsRead = useCallback(
    async (notificationId: string) => {
      try {
        await notificationService.markNotificationAsRead(notificationId);

        // Update local state
        setNotifications((prev) =>
          prev.map((notification) =>
            notification.id === notificationId
              ? { ...notification, is_read: true }
              : notification
          )
        );

        // Update unread count
        setUnreadCount((prev) => Math.max(0, prev - 1));

        // Update stats
        if (stats) {
          setStats((prev) =>
            prev ? { ...prev, unread: Math.max(0, prev.unread - 1) } : null
          );
        }
      } catch (error) {
        logger.error("Error marking notification as read:", error);
      }
    },
    [stats]
  );

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    if (!user) return;

    try {
      await notificationService.markAllNotificationsAsRead(user.id);

      // Update local state
      setNotifications((prev) =>
        prev.map((notification) => ({ ...notification, is_read: true }))
      );

      // Reset unread count
      setUnreadCount(0);

      // Update stats
      if (stats) {
        setStats((prev) => (prev ? { ...prev, unread: 0 } : null));
      }
    } catch (error) {
      logger.error("Error marking all notifications as read:", error);
    }
  }, [user, stats]);

  // Delete notification
  const deleteNotification = useCallback(
    async (notificationId: string) => {
      try {
        await notificationService.deleteNotification(notificationId);

        // Update local state
        const deletedNotification = notifications.find(
          (n) => n.id === notificationId
        );
        setNotifications((prev) =>
          prev.filter((notification) => notification.id !== notificationId)
        );

        // Update unread count if the deleted notification was unread
        if (deletedNotification && !deletedNotification.is_read) {
          setUnreadCount((prev) => Math.max(0, prev - 1));
        }

        // Refresh stats
        await refreshStats();
      } catch (error) {
        logger.error("Error deleting notification:", error);
      }
    },
    [notifications, refreshStats]
  );

  const getNotificationPreferences = useCallback(async () => {
    if (!user) return;
    const preferences =
      await notificationService.getUserNotificationPreferences(user.id);
    setPreferences(preferences);
  }, [user]);

  // Clear all notifications
  const clearAllNotifications = useCallback(async () => {
    if (!user) return;

    try {
      await notificationService.clearAllNotifications(user.id);

      // Reset state
      setNotifications([]);
      setUnreadCount(0);
      setStats(null);
    } catch (error) {
      logger.error("Error clearing all notifications:", error);
    }
  }, [user]);

  // Update notification preferences
  const updatePreferences = useCallback(
    async (newPreferences: Partial<NotificationPreferences>) => {
      if (!user) return;

      try {
        await notificationService.updateNotificationPreferences(
          user.id,
          newPreferences
        );

        // Update local state
        setPreferences((prev) =>
          prev ? { ...prev, ...newPreferences } : null
        );
      } catch (error) {
        logger.error("Error updating notification preferences:", error);
      }
    },
    [user]
  );

  // Subscribe to real-time notifications
  const subscribeToNotifications = useCallback(() => {
    if (!user || subscription) return;

    try {
      const newSubscription = supabase
        .channel(`notifications-${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            logger.info("New notification received:", payload);

            // Add new notification to the beginning of the list
            setNotifications((prev) => [payload.new as Notification, ...prev]);

            // Update unread count
            setUnreadCount((prev) => prev + 1);

            // Update stats
            if (stats) {
              setStats((prev) =>
                prev
                  ? {
                      ...prev,
                      total: prev.total + 1,
                      unread: prev.unread + 1,
                      byType: {
                        ...prev.byType,
                        [payload.new.type]:
                          (prev.byType[payload.new.type] || 0) + 1,
                      },
                    }
                  : null
              );
            }
          }
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            logger.info("Notification updated:", payload);

            // Update notification in the list
            setNotifications((prev) =>
              prev.map((notification) =>
                notification.id === payload.new.id
                  ? (payload.new as Notification)
                  : notification
              )
            );
          }
        )
        .on(
          "postgres_changes",
          {
            event: "DELETE",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            logger.info("Notification deleted:", payload);

            // Remove notification from the list
            setNotifications((prev) =>
              prev.filter((notification) => notification.id !== payload.old.id)
            );

            // Refresh stats
            refreshStats();
          }
        )
        .subscribe();

      setSubscription(newSubscription);
      logger.info("Subscribed to real-time notifications");
    } catch (error) {
      logger.error("Error subscribing to notifications:", error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, subscription, stats]);

  // Unsubscribe from real-time notifications
  const unsubscribeFromNotifications = useCallback(() => {
    if (subscription) {
      subscription.unsubscribe();
      setSubscription(null);
      logger.info("Unsubscribed from real-time notifications");
    }
  }, [subscription]);

  // Load initial data when user changes
  useEffect(() => {
    if (user) {
      loadNotifications();
      refreshStats();
      subscribeToNotifications();
      getNotificationPreferences();
    } else {
      // Clear state when user logs out
      setNotifications([]);
      setUnreadCount(0);
      setStats(null);
      setPreferences(null);
      unsubscribeFromNotifications();
    }

    return () => {
      unsubscribeFromNotifications();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, loadNotifications]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      unsubscribeFromNotifications();
    };
  }, [unsubscribeFromNotifications]);

  const value: NotificationContextType = {
    // State
    notifications,
    unreadCount,
    stats,
    preferences,
    loading,

    // Actions
    loadNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    updatePreferences,
    refreshStats,

    // Real-time
    subscribeToNotifications,
    unsubscribeFromNotifications,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
