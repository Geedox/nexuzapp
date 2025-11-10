import { createContext, useCallback, useContext } from 'react';
import { notificationService } from '../services/notificationService';
import { supabase } from '../integrations/supabase/client';
import type { Database } from '../integrations/supabase/types';
import { logger } from '../utils/logger';
import { NotificationContextType, NotificationData, NotificationOptions } from '../types/notification';


export const NotificationContext = createContext<NotificationContextType | undefined>(
    undefined
);

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error(
            "useNotifications must be used within a NotificationProvider"
        );
    }
    return context;
};

export const useNotification = () => {
    const { refreshStats } = useNotifications();

    // Helper function to get user email (for current user only)
    const getCurrentUserEmail = useCallback(async (): Promise<string | null> => {
        try {
            const { data: { user }, error } = await supabase.auth.getUser();
            if (error) {
                logger.error('Error fetching current user email:', error);
                return null;
            }
            return user?.email || null;
        } catch (error) {
            logger.error('Error getting current user email:', error);
            return null;
        }
    }, []);

    // Create a single notification
    const createNotification = useCallback(async (
        userId: string,
        type: Database["public"]["Enums"]["notification_type"],
        data: NotificationData,
        options: NotificationOptions = {}
    ) => {
        try {
            await notificationService.createNotification(userId, type, data, options);
            await refreshStats();
            logger.info(`Notification created: ${type} for user ${userId}`);
        } catch (error) {
            logger.error('Error creating notification:', error);
            throw error;
        }
    }, [refreshStats]);

    // Create multiple notifications
    const createBulkNotifications = useCallback(async (
        userIds: string[],
        type: Database["public"]["Enums"]["notification_type"],
        data: NotificationData,
        options: NotificationOptions = {}
    ) => {
        try {
            await notificationService.createBulkNotifications(userIds, type, data, options);
            await refreshStats();
            logger.info(`Bulk notifications created: ${type} for ${userIds.length} users`);
        } catch (error) {
            logger.error('Error creating bulk notifications:', error);
            throw error;
        }
    }, [refreshStats]);

    // Helper functions for common notification types
    const notifyRoomCreated = useCallback(async (
        roomId: string,
        roomName: string,
        creatorId: string,
        creatorName: string,
        participantIds: string[]
    ) => {
        const data: NotificationData = {
            room_id: roomId,
            room_name: roomName,
            sender_id: creatorId,
            sender_name: creatorName
        };

        await createBulkNotifications(
            participantIds,
            'room_created',
            data,
            { sendEmail: true, priority: 'medium' }
        );
    }, [createBulkNotifications]);

    const notifyPlayerJoined = useCallback(async (
        roomId: string,
        roomName: string,
        playerId: string,
        playerName: string,
        participantIds: string[]
    ) => {
        const data: NotificationData = {
            room_id: roomId,
            room_name: roomName,
            sender_id: playerId,
            sender_name: playerName
        };

        await createBulkNotifications(
            participantIds.filter(id => id !== playerId), // Don't notify the player who joined
            'player_joined',
            data,
            { sendEmail: true, priority: 'low' }
        );
    }, [createBulkNotifications]);

    const notifyPlayerLeft = useCallback(async (
        roomId: string,
        roomName: string,
        playerId: string,
        playerName: string,
        participantIds: string[]
    ) => {
        const data: NotificationData = {
            room_id: roomId,
            room_name: roomName,
            sender_id: playerId,
            sender_name: playerName
        };

        await createBulkNotifications(
            participantIds.filter(id => id !== playerId), // Don't notify the player who left
            'player_left',
            data,
            { sendEmail: false, priority: 'low' }
        );
    }, [createBulkNotifications]);

    const notifyRoomStarted = useCallback(async (
        roomId: string,
        roomName: string,
        gameName: string,
        participantIds: string[]
    ) => {
        const data: NotificationData = {
            room_id: roomId,
            room_name: roomName,
            game_name: gameName
        };

        await createBulkNotifications(
            participantIds,
            'room_start',
            data,
            { sendEmail: true, priority: 'high' }
        );
    }, [createBulkNotifications]);

    const notifyRoomCompleted = useCallback(async (
        roomId: string,
        roomName: string,
        participantIds: string[]
    ) => {
        const data: NotificationData = {
            room_id: roomId,
            room_name: roomName
        };

        await createBulkNotifications(
            participantIds,
            'room_completed',
            data,
            { sendEmail: true, priority: 'high' }
        );
    }, [createBulkNotifications]);

    const notifyRoomCancelled = useCallback(async (
        roomId: string,
        roomName: string,
        refundAmount: string,
        participantIds: string[]
    ) => {
        const data: NotificationData = {
            room_id: roomId,
            room_name: roomName,
            refund_amount: refundAmount
        };

        await createBulkNotifications(
            participantIds,
            'room_cancelled',
            data,
            { sendEmail: true, priority: 'high' }
        );
    }, [createBulkNotifications]);

    const notifyGameWon = useCallback(async (
        userId: string,
        gameName: string,
        prizeAmount?: string
    ) => {
        const data: NotificationData = {
            game_name: gameName,
            prize_amount: prizeAmount
        };

        await createNotification(
            userId,
            'game_won',
            data,
            { sendEmail: true, priority: 'high' }
        );
    }, [createNotification]);

    const notifyHighscoreBeaten = useCallback(async (
        userId: string,
        gameName: string,
        playerName: string,
        newScore: number
    ) => {
        const data: NotificationData = {
            game_name: gameName,
            sender_name: playerName,
            score: newScore
        };

        await createNotification(
            userId,
            'highscore_beaten',
            data,
            { sendEmail: true, priority: 'medium' }
        );
    }, [createNotification]);

    const notifyTournamentAdvance = useCallback(async (
        userId: string,
        tournamentName: string,
        nextRound: string
    ) => {
        const data: NotificationData = {
            tournament_name: tournamentName,
            next_round: nextRound
        };

        await createNotification(
            userId,
            'tournament_advance',
            data,
            { sendEmail: true, priority: 'high' }
        );
    }, [createNotification]);

    const notifyTournamentElimination = useCallback(async (
        userId: string,
        tournamentName: string,
        finalRank: number
    ) => {
        const data: NotificationData = {
            tournament_name: tournamentName,
            final_rank: finalRank
        };

        await createNotification(
            userId,
            'tournament_elimination',
            data,
            { sendEmail: true, priority: 'medium' }
        );
    }, [createNotification]);

    const notifyPrizeDistributed = useCallback(async (
        userId: string,
        prizeAmount: string,
        roomName: string
    ) => {
        const data: NotificationData = {
            prize_amount: prizeAmount,
            room_name: roomName
        };

        await createNotification(
            userId,
            'prize_distributed',
            data,
            { sendEmail: true, priority: 'high' }
        );
    }, [createNotification]);

    const notifyFriendRequest = useCallback(async (
        userId: string,
        senderName: string,
        recipientEmail?: string
    ) => {
        const data: NotificationData = {
            sender_name: senderName,
            recipient_email: recipientEmail
        };

        await createNotification(
            userId,
            'friend_request',
            data,
            { sendEmail: true, priority: 'high' }
        );
    }, [createNotification]);

    const notifyFriendRequestAccepted = useCallback(async (
        userId: string,
        friendName: string,
        recipientEmail?: string
    ) => {
        const data: NotificationData = {
            sender_name: friendName,
            recipient_email: recipientEmail
        };

        await createNotification(
            userId,
            'friend_request_accepted',
            data,
            { sendEmail: true, priority: 'medium' }
        );
    }, [createNotification]);

    const notifyFriendRequestDeclined = useCallback(async (
        userId: string,
        friendName: string
    ) => {
        const data: NotificationData = {
            sender_name: friendName
        };

        await createNotification(
            userId,
            'friend_request_declined',
            data,
            { sendEmail: false, priority: 'low' }
        );
    }, [createNotification]);

    const notifyRoomReminder = useCallback(async (
        userId: string,
        roomName: string,
        startTime: string
    ) => {
        const data: NotificationData = {
            room_name: roomName,
            start_time: startTime
        };

        await createNotification(
            userId,
            'room_reminder',
            data,
            { sendEmail: true, priority: 'medium' }
        );
    }, [createNotification]);

    return {
        // Core functions
        createNotification,
        createBulkNotifications,

        // Helper functions
        notifyRoomCreated,
        notifyPlayerJoined,
        notifyPlayerLeft,
        notifyRoomStarted,
        notifyRoomCompleted,
        notifyRoomCancelled,
        notifyGameWon,
        notifyHighscoreBeaten,
        notifyTournamentAdvance,
        notifyTournamentElimination,
        notifyPrizeDistributed,
        notifyFriendRequest,
        notifyFriendRequestAccepted,
        notifyFriendRequestDeclined,
        notifyRoomReminder,

        // Utility functions
        getCurrentUserEmail
    };
};
