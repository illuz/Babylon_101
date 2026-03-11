# 18_Cutscene_Animations - 过场动画

## 概述

本示例演示如何在 Babylon.js 中创建电影式的过场动画（Cutscene）。过场动画是游戏中常见的叙事手法，用于展示剧情、引导玩家视线或增强沉浸感。

## 核心知识点

### 1. 动画系统基础

#### Animation 类

Babylon.js 的动画系统基于 `Animation` 类：

```typescript
const camAnim = new Animation(
  "camAnim",                              // 动画名称
  "position",                             // 动画属性路径
  fps,                                    // 帧率（每秒帧数）
  Animation.ANIMATIONTYPE_VECTOR3,        // 动画类型
  Animation.ANIMATIONLOOPMODE_CONSTANT    // 循环模式
);
```

#### 动画类型

| 类型常量 | 说明 | 适用属性 |
|---------|------|---------|
| `ANIMATIONTYPE_FLOAT` | 浮点数动画 | 透明度、缩放值 |
| `ANIMATIONTYPE_VECTOR3` | 三维向量动画 | 位置、缩放 |
| `ANIMATIONTYPE_QUATERNION` | 四元数动画 | 旋转 |
| `ANIMATIONTYPE_MATRIX` | 矩阵动画 | 变换矩阵 |
| `ANIMATIONTYPE_COLOR3` | 颜色动画 | 材质颜色 |
| `ANIMATIONTYPE_COLOR4` | 带透明度的颜色动画 | 材质颜色 |

#### 循环模式

| 模式常量 | 说明 |
|---------|------|
| `ANIMATIONLOOPMODE_CONSTANT` | 播放一次后保持最后值 |
| `ANIMATIONLOOPMODE_CYCLE` | 循环播放（回到起点） |
| `ANIMATIONLOOPMODE_RELATIVE` | 相对循环（累加偏移） |

### 2. 关键帧动画

#### 关键帧概念

关键帧定义了动画在特定时间点的状态，Babylon.js 会自动计算中间帧：

```typescript
const camKeys = [];

// 第 0 帧：起始位置
camKeys.push({ frame: 0, value: new Vector3(10, 2, -10) });

// 第 300 帧（5秒后）：新位置
camKeys.push({ frame: 300, value: new Vector3(-6, 2, -10) });

// 应用关键帧
camAnim.setKeys(camKeys);
```

#### 帧与时间转换

```
帧数 = 秒数 × 帧率(fps)
```

示例中 fps = 60，所以：
- 5 秒 = 300 帧
- 8 秒 = 480 帧
- 12 秒 = 720 帧

### 3. 播放动画

#### 基本播放

```typescript
// 将动画添加到对象的动画数组
this.camera.animations.push(camAnim);

// 开始播放动画
// 参数：目标对象，起始帧，结束帧
scene.beginAnimation(this.camera, 0, 12 * fps);
```

#### 异步等待完成

使用 `waitAsync()` 可以等待动画播放完成：

```typescript
// 等待动画完成后执行后续代码
await scene.beginAnimation(this.camera, 0, 12 * fps).waitAsync();
console.log("动画播放完成！");
```

### 4. 过场动画设计模式

#### 结构模式

```
1. 创建场景和相机
2. 加载环境和角色
3. 创建动画序列
4. 播放过场动画
5. 过场结束，切换到游戏控制
```

#### 示例流程

```typescript
async CreateCutscene(): Promise<void> {
  // 1. 创建动画和关键帧
  const camAnim = new Animation(...);
  camAnim.setKeys([...]);

  // 2. 添加到对象
  this.camera.animations.push(camAnim);

  // 3. 播放并等待完成
  await scene.beginAnimation(this.camera, 0, 720).waitAsync();

  // 4. 切换到玩家控制
  this.EndCutscene();
}
```

### 5. 相机控制切换

#### 过场 -> 玩家控制

```typescript
EndCutscene(): void {
  // 将相机附加到画布，启用玩家输入
  this.camera.attachControl();

  // 可选：切换角色动画
  this.characterAnimations[1].stop();
  this.characterAnimations[0].play();
}
```

#### 玩家控制 -> 过场

```typescript
StartCutscene(): void {
  // 分离相机，禁用玩家输入
  this.camera.detachControl();

  // 播放过场动画
  this.CreateCutscene();
}
```

## 实用技巧

### 1. 缓动效果

添加缓动可以让动画更自然：

```typescript
import { EasingFunction, QuadraticEase } from "@babylonjs/core";

const ease = new QuadraticEase();
ease.setEasingMode(EasingFunction.EASINGMODE_EASEINOUT);
camAnim.setEasingFunction(ease);
```

### 2. 多属性动画

可以同时对多个属性创建动画：

```typescript
// 位置动画
const positionAnim = new Animation("pos", "position", ...);

// 旋转动画
const rotationAnim = new Animation("rot", "rotation", ...);

// 同时添加
camera.animations.push(positionAnim, rotationAnim);
scene.beginAnimation(camera, 0, 100, true);
```

### 3. 动画事件

在动画中触发事件：

```typescript
const animEvent = new AnimationEvent(
  300,  // 触发帧
  () => {
    console.log("播放音效");
  }
);
camAnim.addEvent(animEvent);
```

### 4. 路径动画

使用样条曲线创建复杂路径：

```typescript
import { Path3D, Curve3 } from "@babylonjs/core";

// 创建曲线路径
const path = Curve3.CreateCatmullRomSpline(
  [point1, point2, point3, point4],
  60  // 插值点数
);

// 沿路径移动相机
const path3D = new Path3D(path.getPoints());
```

## 最佳实践

1. **帧率一致性**：在整个项目中保持统一的帧率（通常 60fps）

2. **动画时长**：过场动画不宜过长，避免玩家等待

3. **可跳过功能**：提供跳过过场的选项

4. **平滑过渡**：使用缓动函数避免生硬的运动

5. **预加载资源**：确保所有模型在过场开始前已加载

## 常见问题

### Q: 动画播放太快或太慢？

A: 检查帧率设置和关键帧时间是否匹配。

### Q: 如何创建多个动画的序列？

A: 使用 `await` 和 `waitAsync()` 顺序执行：

```typescript
await scene.beginAnimation(obj1, 0, 100).waitAsync();
await scene.beginAnimation(obj2, 0, 100).waitAsync();
```

### Q: 如何实现相机跟随效果？

A: 可以在动画中使用插值或使用 `FollowCamera`。

## 相关示例

- 17_Animations - 基础动画系统
- 19_AnimEvents - 动画事件
- 20_AnimBlending - 动画混合
