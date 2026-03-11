# 08. Babylon.js 相机机制 (Camera Mechanics)

## 课程概述

本课程深入讲解 Babylon.js 中的相机系统，重点介绍 **ArcRotateCamera**（弧形旋转相机）在产品可视化中的应用。通过一个电子商务产品展示示例，学习如何配置专业级别的产品展示相机。

### 学习目标

- 理解不同相机类型的使用场景
- 掌握 ArcRotateCamera 的核心参数配置
- 学习相机行为（自动旋转、框架行为、弹跳行为）
- 实现产品展示的最佳实践

---

## 核心知识点

### 1. 相机类型对比

Babylon.js 提供多种相机类型，选择合适的相机是关键：

| 相机类型 | 适用场景 | 特点 |
|---------|---------|------|
| **FreeCamera** | 建筑漫游、大型场景探索 | 用户自由移动，WASD 控制 |
| **ArcRotateCamera** | 产品展示、模型查看 | 围绕目标旋转，鼠标拖拽 |
| **UniversalCamera** | 通用场景 | 支持键盘、鼠标、触摸 |
| **FollowCamera** | 跟随角色 | 自动跟随目标网格 |
| **TouchCamera** | 移动设备 | 优化触摸控制 |

### 2. FreeCamera vs ArcRotateCamera

**FreeCamera 问题**（产品展示场景）：
- 用户需要"走进"产品才能查看细节
- 无法自动围绕产品旋转
- 缺乏产品展示的专业感

**ArcRotateCamera 优势**：
- 相机围绕目标点旋转，目标始终在画面中心
- 支持自动旋转动画效果
- 可限制缩放范围和平移功能

---

## ArcRotateCamera 详解

### 基本参数

```typescript
const camera = new ArcRotateCamera(
  "camera",           // 相机名称
  alpha,              // 水平旋转角度（弧度）
  beta,               // 垂直旋转角度（弧度）
  radius,             // 相机到目标的距离
  target,             // 目标点（Vector3 或 AbstractMesh）
  scene               // 所属场景
);
```

### Alpha 和 Beta 角度理解

```
            Y+
            |
            |
            |_______ X+
           /
          /
        Z+

Beta (垂直角度):
- 0 = 顶部向下看
- PI/2 = 水平方向
- PI = 底部向上看

Alpha (水平角度):
- 0 = 正 X 轴方向
- PI/2 = 正 Z 轴方向
- PI = 负 X 轴方向
- -PI/2 = 负 Z 轴方向
```

**重要**：Beta 顺时针增加，Alpha 逆时针增加。

### 常用属性配置

```typescript
// 附加控制到画布
camera.attachControl(canvas, true);

// 滚轮缩放精度（值越大缩放越慢）
camera.wheelPrecision = 100;

// 近裁剪平面（防止近距离裁剪）
camera.minZ = 0.3;

// 半径限制
camera.lowerRadiusLimit = 1;  // 最小距离
camera.upperRadiusLimit = 5;  // 最大距离

// 禁用平移（产品展示推荐）
camera.panningSensibility = 0;
```

---

## 相机行为 (Camera Behaviors)

### 1. 自动旋转行为 (AutoRotationBehavior)

让相机自动围绕目标旋转，产品展示常用：

```typescript
// 启用自动旋转
camera.useAutoRotationBehavior = true;

// 配置旋转参数
camera.autoRotationBehavior.idleRotationSpeed = 0.5;        // 旋转速度（弧度/秒）
camera.autoRotationBehavior.idleRotationSpinupTime = 1000;  // 加速时间（毫秒）
camera.autoRotationBehavior.idleRotationWaitTime = 2000;    // 等待时间（毫秒）
camera.autoRotationBehavior.zoomStopsAnimation = true;      // 缩放时停止动画
```

**参数说明**：
- `idleRotationSpeed`: 每秒旋转的弧度数（0.5 约等于每秒 28.6 度）
- `idleRotationSpinupTime`: 从静止到全速的过渡时间
- `idleRotationWaitTime`: 用户停止交互后多久开始旋转
- `zoomStopsAnimation`: 用户缩放时是否暂停旋转

### 2. 框架行为 (FramingBehavior)

自动调整相机以适应目标网格的边界：

```typescript
// 启用框架行为
camera.useFramingBehavior = true;

// 配置框架参数
camera.framingBehavior.radiusScale = 2;     // 距离缩放比例
camera.framingBehavior.framingTime = 4000;  // 过渡动画时间（毫秒）

// 设置目标网格
camera.setTarget(mesh);  // 使用网格的边界自动调整
```

**工作原理**：
- 当设置目标为网格时，相机自动计算合适的距离
- 根据网格的边界框调整相机位置
- `radiusScale` 控制最终距离（大于 1 更远，小于 1 更近）

### 3. 弹跳行为 (BouncingBehavior)

到达半径限制时产生弹跳效果：

```typescript
// 启用弹跳行为
camera.useBouncingBehavior = true;

// 配置弹跳参数
camera.bouncingBehavior.transitionDuration = 450;  // 过渡时间（毫秒）
camera.bouncingBehavior.lowerDistanceThreshold = 0.1;  // 下限阈值
camera.bouncingBehavior.upperDistanceThreshold = 0.1;  // 上限阈值
```

**注意**：专业产品展示通常不使用弹跳效果。

---

## 裁剪平面 (Clipping Planes)

### 近裁剪平面问题

当相机离物体太近时，会出现裁剪现象（部分物体消失）：

```typescript
// 解决近距离裁剪问题
camera.minZ = 0.3;  // 降低近裁剪平面距离
```

### 裁剪平面原理

```
        相机位置
            |
    近裁剪平面  ----  不渲染
            |
            |      渲染区域
            |
    远裁剪平面  ----  不渲染
            |
```

**建议**：
- `minZ`: 产品展示设置 0.3 或更低
- `maxZ`: 通常不需要修改（默认 10000）

---

## 产品展示最佳实践

### 完整配置示例

```typescript
function createProductCamera(canvas: HTMLCanvasElement, scene: Scene): ArcRotateCamera {
  const camera = new ArcRotateCamera(
    "productCamera",
    -Math.PI / 2,      // 正面朝向
    Math.PI / 2,       // 水平视角
    4,                 // 合适的初始距离
    Vector3.Zero(),    // 初始目标
    scene
  );

  // 附加控制
  camera.attachControl(canvas, true);

  // 缩放控制
  camera.wheelPrecision = 100;      // 精细缩放

  // 裁剪平面
  camera.minZ = 0.3;

  // 距离限制
  camera.lowerRadiusLimit = 1;      // 不能太近
  camera.upperRadiusLimit = 10;     // 不能太远

  // 禁用平移
  camera.panningSensibility = 0;

  // 自动旋转
  camera.useAutoRotationBehavior = true;
  camera.autoRotationBehavior.idleRotationSpeed = 0.3;
  camera.autoRotationBehavior.idleRotationWaitTime = 3000;
  camera.autoRotationBehavior.zoomStopsAnimation = true;

  return camera;
}
```

### 相机选择指南

| 应用场景 | 推荐相机 | 关键配置 |
|---------|---------|---------|
| 产品展示 | ArcRotateCamera | 自动旋转、禁用平移、限制半径 |
| 建筑漫游 | FreeCamera | 较慢速度、启用碰撞检测 |
| 角色跟随 | FollowCamera | 设置跟随目标和偏移 |
| 移动端查看 | ArcRotateCamera + 触摸 | 较高的触摸灵敏度 |
| VR 体验 | VRDeviceOrientationCamera | 自动处理头部追踪 |

---

## 代码示例

### 基础 ArcRotateCamera 设置

```typescript
// 文件：src/BabylonExamples/CameraMechanics.ts

CreateCamera(): void {
  // 创建相机
  this.camera = new ArcRotateCamera(
    "camera",
    -Math.PI / 2,       // alpha: -90 度
    Math.PI / 2,        // beta: 90 度（水平）
    40,                 // 初始距离
    Vector3.Zero(),     // 目标：原点
    this.scene
  );

  // 基本控制
  this.camera.attachControl(this.canvas, true);
  this.camera.wheelPrecision = 100;

  // 裁剪和限制
  this.camera.minZ = 0.3;
  this.camera.lowerRadiusLimit = 1;
  this.camera.upperRadiusLimit = 5;
  this.camera.panningSensibility = 0;
}
```

### 设置网格目标

```typescript
async CreateWatch(): Promise<void> {
  const { meshes } = await SceneLoader.ImportMeshAsync(
    "",
    "./models/",
    "vintage_watch.glb"
  );

  // 使用特定网格作为目标（框架行为会使用其边界）
  // meshes[2] 通常有最准确的边界框
  this.camera.setTarget(meshes[2]);
}
```

---

## 常见问题

### Q1: 相机视角不对，看到物体的背面或侧面

**解决**：调整 alpha 和 beta 参数

```typescript
// 正面视角
camera.alpha = -Math.PI / 2;  // -90 度
camera.beta = Math.PI / 2;    // 90 度（水平）
```

### Q2: 缩放太快或太慢

**解决**：调整 wheelPrecision

```typescript
camera.wheelPrecision = 100;  // 值越大缩放越慢
```

### Q3: 物体近距离被裁剪

**解决**：降低 minZ 值

```typescript
camera.minZ = 0.3;  // 或更低，如 0.1
```

### Q4: 用户可以平移相机，产品移出画面

**解决**：禁用平移

```typescript
camera.panningSensibility = 0;  // 完全禁用
```

### Q5: 自动旋转太快或太慢

**解决**：调整 idleRotationSpeed

```typescript
camera.autoRotationBehavior.idleRotationSpeed = 0.3;  // 较慢
// 或
camera.autoRotationBehavior.idleRotationSpeed = 1.0;  // 较快
```

### Q6: 框架行为使相机太近或太远

**解决**：调整 radiusScale 或设置正确的目标网格

```typescript
camera.framingBehavior.radiusScale = 2;  // 拉远
// 或
camera.setTarget(meshes[correctIndex]);   // 使用正确的网格
```

---

## 进阶技巧

### 平滑过渡到特定视角

```typescript
// 使用动画平滑过渡相机位置
import { Animation } from "@babylonjs/core";

function animateCameraTo(camera: ArcRotateCamera, alpha: number, beta: number, radius: number) {
  const animationAlpha = new Animation(
    "cameraAlpha", "alpha", 30,
    Animation.ANIMATIONTYPE_FLOAT,
    Animation.ANIMATIONLOOPMODE_CONSTANT
  );

  animationAlpha.setKeys([
    { frame: 0, value: camera.alpha },
    { frame: 30, value: alpha }
  ]);

  camera.animations.push(animationAlpha);
  // 类似设置 beta 和 radius...
}
```

### 相机碰撞检测

```typescript
// 启用碰撞检测，防止相机穿过物体
camera.checkCollisions = true;
camera.applyGravity = true;

// 设置碰撞半径
camera.ellipsoid = new Vector3(1, 1, 1);
```

---

## 总结

1. **选择正确的相机类型**：产品展示使用 ArcRotateCamera
2. **配置合理的限制**：半径限制、禁用平移
3. **添加自动旋转**：提升用户体验
4. **解决裁剪问题**：设置合适的 minZ
5. **使用框架行为**：自动适应模型大小

---

## 相关资源

- [Babylon.js 相机文档](https://doc.babylonjs.com/features/featuresDeepDive/cameras)
- [ArcRotateCamera API](https://doc.babylonjs.com/typedoc/classes/babylon.arcrotatecamera)
- [相机行为文档](https://doc.babylonjs.com/features/featuresDeepDive/cameras/cameraBehaviors)
