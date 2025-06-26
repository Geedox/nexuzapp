
const SecuritySection = () => {
  const securityFeatures = [
    {
      icon: "🔐",
      title: "SMART CONTRACT AUDITED",
      description: "Our smart contracts are audited by leading security firms to ensure maximum protection.",
      color: "from-primary/20 to-purple-500/20"
    },
    {
      icon: "🛡️",
      title: "DECENTRALIZED ESCROW",
      description: "All tournament funds are held in audited smart contracts, not controlled by any central authority.",
      color: "from-accent/20 to-blue-500/20"
    },
    {
      icon: "🔍",
      title: "TRANSPARENT PAYOUTS",
      description: "Every transaction is verifiable on-chain. No hidden fees, no manipulation, just pure transparency.",
      color: "from-green-500/20 to-emerald-500/20"
    },
    {
      icon: "⚡",
      title: "INSTANT SETTLEMENTS",
      description: "Winners receive payouts automatically through smart contracts within seconds of tournament completion.",
      color: "from-yellow-500/20 to-orange-500/20"
    },
    {
      icon: "🎯",
      title: "ANTI-CHEAT SYSTEM",
      description: "Advanced algorithms and blockchain verification prevent cheating and ensure fair play.",
      color: "from-red-500/20 to-pink-500/20"
    },
    {
      icon: "💰",
      title: "MULTI-SIG TREASURY",
      description: "Platform funds are secured with multi-signature wallets requiring consensus for any major actions.",
      color: "from-purple-500/20 to-indigo-500/20"
    }
  ];

  return (
    <section className="py-20 bg-gradient-to-r from-background via-secondary/10 to-background relative overflow-hidden">
      <div className="absolute inset-0 floating-particles"></div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="font-gaming text-5xl md:text-6xl font-bold mb-6 text-primary glow-text">
            FORTRESS-LEVEL SECURITY
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Your funds, your games, your victories - all protected by military-grade blockchain security.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {securityFeatures.map((feature, index) => (
            <div 
              key={index}
              className={`bg-gradient-to-br ${feature.color} border border-primary/20 rounded-xl p-8 hover:border-primary/40 transition-all duration-300 hover:neon-border group animate-slide-up transform hover:scale-105`}
              style={{ animationDelay: `${index * 0.15}s` }}
            >
              <div className="text-5xl mb-6 group-hover:scale-110 transition-transform text-center">
                {feature.icon}
              </div>
              <h3 className="font-gaming text-xl font-bold mb-4 text-primary text-center">
                {feature.title}
              </h3>
              <p className="text-muted-foreground text-center leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <div className="bg-black/40 backdrop-blur-lg border border-primary/30 rounded-2xl p-8 max-w-4xl mx-auto hologram-effect">
            <h3 className="font-cyber text-2xl font-bold text-primary mb-6 glow-text">
              🔒 SECURITY PARTNERSHIPS
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="text-3xl mb-2">🛡️</div>
                <p className="font-gaming text-lg text-accent">CERTIK AUDITED</p>
              </div>
              <div className="text-center">
                <div className="text-3xl mb-2">⚡</div>
                <p className="font-gaming text-lg text-accent">CHAINLINK ORACLES</p>
              </div>
              <div className="text-center">
                <div className="text-3xl mb-2">🔐</div>
                <p className="font-gaming text-lg text-accent">OPENZEPPELIN</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SecuritySection;
