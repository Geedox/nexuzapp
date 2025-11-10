import { useState } from "react";
import Banner from "@/components/Banner";
import { DepositModal } from "../DepositModal";

export default function SupportPage() {
    const [showContactModal, setShowContactModal] = useState(false);

    return (
        <div className="space-y-8 animate-fade-in">
            <Banner pathname="support"/>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-black/40 backdrop-blur-lg border border-primary/30 rounded-xl p-6">
                    <h3 className="font-cyber text-xl font-bold text-primary mb-4">📚 Help Articles</h3>
                    <p className="text-muted-foreground">Browse our comprehensive help documentation</p>
                </div>
                
                <button
                    onClick={() => setShowContactModal(true)}
                    className="bg-black/40 backdrop-blur-lg border border-primary/30 rounded-xl p-6 hover:border-primary/60 hover:bg-black/60 transition-all duration-300 text-left group"
                >
                    <h3 className="font-cyber text-xl font-bold text-primary mb-4 group-hover:text-accent transition-colors">
                        💬 Live Chat
                    </h3>
                    <p className="text-muted-foreground group-hover:text-muted-foreground/80">
                        Chat with our support team in real-time via WhatsApp or Discord
                    </p>
                </button>
            </div>

            {/* Contact Modal */}
            <DepositModal
                open={showContactModal}
                onClose={() => setShowContactModal(false)}
                mode="support"
            />
        </div>
    );
}