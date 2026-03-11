# 09_Mesh_Actions - 网格动作与交互

## 课程概述

本课程介绍 Babylon.js 中的 ActionManager 系统，用于为网格对象添加交互性。通过 ActionManager，我们可以轻松实现点击、悬停、拖拽等交互效果，无需编写复杂的逻辑代码。

**核心能力**：
- 点击网格改变属性（缩放、旋转、位置等）
- 平滑过渡材质属性（粗糙度、颜色等）
- 持续动画效果（每帧更新的旋转）

---

## 核心概念

### 1. ActionManager（动作管理器）

ActionManager 是 Babylon.js 中管理交互动作的核心类。每个需要交互的网格或场景都需要创建一个 ActionManager 实例。

```typescript
// 为网格创建 ActionManager
mesh.actionManager = new ActionManager(scene);

// 为场景创建 ActionManager（用于场景级触发器）
scene.actionManager = new ActionManager(scene);
```

**工作流程**：
1. 创建 ActionManager 实例
2. 使用 `registerAction()` 注册动作
3. 指定触发器（何时执行）
4. 指定动作内容（执行什么操作）

---

### 2. Trigger（触发器）

触发器定义了动作执行的时机。Babylon.js 提供了多种内置触发器：

| 触发器 | 说明 | 使用场景 |
|--------|------|----------|
| `OnPickDownTrigger` | 鼠标/触摸点击按下时 | 点击响应 |
| `OnPickUpTrigger` | 鼠标/触摸点击释放时 | 按钮式交互 |
| `OnPointerOverTrigger` | 鼠标悬停在网格上时 | 高亮提示 |
| `OnPointerOutTrigger` | 鼠标离开网格时 | 取消高亮 |
| `OnEveryFrameTrigger` | 每帧触发 | 持续动画 |
| `NothingTrigger` | 无触发器 | 链式动作的后续动作 |

**示例**：
```typescript
// 点击触发
ActionManager.OnPickDownTrigger

// 悬停触发
ActionManager.OnPointerOverTrigger

// 每帧触发（场景级）
ActionManager.OnEveryFrameTrigger
```

---

### 3. Action（动作）

动作定义了触发时要执行的操作。常用的动作类型包括：

#### SetValueAction（直接设置值）

立即将属性设置为指定值，无过渡效果。

```typescript
new SetValueAction(
  ActionManager.OnPickDownTrigger,  // 触发器
  mesh,                              // 目标对象
  "scaling",                         // 属性路径
  new Vector3(1.5, 1.5, 1.5)        // 新值
)
```

**参数**：
- `trigger`: 触发器类型
- `target`: 要修改的对象（可以是网格、材质、灯光等）
- `propertyPath`: 属性名称（字符串）
- `value`: 要设置的值

---

#### InterpolateValueAction（插值过渡）

在指定时间内平滑过渡属性值。

```typescript
new InterpolateValueAction(
  ActionManager.OnPickDownTrigger,  // 触发器
  material,                          // 目标对象
  "roughness",                       // 属性路径
  0,                                 // 目标值
  3000                               // 过渡时间（毫秒）
)
```

**参数**：
- `trigger`: 触发器类型
- `target`: 目标对象
- `propertyPath`: 属性名称
- `value`: 目标值
- `duration`: 过渡时间（毫秒）

**特点**：
- 平滑过渡效果
- 适用于数值类型属性
- 常用于材质属性变化（粗糙度、透明度等）

---

#### IncrementValueAction（增量更新）

每次触发时增加（或减少）属性值。

```typescript
new IncrementValueAction(
  ActionManager.OnEveryFrameTrigger,  // 触发器：每帧
  mesh,                                // 目标对象
  "rotation.x",                        // 属性路径
  0.01                                 // 增量值
)
```

**参数**：
- `trigger`: 触发器类型
- `target`: 目标对象
- `propertyPath`: 属性名称
- `value`: 增量值（正数增加，负数减少）

**特点**：
- 适用于持续累加的场景
- 配合 `OnEveryFrameTrigger` 实现动画
- 增量值需要很小（每帧调用）

---

### 4. 链式动作（.then()）

使用 `.then()` 方法可以将多个动作串联起来，实现连续交互。

```typescript
mesh.actionManager
  .registerAction(
    new InterpolateValueAction(
      ActionManager.OnPickDownTrigger,
      material,
      "roughness",
      0,    // 第一次点击：粗糙度 -> 0
      3000
    )
  )
  .then(
    new InterpolateValueAction(
      ActionManager.NothingTrigger,  // 使用 NothingTrigger
      material,
      "roughness",
      1,    // 第二次点击：粗糙度 -> 1
      1000
    )
  );
```

**工作原理**：
1. 第一次点击：执行第一个动作（粗糙度 1 -> 0）
2. 第二次点击：执行第二个动作（粗糙度 0 -> 1）
3. 循环往复

---

## 代码示例

### 示例 1：点击缩放

```typescript
// 创建 ActionManager
cube.actionManager = new ActionManager(scene);

// 注册动作：点击时放大到 1.5 倍
cube.actionManager.registerAction(
  new SetValueAction(
    ActionManager.OnPickDownTrigger,
    cube,
    "scaling",
    new Vector3(1.5, 1.5, 1.5)
  )
);
```

**效果**：点击立方体，立即放大到 1.5 倍。

---

### 示例 2：材质属性平滑过渡

```typescript
// 创建 PBR 材质
const material = new PBRMaterial("mat", scene);
material.roughness = 1;  // 初始粗糙度

sphere.actionManager = new ActionManager(scene);

// 点击时：3 秒内粗糙度从 1 过渡到 0（变成镜面）
sphere.actionManager
  .registerAction(
    new InterpolateValueAction(
      ActionManager.OnPickDownTrigger,
      material,
      "roughness",
      0,
      3000
    )
  )
  // 再次点击：1 秒内粗糙度从 0 恢复到 1
  .then(
    new InterpolateValueAction(
      ActionManager.NothingTrigger,
      material,
      "roughness",
      1,
      1000
    )
  );
```

**效果**：
- 第一次点击：球体在 3 秒内变成镜面反射
- 第二次点击：球体在 1 秒内恢复粗糙

---

### 示例 3：持续旋转动画

```typescript
// 场景级 ActionManager
scene.actionManager = new ActionManager(scene);

// 每帧增加旋转角度
scene.actionManager.registerAction(
  new IncrementValueAction(
    ActionManager.OnEveryFrameTrigger,
    cylinder,
    "rotation.x",
    -0.01  // 负值表示反向旋转
  )
);
```

**效果**：圆柱体持续绕 X 轴旋转。

**注意事项**：
- `OnEveryFrameTrigger` 每帧执行（60 FPS = 每秒 60 次）
- 增量值必须很小（如 0.01），否则旋转过快
- 使用场景级 ActionManager，而非网格级

---

## 常用属性路径

| 目标类型 | 属性路径 | 值类型 | 说明 |
|----------|----------|--------|------|
| Mesh | `"scaling"` | Vector3 | 整体缩放 |
| Mesh | `"scaling.x"` | number | X 轴缩放 |
| Mesh | `"rotation"` | Vector3 | 整体旋转 |
| Mesh | `"rotation.x"` | number | X 轴旋转 |
| Mesh | `"position"` | Vector3 | 位置 |
| PBRMaterial | `"roughness"` | number | 粗糙度 (0-1) |
| PBRMaterial | `"metallic"` | number | 金属度 (0-1) |
| PBRMaterial | `"alpha"` | number | 透明度 (0-1) |
| StandardMaterial | `"diffuseColor"` | Color3 | 漫反射颜色 |

---

## 常见问题

### Q1: 点击后鼠标光标没有变化？

**原因**：网格没有 ActionManager。

**解决**：确保为网格创建了 ActionManager：
```typescript
mesh.actionManager = new ActionManager(scene);
```

---

### Q2: InterpolateValueAction 没有效果？

**可能原因**：
1. 属性路径错误（检查拼写）
2. 目标对象错误（确保是正确的材质或网格）
3. 值类型不匹配（确保值类型与属性类型一致）

**调试**：
```typescript
// 检查属性是否存在
console.log(material.roughness);  // 应该输出当前值
```

---

### Q3: OnEveryFrameTrigger 动画太快或太慢？

**原因**：增量值设置不当。

**解决**：
- 动画太快：减小增量值（如从 0.1 改为 0.01）
- 动画太慢：增大增量值（如从 0.01 改为 0.05）

---

### Q4: 如何重置 SetValueAction 的效果？

**方法 1**：刷新页面重新加载场景。

**方法 2**：使用链式动作恢复原值：
```typescript
mesh.actionManager
  .registerAction(
    new SetValueAction(OnPickDownTrigger, mesh, "scaling", new Vector3(1.5, 1.5, 1.5))
  )
  .then(
    new SetValueAction(NothingTrigger, mesh, "scaling", new Vector3(1, 1, 1))
  );
```

---

### Q5: 动作可以修改其他对象的属性吗？

**可以**。动作的 `target` 参数可以是任何对象，不必是注册动作的网格本身。

```typescript
// 点击 cube 时，修改 sphere 的属性
cube.actionManager.registerAction(
  new SetValueAction(
    ActionManager.OnPickDownTrigger,
    sphere,  // 目标是另一个网格
    "scaling",
    new Vector3(2, 2, 2)
  )
);
```

---

## 扩展阅读

- [Babylon.js 官方文档 - Actions](https://doc.babylonjs.com/features/featuresDeepDive/events/actions)
- [ActionManager API 参考](https://doc.babylonjs.com/typedoc/classes/babylon.actionmanager)
- [可用触发器列表](https://doc.babylonjs.com/typedoc/enums/babylon.actionmanager#onpicktrigger)

---

## 总结

| 概念 | 说明 |
|------|------|
| **ActionManager** | 管理动作的容器，每个交互对象需要一个 |
| **Trigger** | 定义动作触发的时机（点击、悬停、每帧等） |
| **Action** | 定义要执行的操作（设置值、插值、增量等） |
| **链式动作** | 使用 `.then()` 实现连续交互 |

**最佳实践**：
1. 为每个需要交互的网格创建独立的 ActionManager
2. 使用 `OnEveryFrameTrigger` 时注意增量值大小
3. 复杂交互使用链式动作组织
4. 目标对象可以是网格、材质、灯光等任何可修改的对象
