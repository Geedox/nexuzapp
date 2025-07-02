
const GameShowcase = () => {
  const games = [
    {
      title: "CYBER RACE",
      category: "Racing",
      players: "2.4K",
      prize: "$500 USDT",
      image: "🏎️"
    },
    {
      title: "NEON SHOOTER",
      category: "Action",
      players: "5.7K",
      prize: "$1,200 USDC",
      image: "🔫"
    },
    {
      title: "CRYPTO PUZZLE",
      category: "Puzzle",
      players: "3.1K",
      prize: "$300 USDT",
      image: "🧩"
    },
    {
      title: "SPACE BATTLES",
      category: "Strategy",
      players: "4.2K",
      prize: "$800 USDC",
      image: "🚀"
    }
  ];

  return (
    <section id="games" className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="font-gaming text-4xl md:text-6xl font-bold mb-6 text-primary glow-text">
            FEATURED GAMES
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Discover the most competitive games with the biggest prize pools
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {games.map((game, index) => (
            <div 
              key={index}
              className="bg-card border border-primary/20 rounded-lg overflow-hidden hover:border-primary/40 transition-all duration-300 hover:neon-border group animate-slide-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="aspect-video bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-6xl group-hover:scale-110 transition-transform">
                {game.image}
              </div>
              <div className="p-4">
                <h3 className="font-gaming font-bold text-lg mb-2 text-primary">
                  {game.title}
                </h3>
                <p className="text-muted-foreground text-sm mb-3">
                  {game.category}
                </p>
                <div className="flex justify-between items-center">
                  <span className="text-foreground text-sm">
                    👥 {game.players}
                  </span>
                  <span className="text-accent font-bold">
                    {game.prize}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default GameShowcase;
