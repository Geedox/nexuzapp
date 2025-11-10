import { Database } from "@/integrations/supabase/types";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"] & {
    sui_wallet_data: {
        address: string;
        chainId?: string;
        provider?: "panna";
        partnerId?: string | null;
        createdAt?: string;
        updatedAt?: string | null;
        metadata?: Record<string, unknown> | null;
        publicKey?: string;
        privateKey?: string;
        balance?: number;
    } | null;
};

export interface RoomStats {
    totalRoomsJoined: number;
    totalRoomsCreated: number;
    activeRooms: number;
    completedRooms: number;
    totalRoomWinnings: number;
    roomWinRate: number;
    favoriteGame: string | null;
}

export interface GameStats {
    gameId: string;
    gameName: string;
    gamesPlayed: number;
    wins: number;
    earnings: number;
    winRate: number;
    averagePosition: number;
}

export interface ProfileContextType {
    profile: Profile | null;
    loading: boolean;
    roomStats: RoomStats | null;
    gameStats: GameStats[];
    updateProfile: (updates: Partial<Profile>) => Promise<void>;
    checkUsernameAvailability: (username: string) => Promise<boolean>;
    setUsername: (username: string) => Promise<void>;
    refreshProfile: () => Promise<void>;
    refreshStats: () => Promise<void>;
    refreshProfileStats: () => Promise<void>; // New function
    uploadAvatar: (file: File) => Promise<string>; // New function
    removeAvatar: () => Promise<void>; // New function
}