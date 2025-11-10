import { createContext, useContext } from "react";
import { ProfileContextType } from "@/types/profile";

export const ProfileContext = createContext<ProfileContextType | undefined>(
    undefined
);

export const useProfile = () => {
    const context = useContext(ProfileContext);
    if (context === undefined) {
        throw new Error("useProfile must be used within a ProfileProvider");
    }
    return context;
};