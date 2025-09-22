import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/utils/logger";
import type { Database, TablesInsert, Tables } from "@/integrations/supabase/types";

export interface GameRoomFilters {
    status?: Database["public"]["Enums"]["room_status"][];
    currency?: Database["public"]["Enums"]["currency_type"][];
    isPrivate?: boolean;
    isSponsored?: boolean;
    minEntryFee?: number;
    maxEntryFee?: number;
    minPlayers?: number;
    maxPlayers?: number;
    gameId?: string;
    creatorId?: string;
    mode?: Database["public"]["Enums"]["room_mode"][];
    sortBy?: string;
    sortOrder?: "asc" | "desc";
    searchQuery?: string;
}

export interface PaginationOptions {
    page: number;
    limit: number;
}

export interface GameRoomWithRelations {
    id: string;
    name: string;
    game_id: string | null;
    game_instance_id: string | null;
    creator_id: string | null;
    entry_fee: number;
    currency: Database["public"]["Enums"]["currency_type"];
    max_players: number;
    current_players: number | null;
    min_players_to_start: number | null;
    is_private: boolean | null;
    room_code: string | null;
    is_sponsored: boolean | null;
    is_special: boolean | null;
    sponsor_amount: number | null;
    winner_split_rule: Database["public"]["Enums"]["winner_split_rule"];
    status: Database["public"]["Enums"]["room_status"] | null;
    start_time: string;
    end_time: string;
    actual_start_time: string | null;
    actual_end_time: string | null;
    timezone: string | null;
    total_prize_pool: number | null;
    platform_fee_collected: number | null;
    on_chain_create_digest: string | null;
    on_chain_room_id: string | null;
    created_at: string | null;
    updated_at: string | null;
    game_name: string | null;
    required_approvals: number | null;
    admin_has_approved: boolean | null;
    mode: Database["public"]["Enums"]["room_mode"] | null;

    // Tournament-specific fields
    tournament_rounds: number | null;
    current_round: number | null;
    tournament_ready: boolean | null;
    tournament_started_at: string | null;
    elimination_type: string | null;
    max_rounds: number | null;
    players_per_match: number | null;
    round_duration_minutes: number | null;
    bracket_data: {
        elimination_type?: string;
        total_rounds?: number;
        participants?: Array<{
            id: string;
            seed?: number | null;
            is_eliminated?: boolean;
        }>;
    } | null;
    active_matches: Record<string, unknown> | null;
    completed_matches: Record<string, unknown> | null;

    // Relations
    game?: {
        id: string;
        name: string;
        game_url?: string;
        description?: string;
        image_url?: string;
    };
    creator?: {
        id: string;
        username?: string;
        display_name?: string;
        avatar_url?: string;
    };
    participants?: Array<{
        id: string;
        user_id: string;
        room_id: string;
        score?: number;
        is_active: boolean;
        joined_at: string;
        user?: {
            id: string;
            username?: string;
            display_name?: string;
            avatar_url?: string;
        };
    }>;
}

class GameRoomService {
    // Get game rooms with filters and pagination
    async getGameRooms(
        filters: GameRoomFilters = {},
        pagination: PaginationOptions = { page: 1, limit: 12 }
    ): Promise<{
        data: GameRoomWithRelations[];
        count: number;
        totalPages: number;
    }> {
        try {
            const start = (pagination.page - 1) * pagination.limit;

            let query = supabase
                .from("game_rooms")
                .select(`
          *,
          game:games(*),
          creator:profiles(*),
          participants:game_room_participants(*)
        `, { count: "exact" });

            // Apply filters
            if (filters.status && filters.status.length > 0) {
                query = query.in("status", filters.status);
            }

            if (filters.currency && filters.currency.length > 0) {
                query = query.in("currency", filters.currency);
            }

            if (filters.mode && filters.mode.length > 0) {
                query = query.in("mode", filters.mode);
            }

            if (filters.isPrivate !== undefined) {
                query = query.eq("is_private", filters.isPrivate);
            }

            if (filters.isSponsored !== undefined) {
                query = query.eq("is_sponsored", filters.isSponsored);
            }

            if (filters.minEntryFee !== undefined) {
                query = query.gte("entry_fee", filters.minEntryFee);
            }

            if (filters.maxEntryFee !== undefined) {
                query = query.lte("entry_fee", filters.maxEntryFee);
            }

            if (filters.minPlayers !== undefined) {
                query = query.gte("current_players", filters.minPlayers);
            }

            if (filters.maxPlayers !== undefined) {
                query = query.lte("max_players", filters.maxPlayers);
            }

            if (filters.gameId) {
                query = query.eq("game_id", filters.gameId);
            }

            if (filters.creatorId) {
                query = query.eq("creator_id", filters.creatorId);
            }

            if (filters.searchQuery) {
                query = query.or(`name.ilike.%${filters.searchQuery}%,game_name.ilike.%${filters.searchQuery}%`);
            }

            // Apply sorting
            const sortBy = filters.sortBy || "created_at";
            const sortOrder = filters.sortOrder || "desc";
            query = query.order(sortBy, { ascending: sortOrder === "asc" });

            // Apply pagination
            query = query.range(start, start + pagination.limit - 1);

            const { data, error, count } = await query;

            if (error) throw error;

            return {
                data: (data as GameRoomWithRelations[]) || [],
                count: count || 0,
                totalPages: Math.ceil((count || 0) / pagination.limit),
            };
        } catch (error) {
            logger.error("Error fetching game rooms:", error);
            throw error;
        }
    }

    // Get single game room with details
    async getGameRoom(roomId: string): Promise<GameRoomWithRelations | null> {
        try {
            const { data, error } = await supabase
                .from("game_rooms")
                .select(`
          *,
          game:games(*),
          creator:profiles(*),
          participants:game_room_participants(
            *,
            user:profiles(*)
          )
        `)
                .eq("id", roomId)
                .single();

            if (error) throw error;
            return data as GameRoomWithRelations;
        } catch (error) {
            logger.error("Error fetching game room:", error);
            return null;
        }
    }

    // Get game room participants
    async getGameRoomParticipants(roomId: string): Promise<any[]> {
        try {
            const { data, error } = await supabase
                .from("game_room_participants")
                .select(`
          *,
          user:profiles(*)
        `)
                .eq("room_id", roomId)
                .eq("is_active", true)
                .order("score", { ascending: false });

            if (error) throw error;
            return data || [];
        } catch (error) {
            logger.error("Error fetching participants:", error);
            return [];
        }
    }

    // Update game room
    async updateGameRoom(
        roomId: string,
        updates: Partial<Database["public"]["Tables"]["game_rooms"]["Update"]>
    ): Promise<GameRoomWithRelations | null> {
        try {
            const { data, error } = await supabase
                .from("game_rooms")
                .update({
                    ...updates,
                    updated_at: new Date().toISOString(),
                })
                .eq("id", roomId)
                .select(`
          *,
          game:games(*),
          creator:profiles(*),
          participants:game_room_participants(*)
        `)
                .single();

            if (error) throw error;
            return data as GameRoomWithRelations;
        } catch (error) {
            logger.error("Error updating game room:", error);
            throw error;
        }
    }

    // Update room status
    async updateRoomStatus(
        roomId: string,
        status: Database["public"]["Enums"]["room_status"],
        additionalUpdates: Partial<Database["public"]["Tables"]["game_rooms"]["Update"]> = {}
    ): Promise<void> {
        try {
            const updates: Partial<Database["public"]["Tables"]["game_rooms"]["Update"]> = {
                status,
                updated_at: new Date().toISOString(),
                ...additionalUpdates,
            };

            // Add status-specific fields
            if (status === "ongoing" && !additionalUpdates.actual_start_time) {
                updates.actual_start_time = new Date().toISOString();
            }

            if (status === "completed" && !additionalUpdates.actual_end_time) {
                updates.actual_end_time = new Date().toISOString();
            }

            const { error } = await supabase
                .from("game_rooms")
                .update(updates)
                .eq("id", roomId);

            if (error) throw error;
        } catch (error) {
            logger.error("Error updating room status:", error);
            throw error;
        }
    }

    // Get room statistics
    async getRoomStatistics(): Promise<{
        totalRooms: number;
        activeRooms: number;
        completedRooms: number;
        totalPrizePool: number;
        totalPlayers: number;
        tournamentRooms: number;
        regularRooms: number;
    }> {
        try {
            const { data: rooms, error } = await supabase
                .from("game_rooms")
                .select("status, total_prize_pool, current_players, mode");

            if (error) throw error;

            const stats = {
                totalRooms: rooms?.length || 0,
                activeRooms: rooms?.filter(r => r.status === "waiting" || r.status === "ongoing").length || 0,
                completedRooms: rooms?.filter(r => r.status === "completed").length || 0,
                totalPrizePool: rooms?.reduce((sum, r) => sum + (r.total_prize_pool || 0), 0) || 0,
                totalPlayers: rooms?.reduce((sum, r) => sum + (r.current_players || 0), 0) || 0,
                tournamentRooms: rooms?.filter(r => r.mode === "tournament").length || 0,
                regularRooms: rooms?.filter(r => r.mode === "regular").length || 0,
            };

            return stats;
        } catch (error) {
            logger.error("Error fetching room statistics:", error);
            throw error;
        }
    }

    // Check if room can start
    async canRoomStart(roomId: string): Promise<boolean> {
        try {
            const { data, error } = await supabase
                .rpc("can_room_start", { room_id: roomId });

            if (error) throw error;
            return data || false;
        } catch (error) {
            logger.error("Error checking if room can start:", error);
            return false;
        }
    }

    // Auto-complete expired rooms
    async autoCompleteExpiredRooms(): Promise<void> {
        try {
            const { error } = await supabase.rpc("auto_complete_expired_rooms");
            if (error) throw error;
        } catch (error) {
            logger.error("Error auto-completing expired rooms:", error);
            throw error;
        }
    }

    // Update room statuses
    async updateRoomStatuses(): Promise<void> {
        try {
            const { error } = await supabase.rpc("update_room_statuses");
            if (error) throw error;
        } catch (error) {
            logger.error("Error updating room statuses:", error);
            throw error;
        }
    }

    // Get user's rooms
    async getUserRooms(userId: string, includeCompleted: boolean = false): Promise<GameRoomWithRelations[]> {
        try {
            let query = supabase
                .from("game_room_participants")
                .select(`
          room_id,
          game_rooms!inner (
            *,
            game:games(*),
            creator:profiles(*),
            participants:game_room_participants(*)
          )
        `)
                .eq("user_id", userId)
                .eq("is_active", true);

            if (!includeCompleted) {
                query = query.in("game_rooms.status", ["waiting", "ongoing"]);
            }

            const { data, error } = await query;

            if (error) throw error;

            // Extract game rooms from the joined result
            const rooms = data?.map(item => item.game_rooms).filter(Boolean) || [];
            return rooms as GameRoomWithRelations[];
        } catch (error) {
            logger.error("Error fetching user rooms:", error);
            return [];
        }
    }

    // Validate room join
    async validateRoomJoin(
        roomId: string,
        userId: string,
        roomCode?: string
    ): Promise<{ success: boolean; message: string }> {
        try {
            const { data, error } = await supabase
                .rpc("validate_room_join", {
                    p_room_id: roomId,
                    p_user_id: userId,
                    p_room_code: roomCode,
                });

            if (error) throw error;
            return data[0] || { success: false, message: "Unknown error" };
        } catch (error) {
            logger.error("Error validating room join:", error);
            return { success: false, message: "Validation failed" };
        }
    }
}

export const gameRoomService = new GameRoomService();