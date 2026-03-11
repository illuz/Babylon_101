# 14. Physics Forces - 物理力

## 课程概述

本课程讲解如何在 Babylon.js 中使用物理力（Forces）和冲量（Impulses）来控制物体运动。与直接设置速度不同，物理力会考虑物体的质量，使模拟更加真实。

### 核心概念

- **冲量（Impulse）**：瞬时力，用于模拟爆炸等一次性效果
- **持续力（Force）**：持续施加的力，用于模拟火箭推进等效果
- **力的作用点**：决定力施加在物体的哪个位置，影响旋转效果

## 核心知识点

### 1. applyImpulse vs applyForce

| 特性 | applyImpulse | applyForce |
|------|--------------|------------|
| 用途 | 瞬时冲量（爆炸、碰撞） | 持续力（推进、风力） |
| 考虑质量 | 是 | 是 |
| 时间特性 | 一次性 | 持续作用 |
| 典型场景 | 爆炸效果、弹跳 | 火箭推进、重力场 |

### 2. 物理力与速度的区别

```typescript
// 直接设置速度 - 不考虑质量
mesh.physicsImpostor.setLinearVelocity(new Vector3(0, 10, 0));

// 应用冲量 - 考虑质量
mesh.physicsImpostor.applyImpulse(
  new Vector3(0, 10, 0),  // 力的方向和大小
  mesh.getAbsolutePosition()  // 作用点
);
```

### 3. 力的作用点

力的作用点决定了物体如何响应力：

```typescript
// 作用在质心：产生纯平移
box.physicsImpostor.applyImpulse(
  new Vector3(-3, 0, 0),
  box.getAbsolutePosition()  // 中心点
);

// 作用在边缘：产生旋转效果
box.physicsImpostor.applyImpulse(
  new Vector3(-3, 0, 0),
  box.getAbsolutePosition().add(new Vector3(0, 2, 0))  // 向上偏移
);
```

## 代码示例与解释

### 1. 初始化物理引擎

```typescript
// 使用 Ammo.js 物理引擎
const ammo = await Ammo();
const physics = new AmmoJSPlugin(true, ammo);
this.scene.enablePhysics(new Vector3(0, -9.81, 0), physics);
```

### 2. 创建冲量演示（爆炸效果）

```typescript
// 点击盒子时应用冲量，模拟爆炸推动效果
box.actionManager.registerAction(
  new ExecuteCodeAction(ActionManager.OnPickDownTrigger, () => {
    box.physicsImpostor.applyImpulse(
      new Vector3(-3, 0, 0),  // 力的方向（向左）
      box.getAbsolutePosition().add(new Vector3(0, 2, 0))  // 作用点（盒子顶部）
    );
  })
);
```

### 3. 发射炮弹（持续力）

```typescript
// 克隆炮弹并应用向前的力
const clone = this.cannonball.clone("clone");
clone.position = this.camera.position;
clone.setEnabled(true);

// 沿相机视线方向发射
clone.physicsImpostor.applyForce(
  this.camera.getForwardRay().direction.scale(1000),  // 方向 * 力度
  clone.getAbsolutePosition()  // 作用点
);
```

### 4. 碰撞检测与自动清理

```typescript
// 炮弹落地后 3 秒自动销毁
clone.physicsImpostor.registerOnPhysicsCollide(
  this.ground.physicsImpostor,
  () => {
    setTimeout(() => {
      clone.dispose();
    }, 3000);
  }
);
```

## 最佳实践

### 1. 力的强度调整

```typescript
// 力的强度需要根据物体质量调整
// 质量越大，需要更大的力才能产生相同效果

// 轻物体（mass: 0.5）
box.physicsImpostor = new PhysicsImpostor(box, PhysicsImpostor.BoxImpostor, {
  mass: 0.5,
  friction: 1
});
// 较小的力就能推动
box.physicsImpostor.applyImpulse(new Vector3(-3, 0, 0), point);

// 重物体（mass: 10）
heavyBox.physicsImpostor = new PhysicsImpostor(heavyBox, PhysicsImpostor.BoxImpostor, {
  mass: 10,
  friction: 1
});
// 需要更大的力
heavyBox.physicsImpostor.applyImpulse(new Vector3(-30, 0, 0), point);
```

### 2. 使用模板克隆模式

```typescript
// 创建模板（禁用渲染）
this.cannonball = MeshBuilder.CreateSphere("cannonball", { diameter: 0.5 });
this.cannonball.physicsImpostor = new PhysicsImpostor(...);
this.cannonball.setEnabled(false);  // 隐藏模板

// 需要时克隆
const clone = this.cannonball.clone("clone");
clone.setEnabled(true);  // 显示克隆
```

### 3. 性能优化

```typescript
// 及时销毁不需要的物理对象
setTimeout(() => {
  mesh.dispose();  // 释放内存
}, 3000);

// 或者使用对象池（Object Pooling）复用对象
```

## 常见问题

### Q1: applyImpulse 和 applyForce 效果看起来一样？

虽然两者参数相同，但物理意义不同：
- `applyImpulse` 是冲量，瞬间改变动量
- `applyForce` 是力，在每帧持续作用

在单次调用时效果相似，但如果在渲染循环中持续调用，区别就明显了。

### Q2: 物体没有移动或移动很慢？

检查以下几点：
1. 力的大小是否足够（可能需要增大 scale 值）
2. 物体质量是否过大
3. 摩擦力是否过高
4. 物理引擎是否正确初始化

### Q3: 如何让物体旋转而不是平移？

将力的作用点设置在物体边缘：

```typescript
// 作用在顶部：向前推时会倾倒
physicsImpostor.applyImpulse(
  new Vector3(10, 0, 0),
  mesh.getAbsolutePosition().add(new Vector3(0, 2, 0))
);
```

### Q4: Ammo.js 和 Cannon.js 有什么区别？

| 特性 | Ammo.js | Cannon.js |
|------|---------|-----------|
| 功能 | 更强大 | 基础功能 |
| 性能 | 较好 | 一般 |
| 复杂度 | 较高 | 简单 |
| 推荐场景 | 复杂物理模拟 | 简单物理效果 |

两者在 Babylon.js 中的使用方式基本相同。

## 相关资源

- [Babylon.js 物理引擎文档](https://doc.babylonjs.com/features/featuresDeepDown/physics)
- [Ammo.js GitHub](https://github.com/kripken/ammo.js)
- [物理力学基础](https://zh.wikipedia.org/wiki/%E5%8A%9B)

## 下一课

[15. Raycasting - 射线检测](./15_Raycasting.md)
