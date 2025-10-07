import { TournamentContextType } from "@/types/tournament";
import { createContext, useContext } from "react";

export const TournamentContext = createContext<TournamentContextType | undefined>(
    undefined
);

export const useTournament = (): TournamentContextType => {
    const context = useContext(TournamentContext);
    if (context === undefined) {
        throw new Error("useTournament must be used within a TournamentProvider");
    }
    return context;
};
