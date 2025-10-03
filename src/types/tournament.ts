import { GameRoom } from "./gameroom";
import { RealtimeChannel } from "@supabase/supabase-js";

export interface TournamentContextType {
    // Tournament state
    currentTournament: TournamentBracket | null;
    tournamentParticipants: TournamentParticipant[];
    tournamentStats: TournamentStats | null;
    activeMatch: TournamentMatch | null;
    tournamentRoom: GameRoom | null;

    // Loading states
    loading: boolean;
    starting: boolean;
    completing: boolean;

    // Tournament actions
    createTournament: (data: CreateTournamentData) => Promise<void>;
    startTournament: (roomId: string) => Promise<void>;
    completeMatch: (
        matchId: string,
        winnerId: string,
        loserId: string,
        roomName: string,
        scores?: Record<string, number>
    ) => Promise<void>;
    submitScore: (
        roomId: string,
        matchId: string,
        score: number
    ) => Promise<void>;
    completeTournament: (roomId: string) => Promise<void>;

    // Tournament data fetching
    fetchTournamentData: (roomId: string) => Promise<void>;
    subscribeToTournamentUpdates: (roomId: string) => RealtimeChannel;
    unsubscribeFromTournamentUpdates: (subscription: RealtimeChannel) => void;

    // Validation
    validateTournamentStart: (
        roomId: string
    ) => Promise<{ canStart: boolean; reason?: string }>;
    getMinimumParticipants: (eliminationType: string) => number;
}

export interface TournamentMatch {
    id: string;
    room_id: string;
    round_number: number;
    match_number: number;
    player1_id: string | null;
    player2_id: string | null;
    player3_id: string | null;
    player4_id: string | null;
    winner_id: string | null;
    status: "pending" | "active" | "completed" | "timeout" | string;
    started_at: string | null;
    completed_at: string | null;
    time_limit_minutes: number | null;
    match_data: {
        elimination_type?: string;
        players_per_match?: number;
        round_duration_minutes?: number;
        scores?: Record<string, number>;
        metadata?: Record<string, unknown>;
    };
    created_at: string | null;
    updated_at: string | null;
}

export interface TournamentBracket {
    rounds: TournamentRound[];
    totalRounds: number;
    currentRound: number;
    isComplete: boolean;
    winner?: string;
}

export interface TournamentRound {
    roundNumber: number;
    matches: TournamentMatch[];
    isComplete: boolean;
    isActive: boolean;
}

// TournamentParticipant interface
export interface TournamentParticipant {
    id: string;
    user_id: string;
    room_id: string;
    seed: number | null;
    is_eliminated: boolean;
    elimination_round: number | null;
    total_score: number;
    matches_played: number;
    matches_won: number;
    tournament_points: number;
    tournament_wins: number;
    tournament_draws: number;
    tournament_losses: number;
    tournament_matches_played: number;
    tournament_goals_for: number;
    tournament_goals_against: number;
    tournament_goal_difference: number;
    tournament_final_position: number | null;
    tournament_performance_data: Record<string, any>;
    user?: {
        id: string;
        username?: string;
        display_name?: string;
        avatar_url?: string;
        email?: string;
    };
}

// Add new interface for standings
export interface TournamentStanding {
    id: string;
    room_id: string;
    participant_id: string;
    user_id: string;
    points: number;
    matches_played: number;
    wins: number;
    draws: number;
    losses: number;
    goals_for: number;
    goals_against: number;
    goal_difference: number;
    current_position: number;
    seed_position: number;
    is_eliminated: boolean;
    eliminated_round: number | null;
    average_score: number;
    best_score: number;
    worst_score: number;
    consistency_rating: number;
    created_at: string;
    updated_at: string;
}

export interface CreateTournamentData {
    roomId: string;
    eliminationType: "single" | "round_robin" | string;
    maxRounds?: number;
    playersPerMatch?: number;
    roundDurationMinutes?: number;
    timeLimitMinutes?: number;
}

export interface TournamentStats {
    totalParticipants: number;
    completedMatches: number;
    totalMatches: number;
    currentRound: number;
    totalRounds: number;
    isComplete: boolean;
    winner?: string;
}