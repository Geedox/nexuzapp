import EndlessRunnerGame from '@/games/endless-runner/EndlessRunner';
import FlappyBirdGame from '@/games/flappy-bird/FlappyBird';
import React, { useEffect, useRef, useCallback } from 'react';

const GamePlayer = ({ room, roomId, onClose, onMessage }) => {
  const onMessageRef = useRef(onMessage);
  
  // Update the ref when onMessage changes
  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  // Handle score updates from the game
  const handleScoreUpdate = useCallback((score) => {
    // You can add real-time score updates here if needed
    console.log('Score updated:', score);
  }, []);

  // Handle game over and send score to parent
  const handleGameOver = useCallback((finalScore) => {
    // Simulate the message that would come from iframe
    const mockEvent = {
      data: {
        type: 'GAME_OVER',
        score: finalScore,
        gameId: room.game.id
      },
      source: {
        postMessage: (message) => {
          console.log('Game over message:', message);
        }
      }
    };
    
    onMessageRef.current(mockEvent);
  }, [room.game.id]);

  // Handle score submission
  const handleScoreSubmit = useCallback((finalScore, metadata) => {
    // Simulate the SUBMIT_SCORE message
    const mockEvent = {
      data: {
        type: 'SUBMIT_SCORE',
        score: finalScore,
        metadata
      },
      source: {
        postMessage: (message) => {
          console.log('Score submission response:', message);
          // You can handle the response here if needed
        }
      }
    };
    
    onMessageRef.current(mockEvent);
  }, []);

  // Send game ready message when component mounts
  useEffect(() => {
    const mockEvent = {
      data: {
        type: 'GAME_READY'
      },
      source: {
        postMessage: (message) => {
          console.log('Game ready response:', message);
        }
      }
    };
    
    onMessageRef.current(mockEvent);
  }, []);

  // Determine which game to render
  const renderGame = () => {
    const gameId = room.game.id;
    
    // Flappy Bird game
    if (gameId === '22222222-2222-2222-2222-222222222222') {
      return (
        <FlappyBirdGame
          onScoreUpdate={handleScoreUpdate}
          onGameOver={handleGameOver}
          onClose={onClose}
          onScoreSubmit={handleScoreSubmit}
          playerCurrentScore={0} // You can pass the current score from room data
        />
      );
    }
    
    // Endless Runner game
    if (gameId === '11111111-1111-1111-1111-111111111111') {
      return (
        <EndlessRunnerGame
          onScoreUpdate={handleScoreUpdate}
          onGameOver={handleGameOver}
          onClose={onClose}
          onScoreSubmit={handleScoreSubmit}
          playerCurrentScore={0} // You can pass the current score from room data
        />
      );
    }
    
    // Fallback to iframe for other games
    return (
      <div className="relative w-full h-[600px] bg-black">
        <iframe
          key={`game-iframe-${gameId}-${roomId}`}
          src={gameId === '11111111-1111-1111-1111-111111111111' 
            ? '/games/endless-runner/index.html' 
            : '/games/flappy-bird/index.html'}
          className="w-full h-full border-0"
          title={room.game.name}
          sandbox="allow-scripts allow-same-origin"
        />
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
      <div className="bg-background border border-primary/30 rounded-xl w-full max-w-5xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-primary/20">
          <div className="flex items-center gap-4">
            <h3 className="font-cyber text-xl text-primary">{room.game.name}</h3>
            <span className="text-sm text-muted-foreground">Room: {roomId.slice(0, 8)}...</span>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-primary transition-colors text-2xl font-bold"
          >
            ✕
          </button>
        </div>
        {renderGame()}
      </div>
    </div>
  );
};

export default React.memo(GamePlayer, (prevProps, nextProps) => {
  // Custom comparison to prevent unnecessary re-renders
  return (
    prevProps.room?.game?.id === nextProps.room?.game?.id &&
    prevProps.roomId === nextProps.roomId &&
    prevProps.onClose === nextProps.onClose
    // Don't compare onMessage as it may change but shouldn't trigger re-render
  );
});