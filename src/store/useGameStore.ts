import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import {
  PowerUp,
  ActivePowerUp,
  PowerUpType,
  POWER_UP_CONFIGS,
  POWER_UP_SPAWN_CONFIG
} from '@/types/powerup';

export type GameStatus = 'IDLE' | 'RUNNING' | 'PAUSED' | 'GAMEOVER';
export type Direction = [number, number];
export type Coord = [number, number];

interface GameState {
  snake: Coord[];
  food: Coord;
  direction: Direction;
  nextDirection: Direction;
  score: number;
  status: GameStatus;
  gridSize: number;
  speed: number;
  // 道具相关状态
  powerUps: PowerUp[];
  activePowerUps: ActivePowerUp[];
  baseSpeed: number;
  // Actions
  startGame: () => void;
  resetGame: () => void;
  pauseGame: () => void;
  resumeGame: () => void;
  setDirection: (dir: Direction) => void;
  tick: () => void;
  // 道具 Actions
  updatePowerUpEffects: (currentTime: number) => void;
  removeExpiredPowerUps: (currentTime: number) => void;
}

const INITIAL_SNAKE: Coord[] = [[5, 5], [4, 5], [3, 5]];
const INITIAL_DIRECTION: Direction = [1, 0];
const GRID_SIZE = 12;
const INITIAL_SPEED = 300;

const getRandomCoord = (exclude: Coord[]): Coord => {
  let newCoord: Coord;
  const isOccupied = (c: Coord) => exclude.some(s => s[0] === c[0] && s[1] === c[1]);
  do {
    newCoord = [Math.floor(Math.random() * GRID_SIZE), Math.floor(Math.random() * GRID_SIZE)];
  } while (isOccupied(newCoord));
  return newCoord;
};

const getRandomPowerUpType = (): PowerUpType => {
  const types: PowerUpType[] = ['SPEED_UP', 'SLOW_DOWN', 'SHRINK'];
  return types[Math.floor(Math.random() * types.length)];
};

const calculateEffectiveSpeed = (baseSpeed: number, activePowerUps: ActivePowerUp[]): number => {
  let effectiveSpeed = baseSpeed;
  activePowerUps.forEach(active => {
    const config = POWER_UP_CONFIGS[active.type];
    if (config.speedMultiplier) {
      effectiveSpeed *= config.speedMultiplier;
    }
  });
  return Math.max(40, Math.min(600, effectiveSpeed));
};

export const useGameStore = create<GameState>((set, get) => ({
  snake: INITIAL_SNAKE,
  food: [8, 5],
  direction: INITIAL_DIRECTION,
  nextDirection: INITIAL_DIRECTION,
  score: 0,
  status: 'IDLE',
  gridSize: GRID_SIZE,
  speed: INITIAL_SPEED,
  baseSpeed: INITIAL_SPEED,
  powerUps: [],
  activePowerUps: [],

  startGame: () => set({ status: 'RUNNING' }),
  pauseGame: () => set({ status: 'PAUSED' }),
  resumeGame: () => set({ status: 'RUNNING' }),

  resetGame: () => set({
    snake: INITIAL_SNAKE,
    food: getRandomCoord(INITIAL_SNAKE),
    direction: INITIAL_DIRECTION,
    nextDirection: INITIAL_DIRECTION,
    score: 0,
    status: 'RUNNING',
    speed: INITIAL_SPEED,
    baseSpeed: INITIAL_SPEED,
    powerUps: [],
    activePowerUps: [],
  }),

  setDirection: (dir: Direction) => {
    const currentDir = get().direction;
    if (dir[0] === -currentDir[0] && dir[1] === -currentDir[1]) return;
    set({ nextDirection: dir });
  },

  tick: () => {
    const { snake, nextDirection, food, gridSize, status, score, baseSpeed, powerUps, activePowerUps } = get();
    if (status !== 'RUNNING') return;

    const head = snake[0];
    const newHead: Coord = [head[0] + nextDirection[0], head[1] + nextDirection[1]];

    // Wall collision
    if (newHead[0] < 0 || newHead[0] >= gridSize || newHead[1] < 0 || newHead[1] >= gridSize) {
      set({ status: 'GAMEOVER' });
      return;
    }

    // Self collision
    if (snake.some(segment => segment[0] === newHead[0] && segment[1] === newHead[1])) {
      set({ status: 'GAMEOVER' });
      return;
    }

    const newSnake = [newHead, ...snake];
    const ateFood = newHead[0] === food[0] && newHead[1] === food[1];

    // Check if collected power-up
    const collectedPowerUp = powerUps.find(p => p.position[0] === newHead[0] && p.position[1] === newHead[1]);

    if (ateFood) {
      const newBaseSpeed = Math.max(80, baseSpeed - 2);
      const effectiveSpeed = calculateEffectiveSpeed(newBaseSpeed, activePowerUps);

      // Maybe spawn power-up
      let newPowerUps = [...powerUps];
      if (
        Math.random() < POWER_UP_SPAWN_CONFIG.spawnProbability &&
        newPowerUps.length < POWER_UP_SPAWN_CONFIG.maxPowerUpsOnBoard
      ) {
        const newPowerUp: PowerUp = {
          id: uuidv4(),
          type: getRandomPowerUpType(),
          position: getRandomCoord([...newSnake, food]),
          spawnedAt: Date.now(),
        };
        newPowerUps.push(newPowerUp);
      }

      set({
        snake: newSnake,
        food: getRandomCoord(newSnake),
        score: score + 10,
        direction: nextDirection,
        baseSpeed: newBaseSpeed,
        speed: effectiveSpeed,
        powerUps: newPowerUps,
      });
    } else if (collectedPowerUp) {
      const config = POWER_UP_CONFIGS[collectedPowerUp.type];
      let newSnakeAfterEffect = newSnake;
      let newActivePowerUps = [...activePowerUps];

      if (config.duration === 0) {
        // Instant effect (shrink)
        const shrinkAmount = config.shrinkAmount || 2;
        newSnakeAfterEffect = newSnake.slice(0, Math.max(3, newSnake.length - shrinkAmount));
      } else {
        // Duration effect
        const now = Date.now();
        const activePowerUp: ActivePowerUp = {
          id: uuidv4(),
          type: collectedPowerUp.type,
          activatedAt: now,
          expiresAt: now + config.duration,
          originalSpeed: baseSpeed,
        };
        newActivePowerUps.push(activePowerUp);
      }

      const remainingPowerUps = powerUps.filter(p => p.id !== collectedPowerUp.id);

      if (config.duration === 0) {
        // Shrink: remove tail normally
        newSnakeAfterEffect.pop();
        set({
          snake: newSnakeAfterEffect,
          direction: nextDirection,
          powerUps: remainingPowerUps,
          activePowerUps: newActivePowerUps,
        });
      } else {
        // Duration effect: remove tail and update speed
        newSnakeAfterEffect.pop();
        const effectiveSpeed = calculateEffectiveSpeed(baseSpeed, newActivePowerUps);
        set({
          snake: newSnakeAfterEffect,
          direction: nextDirection,
          speed: effectiveSpeed,
          powerUps: remainingPowerUps,
          activePowerUps: newActivePowerUps,
        });
      }
    } else {
      newSnake.pop();
      set({
        snake: newSnake,
        direction: nextDirection
      });
    }
  },

  updatePowerUpEffects: (currentTime: number) => {
    const { activePowerUps, baseSpeed } = get();

    const stillActive = activePowerUps.filter(active => active.expiresAt > currentTime);

    if (stillActive.length !== activePowerUps.length) {
      const effectiveSpeed = calculateEffectiveSpeed(baseSpeed, stillActive);
      set({
        activePowerUps: stillActive,
        speed: effectiveSpeed,
      });
    }
  },

  removeExpiredPowerUps: (currentTime: number) => {
    const { powerUps } = get();

    const stillValid = powerUps.filter(
      p => (currentTime - p.spawnedAt) < POWER_UP_SPAWN_CONFIG.expireTime
    );

    if (stillValid.length !== powerUps.length) {
      set({ powerUps: stillValid });
    }
  },
}));
