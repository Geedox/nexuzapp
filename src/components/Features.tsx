
const Features = () => {
  const features = [
    {
      title: "Create & Monetize",
      description: "Build highscore and multiplayer games. Earn based on player engagement and usage.",
      icon: "🎮",
      gradient: "from-purple-500 to-pink-500",
      details: ["Revenue sharing", "Usage-based earnings", "Creator tools"]
    },
    {
      title: "Tournament Rooms",
      description: "Host public or private competitions with USDC/USDT prizes. Set your own rules.",
      icon: "🏆",
      gradient: "from-blue-500 to-cyan-500",
      details: ["Custom rules", "Prize pools", "Private/Public rooms"]
    },
    {
      title: "Decentralized Economy",
      description: "Transparent, blockchain-based prize distribution and creator earnings.",
      icon: "💎",
      gradient: "from-green-500 to-emerald-500",
      details: ["Smart contracts", "Transparent payouts", "Multi-chain support"]
    },
    {
      title: "Community Driven",
      description: "Join a vibrant ecosystem of gamers, creators, and competitors.",
      icon: "🌐",
      gradient: "from-orange-500 to-red-500",
      details: ["Global community", "Social features", "Competitive rankings"]
    }
  ];

  return (
    <section id="features" className="py-20 bg-gradient-to-b from-background to-secondary/20 relative overflow-hidden">
      <div className="absolute inset-0 cyber-grid opacity-5"></div>
      <div className="floating-particles"></div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="font-gaming text-5xl md:text-6xl font-bold mb-6 text-primary glow-text">
            PLATFORM FEATURES
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Everything you need to create, compete, and earn in the decentralized gaming metaverse
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <div 
              key={index}
              className={`relative bg-gradient-to-br ${feature.gradient} p-1 rounded-2xl group animate-slide-up hover:scale-105 transition-all duration-500`}
              style={{ animationDelay: `${index * 0.2}s` }}
            >
              <div className="bg-card/95 backdrop-blur-lg rounded-2xl p-8 h-full border border-primary/20 hover:border-primary/40 transition-all duration-300">
                <div className="flex items-start space-x-6">
                  <div className="text-6xl group-hover:scale-110 transition-transform duration-300 animate-bounce-slow">
                    {feature.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-gaming text-2xl font-bold mb-3 text-primary">
                      {feature.title}
                    </h3>
                    <p className="text-muted-foreground mb-4 leading-relaxed">
                      {feature.description}
                    </p>
                    <ul className="space-y-2">
                      {feature.details.map((detail, idx) => (
                        <li key={idx} className="flex items-center text-sm text-foreground/80">
                          <span className="text-accent mr-2 text-lg">⚡</span>
                          {detail}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Central Gaming Stats */}
        <div className="mt-20 text-center">
          <div className="inline-block bg-black/40 backdrop-blur-lg border border-accent/30 rounded-2xl p-8 hologram-effect">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="animate-float" style={{ animationDelay: '0s' }}>
                <div className="text-4xl font-bold text-primary mb-2 font-cyber">10K+</div>
                <div className="text-muted-foreground">Active Games</div>
              </div>
              <div className="animate-float" style={{ animationDelay: '1s' }}>
                <div className="text-4xl font-bold text-accent mb-2 font-cyber">50K+</div>
                <div className="text-muted-foreground">Players</div>
              </div>
              <div className="animate-float" style={{ animationDelay: '2s' }}>
                <div className="text-4xl font-bold text-primary mb-2 font-cyber">1M+</div>
                <div className="text-muted-foreground">Tournaments</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;
