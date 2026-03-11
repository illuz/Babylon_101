# 18. Cutscene Animations - 过场动画

## 课程概述

本课程讲解如何在 Babylon.js 中创建过场动画（Cutscene），包括：

- **相机路径动画**：控制相机沿预设路径移动
- **关键帧动画（Keyframe Animation）**：定义动画的关键时间点
- **动画同步**：协调相机动画与角色动画
- **动画结束回调**：过场动画完成后切换到游戏模式

## 核心概念

### 过场动画（Cutscene）

过场动画是游戏中常见的非交互式场景，用于：
- 剧情叙述
- 场景介绍
- Boss 登场展示
- 教程引导

### 动画类型组合

在本课程中，我们组合使用多种动画：

| 动画类型 | 来源 | 说明 |
|----------|------|------|
| 相机动画 | 代码创建 | 控制视角移动 |
| 角色动画 | GLB 模型 | 从外部模型导入 |
| 场景动画 | GLB 模型 | 环境动态效果 |

### 动画同步控制

```
时间轴 (60 FPS):
├── 帧 0 (0秒):     相机从 (10, 2, -10) 开始
├── 帧 300 (5秒):   相机移动到 (-6, 2, -10)
├── 帧 480 (8秒):   相机停留展示角色
├── 帧 720 (12秒):  相机移动到最终位置
└── 动画结束:       切换到玩家控制模式
```

## 关键实现

### 1. 创建关键帧动画

```typescript
// 关键帧数组
const camKeys = [];
const fps = 60;

// 创建 Animation 对象
const camAnim = new Animation(
  "camAnim",                              // 动画名称
  "position",                             // 目标属性
  fps,                                    // 帧率
  Animation.ANIMATIONTYPE_VECTOR3,        // 数据类型
  Animation.ANIMATIONLOOPMODE_CONSTANT    // 循环模式
);

// 添加关键帧
camKeys.push({ frame: 0, value: new Vector3(10, 2, -10) });
camKeys.push({ frame: 5 * fps, value: new Vector3(-6, 2, -10) });

// 设置关键帧
camAnim.setKeys(camKeys);
```

### 2. Animation 构造函数参数

| 参数 | 类型 | 说明 |
|------|------|------|
| `name` | string | 动画名称 |
| `targetProperty` | string | 目标属性名（如 "position"、"rotation"） |
| `frameRate` | number | 帧率（通常 30 或 60） |
| `dataType` | number | 数据类型常量 |
| `loopMode` | number | 循环模式常量 |

### 数据类型常量

```typescript
Animation.ANIMATIONTYPE_FLOAT      // 单个浮点数
Animation.ANIMATIONTYPE_VECTOR3    // 三维向量
Animation.ANIMATIONTYPE_QUATERNION // 四元数（旋转）
Animation.ANIMATIONTYPE_MATRIX     // 矩阵
Animation.ANIMATIONTYPE_COLOR3     // RGB 颜色
```

### 循环模式常量

```typescript
Animation.ANIMATIONLOOPMODE_CONSTANT  // 播放一次后保持最后值
Animation.ANIMATIONLOOPMODE_CYCLE     // 循环播放
Animation.ANIMATIONLOOPMODE_RELATIVE  // 相对模式（累加）
```

### 3. 播放动画

```typescript
// 将动画添加到目标对象
camera.animations.push(camAnim);

// 开始播放动画（同步等待）
await scene.beginAnimation(camera, 0, 12 * fps).waitAsync();

// 或者异步播放（不等待）
scene.beginAnimation(camera, 0, 12 * fps, true);  // true = 循环
```

### 4. waitAsync() 的使用

```typescript
// waitAsync() 返回 Promise，适合：
// 1. 需要等待动画完成后再执行代码
// 2. 创建过场动画序列
// 3. 动画链式调用

await scene.beginAnimation(camera, 0, 100).waitAsync();
console.log("动画播放完成");
// 这里会等待动画结束后才执行
```

## 代码示例

### 完整的过场动画流程

```typescript
async CreateCutscene(): Promise<void> {
  // 1. 准备关键帧数据
  const camKeys = [];
  const fps = 60;

  // 2. 创建动画对象
  const camAnim = new Animation(
    "camAnim",
    "position",
    fps,
    Animation.ANIMATIONTYPE_VECTOR3,
    Animation.ANIMATIONLOOPMODE_CONSTANT
  );

  // 3. 定义路径点
  camKeys.push({ frame: 0, value: new Vector3(10, 2, -10) });
  camKeys.push({ frame: 5 * fps, value: new Vector3(-6, 2, -10) });
  camKeys.push({ frame: 8 * fps, value: new Vector3(-6, 2, -10) });  // 停留
  camKeys.push({ frame: 12 * fps, value: new Vector3(0, 3, -16) });

  // 4. 设置关键帧
  camAnim.setKeys(camKeys);

  // 5. 添加到目标对象
  this.camera.animations.push(camAnim);

  // 6. 播放并等待完成
  await this.scene.beginAnimation(this.camera, 0, 12 * fps).waitAsync();

  // 7. 动画结束后的回调
  this.EndCutscene();
}
```

### 动画结束处理

```typescript
EndCutscene(): void {
  // 启用玩家控制
  this.camera.attachControl();

  // 切换角色动画
  this.characterAnimations[1].stop();  // 停止跑步动画
  this.characterAnimations[0].play();  // 播放待机动画
}
```

## 关键帧计算方法

### 时间到帧数转换

```typescript
// 时间（秒） × 帧率 = 帧数
const time = 5;  // 5 秒
const frame = time * fps;  // 5 × 60 = 300 帧
```

### 停留效果

```typescript
// 连续两个相同值的关键帧 = 停留
camKeys.push({ frame: 300, value: new Vector3(-6, 2, -10) });
camKeys.push({ frame: 480, value: new Vector3(-6, 2, -10) });  // 3秒停留
```

## 常见问题

### Q1: 如何添加缓动效果？

```typescript
import { BezierCurveEase } from "@babylonjs/core";

// 创建贝塞尔缓动
const easingFunction = new BezierCurveEase(0.25, 0.1, 0.25, 1);
camAnim.setEasingFunction(easingFunction);
```

### Q2: 如何同时动画多个属性？

```typescript
// 位置动画
const posAnim = new Animation("pos", "position", fps, ...);
// 旋转动画
const rotAnim = new Animation("rot", "rotation", fps, ...);

// 都添加到相机
camera.animations.push(posAnim);
camera.animations.push(rotAnim);

// 同时播放
scene.beginAnimation(camera, 0, 100, false);
```

### Q3: 如何创建循环过场动画？

```typescript
// 使用 CYCLE 循环模式
const anim = new Animation(
  "loop",
  "position",
  fps,
  Animation.ANIMATIONTYPE_VECTOR3,
  Animation.ANIMATIONLOOPMODE_CYCLE
);
```

### Q4: 如何中途跳过过场动画？

```typescript
// 保存动画引用
this.animatable = scene.beginAnimation(camera, 0, 100);

// 跳过时停止动画
skipButton.onclick = () => {
  this.animatable.stop();
  this.EndCutscene();
};
```

## 实际应用建议

1. **帧率选择**：60 FPS 提供流畅动画，30 FPS 减少计算量
2. **关键帧数量**：少而精，让插值处理中间帧
3. **测试场景**：先在简单场景测试动画路径
4. **动画时长**：过场动画建议 5-15 秒，避免过长
5. **性能优化**：使用 `waitAsync()` 而非轮询检查

## 扩展功能

### 添加相机旋转动画

```typescript
// 同时控制位置和旋转
const rotAnim = new Animation(
  "rotAnim",
  "rotation",
  fps,
  Animation.ANIMATIONTYPE_VECTOR3,
  Animation.ANIMATIONLOOPMODE_CONSTANT
);

rotKeys.push({ frame: 0, value: new Vector3(0, 0, 0) });
rotKeys.push({ frame: 300, value: new Vector3(0, Math.PI, 0) });
```

### 添加淡入淡出

```typescript
import { Color4 } from "@babylonjs/core";

// 创建场景淡出
scene.fadeOut(1000);  // 1秒淡出
await delay(1000);
scene.fadeIn(1000);   // 1秒淡入
```

## 相关教程

- **16_Animations** - 基础动画系统
- **17_Rigged_Animations** - 骨骼动画
- **19_Animation_Events** - 动画事件
- **20_Animation_Blending** - 动画混合

## 参考资料

- [Animation API 文档](https://doc.babylonjs.com/typedoc/classes/babylon.animation)
- [关键帧动画教程](https://doc.babylonjs.com/features/featuresDeepDive/animation/animation_design)
- [相机动画示例](https://www.babylonjs-playground.com/#9RUHH#1)