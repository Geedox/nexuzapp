
export default function SupportPage() {
    return (
        <div className="space-y-8 animate-fade-in">
            <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/30 rounded-2xl p-6">
                <h1 className="font-cyber text-3xl font-bold text-blue-400 mb-2 glow-text">
                    🎧 Support Center
                </h1>
                <p className="text-muted-foreground">Get help with your gaming experience</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-black/40 backdrop-blur-lg border border-primary/30 rounded-xl p-6">
                    <h3 className="font-cyber text-xl font-bold text-primary mb-4">📚 Help Articles</h3>
                    <p className="text-muted-foreground">Browse our comprehensive help documentation</p>
                </div>
                <div className="bg-black/40 backdrop-blur-lg border border-primary/30 rounded-xl p-6">
                    <h3 className="font-cyber text-xl font-bold text-primary mb-4">💬 Live Chat</h3>
                    <p className="text-muted-foreground">Chat with our support team in real-time</p>
                </div>
            </div>
        </div>
    );
}
