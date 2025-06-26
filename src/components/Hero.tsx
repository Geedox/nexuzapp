
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';

interface HeroProps {
  onGetStarted: () => void;
}

const Hero = ({ onGetStarted }: HeroProps) => {
  const [currentStat, setCurrentStat] = useState(0);
  
  const stats = [
    { value: "$2.5M+", label: "Total Rewards Distributed" },
    { value: "85K+", label: "Active Gamers" },
    { value: "1,500+", label: "Games Created" },
    { value: "50+", label: "Supported Blockchains" }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStat((prev) => (prev + 1) % stats.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [stats.length]);

  return (
    <section className="min-h-screen flex items-center justify-center relative overflow-hidden floating-particles">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent via-purple-500/10 to-accent/20"></div>
      
      {/* Animated background elements */}
      <div className="absolute top-20 left-10 w-32 h-32 border border-primary/20 rotate-45 animate-spin" style={{ animationDuration: '20s' }}></div>
      <div className="absolute bottom-20 right-10 w-24 h-24 border border-accent/20 rotate-12 animate-bounce"></div>
      <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-primary/10 rounded-full animate-pulse"></div>
      
      <div className="container mx-auto px-4 text-center relative z-10">
        <div className="animate-slide-up">
          <div className="mt-28">
            <div className="inline-block px-6 py-2 bg-primary/20 border border-primary/40 rounded-full text-primary font-cyber text-sm mb-6 animate-pulse">
              🚀 THE FUTURE OF GAMING IS HERE
            </div>
          </div>
          
          <h1 className="font-gaming text-6xl md:text-8xl font-bold mb-6 glow-text animate-glow-pulse bg-gradient-to-r from-primary via-purple-400 to-accent bg-clip-text text-transparent">
            NEXUZ ARENA
          </h1>
          
          <p className="text-2xl md:text-3xl font-cyber font-bold text-primary mb-4 animate-fade-in">
            DECENTRALIZED GAMING MULTIVERSE
          </p>
          
          <p className="text-lg md:text-xl text-foreground/90 mb-8 max-w-4xl mx-auto leading-relaxed">
            Create competitive games, host epic tournaments, and earn crypto rewards. 
            Build your gaming empire in the most advanced Web3 gaming ecosystem ever created.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
            <Button 
              size="lg"
              onClick={onGetStarted}
              className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/80 hover:to-purple-500 text-white neon-border text-xl px-12 py-6 font-gaming transform hover:scale-105 transition-all duration-300 hologram-effect"
            >
              🎮 ENTER THE ARENA
            </Button>
            <Button 
              size="lg"
              variant="outline"
              className="border-2 border-accent text-accent hover:bg-accent/20 text-xl px-12 py-6 font-gaming transform hover:scale-105 transition-all duration-300"
            >
              🎬 WATCH TRAILER
            </Button>
          </div>

          {/* Dynamic Stats Counter */}
          <div className="bg-black/40 backdrop-blur-lg border border-primary/30 rounded-2xl p-8 max-w-2xl mx-auto mb-12 hologram-effect">
            <div className="text-center animate-float" key={currentStat}>
              <div className="text-5xl font-bold text-primary mb-2 font-cyber glow-text">
                {stats[currentStat].value}
              </div>
              <div className="text-accent text-lg font-gaming">
                {stats[currentStat].label}
              </div>
            </div>
          </div>

          {/* Floating Action Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 max-w-6xl mx-auto">
            <div className="bg-gradient-to-br from-primary/20 to-purple-500/20 p-6 rounded-xl border border-primary/30 hover:border-primary/60 transition-all duration-300 transform hover:scale-105 animate-float" style={{ animationDelay: '0s' }}>
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="font-gaming text-lg font-bold text-primary mb-2">CREATE GAMES</h3>
              <p className="text-sm text-foreground/80">Build highscore & multiplayer games</p>
            </div>
            
            <div className="bg-gradient-to-br from-accent/20 to-blue-500/20 p-6 rounded-xl border border-accent/30 hover:border-accent/60 transition-all duration-300 transform hover:scale-105 animate-float" style={{ animationDelay: '2s' }}>
              <div className="text-4xl mb-4">🏆</div>
              <h3 className="font-gaming text-lg font-bold text-accent mb-2">HOST TOURNAMENTS</h3>
              <p className="text-sm text-foreground/80">Public & private competitions</p>
            </div>
            
            <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 p-6 rounded-xl border border-purple-400/30 hover:border-purple-400/60 transition-all duration-300 transform hover:scale-105 animate-float" style={{ animationDelay: '4s' }}>
              <div className="text-4xl mb-4">💰</div>
              <h3 className="font-gaming text-lg font-bold text-purple-400 mb-2">EARN CRYPTO</h3>
              <p className="text-sm text-foreground/80">USDC & USDT rewards</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
