import { useState } from "react"

const categories = [
    { id: "popular", name: "Popular", icon: "🔥" },
    { id: "new", name: "New", icon: "✨" },
    { id: "action", name: "Action", icon: "⚔️" },
    { id: "adventure", name: "Adventure", icon: "🗺️" },
    { id: "simulation", name: "Simulation", icon: "🌍" },
    { id: "sports", name: "Sports", icon: "⚽" },
    { id: "puzzle", name: "Puzzle", icon: "🧩" },
    { id: "fighting", name: "Fighting", icon: "🥊" },
]

interface CategoryNavProps {
    onCategoryChange?: (categoryId: string) => void
}

export function GameCategories({ onCategoryChange }: CategoryNavProps) {
    const [activeCategory, setActiveCategory] = useState("popular")

    const handleCategoryClick = (categoryId: string) => {
        setActiveCategory(categoryId)
        onCategoryChange?.(categoryId)
    }

    return (
        <div className="w-full bg-card border-b border-border ">
            {/* <h2 className="font-cyber text-lg font-bold text-primary mb-2">Categories</h2> */}
            <div className="w-full overflow-hidden">
                <div className="grid grid-cols-4 md:flex flex-wrap items-center gap-1 overflow-x-auto py-4 gaming-scrollbar px-4">
                    {categories.map((category) => (
                        <button
                            key={category.id}
                            onClick={() => handleCategoryClick(category.id)}
                            className={`flex flex-col items-center gap-2 px-4 py-3 rounded-lg transition-all duration-200 whitespace-nowrap flex-shrink-0 ${activeCategory === category.id
                                    ? "bg-accent text-accent-foreground"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                                }`}
                        >
                            <span className="text-2xl">{category.icon}</span>
                            <span className="text-sm font-medium">{category.name}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    )
}
