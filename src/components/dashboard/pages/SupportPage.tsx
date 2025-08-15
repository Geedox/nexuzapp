import Banner from "@/components/Banner"

export default function SupportPage() {
    return (
        <div className="space-y-8 animate-fade-in">
            <Banner pathname="support"/>
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
