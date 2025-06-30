const TRANSLATIONS = {
  "en-US": {
    "gameTitle": "AI Platformer",
    "gameSubtitle": "Each level is uniquely generated based on your chosen theme!",
    "startAdventure": "Start Adventure",
    "controlsArrow": "Use Arrow Keys or WASD to move",
    "controlsJump": "Up/W/Space to jump (collect powerups for double jump!)",
    "controlsDefeat": "Defeat enemies by jumping on them",
    "chooseTheme": "Choose Your Theme",
    "levelDifficulty": "Level {level} - Difficulty: {difficulty}/10",
    "proTip": "💡 Pro tip: Try the \"Custom Theme\" option to create any world you can imagine!",
    "customTheme": "Custom Theme",
    "enterCustomTheme": "Enter Your Custom Theme",
    "customPlaceholder": "e.g. Australia, Underwater City, Candy Factory, Space Station...",
    "generateLevel": "Generate {theme} Level",
    "customTip1": "✨ Be specific! The AI will create themed enemies, collectibles, and obstacles.",
    "customTip2": "💡 Try: \"Ancient Egypt\", \"Cyberpunk City\", \"Medieval Castle\", \"Japan\", or anything you can imagine!",
    "generatingLevel": "Generating Your Level...",
    "creatingExperience": "Creating a unique {theme} experience",
    "buildingChallenges": "Building complex platforms, enemies, and challenges...",
    "levelLabel": "Level {level}",
    "scoreLabel": "Score: {score}",
    "progressHint": "Reach the end! Progress shown in top right",
    "levelComplete": "Level Complete!",
    "collectiblesCount": "Collectibles: {collected} / {total}",
    "enemiesDefeated": "Enemies Defeated: {defeated} / {total}",
    "nextLevel": "Next Level →",
    "gameOver": "Game Over",
    "retryLevel": "Retry Level",
    "backToMenu": "Back to Menu",
    "crystalCaves": "Crystal Caves",
    "floatingLibrary": "Floating Library",
    "mirrorDimension": "Mirror Dimension",
    "dreamscape": "Dreamscape",
    "timeVortex": "Time Vortex",
    "bioluminescentDeep": "Bioluminescent Deep",
    "volcanicForge": "Volcanic Forge",
    "stormPeaks": "Storm Peaks",
    "coralGardens": "Coral Gardens",
    "auroraFields": "Aurora Fields",
    "clockworkCity": "Clockwork City",
    "candyCosmos": "Candy Cosmos",
    "ghostShip": "Ghost Ship",
    "musicBoxWorld": "Music Box World",
    "paintDimension": "Paint Dimension",
    "nebulaGardens": "Nebula Gardens",
    "prismPalace": "Prism Palace",
    "shadowRealm": "Shadow Realm",
    "starlightSanctuary": "Starlight Sanctuary",
    "quantumMaze": "Quantum Maze"
  },
  /* LOCALE_PLACEHOLDER_START */
  "es-ES": {
    "gameTitle": "Plataformas IA",
    "gameSubtitle": "¡Cada nivel se genera únicamente basado en el tema que elijas!",
    "startAdventure": "Comenzar Aventura",
    "controlsArrow": "Usa las teclas de flecha o WASD para moverte",
    "controlsJump": "Arriba/W/Espacio para saltar (¡recoge potenciadores para doble salto!)",
    "controlsDefeat": "Derrota enemigos saltando sobre ellos",
    "chooseTheme": "Elige Tu Tema",
    "levelDifficulty": "Nivel {level} - Dificultad: {difficulty}/10",
    "proTip": "💡 Consejo profesional: ¡Prueba la opción \"Tema Personalizado\" para crear cualquier mundo que puedas imaginar!",
    "customTheme": "Tema Personalizado",
    "enterCustomTheme": "Ingresa Tu Tema Personalizado",
    "customPlaceholder": "ej. Australia, Ciudad Submarina, Fábrica de Dulces, Estación Espacial...",
    "generateLevel": "Generar Nivel de {theme}",
    "customTip1": "✨ ¡Sé específico! La IA creará enemigos, coleccionables y obstáculos temáticos.",
    "customTip2": "💡 Prueba: \"Antiguo Egipto\", \"Ciudad Cyberpunk\", \"Castillo Medieval\", \"Japón\", ¡o cualquier cosa que puedas imaginar!",
    "generatingLevel": "Generando Tu Nivel...",
    "creatingExperience": "Creando una experiencia única de {theme}",
    "buildingChallenges": "Construyendo plataformas complejas, enemigos y desafíos...",
    "levelLabel": "Nivel {level}",
    "scoreLabel": "Puntuación: {score}",
    "progressHint": "¡Llega al final! El progreso se muestra arriba a la derecha",
    "levelComplete": "¡Nivel Completado!",
    "collectiblesCount": "Coleccionables: {collected} / {total}",
    "enemiesDefeated": "Enemigos Derrotados: {defeated} / {total}",
    "nextLevel": "Siguiente Nivel →",
    "gameOver": "Juego Terminado",
    "retryLevel": "Reintentar Nivel",
    "backToMenu": "Volver al Menú",
    "crystalCaves": "Cuevas de Cristal",
    "floatingLibrary": "Biblioteca Flotante",
    "mirrorDimension": "Dimensión Espejo",
    "dreamscape": "Paisaje de Sueños",
    "timeVortex": "Vórtice del Tiempo",
    "bioluminescentDeep": "Profundidades Bioluminiscentes",
    "volcanicForge": "Forja Volcánica",
    "stormPeaks": "Picos de Tormenta",
    "coralGardens": "Jardines de Coral",
    "auroraFields": "Campos de Aurora",
    "clockworkCity": "Ciudad de Engranajes",
    "candyCosmos": "Cosmos de Dulces",
    "ghostShip": "Barco Fantasma",
    "musicBoxWorld": "Mundo de Caja Musical",
    "paintDimension": "Dimensión de Pintura",
    "nebulaGardens": "Jardines de Nebulosa",
    "prismPalace": "Palacio de Prisma",
    "shadowRealm": "Reino de las Sombras",
    "starlightSanctuary": "Santuario de Luz Estelar",
    "quantumMaze": "Laberinto Cuántico"
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
const t = (key, params = {}) => {
  let text = TRANSLATIONS[locale]?.[key] || TRANSLATIONS['en-US'][key] || key;
  Object.keys(params).forEach(param => {
    text = text.replace(`{${param}}`, params[param]);
  });
  return text;
};

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Sparkles, Heart, Star, Zap, TreePine, Snowflake, Droplets, Flame, Leaf, Moon, Sun, Cloud, Gem, Shield, Skull, Waves, Mountain, Music, Palette, Feather, Eye } from 'lucide-react';

const GRAVITY = 0.8;
const JUMP_FORCE = -15;
const MOVE_SPEED = 5;
const PLAYER_SIZE = 30;

const PlatformerGame = () => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const [gameState, setGameState] = useState('menu');
  const [theme, setTheme] = useState('');
  const [customTheme, setCustomTheme] = useState('');
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [levelStartScore, setLevelStartScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [isGenerating, setIsGenerating] = useState(false);
  const [levelData, setLevelData] = useState(null);
  
  // Game objects refs for animation loop
  const gameRefs = useRef({
    player: {
      x: 50,
      y: 300,
      vx: 0,
      vy: 0,
      width: PLAYER_SIZE,
      height: PLAYER_SIZE,
      grounded: false,
      jumpCount: 0,
      hasDoubleJump: false,
      invulnerable: false
    },
    camera: { x: 0, y: 0 },
    particles: [],
    collectedItems: new Set(),
    defeatedEnemies: new Set(),
    keys: {},
    platformStates: new Map(),
    enemyStates: new Map(),
    time: 0
  });

  // Creative theme sets that rotate based on level
  const getThemesForLevel = (level) => {
    const themeSets = [
      // Set 1: Mystical Realms
      [
        { name: t('crystalCaves'), icon: <Star className="w-8 h-8" />, color: '#e94560' },
        { name: t('floatingLibrary'), icon: <Feather className="w-8 h-8" />, color: '#9b59b6' },
        { name: t('mirrorDimension'), icon: <Eye className="w-8 h-8" />, color: '#3498db' },
        { name: t('dreamscape'), icon: <Moon className="w-8 h-8" />, color: '#f39c12' },
        { name: t('timeVortex'), icon: <Zap className="w-8 h-8" />, color: '#e74c3c' }
      ],
      // Set 2: Natural Wonders
      [
        { name: t('bioluminescentDeep'), icon: <Waves className="w-8 h-8" />, color: '#00bcd4' },
        { name: t('volcanicForge'), icon: <Flame className="w-8 h-8" />, color: '#ff6347' },
        { name: t('stormPeaks'), icon: <Mountain className="w-8 h-8" />, color: '#607d8b' },
        { name: t('coralGardens'), icon: <Gem className="w-8 h-8" />, color: '#ff69b4' },
        { name: t('auroraFields'), icon: <Sun className="w-8 h-8" />, color: '#1abc9c' }
      ],
      // Set 3: Fantastical Locations
      [
        { name: t('clockworkCity'), icon: <Shield className="w-8 h-8" />, color: '#795548' },
        { name: t('candyCosmos'), icon: <Heart className="w-8 h-8" />, color: '#ff1493' },
        { name: t('ghostShip'), icon: <Skull className="w-8 h-8" />, color: '#b0bec5' },
        { name: t('musicBoxWorld'), icon: <Music className="w-8 h-8" />, color: '#4caf50' },
        { name: t('paintDimension'), icon: <Palette className="w-8 h-8" />, color: '#ff5722' }
      ],
      // Set 4: Ethereal Spaces
      [
        { name: t('nebulaGardens'), icon: <Cloud className="w-8 h-8" />, color: '#9c27b0' },
        { name: t('prismPalace'), icon: <Gem className="w-8 h-8" />, color: '#00e676' },
        { name: t('shadowRealm'), icon: <Moon className="w-8 h-8" />, color: '#424242' },
        { name: t('starlightSanctuary'), icon: <Sparkles className="w-8 h-8" />, color: '#ffd54f' },
        { name: t('quantumMaze'), icon: <Eye className="w-8 h-8" />, color: '#00acc1' }
      ]
    ];
    
    return themeSets[(level - 1) % themeSets.length];
  };

  // Fallback level data with increased complexity
  const createFallbackLevel = (theme, difficulty) => {
    const complexityMultiplier = Math.min(difficulty / 3, 3);
    const platforms = [
      { x: 50, y: 400, width: 100, height: 20, type: 'normal' }
    ];

    // Generate more complex platform layouts
    const platformCount = 15 + difficulty * 3;
    let lastX = 150;
    let lastY = 400;
    
    for (let i = 1; i < platformCount; i++) {
      const gap = 80 + Math.random() * 60;
      const x = lastX + gap;
      const yVariation = Math.sin(i * 0.3) * 120 + Math.cos(i * 0.7) * 80;
      const y = 350 + yVariation;
      
      const types = ['normal', 'moving', 'bouncy', 'disappearing', 'ice'];
      const typeChance = Math.random();
      let type = 'normal';
      
      if (typeChance > 0.8) type = 'moving';
      else if (typeChance > 0.65) type = 'bouncy';
      else if (typeChance > 0.5) type = 'disappearing';
      else if (typeChance > 0.35) type = 'ice';
      
      platforms.push({
        x: x,
        y: Math.max(100, Math.min(500, y)),
        width: 60 + Math.random() * 40,
        height: 15 + Math.random() * 10,
        type,
        movementRange: type === 'moving' ? 80 + Math.random() * 40 : undefined,
        movementSpeed: type === 'moving' ? 1 + difficulty * 0.3 : undefined,
        movementDirection: type === 'moving' ? Math.random() > 0.5 ? 'horizontal' : 'vertical' : undefined
      });
      
      lastX = x;
      lastY = y;
    }

    // Generate enemies with varied types
    const enemies = [];
    const enemyCount = 3 + difficulty;
    for (let i = 0; i < enemyCount; i++) {
      const types = ['walker', 'flyer', 'jumper', 'shooter'];
      const type = types[Math.floor(Math.random() * types.length)];
      enemies.push({
        x: 200 + i * 150 + Math.random() * 100,
        y: type === 'flyer' ? 150 + Math.random() * 200 : 350,
        type,
        patrolRange: 100 + Math.random() * 50,
        speed: 1 + difficulty * 0.2
      });
    }

    // More collectibles with variety
    const collectibles = [];
    const collectibleCount = 10 + difficulty * 2;
    for (let i = 0; i < collectibleCount; i++) {
      collectibles.push({
        x: 100 + i * 80 + Math.random() * 40,
        y: 150 + Math.random() * 300,
        type: Math.random() > 0.7 ? 'powerup' : 'gem',
        value: Math.random() > 0.9 ? 50 : 10
      });
    }

    // Varied obstacles
    const obstacles = [];
    const obstacleCount = 2 + Math.floor(difficulty / 2);
    for (let i = 0; i < obstacleCount; i++) {
      const types = ['spike', 'laser', 'saw', 'fireball'];
      obstacles.push({
        x: 250 + i * 200 + Math.random() * 100,
        y: 380 + Math.random() * 100,
        type: types[Math.floor(Math.random() * types.length)],
        width: 30 + Math.random() * 20,
        height: 20 + Math.random() * 10
      });
    }

    return {
      platforms,
      enemies,
      collectibles,
      obstacles,
      theme: {
        backgroundColor: '#1a1a2e',
        platformColor: '#16213e',
        accentColor: '#e94560',
        particleEffect: 'sparkle'
      },
      levelName: `${theme} - ${t('levelLabel', { level })}`,
      levelDescription: `Navigate the challenging ${theme.toLowerCase()}`
    };
  };

  const generateLevel = async () => {
    setIsGenerating(true);
    setLevelStartScore(score); // Save the score at the start of this level
    
    try {
      const selectedTheme = theme === 'custom' ? customTheme : theme;
      
      // Adjust difficulty based on level
      const difficulty = level === 1 ? 1 : Math.min(level + 1, 10);
      const platformCount = level === 1 ? 12 : 15 + level * 3;
      const enemyCount = level === 1 ? 2 : 3 + Math.floor(level * 1.5);
      const collectibleCount = level === 1 ? 8 : 10 + level * 2;
      const obstacleCount = level === 1 ? 0 : 2 + Math.floor(level / 2);
      
      const prompt = `Generate a platformer level with the theme "${selectedTheme}". This is level ${level}, difficulty ${difficulty}/10. Please respond in ${locale} language.

${level === 1 ? 'Create an APPROACHABLE introductory level with easier jumps and fewer hazards.' : 'Create a CHALLENGING and VARIED level.'}

THEME CUSTOMIZATION IS CRITICAL:
For the theme "${selectedTheme}", you MUST create completely themed content:
- Enemies should be theme-specific creatures/objects (e.g., for "Australia": kangaroos, koalas, spiders, crocodiles)
- Collectibles should be themed items (e.g., for "Australia": boomerangs, didgeridoos, eucalyptus leaves)
- Obstacles should match the theme (e.g., for "Australia": bushfires, snake pits, crocodile snaps)
- Visual style should obviously reflect the theme

Requirements:
- ${platformCount} platforms ${level === 1 ? 'with forgiving spacing' : 'forming multiple paths and sections'}
- Platform types: normal (${level === 1 ? '60' : '40'}%), moving (${level === 1 ? '15' : '20'}%), bouncy (15%), disappearing (${level === 1 ? '10' : '15'}%), ice (${level === 1 ? '0' : '10'}%)
- ${enemyCount} THEMED enemies with names and behaviors matching "${selectedTheme}"
- ${collectibleCount} THEMED collectibles specific to "${selectedTheme}"
- ${obstacleCount} THEMED obstacles that fit "${selectedTheme}"
${level === 1 ? '- Maximum jump gaps: 100px horizontal, 60px vertical' : '- Challenging but possible jumps'}

Respond ONLY with valid JSON:
{
  "platforms": [
    {
      "x": number (0-1200),
      "y": number (50-550),
      "width": number (40-150),
      "height": number (10-30),
      "type": "normal" | "moving" | "disappearing" | "bouncy" | "ice",
      "movementRange": number (optional, 50-150 for moving),
      "movementSpeed": number (optional, 1-${level === 1 ? '2' : '4'} for moving),
      "movementDirection": "horizontal" | "vertical" (optional, for moving)
    }
  ],
  "enemies": [
    {
      "x": number,
      "y": number,
      "type": "walker" | "flyer" | "jumper" | "shooter",
      "themeName": "string (SPECIFIC to ${selectedTheme}, e.g. 'kangaroo', 'robot', 'ghost')",
      "patrolRange": number (50-200),
      "speed": number (1-${level === 1 ? '2' : '3'})
    }
  ],
  "collectibles": [
    {
      "x": number,
      "y": number,
      "type": "gem" | "powerup",
      "themeName": "string (SPECIFIC to ${selectedTheme}, e.g. 'boomerang', 'crystal', 'coin')",
      "value": number (10, 25, 50, or 100)
    }
  ],
  "obstacles": [
    {
      "x": number,
      "y": number,
      "type": "spike" | "laser" | "saw" | "fireball",
      "themeName": "string (SPECIFIC to ${selectedTheme}, e.g. 'cactus', 'laser grid', 'buzzsaw')",
      "width": number (20-50),
      "height": number (10-30),
      "movePattern": "static" | "rotating" | "oscillating" (optional)
    }
  ],
  "theme": {
    "backgroundColor": "hex color (matching ${selectedTheme})",
    "platformColor": "hex color (matching ${selectedTheme})",
    "accentColor": "hex color (matching ${selectedTheme})",
    "particleEffect": "sparkle" | "snow" | "bubbles" | "embers" | "leaves" | "stars" | "dust" | "sand"
  },
  "levelName": "string (creative name for ${selectedTheme})",
  "levelDescription": "string (flavorful description mentioning ${selectedTheme} elements, max 60 chars)"
}

CRITICAL: 
- First platform at x:50, y:400
- Path to x:1100+ for completion
- ALL content must be OBVIOUSLY themed to "${selectedTheme}"
- Your ENTIRE response must be ONLY the JSON object.`;

      const response = await window.claude.complete(prompt);
      const data = JSON.parse(response);
      setLevelData(data);
      setGameState('playing');
    } catch (error) {
      console.error('Failed to generate level:', error);
      const selectedTheme = theme === 'custom' ? customTheme : theme;
      const fallbackData = createFallbackLevel(selectedTheme, level);
      setLevelData(fallbackData);
      setGameState('playing');
    }
    
    setIsGenerating(false);
  };

  const handleKeyDown = useCallback((e) => {
    gameRefs.current.keys[e.key] = true;
  }, []);

  const handleKeyUp = useCallback((e) => {
    gameRefs.current.keys[e.key] = false;
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  const createParticle = (x, y, type, color = null) => {
    const particle = {
      x,
      y,
      vx: (Math.random() - 0.5) * 6,
      vy: Math.random() * -5 - 2,
      life: 1,
      type,
      size: Math.random() * 4 + 2,
      color: color || levelData?.theme.accentColor || '#ffffff'
    };
    gameRefs.current.particles.push(particle);
  };

  const updateGame = useCallback(() => {
    if (gameState !== 'playing' || !levelData) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const game = gameRefs.current;
    const { player, camera, particles, keys } = game;
    game.time++;

    // Clear canvas
    ctx.fillStyle = levelData.theme.backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw background pattern
    ctx.save();
    ctx.globalAlpha = 0.1;
    for (let i = 0; i < 20; i++) {
      ctx.fillStyle = levelData.theme.accentColor;
      ctx.beginPath();
      ctx.arc(
        (i * 100 + game.time * 0.5) % (canvas.width + 100) - 50,
        Math.sin(i + game.time * 0.01) * 50 + canvas.height / 2,
        20 + Math.sin(i) * 10,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }
    ctx.restore();

    // Update player physics
    if (keys['ArrowLeft'] || keys['a']) {
      player.vx = -MOVE_SPEED;
    } else if (keys['ArrowRight'] || keys['d']) {
      player.vx = MOVE_SPEED;
    } else {
      player.vx *= 0.8;
    }

    // Enhanced jump mechanics
    if ((keys['ArrowUp'] || keys['w'] || keys[' ']) && (player.grounded || (player.hasDoubleJump && player.jumpCount < 2))) {
      if (!game.jumpPressed) {
        player.vy = JUMP_FORCE;
        player.jumpCount++;
        game.jumpPressed = true;
        createParticle(player.x + player.width / 2, player.y + player.height, 'jump');
      }
    } else {
      game.jumpPressed = false;
    }

    // Apply gravity
    player.vy += GRAVITY;
    player.vy = Math.min(player.vy, 20);

    // Update position
    player.x += player.vx;
    player.y += player.vy;

    // Smooth camera follow with lookahead
    const targetCameraX = Math.max(0, player.x - canvas.width / 2 + player.vx * 10);
    camera.x += (targetCameraX - camera.x) * 0.1;

    // Platform collision
    player.grounded = false;
    levelData.platforms.forEach((platform, index) => {
      let platformX = platform.x;
      let platformY = platform.y;

      // Handle moving platforms
      if (platform.type === 'moving' && platform.movementRange) {
        if (!game.platformStates.has(index)) {
          game.platformStates.set(index, { offset: 0, direction: 1 });
        }
        const state = game.platformStates.get(index);
        state.offset += platform.movementSpeed * state.direction;
        if (Math.abs(state.offset) > platform.movementRange) {
          state.direction *= -1;
        }
        
        if (platform.movementDirection === 'vertical') {
          platformY += state.offset;
        } else {
          platformX += state.offset;
        }
      }

      // Check collision
      if (player.x < platformX + platform.width &&
          player.x + player.width > platformX &&
          player.y < platformY + platform.height &&
          player.y + player.height > platformY) {
        
        // Landing on platform
        if (player.vy > 0 && player.y < platformY) {
          player.y = platformY - player.height;
          player.vy = 0;
          player.grounded = true;
          player.jumpCount = 0;

          // Ice platform - slippery
          if (platform.type === 'ice') {
            player.vx *= 1.02;
          }

          // Bouncy platform
          if (platform.type === 'bouncy') {
            player.vy = JUMP_FORCE * 1.5;
            createParticle(platformX + platform.width / 2, platformY, 'bounce', '#ffeb3b');
          }

          // Disappearing platform
          if (platform.type === 'disappearing') {
            const stateKey = `disappear-${index}`;
            if (!game.platformStates.has(stateKey)) {
              game.platformStates.set(stateKey, { triggered: true, timer: 0 });
            }
            const state = game.platformStates.get(stateKey);
            state.timer++;
            if (state.timer > 30) {
              platform.opacity = Math.max(0, 1 - (state.timer - 30) / 30);
              if (state.timer > 60) {
                const idx = levelData.platforms.indexOf(platform);
                if (idx > -1) {
                  levelData.platforms.splice(idx, 1);
                  game.platformStates.delete(stateKey);
                }
              }
            }
          }
        }
      }

      // Draw platform
      ctx.save();
      ctx.translate(-camera.x, 0);
      ctx.globalAlpha = platform.opacity || 1;
      
      let color = levelData.theme.platformColor;
      if (platform.type === 'ice') {
        color = '#e0ffff';
      } else if (platform.type === 'bouncy') {
        color = levelData.theme.accentColor;
      } else if (platform.type === 'disappearing') {
        color = `${levelData.theme.platformColor}88`;
      }
      
      ctx.fillStyle = color;
      ctx.fillRect(platformX, platformY, platform.width, platform.height);
      
      // Platform details
      if (platform.type === 'moving') {
        ctx.fillStyle = levelData.theme.accentColor;
        ctx.fillRect(platformX + platform.width / 2 - 5, platformY + 5, 10, 5);
      }
      
      ctx.restore();
    });

    // Update and draw enemies
    levelData.enemies.forEach((enemy, index) => {
      if (game.defeatedEnemies.has(index)) return;
      
      const state = game.enemyStates.get(index) || { x: enemy.x, y: enemy.y, vx: 1, vy: 0, time: 0 };
      state.time++;
      
      // Enemy AI
      switch (enemy.type) {
        case 'walker':
          state.x += enemy.speed * state.vx;
          if (Math.abs(state.x - enemy.x) > enemy.patrolRange) {
            state.vx *= -1;
          }
          break;
        case 'flyer':
          state.x = enemy.x + Math.sin(state.time * 0.02) * enemy.patrolRange;
          state.y = enemy.y + Math.cos(state.time * 0.03) * 30;
          break;
        case 'jumper':
          state.x += enemy.speed * state.vx;
          if (Math.abs(state.x - enemy.x) > enemy.patrolRange) {
            state.vx *= -1;
          }
          if (state.time % 60 === 0) {
            state.vy = -10;
          }
          state.vy += 0.5;
          state.y += state.vy;
          state.y = Math.min(state.y, enemy.y);
          break;
        case 'shooter':
          state.x = enemy.x + Math.sin(state.time * 0.01) * 20;
          if (state.time % 90 === 0) {
            // Create projectile particle effect
            createParticle(state.x, state.y, 'projectile', '#ff0000');
          }
          break;
      }
      
      game.enemyStates.set(index, state);
      
      // Check collision with player
      if (!player.invulnerable &&
          Math.abs(player.x + player.width / 2 - state.x) < 25 &&
          Math.abs(player.y + player.height / 2 - state.y) < 25) {
        
        // Player defeats enemy by jumping on it
        if (player.vy > 0 && player.y < state.y) {
          game.defeatedEnemies.add(index);
          setScore(prev => prev + 25);
          player.vy = JUMP_FORCE * 0.7;
          createParticle(state.x, state.y, 'defeat', '#ff5722');
        } else {
          // Player takes damage
          setLives(prev => prev - 1);
          player.invulnerable = true;
          setTimeout(() => { player.invulnerable = false; }, 2000);
          createParticle(player.x + player.width / 2, player.y + player.height / 2, 'damage', '#f44336');
          
          if (lives <= 1) {
            setGameState('gameOver');
          }
        }
      }
      
      // Draw enemy with theme-specific appearance
      ctx.save();
      ctx.translate(-camera.x, 0);
      ctx.globalAlpha = player.invulnerable && state.time % 10 < 5 ? 0.5 : 1;
      
      // Different shapes based on theme
      const enemyColor = '#ff5252';
      ctx.fillStyle = enemyColor;
      
      if (enemy.type === 'flyer') {
        // Flying enemy shape
        ctx.beginPath();
        ctx.moveTo(state.x, state.y - 10);
        ctx.lineTo(state.x - 15, state.y + 10);
        ctx.lineTo(state.x + 15, state.y + 10);
        ctx.closePath();
        ctx.fill();
      } else if (enemy.type === 'jumper') {
        // Jumping enemy with legs
        ctx.fillRect(state.x - 10, state.y - 15, 20, 20);
        ctx.fillRect(state.x - 8, state.y + 5, 6, 8);
        ctx.fillRect(state.x + 2, state.y + 5, 6, 8);
      } else if (enemy.type === 'shooter') {
        // Shooter enemy with gun shape
        ctx.beginPath();
        ctx.arc(state.x, state.y, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(state.x + 10, state.y - 3, 12, 6);
      } else {
        // Walker enemy
        ctx.fillRect(state.x - 12, state.y - 12, 24, 24);
      }
      
      // Draw theme name label
      if (enemy.themeName) {
        ctx.fillStyle = '#ffffff';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(enemy.themeName, state.x, state.y - 20);
      }
      
      ctx.restore();
    });

    // Collect items
    levelData.collectibles.forEach((item, index) => {
      if (game.collectedItems.has(index)) return;

      const dist = Math.sqrt(
        Math.pow(player.x + player.width / 2 - item.x, 2) +
        Math.pow(player.y + player.height / 2 - item.y, 2)
      );

      if (dist < 30) {
        game.collectedItems.add(index);
        setScore(prev => prev + (item.value || 10));
        
        if (item.type === 'powerup') {
          player.hasDoubleJump = true;
          createParticle(item.x, item.y, 'powerup', '#4caf50');
        } else {
          createParticle(item.x, item.y, 'collect', '#ffd700');
        }
      }

      // Draw collectible
      if (!game.collectedItems.has(index)) {
        ctx.save();
        ctx.translate(-camera.x, 0);
        
        const bounce = Math.sin(game.time * 0.05 + index) * 5;
        
        if (item.type === 'gem') {
          // Draw gem shape
          ctx.fillStyle = '#ffd700';
          ctx.beginPath();
          ctx.moveTo(item.x, item.y - 10 + bounce);
          ctx.lineTo(item.x - 8, item.y + bounce);
          ctx.lineTo(item.x, item.y + 10 + bounce);
          ctx.lineTo(item.x + 8, item.y + bounce);
          ctx.closePath();
          ctx.fill();
          
          // Inner shine
          ctx.fillStyle = '#ffff99';
          ctx.beginPath();
          ctx.moveTo(item.x, item.y - 5 + bounce);
          ctx.lineTo(item.x - 4, item.y + bounce);
          ctx.lineTo(item.x, item.y + 5 + bounce);
          ctx.lineTo(item.x + 4, item.y + bounce);
          ctx.closePath();
          ctx.fill();
        } else {
          // Powerup orb
          ctx.fillStyle = '#4caf50';
          ctx.beginPath();
          ctx.arc(item.x, item.y + bounce, 12, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.font = '16px bold sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('P', item.x, item.y + 5 + bounce);
        }
        
        // Draw theme name label
        if (item.themeName) {
          ctx.fillStyle = '#ffffff';
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 2;
          ctx.font = '10px sans-serif';
          ctx.textAlign = 'center';
          ctx.strokeText(item.themeName, item.x, item.y + 25 + bounce);
          ctx.fillText(item.themeName, item.x, item.y + 25 + bounce);
        }
        
        ctx.restore();
      }
    });

    // Draw obstacles
    levelData.obstacles.forEach((obstacle) => {
      ctx.save();
      ctx.translate(-camera.x, 0);
      
      // Draw obstacle based on type
      if (obstacle.type === 'spike') {
        ctx.fillStyle = '#9e9e9e';
        ctx.beginPath();
        for (let i = 0; i < obstacle.width / 10; i++) {
          ctx.moveTo(obstacle.x + i * 10, obstacle.y + obstacle.height);
          ctx.lineTo(obstacle.x + i * 10 + 5, obstacle.y);
          ctx.lineTo(obstacle.x + i * 10 + 10, obstacle.y + obstacle.height);
        }
        ctx.fill();
      } else if (obstacle.type === 'laser') {
        // Animated laser beam
        ctx.fillStyle = `rgba(255, 0, 0, ${0.5 + Math.sin(game.time * 0.1) * 0.3})`;
        ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        ctx.strokeStyle = '#ff0000';
        ctx.strokeRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
      } else if (obstacle.type === 'saw') {
        // Rotating saw
        ctx.save();
        ctx.translate(obstacle.x + obstacle.width / 2, obstacle.y + obstacle.height / 2);
        ctx.rotate(game.time * 0.1);
        ctx.fillStyle = '#808080';
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
          const angle = (i / 8) * Math.PI * 2;
          ctx.lineTo(Math.cos(angle) * obstacle.width / 2, Math.sin(angle) * obstacle.height / 2);
          ctx.lineTo(Math.cos(angle + 0.2) * obstacle.width / 3, Math.sin(angle + 0.2) * obstacle.height / 3);
        }
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      } else if (obstacle.type === 'fireball') {
        // Animated fireball
        ctx.fillStyle = '#ff6347';
        ctx.beginPath();
        ctx.arc(obstacle.x + obstacle.width / 2, obstacle.y + obstacle.height / 2, 
                Math.min(obstacle.width, obstacle.height) / 2, 0, Math.PI * 2);
        ctx.fill();
        // Flame effect
        ctx.fillStyle = '#ffa500';
        ctx.beginPath();
        ctx.arc(obstacle.x + obstacle.width / 2, obstacle.y + obstacle.height / 2, 
                Math.min(obstacle.width, obstacle.height) / 3, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = '#ff5722';
        ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
      }
      
      // Draw theme name label
      if (obstacle.themeName) {
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.strokeText(obstacle.themeName, obstacle.x + obstacle.width / 2, obstacle.y - 5);
        ctx.fillText(obstacle.themeName, obstacle.x + obstacle.width / 2, obstacle.y - 5);
      }
      
      // Check collision
      if (!player.invulnerable &&
          player.x < obstacle.x + obstacle.width &&
          player.x + player.width > obstacle.x &&
          player.y < obstacle.y + obstacle.height &&
          player.y + player.height > obstacle.y) {
        setLives(prev => prev - 1);
        player.invulnerable = true;
        setTimeout(() => { player.invulnerable = false; }, 2000);
        player.x = 50;
        player.y = 300;
        createParticle(player.x + player.width / 2, player.y + player.height / 2, 'damage', '#f44336');
        
        if (lives <= 1) {
          setGameState('gameOver');
        }
      }
      
      ctx.restore();
    });

    // Check win condition
    if (player.x > 1100) {
      setGameState('levelComplete');
    }

    // Draw player
    ctx.save();
    ctx.translate(-camera.x, 0);
    ctx.globalAlpha = player.invulnerable && game.time % 10 < 5 ? 0.5 : 1;
    
    // Player body
    ctx.fillStyle = '#4a90e2';
    ctx.fillRect(player.x, player.y, player.width, player.height);
    
    // Player details
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(player.x + 5, player.y + 5, 5, 5);
    ctx.fillRect(player.x + 20, player.y + 5, 5, 5);
    ctx.fillRect(player.x + 10, player.y + 15, 10, 5);
    
    // Double jump indicator
    if (player.hasDoubleJump) {
      ctx.fillStyle = '#4caf50';
      ctx.beginPath();
      ctx.arc(player.x + player.width / 2, player.y - 10, 5, 0, Math.PI * 2);
      ctx.fill();
    }
    
    ctx.restore();

    // Update and draw particles
    particles.forEach((particle, index) => {
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.vy += 0.3;
      particle.life -= 0.02;

      if (particle.life <= 0) {
        particles.splice(index, 1);
        return;
      }

      ctx.save();
      ctx.translate(-camera.x, 0);
      ctx.globalAlpha = particle.life;
      ctx.fillStyle = particle.color;
      
      // Different particle effects based on type
      if (particle.type === 'sparkle' || particle.type === 'stars') {
        ctx.save();
        ctx.translate(particle.x, particle.y);
        ctx.rotate(game.time * 0.1);
        ctx.fillRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size);
        ctx.restore();
      } else if (particle.type === 'snow') {
        // Snowflake pattern
        ctx.strokeStyle = particle.color;
        ctx.lineWidth = 1;
        for (let i = 0; i < 6; i++) {
          ctx.save();
          ctx.translate(particle.x, particle.y);
          ctx.rotate((i / 6) * Math.PI * 2);
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(0, particle.size);
          ctx.stroke();
          ctx.restore();
        }
      } else if (particle.type === 'sand' || particle.type === 'dust') {
        // Sand/dust particles
        ctx.fillRect(particle.x, particle.y, particle.size / 2, particle.size / 2);
      } else if (particle.type === 'leaves') {
        // Leaf shape
        ctx.save();
        ctx.translate(particle.x, particle.y);
        ctx.rotate(particle.life * Math.PI);
        ctx.beginPath();
        ctx.ellipse(0, 0, particle.size, particle.size / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else if (particle.type === 'embers') {
        // Glowing ember
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#ff6347';
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Default circular particle
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    });

    // Environmental particles
    if (Math.random() < 0.1) {
      const particleType = levelData.theme.particleEffect;
      createParticle(
        camera.x + Math.random() * canvas.width,
        particleType === 'snow' || particleType === 'leaves' ? 0 : Math.random() * canvas.height,
        particleType
      );
    }

    // Keep player in bounds
    if (player.y > canvas.height) {
      setLives(prev => prev - 1);
      player.x = 50;
      player.y = 300;
      player.vx = 0;
      player.vy = 0;
      player.hasDoubleJump = false;
      
      if (lives <= 1) {
        setGameState('gameOver');
      }
    }

    // Draw UI
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(10, 10, 200, 30);
    ctx.fillStyle = '#ffffff';
    ctx.font = '16px sans-serif';
    ctx.fillText(t('scoreLabel', { score }), 20, 30);
    
    // Progress bar
    const progress = Math.min(player.x / 1100, 1);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(canvas.width - 210, 10, 200, 20);
    ctx.fillStyle = levelData.theme.accentColor;
    ctx.fillRect(canvas.width - 210, 10, 200 * progress, 20);

  }, [gameState, levelData, lives, score]);

  useEffect(() => {
    const gameLoop = () => {
      updateGame();
      animationRef.current = requestAnimationFrame(gameLoop);
    };

    if (gameState === 'playing') {
      animationRef.current = requestAnimationFrame(gameLoop);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [updateGame, gameState]);

  const resetGame = () => {
    setLevel(1);
    setScore(0);
    setLives(3);
    setTheme('');
    setGameState('menu');
    gameRefs.current.collectedItems.clear();
    gameRefs.current.defeatedEnemies.clear();
    gameRefs.current.platformStates.clear();
    gameRefs.current.enemyStates.clear();
    gameRefs.current.player = {
      x: 50,
      y: 300,
      vx: 0,
      vy: 0,
      width: PLAYER_SIZE,
      height: PLAYER_SIZE,
      grounded: false,
      jumpCount: 0,
      hasDoubleJump: false,
      invulnerable: false
    };
  };

  const restartLevel = () => {
    setLives(3);
    gameRefs.current.collectedItems.clear();
    gameRefs.current.defeatedEnemies.clear();
    gameRefs.current.platformStates.clear();
    gameRefs.current.enemyStates.clear();
    gameRefs.current.particles = [];
    gameRefs.current.camera = { x: 0, y: 0 };
    gameRefs.current.time = 0;
    gameRefs.current.player = {
      x: 50,
      y: 300,
      vx: 0,
      vy: 0,
      width: PLAYER_SIZE,
      height: PLAYER_SIZE,
      grounded: false,
      jumpCount: 0,
      hasDoubleJump: false,
      invulnerable: false
    };
    setGameState('playing');
  };

  const nextLevel = () => {
    setLevel(prev => prev + 1);
    setTheme('');
    setCustomTheme('');
    setGameState('themeSelect');
    gameRefs.current.collectedItems.clear();
    gameRefs.current.defeatedEnemies.clear();
    gameRefs.current.platformStates.clear();
    gameRefs.current.enemyStates.clear();
    gameRefs.current.player = {
      x: 50,
      y: 300,
      vx: 0,
      vy: 0,
      width: PLAYER_SIZE,
      height: PLAYER_SIZE,
      grounded: false,
      jumpCount: 0,
      hasDoubleJump: false,
      invulnerable: false
    };
  };

  const themes = getThemesForLevel(level);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white">
      {gameState === 'menu' && (
        <div className="text-center space-y-8 animate-fade-in">
          <h1 className="text-6xl font-bold bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
            {t('gameTitle')}
          </h1>
          <p className="text-xl text-gray-300">
            {t('gameSubtitle')}
          </p>
          <button
            onClick={() => setGameState('themeSelect')}
            className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg font-semibold text-lg hover:scale-105 transition-transform duration-200 shadow-lg hover:shadow-xl"
          >
            {t('startAdventure')}
          </button>
          <div className="text-sm text-gray-400 mt-8">
            <p>{t('controlsArrow')}</p>
            <p>{t('controlsJump')}</p>
            <p>{t('controlsDefeat')}</p>
          </div>
        </div>
      )}

      {gameState === 'themeSelect' && (
        <div className="text-center space-y-8 animate-fade-in max-w-4xl">
          <h2 className="text-4xl font-bold">{t('chooseTheme')}</h2>
          <p className="text-xl text-gray-300">{t('levelDifficulty', { level, difficulty: level === 1 ? 1 : Math.min(level + 1, 10) })}</p>
          
          {level > 1 && (
            <p className="text-sm text-blue-400">
              {t('proTip')}
            </p>
          )}
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {themes.map((t_theme) => (
              <button
                key={t_theme.name}
                onClick={() => {
                  setTheme(t_theme.name);
                  generateLevel();
                }}
                className="p-6 rounded-lg bg-slate-700 hover:bg-slate-600 transition-all duration-200 hover:scale-105 group"
                style={{ borderColor: t_theme.color, borderWidth: '2px' }}
              >
                <div className="flex flex-col items-center space-y-2">
                  <div style={{ color: t_theme.color }} className="group-hover:scale-110 transition-transform">
                    {t_theme.icon}
                  </div>
                  <span className="font-semibold">{t_theme.name}</span>
                </div>
              </button>
            ))}
            <button
              onClick={() => setTheme('custom')}
              className="p-6 rounded-lg bg-slate-700 hover:bg-slate-600 transition-all duration-200 hover:scale-105 group border-2 border-gray-400"
            >
              <div className="flex flex-col items-center space-y-2">
                <Palette className="w-8 h-8 text-gray-400 group-hover:scale-110 transition-transform" />
                <span className="font-semibold">{t('customTheme')}</span>
              </div>
            </button>
          </div>
          
          {theme === 'custom' && (
            <div className="mt-6 space-y-4 bg-slate-800 p-6 rounded-lg">
              <p className="text-lg font-semibold text-blue-400">{t('enterCustomTheme')}</p>
              <input
                type="text"
                placeholder={t('customPlaceholder')}
                value={customTheme}
                onChange={(e) => setCustomTheme(e.target.value)}
                className="px-4 py-3 bg-slate-700 border-2 border-gray-500 rounded-lg focus:border-blue-500 focus:outline-none transition-colors w-full text-lg"
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && customTheme.trim()) {
                    generateLevel();
                  }
                }}
              />
              <button
                onClick={() => customTheme.trim() && generateLevel()}
                disabled={!customTheme.trim()}
                className="w-full px-6 py-3 bg-gradient-to-r from-green-500 to-blue-600 rounded-lg font-semibold text-lg hover:scale-105 transition-transform duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t('generateLevel', { theme: customTheme || 'Custom' })}
              </button>
              <div className="text-sm text-gray-400 mt-2 space-y-1">
                <p>{t('customTip1')}</p>
                <p>{t('customTip2')}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {isGenerating && (
        <div className="text-center space-y-4 animate-fade-in">
          <Sparkles className="w-16 h-16 mx-auto animate-pulse text-yellow-400" />
          <h2 className="text-3xl font-bold">{t('generatingLevel')}</h2>
          <p className="text-gray-300">{t('creatingExperience', { theme: theme === 'custom' ? customTheme : theme })}</p>
          <p className="text-sm text-gray-400">{t('buildingChallenges')}</p>
        </div>
      )}

      {gameState === 'playing' && (
        <div className="relative">
          <div className="absolute top-4 left-4 right-4 flex justify-between z-10">
            <div className="bg-slate-800/80 backdrop-blur px-4 py-2 rounded-lg">
              <p className="text-sm">{t('levelLabel', { level })}</p>
              <p className="font-bold">{levelData?.levelName}</p>
              <p className="text-xs text-gray-400">{levelData?.levelDescription}</p>
            </div>
            <div className="bg-slate-800/80 backdrop-blur px-4 py-2 rounded-lg">
              <p className="text-sm">{t('scoreLabel', { score })}</p>
              <div className="flex gap-1 mt-1">
                {Array.from({ length: lives }, (_, i) => (
                  <Heart key={i} className="w-5 h-5 text-red-500 fill-red-500" />
                ))}
              </div>
            </div>
          </div>
          <canvas
            ref={canvasRef}
            width={800}
            height={600}
            className="border-2 border-slate-600 rounded-lg shadow-2xl"
          />
          <div className="mt-2 text-center text-sm text-gray-400">
            {t('progressHint')}
          </div>
        </div>
      )}

      {gameState === 'levelComplete' && (
        <div className="text-center space-y-6 animate-fade-in">
          <Zap className="w-20 h-20 mx-auto text-yellow-400 animate-bounce" />
          <h2 className="text-4xl font-bold">{t('levelComplete')}</h2>
          <div className="space-y-2">
            <p className="text-2xl">{t('scoreLabel', { score })}</p>
            <p className="text-lg text-gray-300">
              {t('collectiblesCount', { collected: gameRefs.current.collectedItems.size, total: levelData?.collectibles.length || 0 })}
            </p>
            <p className="text-lg text-gray-300">
              {t('enemiesDefeated', { defeated: gameRefs.current.defeatedEnemies.size, total: levelData?.enemies.length || 0 })}
            </p>
          </div>
          <button
            onClick={nextLevel}
            className="px-8 py-4 bg-gradient-to-r from-green-500 to-blue-600 rounded-lg font-semibold text-lg hover:scale-105 transition-transform duration-200 shadow-lg hover:shadow-xl"
          >
            {t('nextLevel')}
          </button>
        </div>
      )}

      {gameState === 'gameOver' && (
        <div className="text-center space-y-6 animate-fade-in">
          <Skull className="w-20 h-20 mx-auto text-red-400" />
          <h2 className="text-4xl font-bold text-red-400">{t('gameOver')}</h2>
          <p className="text-xl">{t('scoreLabel', { score })}</p>
          <p className="text-lg text-gray-300">{t('levelLabel', { level })} - {levelData?.levelName || theme}</p>
          <div className="space-y-3">
            <button
              onClick={restartLevel}
              className="block w-64 mx-auto px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg font-semibold text-lg hover:scale-105 transition-transform duration-200 shadow-lg hover:shadow-xl"
            >
              {t('retryLevel')}
            </button>
            <button
              onClick={resetGame}
              className="block w-64 mx-auto px-6 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg font-semibold hover:scale-105 transition-transform duration-200"
            >
              {t('backToMenu')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlatformerGame;