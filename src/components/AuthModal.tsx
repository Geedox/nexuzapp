
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'login' | 'signup';
  onSwitchType: (type: 'login' | 'signup') => void;
}

const AuthModal = ({ isOpen, onClose, type, onSwitchType }: AuthModalProps) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    username: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Auth form submitted:', { type, formData });
    // Authentication logic will be implemented here
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-card border-primary/20 neon-border">
        <DialogHeader>
          <DialogTitle className="font-gaming text-2xl text-primary glow-text text-center">
            {type === 'login' ? 'ENTER NEXUZ' : 'JOIN THE ARENA'}
          </DialogTitle>
          <DialogDescription className="text-center text-muted-foreground">
            {type === 'login' 
              ? 'Welcome back, warrior. Ready to compete?' 
              : 'Create your account and start your gaming journey'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {type === 'signup' && (
            <div className="space-y-2">
              <Label htmlFor="username" className="text-foreground">
                Username
              </Label>
              <Input
                id="username"
                name="username"
                type="text"
                value={formData.username}
                onChange={handleInputChange}
                placeholder="Enter your gamer tag"
                className="bg-background border-primary/30 focus:border-primary"
                required
              />
            </div>
          )}

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

          {type === 'signup' && (
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
            className="w-full bg-primary hover:bg-primary/80 text-primary-foreground font-gaming neon-border"
          >
            {type === 'login' ? 'LOGIN' : 'CREATE ACCOUNT'}
          </Button>
        </form>

        <div className="text-center">
          <span className="text-muted-foreground">
            {type === 'login' ? "Don't have an account? " : "Already have an account? "}
          </span>
          <button
            onClick={() => onSwitchType(type === 'login' ? 'signup' : 'login')}
            className="text-primary hover:text-primary/80 font-semibold"
          >
            {type === 'login' ? 'Sign Up' : 'Login'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal;
