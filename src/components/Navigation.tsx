
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

interface NavigationProps {
  onAuthClick?: (type: 'login' | 'signup') => void;
}

const Navigation = ({ onAuthClick }: NavigationProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, signInWithGoogle, signOut } = useAuth();

  const handleAuthAction = () => {
    if (user) {
      signOut();
    } else {
      signInWithGoogle();
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-primary/20">
      <div className="container mx-auto px-4 py-3 lg:py-4">
        <div className="flex items-center justify-between">
          <div className="font-gaming text-xl lg:text-2xl font-bold text-primary glow-text">
            NEXUZ ARENA
          </div>
          
          <div className="hidden font-cyber lg:flex items-center space-x-8">
            <a href="#features" className="text-foreground hover:text-primary transition-colors">
              Features
            </a>
            <a href="#games" className="text-foreground hover:text-primary transition-colors">
              Games
            </a>
            <a href="#creators" className="text-foreground hover:text-primary transition-colors">
              For Creators
            </a>
            <a href="#tournaments" className="text-foreground hover:text-primary transition-colors">
              Tournaments
            </a>
          </div>

          <div className="hidden md:flex items-center space-x-2 lg:space-x-4">
            {user ? (
              <>
                <span className="text-sm text-foreground">
                  Welcome, {user.user_metadata?.name || user.email}
                </span>
                <Button 
                  variant="ghost" 
                  onClick={handleAuthAction}
                  className="text-foreground hover:text-primary text-sm lg:text-base px-3 lg:px-4"
                >
                  Sign Out
                </Button>
              </>
            ) : (
              <Button 
                onClick={handleAuthAction}
                className="bg-primary hover:bg-primary/80 text-primary-foreground font-cyber neon-border text-sm lg:text-base px-3 lg:px-4"
              >
                Sign In with Google
              </Button>
            )}
          </div>

          <button
            className="md:hidden text-foreground p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {isMenuOpen && (
          <div className="md:hidden mt-4 pb-4 space-y-4 border-t border-primary/20 pt-4">
            <a href="#features" className="block text-foreground hover:text-primary transition-colors py-2">
              Features
            </a>
            <a href="#games" className="block text-foreground hover:text-primary transition-colors py-2">
              Games
            </a>
            <a href="#creators" className="block text-foreground hover:text-primary transition-colors py-2">
              For Creators
            </a>
            <a href="#tournaments" className="block text-foreground hover:text-primary transition-colors py-2">
              Tournaments
            </a>
            <div className="flex flex-col space-y-3 pt-4 border-t border-primary/20">
              <Button 
                onClick={handleAuthAction}
                className="bg-primary hover:bg-primary/80 text-primary-foreground w-full"
              >
                {user ? 'Sign Out' : 'Sign In with Google'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
