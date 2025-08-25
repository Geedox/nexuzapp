import { Card } from "@/components/ui/card"
import { Link } from "react-router-dom"
import { useEffect, useState } from "react"

interface GameCardProps {
    name: string
    image: string
    category?: string
    rating?: number
    players?: number
    gameUrl?: string
    status?: string
}

export function GameCard({ name, image, category, rating, players, gameUrl, status }: GameCardProps) {
    const [currentInfoIndex, setCurrentInfoIndex] = useState(0)
    const [isHovered, setIsHovered] = useState(false)

    const gameInfo = [
        { label: name, type: "name" },
        { label: `${players.toLocaleString()} PLAYS`, type: "players" },
        { label: status, type: "status" },
        { label: `Category: ${category}`, type: "category" },
        { label: `★ ${rating}`, type: "rating" },
    ]


    useEffect(() => {
        if (!isHovered) {
            setCurrentInfoIndex(0)
        }
    }, [isHovered])

    return (
        <Link to={gameUrl}>
            <div
                className="relative group cursor-pointer hover:shadow-xl hover:shadow-accent/20"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                <div className="relative aspect-[3/4] rounded-lg overflow-hidden transition-all duration-300">
                    {/* Glowing border effect */}
                    <div
                        className={`absolute inset-0 rounded-lg transition-all duration-300 ${isHovered ? "bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 p-[3px]" : "bg-transparent"
                            }`}
                    >
                        <div className="w-full h-full rounded-lg overflow-hidden">
                            <img
                                src={image || "/placeholder.svg?height=400&width=300&query=game thumbnail"}
                                alt={name}
                                className="w-full h-full object-cover"
                            />
                        </div>


                        <div
                            className={`absolute bottom-0 left-0 right-0 h-[98%] mx-1 rounded-lg bg-black/80 backdrop-blur-sm transition-all duration-300 ${isHovered ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"
                                }`}
                        >
                            <div className="p-3 h-full flex flex-col items-center justify-between">
                                <div className="flex-1 overflow-hidden">
                                    <div
                                        className="transition-transform duration-500 ease-in-out"
                                        style={{
                                            transform: `translateY(-${currentInfoIndex * 100}%)`,
                                        }}
                                    >
                                        {gameInfo.map((info, index) => (
                                                <div
                                                    key={index}
                                                    className={`flex mt-3 items-start text-sm font-medium ${info.type === "name"
                                                        ? "text-white"
                                                        : info.type === "players"
                                                            ? "text-cyan-400"
                                                            : info.type === "status" && info.label === "LIVE"
                                                                ? "text-green-400"
                                                                : info.type === "status"
                                                                    ? "text-xs text-yellow-400"
                                                                    : info.type === "category"
                                                                        ? "text-sm  text-purple-400"
                                                                        : "text-yellow-400"
                                                        }`}
                                                >
                                                    {info.label}
                                                </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Status indicator dot */}
                                <div className="absolute top-3 right-3 flex items-center gap-2">
                                    <div
                                        className={`w-2 h-2 rounded-full cursor-pointer  ${status === "LIVE" ? "bg-green-400" : status === "OFFLINE" ? "bg-red-400" : "bg-yellow-400"
                                            }`}
                                        title={`${status === "LIVE" ? "Live" : status === "OFFLINE" ? "Ended" : "Status"}`}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    )
}
