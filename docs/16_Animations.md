# Babylon.js 基础动画教程 (16_Animations)

## 概述

本教程介绍 Babylon.js 动画系统的核心概念，包括动画创建、关键帧、循环模式、动画控制和回调机制。

## 核心概念

### 1. Animation 类

`Animation` 是 Babylon.js 中动画的基本构建单元。每个动画定义了一个属性如何随时间变化。

```typescript
const animation = new Animation(
  name,           // 动画名称
  targetProperty, // 目标属性（字符串）
  framePerSecond, // 帧率
  dataType,       // 数据类型
  loopMode        // 循环模式
);
```

### 2. 目标属性 (Target Property)

动画可以作用于网格的各种属性：

| 属性字符串 | 说明 | 数据类型 |
|-----------|------|---------|
| `rotation` | 整体旋转 | Quaternion/Vector3 |
| `rotation.x/y/z` | 单轴旋转 | Float |
| `position` | 位置 | Vector3 |
| `scaling` | 缩放 | Vector3 |
| `visibility` | 可见度 (0-1) | Float |
| `material.alpha` | 材质透明度 | Float |

### 3. 数据类型

```typescript
Animation.ANIMATIONTYPE_FLOAT      // 浮点数（单值）
Animation.ANIMATIONTYPE_VECTOR3    // 三维向量 (x, y, z)
Animation.ANIMATIONTYPE_QUATERNION // 四元数（用于旋转）
Animation.ANIMATIONTYPE_COLOR3     // RGB 颜色
Animation.ANIMATIONTYPE_MATRIX     // 4x4 矩阵
```

### 4. 循环模式

```typescript
Animation.ANIMATIONLOOPMODE_CYCLE     // 循环播放（回到起始帧重新开始）
Animation.ANIMATIONLOOPMODE_CONSTANT  // 单次播放（保持最终值）
Animation.ANIMATIONLOOPMODE_RELATIVE  // 相对循环（每次循环累加变化值）
```

## 关键帧系统

### 关键帧结构

每个关键帧包含 `frame`（帧号）和 `value`（值）：

```typescript
const frames = [
  { frame: 0, value: 0 },      // 第0帧，值为0
  { frame: 180, value: Math.PI / 2 }  // 第180帧，值为90度
];

// 将关键帧绑定到动画
animation.setKeys(frames);
```

### 帧率与时间计算

- **帧率 (FPS)**: 每秒帧数，通常使用 60
- **时间计算**: 时间(秒) = 帧号 / FPS
- **示例**: 60fps 下，180帧 = 3秒

## 动画播放方式

### 1. beginAnimation

播放目标对象上的所有动画：

```typescript
scene.beginAnimation(
  target,   // 目标对象
  from,     // 起始帧
  to,       // 结束帧
  loop      // 是否循环
);
```

### 2. beginDirectAnimation

播放指定的动画数组（更灵活）：

```typescript
const animatable = scene.beginDirectAnimation(
  target,          // 目标对象
  [animation1, animation2],  // 动画数组
  from,            // 起始帧
  to,              // 结束帧
  loop,            // 是否循环
  speedRatio,      // 速度比率（可选，默认1）
  onAnimationEnd   // 动画结束回调（可选）
);
```

## 动画控制

### Animatable 对象

`beginDirectAnimation` 返回 `Animatable` 对象，提供以下方法：

```typescript
animatable.stop();           // 停止动画
animatable.pause();          // 暂停动画
animatable.restart();        // 重新开始
animatable.speedRatio = 2;   // 调整速度（2倍速）
```

### 异步等待

使用 `waitAsync()` 等待动画完成：

```typescript
await scene.beginDirectAnimation(target, [animation], 0, 180)
  .waitAsync();

// 动画完成后执行的代码
console.log("Animation completed!");
```

## 动画回调

### onAnimationEnd 回调

动画结束时触发的回调函数：

```typescript
const onAnimationEnd = () => {
  console.log("Animation ended");
  target.setEnabled(false);  // 禁用目标
};

scene.beginDirectAnimation(
  target, animations, 0, 180, false, 1, onAnimationEnd
);
```

## 多材质网格处理

当导入的模型包含多个材质（多个子网格）时，需要合并为单个网格：

```typescript
// 导入模型
const { meshes } = await SceneLoader.ImportMeshAsync(...);

// 移除根节点
meshes.shift();

// 合并网格
const mergedMesh = Mesh.MergeMeshes(
  meshes as Mesh[],
  true,    // disposeSource - 销毁源网格
  true,    // allow32BitsIndices
  undefined,
  false,
  true     // multiMultiMaterials - 保留多材质（重要！）
);
```

## 完整示例

```typescript
// 创建旋转动画
const rotateAnim = new Animation(
  "rotateAnim",
  "rotation.z",
  60,
  Animation.ANIMATIONTYPE_FLOAT,
  Animation.ANIMATIONLOOPMODE_CYCLE
);

// 设置关键帧
const frames = [
  { frame: 0, value: 0 },
  { frame: 180, value: Math.PI / 2 }
];
rotateAnim.setKeys(frames);

// 添加到目标
target.animations.push(rotateAnim);

// 播放动画
const animControl = scene.beginDirectAnimation(
  target,
  [rotateAnim],
  0,
  180,
  true,
  1,
  () => console.log("Done!")
);
```

## 事件触发动画

基于用户输入触发动画：

```typescript
scene.onPointerDown = async (evt) => {
  if (evt.button === 0) {  // 左键
    await scene.beginDirectAnimation(target, [fadeAnim], 0, 180)
      .waitAsync();
    animControl.stop();
  }
};
```

## 鼠标按钮值

| 值 | 按钮 |
|---|------|
| 0 | 左键 |
| 1 | 中键 |
| 2 | 右键 |

## 动画组合

多个动画可以同时播放，创建复杂效果：

```typescript
// 同时播放滑动和旋转动画
scene.beginDirectAnimation(
  target,
  [slideAnim, rotateAnim],  // 动画数组
  0,
  180,
  true
);
```

## 注意事项

1. **数据类型匹配**: 目标属性和数据类型必须匹配
   - `rotation.z` → `ANIMATIONTYPE_FLOAT`
   - `position` → `ANIMATIONTYPE_VECTOR3`

2. **网格合并**: 多材质模型需要合并才能正确应用动画

3. **异步处理**: 使用 `waitAsync()` 时需要 `async/await`

4. **回调触发**: `onAnimationEnd` 在 `stop()` 被调用时也会触发

## 相关 API

- `Animation` - 动画类
- `Animatable` - 动画控制对象
- `Scene.beginAnimation()` - 播放所有动画
- `Scene.beginDirectAnimation()` - 播放指定动画
- `Mesh.MergeMeshes()` - 合并网格

## 下一步学习

- 17_Rigged_Animations - 骨骼动画
- 18_Cutscene_Animations - 过场动画
- 19_Animation_Events - 动画事件
- 20_Animation_Blending - 动画混合
