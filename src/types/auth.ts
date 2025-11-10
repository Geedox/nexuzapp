import { Session, User } from "@supabase/supabase-js";
import { Profile } from "./profile";
export interface AuthContextType {
    user: User | null;
    session: Session | null;
    profile: Profile | null;
    loading: boolean;
    signInWithGoogle: () => Promise<void>;
    signInWithEmail: (email: string, password: string) => Promise<void>;
    signUpWithEmail: (formData: UserSignupData) => Promise<void>;
    signOut: () => Promise<void>;
    updateProfile: (updates: Partial<Profile>) => Promise<void>;
}

export type UserSignupData = {
    email: string;
    password: string;
    confirmPassword: string;
};