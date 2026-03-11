# Babylon.js 碰撞与触发器 (Collisions and Triggers)

## 概述

Babylon.js 提供了两种不同的碰撞检测机制：

| 机制 | 依赖 | 用途 | 性能 |
|------|------|------|------|
| **物理碰撞 (Physics Collision)** | 需要物理引擎和 PhysicsImpostor | 真实物理模拟、碰撞响应 | 较高 |
| **触发器 (Trigger)** | 仅需网格 | 区域检测、事件触发 | 较低 |

---

## 一、物理碰撞 (Physics Collision)

### 1.1 基本概念

物理碰撞基于物理引擎（如 Cannon.js），需要为网格创建 `PhysicsImpostor`（物理代理）。

**PhysicsImpostor 核心属性：**

```typescript
interface PhysicsImpostorParams {
  mass: number;        // 质量 (0 = 静态物体)
  restitution: number; // 弹性系数 (0-1)
  friction: number;    // 摩擦系数 (0-1)
}
```

### 1.2 创建物理代理

```typescript
// 球体物理代理
sphere.physicsImpostor = new PhysicsImpostor(
  sphere,                              // 目标网格
  PhysicsImpostor.SphereImpostor,      // 代理类型
  { mass: 1, restitution: 0.8, friction: 0.5 }  // 物理参数
);

// 静态地面 (mass = 0 表示不受重力影响)
ground.physicsImpostor = new PhysicsImpostor(
  ground,
  PhysicsImpostor.BoxImpostor,
  { mass: 0, restitution: 0.5 }
);
```

**常用代理类型：**
- `BoxImpostor` - 盒形碰撞体
- `SphereImpostor` - 球形碰撞体
- `PlaneImpostor` - 平面碰撞体
- `CylinderImpostor` - 圆柱碰撞体
- `MeshImpostor` - 网格碰撞体（复杂形状，性能开销大）

### 1.3 注册碰撞回调

```typescript
// 注册单个碰撞检测
box.physicsImpostor.registerOnPhysicsCollide(
  sphere.physicsImpostor,  // 检测碰撞的目标
  this.DetectCollisions    // 回调函数
);

// 注册多个碰撞检测（使用数组）
sphere.physicsImpostor.registerOnPhysicsCollide(
  [box.physicsImpostor, ground.physicsImpostor],  // 多个目标
  this.DetectCollisions
);
```

### 1.4 碰撞回调函数

```typescript
/**
 * 碰撞回调函数签名
 * @param collider - 触发碰撞的物理代理
 * @param collidedAgainst - 被碰撞的物理代理
 */
DetectCollisions(collider: PhysicsImpostor, collidedAgainst: PhysicsImpostor): void {
  // 访问网格对象
  const mesh = collider.object as AbstractMesh;

  // 修改材质
  mesh.material = newMaterial;

  // 修改缩放
  mesh.scaling = new Vector3(2, 2, 2);

  // 重要：修改缩放后必须更新物理代理
  collider.setScalingUpdated();
}
```

### 1.5 注销碰撞回调

```typescript
// 在特定条件下停止碰撞检测
sphere.physicsImpostor.unregisterOnPhysicsCollide(
  ground.physicsImpostor,
  this.DetectCollisions
);
```

### 1.6 重要注意事项

1. **回调函数必须是命名函数**
   ```typescript
   // 正确：使用命名函数，可以注销
   box.physicsImpostor.registerOnPhysicsCollide(target, this.handleCollision);

   // 错误：箭头函数无法正确注销
   box.physicsImpostor.registerOnPhysicsCollide(target, (a, b) => { ... });
   ```

2. **缩放更新**
   ```typescript
   // 修改网格缩放后，物理碰撞体不会自动更新
   mesh.scaling = new Vector3(3, 3, 3);

   // 必须手动更新物理代理
   mesh.physicsImpostor.setScalingUpdated();
   ```

3. **类型转换**
   ```typescript
   // IPhysicsEnabledObject 需要转换为 AbstractMesh 才能访问材质
   (collidedAgainst.object as AbstractMesh).material = redMat;
   ```

---

## 二、触发器 (Trigger)

### 2.1 基本概念

触发器基于网格相交检测，不需要物理引擎参与。适用于：
- 检测玩家进入/离开特定区域
- 触发剧情、动画、音效
- 收集物品检测

### 2.2 创建触发区域

```typescript
// 创建触发区域网格
const triggerZone = MeshBuilder.CreateBox("trigger", {
  width: 4,
  height: 1,
  depth: 4
});

// 设置位置（注意：盒子中心在几何中心）
triggerZone.position.y = 0.5;  // height / 2

// 设置半透明以区分于实体物体
triggerZone.visibility = 0.25;
```

### 2.3 检测触发

```typescript
// 方法1：单次检测
if (triggerZone.intersectsMesh(player)) {
  console.log("玩家在触发区域内");
}

// 方法2：持续检测（每帧）
let hasTriggered = false;

scene.registerBeforeRender(() => {
  if (triggerZone.intersectsMesh(player)) {
    if (!hasTriggered) {
      console.log("进入触发区域");
      hasTriggered = true;
    }
  } else {
    hasTriggered = false;
  }
});
```

### 2.4 intersectsMesh 参数

```typescript
intersectsMesh(
  mesh: AbstractMesh,        // 目标网格
  precise?: boolean,         // 是否使用精确检测（默认 false）
  includeDescendants?: boolean  // 是否包含子网格（默认 false）
): boolean
```

**参数说明：**
- `precise: true` - 使用更精确的碰撞检测，适合旋转或变形物体
- `includeDescendants: true` - 同时检测目标网格的所有子网格

### 2.5 触发器最佳实践

```typescript
// 使用计数器确保只触发一次
let counter = 0;

scene.registerBeforeRender(() => {
  if (triggerZone.intersectsMesh(player)) {
    counter++;
    if (counter === 1) {
      // 只在第一次进入时执行
      playAudio();
      showText();
    }
  }
});

// 使用状态机管理触发状态
enum TriggerState { Outside, Enter, Inside, Exit }
let triggerState = TriggerState.Outside;

scene.registerBeforeRender(() => {
  const isInside = triggerZone.intersectsMesh(player);

  switch (triggerState) {
    case TriggerState.Outside:
      if (isInside) {
        triggerState = TriggerState.Enter;
        onEnter();
      }
      break;
    case TriggerState.Enter:
    case TriggerState.Inside:
      triggerState = isInside ? TriggerState.Inside : TriggerState.Exit;
      break;
    case TriggerState.Exit:
      onExit();
      triggerState = TriggerState.Outside;
      break;
  }
});
```

---

## 三、物理碰撞 vs 触发器对比

| 特性 | 物理碰撞 | 触发器 |
|------|----------|--------|
| 需要物理引擎 | 是 | 否 |
| 碰撞响应 | 自动（反弹、停止） | 无 |
| 性能开销 | 高 | 低 |
| 适用场景 | 物理模拟、碰撞反弹 | 区域检测、事件触发 |
| 检测方式 | 回调函数 | 每帧检测 |
| 多目标支持 | 数组批量检测 | 需逐个检测 |

---

## 四、完整示例代码

```typescript
import {
  Scene, Engine, Vector3, CannonJSPlugin,
  MeshBuilder, PhysicsImpostor, AbstractMesh,
  StandardMaterial, Color3
} from "@babylonjs/core";
import * as CANNON from "cannon";

export class CollisionsTriggers {
  scene: Scene;
  engine: Engine;
  sphere: AbstractMesh;
  box: AbstractMesh;
  ground: AbstractMesh;

  constructor(private canvas: HTMLCanvasElement) {
    this.engine = new Engine(this.canvas, true);
    this.scene = this.CreateScene();
    this.CreateImpostors();
    this.DetectTrigger();

    this.engine.runRenderLoop(() => {
      this.scene.render();
    });
  }

  CreateScene(): Scene {
    const scene = new Scene(this.engine);

    // 启用物理引擎
    scene.enablePhysics(
      new Vector3(0, -9.81, 0),  // 重力
      new CannonJSPlugin(true, 10, CANNON)
    );

    return scene;
  }

  CreateImpostors(): void {
    // 创建地面
    this.ground = MeshBuilder.CreateGround("ground", { width: 40, height: 40 });
    this.ground.physicsImpostor = new PhysicsImpostor(
      this.ground,
      PhysicsImpostor.BoxImpostor,
      { mass: 0, restitution: 1 }
    );

    // 创建球体
    this.sphere = MeshBuilder.CreateSphere("sphere", { diameter: 2 });
    this.sphere.position = new Vector3(0, 8, 0);
    this.sphere.physicsImpostor = new PhysicsImpostor(
      this.sphere,
      PhysicsImpostor.SphereImpostor,
      { mass: 1, restitution: 1, friction: 1 }
    );
  }

  // 物理碰撞回调
  DetectCollisions(collider: PhysicsImpostor, collidedAgainst: any): void {
    const redMat = new StandardMaterial("red", this.scene);
    redMat.diffuseColor = new Color3(1, 0, 0);
    (collidedAgainst.object as AbstractMesh).material = redMat;
  }

  // 触发器检测
  DetectTrigger(): void {
    const triggerZone = MeshBuilder.CreateBox("trigger", { width: 4, height: 1, depth: 4 });
    triggerZone.position.y = 0.5;
    triggerZone.visibility = 0.25;

    let counter = 0;
    this.scene.registerBeforeRender(() => {
      if (triggerZone.intersectsMesh(this.sphere)) {
        counter++;
        if (counter === 1) console.log("Entered Trigger");
      }
    });
  }
}
```

---

## 五、常见问题

### Q1: 为什么修改网格缩放后，碰撞体没有变化？

**原因**：物理代理的碰撞体是独立于视觉网格的。

**解决**：调用 `setScalingUpdated()` 方法。

```typescript
mesh.scaling = new Vector3(2, 2, 2);
mesh.physicsImpostor.setScalingUpdated();
```

### Q2: 为什么箭头函数作为回调无法注销？

**原因**：每次创建的箭头函数都是新实例，无法匹配之前的引用。

**解决**：使用命名函数或类方法。

```typescript
// 正确
box.physicsImpostor.registerOnPhysicsCollide(target, this.handleCollision);
box.physicsImpostor.unregisterOnPhysicsCollide(target, this.handleCollision);
```

### Q3: 触发器检测为什么只在第一帧有效？

**原因**：`intersectsMesh` 只返回布尔值，需要每帧持续检测。

**解决**：使用 `registerBeforeRender` 在每帧检测。

```typescript
scene.registerBeforeRender(() => {
  if (triggerZone.intersectsMesh(target)) {
    // 检测到相交
  }
});
```

---

## 六、参考资源

- [Babylon.js 官方文档 - Physics](https://doc.babylonjs.com/features/featuresDeepDive/physics)
- [Babylon.js 官方文档 - Collisions](https://doc.babylonjs.com/features/featuresDeepDive/mesh/interactions/mesh_intersect)
- [Cannon.js 物理引擎](https://schteppe.github.io/cannon.js/)