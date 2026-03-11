# 08. Camera Mechanics in BabylonJS - 相机机制

本教程介绍如何使用 ArcRotateCamera（弧形旋转相机）创建产品展示效果，包括相机的基本配置、行为控制和取景功能。

## 概述

ArcRotateCamera 是 Babylon.js 中一种特殊的相机类型，它围绕目标点旋转，而不是在场景中自由移动。这种相机非常适合：

- 产品展示网站
- 3D 模型查看器
- 建筑可视化
- 电商产品预览

## 核心概念

### 1. ArcRotateCamera 的基本参数

```typescript
const camera = new ArcRotateCamera(
  "camera",
  alpha,    // 水平旋转角度（弧度）
  beta,     // 垂直旋转角度（弧度）
  radius,   // 相机到目标的距离
  target,   // 目标点（Vector3 或 AbstractMesh）
  scene
);
```

#### Alpha 和 Beta 参数说明

根据 Babylon.js 官方文档的图示：

- **Alpha（水平旋转）**：
  - 控制相机围绕目标点的水平旋转
  - 以弧度为单位，逆时针方向增加
  - `Math.PI / 2` = 90 度
  - `-Math.PI / 2` = -90 度

- **Beta（垂直旋转）**：
  - 控制相机的垂直角度
  - 以弧度为单位，顺时针方向增加
  - 0 度在正上方，180 度在正下方
  - `Math.PI / 2` = 90 度（水平位置）

```
         Beta = 0（顶部）
              |
              |
    Alpha ----+---- 目标点
              |
              |
         Beta = PI（底部）
```

### 2. 滚轮精度（Wheel Precision）

```typescript
camera.wheelPrecision = 100;
```

控制鼠标滚轮缩放的速度：
- 默认值为 3，缩放速度较快
- 值越大，缩放越精细
- 产品展示建议设置 50-100 之间

### 3. 裁剪平面（Clipping Planes）

```typescript
camera.minZ = 0.3;  // 近裁剪平面
// camera.maxZ = 1000;  // 远裁剪平面
```

裁剪平面决定相机可见的范围：

- **近裁剪平面（minZ）**：比此距离更近的物体不会被渲染
- **远裁剪平面（maxZ）**：比此距离更远的物体不会被渲染

```
        近裁剪平面              远裁剪平面
            |                      |
    相机 ---|----------物体--------|
            |                      |
          minZ=0.3              maxZ=1000
```

设置 minZ 为较小值可以让相机更靠近物体而不出现裁剪。

### 4. 半径限制（Radius Limits）

```typescript
camera.lowerRadiusLimit = 1;   // 最小距离
camera.upperRadiusLimit = 5;   // 最大距离
```

限制相机与目标的最大/最小距离：
- 防止相机穿过物体（设置 lowerRadiusLimit）
- 防止相机离得太远（设置 upperRadiusLimit）

### 5. 平移控制（Panning）

```typescript
camera.panningSensibility = 0;  // 禁用平移
```

控制平移操作的灵敏度：
- 设置为 0 可禁用平移
- 用户通过 Ctrl+左键 或 右键 进行平移
- 产品展示通常不需要平移功能

## 相机行为（Camera Behaviors）

Babylon.js 提供了多种相机行为，可以添加丰富的交互效果。

### 1. 弹跳行为（Bouncing Behavior）

```typescript
camera.useBouncingBehavior = true;
```

当相机达到半径限制时产生弹跳效果：
- 适用于游戏或交互式场景
- 产品展示通常不需要此效果

### 2. 自动旋转行为（Auto Rotation Behavior）

```typescript
camera.useAutoRotationBehavior = true;

// 配置参数
camera.autoRotationBehavior.idleRotationSpeed = 0.5;      // 旋转速度（弧度/秒）
camera.autoRotationBehavior.idleRotationSpinupTime = 1000; // 加速时间（毫秒）
camera.autoRotationBehavior.idleRotationWaitTime = 2000;   // 等待时间（毫秒）
camera.autoRotationBehavior.zoomStopsAnimation = true;    // 缩放时停止旋转
```

参数说明：
- `idleRotationSpeed`：旋转速度，以弧度/秒为单位
  - 0.5 ≈ 每秒 28.6 度
  - 1.0 ≈ 每秒 57.3 度
- `idleRotationSpinupTime`：从停止到全速旋转的时间
- `idleRotationWaitTime`：用户交互后等待多久开始旋转
- `zoomStopsAnimation`：用户缩放时是否暂停旋转

### 3. 取景行为（Framing Behavior）

```typescript
camera.useFramingBehavior = true;

// 配置参数
camera.framingBehavior.radiusScale = 2;      // 半径缩放因子
camera.framingBehavior.framingTime = 4000;   // 取景动画时间（毫秒）
```

取景行为会根据目标物体的包围盒自动调整相机位置：
- `radiusScale`：控制相机与目标的距离比例
  - 默认为 1
  - 值越大，相机越远
- `framingTime`：相机移动到目标位置的动画时长

## 设置相机目标

```typescript
// 方式 1：在构造函数中设置
const camera = new ArcRotateCamera("camera", alpha, beta, radius, Vector3.Zero(), scene);

// 方式 2：使用 setTarget 方法
camera.setTarget(mesh);
```

### 关于目标设置的注意事项

当使用取景行为时，需要注意：

1. **目标类型**：
   - `Vector3`：固定位置点
   - `AbstractMesh`：网格对象（会使用其包围盒）

2. **GLB 模型的目标选择**：
   - GLB 模型的根节点（meshes[0]）通常没有正确的包围盒
   - 需要选择具有包围盒的子网格作为目标
   - 可以通过 `showBoundingBox = true` 调试查看包围盒

```typescript
// 调试：显示包围盒
meshes[1].showBoundingBox = true;
meshes[2].showBoundingBox = true;
meshes[3].showBoundingBox = true;

// 选择合适的子网格作为目标
camera.setTarget(meshes[2]);
```

## 完整示例

```typescript
CreateCamera(): void {
  // 创建弧形旋转相机
  this.camera = new ArcRotateCamera(
    "camera",
    -Math.PI / 2,      // alpha: -90 度
    Math.PI / 2,       // beta: 90 度
    40,                // radius: 初始距离
    Vector3.Zero(),    // target: 世界原点
    this.scene
  );

  // 启用用户交互
  this.camera.attachControl(this.canvas, true);

  // 滚轮精度
  this.camera.wheelPrecision = 100;

  // 近裁剪平面
  this.camera.minZ = 0.3;

  // 半径限制
  this.camera.lowerRadiusLimit = 1;
  this.camera.upperRadiusLimit = 5;

  // 禁用平移
  this.camera.panningSensibility = 0;

  // 启用自动旋转
  this.camera.useAutoRotationBehavior = true;
  this.camera.autoRotationBehavior.idleRotationSpeed = 0.5;
  this.camera.autoRotationBehavior.idleRotationSpinupTime = 1000;
  this.camera.autoRotationBehavior.idleRotationWaitTime = 2000;
  this.camera.autoRotationBehavior.zoomStopsAnimation = true;

  // 启用取景行为
  this.camera.useFramingBehavior = true;
  this.camera.framingBehavior.framingTime = 4000;
}
```

## 相机行为组合效果

结合不同的相机行为可以创建丰富的交互体验：

1. **产品展示**：自动旋转 + 取景行为
   - 自动展示产品各个角度
   - 加载时自动调整到最佳视角

2. **建筑漫游**：弹跳行为 + 半径限制
   - 防止相机穿过墙壁
   - 平滑的边界反馈

3. **简单查看器**：仅半径限制 + 平移禁用
   - 用户可以自由查看
   - 但不能移动到不合理的位置

## 资源来源

本教程使用的资源：
- **3D 模型**：[Poly Haven - Vintage Pocket Watch](https://polyhaven.com/)
- **HDR 环境**：[Poly Haven - Christmas Photo Studio 01](https://polyhaven.com/hdris)

## 总结

ArcRotateCamera 是创建产品展示和模型查看器的理想选择。通过合理配置：

1. 使用 `wheelPrecision` 控制缩放速度
2. 使用 `minZ` 解决近处裁剪问题
3. 使用 `radiusLimit` 限制相机范围
4. 使用自动旋转行为增加动态效果
5. 使用取景行为自动调整视角

这些技术的组合可以创建专业级的 3D 产品展示效果。