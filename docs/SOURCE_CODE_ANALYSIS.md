# Snakey 3D 贪吃蛇游戏 - 源码解读报告

## 一、项目概述

**Snakey 3D** 是一个基于现代 Web 技术栈构建的 3D 贪吃蛇游戏，采用 React Three Fiber 实现 3D 渲染，具有精美的视觉效果和流畅的游戏体验。

### 技术栈

| 类别 | 技术 |
|------|------|
| 前端框架 | React 18 + TypeScript |
| 构建工具 | Vite 6 |
| 3D 渲染 | React Three Fiber + @react-three/drei (Three.js 封装) |
| 状态管理 | Zustand |
| 样式方案 | Tailwind CSS |
| UI 组件库 | shadcn/ui (基于 Radix UI) |
| 动画库 | Framer Motion |
| 部署平台 | Cloudflare Pages/Workers |

---

## 二、项目架构

```
src/
├── components/
│   ├── game/           # 游戏核心组件
│   │   ├── Game3D.tsx      # 3D 场景容器
│   │   ├── Snake.tsx       # 蛇的渲染
│   │   ├── Food.tsx        # 食物的渲染
│   │   ├── Board.tsx       # 游戏棋盘
│   │   └── MobileControls.tsx  # 移动端控制
│   └── ui/             # shadcn/ui 组件库
├── pages/
│   └── HomePage.tsx    # 主页面（整合所有组件）
├── store/
│   └── useGameStore.ts # Zustand 状态管理
└── lib/                # 工具函数
```

---

## 三、核心模块详解

### 3.1 状态管理 (`useGameStore.ts`)

这是游戏的核心逻辑层，使用 Zustand 进行状态管理。

#### 类型定义

```typescript
type GameStatus = 'IDLE' | 'RUNNING' | 'PAUSED' | 'GAMEOVER';
type Direction = [number, number];  // [x方向, y方向]
type Coord = [number, number];      // 坐标
```

#### 状态结构

| 状态 | 类型 | 初始值 | 说明 |
|------|------|--------|------|
| `snake` | `Coord[]` | `[[5,5],[4,5],[3,5]]` | 蛇身体坐标数组，索引0为头部 |
| `food` | `Coord` | `[8,5]` | 食物位置 |
| `direction` | `Direction` | `[1,0]` | 当前移动方向 |
| `nextDirection` | `Direction` | `[1,0]` | 下一帧方向（防止快速连按） |
| `score` | `number` | `0` | 分数 |
| `status` | `GameStatus` | `'IDLE'` | 游戏状态 |
| `gridSize` | `number` | `12` | 棋盘大小 (12×12) |
| `speed` | `number` | `150` | 游戏速度 (毫秒/帧) |

#### 核心逻辑 - `tick()` 函数

```typescript
tick: () => {
  const { snake, nextDirection, food, gridSize, status, score, speed } = get();
  if (status !== 'RUNNING') return;

  const head = snake[0];
  const newHead: Coord = [head[0] + nextDirection[0], head[1] + nextDirection[1]];

  // 1. 墙壁碰撞检测
  if (newHead[0] < 0 || newHead[0] >= gridSize ||
      newHead[1] < 0 || newHead[1] >= gridSize) {
    set({ status: 'GAMEOVER' });
    return;
  }

  // 2. 自身碰撞检测
  if (snake.some(segment => segment[0] === newHead[0] && segment[1] === newHead[1])) {
    set({ status: 'GAMEOVER' });
    return;
  }

  // 3. 移动蛇身
  const newSnake = [newHead, ...snake];
  const ateFood = newHead[0] === food[0] && newHead[1] === food[1];

  if (ateFood) {
    // 吃到食物：蛇身增长，生成新食物，加分，加速
    set({
      snake: newSnake,
      food: getRandomCoord(newSnake),
      score: score + 10,
      direction: nextDirection,
      speed: Math.max(80, speed - 2)  // 最快80ms/帧
    });
  } else {
    // 未吃到食物：移除尾部
    newSnake.pop();
    set({ snake: newSnake, direction: nextDirection });
  }
}
```

**关键设计点：**
- 使用 `nextDirection` 缓冲机制，防止快速连续按键导致的 180° 掉头
- 速度随分数递增，最快限制为 80ms/帧
- 食物随机生成时排除蛇身占据的位置

---

### 3.2 3D 场景组件 (`Game3D.tsx`)

负责搭建 3D 场景环境和游戏循环。

```tsx
export function Game3D() {
  return (
    <Canvas shadows>
      {/* 透视相机 */}
      <PerspectiveCamera makeDefault position={[12, 15, 12]} fov={40} />

      {/* 轨道控制器 - 允许用户旋转视角 */}
      <OrbitControls
        enablePan={false}           // 禁止平移
        minPolarAngle={Math.PI / 4} // 限制俯视角度
        maxPolarAngle={Math.PI / 2.5}
        minDistance={15}            // 限制缩放距离
        maxDistance={25}
      />

      {/* 光照系统 */}
      <ambientLight intensity={0.7} />
      <directionalLight
        position={[10, 20, 10]}
        intensity={1.2}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />

      {/* 游戏组件 */}
      <GameLoop />
      <Board />
      <Snake />
      <Food />

      {/* 阴影效果 */}
      <ContactShadows opacity={0.4} scale={20} blur={2.4} />

      {/* 环境贴图 */}
      <Environment preset="city" />
    </Canvas>
  );
}
```

#### 游戏循环 (`GameLoop`)

```tsx
function GameLoop() {
  const tick = useGameStore(s => s.tick);
  const status = useGameStore(s => s.status);
  const speed = useGameStore(s => s.speed);
  const lastTick = useRef(0);

  useFrame((state) => {
    if (status !== 'RUNNING') return;
    const now = state.clock.getElapsedTime() * 1000;
    if (now - lastTick.current > speed) {
      tick();
      lastTick.current = now;
    }
  });
  return null;
}
```

**设计亮点：** 利用 React Three Fiber 的 `useFrame` 钩子，每帧检查时间间隔来触发游戏逻辑，实现了与渲染帧率解耦的游戏循环。

---

### 3.3 蛇的渲染 (`Snake.tsx`)

```tsx
export function Snake() {
  const snake = useGameStore(s => s.snake);
  const gridSize = useGameStore(s => s.gridSize);
  const offset = gridSize / 2 - 0.5;  // 居中偏移

  return (
    <group>
      {snake.map((segment, i) => (
        <RoundedBox
          key={`${i}-${segment[0]}-${segment[1]}`}
          args={[0.9, 0.9, 0.9]}       // 尺寸
          radius={0.2}                  // 圆角半径
          smoothness={4}                // 圆角平滑度
          position={[segment[0] - offset, 0.5, segment[1] - offset]}
          castShadow
          receiveShadow
        >
          <meshStandardMaterial
            color={i === 0 ? "#FF6B6B" : "#4D96FF"}  // 头部红色，身体蓝色
            roughness={0.3}
            metalness={0.2}
          />
        </RoundedBox>
      ))}
    </group>
  );
}
```

**视觉效果：**
- 蛇头：珊瑚红色 `#FF6B6B`
- 蛇身：天蓝色 `#4D96FF`
- 使用圆角立方体 (`RoundedBox`) 增加可爱感
- 材质带有轻微金属感和光泽

---

### 3.4 食物的渲染 (`Food.tsx`)

```tsx
export function Food() {
  const food = useGameStore(s => s.food);
  const gridSize = useGameStore(s => s.gridSize);
  const meshRef = useRef<THREE.Mesh>(null);
  const offset = gridSize / 2 - 0.5;

  // 动画：上下浮动 + 旋转
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.position.y = 0.5 + Math.sin(state.clock.getElapsedTime() * 3) * 0.2;
      meshRef.current.rotation.y += 0.05;
    }
  });

  return (
    <Sphere ref={meshRef} args={[0.4, 32, 32]} position={[food[0] - offset, 0.5, food[1] - offset]}>
      <MeshDistortMaterial  // 扭曲材质，产生果冻效果
        color="#FFD93D"
        speed={4}
        distort={0.4}
        radius={1}
      />
    </Sphere>
  );
}
```

**动画效果：**
- 使用 `MeshDistortMaterial` 实现果冻般的扭曲效果
- 正弦函数控制上下浮动
- 持续旋转吸引注意力

---

### 3.5 游戏棋盘 (`Board.tsx`)

```tsx
export function Board() {
  const gridSize = useGameStore(s => s.gridSize);
  const offset = gridSize / 2 - 0.5;

  return (
    <group>
      {/* 主棋盘 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, -0.01, 0]}>
        <planeGeometry args={[gridSize, gridSize]} />
        <meshStandardMaterial color="#86EFAC" />  {/* 浅绿色 */}
      </mesh>

      {/* 棋盘格纹 */}
      {Array.from({ length: gridSize }).map((_, x) =>
        Array.from({ length: gridSize }).map((_, z) => {
          if ((x + z) % 2 === 0) return null;
          return (
            <mesh key={`${x}-${z}`} rotation={[-Math.PI / 2, 0, 0]}
                  position={[x - offset, 0, z - offset]}>
              <planeGeometry args={[1, 1]} />
              <meshStandardMaterial color="#4ADE80" transparent opacity={0.3} />
            </mesh>
          );
        })
      )}

      {/* 装饰边框 */}
      <mesh position={[0, -0.1, 0]}>
        <boxGeometry args={[gridSize + 0.5, 0.2, gridSize + 0.5]} />
        <meshStandardMaterial color="#166534" />  {/* 深绿色 */}
      </mesh>
    </group>
  );
}
```

---

### 3.6 主页面 (`HomePage.tsx`)

整合所有组件，处理用户输入和 UI 覆盖层。

#### 键盘控制

```tsx
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowUp':
      case 'w':
        setDirection([0, -1]);
        break;
      case 'ArrowDown':
      case 's':
        setDirection([0, 1]);
        break;
      case 'ArrowLeft':
      case 'a':
        setDirection([-1, 0]);
        break;
      case 'ArrowRight':
      case 'd':
        setDirection([1, 0]);
        break;
    }
  };
  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [setDirection]);
```

#### UI 覆盖层

- **开始界面 (IDLE):** 显示游戏标题和开始按钮
- **游戏结束界面 (GAMEOVER):** 显示最终分数和重新开始按钮
- 使用 Framer Motion 的 `AnimatePresence` 实现平滑过渡动画

---

### 3.7 移动端控制 (`MobileControls.tsx`)

```tsx
export function MobileControls() {
  const setDirection = useGameStore(s => s.setDirection);
  const status = useGameStore(s => s.status);

  if (status !== 'RUNNING') return null;  // 只在游戏运行时显示

  return (
    <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10 md:hidden ...">
      {/* 方向按钮网格布局 */}
      <Button onPointerDown={() => setDirection([0, -1])}>↑</Button>
      <Button onPointerDown={() => setDirection([-1, 0])}>←</Button>
      <Button onPointerDown={() => setDirection([0, 1])}>↓</Button>
      <Button onPointerDown={() => setDirection([1, 0])}>→</Button>
    </div>
  );
}
```

**响应式设计：** 使用 `md:hidden` 类，只在移动端显示虚拟方向键。

---

## 四、数据流图

```
┌─────────────────────────────────────────────────────────────────┐
│                         HomePage.tsx                             │
│  ┌─────────────┐    ┌─────────────┐    ┌──────────────────┐     │
│  │ 键盘/触摸输入 │───→│ setDirection │───→│ useGameStore     │     │
│  └─────────────┘    └─────────────┘    │                  │     │
│                     ┌─────────────┐    │ ┌──────────────┐ │     │
│                     │ startGame   │───→│ │ snake[]      │ │     │
│                     │ resetGame   │    │ │ food         │ │     │
│                     │ pauseGame   │    │ │ direction    │ │     │
│                     └─────────────┘    │ │ status       │ │     │
│                                        │ │ score        │ │     │
│  ┌─────────────┐                       │ │ speed        │ │     │
│  │  Game3D     │←──────────────────────│ └──────────────┘ │     │
│  │  ┌───────┐  │                       └──────────────────┘     │
│  │  │Snake  │←─┤                                ↑               │
│  │  ├───────┤  │                                │               │
│  │  │Food   │←─┤                          ┌─────┴─────┐         │
│  │  ├───────┤  │                          │   tick()  │         │
│  │  │Board  │←─┤                          │ 游戏逻辑   │         │
│  │  └───────┘  │                          └───────────┘         │
│  └─────────────┘                                ↑               │
│         │                                       │               │
│         └──────────── useFrame ─────────────────┘               │
│                    (GameLoop)                                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 五、关键技术实现

### 5.1 3D 坐标映射

游戏使用 2D 网格坐标，需要映射到 3D 空间：

```typescript
// 网格坐标 [x, z] → 3D 坐标
const offset = gridSize / 2 - 0.5;  // 将 [0,11] 映射到 [-5.5, 5.5]
position={[coord[0] - offset, y, coord[1] - offset]}
```

### 5.2 游戏循环优化

```typescript
// 使用时间差控制游戏速度，而非依赖帧率
useFrame((state) => {
  const now = state.clock.getElapsedTime() * 1000;
  if (now - lastTick.current > speed) {
    tick();
    lastTick.current = now;
  }
});
```

### 5.3 方向缓冲机制

防止快速按键导致蛇掉头：

```typescript
setDirection: (dir) => {
  const currentDir = get().direction;
  // 阻止 180° 转向
  if (dir[0] === -currentDir[0] && dir[1] === -currentDir[1]) return;
  set({ nextDirection: dir });  // 更新下一个方向，而非当前方向
}
```

---

## 六、扩展建议

1. **音效系统** - 添加吃食物、游戏结束的音效
2. **难度级别** - 提供多种初始速度选择
3. **特殊道具** - 加速、减速、穿墙等道具
4. **排行榜** - 使用 Cloudflare KV 存储高分记录
5. **多人模式** - 通过 WebSocket 实现实时对战

---

## 七、总结

Snakey 3D 是一个架构清晰、技术现代的 Web 3D 游戏示例：

- **状态与视图分离** - Zustand 管理游戏逻辑，React Three Fiber 负责 3D 渲染
- **响应式设计** - 同时支持桌面键盘和移动端触摸操作
- **优秀的视觉体验** - 阴影、光照、动画效果完善
- **可维护性强** - TypeScript 类型安全，组件职责单一
