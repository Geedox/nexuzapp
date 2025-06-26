
const CreatorsPage = () => {
  const creators = [
    { id: 1, name: "GameDev Master", avatar: "🎨", followers: "15.2K", games: 8, revenue: "$45,200", status: "VERIFIED" },
    { id: 2, name: "Crypto Creator", avatar: "⚡", followers: "12.8K", games: 5, revenue: "$32,150", status: "VERIFIED" },
    { id: 3, name: "NFT Designer", avatar: "🎭", followers: "9.5K", games: 12, revenue: "$28,900", status: "RISING" },
    { id: 4, name: "Blockchain Artist", avatar: "🖌️", followers: "7.3K", games: 6, revenue: "$19,800", status: "NEW" },
    { id: 5, name: "Meta Builder", avatar: "🏗️", followers: "6.1K", games: 4, revenue: "$15,600", status: "RISING" },
    { id: 6, name: "Web3 Wizard", avatar: "🧙", followers: "11.9K", games: 9, revenue: "$38,750", status: "VERIFIED" },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="bg-gradient-to-r from-pink-500/20 to-purple-500/20 border border-pink-500/30 rounded-2xl p-6">
        <h1 className="font-cyber text-3xl font-bold text-pink-400 mb-2 glow-text">
          🎨 Game Creators
        </h1>
        <p className="text-muted-foreground">Discover talented creators and their amazing games</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-black/40 backdrop-blur-lg border border-primary/30 rounded-xl p-6 text-center">
          <div className="text-4xl mb-2">👨‍💻</div>
          <div className="text-3xl font-bold text-primary font-cyber">247</div>
          <div className="text-sm text-muted-foreground font-cyber">Active Creators</div>
        </div>
        <div className="bg-black/40 backdrop-blur-lg border border-green-500/30 rounded-xl p-6 text-center">
          <div className="text-4xl mb-2">🎮</div>
          <div className="text-3xl font-bold text-green-400 font-cyber">1,856</div>
          <div className="text-sm text-muted-foreground font-cyber">Games Created</div>
        </div>
        <div className="bg-black/40 backdrop-blur-lg border border-accent/30 rounded-xl p-6 text-center">
          <div className="text-4xl mb-2">💰</div>
          <div className="text-3xl font-bold text-accent font-cyber">$2.8M</div>
          <div className="text-sm text-muted-foreground font-cyber">Total Revenue</div>
        </div>
      </div>

      <div className="flex gap-4 mb-6">
        <button className="bg-gradient-to-r from-primary to-accent text-background font-cyber font-bold py-3 px-6 rounded-xl hover:scale-105 transition-all duration-300">
          🚀 Become Creator
        </button>
        <button className="bg-gradient-to-r from-purple-500 to-pink-500 text-background font-cyber font-bold py-3 px-6 rounded-xl hover:scale-105 transition-all duration-300">
          📝 Creator Program
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {creators.map((creator) => (
          <div
            key={creator.id}
            className="bg-gradient-to-br from-card to-secondary/20 border border-primary/20 rounded-xl p-6 hover:border-primary/40 transition-all duration-300 hover:scale-105 group"
          >
            <div className="text-center mb-4">
              <div className="text-6xl mb-2 group-hover:scale-110 transition-transform">
                {creator.avatar}
              </div>
              <h3 className="font-cyber text-lg font-bold text-primary">{creator.name}</h3>
              <div className={`inline-block px-3 py-1 rounded-full text-xs font-bold font-cyber mt-2 ${
                creator.status === 'VERIFIED' ? 'bg-blue-500/20 text-blue-400' :
                creator.status === 'RISING' ? 'bg-yellow-500/20 text-yellow-400' :
                'bg-green-500/20 text-green-400'
              }`}>
                {creator.status}
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground font-cyber">Followers:</span>
                <span className="text-sm font-cyber text-foreground font-bold">{creator.followers}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground font-cyber">Games:</span>
                <span className="text-sm font-cyber text-foreground">{creator.games}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground font-cyber">Revenue:</span>
                <span className="text-sm font-cyber text-accent font-bold">{creator.revenue}</span>
              </div>
            </div>
            
            <div className="flex gap-2 mt-4">
              <button className="flex-1 bg-gradient-to-r from-primary to-accent text-background font-cyber font-bold py-2 rounded-lg hover:scale-105 transition-all duration-300">
                Follow
              </button>
              <button className="flex-1 bg-secondary/20 border border-primary/30 text-primary font-cyber font-bold py-2 rounded-lg hover:bg-primary/20 transition-all duration-300">
                View Games
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CreatorsPage;
