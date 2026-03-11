# Babylon.js 动画混合（Animation Blending）教程

## 概述

动画混合是现代游戏开发中角色动画系统的核心技术。它允许在同一角色骨架上同时播放多个动画，并通过权重控制每个动画的影响力，从而实现平滑、自然的动画过渡效果。

本教程基于 Babylon.js 的 `AnimationGroup` 和协程（Coroutine）机制，演示如何在角色的空闲（Idle）和奔跑（Run）动画之间实现平滑过渡。

---

## 核心概念

### 1. 动画组（AnimationGroup）

动画组是 Babylon.js 中管理一组相关动画轨道的容器。当导入包含动画的 3D 模型（如 GLB/GLTF 格式）时，每个独立的动画序列会被解析为一个 `AnimationGroup`。

```typescript
const { meshes, animationGroups } = await SceneLoader.ImportMeshAsync(
  "",
  "./models/",
  "character_blending.glb"
);

const idle = animationGroups[0];  // 空闲动画
const run = animationGroups[1];   // 奔跑动画
```

### 2. 动画权重（Animation Weight）

权重是一个 0 到 1 之间的数值，表示某个动画对最终角色姿态的影响力：

| 权重值 | 含义 |
|--------|------|
| **1.0** | 该动画完全控制角色动作 |
| **0.5** | 该动画与其他动画各占一半影响 |
| **0.0** | 该动画对角色动作无影响 |

```typescript
// 设置动画权重
idle.setWeightForAllAnimatables(1.0);   // 完全影响
run.setWeightForAllAnimatables(0.0);    // 无影响
```

### 3. 动画混合原理

当多个动画同时播放时，Babylon.js 会根据各自的权重值对骨骼变换进行加权平均。这就是"混合"的本质。

**混合公式（简化）：**
```
最终姿态 = 动画A姿态 * 权重A + 动画B姿态 * 权重B + ...
```

**实际例子：**
- 当 `idle` 权重为 1，`run` 权重为 0 时，角色完全呈现空闲姿态
- 当 `idle` 权重为 0.5，`run` 权重为 0.5 时，角色呈现介于空闲和奔跑之间的中间姿态
- 当 `idle` 权重为 0，`run` 权重为 1 时，角色完全呈现奔跑姿态

---

## 协程（Coroutine）机制

### 什么是协程？

协程是一种可以暂停执行并稍后恢复的特殊函数。在 Babylon.js 中，协程与渲染循环配合使用，非常适合实现：

- 逐帧的动画效果
- 时间控制逻辑
- 异步序列操作

### 协程语法

```typescript
// 定义协程（使用 * 符号）
*animationBlending(
  toAnim: AnimationGroup,
  fromAnim: AnimationGroup
): AsyncCoroutine<void> {
  // 协程体
  while (condition) {
    // 执行逻辑
    yield;  // 暂停，等待下一帧
  }
}

// 启动协程
this.scene.onBeforeRenderObservable.runCoroutineAsync(
  this.animationBlending(run, idle)
);
```

### yield 关键字

`yield` 是协程的核心，它会暂停协程的执行，直到下一帧渲染时才继续：

- 在 60 FPS 下，每次 `yield` 约等待 16.67 毫秒
- 这确保动画混合在多个帧中逐步完成，而非瞬间完成
- 如果没有 `yield`，整个混合过程会在一帧内完成，看不到过渡效果

---

## 平滑过渡实现

### 过渡算法

实现平滑过渡的关键是在多个帧中逐步调整权重：

```typescript
*animationBlending(
  toAnim: AnimationGroup,   // 目标动画（将要过渡到）
  fromAnim: AnimationGroup  // 源动画（当前正在播放）
): AsyncCoroutine<void> {
  let currentWeight = 1;  // 源动画权重：1 -> 0
  let newWeight = 0;      // 目标动画权重：0 -> 1

  toAnim.play(true);  // 必须播放目标动画

  while (newWeight < 1) {
    newWeight += 0.01;      // 递增目标动画权重
    currentWeight -= 0.01;  // 递减源动画权重

    toAnim.setWeightForAllAnimatables(newWeight);
    fromAnim.setWeightForAllAnimatables(currentWeight);

    yield;  // 等待下一帧
  }
}
```

### 过渡速度控制

通过调整每帧的权重增量可以控制过渡速度：

| 增量值 | 效果 | 过渡时间（约） |
|--------|------|----------------|
| 0.005 | 非常平滑，较慢 | ~3.3 秒 |
| 0.01 | 平滑（推荐） | ~1.7 秒 |
| 0.02 | 较快 | ~0.8 秒 |
| 0.1 | 快速，明显 | ~0.17 秒 |

---

## 完整代码示例

```typescript
import {
  Scene,
  Engine,
  FreeCamera,
  Vector3,
  CubeTexture,
  SceneLoader,
  AnimationGroup,
  AsyncCoroutine,
} from "@babylonjs/core";
import "@babylonjs/loaders";

export class AnimBlending {
  scene: Scene;
  engine: Engine;

  constructor(private canvas: HTMLCanvasElement) {
    this.engine = new Engine(this.canvas, true);
    this.scene = this.CreateScene();
    this.CreateEnvironment();
    this.CreateCharacter();

    this.engine.runRenderLoop(() => {
      this.scene.render();
    });
  }

  CreateScene(): Scene {
    const scene = new Scene(this.engine);
    const envTex = CubeTexture.CreateFromPrefilteredData(
      "./environment/sky.env",
      scene
    );
    envTex.gammaSpace = false;
    envTex.rotationY = Math.PI / 2;
    scene.environmentTexture = envTex;
    scene.createDefaultSkybox(envTex, true, 1000, 0.25);

    const camera = new FreeCamera("camera", new Vector3(0, 2, -6), this.scene);
    camera.attachControl();
    camera.minZ = 0.5;
    camera.speed = 0.5;

    return scene;
  }

  async CreateEnvironment(): Promise<void> {
    await SceneLoader.ImportMeshAsync("", "./models/", "Prototype_Level.glb");
  }

  async CreateCharacter(): Promise<void> {
    const { meshes, animationGroups } = await SceneLoader.ImportMeshAsync(
      "",
      "./models/",
      "character_blending.glb"
    );

    meshes[0].rotate(Vector3.Up(), -Math.PI);

    const idle = animationGroups[0];
    const run = animationGroups[1];

    // 鼠标事件触发动画混合
    this.scene.onPointerDown = (evt) => {
      // 中键：Idle -> Run
      if (evt.button === 1)
        this.scene.onBeforeRenderObservable.runCoroutineAsync(
          this.animationBlending(run, idle)
        );

      // 左键：Run -> Idle
      if (evt.button === 0)
        this.scene.onBeforeRenderObservable.runCoroutineAsync(
          this.animationBlending(idle, run)
        );
    };
  }

  *animationBlending(
    toAnim: AnimationGroup,
    fromAnim: AnimationGroup
  ): AsyncCoroutine<void> {
    let currentWeight = 1;
    let newWeight = 0;

    toAnim.play(true);

    while (newWeight < 1) {
      newWeight += 0.01;
      currentWeight -= 0.01;
      toAnim.setWeightForAllAnimatables(newWeight);
      fromAnim.setWeightForAllAnimatables(currentWeight);
      yield;
    }
  }
}
```

---

## 关键 API 参考

### AnimationGroup

| 方法 | 说明 |
|------|------|
| `play(loop: boolean)` | 播放动画组 |
| `stop()` | 停止动画组 |
| `pause()` | 暂停动画组 |
| `setWeightForAllAnimatables(weight: number)` | 设置该动画对所有可动画对象的权重 |

### Scene 协程相关

| 属性/方法 | 说明 |
|-----------|------|
| `onBeforeRenderObservable` | 每帧渲染前触发的观察者 |
| `runCoroutineAsync(coroutine)` | 异步运行协程 |

---

## 最佳实践

1. **确保动画播放**：在调整权重前，必须先调用 `play()` 启动目标动画
2. **选择合适的过渡速度**：0.01 是一个较好的起点，可根据实际需求调整
3. **考虑动画同步**：对于需要精确同步的动画（如走路、跑步），确保动画长度相近
4. **避免权重溢出**：确保权重值始终在 0-1 范围内
5. **性能考虑**：同时混合的动画数量不宜过多，通常 2-3 个足够

---

## 扩展应用

### 多向混合

可以扩展为支持多个动画的混合，例如根据移动方向混合前进、后退、左移、右移动画：

```typescript
// 根据输入向量计算各方向动画权重
const forwardWeight = Math.max(0, inputZ);
const backwardWeight = Math.max(0, -inputZ);
const leftWeight = Math.max(0, -inputX);
const rightWeight = Math.max(0, inputX);
```

### 动画层叠（Animation Layering）

动画层叠是动画混合的扩展应用，允许在不同骨骼层级上同时播放不同动画：

- 上半身：攻击动画
- 下半身：移动动画

这需要更复杂的动画系统支持，如 Babylon.js 的动画混合器或自定义骨骼控制。

---

## 总结

动画混合是创建流畅、自然角色动画的关键技术。通过理解权重系统和协程机制，你可以实现各种复杂的动画过渡效果，为游戏角色赋予生命力。

**核心要点：**
- 动画权重控制动画影响力（0-1）
- 协程配合 yield 实现逐帧的平滑过渡
- 合理设置过渡速度获得最佳视觉效果
