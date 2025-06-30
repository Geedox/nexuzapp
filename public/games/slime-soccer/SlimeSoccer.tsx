import React, { useState, useEffect, useRef, useCallback } from 'react';

const TRANSLATIONS = {
  "en-US": {
    "gameTitle": "Claude Soccer Slime",
    "originalAuthor": "Written by Quin Pendragon (originally)",
    "adaptedBy": "Adapted by none other than Claude",
    "singlePlayer": "Single Player",
    "multiplayer": "Multiplayer",
    "selectDuration": "Select Game Duration",
    "cyanTeam": "Cyan Team",
    "redTeam": "Red Team",
    "versus": "vs",
    "oneMinute": "1 Minute",
    "twoMinutes": "2 Minutes",
    "fourMinutes": "4 Minutes",
    "eightMinutes": "8 Minutes",
    "worldCup": "World Cup",
    "multiplayerControls1": "Left Team: W (jump), A/D (move), S (grab)",
    "multiplayerControls2": "Right Team: ↑ (jump), ←/→ (move), ↓ (grab)",
    "singlePlayerControls1": "Use Arrow Keys: ↑ (jump), ←/→ (move), ↓ (grab)",
    "singlePlayerControls2": "Hold ↓ to grab the ball when it's near!",
    "backButton": "Back",
    "gameWinner": "Wins!",
    "gameDraw": "It's a Draw!",
    "backToMenu": "Back to Menu"
  },
  /* LOCALE_PLACEHOLDER_START */
  "es-ES": {
    "gameTitle": "Claude Soccer Slime",
    "originalAuthor": "Escrito por Quin Pendragon (originalmente)",
    "adaptedBy": "Adaptado por nada menos que Claude",
    "singlePlayer": "Un Jugador",
    "multiplayer": "Multijugador",
    "selectDuration": "Seleccionar Duración del Juego",
    "cyanTeam": "Equipo Cian",
    "redTeam": "Equipo Rojo",
    "versus": "vs",
    "oneMinute": "1 Minuto",
    "twoMinutes": "2 Minutos",
    "fourMinutes": "4 Minutos",
    "eightMinutes": "8 Minutos",
    "worldCup": "Copa Mundial",
    "multiplayerControls1": "Equipo Izquierdo: W (saltar), A/D (mover), S (agarrar)",
    "multiplayerControls2": "Equipo Derecho: ↑ (saltar), ←/→ (mover), ↓ (agarrar)",
    "singlePlayerControls1": "Usar Teclas de Flecha: ↑ (saltar), ←/→ (mover), ↓ (agarrar)",
    "singlePlayerControls2": "¡Mantén presionado ↓ para agarrar la pelota cuando esté cerca!",
    "backButton": "Atrás",
    "gameWinner": "¡Gana!",
    "gameDraw": "¡Es un Empate!",
    "backToMenu": "Volver al Menú"
  }
  /* LOCALE_PLACEHOLDER_END */
};

const appLocale = '{{APP_LOCALE}}';
const browserLocale = navigator.languages?.[0] || navigator.language || 'en-US';
const findMatchingLocale = (locale) => {
  if (TRANSLATIONS[locale]) return locale;
  const lang = locale.split('-')[0];
  const match = Object.keys(TRANSLATIONS).find(key => key.startsWith(lang + '-'));
  return match || 'en-US';
};
const locale = (appLocale !== '{{APP_LOCALE}}') ? findMatchingLocale(appLocale) : findMatchingLocale(browserLocale);
const t = (key) => TRANSLATIONS[locale]?.[key] || TRANSLATIONS['en-US'][key] || key;

const GAME_WIDTH = 800;
const GAME_HEIGHT = 400;
const GROUND_HEIGHT = 80;
const SLIME_RADIUS = 40;
const BALL_RADIUS = 10;
const GOAL_WIDTH = 80;
const GOAL_HEIGHT = 120;
const GRAVITY = 0.6;
const SLIME_SPEED = 5;
const SLIME_JUMP_POWER = -12;
const BALL_DAMPING = 0.99;
const BALL_BOUNCE_DAMPING = 0.8;
const MAX_BALL_SPEED = 13;
const AI_REACTION_DISTANCE = 300;
const AI_PREDICTION_TIME = 30;

const SlimeSoccer = () => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const keysRef = useRef({});
  const lastFrameTimeRef = useRef(0);
  
  // Game state
  const [gameMode, setGameMode] = useState(null);
  const [playerMode, setPlayerMode] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [score, setScore] = useState({ left: 0, right: 0 });
  const [gameStarted, setGameStarted] = useState(false);
  const [winner, setWinner] = useState(null);
  
  // Game objects state
  const gameStateRef = useRef({
    leftSlime: {
      x: 200,
      y: GAME_HEIGHT - GROUND_HEIGHT,
      vx: 0,
      vy: 0,
      isGrabbing: false,
      hasBall: false,
      goalLineTime: 0,
      // AI state persistence
      targetX: 200,
      lastDecisionTime: 0,
      decisionCooldown: 0,
      stableStart: true
    },
    rightSlime: {
      x: 600,
      y: GAME_HEIGHT - GROUND_HEIGHT,
      vx: 0,
      vy: 0,
      isGrabbing: false,
      hasBall: false,
      goalLineTime: 0
    },
    ball: {
      x: GAME_WIDTH / 2,
      y: 150,
      vx: 0,
      vy: 0,
      grabbedBy: null,
      grabAngle: 0,
      grabAngularVelocity: 0
    }
  });

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't prevent default for input fields
      if (e.target.tagName === 'INPUT') return;
      
      e.preventDefault();
      const key = e.key.toLowerCase();
      if (key === 'arrowup' || key === 'arrowdown' || key === 'arrowleft' || key === 'arrowright') {
        keysRef.current[key] = true;
      } else {
        keysRef.current[key] = true;
      }
    };
    
    const handleKeyUp = (e) => {
      // Don't prevent default for input fields
      if (e.target.tagName === 'INPUT') return;
      
      e.preventDefault();
      const key = e.key.toLowerCase();
      if (key === 'arrowup' || key === 'arrowdown' || key === 'arrowleft' || key === 'arrowright') {
        keysRef.current[key] = false;
      } else {
        keysRef.current[key] = false;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Timer
  useEffect(() => {
    if (gameStarted && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setGameStarted(false);
            determineWinner();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [gameStarted, timeLeft]);

  const determineWinner = () => {
    if (score.left > score.right) {
      setWinner(t('cyanTeam'));
    } else if (score.right > score.left) {
      setWinner(t('redTeam'));
    } else {
      setWinner('Draw');
    }
  };

  const resetPositions = () => {
    const state = gameStateRef.current;
    // Reset slimes to starting positions
    state.leftSlime.x = 200;
    state.leftSlime.y = GAME_HEIGHT - GROUND_HEIGHT;
    state.leftSlime.vx = 0;
    state.leftSlime.vy = 0;
    state.leftSlime.isGrabbing = false;
    state.leftSlime.hasBall = false;
    state.leftSlime.goalLineTime = 0;
    // Reset AI state
    state.leftSlime.targetX = 200;
    state.leftSlime.lastDecisionTime = 0;
    state.leftSlime.decisionCooldown = 0;
    state.leftSlime.stableStart = true;
    
    state.rightSlime.x = 600;
    state.rightSlime.y = GAME_HEIGHT - GROUND_HEIGHT;
    state.rightSlime.vx = 0;
    state.rightSlime.vy = 0;
    state.rightSlime.isGrabbing = false;
    state.rightSlime.hasBall = false;
    state.rightSlime.goalLineTime = 0;
    
    // Reset ball
    state.ball.x = GAME_WIDTH / 2;
    state.ball.y = 150;
    state.ball.vx = 0;
    state.ball.vy = 0;
    state.ball.grabbedBy = null;
    state.ball.grabAngle = 0;
    state.ball.grabAngularVelocity = 0;
  };

  const resetGame = () => {
    resetPositions();
    setScore({ left: 0, right: 0 });
    setWinner(null);
  };

  const startGame = (mode) => {
    const times = {
      '1min': 60,
      '2min': 120,
      '4min': 240,
      '8min': 480,
      'worldcup': 300
    };
    
    resetGame();
    setGameMode(mode);
    setTimeLeft(times[mode]);
    setGameStarted(true);
  };

  // AI logic for single player mode
  const updateAI = useCallback(() => {
    if (playerMode !== 'single') return;
    
    const state = gameStateRef.current;
    const ai = state.leftSlime; // AI is now left slime
    const opponent = state.rightSlime;
    const ball = state.ball;
    const currentTime = Date.now();
    
    // Decision cooldown system - prevent jittery behavior
    if (ai.decisionCooldown > 0) {
      ai.decisionCooldown--;
      // Continue with previous target during cooldown
      const difference = ai.targetX - ai.x;
      const absDistance = Math.abs(difference);
      
      if (absDistance > 10) { // Increased deadzone from 3 to 10
        const speedMultiplier = Math.min(absDistance / 50, 1.0);
        ai.vx = Math.sign(difference) * SLIME_SPEED * speedMultiplier;
      } else {
        ai.vx = 0;
      }
      return;
    }
    
    // Stable starting behavior - stay put initially
    if (ai.stableStart && timeLeft > 55) {
      ai.targetX = 200; // Fixed starting position
      ai.vx = 0;
      // Only start moving when ball gets close or time passes
      if (Math.abs(ball.x - ai.x) < 150 || timeLeft <= 55) {
        ai.stableStart = false;
        ai.decisionCooldown = 15; // 15 frame cooldown before next decision
      }
      return;
    }
    
    // Enhanced AI parameters
    const FIELD_WIDTH = GAME_WIDTH;
    const OPPONENT_GOAL_X = FIELD_WIDTH - GOAL_WIDTH / 2;
    const AI_GOAL_X = GOAL_WIDTH / 2;
    
    // Reduce randomness for more stable behavior
    const randomFactor = Math.sin(currentTime * 0.001) * 0.5 + 0.5; // Stable sine wave instead of random
    const aggressiveness = 0.8; // Fixed aggressiveness
    
    // Predict ball trajectory with more detail
    let predictions = [];
    let tempX = ball.x;
    let tempY = ball.y;
    let tempVx = ball.vx;
    let tempVy = ball.vy;
    
    for (let t = 0; t < 100; t++) {
      tempVy += GRAVITY;
      tempVx *= BALL_DAMPING;
      tempX += tempVx;
      tempY += tempVy;
      
      // Boundary bounces
      if (tempX < BALL_RADIUS) {
        tempX = BALL_RADIUS;
        tempVx = -tempVx * BALL_BOUNCE_DAMPING;
      }
      if (tempX > FIELD_WIDTH - BALL_RADIUS) {
        tempX = FIELD_WIDTH - BALL_RADIUS;
        tempVx = -tempVx * BALL_BOUNCE_DAMPING;
      }
      
      predictions.push({ x: tempX, y: tempY, vx: tempVx, vy: tempVy, time: t });
      
      if (tempY > GAME_HEIGHT - GROUND_HEIGHT - BALL_RADIUS) {
        tempY = GAME_HEIGHT - GROUND_HEIGHT - BALL_RADIUS;
        tempVy = -tempVy * BALL_BOUNCE_DAMPING;
        break;
      }
    }
    
    // Analyze game state
    const ballDistanceToOpponentGoal = Math.abs(ball.x - OPPONENT_GOAL_X);
    const ballDistanceToAIGoal = Math.abs(ball.x - AI_GOAL_X);
    const aiDistanceToBall = Math.abs(ai.x - ball.x);
    const opponentDistanceToBall = Math.abs(opponent.x - ball.x);
    const ballMovingTowardsAIGoal = ball.vx < -1;
    const ballMovingTowardsOpponentGoal = ball.vx > 1;
    const ballHeight = GAME_HEIGHT - GROUND_HEIGHT - ball.y;
    
    // Prevent repetitive jumping - track if we're stuck
    if (!ai.lastBallY) ai.lastBallY = ball.y;
    if (!ai.stuckCounter) ai.stuckCounter = 0;
    
    const ballStuck = Math.abs(ball.y - ai.lastBallY) < 5 && Math.abs(ball.vx) < 2;
    if (ballStuck) {
      ai.stuckCounter++;
    } else {
      ai.stuckCounter = 0;
    }
    ai.lastBallY = ball.y;
    
    // Determine optimal position and strategy
    let newTargetX = ai.targetX; // Start with current target
    let shouldJump = false;
    let shouldGrab = false;
    let moveSpeed = SLIME_SPEED;
    
    // SUPER AGGRESSIVE OFFENSE - Multiple strategies
    if (ballDistanceToOpponentGoal < ballDistanceToAIGoal * 1.5 || 
        (ball.x > FIELD_WIDTH * 0.35 && !ballMovingTowardsAIGoal)) {
      
      // Calculate multiple attack angles
      const directAttackX = ball.x - 30;
      const overheadAttackX = ball.x - 45;
      const underAttackX = ball.x - 20;
      
      // Choose attack based on ball height and position
      if (ballHeight > 60 && aiDistanceToBall < 150) {
        newTargetX = overheadAttackX; // Set up for overhead kick
      } else if (ballHeight < 30 && aiDistanceToBall < 100) {
        newTargetX = underAttackX; // Get under low balls
      } else {
        newTargetX = directAttackX;
      }
      
      moveSpeed = SLIME_SPEED * 1.1; // Slightly faster when attacking
      
      // Smart offensive decisions
      if (aiDistanceToBall < 100) {
        // If ball is stuck, hit it harder
        if (ai.stuckCounter > 30) {
          shouldJump = true;
          newTargetX = ball.x - 40; // Get better angle
        }
        // Grab low balls for control
        else if (ballHeight < 35 && aiDistanceToBall < 60 && !ai.hasBall && ball.vy > -2) {
          shouldGrab = true;
        }
        // Jump for high balls or to create angles
        else if ((ballHeight > 30 && ballHeight < 90) || 
                 (ball.x > FIELD_WIDTH * 0.6 && ballHeight < 120)) {
          if (ai.y >= GAME_HEIGHT - GROUND_HEIGHT - 1) {
            const timeToReachBall = Math.abs(ai.x - ball.x) / SLIME_SPEED;
            const ballHeightWhenReached = ball.y + ball.vy * timeToReachBall + 0.5 * GRAVITY * timeToReachBall * timeToReachBall;
            
            if (ballHeightWhenReached > GAME_HEIGHT - GROUND_HEIGHT - 100 && 
                ballHeightWhenReached < GAME_HEIGHT - GROUND_HEIGHT - 20) {
              shouldJump = true;
            }
          }
        }
      }
      
      // Strategic ball release
      if (ai.hasBall) {
        const angleToGoal = Math.atan2(0, OPPONENT_GOAL_X - ai.x);
        if (Math.abs(angleToGoal) < 0.5 || ai.x > FIELD_WIDTH * 0.7) {
          shouldGrab = false; // Release toward goal
        }
      }
    }
    // SMART DEFENSE - Predictive and aggressive
    else if (ball.x < FIELD_WIDTH * 0.65 || ballMovingTowardsAIGoal) {
      
      // Predict where to intercept
      let bestInterceptX = ball.x;
      
      for (let pred of predictions) {
        if (pred.x < FIELD_WIDTH * 0.4) {
          const timeToReach = Math.abs(ai.x - pred.x) / (SLIME_SPEED * 1.2);
          if (timeToReach <= pred.time + 5) {
            bestInterceptX = pred.x;
            break;
          }
        }
      }
      
      newTargetX = bestInterceptX;
      
      // Emergency defense
      if (ball.x < GOAL_WIDTH * 2.5 && ballMovingTowardsAIGoal) {
        newTargetX = Math.max(ball.x - 10, SLIME_RADIUS);
        moveSpeed = SLIME_SPEED * 1.2;
        
        // Jump to block shots
        if (aiDistanceToBall < 120 && ballHeight < 100) {
          shouldJump = true;
        }
      }
      
      // Clear stuck balls in defense
      if (ai.stuckCounter > 20 && ball.x < FIELD_WIDTH * 0.3) {
        shouldJump = true;
        newTargetX = ball.x + 30; // Position to clear forward
      }
    }
    // MIDFIELD CONTROL - Dynamic positioning
    else {
      // Stable midfield positioning
      newTargetX = FIELD_WIDTH * 0.4;
      
      // Intercept high balls in midfield
      for (let pred of predictions) {
        if (pred.y < GAME_HEIGHT - GROUND_HEIGHT - 50 && 
            Math.abs(pred.x - FIELD_WIDTH * 0.4) < 100) {
          const timeToReach = Math.abs(ai.x - pred.x) / SLIME_SPEED;
          if (timeToReach < pred.time && pred.time < 30) {
            newTargetX = pred.x;
            if (pred.time < 20 && ai.y >= GAME_HEIGHT - GROUND_HEIGHT - 1) {
              shouldJump = true;
            }
            break;
          }
        }
      }
    }
    
    // Only update target if significantly different (reduce micro-adjustments)
    if (Math.abs(newTargetX - ai.targetX) > 15) {
      ai.targetX = newTargetX;
      ai.decisionCooldown = 10; // 10 frame cooldown after decision change
    }
    
    // Enhanced grab logic
    if (shouldGrab && !ai.isGrabbing && ai.y >= GAME_HEIGHT - GROUND_HEIGHT - 1) {
      ai.isGrabbing = true;
    } else if (!shouldGrab) {
      ai.isGrabbing = false;
    }
    
    // Smoother movement with increased deadzone
    const difference = ai.targetX - ai.x;
    const absDistance = Math.abs(difference);
    
    if (absDistance > 10) { // Increased deadzone from 3 to 10
      // Accelerate/decelerate based on distance
      const speedMultiplier = Math.min(absDistance / 50, 1.0);
      ai.vx = Math.sign(difference) * moveSpeed * speedMultiplier;
    } else {
      ai.vx = 0;
    }
    
    // Execute jump with stable timing
    if (shouldJump && ai.vy === 0 && !ai.isGrabbing) {
      ai.vy = SLIME_JUMP_POWER;
    }
    
  }, [playerMode, timeLeft, gameMode]);

  const updatePhysics = useCallback(() => {
    const state = gameStateRef.current;
    const keys = keysRef.current;
    
    // Update left slime controls (always human player)
    if (playerMode === 'multi') {
      // Multiplayer: WASD for left player
      if (keys['a']) state.leftSlime.vx = -SLIME_SPEED;
      else if (keys['d']) state.leftSlime.vx = SLIME_SPEED;
      else state.leftSlime.vx = 0;
      
      if (keys['w'] && state.leftSlime.y >= GAME_HEIGHT - GROUND_HEIGHT - 1 && !state.leftSlime.isGrabbing) {
        state.leftSlime.vy = SLIME_JUMP_POWER;
      }
      
      // Grab control for left player
      state.leftSlime.isGrabbing = keys['s'];
      
      // Arrow keys for right player
      if (keys['arrowleft']) state.rightSlime.vx = -SLIME_SPEED;
      else if (keys['arrowright']) state.rightSlime.vx = SLIME_SPEED;
      else state.rightSlime.vx = 0;
      
      if (keys['arrowup'] && state.rightSlime.y >= GAME_HEIGHT - GROUND_HEIGHT - 1 && !state.rightSlime.isGrabbing) {
        state.rightSlime.vy = SLIME_JUMP_POWER;
      }
      
      // Grab control for right player
      state.rightSlime.isGrabbing = keys['arrowdown'];
    } else {
      // Single player: Arrow keys for human player (right side)
      if (keys['arrowleft']) state.rightSlime.vx = -SLIME_SPEED;
      else if (keys['arrowright']) state.rightSlime.vx = SLIME_SPEED;
      else state.rightSlime.vx = 0;
      
      if (keys['arrowup'] && state.rightSlime.y >= GAME_HEIGHT - GROUND_HEIGHT - 1 && !state.rightSlime.isGrabbing) {
        state.rightSlime.vy = SLIME_JUMP_POWER;
      }
      
      // Grab control for human player
      state.rightSlime.isGrabbing = keys['arrowdown'];
      
      // AI controls left slime
      updateAI();
    }
    
    // Update slime positions and physics
    [state.leftSlime, state.rightSlime].forEach((slime, index) => {
      slime.vy += GRAVITY;
      slime.x += slime.vx;
      slime.y += slime.vy;
      
      // Boundary collision
      if (slime.x < SLIME_RADIUS) slime.x = SLIME_RADIUS;
      if (slime.x > GAME_WIDTH - SLIME_RADIUS) slime.x = GAME_WIDTH - SLIME_RADIUS;
      
      // Ground collision
      if (slime.y > GAME_HEIGHT - GROUND_HEIGHT) {
        slime.y = GAME_HEIGHT - GROUND_HEIGHT;
        slime.vy = 0;
      }
      
      // Check if slime is camping in their OWN goal area
      const isLeftSlime = index === 0;
      const inOwnGoalArea = (isLeftSlime && slime.x < GOAL_WIDTH) || (!isLeftSlime && slime.x > GAME_WIDTH - GOAL_WIDTH);
      
      if (inOwnGoalArea) {
        // Slime is camping in their own goal
        slime.goalLineTime += 1/60; // Assuming 60 FPS
        
        // Check if exceeded 1 second
        if (slime.goalLineTime >= 1) {
          // Award goal to other team (penalty for camping)
          if (isLeftSlime) {
            setScore(prev => ({ ...prev, right: prev.right + 1 }));
          } else {
            setScore(prev => ({ ...prev, left: prev.left + 1 }));
          }
          resetPositions();
        }
      } else {
        // Reset timer if not in own goal area
        slime.goalLineTime = 0;
      }
    });
    
    // Update ball physics
    if (state.ball.grabbedBy) {
      // Ball is grabbed by a slime
      const grabber = state.ball.grabbedBy === 'left' ? state.leftSlime : state.rightSlime;
      
      // Apply rotational physics based on slime movement
      const slimeDirection = state.ball.grabbedBy === 'left' ? 1 : -1;
      
      // When slime moves, ball rotates in opposite direction (slower rotation)
      state.ball.grabAngularVelocity += -grabber.vx * 0.008 * slimeDirection;
      
      // Apply angular damping
      state.ball.grabAngularVelocity *= 0.85;
      
      // Update angle
      state.ball.grabAngle += state.ball.grabAngularVelocity;
      
      // Constrain angle based on slime direction
      // For left slime: -90° (left) to +90° (right)
      // For right slime: 90° (left) to 270° (right)
      if (state.ball.grabbedBy === 'left') {
        // Left slime: constrain between -π/2 and π/2
        if (state.ball.grabAngle < -Math.PI / 2) {
          state.ball.grabAngle = -Math.PI / 2;
          state.ball.grabAngularVelocity = 0;
        } else if (state.ball.grabAngle > Math.PI / 2) {
          state.ball.grabAngle = Math.PI / 2;
          state.ball.grabAngularVelocity = 0;
        }
      } else {
        // Right slime: keep angle between π/2 and 3π/2
        // Normalize angle to 0-2π range first
        while (state.ball.grabAngle < 0) state.ball.grabAngle += Math.PI * 2;
        while (state.ball.grabAngle > Math.PI * 2) state.ball.grabAngle -= Math.PI * 2;
        
        // Now constrain
        if (state.ball.grabAngle < Math.PI / 2 && state.ball.grabAngle >= 0) {
          state.ball.grabAngle = Math.PI / 2;
          state.ball.grabAngularVelocity = 0;
        } else if (state.ball.grabAngle > 3 * Math.PI / 2 || 
                   (state.ball.grabAngle < Math.PI / 2 && state.ball.grabAngle < 0)) {
          state.ball.grabAngle = 3 * Math.PI / 2;
          state.ball.grabAngularVelocity = 0;
        }
      }
      
      // Calculate ball position based on angle
      const holdDistance = SLIME_RADIUS + BALL_RADIUS - 5;
      state.ball.x = grabber.x + Math.cos(state.ball.grabAngle) * holdDistance;
      state.ball.y = grabber.y + Math.sin(state.ball.grabAngle) * holdDistance;
      
      // Ball inherits slime velocity
      state.ball.vx = grabber.vx;
      state.ball.vy = grabber.vy;
      
      // Check if slime released the grab
      if (!grabber.isGrabbing) {
        // Release the ball with angular momentum converted to linear
        const releaseAngle = state.ball.grabAngle;
        const releaseSpeed = Math.abs(state.ball.grabAngularVelocity) * 20;
        state.ball.vx = grabber.vx * 1.5 + Math.cos(releaseAngle) * (3 + releaseSpeed);
        state.ball.vy = grabber.vy - 2 + Math.sin(releaseAngle) * releaseSpeed * 0.3;
        state.ball.grabbedBy = null;
        state.ball.grabAngle = 0;
        state.ball.grabAngularVelocity = 0;
        grabber.hasBall = false;
      }
    } else {
      // Normal ball physics
      state.ball.vy += GRAVITY;
      state.ball.vx *= BALL_DAMPING;
      state.ball.x += state.ball.vx;
      state.ball.y += state.ball.vy;
    }
    
    // Ball boundary collision
    if (state.ball.x < BALL_RADIUS) {
      state.ball.x = BALL_RADIUS;
      state.ball.vx = -state.ball.vx * BALL_BOUNCE_DAMPING;
    }
    if (state.ball.x > GAME_WIDTH - BALL_RADIUS) {
      state.ball.x = GAME_WIDTH - BALL_RADIUS;
      state.ball.vx = -state.ball.vx * BALL_BOUNCE_DAMPING;
    }
    
    // Ball ground collision and goal detection
    if (state.ball.y > GAME_HEIGHT - GROUND_HEIGHT - BALL_RADIUS) {
      state.ball.y = GAME_HEIGHT - GROUND_HEIGHT - BALL_RADIUS;
      state.ball.vy = -state.ball.vy * BALL_BOUNCE_DAMPING;
    }
    
    // Goal detection - ball hits back wall at any height up to goal height
    if (state.ball.x <= BALL_RADIUS && state.ball.y > GAME_HEIGHT - GROUND_HEIGHT - GOAL_HEIGHT) {
      // Goal for right team
      setScore(prev => ({ ...prev, right: prev.right + 1 }));
      resetPositions();
    } else if (state.ball.x >= GAME_WIDTH - BALL_RADIUS && state.ball.y > GAME_HEIGHT - GROUND_HEIGHT - GOAL_HEIGHT) {
      // Goal for left team
      setScore(prev => ({ ...prev, left: prev.left + 1 }));
      resetPositions();
    }
    
    // Ball ceiling collision
    if (state.ball.y < BALL_RADIUS) {
      state.ball.y = BALL_RADIUS;
      state.ball.vy = -state.ball.vy * BALL_BOUNCE_DAMPING;
    }
    
    // Ball-slime collision and grab detection
    [state.leftSlime, state.rightSlime].forEach((slime, index) => {
      const slimeName = index === 0 ? 'left' : 'right';
      const otherSlime = index === 0 ? state.rightSlime : state.leftSlime;
      const dx = state.ball.x - slime.x;
      const dy = state.ball.y - slime.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < SLIME_RADIUS + BALL_RADIUS) {
        // If ball is grabbed by opponent, check if we can knock it out
        if (state.ball.grabbedBy && state.ball.grabbedBy !== slimeName) {
          // Calculate collision force
          const angle = Math.atan2(dy, dx);
          const speed = Math.sqrt(slime.vx * slime.vx + slime.vy * slime.vy);
          
          // If slime is moving fast enough, knock the ball out
          if (speed > 2 || Math.abs(slime.vy) > 5) {
            // Release ball from opponent's grab
            state.ball.grabbedBy = null;
            state.ball.grabAngle = 0;
            state.ball.grabAngularVelocity = 0;
            otherSlime.hasBall = false;
            
            // Apply knockback force
            state.ball.vx = Math.cos(angle) * 8 + slime.vx;
            state.ball.vy = Math.sin(angle) * 8 + slime.vy;
          }
        }
        // Check if slime is trying to grab an ungrabbed ball
        else if (slime.isGrabbing && !state.ball.grabbedBy) {
          // Grab the ball and set initial angle based on position
          state.ball.grabbedBy = slimeName;
          state.ball.grabAngle = Math.atan2(dy, dx);
          state.ball.grabAngularVelocity = 0;
          slime.hasBall = true;
        } 
        // Normal collision if not grabbing
        else if (!state.ball.grabbedBy) {
          const angle = Math.atan2(dy, dx);
          const targetX = slime.x + Math.cos(angle) * (SLIME_RADIUS + BALL_RADIUS);
          const targetY = slime.y + Math.sin(angle) * (SLIME_RADIUS + BALL_RADIUS);
          
          // Only collide if ball is above slime center (semicircle collision)
          if (state.ball.y < slime.y || Math.abs(angle) < Math.PI * 0.5) {
            state.ball.x = targetX;
            state.ball.y = targetY;
            
            // Transfer velocity
            const speed = Math.sqrt(state.ball.vx * state.ball.vx + state.ball.vy * state.ball.vy);
            state.ball.vx = Math.cos(angle) * speed * 1.5 + slime.vx * 0.5;
            state.ball.vy = Math.sin(angle) * speed * 1.5 + slime.vy * 0.5;
            
            // Cap ball speed to prevent it from going too fast
            const newSpeed = Math.sqrt(state.ball.vx * state.ball.vx + state.ball.vy * state.ball.vy);
            if (newSpeed > MAX_BALL_SPEED) {
              const scale = MAX_BALL_SPEED / newSpeed;
              state.ball.vx *= scale;
              state.ball.vy *= scale;
            }
          }
        }
      }
    });
  }, [playerMode, updateAI]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const state = gameStateRef.current;
    
    // Clear canvas
    ctx.fillStyle = '#0000FF';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    
    // Draw ground
    ctx.fillStyle = '#808080';
    ctx.fillRect(0, GAME_HEIGHT - GROUND_HEIGHT, GAME_WIDTH, GROUND_HEIGHT);
    
    // Draw goals with new design
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 3;
    
    // Left goal
    ctx.beginPath();
    // Horizontal line on ground
    ctx.moveTo(0, GAME_HEIGHT - GROUND_HEIGHT);
    ctx.lineTo(GOAL_WIDTH, GAME_HEIGHT - GROUND_HEIGHT);
    // Vertical line at halfway point
    ctx.moveTo(GOAL_WIDTH / 2, GAME_HEIGHT - GROUND_HEIGHT);
    ctx.lineTo(GOAL_WIDTH / 2, GAME_HEIGHT - GROUND_HEIGHT - GOAL_HEIGHT);
    ctx.stroke();
    
    // Left goal net (between wall and vertical line)
    ctx.lineWidth = 1.5; // Updated from 0.6
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    // Vertical net lines
    for (let i = 0; i < GOAL_WIDTH / 2; i += 10) {
      ctx.beginPath();
      ctx.moveTo(i, GAME_HEIGHT - GROUND_HEIGHT - GOAL_HEIGHT);
      ctx.lineTo(i, GAME_HEIGHT - GROUND_HEIGHT);
      ctx.stroke();
    }
    // Horizontal net lines
    for (let j = GAME_HEIGHT - GROUND_HEIGHT - GOAL_HEIGHT; j <= GAME_HEIGHT - GROUND_HEIGHT; j += 10) {
      ctx.beginPath();
      ctx.moveTo(0, j);
      ctx.lineTo(GOAL_WIDTH / 2, j);
      ctx.stroke();
    }
    
    // Reset for right goal
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 3;
    
    // Right goal
    ctx.beginPath();
    // Horizontal line on ground
    ctx.moveTo(GAME_WIDTH - GOAL_WIDTH, GAME_HEIGHT - GROUND_HEIGHT);
    ctx.lineTo(GAME_WIDTH, GAME_HEIGHT - GROUND_HEIGHT);
    // Vertical line at halfway point
    ctx.moveTo(GAME_WIDTH - GOAL_WIDTH / 2, GAME_HEIGHT - GROUND_HEIGHT);
    ctx.lineTo(GAME_WIDTH - GOAL_WIDTH / 2, GAME_HEIGHT - GROUND_HEIGHT - GOAL_HEIGHT);
    ctx.stroke();
    
    // Right goal net (between wall and vertical line)
    ctx.lineWidth = 1.5; // Updated from 0.6
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    // Vertical net lines
    for (let i = GAME_WIDTH - GOAL_WIDTH / 2; i <= GAME_WIDTH; i += 10) {
      ctx.beginPath();
      ctx.moveTo(i, GAME_HEIGHT - GROUND_HEIGHT - GOAL_HEIGHT);
      ctx.lineTo(i, GAME_HEIGHT - GROUND_HEIGHT);
      ctx.stroke();
    }
    // Horizontal net lines
    for (let j = GAME_HEIGHT - GROUND_HEIGHT - GOAL_HEIGHT; j <= GAME_HEIGHT - GROUND_HEIGHT; j += 10) {
      ctx.beginPath();
      ctx.moveTo(GAME_WIDTH - GOAL_WIDTH / 2, j);
      ctx.lineTo(GAME_WIDTH, j);
      ctx.stroke();
    }
    
    // Draw goal line timers
    const drawGoalLineTimer = (slime, goalX, goalWidth) => {
      if (slime.goalLineTime > 0) {
        const percentage = 1 - (slime.goalLineTime / 1); // 1 second max
        const timerWidth = goalWidth * percentage;
        
        ctx.strokeStyle = percentage > 0.3 ? '#FFFF00' : '#FF0000'; // Yellow to red
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(goalX, GAME_HEIGHT - GROUND_HEIGHT + 10);
        ctx.lineTo(goalX + timerWidth, GAME_HEIGHT - GROUND_HEIGHT + 10);
        ctx.stroke();
        
        // Reset stroke style
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 3;
      }
    };
    
    // Check and draw timers for slimes camping in their own goals
    if (state.leftSlime.x < GOAL_WIDTH) {
      drawGoalLineTimer(state.leftSlime, 0, GOAL_WIDTH);
    }
    if (state.rightSlime.x > GAME_WIDTH - GOAL_WIDTH) {
      drawGoalLineTimer(state.rightSlime, GAME_WIDTH - GOAL_WIDTH, GOAL_WIDTH);
    }
    
    // Draw slimes (as semicircles)
    const drawSlime = (slime, isRightSlime, color, accentColor) => {
      ctx.save();
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(slime.x, slime.y, SLIME_RADIUS, Math.PI, 0);
      ctx.closePath();
      ctx.fill();
      
      // Add accent stripe
      ctx.fillStyle = accentColor;
      ctx.beginPath();
      ctx.arc(slime.x, slime.y, SLIME_RADIUS - 5, Math.PI + 0.3, Math.PI + 0.7);
      ctx.arc(slime.x, slime.y, SLIME_RADIUS - 15, Math.PI + 0.7, Math.PI + 0.3, true);
      ctx.closePath();
      ctx.fill();
      
      // Add grab indicator if grabbing
      if (slime.isGrabbing) {
        // Remove visual indicator - no yellow outline
      }
      
      ctx.restore();
      
      // Draw eye
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      // Adjust eye position based on which slime
      const eyeXOffset = isRightSlime ? -SLIME_RADIUS * 0.3 : SLIME_RADIUS * 0.3;
      ctx.arc(slime.x + eyeXOffset, slime.y - SLIME_RADIUS * 0.3, 5, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      const pupilXOffset = isRightSlime ? -SLIME_RADIUS * 0.35 : SLIME_RADIUS * 0.35;
      ctx.arc(slime.x + pupilXOffset, slime.y - SLIME_RADIUS * 0.3, 2, 0, Math.PI * 2);
      ctx.fill();
    };
    
    drawSlime(state.leftSlime, false, '#00CED1', '#008B8B');
    drawSlime(state.rightSlime, true, '#DC143C', '#8B0000');
    
    // Draw ball
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(state.ball.x, state.ball.y, BALL_RADIUS, 0, Math.PI * 2);
    ctx.fill();
  }, []);

  const gameLoop = useCallback((currentTime) => {
    if (gameStarted) {
      // Implement frame rate limiting to 60 FPS
      const targetFrameTime = 1000 / 60; // 60 FPS = ~16.67ms per frame
      
      if (currentTime - lastFrameTimeRef.current >= targetFrameTime) {
        updatePhysics();
        draw();
        lastFrameTimeRef.current = currentTime;
      }
      
      animationRef.current = requestAnimationFrame(gameLoop);
    }
  }, [gameStarted, updatePhysics, draw]);

  useEffect(() => {
    if (gameStarted) {
      animationRef.current = requestAnimationFrame(gameLoop);
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [gameStarted, gameLoop]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
      {!gameStarted && !gameMode && !playerMode && (
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-8 text-white">{t('gameTitle')}</h1>
          <p className="mb-2 text-gray-300">{t('originalAuthor')}</p>
          <p className="mb-8 text-gray-300">{t('adaptedBy')}</p>
          
          <div className="flex gap-4 mb-8 justify-center">
            <button
              onClick={() => setPlayerMode('single')}
              className="px-8 py-4 bg-blue-900 hover:bg-blue-700 rounded border-2 border-gray-600 text-lg"
            >
              {t('singlePlayer')}
            </button>
            <button
              onClick={() => setPlayerMode('multi')}
              className="px-8 py-4 bg-blue-900 hover:bg-blue-700 rounded border-2 border-gray-600 text-lg"
            >
              {t('multiplayer')}
            </button>
          </div>
        </div>
      )}
      
      {playerMode && !gameStarted && !gameMode && (
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">{t('selectDuration')}</h2>
          
          <div className="mb-4 text-lg">
            <span style={{ color: '#00CED1' }}>{t('cyanTeam')}</span>
            <span className="mx-4">{t('versus')}</span>
            <span style={{ color: '#DC143C' }}>{t('redTeam')}</span>
          </div>
          
          <div className="flex gap-4 mb-8">
            <button
              onClick={() => startGame('1min')}
              className="px-6 py-3 bg-blue-900 hover:bg-blue-700 rounded border-2 border-gray-600"
            >
              {t('oneMinute')}
            </button>
            <button
              onClick={() => startGame('2min')}
              className="px-6 py-3 bg-blue-900 hover:bg-blue-700 rounded border-2 border-gray-600"
            >
              {t('twoMinutes')}
            </button>
            <button
              onClick={() => startGame('4min')}
              className="px-6 py-3 bg-blue-900 hover:bg-blue-700 rounded border-2 border-gray-600"
            >
              {t('fourMinutes')}
            </button>
            <button
              onClick={() => startGame('8min')}
              className="px-6 py-3 bg-blue-900 hover:bg-blue-700 rounded border-2 border-gray-600"
            >
              {t('eightMinutes')}
            </button>
            <button
              onClick={() => startGame('worldcup')}
              className="px-6 py-3 bg-blue-900 hover:bg-blue-700 rounded border-2 border-gray-600"
            >
              {t('worldCup')}
            </button>
          </div>
          
          <div className="text-sm text-gray-400">
            {playerMode === 'multi' ? (
              <>
                <p>{t('multiplayerControls1')}</p>
                <p>{t('multiplayerControls2')}</p>
              </>
            ) : (
              <>
                <p>{t('singlePlayerControls1')}</p>
                <p>{t('singlePlayerControls2')}</p>
              </>
            )}
          </div>
          
          <button
            onClick={() => setPlayerMode(null)}
            className="mt-4 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm"
          >
            {t('backButton')}
          </button>
        </div>
      )}
      
      {(gameStarted || winner) && (
        <div className="flex flex-col items-center">
          <div className="bg-blue-700 px-8 py-4 rounded-t-lg w-full flex justify-between items-center">
            <span className="text-xl font-bold">{t('cyanTeam')}: {score.left}</span>
            <span className="text-2xl font-mono">{formatTime(timeLeft)}</span>
            <span className="text-xl font-bold">{score.right} : {t('redTeam')}</span>
          </div>
          
          <canvas
            ref={canvasRef}
            width={GAME_WIDTH}
            height={GAME_HEIGHT}
            className="border-4 border-gray-700"
          />
          
          {winner && (
            <div className="mt-8 text-center">
              <h2 className="text-3xl font-bold mb-4">
                {winner === 'Draw' ? t('gameDraw') : `${winner} ${t('gameWinner')}`}
              </h2>
              <button
                onClick={() => {
                  setGameMode(null);
                  setPlayerMode(null);
                  setWinner(null);
                }}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded"
              >
                {t('backToMenu')}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SlimeSoccer;