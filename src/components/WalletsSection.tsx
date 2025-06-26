
const WalletsSection = () => {
  const wallets = [
    { name: "MetaMask", icon: "🦊", supported: true },
    { name: "WalletConnect", icon: "🔗", supported: true },
    { name: "Coinbase Wallet", icon: "🔵", supported: true },
    { name: "Trust Wallet", icon: "🛡️", supported: true },
    { name: "Phantom", icon: "👻", supported: true },
    { name: "Rainbow", icon: "🌈", supported: true },
  ];

  const chains = [
    { name: "Ethereum", icon: "⟠", color: "text-blue-400" },
    { name: "Polygon", icon: "🔷", color: "text-purple-400" },
    { name: "BSC", icon: "🟡", color: "text-yellow-400" },
    { name: "Arbitrum", icon: "🔵", color: "text-blue-300" },
    { name: "Avalanche", icon: "🔺", color: "text-red-400" },
    { name: "Solana", icon: "◎", color: "text-green-400" },
  ];

  return (
    <section className="py-20 bg-gradient-to-b from-secondary/20 to-background relative overflow-hidden">
      <div className="absolute inset-0 cyber-grid opacity-20"></div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="font-gaming text-5xl md:text-6xl font-bold mb-6 text-primary glow-text">
            UNIVERSAL WALLET SUPPORT
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Connect with any wallet, play on any chain. True cross-chain gaming freedom.
          </p>
        </div>

        {/* Supported Wallets */}
        <div className="mb-16">
          <h3 className="font-cyber text-2xl font-bold text-center mb-8 text-accent">
            SUPPORTED WALLETS
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 max-w-4xl mx-auto">
            {wallets.map((wallet, index) => (
              <div 
                key={wallet.name}
                className="bg-card border border-primary/20 rounded-xl p-6 text-center hover:border-primary/40 transition-all duration-300 hover:neon-border group animate-slide-up transform hover:scale-105"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">
                  {wallet.icon}
                </div>
                <h4 className="font-gaming text-sm font-bold text-primary">
                  {wallet.name}
                </h4>
              </div>
            ))}
          </div>
        </div>

        {/* Supported Chains */}
        <div>
          <h3 className="font-cyber text-2xl font-bold text-center mb-8 text-accent">
            SUPPORTED BLOCKCHAINS
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 max-w-4xl mx-auto">
            {chains.map((chain, index) => (
              <div 
                key={chain.name}
                className="bg-gradient-to-br from-card to-secondary/20 border border-accent/20 rounded-xl p-6 text-center hover:border-accent/40 transition-all duration-300 group animate-slide-up transform hover:scale-105"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className={`text-4xl mb-3 group-hover:scale-110 transition-transform ${chain.color}`}>
                  {chain.icon}
                </div>
                <h4 className="font-gaming text-sm font-bold text-foreground">
                  {chain.name}
                </h4>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center mt-12">
          <div className="inline-block bg-primary/10 border border-primary/30 rounded-xl p-6 max-w-2xl">
            <p className="text-lg text-primary font-cyber font-bold mb-2">
              💎 UNIVERSAL USDC & USDT SUPPORT
            </p>
            <p className="text-foreground/80">
              Earn and compete with stablecoins across all supported networks
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WalletsSection;
