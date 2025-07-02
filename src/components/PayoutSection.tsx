
const PayoutSection = () => {
  const payoutTypes = [
    {
      title: "INSTANT TOURNAMENT PAYOUTS",
      description: "Winners receive USDC/USDT immediately after tournament ends",
      icon: "⚡",
      features: ["Automatic smart contract execution", "No withdrawal delays", "Gas fees covered by platform"]
    },
    {
      title: "CREATOR REVENUE SHARING",
      description: "Game creators earn based on player engagement and usage",
      icon: "💎",
      features: ["Real-time earnings tracking", "Monthly automatic payouts", "Transparent revenue metrics"]
    },
    {
      title: "REFERRAL REWARDS",
      description: "Earn commissions for bringing new players to the platform",
      icon: "🚀",
      features: ["5% lifetime commission", "Multi-tier referral system", "Weekly payout schedule"]
    }
  ];

  return (
    <section className="py-20 bg-secondary/20 relative overflow-hidden">
      <div className="absolute inset-0 cyber-grid opacity-10"></div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="font-gaming text-4xl md:text-6xl font-bold mb-6 text-primary glow-text">
            LIGHTNING-FAST PAYOUTS
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Get paid instantly in USDC or USDT. No waiting, no hassle, just pure crypto rewards.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
          {payoutTypes.map((payout, index) => (
            <div 
              key={index}
              className="bg-gradient-to-br from-card to-secondary/20 border border-primary/20 rounded-xl p-8 hover:border-primary/40 transition-all duration-300 hover:neon-border group animate-slide-up transform hover:scale-105"
              style={{ animationDelay: `${index * 0.2}s` }}
            >
              <div className="text-6xl mb-6 text-center group-hover:scale-110 transition-transform">
                {payout.icon}
              </div>
              <h3 className="font-gaming text-xl font-bold mb-4 text-primary text-center">
                {payout.title}
              </h3>
              <p className="text-muted-foreground text-center mb-6">
                {payout.description}
              </p>
              <ul className="space-y-2">
                {payout.features.map((feature, idx) => (
                  <li key={idx} className="flex items-center text-sm text-foreground/80">
                    <span className="text-accent mr-2">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Payout Statistics */}
        <div className="bg-black/40 backdrop-blur-lg border border-accent/30 rounded-2xl p-8 hologram-effect">
          <h3 className="font-cyber text-2xl font-bold text-center text-accent mb-8 glow-text">
            💰 PAYOUT STATISTICS
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center animate-bounce-slow" style={{ animationDelay: '0s' }}>
              <div className="text-4xl font-bold text-primary mb-2 font-cyber">$2.5M+</div>
              <div className="text-muted-foreground">Total Paid Out</div>
            </div>
            <div className="text-center animate-bounce-slow delay-75" style={{ animationDelay: '4s' }}>
              <div className="text-4xl font-bold text-accent mb-2 font-cyber">&lt; 30s</div>
              <div className="text-muted-foreground">Average Payout Time</div>
            </div>
            <div className="text-center animate-bounce-slow delay-100" style={{ animationDelay: '4s' }}>
              <div className="text-4xl font-bold text-primary mb-2 font-cyber">99.9%</div>
              <div className="text-muted-foreground">Payout Success Rate</div>
            </div>
            <div className="text-center animate-bounce-slow delay-150" style={{ animationDelay: '6s' }}>
              <div className="text-4xl font-bold text-accent mb-2 font-cyber">24/7</div>
              <div className="text-muted-foreground">Automated Payouts</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PayoutSection;
