# Snakey 3D 功能迭代方向

本文档基于对项目源码的分析，整理出可行的功能扩展方向，供后续开发参考。

---

## 一、游戏玩法增强

### 1.1 道具系统

| 道具类型 | 效果 | 实现难度 |
|---------|------|---------|
| 加速/减速 | 临时改变蛇的移动速度 | 低 |
| 穿墙 | 短时间内可穿越边界 | 中 |
| 无敌 | 短时间内无视自身碰撞 | 中 |
| 缩短 | 随机减少蛇身长度 | 低 |
| 双倍得分 | 限时分数翻倍 | 低 |

**实现思路：**

```typescript
interface PowerUp {
  id: string;
  type: PowerUpType;
  position: Coord;
  duration: number;  // 持续时间（毫秒）
  spawnTime: number;
}

type PowerUpType = 'speed_boost' | 'wall_pass' | 'invincible' | 'shrink' | 'double_score';

// 在 useGameStore 中添加
interface GameState {
  // ... 现有状态
  activePowerUps: PowerUp[];
  powerUpSpawnTimer: number;
}
```

### 1.2 多种食物类型

```typescript
type FoodType = 'normal' | 'golden' | 'poison' | 'mystery';

interface FoodState {
  position: Coord;
  type: FoodType;
  spawnTime: number;  // 用于食物消失机制
  value: number;      // 分数值
}

const FOOD_CONFIG = {
  normal: { value: 10, color: '#FFD93D', probability: 0.7 },
  golden: { value: 30, color: '#FFD700', probability: 0.15 },
  poison: { value: -5, color: '#8B00FF', probability: 0.1 },
  mystery: { value: 0, color: '#FF69B4', probability: 0.05 },  // 随机效果
};
```

### 1.3 难度模式选择

| 模式 | 特点 | 适合人群 |
|-----|------|---------|
| 休闲模式 | 固定速度，无碰撞惩罚 | 新手、儿童 |
| 经典模式 | 当前实现，速度递增 | 普通玩家 |
| 挑战模式 | 动态障碍物 + 速度递增更快 | 硬核玩家 |
| 无尽模式 | 超大地图，滚动视角 | 探索型玩家 |

**实现思路：**

```typescript
type GameMode = 'casual' | 'classic' | 'challenge' | 'endless';

interface ModeConfig {
  initialSpeed: number;
  speedIncrement: number;
  minSpeed: number;
  hasObstacles: boolean;
  invincibleEnabled: boolean;
  gridSize: number;
}
```

### 1.4 障碍物系统

- **静态障碍物**: 地图固定位置，游戏开始时生成
- **动态障碍物**: 周期性出现/消失，增加策略性
- **移动障碍物**: 沿固定路径移动，考验反应力

```typescript
interface Obstacle {
  id: string;
  position: Coord;
  type: 'static' | 'dynamic' | 'moving';
  visible: boolean;
  movePath?: Coord[];  // 移动障碍物的路径
  currentIndex?: number;
}

// 碰撞检测需要增加障碍物检查
const checkObstacleCollision = (head: Coord, obstacles: Obstacle[]): boolean => {
  return obstacles.some(o => o.visible && o.position[0] === head[0] && o.position[1] === head[1]);
};
```

---

## 二、视觉效果升级

### 2.1 蛇的皮肤系统

```typescript
interface SnakeSkin {
  id: string;
  name: string;
  headColor: string;
  bodyGradient: string[];   // 渐变色身体
  particleEffect?: string;  // 粒子特效类型
  unlockCondition?: string; // 解锁条件
}

// 示例皮肤
const SKINS: SnakeSkin[] = [
  {
    id: 'classic',
    name: '经典蓝红',
    headColor: '#FF6B6B',
    bodyGradient: ['#4D96FF'],
    unlockCondition: null,  // 默认解锁
  },
  {
    id: 'fire',
    name: '烈焰',
    headColor: '#FF4500',
    bodyGradient: ['#FF6347', '#FF8C00', '#FFD700'],
    unlockCondition: 'score_500',
  },
  {
    id: 'neon',
    name: '霓虹',
    headColor: '#00FF00',
    bodyGradient: ['#00FF88', '#00FFFF'],
    unlockCondition: 'games_50',
  },
  {
    id: 'rainbow',
    name: '彩虹',
    headColor: '#FF0000',
    bodyGradient: ['#FF7F00', '#FFFF00', '#00FF00', '#0000FF', '#8B00FF'],
    unlockCondition: 'achievement_all',
  },
];
```

**Snake.tsx 修改示例：**

```tsx
export function Snake() {
  const snake = useGameStore(s => s.snake);
  const currentSkin = useGameStore(s => s.currentSkin);
  const gridSize = useGameStore(s => s.gridSize);
  const offset = gridSize / 2 - 0.5;

  const getSegmentColor = (index: number) => {
    if (index === 0) return currentSkin.headColor;
    const gradient = currentSkin.bodyGradient;
    const colorIndex = index % gradient.length;
    return gradient[colorIndex];
  };

  return (
    <group>
      {snake.map((segment, i) => (
        <RoundedBox
          key={`${i}-${segment[0]}-${segment[1]}`}
          args={[0.9, 0.9, 0.9]}
          radius={0.2}
          smoothness={4}
          position={[segment[0] - offset, 0.5, segment[1] - offset]}
          castShadow
          receiveShadow
        >
          <meshStandardMaterial
            color={getSegmentColor(i)}
            roughness={0.3}
            metalness={0.2}
          />
        </RoundedBox>
      ))}
    </group>
  );
}
```

### 2.2 粒子特效

| 场景 | 特效类型 | 效果描述 |
|-----|---------|---------|
| 吃食物 | 爆炸粒子 | 彩色粒子向外扩散 |
| 蛇移动 | 尾迹效果 | 半透明的跟随残影 |
| 游戏结束 | 破碎动画 | 蛇身分裂成碎片下落 |
| 道具激活 | 光环效果 | 蛇身周围的光晕 |

**实现方案：** 使用 `@react-three/drei` 的 `<Points>` 或自定义 ShaderMaterial

### 2.3 环境主题

| 主题 | 棋盘颜色 | 背景色 | 环境预设 | 氛围 |
|-----|---------|-------|---------|------|
| 草地 | `#86EFAC` | `#E0F2FE` | `city` | 明亮清新 |
| 沙漠 | `#F4D03F` | `#FEF3C7` | `sunset` | 温暖干燥 |
| 海洋 | `#0EA5E9` | `#0C4A6E` | `night` | 神秘深邃 |
| 太空 | `#7C3AED` | `#0F172A` | `night` | 科幻未来 |
| 火山 | `#DC2626` | `#1C1917` | `apocalypse` | 危险刺激 |

**主题配置结构：**

```typescript
interface ThemeConfig {
  id: string;
  name: string;
  boardColor: string;
  gridColor: string;
  borderColor: string;
  backgroundColor: string;
  environmentPreset: 'city' | 'sunset' | 'night' | 'apocalypse' | 'warehouse';
  ambientIntensity: number;
  lightColor: string;
}
```

### 2.4 相机动画

```typescript
// 吃食物时的震动效果
const handleEatFood = () => {
  // 触发相机轻微震动
  cameraShake.trigger(0.1, 100);  // 强度 0.1，持续 100ms
};

// 游戏结束时的慢动作回放
const handleGameOver = async () => {
  // 1. 暂停游戏
  setGameStatus('GAMEOVER');
  // 2. 相机拉远
  await cameraZoom.to(30, { duration: 1000 });
  // 3. 环绕蛇身
  await cameraOrbit.around(snakeHead, { duration: 2000 });
  // 4. 显示结算界面
  setShowGameOverUI(true);
};

// 开场动画
const handleGameStart = async () => {
  // 1. 从远处飞入
  await cameraFly.from([0, 50, 0], { duration: 1500 });
  // 2. 轻微环绕
  await cameraOrbit.arc(90, { duration: 500 });
  // 3. 开始游戏
  setGameStatus('RUNNING');
};
```

---

## 三、社交与竞技功能

### 3.1 本地排行榜

```typescript
interface LeaderboardEntry {
  id: string;
  name: string;
  score: number;
  mode: GameMode;
  date: string;
  snakeLength: number;
  playTime: number;  // 秒
}

// 使用 localStorage 存储
const LEADERBOARD_KEY = 'snakey_3d_leaderboard';

const leaderboardStorage = {
  get: (): LeaderboardEntry[] => {
    const data = localStorage.getItem(LEADERBOARD_KEY);
    return data ? JSON.parse(data) : [];
  },
  save: (entry: LeaderboardEntry) => {
    const entries = leaderboardStorage.get();
    entries.push(entry);
    entries.sort((a, b) => b.score - a.score);
    const topEntries = entries.slice(0, 100);  // 保留前100名
    localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(topEntries));
  },
  clear: () => {
    localStorage.removeItem(LEADERBOARD_KEY);
  },
};
```

### 3.2 成就系统

```typescript
interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;  // Lucide icon 名称
  condition: (stats: PlayerStats) => boolean;
  reward?: {
    skinId?: string;
    points?: number;
  };
}

const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_food',
    name: '初尝滋味',
    description: '吃到第一个食物',
    icon: 'Apple',
    condition: (stats) => stats.totalFoodEaten >= 1,
  },
  {
    id: 'speed_demon',
    name: '速度恶魔',
    description: '游戏速度达到最快（80ms）',
    icon: 'Zap',
    condition: (stats) => stats.maxSpeedReached === 80,
  },
  {
    id: 'long_snake',
    name: '贪吃巨蟒',
    description: '蛇身达到 20 节',
    icon: 'Snake',
    condition: (stats) => stats.maxLength >= 20,
  },
  {
    id: 'survivor',
    name: '生存专家',
    description: '单局游戏存活 5 分钟',
    icon: 'Clock',
    condition: (stats) => stats.longestSurvival >= 300,
  },
  {
    id: 'centurion',
    name: '百分王者',
    description: '单局得分超过 100 分',
    icon: 'Trophy',
    condition: (stats) => stats.highScore >= 100,
  },
  {
    id: 'dedicated',
    name: '忠实玩家',
    description: '累计游戏 100 局',
    icon: 'Gamepad',
    condition: (stats) => stats.totalGames >= 100,
    reward: { skinId: 'neon' },
  },
];
```

### 3.3 多人模式

#### 同屏对战（本地）

```typescript
interface MultiplayerState {
  players: {
    id: 1 | 2;
    snake: Coord[];
    direction: Direction;
    score: number;
    color: string;
  }[];
  foods: Coord[];  // 多个食物
  status: GameStatus;
}

// 控制键位
const PLAYER1_CONTROLS = {
  up: 'KeyW',
  down: 'KeyS',
  left: 'KeyA',
  right: 'KeyD',
};

const PLAYER2_CONTROLS = {
  up: 'ArrowUp',
  down: 'ArrowDown',
  left: 'ArrowLeft',
  right: 'ArrowRight',
};
```

#### 在线对战（需要后端）

```typescript
// 使用 Cloudflare Durable Objects 实现实时对战
interface GameRoom {
  roomId: string;
  players: WebSocket[];
  gameState: MultiplayerState;
  createdAt: number;
}

// WebSocket 消息类型
type WSMessage =
  | { type: 'join'; playerId: string }
  | { type: 'direction'; playerId: string; direction: Direction }
  | { type: 'state'; state: MultiplayerState }
  | { type: 'game_over'; winner: string };
```

---

## 四、用户体验改进

### 4.1 音效系统

```typescript
// 使用 Web Audio API 或 Howler.js
import { Howl } from 'howler';

interface SoundConfig {
  id: string;
  src: string;
  volume: number;
  loop: boolean;
}

const SOUNDS: Record<string, SoundConfig> = {
  eat: { src: '/sounds/eat.mp3', volume: 0.5, loop: false },
  gameOver: { src: '/sounds/game-over.mp3', volume: 0.7, loop: false },
  turn: { src: '/sounds/turn.mp3', volume: 0.2, loop: false },
  powerUp: { src: '/sounds/powerup.mp3', volume: 0.6, loop: false },
  bgMusic: { src: '/sounds/background.mp3', volume: 0.3, loop: true },
};

class SoundManager {
  private sounds: Map<string, Howl> = new Map();
  private muted: boolean = false;

  init() {
    Object.entries(SOUNDS).forEach(([id, config]) => {
      this.sounds.set(id, new Howl({
        src: [config.src],
        volume: config.volume,
        loop: config.loop,
      }));
    });
  }

  play(id: string) {
    if (this.muted) return;
    this.sounds.get(id)?.play();
  }

  stop(id: string) {
    this.sounds.get(id)?.stop();
  }

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }
}

export const soundManager = new SoundManager();
```

### 4.2 引导教程

```typescript
interface TutorialStep {
  id: string;
  target: string;  // 高亮的 UI 元素
  message: string;
  position: 'top' | 'bottom' | 'left' | 'right';
  action?: () => void;  // 需要用户执行的操作
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'welcome',
    target: '.game-canvas',
    message: '欢迎来到 Snakey 3D！这是一款 3D 贪吃蛇游戏。',
    position: 'bottom',
  },
  {
    id: 'controls',
    target: '.score-display',
    message: '使用方向键或 WASD 控制蛇的移动方向。',
    position: 'bottom',
  },
  {
    id: 'objective',
    target: '.food-indicator',
    message: '吃掉黄色的小球来增加分数和蛇身长度！',
    position: 'top',
  },
  {
    id: 'avoid',
    target: '.board-border',
    message: '注意避开边界和自己的身体，否则游戏结束！',
    position: 'top',
  },
];
```

### 4.3 暂存功能

```typescript
const SAVE_STATE_KEY = 'snakey_3d_save';

interface SaveState {
  gameState: GameState;
  timestamp: number;
}

const saveGameManager = {
  save: (state: GameState) => {
    const saveState: SaveState = {
      gameState: state,
      timestamp: Date.now(),
    };
    localStorage.setItem(SAVE_STATE_KEY, JSON.stringify(saveState));
  },

  load: (): SaveState | null => {
    const data = localStorage.getItem(SAVE_STATE_KEY);
    return data ? JSON.parse(data) : null;
  },

  clear: () => {
    localStorage.removeItem(SAVE_STATE_KEY);
  },

  hasValidSave: (): boolean => {
    const save = saveGameManager.load();
    if (!save) return false;
    // 检查保存时间是否在24小时内
    return Date.now() - save.timestamp < 24 * 60 * 60 * 1000;
  },
};
```

### 4.4 统计面板

```typescript
interface PlayerStats {
  // 基础统计
  totalGames: number;
  highScore: number;
  totalScore: number;

  // 游戏详情
  totalFoodEaten: number;
  maxLength: number;
  maxSpeedReached: number;

  // 时间统计
  totalPlayTime: number;      // 累计游戏时间（秒）
  longestSurvival: number;    // 最长存活时间（秒）

  // 成就进度
  achievementsUnlocked: string[];

  // 模式统计
  modeStats: {
    [key in GameMode]: {
      gamesPlayed: number;
      highScore: number;
    };
  };
}

const STATS_KEY = 'snakey_3d_stats';

const statsManager = {
  get: (): PlayerStats => {
    const data = localStorage.getItem(STATS_KEY);
    return data ? JSON.parse(data) : getDefaultStats();
  },

  update: (gameResult: Partial<PlayerStats>) => {
    const stats = statsManager.get();
    const updated = {
      ...stats,
      totalGames: stats.totalGames + 1,
      highScore: Math.max(stats.highScore, gameResult.highScore || 0),
      // ... 其他更新逻辑
    };
    localStorage.setItem(STATS_KEY, JSON.stringify(updated));
  },
};
```

---

## 五、技术优化

### 5.1 性能优化

#### 批量渲染蛇身

```tsx
// 使用 InstancedMesh 替代多个 RoundedBox
import { InstancedMesh, Object3D, Matrix4 } from 'three';

function SnakeInstanced() {
  const snake = useGameStore(s => s.snake);
  const meshRef = useRef<InstancedMesh>(null);
  const gridSize = useGameStore(s => s.gridSize);
  const offset = gridSize / 2 - 0.5;

  useEffect(() => {
    if (!meshRef.current) return;

    const temp = new Object3D();
    snake.forEach((segment, i) => {
      temp.position.set(segment[0] - offset, 0.5, segment[1] - offset);
      temp.updateMatrix();
      meshRef.current!.setMatrixAt(i, temp.matrix);

      // 设置颜色
      const color = i === 0 ? new Color('#FF6B6B') : new Color('#4D96FF');
      meshRef.current!.setColorAt(i, color);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true;
    }
  }, [snake]);

  return (
    <instancedMesh ref={meshRef} args={[null, null, 144]}>
      <boxGeometry args={[0.9, 0.9, 0.9]} />
      <meshStandardMaterial />
    </instancedMesh>
  );
}
```

#### Shader 棋盘格

```glsl
// 自定义 Shader 替代多个平面网格
const BoardShader = {
  uniforms: {
    gridSize: { value: 12.0 },
    color1: { value: new Color('#86EFAC') },
    color2: { value: new Color('#4ADE80') },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform float gridSize;
    uniform vec3 color1;
    uniform vec3 color2;
    varying vec2 vUv;

    void main() {
      vec2 grid = floor(vUv * gridSize);
      float checker = mod(grid.x + grid.y, 2.0);
      vec3 color = mix(color1, color2, checker * 0.3);
      gl_FragColor = vec4(color, 1.0);
    }
  `,
};
```

### 5.2 PWA 支持

```json
// public/manifest.json
{
  "name": "Snakey 3D - 3D贪吃蛇游戏",
  "short_name": "Snakey 3D",
  "description": "一款基于 Three.js 的 3D 贪吃蛇游戏",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#E0F2FE",
  "theme_color": "#3B82F6",
  "orientation": "any",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ],
  "categories": ["games", "entertainment"]
}
```

```typescript
// vite.config.ts 添加 PWA 插件
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'icons/*.png'],
      manifest: false,  // 使用自定义 manifest.json
    }),
  ],
});
```

### 5.3 手势控制增强

```tsx
// 使用 react-swipeable 实现滑动控制
import { useSwipeable } from 'react-swipeable';

function GestureControls() {
  const setDirection = useGameStore(s => s.setDirection);

  const handlers = useSwipeable({
    onSwipedUp: () => setDirection([0, -1]),
    onSwipedDown: () => setDirection([0, 1]),
    onSwipedLeft: () => setDirection([-1, 0]),
    onSwipedRight: () => setDirection([1, 0]),
    preventDefaultTouchmoveEvent: true,
    trackMouse: true,  // 也支持鼠标拖拽
    delta: 10,         // 最小滑动距离
  });

  return <div {...handlers} className="absolute inset-0 z-5" />;
}
```

---

## 六、推荐优先级

### P0 - 核心体验提升（建议优先实现）

| 功能 | 工作量 | 收益 |
|-----|-------|------|
| 音效系统 | 1-2 天 | 大幅提升游戏沉浸感 |
| 难度模式 | 1 天 | 扩大受众群体，增加可玩性 |
| 手势滑动控制 | 0.5 天 | 改善移动端体验 |

### P1 - 重玩价值提升

| 功能 | 工作量 | 收益 |
|-----|-------|------|
| 本地排行榜 | 1 天 | 增加竞争性和重玩价值 |
| 蛇皮肤系统 | 2-3 天 | 视觉新鲜感，个性化 |
| 统计面板 | 1 天 | 数据可视化，成就感 |

### P2 - 深度玩法

| 功能 | 工作量 | 收益 |
|-----|-------|------|
| 道具系统 | 2-3 天 | 玩法深度和策略性 |
| 成就系统 | 1-2 天 | 长期留存动力 |
| 食物类型 | 1 天 | 增加变化性 |

### P3 - 高级功能（需要更多投入）

| 功能 | 工作量 | 收益 |
|-----|-------|------|
| 环境主题 | 2-3 天 | 视觉多样性 |
| 本地双人对战 | 3-5 天 | 社交玩法 |
| 在线多人 | 1-2 周 | 核心竞争力 |
| PWA 支持 | 1 天 | 可安装性 |

---

## 七、版本规划建议

### v1.1 - 体验优化版
- 音效系统
- 难度模式选择
- 手势滑动控制
- 暂存功能

### v1.2 - 个性化版
- 蛇皮肤系统（3-5 款基础皮肤）
- 本地排行榜
- 统计面板
- 环境主题（2-3 款）

### v1.3 - 深度玩法版
- 道具系统（3-5 种道具）
- 多种食物类型
- 成就系统
- 障碍物系统

### v2.0 - 多人版
- 本地双人对战
- 在线排行榜（Cloudflare KV）
- 更多皮肤和主题
- PWA 支持

---

## 八、技术债务清理建议

在功能迭代过程中，建议同步进行以下技术优化：

1. **单元测试**: 为 `useGameStore` 的核心逻辑添加测试
2. **类型完善**: 补充 Three.js 相关的类型定义
3. **错误监控**: 集成错误上报（如 Sentry）
4. **性能监控**: 添加 FPS 和渲染性能指标
5. **可访问性**: 增强键盘导航和屏幕阅读器支持

---

*文档创建时间: 2024*
*最后更新: 基于当前代码版本*
