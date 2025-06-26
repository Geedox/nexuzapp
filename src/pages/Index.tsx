import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import Hero from '@/components/Hero';
import Features from '@/components/Features';
import GameShowcase from '@/components/GameShowcase';
import GameDashboard from '@/components/GameDashboard';
import LeaderboardSection from '@/components/LeaderboardSection';
import WalletsSection from '@/components/WalletsSection';
import SecuritySection from '@/components/SecuritySection';
import PayoutSection from '@/components/PayoutSection';
import FAQSection from '@/components/FAQSection';
import AuthModal from '@/components/AuthModal';

const Index = () => {
  const navigate = useNavigate();
  const [authModal, setAuthModal] = useState<{
    isOpen: boolean;
    type: 'login' | 'signup';
  }>({
    isOpen: false,
    type: 'login'
  });

  const handleAuthClick = (type: 'login' | 'signup') => {
    if (type === 'login') {
      // Simulate login and redirect to dashboard
      navigate('/dashboard');
    } else {
      setAuthModal({
        isOpen: true,
        type
      });
    }
  };

  const handleAuthClose = () => {
    setAuthModal({
      ...authModal,
      isOpen: false
    });
  };

  const handleSwitchAuthType = (type: 'login' | 'signup') => {
    setAuthModal({
      isOpen: true,
      type
    });
  };

  const handleGetStarted = () => {
    setAuthModal({
      isOpen: true,
      type: 'signup'
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation onAuthClick={handleAuthClick} />
      <Hero onGetStarted={handleGetStarted} />
      <Features />
      <GameDashboard />
      <GameShowcase />
      <LeaderboardSection />
      <WalletsSection />
      <SecuritySection />
      <PayoutSection />
      <FAQSection />
      
      <AuthModal
        isOpen={authModal.isOpen}
        onClose={handleAuthClose}
        type={authModal.type}
        onSwitchType={handleSwitchAuthType}
      />

      <footer className="bg-secondary/20 py-12 border-t border-primary/20">
        <div className="container mx-auto px-4 text-center">
          <div className="font-gaming text-3xl font-bold text-primary glow-text mb-4">
            NEXUZ ARENA
          </div>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            The ultimate decentralized gaming multiverse where creators build, players compete, and everyone earns.
          </p>
          <div className="flex justify-center space-x-8 text-sm text-muted-foreground mb-6">
            <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-primary transition-colors">Documentation</a>
            <a href="#" className="hover:text-primary transition-colors">Support</a>
          </div>
          <div className="flex justify-center space-x-6 mb-6">
            <a href="#" className="text-2xl hover:text-primary transition-colors">🐦</a>
            <a href="#" className="text-2xl hover:text-primary transition-colors">💬</a>
            <a href="#" className="text-2xl hover:text-primary transition-colors">📱</a>
            <a href="#" className="text-2xl hover:text-primary transition-colors">🎮</a>
          </div>
          <p className="text-xs text-muted-foreground">
            © 2025 Nexuz Arena. Built on the blockchain, powered by the community.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
