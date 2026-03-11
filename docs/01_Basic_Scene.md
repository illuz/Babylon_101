# 01_Basic_Scene - Babylon.js 基础场景

## 课程概述

本课程是 Babylon.js 学习之旅的第一步，介绍了创建 3D 场景所需的基本概念和组件。通过本课程，你将学习如何：

- 创建一个完整的 Babylon.js 场景
- 理解 Engine（引擎）和 Scene（场景）的关系
- 添加相机来观察场景
- 添加光源来照亮物体
- 创建基本的 3D 几何体

完成本课程后，你将能够创建一个包含地面和球体的简单 3D 场景，并可以通过键盘和鼠标自由浏览。

---

## 核心知识点

### 1. Engine（引擎）

**Engine** 是 Babylon.js 的核心组件，负责：

- 初始化 WebGL 渲染上下文
- 管理 GPU 资源
- 运行渲染循环
- 处理硬件能力检测

```typescript
// 创建引擎
const engine = new Engine(canvas, true);
// 参数说明：
// - canvas: HTMLCanvasElement - 渲染目标
// - true: 启用抗锯齿（antialiasing）
```

**关键方法**：
- `runRenderLoop(callback)` - 启动渲染循环，每帧执行回调函数
- `resize()` - 当窗口大小改变时调整渲染尺寸

---

### 2. Scene（场景）

**Scene** 是所有 3D 对象的容器，类似于一个"虚拟世界"。它包含：

- 相机（Camera）
- 光源（Light）
- 网格（Mesh）
- 材质（Material）
- 动画（Animation）

```typescript
// 创建场景
const scene = new Scene(engine);

// 渲染场景
scene.render();
```

**场景的重要属性**：
- `scene.meshes` - 场景中所有网格的数组
- `scene.lights` - 场景中所有光源的数组
- `scene.cameras` - 场景中所有相机的数组

---

### 3. FreeCamera（自由相机）

**FreeCamera** 提供第一人称视角的相机控制，允许用户自由浏览场景。

```typescript
// 创建自由相机
const camera = new FreeCamera("camera", new Vector3(0, 1, -5), scene);
camera.attachControl();
```

**参数说明**：
| 参数 | 类型 | 说明 |
|------|------|------|
| name | string | 相机名称 |
| position | Vector3 | 相机初始位置 |
| scene | Scene | 所属场景 |

**默认控制方式**：
- **W** - 向前移动
- **S** - 向后移动
- **A** - 向左移动
- **D** - 向右移动
- **鼠标移动** - 旋转视角

---

### 4. HemisphericLight（半球光）

**HemisphericLight** 模拟环境光照，提供柔和、均匀的光照效果。

```typescript
// 创建半球光
const hemiLight = new HemisphericLight(
  "hemiLight",           // 光源名称
  new Vector3(0, 1, 0),  // 光照方向（从上往下）
  scene                   // 所属场景
);
hemiLight.intensity = 0.5; // 设置光照强度
```

**特点**：
- 模拟天空和地面的漫反射光
- 不产生阴影
- 适合作为基础环境光

**常用属性**：
| 属性 | 类型 | 说明 |
|------|------|------|
| intensity | number | 光照强度（0-1+） |
| diffuse | Color3 | 漫反射颜色 |
| specular | Color3 | 高光颜色 |
| groundColor | Color3 | 地面反射颜色 |

---

### 5. MeshBuilder（网格构建器）

**MeshBuilder** 提供创建基本几何体的静态方法。

#### CreateGround - 创建地面

```typescript
const ground = MeshBuilder.CreateGround(
  "ground",                      // 网格名称
  { width: 10, height: 10 },     // 配置选项
  scene                          // 所属场景
);
```

**配置选项**：
| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| width | number | 1 | X 轴方向宽度 |
| height | number | 1 | Z 轴方向深度 |
| subdivisions | number | 1 | 细分数量 |

#### CreateSphere - 创建球体

```typescript
const ball = MeshBuilder.CreateSphere(
  "ball",                    // 网格名称
  { diameter: 1 },           // 配置选项
  scene                      // 所属场景
);
```

**配置选项**：
| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| diameter | number | 1 | 球体直径 |
| segments | number | 32 | 细分段数 |

---

### 6. Vector3（三维向量）

**Vector3** 用于表示三维空间中的位置、方向和缩放。

```typescript
// 创建向量
const position = new Vector3(x, y, z);

// 常用方法
position.add(otherVector);      // 向量加法
position.subtract(otherVector); // 向量减法
position.scale(factor);         // 缩放
position.normalize();           // 归一化
position.length();              // 获取长度
```

**坐标系统**：
- Babylon.js 使用**右手坐标系**
- X 轴：左右方向（正值向右）
- Y 轴：上下方向（正值向上）
- Z 轴：前后方向（正值向前）

---

## 代码示例与解释

### 完整代码结构

```typescript
export class BasicScene {
  scene: Scene;
  engine: Engine;

  constructor(private canvas: HTMLCanvasElement) {
    // 步骤 1: 创建引擎
    this.engine = new Engine(this.canvas, true);

    // 步骤 2: 创建场景
    this.scene = this.CreateScene();

    // 步骤 3: 启动渲染循环
    this.engine.runRenderLoop(() => {
      this.scene.render();
    });
  }

  CreateScene(): Scene {
    // 创建场景容器
    const scene = new Scene(this.engine);

    // 添加相机
    const camera = new FreeCamera("camera", new Vector3(0, 1, -5), scene);
    camera.attachControl();

    // 添加光源
    const hemiLight = new HemisphericLight("hemiLight", new Vector3(0, 1, 0), scene);
    hemiLight.intensity = 0.5;

    // 添加地面
    const ground = MeshBuilder.CreateGround("ground", { width: 10, height: 10 }, scene);

    // 添加球体
    const ball = MeshBuilder.CreateSphere("ball", { diameter: 1 }, scene);
    ball.position = new Vector3(0, 1, 0);

    return scene;
  }
}
```

### 渲染循环工作原理

```
┌─────────────────────────────────────────┐
│           渲染循环 (Render Loop)         │
├─────────────────────────────────────────┤
│                                         │
│   engine.runRenderLoop(() => {          │
│       scene.render();                   │
│   });                                   │
│                                         │
│   每帧执行：                             │
│   1. 更新场景状态（动画、物理等）         │
│   2. 执行视锥体裁剪                      │
│   3. 执行绘制调用                        │
│   4. 输出到 canvas                      │
│                                         │
│   ↓ 60 FPS（默认）                      │
│   ┌──────────────────────────────┐      │
│   │ Frame N → Frame N+1 → ...    │      │
│   └──────────────────────────────┘      │
└─────────────────────────────────────────┘
```

---

## 常见问题

### Q1: 为什么场景是黑色的？

**原因**：场景中没有光源，或者相机位置不正确。

**解决方案**：
1. 确保添加了光源（如 HemisphericLight）
2. 检查相机位置是否能够看到场景中的物体
3. 确保光源的 intensity 大于 0

```typescript
// 检查光源
console.log(scene.lights); // 查看场景中的光源

// 检查相机位置
console.log(camera.position); // 查看相机位置
```

---

### Q2: 如何调整相机速度？

**解决方案**：设置相机的 speed 属性。

```typescript
camera.speed = 0.5; // 降低移动速度（默认值约 1.0）
```

---

### Q3: 如何让物体有颜色？

**解决方案**：使用 StandardMaterial 或 PBRMaterial。

```typescript
import { StandardMaterial, Color3 } from "@babylonjs/core";

const material = new StandardMaterial("material", scene);
material.diffuseColor = new Color3(1, 0, 0); // 红色

ball.material = material; // 应用材质到球体
```

---

### Q4: 如何处理窗口大小变化？

**解决方案**：监听 window resize 事件并调用 engine.resize()。

```typescript
window.addEventListener("resize", () => {
  engine.resize();
});
```

---

### Q5: CreateGround 的 height 参数是什么意思？

**说明**：在 `CreateGround` 中，`height` 参数指的是 Z 轴方向的深度，而不是 Y 轴方向的高度。这是因为地面是一个水平平面，没有"高度"的概念。

```typescript
MeshBuilder.CreateGround("ground", {
  width: 10,   // X 轴方向宽度
  height: 10   // Z 轴方向深度
}, scene);
```

---

## 扩展学习

### 其他相机类型

| 相机类型 | 用途 | 特点 |
|----------|------|------|
| ArcRotateCamera | 轨道旋转相机 | 围绕目标点旋转 |
| UniversalCamera | 通用相机 | 支持多种控制方式 |
| FollowCamera | 跟随相机 | 自动跟随目标对象 |

### 其他光源类型

| 光源类型 | 用途 | 特点 |
|----------|------|------|
| DirectionalLight | 方向光 | 模拟太阳光，产生阴影 |
| PointLight | 点光源 | 向四周发射光线 |
| SpotLight | 聚光灯 | 锥形光束 |

### 其他基本几何体

```typescript
// 创建立方体
MeshBuilder.CreateBox("box", { size: 1 }, scene);

// 创建圆柱体
MeshBuilder.CreateCylinder("cylinder", { height: 2, diameter: 1 }, scene);

// 创建平面
MeshBuilder.CreatePlane("plane", { size: 1 }, scene);
```

---

## 下一步

完成本课程后，建议继续学习：

- **02_Standard_Materials** - 学习如何为物体添加材质和颜色
- **05_Lights_Shadows** - 深入了解光源和阴影
- **08_Camera_Mechanics** - 探索更多相机控制技巧

---

## 参考资料

- [Babylon.js 官方文档](https://doc.babylonjs.com/)
- [Babylon.js API 参考](https://doc.babylonjs.com/typedoc)
- [WebGL 基础知识](https://webglfundamentals.org/)