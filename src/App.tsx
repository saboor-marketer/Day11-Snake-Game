import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  ArenaMode,
  DigestWave,
  Direction,
  FloatingPopup,
  FoodItem,
  GameState,
  GridFlash,
  LeaderboardEntry,
  Particle,
  Point,
  SessionStats,
  ShockwaveRing,
  SpeedPreset,
} from './types/game';
import { GRID_SIZE, renderArena } from './utils/canvasRenderer';
import { soundEngine } from './utils/soundEngine';
import {
  loadLeaderboard,
  loadSettings,
  resetLeaderboard,
  saveScoreToLeaderboard,
  saveSettings,
  updateEntryCallsign,
} from './utils/storage';
import { TopHud } from './components/TopHud';
import { TouchDpad } from './components/TouchDpad';
import { StateOverlays } from './components/StateOverlays';

const OPPOSITE_DIR: Record<Direction, Direction> = {
  UP: 'DOWN',
  DOWN: 'UP',
  LEFT: 'RIGHT',
  RIGHT: 'LEFT',
};

const DIR_VECTORS: Record<Direction, Point> = {
  UP: { x: 0, y: -1 },
  DOWN: { x: 0, y: 1 },
  LEFT: { x: -1, y: 0 },
  RIGHT: { x: 1, y: 0 },
};

const COMBO_WINDOW_MS = 4800;
const GOLDEN_DURATION_MS = 7500;

function isSamePoint(a: Point, b: Point): boolean {
  return a.x === b.x && a.y === b.y;
}

function getFreeCell(
  snake: Point[],
  foods: FoodItem[],
  preferredQuadrant?: { minX: number; maxX: number; minY: number; maxY: number }
): Point {
  const occupied = new Set<string>();
  for (const s of snake) occupied.add(`${s.x},${s.y}`);
  for (const f of foods) occupied.add(`${f.x},${f.y}`);

  if (preferredQuadrant) {
    const candidates: Point[] = [];
    for (let x = preferredQuadrant.minX; x <= preferredQuadrant.maxX; x++) {
      for (let y = preferredQuadrant.minY; y <= preferredQuadrant.maxY; y++) {
        if (!occupied.has(`${x},${y}`)) {
          candidates.push({ x, y });
        }
      }
    }
    if (candidates.length > 0) {
      return candidates[Math.floor(Math.random() * candidates.length)];
    }
  }

  const allFree: Point[] = [];
  for (let x = 0; x < GRID_SIZE; x++) {
    for (let y = 0; y < GRID_SIZE; y++) {
      if (!occupied.has(`${x},${y}`)) {
        allFree.push({ x, y });
      }
    }
  }

  if (allFree.length === 0) return { x: 0, y: 0 };
  return allFree[Math.floor(Math.random() * allFree.length)];
}

export function App() {
  // Load initial persistent settings & leaderboard
  const initialSettings = useRef(loadSettings());

  const [gameState, setGameState] = useState<GameState>('START');
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(() => {
    const lb = loadLeaderboard();
    return lb.length > 0 ? lb[0].score : 0;
  });
  const [combo, setCombo] = useState<number>(1);
  const [comboProgress, setComboProgress] = useState<number>(0);
  const [scorePop, setScorePop] = useState<boolean>(false);
  const [currentDirUi, setCurrentDirUi] = useState<Direction>('RIGHT');

  // Settings states
  const [muted, setMuted] = useState<boolean>(initialSettings.current.muted);
  const [screenShake, setScreenShake] = useState<boolean>(
    initialSettings.current.screenShake
  );
  const [arenaMode, setArenaMode] = useState<ArenaMode>(
    initialSettings.current.arenaMode
  );
  const [speedPreset, setSpeedPreset] = useState<SpeedPreset>(
    initialSettings.current.speedPreset
  );
  const [callsign, setCallsign] = useState<string>(
    initialSettings.current.callsign
  );
  const [showDpad, setShowDpad] = useState<boolean>(() => {
    if (initialSettings.current.forceShowDpad) return true;
    if (typeof window !== 'undefined') {
      return (
        window.matchMedia('(pointer: coarse)').matches ||
        window.innerWidth < 680
      );
    }
    return false;
  });

  // Leaderboard & Run Telemetry
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(() =>
    loadLeaderboard()
  );
  const [lastRunRank, setLastRunRank] = useState<number | null>(null);
  const [lastRunEntryId, setLastRunEntryId] = useState<string | null>(null);
  const [sessionStats, setSessionStats] = useState<SessionStats>({
    score: 0,
    foodEaten: 0,
    goldenEaten: 0,
    maxCombo: 1,
    length: 4,
    survivalTimeMs: 0,
    causeOfDeath: 'NONE',
  });

  // Responsive Square Canvas Dimension
  const stageWrapperRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [canvasPx, setCanvasPx] = useState<number>(480);

  // Screen shake CSS offset state/ref for ultra-smooth 60fps transform
  const arenaFrameRef = useRef<HTMLDivElement | null>(null);

  // Mutable Game Engine State inside Ref for 60fps loop without React re-render overhead
  const engineRef = useRef<{
    gameState: GameState;
    snake: Point[];
    prevSnake: Point[];
    direction: Direction;
    inputQueue: Direction[];
    foods: FoodItem[];
    particles: Particle[];
    shockwaves: ShockwaveRing[];
    gridFlashes: GridFlash[];
    popups: FloatingPopup[];
    digestWaves: DigestWave[];
    score: number;
    combo: number;
    maxCombo: number;
    comboExpireTime: number;
    foodEatenCount: number;
    goldenEatenCount: number;
    lastTickTime: number;
    tickDuration: number;
    runStartTime: number;
    pausedAtTime: number;
    hitStopUntil: number;
    shakeIntensity: number;
    deathFlashAlpha: number;
    isDead: boolean;
    causeOfDeath: 'WALL' | 'SELF' | 'NONE';
    arenaMode: ArenaMode;
    speedPreset: SpeedPreset;
    screenShakeEnabled: boolean;
    popupIdCounter: number;
  }>({
    gameState: 'START',
    snake: [
      { x: 7, y: 10 },
      { x: 6, y: 10 },
      { x: 5, y: 10 },
      { x: 4, y: 10 },
    ],
    prevSnake: [
      { x: 6, y: 10 },
      { x: 5, y: 10 },
      { x: 4, y: 10 },
      { x: 3, y: 10 },
    ],
    direction: 'RIGHT',
    inputQueue: [],
    foods: [
      {
        x: 13,
        y: 10,
        kind: 'STANDARD',
        spawnTime: performance.now(),
        points: 100,
      },
    ],
    particles: [],
    shockwaves: [],
    gridFlashes: [],
    popups: [],
    digestWaves: [],
    score: 0,
    combo: 1,
    maxCombo: 1,
    comboExpireTime: 0,
    foodEatenCount: 0,
    goldenEatenCount: 0,
    lastTickTime: performance.now(),
    tickDuration: 112,
    runStartTime: performance.now(),
    pausedAtTime: 0,
    hitStopUntil: 0,
    shakeIntensity: 0,
    deathFlashAlpha: 0,
    isDead: false,
    causeOfDeath: 'NONE',
    arenaMode: initialSettings.current.arenaMode,
    speedPreset: initialSettings.current.speedPreset,
    screenShakeEnabled: initialSettings.current.screenShake,
    popupIdCounter: 1,
  });

  // Sync mute state with soundEngine
  useEffect(() => {
    soundEngine.setMuted(muted);
  }, [muted]);

  // Sync settings refs
  useEffect(() => {
    engineRef.current.arenaMode = arenaMode;
    engineRef.current.speedPreset = speedPreset;
    engineRef.current.screenShakeEnabled = screenShake;
  }, [arenaMode, speedPreset, screenShake]);

  // Measure available viewport space to keep the square playfield crisp and centered within 100dvh
  useEffect(() => {
    const updateSize = () => {
      if (!stageWrapperRef.current) return;
      const rect = stageWrapperRef.current.getBoundingClientRect();
      const maxByContainer = Math.min(rect.width, rect.height);
      const clamped = Math.max(260, Math.min(580, Math.floor(maxByContainer)));
      setCanvasPx(clamped);
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    if (stageWrapperRef.current) {
      observer.observe(stageWrapperRef.current);
    }
    window.addEventListener('resize', updateSize);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateSize);
    };
  }, [showDpad]);

  // Compute dynamic tick speed based on snake length and speed preset
  const computeTickDuration = useCallback(
    (foodCount: number, preset: SpeedPreset): number => {
      const base = preset === 'TURBO' ? 88 : 114;
      const minTick = preset === 'TURBO' ? 52 : 64;
      // Smoothly accelerate over the first 25 pickups
      const reduction = Math.min(base - minTick, foodCount * 1.85);
      return Math.round(base - reduction);
    },
    []
  );

  // Spawn directional particle burst
  const spawnBurst = useCallback(
    (
      gridX: number,
      gridY: number,
      colors: string[],
      count: number = 22,
      speedMultiplier: number = 1
    ) => {
      const eng = engineRef.current;
      const cx = gridX + 0.5;
      const cy = gridY + 0.5;

      for (let i = 0; i < count; i++) {
        const angle =
          (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.45;
        const speed = (2.2 + Math.random() * 5.8) * speedMultiplier;
        const life = 340 + Math.random() * 240;
        const shapes: Particle['shape'][] = ['SPARK', 'SQUARE', 'CIRCLE'];
        eng.particles.push({
          x: cx,
          y: cy,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: 2.2 + Math.random() * 2.8,
          color: colors[i % colors.length],
          alpha: 1,
          life,
          maxLife: life,
          shape: shapes[i % shapes.length],
          rotation: angle,
          vRot: (Math.random() - 0.5) * 0.16,
        });
      }
    },
    []
  );

  // Initialize / Reset a Playable Run
  const startNewRun = useCallback(() => {
    const now = performance.now();
    const eng = engineRef.current;

    const initialSnake: Point[] = [
      { x: 6, y: 10 },
      { x: 5, y: 10 },
      { x: 4, y: 10 },
      { x: 3, y: 10 },
    ];
    const initialPrev: Point[] = [
      { x: 5, y: 10 },
      { x: 4, y: 10 },
      { x: 3, y: 10 },
      { x: 2, y: 10 },
    ];

    // Place the very first energy core right in front of the player (x: 11..14, y: 8..12)
    // so the core loop is immediately rewarding within the first 2 seconds!
    const firstFoodPos = getFreeCell(initialSnake, [], {
      minX: 11,
      maxX: 14,
      minY: 8,
      maxY: 12,
    });

    eng.gameState = 'PLAYING';
    eng.snake = initialSnake;
    eng.prevSnake = initialPrev;
    eng.direction = 'RIGHT';
    eng.inputQueue = [];
    eng.foods = [
      {
        x: firstFoodPos.x,
        y: firstFoodPos.y,
        kind: 'STANDARD',
        spawnTime: now,
        points: 100,
      },
    ];
    eng.particles = [];
    eng.shockwaves = [
      {
        x: 6.5,
        y: 10.5,
        radius: 0.3,
        maxRadius: 3.2,
        color: '#10B981',
        life: 380,
        maxLife: 380,
        lineWidth: 3,
      },
    ];
    eng.gridFlashes = [];
    eng.popups = [];
    eng.digestWaves = [];
    eng.score = 0;
    eng.combo = 1;
    eng.maxCombo = 1;
    eng.comboExpireTime = 0;
    eng.foodEatenCount = 0;
    eng.goldenEatenCount = 0;
    eng.lastTickTime = now;
    eng.tickDuration = computeTickDuration(0, eng.speedPreset);
    eng.runStartTime = now;
    eng.hitStopUntil = 0;
    eng.shakeIntensity = 0;
    eng.deathFlashAlpha = 0;
    eng.isDead = false;
    eng.causeOfDeath = 'NONE';

    setScore(0);
    setCombo(1);
    setComboProgress(0);
    setCurrentDirUi('RIGHT');
    setLastRunRank(null);
    setLastRunEntryId(null);
    setGameState('PLAYING');

    soundEngine.playStart();
  }, [computeTickDuration]);

  // Queue a directional turn with 2-Step Input Buffering
  const queueDirection = useCallback((newDir: Direction) => {
    const eng = engineRef.current;
    if (eng.gameState !== 'PLAYING') return;

    // Determine the reference direction (last queued turn, or current moving direction)
    const lastScheduledDir =
      eng.inputQueue.length > 0
        ? eng.inputQueue[eng.inputQueue.length - 1]
        : eng.direction;

    // Ignore redundant same-direction or illegal 180-degree self-reversal
    if (newDir === lastScheduledDir || newDir === OPPOSITE_DIR[lastScheduledDir]) {
      return;
    }

    // Buffer up to 2 rapid turns per tick
    if (eng.inputQueue.length < 2) {
      eng.inputQueue.push(newDir);
      const dirIdx =
        newDir === 'UP' ? 0 : newDir === 'RIGHT' ? 1 : newDir === 'DOWN' ? 2 : 3;
      soundEngine.playTurn(dirIdx);
    }
  }, []);

  // Autonomous AI heuristic for the Start Screen background demo snake
  const computeAiDemoDirection = useCallback((): Direction => {
    const eng = engineRef.current;
    const head = eng.snake[0];
    const target = eng.foods[0] || { x: 10, y: 10 };
    const possibleDirs: Direction[] = ['UP', 'DOWN', 'LEFT', 'RIGHT'].filter(
      (d) => d !== OPPOSITE_DIR[eng.direction]
    ) as Direction[];

    const occupied = new Set<string>();
    // Exclude tail since it moves out of the way
    for (let i = 0; i < eng.snake.length - 1; i++) {
      occupied.add(`${eng.snake[i].x},${eng.snake[i].y}`);
    }

    let bestDir = eng.direction;
    let bestScore = Infinity;

    for (const dir of possibleDirs) {
      const vec = DIR_VECTORS[dir];
      const nx = (head.x + vec.x + GRID_SIZE) % GRID_SIZE;
      const ny = (head.y + vec.y + GRID_SIZE) % GRID_SIZE;

      // Avoid walls on demo screen for clean visual framing
      if (
        head.x + vec.x < 0 ||
        head.x + vec.x >= GRID_SIZE ||
        head.y + vec.y < 0 ||
        head.y + vec.y >= GRID_SIZE
      ) {
        continue;
      }

      if (occupied.has(`${nx},${ny}`)) continue;

      const dist = Math.abs(nx - target.x) + Math.abs(ny - target.y);
      if (dist < bestScore) {
        bestScore = dist;
        bestDir = dir;
      }
    }

    return bestDir;
  }, []);

  // Pause / Resume Handler
  const handleTogglePause = useCallback(() => {
    const eng = engineRef.current;
    const now = performance.now();
    if (eng.gameState === 'PLAYING') {
      eng.gameState = 'PAUSED';
      eng.pausedAtTime = now;
      setSessionStats({
        score: eng.score,
        foodEaten: eng.foodEatenCount,
        goldenEaten: eng.goldenEatenCount,
        maxCombo: eng.maxCombo,
        length: eng.snake.length,
        survivalTimeMs: now - eng.runStartTime,
        causeOfDeath: 'NONE',
      });
      setGameState('PAUSED');
      soundEngine.playButton();
    } else if (eng.gameState === 'PAUSED') {
      const pauseDelta = now - eng.pausedAtTime;
      eng.lastTickTime += pauseDelta;
      eng.runStartTime += pauseDelta;
      if (eng.comboExpireTime > 0) eng.comboExpireTime += pauseDelta;
      for (const f of eng.foods) {
        f.spawnTime += pauseDelta;
      }
      eng.gameState = 'PLAYING';
      setGameState('PLAYING');
      soundEngine.playButton();
    }
  }, []);

  // Global Keyboard Shortcuts (WASD, Arrows, Space, Enter, P, Esc, M)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing inside an input element (like Callsign box)
      if (
        document.activeElement &&
        document.activeElement.tagName === 'INPUT'
      ) {
        return;
      }

      const key = e.key;
      const lower = key.toLowerCase();

      // Directional Controls
      if (key === 'ArrowUp' || lower === 'w') {
        e.preventDefault();
        queueDirection('UP');
        return;
      }
      if (key === 'ArrowDown' || lower === 's') {
        e.preventDefault();
        queueDirection('DOWN');
        return;
      }
      if (key === 'ArrowLeft' || lower === 'a') {
        e.preventDefault();
        queueDirection('LEFT');
        return;
      }
      if (key === 'ArrowRight' || lower === 'd') {
        e.preventDefault();
        queueDirection('RIGHT');
        return;
      }

      // Instant Start / Instant Restart with Space or Enter
      if (key === ' ' || key === 'Enter') {
        const st = engineRef.current.gameState;
        if (st === 'START' || st === 'GAME_OVER') {
          e.preventDefault();
          startNewRun();
          return;
        }
      }

      // Pause / Resume with P or Escape
      if (lower === 'p' || key === 'Escape') {
        const st = engineRef.current.gameState;
        if (st === 'PLAYING' || st === 'PAUSED') {
          e.preventDefault();
          handleTogglePause();
          return;
        }
      }

      // Quick Restart from Pause with R
      if (lower === 'r' && engineRef.current.gameState === 'PAUSED') {
        e.preventDefault();
        startNewRun();
        return;
      }

      // Audio Mute Toggle with M
      if (lower === 'm') {
        e.preventDefault();
        setMuted((prev) => {
          const next = !prev;
          saveSettings({ muted: next });
          return next;
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [queueDirection, startNewRun, handleTogglePause]);

  // Continuous Touch Swipe Gesture Handler on the Playfield Canvas
  const touchAnchorRef = useRef<{ x: number; y: number } | null>(null);

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (engineRef.current.gameState !== 'PLAYING') return;
    const touch = e.touches[0];
    if (!touch) return;
    touchAnchorRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (engineRef.current.gameState !== 'PLAYING' || !touchAnchorRef.current) {
      return;
    }
    const touch = e.touches[0];
    if (!touch) return;

    const dx = touch.clientX - touchAnchorRef.current.x;
    const dy = touch.clientY - touchAnchorRef.current.y;
    const SWIPE_THRESHOLD = 18; // Responsive low-latency swipe threshold

    if (Math.abs(dx) < SWIPE_THRESHOLD && Math.abs(dy) < SWIPE_THRESHOLD) {
      return;
    }

    if (Math.abs(dx) > Math.abs(dy)) {
      queueDirection(dx > 0 ? 'RIGHT' : 'LEFT');
    } else {
      queueDirection(dy > 0 ? 'DOWN' : 'UP');
    }

    // Re-anchor to current finger coordinate so continuous multi-turn swipes work without lifting thumb
    touchAnchorRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = () => {
    touchAnchorRef.current = null;
  };

  // Primary 60fps Game Loop (Logical Step + Particle Physics + Canvas Render)
  useEffect(() => {
    let animationFrameId: number;
    let lastFrameTime = performance.now();

    const stepLogicalTick = (now: number) => {
      const eng = engineRef.current;
      const isDemo = eng.gameState === 'START';

      // Determine next movement direction
      let nextDir = eng.direction;
      if (isDemo) {
        nextDir = computeAiDemoDirection();
      } else if (eng.inputQueue.length > 0) {
        nextDir = eng.inputQueue.shift()!;
      }

      const dirChanged = nextDir !== eng.direction;
      eng.direction = nextDir;
      if (!isDemo) {
        setCurrentDirUi(nextDir);
      }

      const head = eng.snake[0];
      const vec = DIR_VECTORS[nextDir];
      let nextX = head.x + vec.x;
      let nextY = head.y + vec.y;

      // Subtle grid flash on sharp turns
      if (dirChanged && !isDemo) {
        eng.gridFlashes.push({
          x: head.x,
          y: head.y,
          color: 'rgba(56, 189, 248, 1)',
          life: 220,
          maxLife: 220,
        });
      }

      // Check Wall Boundary
      if (
        nextX < 0 ||
        nextX >= GRID_SIZE ||
        nextY < 0 ||
        nextY >= GRID_SIZE
      ) {
        if (eng.arenaMode === 'WRAP' || isDemo) {
          nextX = (nextX + GRID_SIZE) % GRID_SIZE;
          nextY = (nextY + GRID_SIZE) % GRID_SIZE;
        } else {
          // Fatal Wall Collision!
          triggerFatalCollision(now, 'WALL', head.x, head.y);
          return;
        }
      }

      const newHead: Point = { x: nextX, y: nextY };

      // Check if eating any food item
      const eatenIndex = eng.foods.findIndex((f) => isSamePoint(f, newHead));
      const willGrow = eatenIndex !== -1;

      // Check Self-Collision (ignoring the tail tip if we don't grow this tick)
      const checkLen = willGrow ? eng.snake.length : eng.snake.length - 1;
      for (let i = 0; i < checkLen; i++) {
        if (isSamePoint(eng.snake[i], newHead)) {
          if (isDemo) {
            // Reset demo snake cleanly if trapped
            eng.snake = [
              { x: 7, y: 10 },
              { x: 6, y: 10 },
              { x: 5, y: 10 },
              { x: 4, y: 10 },
            ];
            eng.prevSnake = [...eng.snake];
            return;
          } else {
            triggerFatalCollision(now, 'SELF', newHead.x, newHead.y);
            return;
          }
        }
      }

      // Save previous positions for smooth 60fps sub-pixel interpolation
      eng.prevSnake = eng.snake.map((p) => ({ ...p }));

      // Advance snake segments
      const nextSnake = [newHead, ...eng.snake];
      if (!willGrow) {
        nextSnake.pop();
      } else if ( isDemo && nextSnake.length > 12 ) {
        // Keep demo snake at a sleek length of 12
        nextSnake.pop();
      }
      eng.snake = nextSnake;

      // Thruster mote particle when at high combo (3x+)
      if (!isDemo && eng.combo >= 3) {
        const tail = eng.snake[eng.snake.length - 1];
        eng.particles.push({
          x: tail.x + 0.5 + (Math.random() - 0.5) * 0.3,
          y: tail.y + 0.5 + (Math.random() - 0.5) * 0.3,
          vx: (Math.random() - 0.5) * 1.2,
          vy: (Math.random() - 0.5) * 1.2,
          size: 2.0,
          color: eng.combo >= 5 ? '#F59E0B' : '#10B981',
          alpha: 0.85,
          life: 240,
          maxLife: 240,
          shape: 'SQUARE',
          rotation: 0,
          vRot: 0,
        });
      }

      // Handle Food Pickup!
      if (willGrow) {
        const eatenFood = eng.foods[eatenIndex];
        eng.foods.splice(eatenIndex, 1);

        const isGolden = eatenFood.kind === 'GOLDEN';

        if (isDemo) {
          // Demo visual burst
          spawnBurst(
            newHead.x,
            newHead.y,
            ['#F43F5E', '#FB7185', '#10B981'],
            16,
            0.85
          );
          eng.shockwaves.push({
            x: newHead.x + 0.5,
            y: newHead.y + 0.5,
            radius: 0.25,
            maxRadius: 2.4,
            color: '#F43F5E',
            life: 360,
            maxLife: 360,
            lineWidth: 2.2,
          });
          eng.digestWaves.push({
            segmentIndexFloat: 0,
            speed: 14,
            color: '#34D399',
            intensity: 1,
          });
          const nextDemoFood = getFreeCell(eng.snake, eng.foods);
          eng.foods.push({
            x: nextDemoFood.x,
            y: nextDemoFood.y,
            kind: 'STANDARD',
            spawnTime: now,
            points: 100,
          });
          return;
        }

        // Update Combo Multiplier
        const isChainActive = now < eng.comboExpireTime;
        const nextCombo = isChainActive
          ? Math.min(8, eng.combo + (isGolden ? 2 : 1))
          : isGolden
          ? 2
          : 1;

        eng.combo = nextCombo;
        eng.maxCombo = Math.max(eng.maxCombo, nextCombo);
        eng.comboExpireTime = now + COMBO_WINDOW_MS;

        const basePoints = isGolden ? 250 : 100;
        const earnedPoints = basePoints * nextCombo;
        eng.score += earnedPoints;

        if (isGolden) {
          eng.goldenEatenCount += 1;
          eng.hitStopUntil = now + 35; // Brief celebratory hit-stop on Golden Core
        } else {
          eng.foodEatenCount += 1;
        }

        // Update tick speed smoothly
        eng.tickDuration = computeTickDuration(
          eng.foodEatenCount,
          eng.speedPreset
        );

        // Screen Shake
        if (eng.screenShakeEnabled) {
          eng.shakeIntensity = Math.min(
            10,
            isGolden ? 6.5 : 3.2 + (nextCombo - 1) * 0.45
          );
        }

        // Audio Chime
        soundEngine.playEat(nextCombo, isGolden);

        // Particles & Shockwaves
        if (isGolden) {
          spawnBurst(
            newHead.x,
            newHead.y,
            ['#F59E0B', '#FBBF24', '#FEF3C7', '#10B981'],
            32,
            1.25
          );
          eng.shockwaves.push({
            x: newHead.x + 0.5,
            y: newHead.y + 0.5,
            radius: 0.2,
            maxRadius: 4.0,
            color: '#F59E0B',
            life: 480,
            maxLife: 480,
            lineWidth: 3.5,
          });
        } else {
          spawnBurst(
            newHead.x,
            newHead.y,
            ['#F43F5E', '#FB7185', '#10B981', '#FFF1F2'],
            22,
            1.0
          );
          eng.shockwaves.push({
            x: newHead.x + 0.5,
            y: newHead.y + 0.5,
            radius: 0.2,
            maxRadius: 2.6 + nextCombo * 0.15,
            color: nextCombo >= 4 ? '#F59E0B' : '#F43F5E',
            life: 390,
            maxLife: 390,
            lineWidth: 2.5,
          });
        }

        // Grid Cell Illumination Flash
        eng.gridFlashes.push({
          x: newHead.x,
          y: newHead.y,
          color: isGolden ? 'rgba(245, 158, 11, 1)' : 'rgba(244, 63, 94, 1)',
          life: 340,
          maxLife: 340,
        });

        // Digest Pulse Wave traveling down the snake's body
        eng.digestWaves.push({
          segmentIndexFloat: 0,
          speed: 15,
          color: isGolden ? '#FBBF24' : '#34D399',
          intensity: isGolden ? 1.35 : 1.0,
        });

        // Floating Score Popup on Canvas
        eng.popups.push({
          id: eng.popupIdCounter++,
          x: newHead.x,
          y: newHead.y,
          text: `+${earnedPoints}`,
          subText:
            isGolden
              ? `OVERDRIVE ${nextCombo}x!`
              : nextCombo > 1
              ? `CHAIN ${nextCombo}x`
              : undefined,
          color: isGolden
            ? '#FBBF24'
            : nextCombo >= 4
            ? '#F59E0B'
            : '#34D399',
          life: 750,
          maxLife: 750,
          scale: isGolden ? 1.25 : nextCombo >= 3 ? 1.12 : 1.0,
        });

        // Ensure a Standard Energy Core is always on the board
        const hasStandard = eng.foods.some((f) => f.kind === 'STANDARD');
        if (!hasStandard) {
          const nextPos = getFreeCell(eng.snake, eng.foods);
          eng.foods.push({
            x: nextPos.x,
            y: nextPos.y,
            kind: 'STANDARD',
            spawnTime: now,
            points: 100,
          });
        }

        // Every 3rd standard food eaten, spawn a bonus timed Golden Solar Core!
        const hasGolden = eng.foods.some((f) => f.kind === 'GOLDEN');
        if (
          !isGolden &&
          !hasGolden &&
          eng.foodEatenCount > 0 &&
          eng.foodEatenCount % 3 === 0
        ) {
          const goldenPos = getFreeCell(eng.snake, eng.foods);
          eng.foods.push({
            x: goldenPos.x,
            y: goldenPos.y,
            kind: 'GOLDEN',
            spawnTime: now,
            duration: GOLDEN_DURATION_MS,
            points: 250,
          });
          eng.shockwaves.push({
            x: goldenPos.x + 0.5,
            y: goldenPos.y + 0.5,
            radius: 2.2,
            maxRadius: 0.3,
            color: '#F59E0B',
            life: 320,
            maxLife: 320,
            lineWidth: 2,
          });
          soundEngine.playGoldenSpawn();
        }

        // Sync React HUD state
        setScore(eng.score);
        setCombo(eng.combo);
        setScorePop(true);
        setTimeout(() => setScorePop(false), 160);
      }
    };

    const triggerFatalCollision = (
      now: number,
      cause: 'WALL' | 'SELF',
      crashX: number,
      crashY: number
    ) => {
      const eng = engineRef.current;
      eng.isDead = true;
      eng.causeOfDeath = cause;
      eng.hitStopUntil = now + 70; // Crisp 70ms impact hit-stop
      eng.deathFlashAlpha = 1.0;

      if (eng.screenShakeEnabled) {
        eng.shakeIntensity = 12;
      }

      soundEngine.playCrash();
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        try {
          navigator.vibrate([40, 30, 60]);
        } catch {
          // Ignore
        }
      }

      // Critical Red shatter burst
      spawnBurst(
        crashX,
        crashY,
        ['#EF4444', '#F87171', '#FCA5A5', '#F59E0B'],
        36,
        1.35
      );
      eng.shockwaves.push({
        x: crashX + 0.5,
        y: crashY + 0.5,
        radius: 0.2,
        maxRadius: 4.5,
        color: '#EF4444',
        life: 520,
        maxLife: 520,
        lineWidth: 4,
      });

      const survivalTimeMs = now - eng.runStartTime;
      const finalScore = eng.score;
      const finalMaxCombo = eng.maxCombo;
      const finalLen = eng.snake.length;

      // Save to persistent Top 5 Leaderboard
      const result = saveScoreToLeaderboard({
        callsign: loadSettings().callsign || 'VPR',
        score: finalScore,
        maxCombo: finalMaxCombo,
        length: finalLen,
        mode: eng.arenaMode,
      });

      setLeaderboard(result.entries);
      if (result.entries.length > 0) {
        setHighScore(result.entries[0].score);
      }
      setLastRunRank(result.rank);
      setLastRunEntryId(result.madeTopFive ? result.newEntryId : null);

      setSessionStats({
        score: finalScore,
        foodEaten: eng.foodEatenCount,
        goldenEaten: eng.goldenEatenCount,
        maxCombo: finalMaxCombo,
        length: finalLen,
        survivalTimeMs,
        causeOfDeath: cause,
      });

      // Transition to GAME_OVER overlay after brief hit-stop so player sees the exact impact
      setTimeout(() => {
        eng.gameState = 'GAME_OVER';
        setGameState('GAME_OVER');
      }, 240);
    };

    const renderLoop = (now: number) => {
      const dt = Math.min(50, now - lastFrameTime);
      lastFrameTime = now;

      const eng = engineRef.current;

      // 1. Update Combo Timer & Expired Timed Golden Cores during active gameplay
      if (eng.gameState === 'PLAYING' && !eng.isDead) {
        if (eng.combo > 1 && eng.comboExpireTime > 0) {
          const remaining = eng.comboExpireTime - now;
          if (remaining <= 0) {
            eng.combo = 1;
            eng.comboExpireTime = 0;
            setCombo(1);
            setComboProgress(0);
          } else {
            setComboProgress(remaining / COMBO_WINDOW_MS);
          }
        } else {
          setComboProgress(0);
        }

        // Remove expired Golden Cores
        for (let i = eng.foods.length - 1; i >= 0; i--) {
          const f = eng.foods[i];
          if (f.kind === 'GOLDEN' && f.duration) {
            if (now - f.spawnTime >= f.duration) {
              eng.foods.splice(i, 1);
            }
          }
        }
      }

      // 2. Step Logical Grid Ticks (when PLAYING or running START screen AI Demo)
      const isRunningLogic =
        (eng.gameState === 'PLAYING' || eng.gameState === 'START') &&
        !eng.isDead &&
        now >= eng.hitStopUntil;

      if (isRunningLogic) {
        const activeTickDuration =
          eng.gameState === 'START' ? 115 : eng.tickDuration;
        if (now - eng.lastTickTime >= activeTickDuration) {
          eng.lastTickTime = now;
          stepLogicalTick(now);
        }
      }

      // 3. Update Particles, Shockwaves, Digest Waves, Grid Flashes & Popups
      const dtSec = dt / 1000;

      for (let i = eng.particles.length - 1; i >= 0; i--) {
        const p = eng.particles[i];
        p.x += p.vx * dtSec;
        p.y += p.vy * dtSec;
        p.vx *= 0.94;
        p.vy *= 0.94;
        p.rotation += p.vRot;
        p.life -= dt;
        if (p.life <= 0) {
          eng.particles.splice(i, 1);
        }
      }

      for (let i = eng.shockwaves.length - 1; i >= 0; i--) {
        const r = eng.shockwaves[i];
        r.life -= dt;
        if (r.life <= 0) {
          eng.shockwaves.splice(i, 1);
        }
      }

      for (let i = eng.gridFlashes.length - 1; i >= 0; i--) {
        const gf = eng.gridFlashes[i];
        gf.life -= dt;
        if (gf.life <= 0) {
          eng.gridFlashes.splice(i, 1);
        }
      }

      for (let i = eng.popups.length - 1; i >= 0; i--) {
        const pop = eng.popups[i];
        pop.life -= dt;
        if (pop.life <= 0) {
          eng.popups.splice(i, 1);
        }
      }

      for (let i = eng.digestWaves.length - 1; i >= 0; i--) {
        const wave = eng.digestWaves[i];
        wave.segmentIndexFloat += wave.speed * dtSec;
        if (wave.segmentIndexFloat > eng.snake.length + 2) {
          eng.digestWaves.splice(i, 1);
        }
      }

      if (eng.deathFlashAlpha > 0) {
        eng.deathFlashAlpha = Math.max(0, eng.deathFlashAlpha - dtSec * 2.4);
      }

      // 4. Update Damped Screen Shake Transform on Arena Frame
      if (arenaFrameRef.current) {
        if (eng.shakeIntensity > 0.15 && eng.screenShakeEnabled) {
          const sx = (Math.random() - 0.5) * 2 * eng.shakeIntensity;
          const sy = (Math.random() - 0.5) * 2 * eng.shakeIntensity;
          arenaFrameRef.current.style.transform = `translate3d(${sx.toFixed(
            1
          )}px, ${sy.toFixed(1)}px, 0)`;
          eng.shakeIntensity *= Math.pow(0.84, dt / 16.67);
        } else {
          eng.shakeIntensity = 0;
          arenaFrameRef.current.style.transform = 'translate3d(0px, 0px, 0)';
        }
      }

      // 5. Render 60fps Interpolated Playfield onto HiDPI Canvas
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const dpr = Math.min(window.devicePixelRatio || 1, 2);
          const targetW = Math.round(canvasPx * dpr);
          const targetH = Math.round(canvasPx * dpr);
          if (canvas.width !== targetW || canvas.height !== targetH) {
            canvas.width = targetW;
            canvas.height = targetH;
          }

          ctx.save();
          ctx.scale(dpr, dpr);

          const activeTickDur =
            eng.gameState === 'START' ? 115 : eng.tickDuration;
          const rawTickProgress =
            eng.gameState === 'PAUSED'
              ? (eng.pausedAtTime - eng.lastTickTime) / activeTickDur
              : eng.isDead
              ? 1
              : (now - eng.lastTickTime) / activeTickDur;

          renderArena(ctx, canvasPx, canvasPx, {
            snake: eng.snake,
            prevSnake: eng.prevSnake,
            direction: eng.direction,
            tickProgress: Math.max(0, Math.min(1, rawTickProgress)),
            foods: eng.foods,
            particles: eng.particles,
            shockwaves: eng.shockwaves,
            gridFlashes: eng.gridFlashes,
            popups: eng.popups,
            digestWaves: eng.digestWaves,
            combo: eng.combo,
            comboTimerProgress:
              eng.combo > 1
                ? Math.max(0, (eng.comboExpireTime - now) / COMBO_WINDOW_MS)
                : 0,
            arenaMode: eng.arenaMode,
            isDead: eng.isDead,
            deathFlashAlpha: eng.deathFlashAlpha,
            now,
          });

          ctx.restore();
        }
      }

      animationFrameId = requestAnimationFrame(renderLoop);
    };

    animationFrameId = requestAnimationFrame(renderLoop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [canvasPx, computeAiDemoDirection, computeTickDuration, spawnBurst]);

  // Handlers for Settings & Overlays
  const handleToggleMute = () => {
    setMuted((prev) => {
      const next = !prev;
      saveSettings({ muted: next });
      return next;
    });
  };

  const handleToggleScreenShake = () => {
    soundEngine.playButton();
    setScreenShake((prev) => {
      const next = !prev;
      saveSettings({ screenShake: next });
      return next;
    });
  };

  const handleToggleDpad = () => {
    soundEngine.playButton();
    setShowDpad((prev) => {
      const next = !prev;
      saveSettings({ forceShowDpad: next });
      return next;
    });
  };

  const handleChangeArenaMode = (mode: ArenaMode) => {
    soundEngine.playButton();
    setArenaMode(mode);
    saveSettings({ arenaMode: mode });
  };

  const handleChangeSpeedPreset = (preset: SpeedPreset) => {
    soundEngine.playButton();
    setSpeedPreset(preset);
    saveSettings({ speedPreset: preset });
  };

  const handleUpdateCallsign = (val: string) => {
    const clean = val.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 3);
    setCallsign(clean);
    saveSettings({ callsign: clean || 'VPR' });
    if (lastRunEntryId) {
      const updated = updateEntryCallsign(lastRunEntryId, clean || 'VPR');
      setLeaderboard(updated);
    }
  };

  const handleResetLeaderboard = () => {
    soundEngine.playButton();
    const fresh = resetLeaderboard();
    setLeaderboard(fresh);
    setHighScore(fresh[0]?.score || 0);
  };

  const handleQuitToTitle = () => {
    soundEngine.playButton();
    const eng = engineRef.current;
    eng.isDead = false;
    eng.gameState = 'START';
    setGameState('START');
  };

  return (
    <main className="relative w-full h-[100dvh] bg-[#0A0D12] text-[#F8FAFC] flex flex-col items-center justify-between p-2.5 sm:p-5 overflow-hidden select-none">
      {/* Subtle Ambient Background Radial Grid Atmosphere */}
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-60"
        style={{
          background:
            'radial-gradient(circle at 50% 42%, rgba(16, 185, 129, 0.08) 0%, rgba(56, 189, 248, 0.04) 38%, rgba(10, 13, 18, 0) 75%)',
        }}
      />

      {/* Centered Arcade Cabinet Column (max-w-[600px]) */}
      <div className="relative z-10 w-full max-w-[580px] h-full flex flex-col items-center justify-between gap-2 sm:gap-3">
        {/* Top HUD Header Bar */}
        <TopHud
          score={score}
          highScore={highScore}
          combo={combo}
          comboProgress={comboProgress}
          scorePop={scorePop}
          gameState={gameState}
          muted={muted}
          showDpad={showDpad}
          onToggleMute={handleToggleMute}
          onTogglePause={handleTogglePause}
          onToggleDpad={handleToggleDpad}
        />

        {/* Flexible Center Stage Container that measures available square area */}
        <div
          ref={stageWrapperRef}
          className="relative w-full flex-1 min-h-0 flex items-center justify-center"
        >
          {/* Illuminated Arena Frame */}
          <div
            ref={arenaFrameRef}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{ width: canvasPx, height: canvasPx }}
            className={`relative rounded-2xl overflow-hidden border-2 transition-colors duration-200 ${
              gameState === 'GAME_OVER'
                ? 'border-rose-500/50 arena-danger-glow'
                : combo >= 4
                ? 'border-amber-400/50 arena-combo-glow'
                : 'border-sky-400/30 arena-frame-glow'
            }`}
          >
            {/* 60fps HTML5 Playfield Canvas */}
            <canvas
              ref={canvasRef}
              style={{ width: canvasPx, height: canvasPx }}
              className="block w-full h-full cursor-crosshair"
            />

            {/* Subtle CRT Scanline Texture Overlay */}
            <div className="pointer-events-none absolute inset-0 scanline-overlay opacity-25" />

            {/* Corner Telemetry Brackets */}
            <div className="pointer-events-none absolute top-2 left-2.5 flex items-center gap-1.5 text-[10px] font-mono text-slate-400/75 uppercase tracking-widest">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  arenaMode === 'WALLS' ? 'bg-emerald-400' : 'bg-sky-400'
                }`}
              />
              <span>
                {arenaMode === 'WALLS' ? 'WALLS' : 'PHASE WRAP'} //{' '}
                {speedPreset}
              </span>
            </div>

            <div className="pointer-events-none absolute top-2 right-2.5 text-[10px] font-mono text-slate-500 uppercase tracking-widest">
              GRID 20×20
            </div>

            {/* State Overlays (Start Screen, Pause Modal, Game Over & Top 5 Leaderboard) */}
            <StateOverlays
              gameState={gameState}
              arenaMode={arenaMode}
              speedPreset={speedPreset}
              screenShake={screenShake}
              muted={muted}
              callsign={callsign}
              leaderboard={leaderboard}
              sessionStats={sessionStats}
              lastRunRank={lastRunRank}
              lastRunEntryId={lastRunEntryId}
              onStartGame={startNewRun}
              onResumeGame={handleTogglePause}
              onRestartGame={startNewRun}
              onQuitToTitle={handleQuitToTitle}
              onChangeArenaMode={handleChangeArenaMode}
              onChangeSpeedPreset={handleChangeSpeedPreset}
              onToggleScreenShake={handleToggleScreenShake}
              onToggleMute={handleToggleMute}
              onUpdateCallsign={handleUpdateCallsign}
              onResetLeaderboard={handleResetLeaderboard}
            />
          </div>
        </div>

        {/* Bottom Area: Either Touch D-Pad (when active) or Sleek Telemetry Shortcut Bar */}
        {showDpad ? (
          <TouchDpad
            currentDirection={currentDirUi}
            onDirectionInput={queueDirection}
            disabled={gameState !== 'PLAYING'}
          />
        ) : (
          <footer className="w-full px-3 py-1.5 rounded-xl bg-[#141B26]/70 border border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400 shrink-0">
            <div className="flex items-center gap-3">
              <span>
                <strong className="text-slate-200">STEER:</strong> WASD / ARROWS
                / SWIPE
              </span>
              <span className="hidden sm:inline text-slate-600">|</span>
              <span className="hidden sm:inline">
                <strong className="text-slate-200">PAUSE:</strong> [P / ESC]
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span>
                <strong className="text-slate-200">AUDIO:</strong> [M]
              </span>
              <span className="text-slate-600">|</span>
              <span className="text-emerald-400/90">60FPS INTERPOLATED</span>
            </div>
          </footer>
        )}
      </div>
    </main>
  );
}

export default App;
