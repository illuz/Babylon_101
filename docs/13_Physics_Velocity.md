# Babylon.js 物理速度教程

## 概述

本教程介绍如何在 Babylon.js 物理环境中使用速度（Velocity）来控制物体的运动。与使用力（Force）不同，速度可以直接设置物体的移动和旋转速度，适用于需要精确控制运动的场景。

## 核心概念

### 1. 线性速度 (Linear Velocity)

线性速度决定了物体在三维空间中的移动方向和速度。

```typescript
// 设置线性速度
physicsImpostor.setLinearVelocity(new Vector3(x, y, z));
```

**参数说明**：
- `Vector3(x, y, z)` 表示在三个轴向上的速度分量
- 速度单位为米/秒
- 正值表示沿轴正方向，负值表示沿轴负方向

**示例**：
```typescript
// 让物体向世界坐标 Y 轴正方向移动，速度 5 米/秒
physicsImpostor.setLinearVelocity(new Vector3(0, 5, 0));

// 让物体沿自身"向上"方向移动（局部坐标系）
physicsImpostor.setLinearVelocity(mesh.up.scale(5));
```

### 2. 角速度 (Angular Velocity)

角速度决定了物体的旋转速度和旋转轴。

```typescript
// 设置角速度
physicsImpostor.setAngularVelocity(new Vector3(x, y, z));
```

**参数说明**：
- `Vector3(x, y, z)` 表示绕三个轴旋转的角速度
- 角速度单位为弧度/秒
- 1 弧度 ≈ 57.3 度

**示例**：
```typescript
// 让物体绕 Y 轴旋转，速度 1 弧度/秒
physicsImpostor.setAngularVelocity(new Vector3(0, 1, 0));

// 让物体沿自身 Y 轴旋转
physicsImpostor.setAngularVelocity(mesh.up);
```

## 速度与力的区别

| 特性 | 速度 (Velocity) | 力 (Force) |
|------|----------------|------------|
| **作用方式** | 直接设置速度值 | 施加加速度 |
| **质量影响** | 不受质量影响 | 受质量影响（F = ma）|
| **效果** | 立即生效 | 速度逐渐变化 |
| **适用场景** | 精确控制移动（如推进器）| 模拟真实物理（如碰撞弹开）|

### 力的使用方法（对比参考）

```typescript
// 施加力
physicsImpostor.applyForce(
  new Vector3(0, 100, 0),  // 力的方向和大小
  mesh.getAbsolutePosition()  // 施力点
);

// 施加冲量（瞬时力）
physicsImpostor.applyImpulse(
  new Vector3(0, 10, 0),
  mesh.getAbsolutePosition()
);
```

## 世界坐标系 vs 局部坐标系

### 世界坐标系

速度向量基于世界坐标轴：
- `Vector3.Up()` = 世界 Y 轴正方向
- `Vector3.Right()` = 世界 X 轴正方向
- `Vector3.Forward()` = 世界 Z 轴正方向

```typescript
// 无论物体如何旋转，都向世界 Y 轴上方移动
physicsImpostor.setLinearVelocity(Vector3.Up().scale(5));
```

### 局部坐标系

速度向量基于物体自身的方向：
- `mesh.up` = 物体自身的"上"方向
- `mesh.right` = 物体自身的"右"方向
- `mesh.forward` = 物体自身的"前"方向

```typescript
// 沿物体自身"上"方向移动（如火箭推进器）
physicsImpostor.setLinearVelocity(mesh.up.scale(5));
```

## 碰撞体与视觉模型的分离

当使用复杂的 3D 模型时，通常需要创建简单的碰撞体：

```typescript
// 1. 导入视觉模型
const { meshes } = await SceneLoader.ImportMeshAsync(
  "",
  "/models/",
  "toon_rocket.glb",
  scene
);

// 2. 创建简单的碰撞体（Box）
const collider = MeshBuilder.CreateBox("collider", {
  width: 1,
  height: 1.7,
  depth: 1,
});

// 3. 为碰撞体添加物理模拟
collider.physicsImpostor = new PhysicsImpostor(
  collider,
  PhysicsImpostor.BoxImpostor,
  { mass: 1 }
);

// 4. 将视觉模型作为碰撞体的子对象
// setParent() 保持视觉模型的位置不变
meshes[0].setParent(collider);

// 5. 隐藏碰撞体
collider.visibility = 0;
```

### setParent() vs parent 属性

```typescript
// 方法 1: 使用 parent 属性
// 会重新计算子对象的位置和旋转
mesh.parent = collider;

// 方法 2: 使用 setParent() 方法（推荐）
// 保持子对象的视觉位置不变
mesh.setParent(collider);
```

## 每帧更新速度

使用 `registerBeforeRender` 在每帧应用速度：

```typescript
const updateVelocity = () => {
  // 每帧设置速度（如火箭推进）
  physicsImpostor.setLinearVelocity(mesh.up.scale(5));
  physicsImpostor.setAngularVelocity(mesh.up);
};

// 注册每帧回调
scene.registerBeforeRender(updateVelocity);

// 需要时取消注册
scene.unregisterBeforeRender(updateVelocity);
```

## 完整示例

```typescript
import {
  Scene,
  Engine,
  SceneLoader,
  FreeCamera,
  Vector3,
  CannonJSPlugin,
  MeshBuilder,
  PhysicsImpostor,
} from "@babylonjs/core";
import "@babylonjs/loaders";
import * as CANNON from "cannon";

export class PhysicsVelocity {
  scene: Scene;
  engine: Engine;
  camera: FreeCamera;

  constructor(private canvas: HTMLCanvasElement) {
    this.engine = new Engine(this.canvas, true);
    this.scene = this.CreateScene();
    this.CreateRocket();

    this.engine.runRenderLoop(() => {
      this.scene.render();
    });
  }

  CreateScene(): Scene {
    const scene = new Scene(this.engine);
    const camera = new FreeCamera("camera", new Vector3(0, 2, -5), scene);
    camera.attachControl();
    this.camera = camera;

    // 启用物理引擎
    scene.enablePhysics(
      new Vector3(0, -9.81, 0),  // 重力
      new CannonJSPlugin(true, 10, CANNON)
    );

    return scene;
  }

  async CreateRocket(): Promise<void> {
    // 导入火箭模型
    const { meshes } = await SceneLoader.ImportMeshAsync(
      "", "/models/", "toon_rocket.glb", this.scene
    );

    // 创建碰撞体
    const rocketCol = MeshBuilder.CreateBox("rocketCol", {
      width: 1, height: 1.7, depth: 1,
    });
    rocketCol.position.y = 0.85;
    rocketCol.visibility = 0;

    // 添加物理模拟
    rocketCol.physicsImpostor = new PhysicsImpostor(
      rocketCol,
      PhysicsImpostor.BoxImpostor,
      { mass: 1 }
    );

    // 设置父子关系
    meshes[0].setParent(rocketCol);

    // 预旋转火箭
    rocketCol.rotate(Vector3.Forward(), 1.5);

    // 每帧更新速度
    const rocketPhysics = () => {
      // 相机跟随
      this.camera.position = new Vector3(
        rocketCol.position.x,
        rocketCol.position.y,
        this.camera.position.z
      );

      // 设置线性速度（沿火箭自身方向）
      rocketCol.physicsImpostor.setLinearVelocity(rocketCol.up.scale(5));

      // 设置角速度
      rocketCol.physicsImpostor.setAngularVelocity(rocketCol.up);
    };

    // 注册每帧回调
    this.scene.registerBeforeRender(rocketPhysics);

    // 点击停止推进
    this.scene.onPointerDown = () => {
      this.scene.unregisterBeforeRender(rocketPhysics);
    };
  }
}
```

## 常用技巧

### 1. 获取当前速度

```typescript
// 获取当前线性速度
const linearVelocity = physicsImpostor.getLinearVelocity();

// 获取当前角速度
const angularVelocity = physicsImpostor.getAngularVelocity();
```

### 2. 速度缩放

```typescript
// 使用 scale() 调整速度大小
const direction = mesh.up;  // 方向向量
const speed = 5;            // 速度大小
physicsImpostor.setLinearVelocity(direction.scale(speed));
```

### 3. 组合速度

```typescript
// 组合多个速度分量
const forwardSpeed = mesh.forward.scale(10);
const upwardSpeed = Vector3.Up().scale(2);
physicsImpostor.setLinearVelocity(forwardSpeed.add(upwardSpeed));
```

### 4. 限制速度

```typescript
const velocity = physicsImpostor.getLinearVelocity();
const maxSpeed = 10;

if (velocity.length() > maxSpeed) {
  physicsImpostor.setLinearVelocity(velocity.normalize().scale(maxSpeed));
}
```

## 注意事项

1. **物理引擎要求**：使用速度功能前必须先启用物理引擎
2. **质量影响**：`setLinearVelocity` 不受质量影响，但重力仍会影响物体
3. **每帧调用**：持续推进效果需要在每帧调用速度设置
4. **坐标系统**：注意区分世界坐标系和局部坐标系
5. **性能考虑**：复杂的碰撞体会影响性能，优先使用简单几何体

## 相关 API

- `PhysicsImpostor.setLinearVelocity(velocity: Vector3)` - 设置线性速度
- `PhysicsImpostor.getLinearVelocity(): Vector3` - 获取线性速度
- `PhysicsImpostor.setAngularVelocity(velocity: Vector3)` - 设置角速度
- `PhysicsImpostor.getAngularVelocity(): Vector3` - 获取角速度
- `Scene.registerBeforeRender(func: () => void)` - 注册渲染前回调
- `Scene.unregisterBeforeRender(func: () => void)` - 取消渲染前回调

## 参考资源

- [Babylon.js Physics Documentation](https://doc.babylonjs.com/features/featuresDeepDown/physics)
- [Cannon.js Documentation](https://schteppe.github.io/cannon.js/)
