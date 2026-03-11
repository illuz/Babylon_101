# Babylon.js 相机机制 (Camera Mechanics)

## 概述

本章节介绍 Babylon.js 中的相机系统，重点讲解 `ArcRotateCamera`（弧形旋转相机）在产品展示场景中的应用。通过本章节，你将学会如何配置相机参数、设置相机行为以及解决常见的相机问题（如裁剪和缩放速度）。

## 相机类型对比

### FreeCamera（自由相机）

**适用场景**:
- 第一人称漫游
- 建筑可视化（房间/公寓浏览）
- 大型场景导航

**特点**:
- 用户可以自由移动和旋转相机
- 使用 WASD 或方向键移动，鼠标控制视角
- 相机位置改变，而不是围绕目标旋转

```typescript
const camera = new FreeCamera("camera", new Vector3(0, 0, -2), this.scene);
camera.attachControl();
camera.speed = 0.25; // 移动速度
```

### ArcRotateCamera（弧形旋转相机）

**适用场景**:
- 产品展示
- 3D 模型查看器
- 需要围绕单一对象观察的场景

**特点**:
- 相机始终围绕一个目标点旋转
- 用户不能自由移动相机位置，只能旋转和缩放
- 更适合展示单个产品或模型

```typescript
const camera = new ArcRotateCamera(
  "camera",
  -Math.PI / 2,  // alpha: 水平角度
  Math.PI / 2,   // beta: 垂直角度
  40,            // radius: 距离
  Vector3.Zero(), // target: 目标点
  this.scene
);
camera.attachControl(canvas, true);
```

## ArcRotateCamera 参数详解

### 核心参数

| 参数 | 说明 | 类型 | 示例值 |
|------|------|------|--------|
| name | 相机名称 | string | "camera" |
| alpha | 水平旋转角度（绕 Y 轴） | number | -Math.PI / 2 |
| beta | 垂直旋转角度（从 Y 轴向下） | number | Math.PI / 2 |
| radius | 相机到目标的距离 | number | 40 |
| target | 相机观察的目标点 | Vector3 | Vector3.Zero() |
| scene | 所属场景 | Scene | this.scene |

### Alpha 和 Beta 角度理解

**Alpha（水平角度）**:
- 控制相机在水平面上绕目标旋转
- 逆时针方向为正
- `Math.PI / 2` = 90 度
- `-Math.PI / 2` = -90 度

**Beta（垂直角度）**:
- 控制相机从上到下的角度
- 从 Y 轴正方向开始计算
- `0` = 从正上方观察
- `Math.PI / 2` = 从侧面（水平）观察
- `Math.PI` = 从正下方观察

**角度示意图**:
```
                    Y (beta = 0)
                    |
                    |
                    |
        alpha <-----+-----> alpha (正方向)
                    |
                    |
                    Z (beta = PI/2)
```

**常用角度计算**:
- 90 度 = `Math.PI / 2`
- 180 度 = `Math.PI`
- 270 度 = `3 * Math.PI / 2`

## 相机控制配置

### 缩放速度控制

```typescript
// wheelPrecision: 鼠标滚轮精度
// 值越大，缩放越慢越精细
// 默认值太小，产品展示建议设为 50-100
camera.wheelPrecision = 100;
```

### 裁剪平面设置

**近裁剪面（minZ）**:
- 定义相机能渲染的最近距离
- 小于此距离的物体将被"裁剪"（不渲染）
- 对于产品展示，设为较小值可以更近距离观察细节

```typescript
// 设置近裁剪面距离为 0.3
camera.minZ = 0.3;
```

**远裁剪面（maxZ）**:
- 定义相机能渲染的最远距离
- 大于此距离的物体将不被渲染
- 通常使用默认值，除非有特殊需求

### 半径限制

防止相机太近或太远，提供更好的用户体验：

```typescript
// 最小距离：防止相机穿透模型
camera.lowerRadiusLimit = 1;

// 最大距离：防止相机太远
camera.upperRadiusLimit = 5;
```

### 禁用平移

产品展示通常不需要平移相机位置：

```typescript
// 设为 0 禁用平移功能
camera.panningSensibility = 0;
```

## 相机行为（Behaviors）

### 自动旋转行为（AutoRotationBehavior）

当用户不操作时，相机会自动缓慢旋转展示产品：

```typescript
// 启用自动旋转行为
camera.useAutoRotationBehavior = true;

// 配置参数
camera.autoRotationBehavior.idleRotationSpeed = 0.5;      // 旋转速度
camera.autoRotationBehavior.idleRotationSpinupTime = 1000; // 加速时间（毫秒）
camera.autoRotationBehavior.idleRotationWaitTime = 2000;   // 等待时间（毫秒）
camera.autoRotationBehavior.zoomStopsAnimation = true;     // 缩放时停止旋转
```

**参数说明**:

| 参数 | 说明 |
|------|------|
| idleRotationSpeed | 闲置时的旋转速度 |
| idleRotationSpinupTime | 开始旋转的加速时间 |
| idleRotationWaitTime | 用户停止操作后等待时间 |
| zoomStopsAnimation | 缩放时是否停止旋转 |

### 取景行为（FramingBehavior）

自动调整相机以正确框住目标对象：

```typescript
// 启用取景行为
camera.useFramingBehavior = true;

// 配置参数
camera.framingBehavior.framingTime = 4000; // 取景动画时间（毫秒）
```

## 目标设置

### 设置相机目标

相机可以指向特定的网格或空间位置：

```typescript
// 设置目标为特定网格
camera.setTarget(meshes[2]);

// 或设置为空间位置
camera.target = new Vector3(0, 1, 0);
```

**选择合适的目标**:
- 对于导入的模型，不同部分可能有不同的中心点
- 选择合适的网格作为目标可以确保相机聚焦在产品的重要部分
- 可以通过 `mesh.showBoundingBox = true` 查看边界框来辅助选择

## 完整示例代码

```typescript
import {
  Scene,
  Engine,
  ArcRotateCamera,
  Vector3,
  CubeTexture,
  SceneLoader,
  AbstractMesh,
} from "@babylonjs/core";
import "@babylonjs/loaders";

export class CameraMechanics {
  scene: Scene;
  engine: Engine;
  watch: AbstractMesh;
  camera: ArcRotateCamera;

  constructor(private canvas: HTMLCanvasElement) {
    this.engine = new Engine(this.canvas, true);
    this.scene = this.CreateScene();
    this.engine.displayLoadingUI();

    this.CreateCamera();
    this.CreateWatch();

    this.engine.runRenderLoop(() => {
      this.scene.render();
    });
  }

  CreateScene(): Scene {
    const scene = new Scene(this.engine);

    const envTex = CubeTexture.CreateFromPrefilteredData(
      "./environment/xmas_bg.env",
      scene
    );
    envTex.gammaSpace = false;
    envTex.rotationY = Math.PI;
    scene.environmentTexture = envTex;
    scene.createDefaultSkybox(envTex, true, 1000, 0.25);

    return scene;
  }

  CreateCamera(): void {
    this.camera = new ArcRotateCamera(
      "camera",
      -Math.PI / 2,
      Math.PI / 2,
      40,
      Vector3.Zero(),
      this.scene
    );

    this.camera.attachControl(this.canvas, true);
    this.camera.wheelPrecision = 100;
    this.camera.minZ = 0.3;
    this.camera.lowerRadiusLimit = 1;
    this.camera.upperRadiusLimit = 5;
    this.camera.panningSensibility = 0;

    // 自动旋转行为
    this.camera.useAutoRotationBehavior = true;
    this.camera.autoRotationBehavior.idleRotationSpeed = 0.5;
    this.camera.autoRotationBehavior.idleRotationSpinupTime = 1000;
    this.camera.autoRotationBehavior.idleRotationWaitTime = 2000;
    this.camera.autoRotationBehavior.zoomStopsAnimation = true;

    // 取景行为
    this.camera.useFramingBehavior = true;
    this.camera.framingBehavior.framingTime = 4000;
  }

  async CreateWatch(): Promise<void> {
    const { meshes } = await SceneLoader.ImportMeshAsync(
      "",
      "./models/",
      "vintage_watch.glb"
    );
    this.watch = meshes[0];
    this.camera.setTarget(meshes[2]);
    this.engine.hideLoadingUI();
  }
}
```

## 常见问题与解决方案

### 问题1：缩放速度太快

**现象**: 使用鼠标滚轮缩放时，相机移动太快，难以精确控制。

**解决方案**:
```typescript
camera.wheelPrecision = 100; // 增大精度值
```

### 问题2：近距离观察时出现裁剪

**现象**: 相机靠近物体时，部分模型被"切掉"不显示。

**原因**: 近裁剪面距离太大。

**解决方案**:
```typescript
camera.minZ = 0.3; // 减小近裁剪面距离
```

### 问题3：相机可以穿透模型

**现象**: 用户可以将相机移动到模型内部。

**解决方案**:
```typescript
camera.lowerRadiusLimit = 1; // 设置最小距离限制
```

### 问题4：相机可以无限远离

**现象**: 用户可以将相机移得非常远，模型变得很小。

**解决方案**:
```typescript
camera.upperRadiusLimit = 5; // 设置最大距离限制
```

### 问题5：产品展示时可以平移

**现象**: 用户可以平移相机位置，偏离产品。

**解决方案**:
```typescript
camera.panningSensibility = 0; // 禁用平移
```

## 最佳实践

### 产品展示配置清单

- [ ] 使用 `ArcRotateCamera` 替代 `FreeCamera`
- [ ] 设置合适的 `wheelPrecision`（50-100）
- [ ] 配置 `minZ` 解决近距离裁剪
- [ ] 设置 `lowerRadiusLimit` 和 `upperRadiusLimit`
- [ ] 禁用 `panningSensibility` 或设为较小值
- [ ] 考虑启用 `AutoRotationBehavior` 提升体验
- [ ] 设置正确的相机目标点

### 调试技巧

```typescript
// 显示网格边界框，帮助选择目标
meshes[1].showBoundingBox = true;
meshes[2].showBoundingBox = true;

// 查看所有网格
console.log("meshes", meshes);
```

## 参考资源

- [Babylon.js 官方文档 - ArcRotateCamera](https://doc.babylonjs.com/typedoc/classes/babylon.arcrotatecamera)
- [Babylon.js 官方文档 - Camera Behaviors](https://doc.babylonjs.com/features/featuresDeepDive/behaviors/cameraBehaviors)
- [Poly Haven - 免费 3D 模型资源](https://polyhaven.com/)
- [Poly Haven - 免费 HDRI 环境贴图](https://polyhaven.com/hdris)