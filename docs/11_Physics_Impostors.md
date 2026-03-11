# Babylon.js 物理引擎 - PhysicsImpostors 知识点

## 概述

PhysicsImpostors（物理模拟器）是 Babylon.js 中实现物理效果的核心机制。它们结合了**碰撞器（Collider）**和**刚体（Rigid Body）**的功能，使 3D 对象能够参与真实的物理模拟。

---

## 1. 支持的物理引擎

Babylon.js 支持多种物理引擎，可以通过插件方式集成：

| 物理引擎 | 特点 | 适用场景 |
|---------|------|---------|
| **Cannon.js** | 纯 JavaScript，轻量级 | 简单物理模拟，Web 项目 |
| **Ammo.js** | Bullet 物理引擎移植，功能强大 | 复杂物理，高性能需求 |
| **Oimo.js** | 轻量级，易于使用 | 基础物理效果 |

### 安装 Cannon.js

```bash
npm install cannon
npm install @types/cannon
```

---

## 2. 启用物理引擎

### 基本语法

```typescript
import * as CANNON from "cannon";
import { CannonJSPlugin } from "@babylonjs/core";

// 在场景中启用物理
scene.enablePhysics(
  new Vector3(0, -9.81, 0),           // 重力向量
  new CannonJSPlugin(true, 10, CANNON) // 物理插件
);
```

### 参数说明

#### 重力向量
- `Vector3(x, y, z)` 定义重力方向和强度
- 地球标准重力：`new Vector3(0, -9.81, 0)`
- 无重力环境：`new Vector3(0, 0, 0)`

#### CannonJSPlugin 参数
```typescript
new CannonJSPlugin(
  true,      // useDeltaForWorldStep - 使用帧间隔作为物理步长
  10,        // iterations - 约束求解迭代次数
  CANNON     // Cannon.js 库引用
)
```

---

## 3. PhysicsImpostor 类型

### 可用的模拟器类型

| 类型 | 描述 | 适用场景 |
|-----|------|---------|
| `BoxImpostor` | 盒形碰撞器 | 立方体、箱子、建筑物 |
| `SphereImpostor` | 球形碰撞器 | 球体、滚动物体 |
| `CylinderImpostor` | 圆柱形碰撞器 | 圆柱、管状物体 |
| `PlaneImpostor` | 平面碰撞器 | 地面（单面碰撞） |
| `ConvexHullImpostor` | 凸包碰撞器 | 复杂但外凸的形状 |
| `MeshImpostor` | 网格碰撞器 | 复杂形状（性能消耗大） |
| `NoImpostor` | 无碰撞器 | 禁用物理 |

### 性能建议

```
简单优先：BoxImpostor > SphereImpostor > CylinderImpostor > ConvexHullImpostor > MeshImpostor
```

- 始终选择**最简单**的碰撞器类型
- 对于静态场景元素，使用 `mass: 0`
- 复杂模型使用 `ConvexHullImpostor` 而非 `MeshImpostor`

---

## 4. 物理属性配置

### 创建 PhysicsImpostor

```typescript
mesh.physicsImpostor = new PhysicsImpostor(
  mesh,                        // 目标网格
  PhysicsImpostor.BoxImpostor, // 模拟器类型
  {                            // 物理选项
    mass: 1,
    restitution: 0.5,
    friction: 0.5
  }
);
```

### 核心属性

#### mass（质量）
- **类型**：`number`
- **说明**：对象的质量/重量
- **特殊值**：`0` 表示静态对象（不会移动）
- **示例**：
  - `mass: 0` - 地面、墙壁、障碍物
  - `mass: 1` - 普通物体
  - `mass: 100` - 重型物体

```typescript
// 静态地面（不会移动）
ground.physicsImpostor = new PhysicsImpostor(
  ground, PhysicsImpostor.BoxImpostor,
  { mass: 0, restitution: 0.5 }
);

// 动态盒子（会受重力影响）
box.physicsImpostor = new PhysicsImpostor(
  box, PhysicsImpostor.BoxImpostor,
  { mass: 1, restitution: 0.75 }
);
```

#### restitution（弹性/恢复系数）
- **类型**：`number` (0-1)
- **说明**：碰撞后的反弹程度
- **效果**：
  - `0` - 无弹性，碰撞后不反弹（如泥巴）
  - `0.5` - 中等弹性
  - `1` - 完全弹性，反弹到原高度

```typescript
// 高弹性球体
sphere.physicsImpostor = new PhysicsImpostor(
  sphere, PhysicsImpostor.SphereImpostor,
  { mass: 1, restitution: 0.8 }
);
```

> **注意**：两个碰撞物体的弹性系数会相互影响。例如，盒子 0.75 + 地面 0.5 的组合效果会介于两者之间。

#### friction（摩擦力）
- **类型**：`number` (0-1)
- **说明**：表面滑动阻力
- **效果**：
  - `0` - 无摩擦（如冰面）
  - `0.5` - 正常摩擦
  - `1` - 高摩擦（如橡胶）

```typescript
// 冰面效果
ice.physicsImpostor = new PhysicsImpostor(
  ice, PhysicsImpostor.BoxImpostor,
  { mass: 0, friction: 0.1 }
);
```

---

## 5. 完整示例

### 创建下落的盒子

```typescript
// 1. 创建网格
const box = MeshBuilder.CreateBox("box", { size: 2 });

// 2. 设置初始位置（高处）
box.position = new Vector3(0, 10, 0);

// 3. 添加物理模拟
box.physicsImpostor = new PhysicsImpostor(
  box,
  PhysicsImpostor.BoxImpostor,
  { mass: 1, restitution: 0.75 }
);
```

### 创建静态地面

```typescript
// 1. 创建地面网格
const ground = MeshBuilder.CreateGround("ground", {
  width: 40,
  height: 40
});

// 2. 隐藏视觉渲染（可选）
ground.isVisible = false;

// 3. 添加静态物理（mass: 0）
ground.physicsImpostor = new PhysicsImpostor(
  ground,
  PhysicsImpostor.BoxImpostor,
  { mass: 0, restitution: 0.5 }
);
```

### 创建弹跳球体

```typescript
// 1. 创建球体
const sphere = MeshBuilder.CreateSphere("sphere", { diameter: 3 });

// 2. 设置位置
sphere.position = new Vector3(0, 6, 0);

// 3. 使用球体模拟器
sphere.physicsImpostor = new PhysicsImpostor(
  sphere,
  PhysicsImpostor.SphereImpostor,
  { mass: 1, restitution: 0.8 }
);
```

---

## 6. 高级技巧

### 隐藏碰撞器

使用隐藏网格作为碰撞器，而用可见模型作为视觉表现：

```typescript
// 创建碰撞器（不可见）
const collider = MeshBuilder.CreateBox("collider", { size: 2 });
collider.isVisible = false;
collider.physicsImpostor = new PhysicsImpostor(
  collider, PhysicsImpostor.BoxImpostor,
  { mass: 1, restitution: 0.5 }
);

// 创建视觉模型（无物理）
const visualModel = MeshBuilder.CreateBox("visual", { size: 2 });
visualModel.parent = collider; // 跟随碰撞器
```

### 初始旋转

```typescript
// 旋转 45 度，让下落更有趣
box.rotation = new Vector3(Math.PI / 4, 0, 0);
```

### 物理属性动态修改

```typescript
// 修改质量
mesh.physicsImpostor.setMass(10);

// 修改弹性
mesh.physicsImpostor.setParam("restitution", 0.8);

// 修改摩擦力
mesh.physicsImpostor.setParam("friction", 0.2);
```

---

## 7. 常见问题

### Q: 物体穿透地面？

**原因**：地面没有 PhysicsImpostor

**解决**：为地面添加物理模拟器
```typescript
ground.physicsImpostor = new PhysicsImpostor(
  ground, PhysicsImpostor.BoxImpostor,
  { mass: 0 }
);
```

### Q: 物体不移动？

**原因**：质量设置为 0

**解决**：设置非零质量
```typescript
{ mass: 1 }  // 动态对象
```

### Q: 物体不弹跳？

**原因**：弹性系数太低

**解决**：提高两个碰撞物体的弹性
```typescript
// 两个物体都需要设置
box.physicsImpostor = ... { restitution: 0.75 }
ground.physicsImpostor = ... { restitution: 0.5 }
```

### Q: 环境模型没有碰撞？

**原因**：加载的 GLB 模型默认没有物理

**解决**：为环境模型添加隐藏的物理碰撞器，或遍历网格添加模拟器

---

## 8. 总结

| 概念 | 说明 |
|-----|------|
| **物理引擎** | Cannon.js、Ammo.js、Oimo.js |
| **PhysicsImpostor** | 碰撞器 + 刚体的组合 |
| **mass** | 质量（0 = 静态） |
| **restitution** | 弹性（0-1） |
| **friction** | 摩擦力（0-1） |
| **性能原则** | 简单优先，静态对象用 mass: 0 |

---

## 参考资源

- [Babylon.js Physics 官方文档](https://doc.babylonjs.com/features/featuresDeepDive/physics)
- [Cannon.js GitHub](https://github.com/schteppe/cannon.js)
- [PhysicsImpostor API](https://doc.babylonjs.com/typedoc/classes/babylon.physicsimpostor)