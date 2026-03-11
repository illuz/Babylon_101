# 01_Basic_Scene - 基础场景

## 课程概述

本课程是 Babylon.js 入门教程的第一课，介绍如何创建一个基础的 3D 场景。你将学习：

- **Engine（引擎）**：渲染引擎的初始化和渲染循环
- **Scene（场景）**：3D 世界的容器
- **FreeCamera（自由相机）**：基础相机控制
- **HemisphericLight（半球光）**：基础环境光照
- **MeshBuilder（网格构建器）**：创建基础几何体

## 核心知识点

### 1. Engine（引擎）

Engine 是 Babylon.js 的核心渲染引擎，负责：

- 创建 WebGL 上下文
- 管理渲染循环
- 处理硬件加速

```typescript
// 创建引擎
// 参数1: canvas 元素
// 参数2: true 表示启用抗锯齿（anti-aliasing）
this.engine = new Engine(this.canvas, true);

// 启动渲染循环
this.engine.runRenderLoop(() => {
  this.scene.render();  // 每帧渲染场景
});
```

**重要提示**：渲染循环会持续运行，直到页面关闭。

### 2. Scene（场景）

Scene 是所有 3D 对象的容器，包含：

- 相机（Camera）
- 光源（Light）
- 网格（Mesh）
- 材质（Material）

```typescript
const scene = new Scene(this.engine);
```

### 3. FreeCamera（自由相机）

FreeCamera 提供基础的第一人称相机控制：

```typescript
// 创建相机
// 参数1: 名称
// 参数2: 初始位置 (x, y, z)
// 参数3: 所属场景
const camera = new FreeCamera("camera", new Vector3(0, 1, -5), this.scene);

// 绑定控制到 canvas
camera.attachControl();

// 调整移动速度（可选）
camera.speed = 0.5;
```

**控制方式**：
- 鼠标拖动：旋转视角
- WASD / 方向键：移动
- 鼠标滚轮：缩放（部分模式下）

### 4. HemisphericLight（半球光）

HemisphericLight 模拟天空环境光：

```typescript
// 创建半球光
// 参数1: 名称
// 参数2: 光照方向（指向天空的方向）
// 参数3: 所属场景
const hemiLight = new HemisphericLight(
  "hemiLight",
  new Vector3(0, 1, 0),  // 指向上方
  this.scene
);

// 设置光照强度（0-1）
hemiLight.intensity = 0.5;
```

**特点**：
- 不会产生阴影
- 提供均匀的环境照明
- 适合作为基础光源

### 5. MeshBuilder（网格构建器）

MeshBuilder 用于创建基础几何体：

```typescript
// 创建地面
// 参数1: 名称
// 参数2: 配置对象（宽度、高度）
// 参数3: 所属场景
const ground = MeshBuilder.CreateGround(
  "ground",
  { width: 10, height: 10 },
  this.scene
);

// 创建球体
// 参数1: 名称
// 参数2: 配置对象（直径、分段数等）
// 参数3: 所属场景
const ball = MeshBuilder.CreateSphere(
  "ball",
  { diameter: 1 },
  this.scene
);

// 设置位置
ball.position = new Vector3(0, 1, 0);  // x=0, y=1, z=0
```

**常用几何体**：
| 方法 | 说明 |
|------|------|
| `CreateBox` | 立方体 |
| `CreateSphere` | 球体 |
| `CreateCylinder` | 圆柱体 |
| `CreateGround` | 地面 |
| `CreatePlane` | 平面 |
| `CreateTorus` | 圆环 |

### 6. Vector3（三维向量）

Vector3 表示三维空间中的点或方向：

```typescript
new Vector3(x, y, z)

// 常用静态属性
Vector3.Zero()      // (0, 0, 0)
Vector3.Up()        // (0, 1, 0)
Vector3.Forward()   // (0, 0, 1)
```

## 代码示例与解释

### 完整代码

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
    // 1. 创建引擎
    this.engine = new Engine(this.canvas, true);

    // 2. 创建场景
    this.scene = this.CreateScene();

    // 3. 启动渲染循环
    this.engine.runRenderLoop(() => {
      this.scene.render();
    });
  }

  CreateScene(): Scene {
    // 创建场景容器
    const scene = new Scene(this.engine);

    // 创建相机
    const camera = new FreeCamera("camera", new Vector3(0, 1, -5), this.scene);
    camera.attachControl();

    // 创建光源
    const hemiLight = new HemisphericLight(
      "hemiLight",
      new Vector3(0, 1, 0),
      this.scene
    );
    hemiLight.intensity = 0.5;

    // 创建地面
    const ground = MeshBuilder.CreateGround(
      "ground",
      { width: 10, height: 10 },
      this.scene
    );

    // 创建球体
    const ball = MeshBuilder.CreateSphere("ball", { diameter: 1 }, this.scene);
    ball.position = new Vector3(0, 1, 0);

    return scene;
  }
}
```

### 渲染流程图

```
初始化
   │
   ▼
┌─────────────────────────────────────┐
│  Engine 创建 (WebGL 上下文)          │
│  Scene 创建 (场景容器)               │
│  Camera 创建 (视角控制)              │
│  Light 创建 (光照)                   │
│  Mesh 创建 (几何体)                  │
└─────────────────────────────────────┘
   │
   ▼
┌─────────────────────────────────────┐
│         渲染循环 (60 FPS)            │
│  ┌───────────────────────────────┐  │
│  │  scene.render()               │  │
│  │    ├── 更新相机               │  │
│  │    ├── 计算光照               │  │
│  │    ├── 绘制网格               │  │
│  │    └── 输出到 Canvas          │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

## 常见问题

### Q1: 为什么场景是黑色的？

**原因**：没有光源或光源强度太低。

**解决方案**：
```typescript
// 添加光源
const light = new HemisphericLight("light", new Vector3(0, 1, 0), scene);
light.intensity = 1.0;  // 确保强度足够
```

### Q2: 如何调整相机速度？

```typescript
camera.speed = 0.5;      // 移动速度
camera.angularSensibility = 1000;  // 鼠标灵敏度（数值越大越慢）
```

### Q3: 如何让相机看向特定点？

```typescript
camera.setTarget(new Vector3(0, 0, 0));  // 看向原点
```

### Q4: 如何处理窗口大小变化？

```typescript
window.addEventListener("resize", () => {
  this.engine.resize();
});
```

### Q5: 如何禁用相机控制？

```typescript
camera.detachControl();  // 禁用
camera.attachControl();  // 启用
```

## 扩展学习

### 其他相机类型

| 相机类型 | 用途 |
|----------|------|
| `ArcRotateCamera` | 围绕目标旋转 |
| `UniversalCamera` | 支持触摸、游戏手柄 |
| `FollowCamera` | 自动跟随目标 |

### 其他光源类型

| 光源类型 | 特点 |
|----------|------|
| `DirectionalLight` | 平行光（太阳光） |
| `PointLight` | 点光源（灯泡） |
| `SpotLight` | 聚光灯 |

### 更多几何体

```typescript
// 立方体
MeshBuilder.CreateBox("box", { size: 2 }, scene);

// 圆柱体
MeshBuilder.CreateCylinder("cylinder", { height: 2, diameter: 1 }, scene);

// 圆环
MeshBuilder.CreateTorus("torus", { diameter: 2, thickness: 0.5 }, scene);
```

## 下一步学习

完成基础场景后，建议学习：

1. **02_Standard_Materials** - 为几何体添加材质和纹理
2. **03_PBR_Materials** - 使用 PBR 材质实现逼真效果
3. **05_Lights_Shadows** - 学习更多光照和阴影技术

## 参考资料

- [Babylon.js 官方文档](https://doc.babylonjs.com/)
- [Engine API](https://doc.babylonjs.com/typedoc/classes/babylon.engine)
- [Scene API](https://doc.babylonjs.com/typedoc/classes/babylon.scene)
- [FreeCamera API](https://doc.babylonjs.com/typedoc/classes/babylon.freecamera)
