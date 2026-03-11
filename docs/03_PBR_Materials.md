# PBR 材质（Physically Based Rendering Materials）

## 课程概述

本课程介绍 Babylon.js 中的 PBR（基于物理的渲染）材质系统。PBR 是现代游戏和实时渲染中的标准材质工作流，能够创建更加真实和物理准确的材质效果。

### 学习目标

- 理解 PBR 材质的工作原理和优势
- 掌握 PBR 材质的核心属性（金属度、粗糙度等）
- 学会使用环境贴图实现真实的光照效果
- 了解通道打包技术和自发光效果

---

## 核心知识点

### 1. PBR 与 Standard Material 的区别

| 特性 | Standard Material | PBR Material |
|------|-------------------|--------------|
| 物理准确性 | 近似模拟 | 基于物理规律 |
| 能量守恒 | 不保证 | 保证（反射+漫反射=总能量） |
| 光照一致性 | 不同环境下效果差异大 | 各环境下效果一致 |
| 材质属性 | diffuse、specular 等 | albedo、metallic、roughness 等 |
| 环境光照 | 依赖场景光源 | 支持基于图像的光照（IBL） |
| 真实感 | 较低 | 较高 |

### 2. PBR 核心属性

#### 2.1 Albedo（反照率）

- **作用**：定义材质的基础颜色
- **与 Diffuse 的区别**：Albedo 不包含光照信息，是纯粹的表面颜色
- **使用方式**：
  ```typescript
  // 通过贴图
  pbr.albedoTexture = new Texture("./path/to/albedo.jpg", scene);

  // 通过颜色
  pbr.albedoColor = new Color3(1, 0, 0); // 红色
  ```

#### 2.2 Metallic（金属度）

- **作用**：定义材质的金属属性
- **取值范围**：0（非金属）到 1（金属）
- **影响**：
  - 非金属（0）：有漫反射，反射颜色受 albedo 影响
  - 金属（1）：无漫反射，反射颜色等于 albedo 颜色
- **常见值**：
  - 塑料、木材、石头：0
  - 金属表面：1
  - 生锈金属：0.3-0.7

#### 2.3 Roughness（粗糙度）

- **作用**：定义表面的光滑程度
- **取值范围**：0（光滑）到 1（粗糙）
- **影响**：
  - 0：镜面反射，清晰的反射
  - 1：完全漫反射，模糊的反射
- **视觉效果**：
  - 低粗糙度：光滑表面（镜子、水面、金属）
  - 高粗糙度：粗糙表面（混凝土、布料、哑光塑料）

#### 2.4 Ambient Occlusion（环境光遮蔽）

- **作用**：模拟表面缝隙和角落的阴影
- **效果**：增加细节和真实感
- **来源**：通常从高模烘焙或程序生成

### 3. 通道打包（Channel Packing）

将多个灰度贴图合并到一张 RGB 图像中：

```
+-------------------+
|   RGB 组合贴图    |
+-------------------+
| R 通道 -> AO      |
| G 通道 -> Roughness|
| B 通道 -> Metallic |
+-------------------+
```

**优势**：
- 减少纹理数量，节省内存
- 提高渲染性能
- 减少文件 I/O 操作

**Babylon.js 中的设置**：
```typescript
// 启用通道读取
pbr.useAmbientOcclusionFromMetallicTextureRed = true;    // R 通道 = AO
pbr.useRoughnessFromMetallicTextureGreen = true;         // G 通道 = 粗糙度
pbr.useMetallnessFromMetallicTextureBlue = true;         // B 通道 = 金属度

// 设置组合贴图
pbr.metallicTexture = new Texture("./path/to/ao_rough_metal.jpg", scene);
```

### 4. 环境贴图（Environment Texture）

#### 4.1 什么是环境贴图

环境贴图是从 HDR（高动态范围）图像转换而来，用于：
- 提供环境光照（Image-Based Lighting, IBL）
- 作为天空盒背景
- 为 PBR 材质提供反射源

#### 4.2 创建环境贴图

1. **下载 HDR 图像**：从 Poly Haven 等网站获取免费 HDR
2. **转换为 .env 格式**：使用 Babylon.js 官方工具
   - 在线工具：https://www.babylonjs.com/tools/ibl/
   - 拖入 HDR 文件，下载生成的 .env 文件

#### 4.3 使用环境贴图

```typescript
// 从预过滤数据创建立方体贴图
const envTex = CubeTexture.CreateFromPrefilteredData(
  "./environment/sky.env",
  scene
);

// 应用到场景
scene.environmentTexture = envTex;

// 创建天空盒
scene.createDefaultSkybox(envTex, true);  // true = 使用 PBR

// 调整环境光强度
scene.environmentIntensity = 0.5;  // 0-1，默认 1
```

### 5. 自发光效果（Emissive）

#### 5.1 基本设置

```typescript
// 1. 设置自发光颜色（重要：默认为黑色，需设为白色才能显示贴图颜色）
pbr.emissiveColor = new Color3(1, 1, 1);  // 白色 = 使用贴图原色

// 2. 设置自发光贴图
pbr.emissiveTexture = new Texture("./path/to/emissive.png", scene);

// 3. 调整发光强度
pbr.emissiveIntensity = 1.0;  // 可大于 1 增强效果
```

#### 5.2 GlowLayer（泛光层）

使发光物体产生真实的泛光效果：

```typescript
// 创建泛光层
const glowLayer = new GlowLayer("glow", scene);

// 调整泛光强度
glowLayer.intensity = 1.0;
```

**注意事项**：
- GlowLayer 应用于整个场景
- 所有自发光材质都会受到影响
- 可通过 `glowLayer.intensity` 统一调整

---

## 代码示例与解释

### 示例 1：基础 PBR 材质设置

```typescript
// 创建 PBR 材质
const pbr = new PBRMaterial("pbr", scene);

// 设置基础颜色
pbr.albedoColor = new Color3(0.8, 0.2, 0.2);  // 红色

// 设置金属度（塑料 = 非金属）
pbr.metallic = 0;

// 设置粗糙度（光滑表面）
pbr.roughness = 0.3;
```

### 示例 2：使用纹理贴图

```typescript
const pbr = new PBRMaterial("pbr", scene);

// 基础颜色贴图
pbr.albedoTexture = new Texture("./textures/diffuse.jpg", scene);

// 法线贴图
pbr.bumpTexture = new Texture("./textures/normal.jpg", scene);
pbr.invertNormalMapX = true;
pbr.invertNormalMapY = true;

// 组合贴图（通道打包）
pbr.useAmbientOcclusionFromMetallicTextureRed = true;
pbr.useRoughnessFromMetallicTextureGreen = true;
pbr.useMetallnessFromMetallicTextureBlue = true;
pbr.metallicTexture = new Texture("./textures/ao_rough_metal.jpg", scene);
```

### 示例 3：自发光材质

```typescript
const pbr = new PBRMaterial("pbr", scene);

// 自发光设置
pbr.emissiveColor = new Color3(1, 1, 1);
pbr.emissiveTexture = new Texture("./textures/emissive.png", scene);
pbr.emissiveIntensity = 2.0;

// 创建泛光层
const glowLayer = new GlowLayer("glow", scene);
glowLayer.intensity = 1.5;
```

### 示例 4：环境光照控制

```typescript
// 全局环境光强度
scene.environmentIntensity = 0.5;

// 单个材质的环境光强度
pbr.environmentIntensity = 0.25;  // 此材质接收更少的环境光
```

---

## PBR 材质最佳实践

### 1. 贴图选择

| 贴图类型 | 格式建议 | 说明 |
|----------|----------|------|
| Albedo/Color | JPEG/PNG | 无光照信息的纯颜色 |
| Normal | JPEG/PNG | 确保正确设置轴向反转 |
| AO/Rough/Metal | JPEG（灰度） | 使用通道打包减少纹理数 |
| Emissive | PNG | 黑色区域不发光 |

### 2. 性能优化

- 使用通道打包减少纹理数量
- 选择合适的环境贴图分辨率（2K 通常足够）
- 合理设置 `environmentIntensity`
- 避免过多 GlowLayer

### 3. 材质真实性检查

- **金属材质**：metallic = 1，有清晰反射
- **塑料材质**：metallic = 0，roughness > 0.3
- **玻璃材质**：需要配合透明度设置
- **布料材质**：高粗糙度，可添加次表面散射

### 4. 常见问题排查

| 问题 | 可能原因 | 解决方案 |
|------|----------|----------|
| 材质全黑 | 无环境光照 | 添加环境贴图或光源 |
| 镜面反射 | 粗糙度为 0 | 增加粗糙度值或贴图 |
| 法线方向错误 | 法线贴图轴向 | 设置 invertNormalMapX/Y |
| 自发光不显示 | emissiveColor 为黑 | 设为 Color3(1,1,1) |
| 棋盘格纹理 | 贴图路径错误 | 检查文件路径 |

---

## 常见问题

### Q1: 为什么 PBR 材质看起来全黑？

**A**: PBR 材质依赖环境光照。确保：
- 场景有环境贴图：`scene.environmentTexture`
- 或者有光源（但效果不如环境贴图）
- 检查 `environmentIntensity` 是否大于 0

### Q2: 如何判断法线贴图是否需要反转？

**A**: 观察凹凸方向：
- 凹陷应该向内，凸起应该向外
- 如果相反，设置 `invertNormalMapX = true` 和 `invertNormalMapY = true`

### Q3: 自发光贴图为什么不显示颜色？

**A**: `emissiveColor` 默认为黑色，会遮盖所有颜色。设置：
```typescript
pbr.emissiveColor = new Color3(1, 1, 1);  // 白色 = 显示贴图原色
```

### Q4: Standard Material 和 PBR Material 可以混用吗？

**A**: 可以，但不推荐。PBR 材质使用环境贴图照明，Standard Material 使用场景光源。混用可能导致光照不一致。

### Q5: 如何获取免费 PBR 纹理？

**A**: 推荐资源：
- [Poly Haven](https://polyhaven.com/) - 免费 HDR 和纹理
- [GameTextures](https://gametextures.com/) - 部分免费，高级需订阅
- [Quixel Megascans](https://quixel.com/megascans) - Unreal Engine 用户免费

---

## 扩展阅读

- [Babylon.js PBR Material 官方文档](https://doc.babylonjs.com/features/featuresDeepDive/materials/using/introductionToPBR)
- [PBR 理论基础](https://learnopengl.com/PBR/Theory)
- [环境贴图转换工具](https://www.babylonjs.com/tools/ibl/)
