# 01 - Basic Scene 基础场景

## 课程概述

本课程介绍 Babylon.js 中最基础的场景构建。通过学习，你将理解 Babylon.js 的核心架构，包括：

- **Engine（引擎）**：渲染引擎，管理 WebGL 上下文
- **Scene（场景）**：所有 3D 对象的容器
- **Camera（相机）**：定义观察者的视角
- **Light（灯光）**：照亮场景
- **Mesh（网格）**：可见的 3D 几何体

## 核心知识点

### 1. Engine（引擎）

Engine 是 Babylon.js 的核心组件，负责：

- 初始化 WebGL 渲染上下文
- 管理渲染循环（Render Loop）
- 处理窗口大小变化

```typescript
// 创建引擎
// 参数1: canvas 元素
// 参数2: 是否启用抗锯齿（anti-aliasing）
const engine = new Engine(canvas, true);

// 启动渲染循环
engine.runRenderLoop(() => {
  scene.render();
});
```

**关键概念：渲染循环**

渲染循环是一个持续执行的过程，每秒执行多次（通常为 60 次），每次执行都会：
1. 清除画布
2. 计算场景中所有对象的变换
3. 绘制可见对象

### 2. Scene（场景）

Scene 是所有 3D 元素的容器，包括：

- 相机（Camera）
- 灯光（Light）
- 网格（Mesh）
- 材质（Material）
- 纹理（Texture）

```typescript
const scene = new Scene(engine);
```

场景与引擎的关系：引擎负责渲染，场景负责存储内容。

### 3. FreeCamera（自由相机）

FreeCamera 允许用户自由移动视角，支持：

- WASD 键盘移动
- 鼠标拖拽旋转
- 触摸屏支持

```typescript
// 创建相机
// 参数1: 相机名称
// 参数2: 相机位置 Vector3(x, y, z)
// 参数3: 所属场景
const camera = new FreeCamera("camera", new Vector3(0, 1, -5), scene);

// 绑定控件到 canvas
camera.attachControl();
```

**Vector3 坐标系统**

Babylon.js 使用右手坐标系：
- X 轴：左右方向
- Y 轴：上下方向
- Z 轴：前后方向（负 Z 指向屏幕内）

### 4. HemisphericLight（半球光）

HemisphericLight 模拟环境光照，特点是：

- 光照均匀柔和
- 模拟天空和地面的漫反射
- 适合作为基础环境光

```typescript
// 创建半球光
// 参数1: 灯光名称
// 参数2: 光照方向 Vector3
// 参数3: 所属场景
const hemiLight = new HemisphericLight(
  "hemiLight",
  new Vector3(0, 1, 0),  // 从上方照射
  scene
);

// 设置光照强度（0-1）
hemiLight.intensity = 0.5;
```

### 5. MeshBuilder（网格构建器）

MeshBuilder 提供多种预定义几何体的创建方法：

| 方法 | 描述 |
|------|------|
| `CreateSphere` | 创建球体 |
| `CreateBox` | 创建立方体 |
| `CreateGround` | 创建地面平面 |
| `CreateCylinder` | 创建圆柱体 |
| `CreateTorus` | 创建圆环 |

```typescript
// 创建地面
const ground = MeshBuilder.CreateGround(
  "ground",
  { width: 10, height: 10 },  // 尺寸选项
  scene
);

// 创建球体
const ball = MeshBuilder.CreateSphere(
  "ball",
  { diameter: 1 },  // 直径选项
  scene
);

// 设置球体位置
ball.position = new Vector3(0, 1, 0);
```

## 代码示例

完整的 BasicScene 类：

```typescript
import {
  Scene,
  Engine,
  FreeCamera,
  Vector3,
  HemisphericLight,
  MeshBuilder,
} from "@babylonjs/core";

export class BasicScene {
  scene: Scene;
  engine: Engine;

  constructor(private canvas: HTMLCanvasElement) {
    this.engine = new Engine(this.canvas, true);
    this.scene = this.CreateScene();

    this.engine.runRenderLoop(() => {
      this.scene.render();
    });
  }

  CreateScene(): Scene {
    const scene = new Scene(this.engine);

    // 相机
    const camera = new FreeCamera("camera", new Vector3(0, 1, -5), this.scene);
    camera.attachControl();

    // 灯光
    const hemiLight = new HemisphericLight(
      "hemiLight",
      new Vector3(0, 1, 0),
      this.scene
    );
    hemiLight.intensity = 0.5;

    // 地面
    const ground = MeshBuilder.CreateGround(
      "ground",
      { width: 10, height: 10 },
      this.scene
    );

    // 球体
    const ball = MeshBuilder.CreateSphere("ball", { diameter: 1 }, this.scene);
    ball.position = new Vector3(0, 1, 0);

    return scene;
  }
}
```

## 常见问题

### Q1: 为什么球体位置 y=1，球体底部刚好接触地面？

球体的 `position` 是其中心点位置。球体直径为 1，半径为 0.5。当 y=1 时，球心距地面 1 个单位，球体底部距地面 1-0.5=0.5 个单位。如果要让球体刚好接触地面，y 应该等于半径值，即 y=0.5。

**修正**：实际 y=1 时，球心高度为 1，半径 0.5，底部高度为 0.5，所以球体悬浮在地面之上。要让球体刚好接触地面（底部高度为 0），y 应该等于半径 = 0.5。

### Q2: 为什么相机 z=-5 时能看到原点的物体？

在 Babylon.js 的右手坐标系中，负 Z 方向指向屏幕内。相机位于 z=-5 意味着相机在物体"前方"（屏幕外），看向正 Z 方向（屏幕内），所以能看到原点 (0,0,0) 处的物体。

### Q3: `camera.attachControl()` 的作用是什么？

该方法将相机控件绑定到 canvas 元素上。绑定后，用户可以通过以下方式控制相机：
- 鼠标左键拖拽：旋转视角
- WASD 键：前后左右移动
- Q/E 键：上下移动

### Q4: 什么是渲染循环？为什么需要它？

渲染循环是一个持续执行的回调函数，通常以 60fps 的速度运行。每次渲染都会：
1. 更新场景中所有对象的变换矩阵
2. 计算光照和材质效果
3. 将 3D 场景投影到 2D 画布上

没有渲染循环，场景只会渲染一次，不会响应任何变化。

### Q5: HemisphericLight 和 DirectionalLight 有什么区别？

| 特性 | HemisphericLight | DirectionalLight |
|------|------------------|------------------|
| 光照特点 | 环境光，均匀柔和 | 平行光，有明确方向 |
| 阴影 | 不产生阴影 | 可产生阴影 |
| 用途 | 基础环境光照 | 模拟太阳光 |

## 下一步

学习完基础场景后，建议继续学习：
- 02_Standard_Materials - 标准材质
- 03_PBR_Materials - PBR 材质
- 05_Lights_Shadows - 灯光与阴影
