# 14. Babylon.js 物理力 (Physics Forces)

## 概述

本教程介绍如何在 Babylon.js 中应用物理力，主要包括两个核心方法：
- **applyImpulse** - 冲量：用于瞬时力（如爆炸）
- **applyForce** - 持续力：用于连续作用的力（如推进器）

## 核心概念

### 力与速度的区别

| 特性 | 速度 (Velocity) | 力 (Force/Impulse) |
|------|----------------|-------------------|
| 质量影响 | 不受影响 | 受影响 |
| 设置方式 | 直接设置 | 通过物理引擎计算 |
| 适用场景 | 精确控制移动 | 真实物理模拟 |

```typescript
// 设置速度 - 不考虑质量
physicsImpostor.setLinearVelocity(new Vector3(0, 10, 0));

// 施加力 - 考虑质量，质量越大，加速度越小
physicsImpostor.applyForce(new Vector3(0, 100, 0), position);
```

### 冲量 vs 力

| 特性 | applyImpulse | applyForce |
|------|-------------|------------|
| 作用方式 | 瞬时作用 | 持续作用 |
| 单位 | 牛顿·秒 (N·s) | 牛顿 (N) |
| 调用频率 | 一次 | 每帧（如需持续力） |
| 典型应用 | 爆炸、碰撞、发射 | 火箭推进、风力 |

## API 详解

### applyImpulse - 冲量

```typescript
physicsImpostor.applyImpulse(impulse: Vector3, contactPoint: Vector3): void
```

**参数说明：**
- `impulse`: 冲量向量，方向和大小
- `contactPoint`: 力的作用点（世界坐标）

**使用示例：**
```typescript
// 模拟爆炸 - 将物体向上推开
box.physicsImpostor.applyImpulse(
  new Vector3(0, 10, 0),           // 冲量：向上10单位
  box.getAbsolutePosition()         // 作用点：物体中心
);

// 模拟侧面爆炸 - 使物体旋转倒下
box.physicsImpostor.applyImpulse(
  new Vector3(-3, 0, 0),                        // 冲量：向左
  box.getAbsolutePosition().add(new Vector3(0, 2, 0))  // 作用点：物体上方
);
```

### applyForce - 持续力

```typescript
physicsImpostor.applyForce(force: Vector3, contactPoint: Vector3): void
```

**参数说明：**
- `force`: 力向量，方向和大小（牛顿）
- `contactPoint`: 力的作用点（世界坐标）

**使用示例：**
```typescript
// 沿相机方向发射物体
const direction = camera.getForwardRay().direction;
const force = direction.scale(1000);  // 力放大1000倍

clone.physicsImpostor.applyForce(
  force,                            // 力向量
  clone.getAbsolutePosition()       // 作用点
);
```

## 力的作用点

力的作用点决定了物体的运动方式：

### 中心施力
```typescript
// 作用在重心 - 只产生平移
physicsImpostor.applyForce(
  force,
  mesh.getAbsolutePosition()  // 物体中心
);
```

### 偏移施力
```typescript
// 作用在偏离重心的位置 - 产生平移 + 旋转
physicsImpostor.applyImpulse(
  force,
  mesh.getAbsolutePosition().add(new Vector3(0, 2, 0))  // 上方2单位
);
```

## 实战示例

### 1. 爆炸效果（冲量）

```typescript
// 创建可点击的盒子
const box = MeshBuilder.CreateBox("box", { height: 4 }, scene);
box.physicsImpostor = new PhysicsImpostor(box, PhysicsImpostor.BoxImpostor, {
  mass: 0.5,
  friction: 1
});

// 点击时模拟爆炸
box.actionManager = new ActionManager(scene);
box.actionManager.registerAction(
  new ExecuteCodeAction(ActionManager.OnPickDownTrigger, () => {
    box.physicsImpostor?.applyImpulse(
      new Vector3(-3, 0, 0),                        // 向左的冲量
      box.getAbsolutePosition().add(new Vector3(0, 2, 0))  // 上方施力
    );
  })
);
```

### 2. 炮弹发射（力）

```typescript
// 创建炮弹模板
const cannonball = MeshBuilder.CreateSphere("cannonball", { diameter: 0.5 }, scene);
cannonball.physicsImpostor = new PhysicsImpostor(
  cannonball, PhysicsImpostor.SphereImpostor, { mass: 1 }
);
cannonball.setEnabled(false);  // 禁用模板

// 发射函数
function shootCannonball() {
  const clone = cannonball.clone("clone");
  clone.position = camera.position.clone();
  clone.setEnabled(true);

  // 沿相机方向施加力
  const direction = camera.getForwardRay().direction;
  clone.physicsImpostor.applyForce(
    direction.scale(1000),
    clone.getAbsolutePosition()
  );
}

// 右键发射
scene.onPointerDown = (evt) => {
  if (evt.button === 2) shootCannonball();  // 2 = 右键
};
```

### 3. 碰撞检测与自动清理

```typescript
// 注册碰撞事件 - 落地后3秒自动销毁
clone.physicsImpostor?.registerOnPhysicsCollide(
  ground.physicsImpostor!,
  () => {
    setTimeout(() => {
      clone.dispose();
    }, 3000);
  }
);
```

## 鼠标事件

```typescript
// 鼠标按钮值
// 0 = 左键
// 1 = 中键（滚轮）
// 2 = 右键

scene.onPointerDown = (evt) => {
  if (evt.button === 0) console.log("左键点击");
  if (evt.button === 1) console.log("中键点击");
  if (evt.button === 2) console.log("右键点击");
};
```

## 性能优化建议

1. **对象池 (Object Pooling)**: 重用炮弹对象而非频繁创建/销毁
2. **限制数量**: 限制同时存在的物理对象数量
3. **简化碰撞体**: 使用简单的几何形状作为碰撞体
4. **延迟销毁**: 物体落地后延迟销毁，避免频繁内存操作

## 物理引擎选择

本项目使用 Cannon.js，教程中使用 Ammo.js。两者在力的 API 上基本一致：

| 引擎 | 设置方式 |
|------|---------|
| Cannon.js | `new CannonJSPlugin(true, 10, CANNON)` |
| Ammo.js | `new AmmoJSPlugin(true, ammo)` |

## 相关资源

- [Babylon.js 物理文档](https://doc.babylonjs.com/features/featuresDeepDive/physics/usingPhysicsEngine)
- [Cannon.js GitHub](https://github.com/schteppe/cannon.js)
- [Ammo.js GitHub](https://github.com/kripken/ammo.js)
