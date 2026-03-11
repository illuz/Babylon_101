# Babylon.js 基础动画教程 (16_Animations)

## 概述

本教程介绍 Babylon.js 动画系统的核心概念，包括动画创建、关键帧、循环模式、动画控制和回调机制。

## 核心概念

### 1. Animation 类

`Animation` 是 Babylon.js 中动画的基本构建单元：

```typescript
const animation = new Animation(
  name,           // 动画名称
  targetProperty, // 目标属性
  framePerSecond, // 帧率
  dataType,       // 数据类型
  loopMode        // 循环模式
);
```

### 2. 动画类型

| 类型 | 用途 |
|------|------|
| `ANIMATIONTYPE_FLOAT` | 单值（rotation.z, visibility） |
| `ANIMATIONTYPE_VECTOR3` | 位置、缩放 |
| `ANIMATIONTYPE_QUATERNION` | 旋转 |
| `ANIMATIONTYPE_COLOR3` | 颜色 |

### 3. 循环模式

| 模式 | 行为 |
|------|------|
| `ANIMATIONLOOPMODE_CYCLE` | 循环播放 |
| `ANIMATIONLOOPMODE_CONSTANT` | 单次播放后保持最终值 |
| `ANIMATIONLOOPMODE_RELATIVE` | 每次循环累加变化值 |

### 4. 关键帧

```typescript
const frames = [
  { frame: 0, value: 0 },
  { frame: 180, value: Math.PI / 2 }
];
animation.setKeys(frames);
```

- 时间计算：时间(秒) = 帧号 / FPS
- 示例：60fps 下，180帧 = 3秒

## 动画播放

### beginAnimation
播放目标对象上的所有动画：
```typescript
scene.beginAnimation(target, from, to, loop);
```

### beginDirectAnimation
播放指定的动画数组：
```typescript
const animControl = scene.beginDirectAnimation(
  target, animations, from, to, loop, speedRatio, onAnimationEnd
);
```

## 动画控制

```typescript
animControl.stop();           // 停止
animControl.pause();          // 暂停
animControl.speedRatio = 2;   // 调整速度

// 异步等待
await scene.beginDirectAnimation(...).waitAsync();
```

## 多材质网格处理

```typescript
meshes.shift(); // 移除根节点
const mergedMesh = Mesh.MergeMeshes(
  meshes as Mesh[],
  true,  // disposeSource
  true,  // allow32BitsIndices
  undefined,
  false,
  true   // multiMultiMaterials - 保留多材质
);
```

## 注意事项

1. 数据类型必须与目标属性匹配
2. 多材质模型需要合并后才能正确应用动画
3. `waitAsync()` 需要 `async/await`
4. `onAnimationEnd` 在 `stop()` 时也会触发
