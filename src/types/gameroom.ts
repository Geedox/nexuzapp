import React from "react";
import { Database } from "../integrations/supabase/types";
import { Profile } from "@/types/profile";
import {
    SendTransactionResult
} from "panna-sdk/core";


export type Wallet = Profile["sui_wallet_data"];

export type OnChainGameRoomResult = SendTransactionResult;
export interface GameRoom {
    id: string;
    name: string;
    game_id: string;
    game_instance_id: string | null;
    creator_id: string;
    entry_fee: number;
    currency: Database["public"]["Enums"]["currency_type"];
    max_players: number;
    current_players: number;
    min_players_to_start: number;
    is_private: boolean;
    room_code: string | null;
    is_sponsored: boolean;
    is_special: boolean;
    sponsor_amount: number;
    winner_split_rule: Database["public"]["Enums"]["winner_split_rule"];
    status: Database["public"]["Enums"]["room_status"];
    start_time: string;
    end_time: string;
    actual_start_time: string | null;
    actual_end_time: string | null;
    timezone: string | null;
    total_prize_pool: number;
    platform_fee_collected: number;
    on_chain_create_digest: string | null;
    on_chain_room_id: string | null;
    on_chain_completion_digest: string | null;
    on_chain_completion_events: string | null;
    on_chain_completion_effects: string | null;
    on_chain_completion_mapping: string | null;
    created_at: string;
    updated_at: string;
    game_name: string | null;
    start_signing: boolean | null;
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
    participants?: GameRoomParticipant[];
    required_approvals: number | null;
    admin_has_approved: boolean | null;
    participant_has_approved: boolean | null;
    mode: "regular" | "tournament" | "league";
    play_mode: "single" | "multiplayer" | string; // New field for single vs multiplayer
    // Tournament-specific fields
    tournament_rounds?: number | null;
    round_duration_minutes?: number | null;
    elimination_type?: string | null;
    max_rounds?: number | null;
    players_per_match?: number | null;
    time_limit_minutes?: number | null;
    // Completion locking fields
    completion_in_progress?: boolean;
    completion_started_at?: string | null;
    completion_started_by?: string | null;
}


export interface GameSession {
    roomId: string;
    userId: string;
    sessionToken: string;
    gameUrl: string;
    startTime: Date;
    expiresAt: Date; // Add expiration
}

export interface GameRoomParticipant {
    id: string;
    room_id: string;
    user_id: string;
    wallet_id: string;
    entry_transaction_id: string | null;
    payment_currency: Database["public"]["Enums"]["currency_type"];
    payment_amount: number;
    score: number;
    final_position: number | null;
    earnings: number;
    payout_transaction_id: string | null;
    joined_at: string;
    left_at: string | null;
    is_active: boolean;
    user?: {
        id: string;
        username?: string;
        display_name?: string;
        avatar_url?: string;
        email?: string;
        sui_wallet_data?: Database["public"]["Tables"]["profiles"]["Row"]["sui_wallet_data"];
    };
}

export interface CreateRoomData {
    name: string;
    gameId: string;
    entryFee: number;
    currency: Extract<
        Database["public"]["Enums"]["currency_type"],
        "USDC" | "USDT"
    >;
    maxPlayers: number;
    isPrivate: boolean;
    winnerSplitRule: Database["public"]["Enums"]["winner_split_rule"];
    startTime: Date;
    endTime: Date;
    timezone: string;
    isSponsored?: boolean;
    isSpecial?: boolean;
    sponsorAmount?: number;
    gameName?: string;
    mode: "regular" | "tournament" | "league";
    playMode: "single" | "multiplayer"; // New field for single vs multiplayer
    // Tournament-specific fields (rounds calculated automatically based on player count)
    eliminationType?: "single" | "round_robin";
    playersPerMatch?: number;
    autoStart?: boolean;
    seedingEnabled?: boolean;
    spectatorMode?: boolean;
    maxRounds?: number; // Number of rounds for round robin tournaments
}

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
    sortBy?:
    | "created_at"
    | "start_time"
    | "end_time"
    | "entry_fee"
    | "total_prize_pool"
    | "current_players";
    sortOrder?: "asc" | "desc";
    searchQuery?: string;
}

export interface GameRoomContextType {
    rooms: GameRoom[];
    loading: boolean;
    creating: boolean;
    joining: boolean;
    // Pagination state
    currentPage: number;
    totalPages: number;
    totalRooms: number;
    roomsPerPage: number;
    // Filter state
    filters: GameRoomFilters;
    // Pagination functions
    goToPage: (page: number) => Promise<void>;
    nextPage: () => Promise<void>;
    prevPage: () => Promise<void>;
    refreshRooms: () => Promise<void>;
    // Filter functions
    setFilters: (filters: Partial<GameRoomFilters>) => void;
    clearFilters: () => void;
    applyFilters: () => Promise<void>;
    createRoom: (data: CreateRoomData) => Promise<GameRoom>;
    joinRoom: (roomId: string, roomCode?: string) => Promise<void>;
    leaveRoom: (roomId: string) => Promise<void>;
    cancelRoom: (roomId: string) => Promise<void>;
    getRoomDetails: (roomId: string) => Promise<GameRoom | null>;
    updateGameScore: (
        roomId: string,
        score: number,
        userId?: string
    ) => Promise<{ updated: boolean; previousScore: number; newScore: number }>;
    // Admin score management functions
    updateParticipantScore: (
        roomId: string,
        participants: {
            participantId: string;
            newScore: number;
        }[]
    ) => Promise<{
        success: boolean;
        score: number;
    }[]>;

    initiateRoomCompletion: (roomId: string) => Promise<void>;
    completeGame: (
        roomId: string,
    ) => Promise<void>;
    playGame: (roomId: string) => Promise<void>;
    handleGameMessage: (event: MessageEvent) => void;
    // Special room signature functions
    approveGameRoomCompletion: (roomId: string) => Promise<void>;
    getSignaturesAndStatus: (roomId: string) => Promise<{
        collected: number;
        required: number;
        hasCreatorSignature: boolean;
        hasParticipantSignature: boolean;
        signers: {
            id: string;
            participant_id: string | null;
            room_id: string | null;
            created_at: string;
        }[];
    }>;
    refreshRoom: React.MutableRefObject<any>;
}