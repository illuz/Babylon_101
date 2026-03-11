# 骨骼动画（Rigged Animations）

## 概述

骨骼动画是3D游戏开发中的核心技术，用于为角色和物体添加逼真的运动效果。本教程介绍如何在 Babylon.js 中导入和使用带有骨骼绑定的角色动画。

## 核心概念

### 1. 骨骼绑定（Rigging）

骨骼绑定是为3D模型添加内部骨骼结构的过程，使模型能够进行动画变形。

- **骨骼（Skeleton）**：模型的内部层次结构，定义了骨骼之间的父子关系
- **蒙皮（Skinning）**：将网格顶点绑定到骨骼上，使网格随骨骼运动
- **权重（Weights）**：定义每个顶点受不同骨骼影响的程度

### 2. 动画组（AnimationGroups）

在 Babylon.js 中，动画组是管理多个相关动画的容器：

```typescript
const { meshes, animationGroups } = await SceneLoader.ImportMeshAsync(
  "",
  "./models/",
  "character.glb"
);

// 动画组的基本操作
animationGroups[0].play(true);   // 播放并循环
animationGroups[0].stop();       // 停止动画
animationGroups[0].reset();      // 重置到起始帧
```

### 3. 关键帧动画

每个动画由一系列关键帧组成：

- **关键帧（Keyframe）**：记录特定时间点的骨骼状态
- **插值（Interpolation）**：在关键帧之间自动计算中间状态
- **帧率（FPS）**：推荐使用 60 FPS 以获得流畅的动画效果

## 动画获取与处理工作流

### 第一步：从 Mixamo 获取动画

[Mixamo](https://www.mixamo.com) 提供大量免费的角色动画：

1. **上传角色**：将你的 rigged 模型上传到 Mixamo（需要免费账户）
2. **选择动画**：浏览并选择需要的动画（idle、walk、run、jump 等）
3. **配置参数**：
   - 格式：FBX Binary
   - 帧率：60 FPS
   - 关键帧缩减：None
   - 皮肤：With Skin（推荐，动画质量更好）
4. **下载动画**：保存为独立的 FBX 文件

### 第二步：在 Blender 中处理

1. **导入角色模型**：File > Import > FBX
2. **应用皮肤纹理**：在 Shader Editor 中设置材质
3. **导入动画**：逐个导入 Mixamo 下载的动画 FBX
4. **重命名动画**：
   - 在 Action Editor 中重命名动画片段
   - 名称将用于在 Babylon.js 中引用动画
5. **使用 NLA 编辑器**：
   - 切换到 Non-Linear Animation 视图
   - 添加动作条（Add > Action Strip）
   - 重命名轨道为动画名称（idle、jump、run）
6. **导出 GLB**：File > Export > glTF 2.0 (.glb)
   - 启用 Animation 选项
   - 可选启用 Compression

### 第三步：验证动画

在 [Babylon.js Sandbox](https://sandbox.babylonjs.com/) 中测试导出的 GLB 文件：
- 检查模型显示是否正确
- 验证所有动画组是否可用
- 确认动画循环是否平滑

## Babylon.js 代码实现

### 基础导入与播放

```typescript
async CreateCharacter(): Promise<void> {
  // 导入带动画的角色
  const { meshes, animationGroups } = await SceneLoader.ImportMeshAsync(
    "",
    "./models/",
    "character.glb"
  );

  // 旋转角色（不要在 Blender 中旋转骨骼！）
  meshes[0].rotate(Vector3.Up(), Math.PI);

  // 查看可用的动画组
  console.log("动画组:", animationGroups.map(g => g.name));

  // 停止默认播放的动画
  animationGroups[0].stop();

  // 播放指定动画，true = 循环
  animationGroups[2].play(true);
}
```

### 动画控制函数

```typescript
class CharacterController {
  private animationGroups: AnimationGroup[];
  private currentAnimation: AnimationGroup;

  // 播放指定名称的动画
  playAnimation(name: string, loop: boolean = true): void {
    // 停止当前动画
    if (this.currentAnimation) {
      this.currentAnimation.stop();
    }

    // 查找并播放新动画
    const anim = this.animationGroups.find(g => g.name === name);
    if (anim) {
      this.currentAnimation = anim;
      anim.start(loop);
    }
  }

  // 动画混合（简单版本）
  blendToAnimation(name: string, duration: number = 0.2): void {
    // 注意：完整的动画混合需要使用 AnimationBlender
    this.playAnimation(name);
  }
}
```

### 角色控制器示例

```typescript
// 基于输入切换动画
updateCharacter(input: InputState): void {
  if (input.jump) {
    this.playAnimation("jump", false);
  } else if (input.moveForward) {
    this.playAnimation("run", true);
  } else {
    this.playAnimation("idle", true);
  }
}
```

## 最佳实践

### 1. 动画类型选择

| 动画类型 | 循环设置 | 使用场景 |
|---------|---------|---------|
| Idle（待机） | 循环 | 角色静止时 |
| Walk/Run（行走/跑步） | 循环 | 移动时 |
| Jump（跳跃） | 不循环 | 单次触发的动作 |
| Attack（攻击） | 不循环 | 战斗动作 |
| Die（死亡） | 不循环 | 游戏结束 |

### 2. In-Place 动画

推荐使用原地动画（In-Place Animation）：
- 动画只改变姿势，不改变位置
- 位置由代码控制，更精确
- 便于网络同步

### 3. 性能优化

```typescript
// 限制骨骼动画更新频率（远处角色）
skeleton.returnsTransformationForBoneAtIndex = true;

// 使用 LOD 简化骨骼
// 远处的角色可以使用更简单的骨骼结构
```

### 4. 常见问题解决

**角色显示黑色**：
- 检查材质的 Alpha 值是否为 0
- 确保 Emission 颜色为黑色
- 验证纹理路径正确

**动画抖动**：
- 检查关键帧插值类型
- 确保动画循环帧正确

**角色方向错误**：
- 在 Babylon.js 中使用 `rotate()` 调整
- 不要在 Blender 中旋转骨骼

## 相关 API 参考

- `AnimationGroup` - 动画组管理
  - `play(loop: boolean)` - 播放动画
  - `stop()` - 停止动画
  - `reset()` - 重置动画
  - `name` - 动画组名称

- `SceneLoader.ImportMeshAsync()` - 异步加载模型
  - 返回 `{ meshes, skeletons, animationGroups }`

- `AbstractMesh.rotate(axis, amount)` - 旋转网格
  - `axis`: 旋转轴（Vector3）
  - `amount`: 旋转角度（弧度）

## 下一步学习

- [18. Character Controller](./18_Character_Controller.md) - 创建完整的角色控制器
- 动画混合（Animation Blending）- 平滑过渡动画
- 状态机（Animation State Machine）- 管理复杂的动画逻辑
