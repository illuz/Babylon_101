# Babylon.js 动画事件（Animation Events）教程

## 概述

动画事件（Animation Events）是 Babylon.js 中一个强大的功能，允许开发者在动画的特定关键帧上触发自定义操作。这对于游戏开发中的音效播放、伤害计算、特效触发等场景非常有用。

## 核心概念

### 1. AnimationEvent 类

`AnimationEvent` 是用于在动画特定帧触发回调的类。

```typescript
import { AnimationEvent } from "@babylonjs/core";

const event = new AnimationEvent(
  frame: number,      // 触发事件的帧数
  action: () => void, // 事件触发时执行的回调函数
  onlyOnce?: boolean  // 是否只触发一次（默认 false）
);
```

### 2. 事件与动画的关系

**重要概念**：
- `AnimationEvent` 必须关联到 `Animation` 对象，不能直接关联到 `AnimationGroup`
- 事件必须在动画播放**之前**创建并添加
- 一个事件可以添加到多个动画上

## 实现步骤

### 步骤 1：从动画组获取动画

```typescript
// 从 AnimationGroup 中获取具体的 Animation 对象
const animation = animationGroups[0].targetedAnimations[0].animation;
```

### 步骤 2：创建动画事件

```typescript
const attackEvt = new AnimationEvent(
  100,  // 在第 100 帧触发
  () => {
    // 执行的操作
    console.log("攻击命中！");
  },
  false  // 每次动画播放都触发
);
```

### 步骤 3：将事件添加到动画

```typescript
animation.addEvent(attackEvt);
```

### 步骤 4：播放动画

```typescript
// 播放动画时，事件会在指定帧自动触发
attackAnimation.play(false);
```

## 完整示例

```typescript
import {
  Scene,
  Engine,
  SceneLoader,
  AnimationEvent,
  AnimationGroup,
} from "@babylonjs/core";

export class AnimEvents {
  scene: Scene;
  engine: Engine;
  zombieAnims: AnimationGroup[];
  cheer: AnimationGroup;

  async CreateCharacter(): Promise<void> {
    const { animationGroups } = await SceneLoader.ImportMeshAsync(
      "",
      "./models/",
      "character_attack.glb"
    );

    // 动画组引用
    this.cheer = animationGroups[0];  // 欢庆动画
    const idle = animationGroups[1];  // 待机动画
    const attack = animationGroups[2];  // 攻击动画

    // 停止默认动画，播放待机
    this.cheer.stop();
    idle.play(true);

    // 从动画组中获取动画对象
    const attackAnim = attack.targetedAnimations[0].animation;

    // 创建动画事件（在第100帧触发）
    const attackEvt = new AnimationEvent(
      100,  // 第 100 帧（攻击命中的时刻）
      () => {
        // 停止僵尸待机动画
        this.zombieAnims[1].stop();
        // 播放僵尸死亡动画
        this.zombieAnims[0].play();
      },
      false  // 每次动画播放都触发
    );

    // 将事件添加到动画
    attackAnim.addEvent(attackEvt);

    // 右键触发攻击
    this.scene.onPointerDown = (evt) => {
      if (evt.button === 2) {
        attack.play();
      }
    };
  }

  async CreateZombie(): Promise<void> {
    const { animationGroups } = await SceneLoader.ImportMeshAsync(
      "",
      "./models/",
      "zombie_death.glb"
    );

    this.zombieAnims = animationGroups;

    // 初始化僵尸动画
    this.zombieAnims[0].stop();   // 停止死亡动画
    this.zombieAnims[1].play(true);  // 播放待机动画

    // 创建死亡动画事件（在第150帧触发）
    const deathAnim = this.zombieAnims[0].targetedAnimations[0].animation;
    const deathEvt = new AnimationEvent(
      150,  // 僵尸倒地后
      () => {
        this.cheer.play(true);  // 角色欢庆
      },
      false
    );

    deathAnim.addEvent(deathEvt);
  }
}
```

## 事件链（Event Chaining）

可以通过动画事件创建连锁反应：

```
角色攻击动画（第100帧）
    -> 触发僵尸死亡动画
        -> 僵尸死亡动画（第150帧）
            -> 触发角色欢庆动画
```

## 帧数确定

要确定正确的帧数，需要在 3D 建模软件（如 Blender）中查看动画：

1. 在 Blender 中打开动画
2. 查看时间轴上的帧数
3. 找到需要触发事件的关键帧
4. 使用该帧数创建 AnimationEvent

## 注意事项

### 1. 版本要求

建议使用 Babylon.js 5.0 或更高版本以确保 AnimationEvent 正常工作：

```json
{
  "dependencies": {
    "@babylonjs/core": "^5.0.0",
    "@babylonjs/loaders": "^5.0.0"
  }
}
```

### 2. 动画组顺序

从 GLB 文件导入的动画组按**字母顺序**排列，而非创建顺序：

```typescript
// 动画组可能是：cheer, idle, spell（而非 attack）
// 即使 NLA 轨道命名为：cheer, attack, idle
console.log(animationGroups);
// 输出顺序取决于动画的实际名称
```

### 3. 动画状态管理

播放新动画前要停止相关动画，否则角色会恢复到之前的动画状态：

```typescript
// 正确做法：先停止，再播放
idleAnimation.stop();
deathAnimation.play(false);
```

### 4. 事件创建时机

**错误**：在动画播放后才创建事件
```typescript
attack.play(false);
const evt = new AnimationEvent(100, () => {}, false);
animation.addEvent(evt);  // 太晚了！
```

**正确**：在播放动画前创建并添加事件
```typescript
const evt = new AnimationEvent(100, () => {}, false);
animation.addEvent(evt);
attack.play(false);
```

## 常见应用场景

| 场景 | 帧数选择 | 回调操作 |
|------|----------|----------|
| 攻击命中 | 武器接触目标的帧 | 伤害计算、音效、特效 |
| 脚步声 | 脚落地的帧 | 播放脚步音效 |
| 技能释放 | 技能生效的帧 | 生成特效、计算范围伤害 |
| 死亡事件 | 角色倒地的帧 | 触发掉落、结束游戏 |
| 跳跃落地 | 落地的帧 | 播放落地音效、尘土特效 |

## API 参考

### AnimationEvent 构造函数

```typescript
constructor(
  frame: number,                           // 触发帧数
  action: (currentFrame?: number) => void, // 回调函数
  onlyOnce?: boolean                       // 是否只触发一次
)
```

### Animation.addEvent()

```typescript
animation.addEvent(event: AnimationEvent): void;
```

## 相关资源

- [Babylon.js 官方文档 - Animation Events](https://doc.babylonjs.com/features/featuresDeepDive/animation/animation_events)
- [Babylon.js 官方文档 - Animation](https://doc.babylonjs.com/features/featuresDeepDive/animation)