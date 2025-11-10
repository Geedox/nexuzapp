import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { logger } from "../utils";
import { useAuth } from "@/hooks/auth";
import { useToast } from "../hooks/use-toast";
import { Google } from "./Google";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "login" | "signup" | "logout";
  onSwitchType: (type: "login" | "signup") => void;
}

const AuthModal = ({ isOpen, onClose, type, onSwitchType }: AuthModalProps) => {
  const { signInWithGoogle, signUpWithEmail, signInWithEmail } = useAuth();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    logger.info("Auth form submitted:", { type, formData });

    try {
      setSubmitting(true);
      if (type === "login") {
        await signInWithEmail(formData.email, formData.password);
        onClose();
      } else if (type === "signup") {
        await signUpWithEmail(formData);
        onClose();
      }
    } catch (err) {
      logger.error("Auth error", err);
      toast({
        title: "Unexpected error",
        description: (err as Error).message ?? "Please try again",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-card border-primary/20 neon-border">
        <DialogHeader>
          <DialogTitle className="font-gaming text-2xl text-primary glow-text text-center">
            {type === "login" ? "ENTER NEXUZ" : "JOIN THE ARENA"}
          </DialogTitle>
          <DialogDescription className="text-center text-muted-foreground">
            {type === "login"
              ? "Welcome back, warrior. Ready to compete?"
              : "Create your account and start your gaming journey"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <Button
            type="button"
            onClick={signInWithGoogle}
            className="w-full bg-background text-foreground hover:bg-primary/10 font-cyber border border-primary/30 flex items-center gap-2"
          >
            <Google className="w-4 h-4" />
            Continue with Google
          </Button>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-primary/20" />
            <span>or continue with email</span>
            <div className="h-px flex-1 bg-primary/20" />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-foreground">
              Email
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="Enter your email"
              className="bg-background border-primary/30 focus:border-primary"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-foreground">
              Password
            </Label>
            <Input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="Enter your password"
              className="bg-background border-primary/30 focus:border-primary"
              required
            />
          </div>

          {type === "signup" && (
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-foreground">
                Confirm Password
              </Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                placeholder="Confirm your password"
                className="bg-background border-primary/30 focus:border-primary"
                required
              />
            </div>
          )}

          <Button
            type="submit"
            disabled={submitting}
            className="w-full bg-primary hover:bg-primary/80 text-primary-foreground font-gaming neon-border"
          >
            {submitting
              ? type === "login"
                ? "Signing in..."
                : "Creating account..."
              : type === "login"
              ? "LOGIN"
              : "CREATE ACCOUNT"}
          </Button>
        </form>

        <div className="text-center">
          <span className="text-muted-foreground">
            {type === "login"
              ? "Don't have an account? "
              : "Already have an account? "}
          </span>
          <button
            onClick={() => onSwitchType(type === "login" ? "signup" : "login")}
            className="text-primary hover:text-primary/80 font-semibold"
          >
            {type === "login" ? "Sign Up" : "Login"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal;
