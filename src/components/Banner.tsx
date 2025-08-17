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
        containerClass: "bg-gradient-to-r from-primary to-accent rounded-2xl p-6",
        titleClass: "font-cyber text-2xl font-bold text-white mb-2 drop-shadow-lg"
    },
    {
        path: "leaderboards",
        title: "🏆 Leaderboards",
        description: "See where you rank among the best players worldwide",
        containerClass: "bg-gradient-to-r from-primary to-accent rounded-2xl p-6",
        titleClass: "font-cyber text-2xl font-bold text-white mb-2 drop-shadow-lg",
        hasRefreshButton: true
    },
    {
        path: "community",
        title: "👥 Gaming Community",
        description: "Connect with fellow gamers and build your network",
        containerClass: "bg-gradient-to-r from-primary to-accent rounded-2xl p-6",
        titleClass: "font-cyber text-2xl font-bold text-white mb-2 drop-shadow-lg"
    },
    {
        path: "rooms",
        title: "🏠 Game Rooms",
        description: "Join existing rooms or create your own gaming session",
        containerClass: "bg-gradient-to-r from-primary to-accent rounded-2xl p-6",
        titleClass: "font-cyber text-2xl font-bold text-white mb-2 drop-shadow-lg"
    },
    {
        path: "creators",
        title: "🎨 Game Creators",
        description: "Discover talented creators and their amazing games",
        containerClass: "bg-gradient-to-r from-primary to-accent rounded-2xl p-6",
        titleClass: "font-cyber text-2xl font-bold text-white mb-2 drop-shadow-lg"
    },
    {
        path: "analytics",
        title: "📊 Gaming Analytics",
        description: "Track your performance and gaming statistics",
        containerClass: "bg-gradient-to-r from-primary to-accent rounded-2xl p-6",
        titleClass: "font-cyber text-2xl font-bold text-white mb-2 drop-shadow-lg"
    },
    {
        path: "settings",
        title: "⚙️ Settings",
        description: "Customize your gaming experience and account preferences",
        containerClass: "bg-gradient-to-r from-primary to-accent rounded-2xl p-6",
        titleClass: "font-cyber text-2xl font-bold text-white mb-2 drop-shadow-lg"
    },
    {
        path: "support",
        title: "🎧 Support Center",
        description: "Get help with your gaming experience",
        containerClass: "bg-gradient-to-r from-primary to-accent rounded-2xl p-6",
        titleClass: "font-cyber text-2xl font-bold text-white mb-2 drop-shadow-lg"
    }
]

// Default banner for unknown routes
const defaultBanner = {
    title: "🎮 NexuzApp",
    description: "Your ultimate blockchain gaming platform",
    containerClass: "bg-gradient-to-r from-primary to-accent rounded-2xl p-6",
    titleClass: "font-cyber text-2xl font-bold text-white mb-2 drop-shadow-lg"
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
        <div className={`flex ${pathname === "/games" ? "" : ""} md:max-w-4xl mx-auto justify-between items-center ${bannerData.containerClass}`}>
            <div className="flex-1">
                <h1 className={bannerData.titleClass}>
                    {bannerData.title}
                </h1>
                <p className="text-white/80 text-sm font-medium mb-2">
                    {bannerData.description}
                </p>

                {/* Conditional refresh button for leaderboards */}
                {bannerData.hasRefreshButton && onRefreshLeaderboards && (
                    <button
                        onClick={onRefreshLeaderboards}
                        className="mt-2 px-4 py-2 bg-gradient-to-r from-primary to-accent hover:scale-105 transition-all duration-300 neon-border text-white rounded-lg font-cyber flex items-center gap-2 text-sm"
                        disabled={isLoading}
                    >
                        {isLoading ? '🔄 Refreshing...' : '🔄 Refresh All'}
                    </button>
                )}
            </div>
            <img
                src="/gameArena.png"
                alt="gaming"
                className='hidden md:block md:w-24 md:h-24 object-contain md:animate-float duration-300 hover:scale-105 transform transition-all drop-shadow-2xl'
            />
        </div>
    )
}