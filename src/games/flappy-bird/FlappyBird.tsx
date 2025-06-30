import React, { useEffect, useRef, useState, useCallback } from 'react';

const FlappyBirdGame = ({ onScoreUpdate, onGameOver, onClose, onScoreSubmit, playerCurrentScore = 0 }) => {
  const canvasRef = useRef(null);
  const gameStateRef = useRef({
    gameRunning: false,
    gameStarted: false,
    score: 0,
    highScore: parseInt(localStorage.getItem('flappyBirdHighScore')) || 0,
    frame: 0,
    bird: {
      x: 150,
      y: 300,
      width: 40,
      height: 30,
      velY: 0,
      gravity: 0.5,
      jumpPower: -8,
      color: '#00ff00',
      angle: 0,
      trail: []
    },
    pipes: [],
    gems: [],
    particles: [],
    clouds: []
  });

  const [showStartScreen, setShowStartScreen] = useState(true);
  const [showGameOver, setShowGameOver] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const [isNewHighScore, setIsNewHighScore] = useState(false);
  const [medal, setMedal] = useState(null);

  const animationFrameRef = useRef();

  // Game constants
  const PIPE_WIDTH = 80;
  const PIPE_GAP = 200;
  const PIPE_SPEED = 3;

  // Initialize clouds
  const initializeClouds = useCallback(() => {
    const clouds = [];
    for (let i = 0; i < 8; i++) {
      clouds.push({
        x: Math.random() * 800,
        y: Math.random() * 200 + 50,
        size: Math.random() * 30 + 20,
        speed: Math.random() * 0.5 + 0.2,
        opacity: Math.random() * 0.3 + 0.1
      });
    }
    return clouds;
  }, []);

  // Flap function
  const flap = useCallback(() => {
    const gameState = gameStateRef.current;
    if (!gameState.gameRunning) return;
    
    gameState.bird.velY = gameState.bird.jumpPower;
    gameState.bird.angle = -0.3;
    createFlapParticles();
  }, []);

  // Create particles
  const createFlapParticles = () => {
    const gameState = gameStateRef.current;
    for (let i = 0; i < 8; i++) {
      gameState.particles.push({
        x: gameState.bird.x,
        y: gameState.bird.y + gameState.bird.height / 2,
        vx: Math.random() * -3 - 1,
        vy: (Math.random() - 0.5) * 4,
        size: Math.random() * 4 + 2,
        color: 'rgba(74, 74, 138, 0.8)',
        life: 15,
        maxLife: 15,
        gravity: 0.1
      });
    }
  };

  const createScoreParticles = () => {
    const gameState = gameStateRef.current;
    for (let i = 0; i < 12; i++) {
      gameState.particles.push({
        x: gameState.bird.x + gameState.bird.width,
        y: gameState.bird.y + gameState.bird.height / 2,
        vx: Math.random() * 4 + 2,
        vy: (Math.random() - 0.5) * 6,
        size: Math.random() * 3 + 2,
        color: '#00ff00',
        life: 20,
        maxLife: 20,
        gravity: 0.05
      });
    }
  };

  const createGemParticles = (x, y) => {
    const gameState = gameStateRef.current;
    for (let i = 0; i < 15; i++) {
      gameState.particles.push({
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8,
        size: Math.random() * 3 + 1,
        color: '#ffff00',
        life: 25,
        maxLife: 25,
        gravity: 0.1
      });
    }
  };

  // Create pipe
  const createPipe = () => {
    const gameState = gameStateRef.current;
    const minHeight = 100;
    const maxHeight = 600 - PIPE_GAP - minHeight - 50;
    const topHeight = Math.random() * (maxHeight - minHeight) + minHeight;
    
    gameState.pipes.push({
      x: 800,
      topHeight: topHeight,
      bottomY: topHeight + PIPE_GAP,
      passed: false
    });
  };

  // Create gem
  const createGem = () => {
    const gameState = gameStateRef.current;
    const y = Math.random() * (600 - 200) + 100;
    gameState.gems.push({
      x: 800,
      y: y,
      size: 20,
      rotation: 0,
      offset: Math.random() * Math.PI * 2,
      collected: false
    });
  };

  // Collision detection
  const checkPipeCollision = (bird, pipe) => {
    if (bird.x + bird.width > pipe.x && bird.x < pipe.x + PIPE_WIDTH) {
      if (bird.y < pipe.topHeight || bird.y + bird.height > pipe.bottomY) {
        return true;
      }
    }
    return false;
  };

  const checkGemCollision = (bird, gem) => {
    const centerX = gem.x + gem.size / 2;
    const centerY = gem.y + gem.size / 2;
    const birdCenterX = bird.x + bird.width / 2;
    const birdCenterY = bird.y + bird.height / 2;
    const distance = Math.sqrt(Math.pow(centerX - birdCenterX, 2) + Math.pow(centerY - birdCenterY, 2));
    return distance < gem.size / 2 + 15;
  };

  // Get medal
  const getMedal = (score) => {
    if (score >= 50) return { name: 'Platinum Master', class: 'platinum' };
    if (score >= 30) return { name: 'Gold Flyer', class: 'gold' };
    if (score >= 15) return { name: 'Silver Soarer', class: 'silver' };
    if (score >= 5) return { name: 'Bronze Beginner', class: 'bronze' };
    return null;
  };

  // End game
  const endGame = useCallback(() => {
    const gameState = gameStateRef.current;
    gameState.gameRunning = false;
    
    const score = gameState.score;
    let newHighScore = false;
    
    if (score > gameState.highScore) {
      gameState.highScore = score;
      localStorage.setItem('flappyBirdHighScore', gameState.highScore.toString());
      newHighScore = true;
    }
    
    const gameMedal = getMedal(score);
    
    setFinalScore(score);
    setIsNewHighScore(newHighScore);
    setMedal(gameMedal);
    setShowGameOver(true);
    
    onGameOver?.(score);
  }, [onGameOver]);

  // Update function
  const update = () => {
    const gameState = gameStateRef.current;
    if (!gameState.gameRunning) return;

    const { bird, pipes, gems, particles, clouds } = gameState;

    // Bird physics
    bird.velY += bird.gravity;
    bird.y += bird.velY;
    
    // Bird angle
    if (bird.velY < 0) {
      bird.angle = Math.max(-0.5, bird.angle - 0.05);
    } else {
      bird.angle = Math.min(1.2, bird.angle + 0.03);
    }
    
    // Bird trail
    bird.trail.push({ x: bird.x + bird.width / 2, y: bird.y + bird.height / 2 });
    if (bird.trail.length > 8) {
      bird.trail.shift();
    }
    
    // Check ground and ceiling collision
    if (bird.y + bird.height >= 600 - 50 || bird.y <= 0) {
      endGame();
      return;
    }
    
    // Create pipes and gems
    if (gameState.frame % 120 === 0) {
      createPipe();
    }
    
    if (gameState.frame % 180 === 0 && Math.random() > 0.6) {
      createGem();
    }
    
    // Update pipes
    for (let i = pipes.length - 1; i >= 0; i--) {
      pipes[i].x -= PIPE_SPEED;
      
      if (checkPipeCollision(bird, pipes[i])) {
        endGame();
        return;
      }
      
      if (!pipes[i].passed && bird.x > pipes[i].x + PIPE_WIDTH) {
        pipes[i].passed = true;
        gameState.score++;
        onScoreUpdate?.(gameState.score);
        createScoreParticles();
      }
      
      if (pipes[i].x + PIPE_WIDTH < 0) {
        pipes.splice(i, 1);
      }
    }
    
    // Update gems
    for (let i = gems.length - 1; i >= 0; i--) {
      gems[i].x -= PIPE_SPEED;
      gems[i].rotation += 0.1;
      gems[i].y += Math.sin(gameState.frame * 0.05 + gems[i].offset) * 0.5;
      
      if (!gems[i].collected && checkGemCollision(bird, gems[i])) {
        gems[i].collected = true;
        gameState.score += 3;
        onScoreUpdate?.(gameState.score);
        createGemParticles(gems[i].x, gems[i].y);
      }
      
      if (gems[i].collected || gems[i].x + gems[i].size < 0) {
        gems.splice(i, 1);
      }
    }
    
    // Update particles
    for (let i = particles.length - 1; i >= 0; i--) {
      particles[i].x += particles[i].vx;
      particles[i].y += particles[i].vy;
      particles[i].vy += particles[i].gravity || 0.1;
      particles[i].life--;
      particles[i].size *= 0.98;
      
      if (particles[i].life <= 0 || particles[i].size < 0.5) {
        particles.splice(i, 1);
      }
    }
    
    // Update clouds
    clouds.forEach(cloud => {
      cloud.x -= cloud.speed;
      if (cloud.x + cloud.size < 0) {
        cloud.x = 800 + cloud.size;
        cloud.y = Math.random() * 200 + 50;
      }
    });
    
    gameState.frame++;
  };

  // Draw function
  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const gameState = gameStateRef.current;
    
    ctx.imageSmoothingEnabled = false;
    
    // Clear canvas with gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, 600);
    gradient.addColorStop(0, '#4a4a8a');
    gradient.addColorStop(0.3, '#2a2a4e');
    gradient.addColorStop(1, '#1a1a2e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 800, 600);
    
    // Draw clouds
    gameState.clouds.forEach(cloud => {
      ctx.fillStyle = `rgba(255, 255, 255, ${cloud.opacity})`;
      ctx.beginPath();
      ctx.arc(cloud.x, cloud.y, cloud.size, 0, Math.PI * 2);
      ctx.arc(cloud.x + cloud.size * 0.7, cloud.y, cloud.size * 0.8, 0, Math.PI * 2);
      ctx.arc(cloud.x + cloud.size * 1.3, cloud.y, cloud.size * 0.6, 0, Math.PI * 2);
      ctx.fill();
    });
    
    // Draw ground
    const groundGradient = ctx.createLinearGradient(0, 550, 0, 600);
    groundGradient.addColorStop(0, '#4a4a8a');
    groundGradient.addColorStop(1, '#2a2a4a');
    ctx.fillStyle = groundGradient;
    ctx.fillRect(0, 550, 800, 50);
    
    // Draw pipes
    gameState.pipes.forEach(pipe => {
      // Top pipe
      const topGradient = ctx.createLinearGradient(pipe.x, 0, pipe.x + PIPE_WIDTH, 0);
      topGradient.addColorStop(0, '#ff0066');
      topGradient.addColorStop(0.5, '#ff3388');
      topGradient.addColorStop(1, '#cc0044');
      ctx.fillStyle = topGradient;
      ctx.fillRect(pipe.x, 0, PIPE_WIDTH, pipe.topHeight);
      ctx.fillRect(pipe.x - 10, pipe.topHeight - 30, PIPE_WIDTH + 20, 30);
      
      // Bottom pipe
      ctx.fillRect(pipe.x, pipe.bottomY, PIPE_WIDTH, 600 - pipe.bottomY - 50);
      ctx.fillRect(pipe.x - 10, pipe.bottomY, PIPE_WIDTH + 20, 30);
    });
    
    // Draw bird trail
    ctx.strokeStyle = 'rgba(0, 255, 0, 0.4)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    gameState.bird.trail.forEach((point, index) => {
      const alpha = index / gameState.bird.trail.length;
      ctx.globalAlpha = alpha * 0.4;
      if (index === 0) {
        ctx.moveTo(point.x, point.y);
      } else {
        ctx.lineTo(point.x, point.y);
      }
    });
    ctx.stroke();
    ctx.globalAlpha = 1;
    
    // Draw bird
    const bird = gameState.bird;
    ctx.save();
    ctx.translate(bird.x + bird.width / 2, bird.y + bird.height / 2);
    ctx.rotate(bird.angle);
    
    ctx.fillStyle = bird.color;
    ctx.shadowBlur = 15;
    ctx.shadowColor = bird.color;
    ctx.fillRect(-bird.width / 2, -bird.height / 2, bird.width, bird.height);
    ctx.shadowBlur = 0;
    
    // Bird beak
    ctx.fillStyle = '#ffaa00';
    ctx.beginPath();
    ctx.moveTo(bird.width / 2, -5);
    ctx.lineTo(bird.width / 2 + 15, 0);
    ctx.lineTo(bird.width / 2, 5);
    ctx.closePath();
    ctx.fill();
    
    // Bird eye
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(5, -8, 6, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(7, -8, 3, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
    
    // Draw gems
    gameState.gems.forEach(gem => {
      if (!gem.collected) {
        ctx.save();
        ctx.translate(gem.x + gem.size / 2, gem.y + gem.size / 2);
        ctx.rotate(gem.rotation);
        
        ctx.fillStyle = '#ffff00';
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#ffff00';
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const angle = (i * Math.PI * 2) / 6;
          const x = Math.cos(angle) * gem.size / 2;
          const y = Math.sin(angle) * gem.size / 2;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;
        
        ctx.restore();
      }
    });
    
    // Draw particles
    gameState.particles.forEach(particle => {
      ctx.fillStyle = particle.color;
      ctx.globalAlpha = particle.life / particle.maxLife;
      ctx.fillRect(particle.x, particle.y, particle.size, particle.size);
      ctx.globalAlpha = 1;
    });
    
    // Draw score
    if (gameState.gameStarted) {
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 48px Courier New';
      ctx.textAlign = 'center';
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 4;
      ctx.strokeText(gameState.score.toString(), 400, 80);
      ctx.fillText(gameState.score.toString(), 400, 80);
      ctx.textAlign = 'left';
    }
  };

  // Game loop
  const gameLoop = () => {
    update();
    draw();
    
    if (gameStateRef.current.gameRunning) {
      animationFrameRef.current = requestAnimationFrame(gameLoop);
    }
  };

  // Start game
  const startGame = () => {
    const gameState = gameStateRef.current;
    
    setShowStartScreen(false);
    setShowGameOver(false);
    
    gameState.gameRunning = true;
    gameState.gameStarted = true;
    gameState.score = 0;
    gameState.pipes = [];
    gameState.gems = [];
    gameState.particles = [];
    gameState.bird.y = 300;
    gameState.bird.velY = 0;
    gameState.bird.angle = 0;
    gameState.bird.trail = [];
    gameState.frame = 0;
    gameState.clouds = initializeClouds();
    
    createPipe();
    gameLoop();
  };

  // Restart game
  const restartGame = () => {
    startGame();
  };

  // Submit score
  const submitScore = () => {
    const metadata = {
      duration: gameStateRef.current.frame / 60,
      highScore: gameStateRef.current.highScore,
      medal: medal
    };
    
    onScoreSubmit?.(finalScore, metadata);
  };

  // Input handling
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        flap();
      }
    };

    const handleClick = () => {
      flap();
    };

    document.addEventListener('keydown', handleKeyDown);
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.addEventListener('click', handleClick);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (canvas) {
        canvas.removeEventListener('click', handleClick);
      }
    };
  }, [flap]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Initialize clouds on mount
  useEffect(() => {
    gameStateRef.current.clouds = initializeClouds();
    gameStateRef.current.highScore = parseInt(localStorage.getItem('flappyBirdHighScore')) || 0;
  }, [initializeClouds]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white font-mono relative">
      <div className="bg-gray-800 border-4 border-purple-500 rounded-lg p-5 shadow-2xl">
        <div className="flex justify-between items-center mb-2 p-2 bg-purple-900/20 rounded">
          <div className="text-2xl text-green-400">Score: {gameStateRef.current.score}</div>
          <div className="text-lg text-yellow-400">High: {gameStateRef.current.highScore}</div>
        </div>
        
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          className="bg-gradient-to-b from-purple-800 via-purple-600 to-gray-800 border-2 border-purple-500 block"
          style={{ imageRendering: 'pixelated' }}
        />
        
        <div className="text-center mt-2 text-gray-400 text-sm">
          Press SPACE or Click/Tap to Flap | Avoid the Pipes!
        </div>
      </div>

      {/* Start Screen */}
      {showStartScreen && (
        <div className="absolute inset-0 bg-black/90 flex items-center justify-center">
          <div className="text-center bg-gray-800 p-10 rounded-lg border-2 border-purple-500">
            <h1 className="text-5xl text-green-400 mb-5 font-bold">FLAPPY BIRD</h1>
            <div className="text-lg text-gray-300 mb-5">
              <p>🐦 Press SPACE or Click to Flap</p>
              <p>🚫 Don't hit the pipes or ground</p>
              <p>💎 Collect gems for bonus points</p>
              <p>🏆 Earn medals for high scores</p>
            </div>
            <button
              onClick={startGame}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded text-lg transition-colors"
            >
              START GAME
            </button>
          </div>
        </div>
      )}

      {/* Game Over Screen */}
      {showGameOver && (
        <div className="absolute inset-0 bg-black/90 flex items-center justify-center">
          <div className="text-center bg-gray-800 p-8 rounded-lg border-2 border-red-500">
            <h2 className="text-4xl text-red-500 mb-5 font-bold">GAME OVER</h2>
            <div className="text-3xl text-green-400 mb-2">Score: {finalScore}</div>
            
            {medal && (
              <div className="mb-4">
                <div className={`inline-block w-8 h-8 rounded-full text-center leading-8 font-bold text-sm ${
                  medal.class === 'bronze' ? 'bg-orange-600' :
                  medal.class === 'silver' ? 'bg-gray-400 text-black' :
                  medal.class === 'gold' ? 'bg-yellow-400 text-black' :
                  'bg-gradient-to-r from-gray-300 to-gray-100 text-black'
                }`}>
                  {medal.class.charAt(0).toUpperCase()}
                </div>
                <p className="text-lg mt-2">{medal.name}</p>
              </div>
            )}
            
            {isNewHighScore && (
              <div className="text-xl text-yellow-400 mb-4 animate-pulse">NEW HIGH SCORE!</div>
            )}
            
            <div className="flex gap-4 justify-center">
              <button
                onClick={restartGame}
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded transition-colors"
              >
                PLAY AGAIN
              </button>
              <button
                onClick={submitScore}
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition-colors"
              >
                SUBMIT SCORE
              </button>
            </div>
            
            <button
              onClick={onClose}
              className="mt-4 text-gray-400 hover:text-white transition-colors"
            >
              Close Game
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FlappyBirdGame;