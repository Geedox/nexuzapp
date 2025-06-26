/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Send, Users, Settings, MoreVertical, Smile } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCommunityChatContext } from '@/contexts/CommunityChatContext';
import { useAuth } from '@/contexts/AuthContext';
import { RoomManagementModal } from './RoomManagementModal';
import { formatDistanceToNow, format, isToday, isYesterday } from 'date-fns';

interface ChatInterfaceProps {
  roomName: string;
  onBack: () => void;
  type: 'room' | 'individual';
  memberCount?: number;
}

const ChatInterface = ({ roomName, onBack, type, memberCount }: ChatInterfaceProps) => {
  const [message, setMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showRoomManagement, setShowRoomManagement] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const { user } = useAuth();
  const { 
    messages, 
    loadingMessages, 
    sendMessage, 
    currentRoom,
    onlineUsers 
  } = useCommunityChatContext();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    const messageText = message.trim();
    setMessage('');

    try {
      if (type === 'room' && currentRoom) {
        await sendMessage(messageText, currentRoom.id);
      } else {
        // For individual chat, we'd need the receiver ID
        // This would be passed from the parent component
        console.log('Individual chat not implemented yet');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Re-add message to input if sending failed
      setMessage(messageText);
    }
  };

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    if (isToday(date)) {
      return format(date, 'HH:mm');
    } else if (isYesterday(date)) {
      return `Yesterday ${format(date, 'HH:mm')}`;
    } else {
      return format(date, 'MMM d, HH:mm');
    }
  };

  const groupMessagesByDate = (messages: any[]) => {
    const groups: { [key: string]: any[] } = {};
    
    messages.forEach(msg => {
      const date = new Date(msg.created_at);
      let dateKey;
      
      if (isToday(date)) {
        dateKey = 'Today';
      } else if (isYesterday(date)) {
        dateKey = 'Yesterday';
      } else {
        dateKey = format(date, 'MMMM d, yyyy');
      }
      
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(msg);
    });
    
    return groups;
  };

  const emojis = ['😀', '😂', '😍', '🤔', '👍', '👎', '❤️', '🔥', '💯', '🎮', '🚀', '💎'];

  const groupedMessages = groupMessagesByDate(messages);

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-background to-secondary/20">
      {/* Header - Fixed */}
      <div className="flex-shrink-0 flex items-center justify-between p-4 bg-black/40 backdrop-blur-lg border-b border-primary/30">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="text-muted-foreground hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          
          <div className="flex items-center space-x-3">
            {type === 'room' && currentRoom && (
              <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${currentRoom.avatar_color} flex items-center justify-center text-lg`}>
                {currentRoom.avatar_emoji}
              </div>
            )}
            
            <div>
              <h2 className="font-cyber font-bold text-primary">{roomName}</h2>
              <p className="text-xs text-muted-foreground">
                {type === 'room' 
                  ? `${memberCount || 0} members • ${onlineUsers.size} online`
                  : 'Direct message'
                }
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {type === 'room' && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-muted-foreground hover:text-primary"
              onClick={() => setShowRoomManagement(true)}
              title="Manage Room"
            >
              <Users className="h-4 w-4" />
            </Button>
          )}
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-muted-foreground hover:text-primary"
            title="Room Settings"
          >
            <Settings className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-muted-foreground hover:text-primary"
            title="More Options"
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages - Scrollable */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        {loadingMessages ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2 font-cyber text-muted-foreground">Loading messages...</span>
          </div>
        ) : Object.keys(groupedMessages).length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="text-6xl mb-4">💬</div>
            <h3 className="font-cyber text-xl text-primary mb-2">Start the conversation!</h3>
            <p className="text-muted-foreground text-center max-w-md">
              {type === 'room' 
                ? 'Be the first to send a message in this room. Say hello to the community!'
                : 'Start chatting with your friend. Send a message to begin the conversation.'
              }
            </p>
          </div>
        ) : (
          Object.entries(groupedMessages).map(([date, dateMessages]) => (
            <div key={date}>
              {/* Date separator */}
              <div className="flex items-center justify-center my-6">
                <div className="bg-black/40 px-3 py-1 rounded-full border border-primary/20">
                  <span className="text-xs font-cyber text-muted-foreground">{date}</span>
                </div>
              </div>

              {/* Messages for this date */}
              <div className="space-y-4">
                {dateMessages.map((msg, index) => {
                  const isOwnMessage = msg.sender.id === user?.id;
                  const showAvatar = index === 0 || dateMessages[index - 1].sender.id !== msg.sender.id;
                  
                  return (
                    <div key={msg.id} className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                      <div className={`flex max-w-[70%] ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}>
                        {/* Avatar */}
                        {showAvatar && !isOwnMessage && (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-sm font-bold mr-2 flex-shrink-0">
                            {msg.sender.avatar_url ? (
                              <img 
                                src={msg.sender.avatar_url} 
                                alt={msg.sender.username}
                                className="w-full h-full object-cover rounded-full"
                              />
                            ) : (
                              msg.sender.username.charAt(0).toUpperCase()
                            )}
                          </div>
                        )}
                        
                        {!showAvatar && !isOwnMessage && (
                          <div className="w-8 mr-2 flex-shrink-0"></div>
                        )}

                        {/* Message content */}
                        <div className={`${isOwnMessage ? 'ml-2' : ''}`}>
                          {/* Sender name and time */}
                          {showAvatar && (
                            <div className={`flex items-center mb-1 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                              <span className="text-xs font-cyber text-primary mr-2">
                                {isOwnMessage ? 'You' : (msg.sender.display_name || msg.sender.username)}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {formatMessageTime(msg.created_at)}
                              </span>
                            </div>
                          )}

                          {/* Message bubble */}
                          <div className={`rounded-2xl px-4 py-2 break-words ${
                            isOwnMessage 
                              ? 'bg-gradient-to-r from-primary to-accent text-background' 
                              : 'bg-black/40 border border-primary/20 text-foreground'
                          }`}>
                            <p className="font-cyber text-sm leading-relaxed whitespace-pre-wrap">
                              {msg.content}
                            </p>
                          </div>

                          {/* Message time for grouped messages */}
                          {!showAvatar && (
                            <div className={`text-xs text-muted-foreground mt-1 ${isOwnMessage ? 'text-right' : 'text-left'}`}>
                              {formatMessageTime(msg.created_at)}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input - Fixed at bottom */}
      <div className="flex-shrink-0 p-4 bg-black/40 backdrop-blur-lg border-t border-primary/30">
        <form onSubmit={handleSendMessage} className="flex items-end space-x-2">
          {/* Emoji picker button */}
          <div className="relative">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="text-muted-foreground hover:text-primary"
            >
              <Smile className="h-4 w-4" />
            </Button>

            {/* Emoji picker popup */}
            {showEmojiPicker && (
              <div className="absolute bottom-full left-0 mb-2 p-3 bg-black/90 backdrop-blur-lg border border-primary/30 rounded-lg z-50">
                <div className="grid grid-cols-6 gap-2">
                  {emojis.map((emoji, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => {
                        setMessage(prev => prev + emoji);
                        setShowEmojiPicker(false);
                        inputRef.current?.focus();
                      }}
                      className="p-2 hover:bg-primary/20 rounded transition-colors"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Message input */}
          <div className="flex-1">
            <Input
              ref={inputRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(e);
                }
              }}
              placeholder={`Message ${type === 'room' ? roomName : 'your friend'}...`}
              className="font-cyber bg-black/40 border-primary/30 focus:border-primary resize-none"
              maxLength={1000}
            />
          </div>

          {/* Send button */}
          <Button
            type="submit"
            disabled={!message.trim()}
            className="bg-gradient-to-r from-primary to-accent text-background font-cyber px-4"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>

        {/* Character count and help text */}
        <div className="flex justify-between items-center mt-2">
          <div className="text-xs text-muted-foreground">
            {message.length > 950 && (
              <span className={message.length > 1000 ? 'text-red-400' : 'text-yellow-400'}>
                {message.length}/1000
              </span>
            )}
          </div>
          
          <div className="text-xs text-muted-foreground">
            Press Enter to send • Shift+Enter for new line
          </div>
        </div>
      </div>

      {/* Room Management Modal */}
      {type === 'room' && currentRoom && (
        <RoomManagementModal
          open={showRoomManagement}
          onClose={() => setShowRoomManagement(false)}
          room={currentRoom}
        />
      )}
    </div>
  );
};

export default ChatInterface;