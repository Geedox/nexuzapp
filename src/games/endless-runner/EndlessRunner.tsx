import React, { useEffect, useRef, useState, useCallback } from 'react';

const EndlessRunnerGame = ({ onScoreUpdate, onGameOver, onClose, onScoreSubmit, playerCurrentScore = 0 }) => {
  const canvasRef = useRef(null);
  const gameStateRef = useRef({
    gameRunning: false,
    score: 0,
    highScore: parseInt(localStorage.getItem('endlessRunnerHighScore')) || 0,
    playerHighScore: 0,
    gameSpeed: 5,
    baseSpeed: 5,
    speedMultiplier: 1,
    frame: 0,
    scoreSubmitted: false,
    player: {
      x: 100,
      y: 200,
      width: 40,
      height: 40,
      velY: 0,
      jumping: false,
      grounded: false,
      jumpPower: -15,
      gravity: 0.8,
      color: '#00ff00',
      trail: []
    },
    ground: {
      y: 350,
      height: 50
    },
    obstacles: [],
    gems: [],
    particles: [],
    bgElements: []
  });

  const [showStartScreen, setShowStartScreen] = useState(true);
  const [showGameOver, setShowGameOver] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const [isNewHighScore, setIsNewHighScore] = useState(false);
  const [submitStatus, setSubmitStatus] = useState('');
  const [submitButtonDisabled, setSubmitButtonDisabled] = useState(false);

  const animationFrameRef = useRef();
  const jumpPressedRef = useRef(false);

  // Obstacle types
  const obstacleTypes = [
    { width: 30, height: 50, color: '#ff0066' },
    { width: 40, height: 40, color: '#ff3366' },
    { width: 25, height: 60, color: '#ff0099' },
    { width: 50, height: 30, color: '#ff00cc' }
  ];

  // Initialize background elements
  const initializeBgElements = useCallback(() => {
    const elements = [];
    for (let i = 0; i < 20; i++) {
      elements.push({
        x: Math.random() * 800,
        y: Math.random() * (350 - 50),
        size: Math.random() * 3 + 1,
        speed: Math.random() * 0.5 + 0.1
      });
    }
    return elements;
  }, []);

  // Collision detection
  const checkCollision = (rect1, rect2) => {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
  };

  const checkGemCollision = (player, gem) => {
    const centerX = gem.x + gem.size / 2;
    const centerY = gem.y + gem.size / 2;
    const closestX = Math.max(player.x, Math.min(centerX, player.x + player.width));
    const closestY = Math.max(player.y, Math.min(centerY, player.y + player.height));
    const distance = Math.sqrt(Math.pow(centerX - closestX, 2) + Math.pow(centerY - closestY, 2));
    return distance < gem.size / 2;
  };

  // Particle effects
  const createJumpParticles = () => {
    const gameState = gameStateRef.current;
    for (let i = 0; i < 10; i++) {
      gameState.particles.push({
        x: gameState.player.x + gameState.player.width / 2,
        y: gameState.player.y + gameState.player.height,
        vx: (Math.random() - 0.5) * 5,
        vy: Math.random() * -3,
        size: Math.random() * 4 + 2,
        color: '#4a4a8a',
        life: 20
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
        life: 20
      });
    }
  };

  // End game
  const endGame = useCallback(() => {
    const gameState = gameStateRef.current;
    gameState.gameRunning = false;
    
    const score = gameState.score;
    let newHighScore = false;
    
    if (score > gameState.highScore) {
      gameState.highScore = score;
      localStorage.setItem('endlessRunnerHighScore', gameState.highScore.toString());
      newHighScore = true;
    }
    
    const isNewPlayerHighScore = score > gameState.playerHighScore;
    
    setFinalScore(score);
    setIsNewHighScore(isNewPlayerHighScore);
    setShowGameOver(true);
    setSubmitStatus('');
    setSubmitButtonDisabled(false);
    
    onGameOver?.(score);
  }, [onGameOver]);

  // Update function
  const update = () => {
    const gameState = gameStateRef.current;
    if (!gameState.gameRunning) return;

    const { player, ground, obstacles, gems, particles, bgElements } = gameState;

    // Update speed based on score
    gameState.speedMultiplier = 1 + (Math.floor(gameState.score / 100) * 0.15);
    gameState.gameSpeed = gameState.baseSpeed * gameState.speedMultiplier;

    // Player physics
    if (jumpPressedRef.current && player.grounded) {
      player.velY = player.jumpPower;
      player.jumping = true;
      player.grounded = false;
      createJumpParticles();
    }

    // Hold jump for higher jump
    if (jumpPressedRef.current && player.jumping && player.velY < 0 && player.velY > player.jumpPower * 0.5) {
      player.velY -= 0.3;
    }

    player.velY += player.gravity;
    player.y += player.velY;

    // Ground collision
    if (player.y + player.height >= ground.y) {
      player.y = ground.y - player.height;
      player.velY = 0;
      player.grounded = true;
      player.jumping = false;
    }

    // Update player trail
    player.trail.push({ x: player.x, y: player.y + player.height / 2 });
    if (player.trail.length > 10) {
      player.trail.shift();
    }

    // Spawn obstacles
    if (gameState.frame % Math.floor(90 / gameState.speedMultiplier) === 0) {
      const type = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];
      obstacles.push({
        x: 800,
        y: ground.y - type.height,
        width: type.width,
        height: type.height,
        color: type.color,
        passed: false
      });
    }

    // Spawn gems
    if (gameState.frame % Math.floor(150 / gameState.speedMultiplier) === 0 && Math.random() > 0.5) {
      gems.push({
        x: 800,
        y: ground.y - 100 - Math.random() * 150,
        size: 20,
        collected: false,
        value: 10 * Math.floor(gameState.speedMultiplier)
      });
    }

    // Update obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
      obstacles[i].x -= gameState.gameSpeed;

      if (checkCollision(player, obstacles[i])) {
        endGame();
        return;
      }

      if (!obstacles[i].passed && obstacles[i].x + obstacles[i].width < player.x) {
        obstacles[i].passed = true;
        gameState.score += 10;
        onScoreUpdate?.(gameState.score);

        // Near miss bonus
        if (player.y + player.height > obstacles[i].y - 10) {
          gameState.score += 5;
        }
      }

      if (obstacles[i].x + obstacles[i].width < 0) {
        obstacles.splice(i, 1);
      }
    }

    // Update gems
    for (let i = gems.length - 1; i >= 0; i--) {
      gems[i].x -= gameState.gameSpeed;
      gems[i].y += Math.sin(gameState.frame * 0.1) * 0.5;

      if (!gems[i].collected && checkGemCollision(player, gems[i])) {
        gems[i].collected = true;
        gameState.score += gems[i].value;
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
      particles[i].vy += 0.3;
      particles[i].life--;

      if (particles[i].life <= 0) {
        particles.splice(i, 1);
      }
    }

    // Update background elements
    bgElements.forEach(element => {
      element.x -= element.speed * gameState.gameSpeed;
      if (element.x < -10) {
        element.x = 800 + 10;
        element.y = Math.random() * (ground.y - 50);
      }
    });

    // Increment score based on distance
    if (gameState.frame % 10 === 0) {
      gameState.score += 1;
      onScoreUpdate?.(gameState.score);
    }

    gameState.frame++;
  };

  // Draw function
  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const gameState = gameStateRef.current;
    
    ctx.imageSmoothingEnabled = false;
    
    // Clear canvas
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, 800, 400);
    
    // Draw background elements
    ctx.fillStyle = 'rgba(74, 74, 138, 0.3)';
    gameState.bgElements.forEach(element => {
      ctx.beginPath();
      ctx.arc(element.x, element.y, element.size, 0, Math.PI * 2);
      ctx.fill();
    });
    
    // Draw ground
    const gradient = ctx.createLinearGradient(0, gameState.ground.y, 0, 400);
    gradient.addColorStop(0, '#4a4a8a');
    gradient.addColorStop(1, '#2a2a4a');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, gameState.ground.y, 800, gameState.ground.height);
    
    // Draw ground lines
    ctx.strokeStyle = '#6a6aba';
    ctx.lineWidth = 2;
    for (let i = 0; i < 800; i += 40) {
      const offset = (gameState.frame * gameState.gameSpeed) % 40;
      ctx.beginPath();
      ctx.moveTo(i - offset, gameState.ground.y);
      ctx.lineTo(i - offset + 20, gameState.ground.y);
      ctx.stroke();
    }
    
    // Draw player trail
    ctx.strokeStyle = 'rgba(0, 255, 0, 0.3)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    gameState.player.trail.forEach((point, index) => {
      if (index === 0) {
        ctx.moveTo(point.x, point.y);
      } else {
        ctx.lineTo(point.x, point.y);
      }
    });
    ctx.stroke();
    
    // Draw player
    const player = gameState.player;
    ctx.fillStyle = player.color;
    ctx.shadowBlur = 20;
    ctx.shadowColor = player.color;
    ctx.fillRect(player.x, player.y, player.width, player.height);
    ctx.shadowBlur = 0;
    
    // Player eyes
    ctx.fillStyle = '#fff';
    ctx.fillRect(player.x + player.width - 10, player.y + 10, 5, 5);
    ctx.fillRect(player.x + player.width - 10, player.y + 20, 5, 5);
    
    // Draw obstacles
    gameState.obstacles.forEach(obstacle => {
      const obstacleGradient = ctx.createLinearGradient(
        obstacle.x, obstacle.y,
        obstacle.x, obstacle.y + obstacle.height
      );
      obstacleGradient.addColorStop(0, obstacle.color);
      obstacleGradient.addColorStop(1, '#660033');
      ctx.fillStyle = obstacleGradient;
      ctx.shadowBlur = 10;
      ctx.shadowColor = obstacle.color;
      ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
      ctx.shadowBlur = 0;
    });
    
    // Draw gems
    gameState.gems.forEach(gem => {
      if (!gem.collected) {
        ctx.save();
        ctx.translate(gem.x + gem.size / 2, gem.y + gem.size / 2);
        ctx.rotate(gameState.frame * 0.05);
        
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
      ctx.globalAlpha = particle.life / 20;
      ctx.fillRect(particle.x, particle.y, particle.size, particle.size);
      ctx.globalAlpha = 1;
    });
    
    // Draw speed indicator
    if (gameState.speedMultiplier > 1) {
      ctx.fillStyle = '#ff00ff';
      ctx.font = 'bold 16px Courier New';
      ctx.fillText(`SPEED x${gameState.speedMultiplier.toFixed(1)}`, 680, 30);
    }
    
    // Draw score
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 24px Courier New';
    ctx.textAlign = 'center';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.strokeText(gameState.score.toString(), 400, 40);
    ctx.fillText(gameState.score.toString(), 400, 40);
    ctx.textAlign = 'left';
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
    gameState.score = 0;
    gameState.gameSpeed = gameState.baseSpeed;
    gameState.speedMultiplier = 1;
    gameState.obstacles = [];
    gameState.gems = [];
    gameState.particles = [];
    gameState.player.y = 200;
    gameState.player.velY = 0;
    gameState.player.grounded = false;
    gameState.player.trail = [];
    gameState.scoreSubmitted = false;
    gameState.frame = 0;
    gameState.bgElements = initializeBgElements();
    gameState.playerHighScore = playerCurrentScore;
    
    gameLoop();
  };

  // Restart game
  const restartGame = () => {
    startGame();
  };

  // Submit score
  const submitScore = () => {
    if (gameStateRef.current.scoreSubmitted) return;
    
    setSubmitButtonDisabled(true);
    setSubmitStatus('Submitting...');
    
    const metadata = {
      speedMultiplier: gameStateRef.current.speedMultiplier,
      duration: gameStateRef.current.frame / 60,
      gemsCollected: Math.floor(finalScore / 20)
    };
    
    onScoreSubmit?.(finalScore, metadata);
    
    // Simulate response for demo
    setTimeout(() => {
      gameStateRef.current.scoreSubmitted = true;
      if (finalScore > gameStateRef.current.playerHighScore) {
        setSubmitStatus('New high score saved! 🎉');
      } else {
        setSubmitStatus(`Score not saved - beat your high score of ${gameStateRef.current.playerHighScore} to update!`);
      }
    }, 1000);
  };

  // Input handling
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space' && gameStateRef.current.gameRunning) {
        e.preventDefault();
        jumpPressedRef.current = true;
      }
    };

    const handleKeyUp = (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        jumpPressedRef.current = false;
      }
    };

    const handleMouseDown = () => {
      if (gameStateRef.current.gameRunning) jumpPressedRef.current = true;
    };

    const handleMouseUp = () => {
      jumpPressedRef.current = false;
    };

    const handleTouchStart = (e) => {
      e.preventDefault();
      if (gameStateRef.current.gameRunning) jumpPressedRef.current = true;
    };

    const handleTouchEnd = (e) => {
      e.preventDefault();
      jumpPressedRef.current = false;
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.addEventListener('mousedown', handleMouseDown);
      canvas.addEventListener('mouseup', handleMouseUp);
      canvas.addEventListener('touchstart', handleTouchStart);
      canvas.addEventListener('touchend', handleTouchEnd);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
      if (canvas) {
        canvas.removeEventListener('mousedown', handleMouseDown);
        canvas.removeEventListener('mouseup', handleMouseUp);
        canvas.removeEventListener('touchstart', handleTouchStart);
        canvas.removeEventListener('touchend', handleTouchEnd);
      }
    };
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Initialize game state
  useEffect(() => {
    gameStateRef.current.bgElements = initializeBgElements();
    gameStateRef.current.highScore = parseInt(localStorage.getItem('endlessRunnerHighScore')) || 0;
    gameStateRef.current.playerHighScore = playerCurrentScore;
  }, [initializeBgElements, playerCurrentScore]);

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
          height={400}
          className="bg-gradient-to-b from-purple-800 to-gray-800 border-2 border-purple-500 block"
          style={{ imageRendering: 'pixelated' }}
        />
        
        <div className="text-center mt-2 text-gray-400 text-sm">
          Press SPACE or Click/Tap to Jump | Hold for Higher Jump
        </div>
      </div>

      {/* Start Screen */}
      {showStartScreen && (
        <div className="absolute inset-0 bg-black/90 flex items-center justify-center">
          <div className="text-center bg-gray-800 p-10 rounded-lg border-2 border-purple-500">
            <h1 className="text-5xl text-green-400 mb-5 font-bold">ENDLESS RUNNER</h1>
            <div className="text-lg text-gray-300 mb-5">
              <p>🎮 Press SPACE or Click to Jump</p>
              <p>⚡ Hold for Higher Jump</p>
              <p>💎 Collect gems for bonus points</p>
              <p>🚀 Difficulty increases every 100 points</p>
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
            
            {isNewHighScore && (
              <div className="text-xl text-yellow-400 mb-4 animate-pulse">NEW HIGH SCORE!</div>
            )}
            
            <div className="flex gap-4 justify-center mb-4">
              <button
                onClick={restartGame}
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded transition-colors"
              >
                PLAY AGAIN
              </button>
              <button
                onClick={submitScore}
                disabled={submitButtonDisabled}
                className={`font-bold py-2 px-4 rounded transition-colors ${
                  finalScore > gameStateRef.current.playerHighScore
                    ? 'bg-gradient-to-r from-green-600 to-blue-600 text-white'
                    : 'bg-gray-600 text-white'
                } ${submitButtonDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-80'}`}
              >
                {finalScore > gameStateRef.current.playerHighScore ? 'SUBMIT HIGH SCORE' : 'SUBMIT SCORE'}
              </button>
              <button
                onClick={onClose}
                className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition-colors"
              >
                EXIT
              </button>
            </div>
            
            {submitStatus && (
              <div className={`text-sm mt-2 ${
                submitStatus.includes('New high score') ? 'text-green-400' :
                submitStatus.includes('not saved') ? 'text-yellow-400' :
                submitStatus.includes('Failed') ? 'text-red-400' :
                'text-blue-400'
              }`}>
                {submitStatus}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EndlessRunnerGame;