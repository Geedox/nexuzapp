import { supabase } from "@/integrations/supabase/client";

// Analytics functions to fetch real data from the database

export interface AnalyticsData {
    gamesPlayed: number;
    totalWinnings: number;
    winRate: number;
    hoursPlayed: number;
}

export interface TrendData {
    gamesPlayed: { current: number; previous: number; change: number; trend: 'up' | 'down' };
    totalWinnings: { current: number; previous: number; change: number; trend: 'up' | 'down' };
    winRate: { current: number; previous: number; change: number; trend: 'up' | 'down' };
    hoursPlayed: { current: number; previous: number; change: number; trend: 'up' | 'down' };
}

export interface RecentGame {
    game: string;
    result: 'WIN' | 'LOSS' | string;
    amount: string;
    date: string;
    roomId: string;
    position: number;
}

export interface GameStats {
    totalGames: number;
    wins: number;
    totalWinnings: number;
    winRate: number;
    recentGames: RecentGame[];
}

// Get analytics data for a user
export async function getAnalyticsData(userId: string): Promise<AnalyticsData> {
    try {
        // Get all game room participations for the user
        const { data: participations, error } = await supabase
            .from('game_room_participants')
            .select(`
        *,
        room:game_rooms(
          id,
          name,
          status,
          created_at,
          start_time,
          end_time,
          game:games(name, image_url)
        )
      `)
            .eq('user_id', userId)
            .order('joined_at', { ascending: false });

        if (error) throw error;

        // Calculate statistics
        const totalGames = participations?.length || 0;
        const wins = participations?.filter(p => p.final_position === 1).length || 0;
        const totalWinnings = participations?.reduce((sum, p) => sum + (p.earnings || 0), 0) || 0;
        const winRate = totalGames > 0 ? (wins / totalGames) * 100 : 0;

        // Calculate total hours played from room durations
        const totalMinutes = participations?.reduce((sum, p) => {
            if (p.room?.start_time && p.room?.end_time) {
                const start = new Date(p.room.start_time);
                const end = new Date(p.room.end_time);
                const durationMs = end.getTime() - start.getTime();
                const durationMinutes = durationMs / (1000 * 60); // Convert to minutes
                return sum + durationMinutes;
            }
            return sum;
        }, 0) || 0;
        const hoursPlayed = totalMinutes / 60;

        return {
            gamesPlayed: totalGames,
            totalWinnings,
            winRate: Math.round(winRate * 100) / 100, // Round to 2 decimal places
            hoursPlayed: Math.round(hoursPlayed * 100) / 100 // Round to 2 decimal places
        };
    } catch (error) {
        console.error('Error fetching analytics data:', error);
        throw error;
    }
}

// Get recent games for a user with pagination
export async function getRecentGames(
    userId: string,
    limit: number = 10,
    offset: number = 0
): Promise<{ games: RecentGame[]; total: number }> {
    try {
        // Get total count for pagination
        const { count, error: countError } = await supabase
            .from('game_room_participants')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId);

        if (countError) throw countError;

        // Get paginated data
        const { data: participations, error } = await supabase
            .from('game_room_participants')
            .select(`
        *,
        room:game_rooms(
          id,
          name,
          status,
          created_at,
          game:games(name, image_url)
        )
      `)
            .eq('user_id', userId)
            .order('joined_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) throw error;

        const games = participations?.map(p => ({
            game: p.room?.game?.name || 'Unknown Game',
            result: p.final_position === 1 ? 'WIN' : 'LOSS',
            amount: p.earnings ? (p.earnings > 0 ? `+$${p.earnings.toFixed(2)}` : `-$${Math.abs(p.earnings).toFixed(2)}`) : '$0.00',
            date: p.joined_at ? new Date(p.joined_at).toLocaleDateString() : 'Unknown',
            roomId: p.room_id,
            position: p.final_position
        })) || [];

        return {
            games,
            total: count || 0
        };
    } catch (error) {
        console.error('Error fetching recent games:', error);
        throw error;
    }
}

// Get comprehensive game stats for a user
export async function getGameStats(userId: string): Promise<GameStats> {
    try {
        const analyticsData = await getAnalyticsData(userId);
        const { games: recentGames } = await getRecentGames(userId, 10);

        return {
            totalGames: analyticsData.gamesPlayed,
            wins: Math.round((analyticsData.winRate / 100) * analyticsData.gamesPlayed),
            totalWinnings: analyticsData.totalWinnings,
            winRate: analyticsData.winRate,
            recentGames
        };
    } catch (error) {
        console.error('Error fetching game stats:', error);
        throw error;
    }
}

// Calculate percentage change and trend
function calculateTrend(current: number, previous: number): { change: number; trend: 'up' | 'down' } {
    if (previous === 0) {
        return { change: current > 0 ? 100 : 0, trend: current > 0 ? 'up' : 'down' };
    }

    const change = ((current - previous) / previous) * 100;
    return {
        change: Math.round(change * 100) / 100, // Round to 2 decimal places
        trend: change >= 0 ? 'up' : 'down'
    };
}

// Get trend data by comparing current period with previous period
export async function getTrendData(userId: string, period: 'week' | 'month' | 'year' = 'month'): Promise<TrendData> {
    try {
        // Get current period data
        const currentData = await getAnalyticsDataByPeriod(userId, period);

        // Get previous period data
        let previousPeriod: 'week' | 'month' | 'year' | 'all';
        switch (period) {
            case 'week':
                previousPeriod = 'week'; // Compare with previous week
                break;
            case 'month':
                previousPeriod = 'month'; // Compare with previous month
                break;
            case 'year':
                previousPeriod = 'year'; // Compare with previous year
                break;
            default:
                previousPeriod = 'month';
        }

        // Calculate previous period dates
        const now = new Date();
        let previousStartDate: string;

        switch (period) {
            case 'week': {
                // Previous week
                const prevWeekStart = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
                const prevWeekEnd = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                previousStartDate = prevWeekStart.toISOString();
                break;
            }
            case 'month': {
                // Previous month
                const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
                previousStartDate = prevMonthStart.toISOString();
                break;
            }
            case 'year': {
                // Previous year
                const prevYearStart = new Date(now.getFullYear() - 1, 0, 1);
                const prevYearEnd = new Date(now.getFullYear() - 1, 11, 31);
                previousStartDate = prevYearStart.toISOString();
                break;
            }
            default:
                previousStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
        }

        // Get previous period data
        const { data: previousParticipations, error } = await supabase
            .from('game_room_participants')
            .select(`
        *,
        room:game_rooms(
          id,
          name,
          status,
          created_at,
          start_time,
          end_time,
          game:games(name, image_url)
        )
      `)
            .eq('user_id', userId)
            .gte('joined_at', previousStartDate)
            .order('joined_at', { ascending: false });

        if (error) throw error;

        // Calculate previous period statistics
        const prevTotalGames = previousParticipations?.length || 0;
        const prevWins = previousParticipations?.filter(p => p.final_position === 1).length || 0;
        const prevTotalWinnings = previousParticipations?.reduce((sum, p) => sum + (p.earnings || 0), 0) || 0;
        const prevWinRate = prevTotalGames > 0 ? (prevWins / prevTotalGames) * 100 : 0;

        const prevTotalMinutes = previousParticipations?.reduce((sum, p) => {
            if (p.room?.start_time && p.room?.end_time) {
                const start = new Date(p.room.start_time);
                const end = new Date(p.room.end_time);
                const durationMs = end.getTime() - start.getTime();
                const durationMinutes = durationMs / (1000 * 60);
                return sum + durationMinutes;
            }
            return sum;
        }, 0) || 0;
        const prevHoursPlayed = prevTotalMinutes / 60;

        // Calculate trends
        const gamesPlayedTrend = calculateTrend(currentData.gamesPlayed, prevTotalGames);
        const totalWinningsTrend = calculateTrend(currentData.totalWinnings, prevTotalWinnings);
        const winRateTrend = calculateTrend(currentData.winRate, prevWinRate);
        const hoursPlayedTrend = calculateTrend(currentData.hoursPlayed, prevHoursPlayed);

        return {
            gamesPlayed: {
                current: currentData.gamesPlayed,
                previous: prevTotalGames,
                change: gamesPlayedTrend.change,
                trend: gamesPlayedTrend.trend
            },
            totalWinnings: {
                current: currentData.totalWinnings,
                previous: prevTotalWinnings,
                change: totalWinningsTrend.change,
                trend: totalWinningsTrend.trend
            },
            winRate: {
                current: currentData.winRate,
                previous: prevWinRate,
                change: winRateTrend.change,
                trend: winRateTrend.trend
            },
            hoursPlayed: {
                current: currentData.hoursPlayed,
                previous: prevHoursPlayed,
                change: hoursPlayedTrend.change,
                trend: hoursPlayedTrend.trend
            }
        };
    } catch (error) {
        console.error('Error fetching trend data:', error);
        throw error;
    }
}

// Get analytics data by time period
export async function getAnalyticsDataByPeriod(
    userId: string,
    period: 'week' | 'month' | 'year' | 'all'
): Promise<AnalyticsData> {
    try {
        let startDate: string;
        const now = new Date();

        switch (period) {
            case 'week':
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
                break;
            case 'month':
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
                break;
            case 'year':
                startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000).toISOString();
                break;
            default:
                startDate = '1970-01-01T00:00:00.000Z';
        }

        const { data: participations, error } = await supabase
            .from('game_room_participants')
            .select(`
        *,
        room:game_rooms(
          id,
          name,
          status,
          created_at,
          start_time,
          end_time,
          game:games(name, image_url)
        )
      `)
            .eq('user_id', userId)
            .gte('joined_at', startDate)
            .order('joined_at', { ascending: false });

        if (error) throw error;

        const totalGames = participations?.length || 0;
        const wins = participations?.filter(p => p.final_position === 1).length || 0;
        const totalWinnings = participations?.reduce((sum, p) => sum + (p.earnings || 0), 0) || 0;
        const winRate = totalGames > 0 ? (wins / totalGames) * 100 : 0;

        const totalMinutes = participations?.reduce((sum, p) => {
            if (p.room?.start_time && p.room?.end_time) {
                const start = new Date(p.room.start_time);
                const end = new Date(p.room.end_time);
                const durationMs = end.getTime() - start.getTime();
                const durationMinutes = durationMs / (1000 * 60); // Convert to minutes
                return sum + durationMinutes;
            }
            return sum;
        }, 0) || 0;
        const hoursPlayed = totalMinutes / 60;

        return {
            gamesPlayed: totalGames,
            totalWinnings,
            winRate: Math.round(winRate * 100) / 100,
            hoursPlayed: Math.round(hoursPlayed * 100) / 100
        };
    } catch (error) {
        console.error('Error fetching analytics data by period:', error);
        throw error;
    }
}