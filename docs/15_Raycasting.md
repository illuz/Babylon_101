# Raycasting（射线检测）

## 概述

射线检测（Raycasting）是 Babylon.js 中一种创建不可见线条来检测场景中其他对象的技术。它广泛应用于游戏开发中，如第一人称射击游戏的命中检测、物体交互等。

## 核心概念

### 射线（Ray）的三要素

| 属性 | 说明 |
|------|------|
| **Origin（原点）** | 射线的起始位置，通常是一个 Vector3 坐标 |
| **Direction（方向）** | 射线指向的方向，是一个标准化的 Vector3 向量 |
| **Length（长度）** | 射线延伸的距离 |

### 常见应用场景

1. **命中检测（Hitscan）**：FPS 游戏中检测武器射击是否命中目标
2. **物体交互**：检测鼠标点击的是哪个物体
3. **距离检测**：测量到障碍物的距离
4. **视线检测**：AI 判断是否能"看到"玩家

## 核心 API

### 1. 创建射线

```typescript
// 方式一：使用 createPickingRay 基于屏幕坐标创建射线
const ray = this.scene.createPickingRay(
  this.scene.pointerX,  // 鼠标 X 坐标
  this.scene.pointerY,  // 鼠标 Y 坐标
  Matrix.Identity(),    // 变换矩阵
  this.camera           // 摄像机
);

// 方式二：手动创建 Ray 对象
const ray = new Ray(
  origin,      // 起始点 Vector3
  direction,   // 方向 Vector3
  length       // 长度（可选）
);
```

### 2. 执行射线检测

```typescript
// 使用射线拾取场景
const raycastHit = this.scene.pickWithRay(ray);
```

### 3. 碰撞结果（PickingInfo）

| 属性 | 类型 | 说明 |
|------|------|------|
| `hit` | boolean | 是否命中任何物体 |
| `pickedMesh` | AbstractMesh | 被命中的网格对象 |
| `pickedPoint` | Vector3 | 命中点的世界坐标 |
| `getNormal()` | Vector3 | 命中面的法线方向 |
| `distance` | number | 射线原点到命中点的距离 |

## 贴花（Decal）

贴花是一种可以在运行时动态放置在网格表面的纹理效果。

### 创建贴花

```typescript
const decal = MeshBuilder.CreateDecal(
  "decal",                  // 名称
  raycastHit.pickedMesh,    // 目标网格
  {
    position: raycastHit.pickedPoint,    // 位置
    normal: raycastHit.getNormal(true),  // 法线
    size: new Vector3(1, 1, 1),          // 尺寸
  }
);
```

### 贴花材质配置要点

```typescript
// 1. 启用透明度
material.albedoTexture.hasAlpha = true;

// 2. 设置 Z 偏移避免 Z-fighting
// Z-fighting：两个面非常接近时产生的纹理闪烁问题
material.zOffset = -0.25;  // 负值推向摄像机
```

## 物理冲量（Impulse）

当射线命中带有物理碰撞体的对象时，可以对其施加冲量。

### 冲量与力的区别

| 方法 | 说明 |
|------|------|
| `applyImpulse(force, point)` | 瞬间力，立即改变速度 |
| `applyForce(force, point)` | 持续力，需要每帧应用 |

### 示例代码

```typescript
// 使用射线方向作为力的方向
// scale(5) 放大力的强度
raycastHit.pickedMesh.physicsImpostor.applyImpulse(
  ray.direction.scale(5),        // 力的方向和大小
  raycastHit.pickedPoint         // 施力点
);
```

## 完整示例流程

```typescript
// 1. 监听鼠标点击
this.scene.onPointerDown = () => {
  // 2. 创建射线
  const ray = this.scene.createPickingRay(
    this.scene.pointerX,
    this.scene.pointerY,
    Matrix.Identity(),
    this.camera
  );

  // 3. 执行检测
  const raycastHit = this.scene.pickWithRay(ray);

  // 4. 处理命中结果
  if (raycastHit.hit && raycastHit.pickedMesh.name === "target") {
    // 5. 创建贴花
    const decal = MeshBuilder.CreateDecal("decal", raycastHit.pickedMesh, {
      position: raycastHit.pickedPoint,
      normal: raycastHit.getNormal(true),
      size: new Vector3(1, 1, 1),
    });

    // 6. 设置材质和父子关系
    decal.material = randomMaterial;
    decal.setParent(raycastHit.pickedMesh);

    // 7. 施加物理冲量
    raycastHit.pickedMesh.physicsImpostor.applyImpulse(
      ray.direction.scale(5),
      raycastHit.pickedPoint
    );
  }
};
```

## 注意事项

1. **射线检测不需要物理系统**：射线检测是基于网格的，与物理系统无关。但若要对被命中的对象施加力，则需要物理碰撞体。

2. **性能优化**：
   - 使用 `ray.length` 限制射线长度
   - 使用 `predicate` 函数过滤检测对象
   ```typescript
   scene.pickWithRay(ray, (mesh) => mesh.name === "enemy");
   ```

3. **多层检测**：使用 `scene.multiPickWithRay()` 获取射线路径上的所有命中对象。

4. **贴花跟随**：使用 `setParent()` 让贴花跟随目标物体移动，避免贴花"漂浮"。

## 相关 API 参考

- `Scene.createPickingRay()` - 创建拾取射线
- `Scene.pickWithRay()` - 执行射线检测
- `Scene.multiPickWithRay()` - 多目标检测
- `MeshBuilder.CreateDecal()` - 创建贴花
- `PhysicsImpostor.applyImpulse()` - 施加冲量
- `PhysicsImpostor.applyForce()` - 施加力