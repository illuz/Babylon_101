# 04. 导入自定义模型 (Importing Custom Models)

## 课程概述

本课程介绍如何在 Babylon.js 中导入外部 3D 模型文件，包括：

- 使用 SceneLoader 加载模型
- 支持的模型格式（GLB、GLTF、OBJ 等）
- 异步加载 vs 回调方式
- Blender 导出设置和坐标系统转换

## 核心知识点

### 1. SceneLoader 模型加载器

Babylon.js 提供 `SceneLoader` 类来加载外部 3D 模型：

```typescript
import { SceneLoader } from "@babylonjs/core";
import "@babylonjs/loaders"; // 必须导入 loaders 包
```

#### 两种加载方式

| 方式 | API | 特点 |
|------|-----|------|
| 回调方式 | `SceneLoader.ImportMesh()` | 传统方式，使用回调函数 |
| 异步方式 | `SceneLoader.ImportMeshAsync()` | 推荐，使用 async/await |

```typescript
// 方式一：回调方式
SceneLoader.ImportMesh(
  "",              // meshNames: 要加载的网格名称
  "./models/",     // rootUrl: 模型目录
  "barrel.glb",    // sceneFilename: 文件名
  this.scene,      // scene: 目标场景
  (meshes) => {    // onSuccess: 成功回调
    console.log("meshes", meshes);
  }
);

// 方式二：异步方式（推荐）
const { meshes } = await SceneLoader.ImportMeshAsync(
  "",              // meshNames: 空字符串加载所有
  "./models/",     // rootUrl: 模型目录
  "barrel.glb"     // sceneFilename: 文件名
);
```

#### ImportMesh 参数详解

| 参数 | 类型 | 说明 |
|------|------|------|
| `meshNames` | string | 要加载的网格名称，`""` 表示加载所有 |
| `rootUrl` | string | 模型文件所在目录路径（以 `/` 结尾） |
| `sceneFilename` | string | 模型文件名 |
| `scene` | Scene | 目标场景（异步版本可省略） |

#### 返回值

`ImportMeshAsync` 返回一个对象，包含：

```typescript
{
  meshes: AbstractMesh[],           // 网格数组
  particleSystems: ParticleSystem[], // 粒子系统
  skeletons: Skeleton[],             // 骨骼
  animationGroups: AnimationGroup[], // 动画组
  lights: Light[],                   // 灯光
  transformNodes: TransformNode[]    // 变换节点
}
```

### 2. 支持的模型格式

| 格式 | 扩展名 | 特点 |
|------|--------|------|
| **GLB** | `.glb` | 二进制格式，文件小，加载快，**推荐** |
| **GLTF** | `.gltf` | JSON 格式，可读性好，适合调试 |
| **OBJ** | `.obj` | 传统格式，兼容性好，不支持动画 |
| **STL** | `.stl` | 仅几何体，常用于 3D 打印 |
| **FBX** | `.fbx` | 工业标准，支持骨骼动画 |

**推荐使用 GLB 格式**：
- 单文件，易于管理
- 二进制格式，加载速度快
- 支持纹理、材质、动画

### 3. Root Mesh 概念

加载的模型有一个特殊的根节点：

```typescript
const { meshes } = await SceneLoader.ImportMeshAsync("", "./models/", "model.glb");

// meshes[0] 是 __root__ 节点
// meshes[1+] 是实际的网格对象

// 通过 root mesh 可以统一控制整个模型
meshes[0].position = new Vector3(10, 0, 0);    // 移动整个模型
meshes[0].scaling = new Vector3(2, 2, 2);       // 缩放整个模型
meshes[0].rotation = new Vector3(0, Math.PI, 0); // 旋转整个模型
```

### 4. Blender 导出设置

#### 坐标系统差异

- **Blender**: Z 轴向上
- **Babylon.js**: Y 轴向上

#### 导出 GLB 的关键设置

1. **Transform > +Y Up**: 必须勾选，用于坐标系转换
2. **Include > Selected Objects**: 仅导出选中对象
3. **Geometry**: 取消勾选 Vertex Colors（如不需要）
4. **Materials**: 设置为 Export

#### 导出前的检查清单

- [ ] 位置归零 (Location: X=0, Y=0, Z=0)
- [ ] 旋转归零 (Rotation: X=0, Y=0, Z=0)
- [ ] 缩放归一 (Scale: X=1, Y=1, Z=1)
- [ ] 网格命名清晰（避免使用 Cylinder.001 等）
- [ ] 材质命名规范

### 5. 验证模型 - Babylon Sandbox

在导入代码前，推荐使用 Babylon Sandbox 验证模型：

- 网址：https://sandbox.babylonjs.com/
- 拖入 GLB 文件即可预览
- 检查 Inspector > Nodes 查看网格结构

## 代码示例

### 基本加载

```typescript
async loadModel(): Promise<void> {
  const { meshes } = await SceneLoader.ImportMeshAsync(
    "",
    "./models/",
    "barrel.glb"
  );

  // 访问模型中的特定网格
  const barrel = meshes.find(m => m.name === "barrel_01");
  if (barrel) {
    barrel.position = new Vector3(0, 1, 0);
  }
}
```

### 加载并处理多网格场景

```typescript
async loadCampfire(): Promise<void> {
  const models = await SceneLoader.ImportMeshAsync(
    "",
    "./models/",
    "campfire.glb"
  );

  // 遍历所有网格
  models.meshes.forEach(mesh => {
    console.log(`网格: ${mesh.name}`);
  });

  // 调整整个场景的位置
  models.meshes[0].position.y = 0.5;
}
```

### 使用进度回调

```typescript
const result = await SceneLoader.ImportMeshAsync(
  "",
  "./models/",
  "large_scene.glb",
  this.scene,
  (evt) => {
    const progress = (evt.loaded / evt.total) * 100;
    console.log(`加载进度: ${progress}%`);
  }
);
```

## 常见问题

### Q1: 模型加载后方向不对

**原因**: Blender 和 Babylon.js 坐标系统不同

**解决**: 导出时勾选 `+Y Up` 选项

### Q2: 模型材质丢失

**原因**: 纹理路径不正确

**解决**:
- 使用 GLB 格式（纹理嵌入文件）
- 或确保纹理文件相对路径正确

### Q3: 模型太大或太小

**解决**: 通过 root mesh 调整缩放

```typescript
meshes[0].scaling = new Vector3(0.5, 0.5, 0.5); // 缩小一半
```

### Q4: 如何选择特定网格加载

```typescript
// 仅加载名为 "head" 的网格
const { meshes } = await SceneLoader.ImportMeshAsync(
  "head",
  "./models/",
  "character.glb"
);
```

### Q5: 模型没有动画

**检查**:
1. Blender 中是否正确设置了动画
2. 导出时是否包含动画
3. 加载后访问 `animationGroups`

```typescript
const { animationGroups } = await SceneLoader.ImportMeshAsync(...);

// 播放第一个动画
animationGroups[0]?.start();
```

## 最佳实践

1. **使用 GLB 格式**: 单文件、体积小、加载快
2. **命名规范**: 在建模软件中给网格和材质清晰的命名
3. **归一变换**: 导出前确保位置、旋转、缩放已归一化
4. **先验证后编码**: 使用 Sandbox 验证模型是否正确
5. **使用异步加载**: `ImportMeshAsync` 配合 `async/await`
6. **处理加载错误**: 添加 try-catch 处理加载失败情况

```typescript
async loadModel(): Promise<void> {
  try {
    const { meshes } = await SceneLoader.ImportMeshAsync(...);
    // 处理成功加载
  } catch (error) {
    console.error("模型加载失败:", error);
    // 显示错误提示或加载备用模型
  }
}
```

## 相关资源

- [Babylon.js 官方文档 - Loading 3D Models](https://doc.babylonjs.com/divingDeeper/importers/loadingFileFormats)
- [Babylon.js Sandbox](https://sandbox.babylonjs.com/)
- [Poly Haven - 免费 3D 模型资源](https://polyhaven.com/models)
- [Kenney - 游戏资产资源](https://kenney.nl/assets)