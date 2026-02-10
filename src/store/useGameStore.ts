import { create } from 'zustand';
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
  // Actions
  startGame: () => void;
  resetGame: () => void;
  pauseGame: () => void;
  resumeGame: () => void;
  setDirection: (dir: Direction) => void;
  tick: () => void;
}
const INITIAL_SNAKE: Coord[] = [[5, 5], [4, 5], [3, 5]];
const INITIAL_DIRECTION: Direction = [1, 0];
const GRID_SIZE = 12;
const getRandomCoord = (exclude: Coord[]): Coord => {
  let newCoord: Coord;
  const isOccupied = (c: Coord) => exclude.some(s => s[0] === c[0] && s[1] === c[1]);
  do {
    newCoord = [Math.floor(Math.random() * GRID_SIZE), Math.floor(Math.random() * GRID_SIZE)];
  } while (isOccupied(newCoord));
  return newCoord;
};
export const useGameStore = create<GameState>((set, get) => ({
  snake: INITIAL_SNAKE,
  food: [8, 5],
  direction: INITIAL_DIRECTION,
  nextDirection: INITIAL_DIRECTION,
  score: 0,
  status: 'IDLE',
  gridSize: GRID_SIZE,
  speed: 150,
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
    speed: 150
  }),
  setDirection: (dir: Direction) => {
    const currentDir = get().direction;
    // Prevent 180 degree turns
    if (dir[0] === -currentDir[0] && dir[1] === -currentDir[1]) return;
    set({ nextDirection: dir });
  },
  tick: () => {
    const { snake, nextDirection, food, gridSize, status, score, speed } = get();
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
    if (ateFood) {
      set({
        snake: newSnake,
        food: getRandomCoord(newSnake),
        score: score + 10,
        direction: nextDirection,
        speed: Math.max(80, speed - 2)
      });
    } else {
      newSnake.pop();
      set({
        snake: newSnake,
        direction: nextDirection
      });
    }
  }
}));