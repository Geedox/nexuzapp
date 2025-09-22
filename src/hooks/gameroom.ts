import { createContext, useContext } from "react";
import { GameRoomContextType } from "@/types/gameroom";

export const GameRoomContext = createContext<GameRoomContextType | undefined>(
    undefined
);
export const useGameRoom = () => {
    const context = useContext(GameRoomContext);
    if (context === undefined) {
        throw new Error("useGameRoom must be used within a GameRoomProvider");
    }
    return context;
};