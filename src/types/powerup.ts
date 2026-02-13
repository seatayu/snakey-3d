import { Coord } from '@/store/useGameStore';

// 道具类型枚举
export type PowerUpType = 'SPEED_UP' | 'SLOW_DOWN' | 'SHRINK';

// 道具效果配置
export interface PowerUpConfig {
  type: PowerUpType;
  name: string;
  description: string;
  color: string;
  emoji: string;
  duration: number;
  speedMultiplier?: number;  // 间隔时间乘数，<1 加速，>1 减速
  shrinkAmount?: number;
}

// 激活中的道具状态
export interface ActivePowerUp {
  id: string;
  type: PowerUpType;
  activatedAt: number;
  expiresAt: number;
  originalSpeed?: number;
}

// 场景中的道具
export interface PowerUp {
  id: string;
  type: PowerUpType;
  position: Coord;
  spawnedAt: number;
}

// 道具配置常量
export const POWER_UP_CONFIGS: Record<PowerUpType, PowerUpConfig> = {
  SPEED_UP: {
    type: 'SPEED_UP',
    name: 'Turbo',
    description: '加速 5 秒',
    color: '#FF6B35',
    emoji: '⚡',
    duration: 5000,
    speedMultiplier: 2 / 3,  // 间隔时间变为 2/3，速度提升至 150%
  },
  SLOW_DOWN: {
    type: 'SLOW_DOWN',
    name: 'Chill',
    description: '减速 5 秒',
    color: '#4ECDC4',
    emoji: '🐢',
    duration: 5000,
    speedMultiplier: 1.5,  // 间隔时间变为 1.5 倍，速度降低至 2/3
  },
  SHRINK: {
    type: 'SHRINK',
    name: 'Shrink',
    description: '缩短 2 节',
    color: '#9B59B6',
    emoji: '✂️',
    duration: 0,
    shrinkAmount: 2,
  },
};

// 道具生成配置
export const POWER_UP_SPAWN_CONFIG = {
  spawnProbability: 0.5,
  maxPowerUpsOnBoard: 2,
  expireTime: 10000,
};
