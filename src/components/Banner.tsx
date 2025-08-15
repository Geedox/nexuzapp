import React from 'react'

interface BannerProps {
    pathname: string;
    onRefreshLeaderboards?: () => void;
    isLoading?: boolean;
}

interface BannerItem {
    path: string;
    title: string;
    description: string;
    containerClass: string;
    titleClass: string;
    hasRefreshButton?: boolean;
}

type BannerItems = BannerItem[];

const bannerItems: BannerItems = [
    {
        path: "games",
        title: "🎮 Game Arena",
        description: "Discover and join the most exciting blockchain games",
        containerClass: "bg-gradient-to-r from-primary/20 to-accent/20 border border-primary/30 rounded-2xl p-6",
        titleClass: "font-cyber text-3xl font-bold text-primary mb-2 glow-text"
    },
    {
        path: "leaderboards",
        title: "🏆 Leaderboards",
        description: "See where you rank among the best players worldwide",
        containerClass: "bg-gradient-to-r from-accent/20 to-primary/20 border border-accent/30 rounded-2xl p-6",
        titleClass: "font-cyber text-3xl font-bold text-accent mb-2 glow-text",
        hasRefreshButton: true
    },
    {
        path: "community",
        title: "👥 Gaming Community",
        description: "Connect with fellow gamers and build your network",
        containerClass: "bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-2xl p-6",
        titleClass: "font-cyber text-3xl font-bold text-purple-400 mb-2 glow-text"
    },
    {
        path: "rooms",
        title: "🏠 Game Rooms",
        description: "Join existing rooms or create your own gaming session",
        containerClass: "bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/30 rounded-2xl p-6",
        titleClass: "font-cyber text-3xl font-bold text-blue-400 mb-2 glow-text"
    },
    {
        path: "creators",
        title: "🎨 Game Creators",
        description: "Discover talented creators and their amazing games",
        containerClass: "bg-gradient-to-r from-pink-500/20 to-purple-500/20 border border-pink-500/30 rounded-2xl p-6",
        titleClass: "font-cyber text-3xl font-bold text-pink-400 mb-2 glow-text"
    },
    {
        path: "analytics",
        title: "📊 Gaming Analytics",
        description: "Track your performance and gaming statistics",
        containerClass: "bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30 rounded-2xl p-6",
        titleClass: "font-cyber text-3xl font-bold text-orange-400 mb-2 glow-text"
    },
    {
        path: "settings",
        title: "⚙️ Settings",
        description: "Customize your gaming experience and account preferences",
        containerClass: "bg-gradient-to-r from-gray-500/20 to-slate-500/20 border border-gray-500/30 rounded-2xl p-6",
        titleClass: "font-cyber text-3xl font-bold text-gray-400 mb-2 glow-text"
    },
    {
        path: "support",
        title: "🎧 Support Center",
        description: "Get help with your gaming experience",
        containerClass: "bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/30 rounded-2xl p-6",
        titleClass: "font-cyber text-3xl font-bold text-blue-400 mb-2 glow-text"
    }
]

// Default banner for unknown routes
const defaultBanner = {
    title: "🎮 NexuzApp",
    description: "Your ultimate blockchain gaming platform",
    containerClass: "bg-gradient-to-r from-primary/20 to-accent/20 border border-primary/30 rounded-2xl p-6",
    titleClass: "font-cyber text-3xl font-bold text-primary mb-2 glow-text"
}

export default function Banner({ pathname, onRefreshLeaderboards, isLoading = false }: BannerProps) {
    // Extract the last part of the pathname (case-insensitive)
    const getPathKey = (path: string) => {
        const segments = path.split('/').filter(Boolean);
        return segments[segments.length - 1]?.toLowerCase() || '';
    }

    // Find matching banner item
    const currentPath = getPathKey(pathname);
    const bannerData = bannerItems.find(item =>
        item.path === currentPath
    ) || defaultBanner;

    return (
        <div className={`flex justify-between ${bannerData.containerClass}`}>
            <div>
                <h1 className={bannerData.titleClass}>
                    {bannerData.title}
                </h1>
                <p className="text-muted-foreground">
                    {bannerData.description}
                </p>

                {/* Conditional refresh button for leaderboards */}
                {bannerData.hasRefreshButton && onRefreshLeaderboards && (
                    <button
                        onClick={onRefreshLeaderboards}
                        className="mt-4 px-4 py-2 bg-accent/20 text-accent rounded-lg font-cyber hover:bg-accent/30 transition-colors"
                        disabled={isLoading}
                    >
                        {isLoading ? '🔄 Refreshing...' : '🔄 Refresh All'}
                    </button>
                )}
            </div>
            <img src="/gameArena.png" alt="gaming" className='hidden md:block md:w-1/6 md:animate-float duration-300 hover:scale-105 transform transition-all'/>
        </div>
    )
}