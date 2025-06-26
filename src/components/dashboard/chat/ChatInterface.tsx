
import { useState } from 'react';
import { ArrowLeft, Send, Phone, Video, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Message {
  id: number;
  user: string;
  message: string;
  time: string;
  avatar: string;
  isOwn?: boolean;
}

interface ChatInterfaceProps {
  roomName: string;
  onBack: () => void;
  type: 'room' | 'individual';
  memberCount?: number;
}

const ChatInterface = ({ roomName, onBack, type, memberCount }: ChatInterfaceProps) => {
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, user: "CryptoGamer_X", message: "Welcome to the room! 🎮", time: "10:30 AM", avatar: "🏆" },
    { id: 2, user: "You", message: "Hey everyone! Ready for some gaming?", time: "10:32 AM", avatar: "👤", isOwn: true },
    { id: 3, user: "BlockchainMaster", message: "Let's start a tournament!", time: "10:35 AM", avatar: "⚡" },
    { id: 4, user: "Web3Warrior", message: "I'm in! What game are we playing?", time: "10:36 AM", avatar: "🚀" },
    { id: 5, user: "You", message: "How about DeFi Racing?", time: "10:38 AM", avatar: "👤", isOwn: true },
  ]);

  const [newMessage, setNewMessage] = useState("");

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      const message: Message = {
        id: messages.length + 1,
        user: "You",
        message: newMessage,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        avatar: "👤",
        isOwn: true
      };
      setMessages([...messages, message]);
      setNewMessage("");
    }
  };

  return (
    <div className="flex flex-col h-full bg-black/40 backdrop-blur-lg border border-primary/30 rounded-2xl overflow-hidden">
      {/* Chat Header */}
      <div className="p-4 border-b border-primary/20 bg-gradient-to-r from-primary/10 to-accent/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="hover:bg-primary/20"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h3 className="font-cyber text-lg font-bold text-primary">{roomName}</h3>
              {type === 'room' && (
                <p className="text-sm text-muted-foreground font-cyber">{memberCount} members</p>
              )}
              {type === 'individual' && (
                <p className="text-sm text-green-400 font-cyber">Online</p>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {type === 'individual' && (
              <>
                <Button variant="ghost" size="icon" className="hover:bg-primary/20">
                  <Phone className="w-5 h-5" />
                </Button>
                <Button variant="ghost" size="icon" className="hover:bg-primary/20">
                  <Video className="w-5 h-5" />
                </Button>
              </>
            )}
            <Button variant="ghost" size="icon" className="hover:bg-primary/20">
              <MoreVertical className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.isOwn ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex items-start space-x-2 max-w-[70%] ${msg.isOwn ? 'flex-row-reverse space-x-reverse' : ''}`}>
              <div className="text-2xl">{msg.avatar}</div>
              <div className={`p-3 rounded-lg ${
                msg.isOwn 
                  ? 'bg-gradient-to-r from-primary to-accent text-background' 
                  : 'bg-secondary/40 text-foreground'
              }`}>
                {!msg.isOwn && (
                  <div className="font-cyber text-xs font-bold text-primary mb-1">{msg.user}</div>
                )}
                <p className="text-sm">{msg.message}</p>
                <div className={`text-xs mt-1 ${msg.isOwn ? 'text-background/70' : 'text-muted-foreground'}`}>
                  {msg.time}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-primary/20">
        <div className="flex space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Type a message..."
            className="flex-1 bg-secondary/20 border border-primary/30 rounded-lg px-4 py-2 text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary/50"
          />
          <Button
            onClick={handleSendMessage}
            className="bg-gradient-to-r from-primary to-accent text-background hover:scale-105 transition-all duration-300"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
