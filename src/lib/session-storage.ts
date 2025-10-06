import { SESSION_STORAGE_KEY, ROOM_ID } from "@/constants";
import { GameSession } from "@/types/gameroom";
import { logger } from "@/utils";

export class SessionStorage {
    saveSessionToStorage = (sessionToken: string, session: GameSession) => {
        try {
            const existingSessions = this.getSessionsFromStorage();
            existingSessions[sessionToken] = session;
            localStorage.setItem(
                SESSION_STORAGE_KEY,
                JSON.stringify(existingSessions)
            );
        } catch (error) {
            logger.error("Failed to save session to storage:", error);
        }
    };

    saveRoomToStorage = (roomId: string) => {
        try {
            sessionStorage.setItem(
                ROOM_ID,
                roomId
            );
        } catch (error) {
            logger.error("Failed to save session to storage:", error);
        }
    };
    getRoomFromStorage = () => {
        try {
            sessionStorage.getItem(
                ROOM_ID,
            );
        } catch (error) {
            logger.error("Failed to save session to storage:", error);
        }
    };
    removeRoomFromStorage = () => {
        try {
            sessionStorage.removeItem(
                ROOM_ID
            );
        } catch (error) {
            logger.error("Failed to save session to storage:", error);
        }
    };

    getSessionsFromStorage = (): Record<string, GameSession> => {
        try {
            const stored = localStorage.getItem(SESSION_STORAGE_KEY);
            if (!stored) return {};

            const sessions = JSON.parse(stored);
            const now = new Date();

            // Clean up expired sessions
            const validSessions: Record<string, GameSession> = {};
            Object.entries(sessions).forEach(([token, session]: [string, any]) => {
                if (new Date(session.expiresAt) > now) {
                    validSessions[token] = {
                        ...session,
                        startTime: new Date(session.startTime),
                        expiresAt: new Date(session.expiresAt),
                    };
                }
            });

            // Save cleaned sessions back
            if (Object.keys(validSessions).length !== Object.keys(sessions).length) {
                localStorage.setItem(
                    SESSION_STORAGE_KEY,
                    JSON.stringify(validSessions)
                );
            }

            return validSessions;
        } catch (error) {
            logger.error("Failed to get sessions from storage:", error);
            return {};
        }
    };

    removeSessionFromStorage = (sessionToken: string) => {
        try {
            const sessions = this.getSessionsFromStorage();
            delete sessions[sessionToken];
            localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessions));
        } catch (error) {
            logger.error("Failed to remove session from storage:", error);
        }
    };

    generateSessionToken = (): string => {
        return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    };
}

export const storage = new SessionStorage()