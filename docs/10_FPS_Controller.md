# 10_FPS_Controller - 第一人称控制器

## 概述

本教程介绍如何在 Babylon.js 中实现 FPS（第一人称射击游戏）风格的相机控制系统。

## 核心知识点

### 1. FreeCamera 自由相机

FreeCamera 是 Babylon.js 中用于实现第一人称视角的相机类型。

```typescript
const camera = new FreeCamera("camera", new Vector3(0, 10, 0), this.scene);
```

**参数说明**:
- 第一个参数：相机名称
- 第二个参数：初始位置 (Vector3)
- 第三个参数：所属场景

### 2. 鼠标指针锁定 (Pointer Lock)

指针锁定 API 允许将鼠标光标隐藏并锁定到画布中，实现 FPS 风格的视角控制。

```typescript
// 进入指针锁定模式（点击左键）
scene.onPointerDown = (evt) => {
  if (evt.button === 0) this.engine.enterPointerlock();
  if (evt.button === 1) this.engine.exitPointerlock();
};
```

**鼠标按钮值**:
- `0` - 左键
- `1` - 中键
- `2` - 右键

### 3. 重力系统

Babylon.js 内置了重力系统，可以让相机受到重力影响自然下落。

```typescript
const framesPerSecond = 60;
const gravity = -9.81;
scene.gravity = new Vector3(0, gravity / framesPerSecond, 0);
```

**重要**:
- 重力值需要除以帧率，因为 Babylon.js 是按帧计算重力的
- `-9.81` 是地球标准重力加速度

### 4. 碰撞检测

#### 4.1 启用场景碰撞

```typescript
scene.collisionsEnabled = true;
```

#### 4.2 启用相机碰撞

```typescript
camera.checkCollisions = true;
camera.applyGravity = true;
```

#### 4.3 为网格启用碰撞

```typescript
meshes.map((mesh) => {
  mesh.checkCollisions = true;
});
```

### 5. 碰撞椭圆体 (Ellipsoid)

椭圆体定义了玩家的碰撞体积，决定了玩家与障碍物的碰撞范围。

```typescript
camera.ellipsoid = new Vector3(1, 1, 1);
```

- `x` 值控制左右宽度
- `y` 值控制上下高度
- `z` 值控制前后深度

### 6. WASD 键盘控制

FreeCamera 内置键盘控制支持，通过配置 `keysUp`、`keysDown`、`keysLeft`、`keysRight` 数组来映射按键。

```typescript
camera.keysUp.push(87);    // W 键 - 前进
camera.keysLeft.push(65);  // A 键 - 左移
camera.keysDown.push(83);  // S 键 - 后退
camera.keysRight.push(68); // D 键 - 右移
```

**常用 ASCII 码**:
| 按键 | ASCII 码 |
|------|----------|
| W | 87 |
| A | 65 |
| S | 83 |
| D | 68 |
| 空格 | 32 |

### 7. 相机参数调优

#### 移动速度

```typescript
camera.speed = 0.75;
```

值越小移动越慢，适合 FPS 游戏的精细控制。

#### 鼠标灵敏度

```typescript
camera.angularSensibility = 4000;
```

值越大灵敏度越低（需要移动更多像素才能转动相同角度）。

#### 近裁剪面

```typescript
camera.minZ = 0.45;
```

防止相机太靠近墙壁时出现穿模现象。

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
    new HemisphericLight("hemi", new Vector3(0, 1, 0), this.scene);

    // 鼠标锁定
    scene.onPointerDown = (evt) => {
      if (evt.button === 0) this.engine.enterPointerlock();
      if (evt.button === 1) this.engine.exitPointerlock();
    };

    // 重力和碰撞
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

    meshes.map((mesh) => {
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

## 控制说明

| 操作 | 按键/鼠标 |
|------|-----------|
| 前进 | W |
| 后退 | S |
| 左移 | A |
| 右移 | D |
| 锁定鼠标 | 点击左键 |
| 释放鼠标 | 点击中键 |
| 转动视角 | 移动鼠标（锁定后） |

## 注意事项

1. **重力计算**: 场景重力需要除以帧率，否则下落速度会过快
2. **碰撞启用顺序**:
   - 先启用场景碰撞 (`scene.collisionsEnabled = true`)
   - 再启用相机碰撞 (`camera.checkCollisions = true`)
   - 最后为每个网格启用碰撞 (`mesh.checkCollisions = true`)
3. **椭圆体大小**: 根据场景比例调整椭圆体大小，确保玩家能够正常通过门洞和走廊
4. **指针锁定**: 需要用户交互才能进入指针锁定模式，不能自动锁定

## 进阶扩展

### 添加跳跃功能

```typescript
// 监听空格键跳跃
window.addEventListener("keydown", (e) => {
  if (e.keyCode === 32 && this.canJump) {
    camera.cameraDirection.y = 0.5; // 跳跃力度
    this.canJump = false;
  }
});

// 检测落地
scene.registerBeforeRender(() => {
  if (camera.position.y <= groundLevel + 1) {
    this.canJump = true;
  }
});
```

### 添加跑步功能

```typescript
// 按住 Shift 加速
window.addEventListener("keydown", (e) => {
  if (e.keyCode === 16) { // Shift
    camera.speed = 1.5;
  }
});

window.addEventListener("keyup", (e) => {
  if (e.keyCode === 16) {
    camera.speed = 0.75;
  }
});
```

## 相关资源

- [Babylon.js FreeCamera 官方文档](https://doc.babylonjs.com/typedoc/classes/babylon.freecamera)
- [Babylon.js 碰撞检测文档](https://doc.babylonjs.com/features/featuresDeepDive/cameras/camera_collisions)
- [Pointer Lock API MDN](https://developer.mozilla.org/en-US/docs/Web/API/Pointer_Lock_API)
