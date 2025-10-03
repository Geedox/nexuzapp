import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Code, 
  Zap, 
  Trophy, 
  Users, 
  Globe, 
  Smartphone, 
  ArrowRight, 
  CheckCircle,
  Gamepad2,
  Crown,
  Target
} from 'lucide-react';

const PlatformAsService = () => {
  const features = [
    {
      icon: Code,
      title: "Simple API Integration",
      description: "Add competition layers to any game with just a few lines of code",
      color: "text-blue-500"
    },
    {
      icon: Trophy,
      title: "Instant Tournaments",
      description: "Create tournaments, rooms and leaderboards without building infrastructure",
      color: "text-yellow-500"
    },
    {
      icon: Users,
      title: "Community Building",
      description: "Connect your players with a global gaming community",
      color: "text-green-500"
    },
    {
      icon: Zap,
      title: "Real-time Updates",
      description: "Live score tracking and instant reward distribution",
      color: "text-purple-500"
    }
  ];

  const integrationTypes = [
    {
      icon: Smartphone,
      platform: "Mobile Games",
      description: "iOS & Android native games",
      examples: ["Unity", "Unreal", "React Native", "Flutter"]
    },
    {
      icon: Globe,
      platform: "Web Games",
      description: "Browser-based gaming experiences",
      examples: ["HTML5", "WebGL", "Three.js", "Phaser"]
    },
    {
      icon: Gamepad2,
      platform: "Console Games",
      description: "PC and console gaming platforms",
      examples: ["Steam", "Epic Games", "Xbox", "PlayStation"]
    }
  ];

  const apiMethods = [
    { method: "POST /api/scores", description: "Submit player scores" },
    { method: "GET /api/leaderboard", description: "Fetch current rankings" },
    { method: "POST /api/tournaments", description: "Create new competitions" },
    { method: "GET /api/rewards", description: "Retrieve player earnings" }
  ];

  return (
    <section className="py-24 bg-gradient-to-br from-background via-primary/5 to-accent/5 relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <div className="inline-block px-6 py-2 bg-primary/20 border border-primary/40 rounded-full text-primary font-cyber text-sm mb-6 animate-pulse">
            🔌 PLATFORM AS A SERVICE
          </div>
          
          <h2 className="font-gaming text-4xl md:text-6xl font-bold mb-6 glow-text bg-gradient-to-r from-primary via-purple-400 to-accent bg-clip-text text-transparent">
            PLUG INTO THE NEXUZ
          </h2>
          
          <p className="text-xl text-foreground/90 mb-8 max-w-4xl mx-auto leading-relaxed">
            Don't rebuild what already exists. Connect your existing mobile or web games to Nexuz Arena's 
            competition infrastructure with simple APIs. Add tournaments, rooms, leaderboards, and crypto rewards 
            to any game in minutes, not months.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Button 
              size="lg"
              className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/80 hover:to-purple-500 text-white text-lg px-8 py-4 font-gaming transform hover:scale-105 transition-all duration-300"
            >
              🚀 GET API ACCESS
            </Button>
            <Button 
              size="lg"
              variant="outline"
              className="border-2 border-accent text-accent hover:bg-accent/20 text-lg px-8 py-4 font-gaming transform hover:scale-105 transition-all duration-300"
            >
              📚 VIEW DOCS
            </Button>
          </div>
        </div>

        {/* Integration Types */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {integrationTypes.map((type, index) => (
            <Card key={index} className="border-primary/20 bg-card/50 backdrop-blur-sm hover:border-primary/40 transition-all duration-300 transform hover:scale-105">
              <CardHeader className="text-center">
                <div className="w-16 h-16 mx-auto bg-primary/20 rounded-full flex items-center justify-center mb-4">
                  <type.icon className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="font-gaming text-xl text-primary">{type.platform}</CardTitle>
                <CardDescription>{type.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 justify-center">
                  {type.examples.map((example, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {example}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {features.map((feature, index) => (
            <Card key={index} className="border-primary/20 bg-card/50 backdrop-blur-sm hover:border-primary/40 transition-all duration-300 group">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 mx-auto bg-primary/20 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <feature.icon className={`w-6 h-6 ${feature.color}`} />
                </div>
                <h3 className="font-gaming text-lg font-bold text-primary mb-2">{feature.title}</h3>
                <p className="text-sm text-foreground/80">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* API Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          <div>
            <h3 className="font-gaming text-3xl font-bold text-primary mb-6">Simple Integration</h3>
            <p className="text-lg text-foreground/90 mb-8">
              Add competitive gaming features to your existing game with minimal code changes. 
              Our RESTful API handles all the complex infrastructure.
            </p>
            
            <div className="space-y-4">
              {apiMethods.map((api, index) => (
                <div key={index} className="flex items-center space-x-4 p-4 bg-card/30 rounded-lg border border-primary/20">
                  <Badge variant="outline" className="font-mono text-xs">
                    {api.method.split(' ')[0]}
                  </Badge>
                  <code className="font-mono text-sm text-primary flex-1">
                    {api.method.split(' ')[1]}
                  </code>
                  <span className="text-sm text-foreground/70">{api.description}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-black/40 backdrop-blur-lg border border-primary/30 rounded-2xl p-6">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm text-foreground/70 ml-2">nexuz-api-integration.js</span>
            </div>
            <pre className="text-sm text-green-400 font-mono leading-relaxed">
{`// Initialize Nexus API
const nexuz = new NexuzAPI('your-api-key');

// Submit player score
nexuz.submitScore({
  gameId: 'your-game-id',
  playerId: 'player-123',
  score: 15420,
  metadata: { level: 5 }
});

// Create tournament
nexuz.createTournament({
  name: 'Weekly Championship',
  entryFee: 10, // USDC
  duration: '7d',
  maxPlayers: 100
});

// Get leaderboard
const rankings = await nexus.getLeaderboard();`}
            </pre>
          </div>
        </div>

        {/* Benefits Section */}
        <div className="bg-gradient-to-r from-primary/10 via-purple-500/10 to-accent/10 rounded-3xl p-8 md:p-12 border border-primary/20">
          <div className="text-center mb-12">
            <h3 className="font-gaming text-3xl font-bold text-primary mb-4">Why Choose Nexuz APIs?</h3>
            <p className="text-lg text-foreground/90 max-w-2xl mx-auto">
              Focus on building great games while we handle the competition infrastructure
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: CheckCircle,
                title: "No Infrastructure Costs",
                description: "Skip the expensive backend development and maintenance"
              },
              {
                icon: Target,
                title: "Instant Player Engagement",
                description: "Add competitive elements that keep players coming back"
              },
              {
                icon: Crown,
                title: "Crypto Rewards Ready",
                description: "Built-in USDC/USDT reward system with automatic payouts"
              },
              {
                icon: Zap,
                title: "Scale Automatically",
                description: "Handle millions of players without worrying about scaling"
              },
              {
                icon: Users,
                title: "Global Player Base",
                description: "Tap into our existing community of competitive gamers"
              },
              {
                icon: Code,
                title: "Developer Friendly",
                description: "Comprehensive documentation and SDKs for all platforms"
              }
            ].map((benefit, index) => (
              <div key={index} className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <benefit.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-gaming font-bold text-primary mb-2">{benefit.title}</h4>
                  <p className="text-sm text-foreground/80">{benefit.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center mt-16">
          <div className="bg-black/40 backdrop-blur-lg border border-primary/30 rounded-2xl p-8 max-w-2xl mx-auto">
            <h3 className="font-gaming text-2xl font-bold text-primary mb-4">Ready to Level Up Your Game?</h3>
            <p className="text-foreground/90 mb-6">
              Join thousands of developers who have already integrated competitive gaming into their apps
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg"
                className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/80 hover:to-purple-500 text-white font-gaming"
              >
                Start Integration <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button 
                size="lg"
                variant="outline"
                className="border-accent text-accent hover:bg-accent/20 font-gaming"
              >
                Contact Sales
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PlatformAsService;