# Snakey 3D 道具系统实现方案

## 背景

基于 `docs/FEATURE_ROADMAP.md` 中的规划，为 Snakey 3D 游戏添加道具系统（PowerUp System），增强游戏玩法深度和策略性。

## 道具功能

| 道具 | 效果 | 持续时间 | 颜色 |
|-----|------|---------|------|
| 加速 (SPEED_UP) | 移动速度提升至 150% | 5秒 | 橙色 #FF6B35 |
| 减速 (SLOW_DOWN) | 移动速度降低至 2/3 | 5秒 | 青色 #4ECDC4 |
| 缩短 (SHRINK) | 蛇身减少 2 节 | 即时 | 紫色 #9B59B6 |

## 文件变更清单

### 新建文件

1. **`src/types/powerup.ts`** - 道具类型定义和配置
2. **`src/components/game/PowerUps.tsx`** - 道具 3D 渲染组件
3. **`src/components/game/ActivePowerUpsDisplay.tsx`** - 激活道具 UI 显示

### 修改文件

1. **`src/store/useGameStore.ts`** - 添加道具状态和 actions
2. **`src/components/game/Game3D.tsx`** - 集成道具组件和效果更新
3. **`src/pages/HomePage.tsx`** - 添加激活道具 UI

## 实现步骤

### Step 1: 创建类型定义 `src/types/powerup.ts`

```typescript
export type PowerUpType = 'SPEED_UP' | 'SLOW_DOWN' | 'SHRINK';

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

export interface ActivePowerUp {
  id: string;
  type: PowerUpType;
  activatedAt: number;
  expiresAt: number;
  originalSpeed?: number;
}

export interface PowerUp {
  id: string;
  type: PowerUpType;
  position: Coord;
  spawnedAt: number;
}

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

export const POWER_UP_SPAWN_CONFIG = {
  spawnProbability: 0.3,
  maxPowerUpsOnBoard: 2,
  expireTime: 10000,
};
```

### Step 2: 扩展 Store `src/store/useGameStore.ts`

**新增状态字段:**
- `powerUps: PowerUp[]` - 场上的道具
- `activePowerUps: ActivePowerUp[]` - 激活中的道具
- `baseSpeed: number` - 基础速度 (区分于受道具影响的 speed)

**新增 Actions:**
- `spawnPowerUp()` - 生成道具
- `collectPowerUp(id)` - 收集道具
- `updatePowerUpEffects(time)` - 更新效果状态（检查过期）

**修改 tick():**
- 检测蛇头与道具的碰撞
- 触发道具效果（即时或持续）
- 吃食物后有 30% 概率生成道具

### Step 3: 创建道具组件 `src/components/game/PowerUps.tsx`

- 使用 `Octahedron` 几何体渲染道具（区别于食物的球体）
- 使用 `Float` 组件实现悬浮动画
- 不同道具有不同的动画参数和颜色

### Step 4: 修改游戏循环 `src/components/game/Game3D.tsx`

- 导入并渲染 `<PowerUps />` 组件
- 在 `useFrame` 中每 100ms 检查道具效果是否过期
- 调用 `updatePowerUpEffects()` 和 `removeExpiredPowerUps()`

### Step 5: 创建 UI 显示 `src/components/game/ActivePowerUpsDisplay.tsx`

- 显示当前激活的道具图标和名称
- 显示剩余时间倒计时
- 显示进度条（渐变消失效果）
- 使用 framer-motion 实现进出动画

### Step 6: 集成到主页 `src/pages/HomePage.tsx`

- 在 HUD 区域添加 `<ActivePowerUpsDisplay />`

## 道具生成逻辑

1. 每次吃食物后有 30% 概率生成道具
2. 场上最多同时存在 2 个道具
3. 道具在场上 10 秒后自动消失

## 速度计算逻辑

```
effectiveSpeed = baseSpeed * product(activePowerUps.speedMultiplier)
范围限制: [40ms, 600ms]
```

- 加速道具: speedMultiplier = 2/3（间隔时间 × 2/3 = 速度提升至 150%）
- 减速道具: speedMultiplier = 1.5（间隔时间 × 1.5 = 速度降低至 2/3）

## 验证方法

1. 启动开发服务器: `npm run dev`
2. 开始游戏，吃到食物后观察是否生成道具
3. 收集加速道具，观察蛇移动变快，UI 显示倒计时
4. 收集减速道具，观察蛇移动变慢
5. 收集缩短道具，观察蛇身减少
6. 等待 5 秒，确认道具效果消失，速度恢复正常

## 依赖

无需新增依赖，使用项目现有的：
- `zustand` - 状态管理
- `@react-three/drei` - 3D 组件 (Float, Octahedron)
- `framer-motion` - UI 动画
- `uuid` - 生成唯一 ID
