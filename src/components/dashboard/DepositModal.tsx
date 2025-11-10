import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface DepositModalProps {
  open: boolean;
  onClose: () => void;
  mode?: 'deposit' | 'support';
}

export const DepositModal = ({ open, onClose, mode = 'deposit' }: DepositModalProps) => {
  const whatsappNumber = '+2348139289312';
  const discordLink = 'https://discord.gg/U7RmVJPGwq';

  // Content based on mode
  const content = {
    deposit: {
      title: '💰 Buy SUI Tokens',
      description: 'Contact our support team to purchase SUI tokens with multiple payment options',
      whatsappMessage: 'Hi! I want to buy SUI tokens. Can you help me with the process?',
      whatsappTitle: 'WhatsApp Support',
      whatsappDesc: 'Chat directly with our team • Fast response • Secure payment',
      discordTitle: 'Discord Community',
      discordDesc: 'Join our server • Community support • Trading discussions',
      benefitsTitle: 'Why Choose Us?',
      benefitsIcon: '💎',
      benefits: [
        'Instant delivery',
        'Secure transactions',
        '24/7 support',
        'Multiple payment methods'
      ],
      quickStartTitle: '🚀 Quick Start:',
      quickStartSteps: [
        '1. Click WhatsApp or Discord above',
        '2. Tell us how much SUI you want to buy',
        '3. Choose your payment method (Bank transfer, Card, etc.)',
        '4. Receive SUI tokens directly in your wallet'
      ]
    },
    support: {
      title: '💬 Live Support',
      description: 'Get instant help from our support team via WhatsApp or Discord',
      whatsappMessage: 'Hi! I need help with the platform. Can you assist me?',
      whatsappTitle: 'WhatsApp Live Chat',
      whatsappDesc: 'Get instant help • Quick responses • Real-time support',
      discordTitle: 'Discord Live Support',
      discordDesc: 'Join our server • Community help • Expert guidance',
      benefitsTitle: 'Support Features',
      benefitsIcon: '🛟',
      benefits: [
        '24/7 availability',
        'Expert assistance',
        'Quick response time',
        'Step-by-step guidance'
      ],
      quickStartTitle: '🆘 Get Help:',
      quickStartSteps: [
        '1. Click WhatsApp or Discord above',
        '2. Describe your issue or question',
        '3. Our team will assist you immediately',
        '4. Get step-by-step guidance and solutions'
      ]
    }
  };

  const currentContent = content[mode];

  const handleWhatsAppClick = () => {
    const message = encodeURIComponent(currentContent.whatsappMessage);
    window.open(`https://wa.me/${whatsappNumber.replace('+', '')}?text=${message}`, '_blank');
  };

  const handleDiscordClick = () => {
    window.open(discordLink, '_blank');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] bg-gradient-to-br from-background via-card to-secondary/20 border-primary/30">
        <DialogHeader>
          <DialogTitle className="font-gaming text-2xl text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
            {currentContent.title}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground font-cyber">
            {currentContent.description}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-6 space-y-4">
          {/* Contact Options */}
          <div className="grid grid-cols-1 gap-4">
            {/* WhatsApp Button */}
            <button
              onClick={handleWhatsAppClick}
              className="flex items-center gap-4 p-6 bg-gradient-to-r from-green-500/20 to-green-600/20 border border-green-500/30 rounded-xl hover:border-green-500/60 hover:scale-[1.02] transition-all duration-300 group"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center text-2xl">
                📱
              </div>
              <div className="flex-1 text-left">
                <p className="font-cyber text-xl text-green-400 mb-1">
                  {currentContent.whatsappTitle}
                </p>
                <p className="text-sm text-muted-foreground">
                  {currentContent.whatsappDesc}
                </p>
                <p className="text-xs text-green-300 font-mono mt-1">
                  {whatsappNumber}
                </p>
              </div>
              <div className="text-green-400 group-hover:translate-x-1 transition-transform">
                →
              </div>
            </button>

            {/* Discord Button */}
            <button
              onClick={handleDiscordClick}
              className="flex items-center gap-4 p-6 bg-gradient-to-r from-indigo-500/20 to-purple-600/20 border border-indigo-500/30 rounded-xl hover:border-indigo-500/60 hover:scale-[1.02] transition-all duration-300 group"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-2xl">
                🎮
              </div>
              <div className="flex-1 text-left">
                <p className="font-cyber text-xl text-indigo-400 mb-1">
                  {currentContent.discordTitle}
                </p>
                <p className="text-sm text-muted-foreground">
                  {currentContent.discordDesc}
                </p>
                <p className="text-xs text-indigo-300 font-mono mt-1">
                  discord.gg/U7RmVJPGwq
                </p>
              </div>
              <div className="text-indigo-400 group-hover:translate-x-1 transition-transform">
                →
              </div>
            </button>
          </div>

          {/* Benefits Section */}
          <div className="mt-6 p-4 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-lg">
            <div className="flex items-center gap-3 mb-3">
              <div className="text-2xl">{currentContent.benefitsIcon}</div>
              <h4 className="font-cyber text-lg text-blue-400">{currentContent.benefitsTitle}</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-muted-foreground font-cyber">
              {currentContent.benefits.map((benefit, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="text-green-400">✓</span>
                  <span>{benefit}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Start Guide */}
          <div className="p-4 bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 rounded-lg">
            <h5 className="font-cyber text-sm font-bold text-primary mb-2">
              {currentContent.quickStartTitle}
            </h5>
            <ol className="text-xs text-muted-foreground space-y-1 font-cyber">
              {currentContent.quickStartSteps.map((step, index) => (
                <li key={index}>{step}</li>
              ))}
            </ol>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};