
import { useState } from 'react';

const FAQSection = () => {
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);

  const faqs = [
    {
      question: "How do I create my first game on Nexuz Arena?",
      answer: "Simply connect your wallet, navigate to the Creator Dashboard, and use our intuitive game builder. You can create highscore games or multiplayer competitions with just a few clicks. No coding required!"
    },
    {
      question: "What cryptocurrencies are supported for tournaments?",
      answer: "We support USDC and USDT across all major blockchains including Ethereum, Polygon, BSC, Arbitrum, Avalanche, and Solana. This ensures stable, reliable payouts regardless of market volatility."
    },
    {
      question: "How quickly do I receive my winnings?",
      answer: "Tournament winners receive payouts automatically within 30 seconds of tournament completion. Our smart contracts handle everything automatically - no manual processing required."
    },
    {
      question: "Can I create private tournaments for my community?",
      answer: "Absolutely! You can create both public and private tournament rooms. Set custom entry fees, rules, and invite specific players. Perfect for gaming communities, esports teams, or exclusive events."
    },
    {
      question: "How do game creators earn money?",
      answer: "Creators earn based on player engagement and game usage. The more players enjoy your game, the more you earn. We also offer revenue sharing from tournament fees and optional in-game purchases."
    },
    {
      question: "Is Nexuz Arena safe and secure?",
      answer: "Yes! Our smart contracts are audited by leading security firms like CertiK. All funds are held in decentralized escrow, and every transaction is transparent and verifiable on-chain."
    },
    {
      question: "What makes Nexuz Arena different from traditional gaming platforms?",
      answer: "We're fully decentralized, meaning no single entity controls your games or earnings. Players truly own their achievements, creators keep their IP, and all transactions are transparent and fair."
    },
    {
      question: "Do I need to be a developer to create games?",
      answer: "Not at all! Our visual game builder allows anyone to create engaging games without coding. We provide templates, drag-and-drop tools, and comprehensive tutorials to get you started."
    }
  ];

  return (
    <section className="py-20 bg-gradient-to-b from-background to-secondary/20 relative overflow-hidden">
      <div className="absolute inset-0 floating-particles"></div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="font-gaming text-5xl md:text-6xl font-bold mb-6 text-primary glow-text">
            FREQUENTLY ASKED QUESTIONS
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Everything you need to know about dominating the Nexuz Arena
          </p>
        </div>

        <div className="max-w-4xl mx-auto space-y-4">
          {faqs.map((faq, index) => (
            <div 
              key={index}
              className="bg-card border border-primary/20 rounded-xl overflow-hidden hover:border-primary/40 transition-all duration-300 animate-slide-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <button
                className="w-full px-8 py-6 text-left flex items-center justify-between hover:bg-primary/5 transition-colors"
                onClick={() => setOpenFAQ(openFAQ === index ? null : index)}
              >
                <h3 className="font-gaming text-lg font-bold text-primary pr-4">
                  {faq.question}
                </h3>
                <div className={`text-accent text-2xl transition-transform duration-300 ${openFAQ === index ? 'rotate-45' : ''}`}>
                  +
                </div>
              </button>
              
              <div className={`px-8 overflow-hidden transition-all duration-300 ${openFAQ === index ? 'max-h-96 pb-6' : 'max-h-0'}`}>
                <div className="border-t border-primary/10 pt-4">
                  <p className="text-muted-foreground leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <div className="bg-black/40 backdrop-blur-lg border border-accent/30 rounded-2xl p-8 max-w-2xl mx-auto hologram-effect">
            <h3 className="font-cyber text-xl font-bold text-accent mb-4">
              Still have questions?
            </h3>
            <p className="text-muted-foreground mb-6">
              Join our community Discord or contact our support team
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-primary hover:bg-primary/80 text-primary-foreground px-6 py-3 rounded-lg font-gaming transition-colors">
                💬 Join Discord
              </button>
              <button className="border border-accent text-accent hover:bg-accent/10 px-6 py-3 rounded-lg font-gaming transition-colors">
                📧 Contact Support
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
