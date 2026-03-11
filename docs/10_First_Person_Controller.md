# 第 10 课：第一人称控制器 (First Person Controller)

## 课程概述

本课介绍如何在 Babylon.js 中实现第一人称视角控制器，这是构建 FPS 游戏、建筑漫游、虚拟展厅等应用的核心技术。

### 学习目标

- 理解 Pointer Lock API 的工作原理
- 掌握 FreeCamera 的配置方法
- 实现键盘移动控制（WASD）
- 配置重力和碰撞检测
- 了解相机椭球体的概念

---

## 核心知识点

### 1. 第一人称相机控制

#### FreeCamera 简介

`FreeCamera` 是 Babylon.js 中最灵活的相机类型之一，支持：

- 自由移动和旋转
- 键盘控制
- 鼠标控制
- 重力和碰撞

```typescript
// 创建自由相机
const camera = new FreeCamera(
  "camera",                    // 相机名称
  new Vector3(0, 10, 0),       // 初始位置
  scene                        // 所属场景
);

// 绑定到 canvas
camera.attachControl();
```

#### 相机参数配置

| 属性 | 说明 | 示例值 |
|------|------|--------|
| `speed` | 移动速度 | 0.75 |
| `angularSensibility` | 角度灵敏度 | 4000（越大越慢）|
| `minZ` | 近裁剪面 | 0.45 |
| `ellipsoid` | 碰撞椭球体 | Vector3(1, 1, 1) |

---

### 2. 鼠标指针锁定 (Pointer Lock)

#### 工作原理

Pointer Lock API 允许网页锁定鼠标指针，实现：

- 隐藏鼠标光标
- 获取原始鼠标移动数据
- 360 度视角旋转

```typescript
// 进入指针锁定模式
scene.onPointerDown = (evt) => {
  if (evt.button === 0) this.engine.enterPointerlock();
  if (evt.button === 1) this.engine.exitPointerlock();
};
```

#### 鼠标按钮码

| 值 | 按钮 |
|----|------|
| 0 | 左键 |
| 1 | 中键 |
| 2 | 右键 |

---

### 3. 键盘移动控制

#### WASD 键映射

```typescript
// W 键 - 向前移动
camera.keysUp.push(87);

// A 键 - 向左移动
camera.keysLeft.push(65);

// S 键 - 向后移动
camera.keysDown.push(83);

// D 键 - 向右移动
camera.keysRight.push(68);
```

#### 键码对照表

| 键 | 键码 | 用途 |
|----|------|------|
| W | 87 | 向前 |
| A | 65 | 向左 |
| S | 83 | 向后 |
| D | 68 | 向右 |

---

### 4. 碰撞检测

#### 场景级别配置

```typescript
// 启用场景碰撞系统
scene.collisionsEnabled = true;
```

#### 相机碰撞配置

```typescript
// 相机启用碰撞检测
camera.checkCollisions = true;

// 设置碰撞椭球体（玩家"身体"大小）
camera.ellipsoid = new Vector3(1, 1, 1);
```

#### 网格碰撞配置

```typescript
// 为场景中的网格启用碰撞
mesh.checkCollisions = true;
```

#### 椭球体概念

椭球体定义了相机的碰撞体积：

- `ellipsoid = new Vector3(1, 1, 1)` 表示：
  - 宽度：2 单位（X 轴半径 1 x 2）
  - 高度：2 单位（Y 轴半径 1 x 2）
  - 深度：2 单位（Z 轴半径 1 x 2）

---

### 5. 重力模拟

#### 重力计算

```typescript
const framesPerSecond = 60;
const gravity = -9.81; // 地球重力加速度

// 重力需要除以帧率
scene.gravity = new Vector3(0, gravity / framesPerSecond, 0);

// 相机应用重力
camera.applyGravity = true;
```

#### 为什么除以帧率？

Babylon.js 每帧应用一次重力，而物理引擎的重力是按秒计算的，所以需要调整：

```
每帧下落距离 = gravity / framesPerSecond
```

---

## 完整代码示例

```typescript
import {
  Scene,
  Engine,
  SceneLoader,
  Vector3,
  HemisphericLight,
  FreeCamera,
} from "@babylonjs/core";
import "@babylonjs/loaders";

export class FirstPersonController {
  scene: Scene;
  engine: Engine;

  constructor(private canvas: HTMLCanvasElement) {
    this.engine = new Engine(this.canvas, true);
    this.scene = this.CreateScene();

    this.CreateEnvironment();
    this.CreateController();

    this.engine.runRenderLoop(() => {
      this.scene.render();
    });
  }

  CreateScene(): Scene {
    const scene = new Scene(this.engine);

    // 基础照明
    new HemisphericLight("hemi", new Vector3(0, 1, 0), this.scene);

    // 指针锁定
    scene.onPointerDown = (evt) => {
      if (evt.button === 0) this.engine.enterPointerlock();
      if (evt.button === 1) this.engine.exitPointerlock();
    };

    // 重力设置
    const framesPerSecond = 60;
    const gravity = -9.81;
    scene.gravity = new Vector3(0, gravity / framesPerSecond, 0);
    scene.collisionsEnabled = true;

    return scene;
  }

  async CreateEnvironment(): Promise<void> {
    const { meshes } = await SceneLoader.ImportMeshAsync(
      "",
      "./models/",
      "Prototype_Level.glb",
      this.scene
    );

    meshes.forEach((mesh) => {
      mesh.checkCollisions = true;
    });
  }

  CreateController(): void {
    const camera = new FreeCamera("camera", new Vector3(0, 10, 0), this.scene);
    camera.attachControl();

    camera.applyGravity = true;
    camera.checkCollisions = true;
    camera.ellipsoid = new Vector3(1, 1, 1);

    camera.minZ = 0.45;
    camera.speed = 0.75;
    camera.angularSensibility = 4000;

    // WASD 控制
    camera.keysUp.push(87);    // W
    camera.keysLeft.push(65);  // A
    camera.keysDown.push(83);  // S
    camera.keysRight.push(68); // D
  }
}
```

---

## 常见问题

### Q1: 为什么点击后鼠标不锁定？

**可能原因：**
- 页面没有获得焦点
- 浏览器不支持 Pointer Lock API
- 用户之前拒绝了指针锁定请求

**解决方案：**
- 确保在用户交互（如点击）后调用 `enterPointerlock()`
- 检查浏览器控制台是否有权限错误

---

### Q2: 相机穿墙怎么办？

**排查步骤：**
1. 检查 `scene.collisionsEnabled = true`
2. 检查 `camera.checkCollisions = true`
3. 检查网格的 `checkCollisions = true`
4. 检查相机的 `ellipsoid` 设置

---

### Q3: 相机下落太快或太慢？

**调整方法：**
- 修改 `scene.gravity` 的 Y 分量
- 检查帧率设置是否正确
- 考虑使用物理引擎获得更真实的效果

---

### Q4: 如何添加跳跃功能？

```typescript
// 监听空格键
window.addEventListener("keydown", (e) => {
  if (e.code === "Space") {
    // 添加向上速度
    camera.cameraDirection.y += 0.5;
  }
});
```

---

### Q5: 如何调整移动速度？

```typescript
// 基础移动速度
camera.speed = 1.0;  // 默认 1.0

// 敏感度（影响鼠标旋转速度）
camera.angularSensibility = 2000;  // 值越小，旋转越快
```

---

## 扩展阅读

- [Babylon.js FreeCamera 文档](https://doc.babylonjs.com/typedoc/classes/babylon.freecamera)
- [Pointer Lock API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Pointer_Lock_API)
- [Babylon.js 碰撞检测](https://doc.babylonjs.com/features/featuresDeepDive/cameras/camera_collisions)

---

## 下一步

- 第 11 课：物理模拟基础 (Physics Impostors)
- 学习使用 Cannon.js 或 Ammo.js 实现更真实的物理效果