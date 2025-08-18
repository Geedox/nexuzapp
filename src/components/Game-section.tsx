import { GameCard } from "./Game-card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useRef } from "react"
import { useSidebar } from "./ui/sidebar"

const games = [
    {
        id: '11111111-1111-1111-1111-111111111111',
        name: "Endless Runner",
        players: 2150,
        status: "LIVE",
        image: "/games/games1.jpg",
        category: "Casual",
        rating: 4.2,
        gameUrl: "https://cheerful-entremet-2dbb07.netlify.app/",
        instructions: "Press SPACE or Click to jump. Hold for higher jumps. Collect gems for bonus points! Difficulty increases every 100 points."
    },
    {
        id: '22222222-2222-2222-2222-222222222222',
        name: "Flappy Bird",
        players: 1840,
        status: "LIVE",
        image: "/games/games2.jpg",
        category: "Casual",
        rating: 4.2,
        gameUrl: "https://stirring-unicorn-441851.netlify.app/",
        instructions: "Tap or click to flap. Navigate through pipes without hitting them! How far can you fly?"
    },
    {
        id: '33333333-3333-3333-3333-333333333333',
        name: "Crypto Jump",
        players: 890,
        status: "LIVE",
        image: "/games/games3.jpg",
        category: "Arcade",
        rating: 4.2,
        gameUrl: "https://ornate-lamington-115e41.netlify.app/",
        instructions: "Jump over obstacles and collect coins to score points. Use arrow keys to move left/right."
    },
    {
        id: 'nft-battle',
        name: "NFT Battle Arena",
        players: 650,
        status: "LIVE",
        image: "/games/games4.jpg",
        category: "Puzzle",
        rating: 4.2,
        instructions: "Coming soon! Battle with your NFTs in this strategic combat game."
    },
    {
        id: 'blockchain-puzzle',
        name: "Blockchain Puzzle Master",
        players: 420,
        status: "WAITING",
        image: "/games/games5.jpg",
        category: "Puzzle",
        rating: 4.2,
        instructions: "Coming soon! Solve blockchain-themed puzzles to earn rewards."
    },
    {
        id: 'space-mining',
        name: "Space Mining Simulator",
        players: 380,
        status: "LIVE",
        image: "/games/games6.jpg",
        category: "Cooking",
        rating: 4.2,
        instructions: "Coming soon! Mine asteroids and build your space empire."
    },
    {
        id: 'space-mining',
        name: "Space Mining Simulator",
        players: 380,
        status: "LIVE",
        image: "/games/games6.jpg",
        category: "Cooking",
        rating: 4.2,
        instructions: "Coming soon! Mine asteroids and build your space empire."
    },

];

interface GamesSectionProps {
    title: string
    category?: string
}

export function GamesSection({ title, category }: GamesSectionProps) {
    const scrollRef = useRef<HTMLDivElement>(null)
    const sidebar = useSidebar()

    console.log(sidebar)

    const filteredGames =
        category && category !== "popular"
            ? games.filter((game) => game.category.toLowerCase() === category.toLowerCase())
            : games

    return (
        <section className="py-1 md:py-11">
            <div className={`transition-all duration-300 `}>
                <div className="flex items-center mb-6">
                    <div>
                        <h2 className="text-xl md:text-2xl font-bold text-foreground mb-2">{title}</h2>
                    </div>

                </div>

                <div
                    className={`flex flex-wrap items-center md:items-start justify-center md:justify-normal md:grid grid-cols-2 ${sidebar.open ? "md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6": "md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7"} gap-2 pb-2 transition-all duration-300 `}

                >
                    {filteredGames.map((game) => (
                        <div key={game.id} className="flex-shrink-0 w-36 md:w-40">
                            <GameCard
                                name={game.name}
                                image={game.image}
                                category={game.category}
                                rating={game.rating}
                                players={game.players}
                                gameUrl={game.gameUrl}
                                status={game.status}
                            />
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
