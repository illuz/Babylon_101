# 02. Standard Materials - 标准材质

## 课程概述

本课程介绍 Babylon.js 中的 `StandardMaterial`，这是最基础的材质类型，用于为 3D 对象添加纹理和表面属性。

### 学习目标
- 理解 StandardMaterial 的作用和基本用法
- 掌握四种主要纹理类型的应用
- 学会使用 UV Scale 控制纹理平铺
- 了解如何调整高光属性

---

## 核心知识点

### 1. StandardMaterial 概述

`StandardMaterial` 是 Babylon.js 中最常用的材质类型之一，适用于：
- 基础颜色和纹理贴图
- 不需要物理渲染（PBR）的简单场景
- 性能要求较高的应用

```typescript
import { StandardMaterial } from "@babylonjs/core";

// 创建材质
const material = new StandardMaterial("materialName", scene);

// 将材质分配给网格
mesh.material = material;
```

### 2. 四种主要纹理类型

| 纹理类型 | 属性名称 | 用途 | 效果 |
|---------|---------|------|------|
| Diffuse | `diffuseTexture` | 基础颜色 | 定义物体表面的基本颜色 |
| Normal | `bumpTexture` | 表面细节 | 模拟凹凸效果，不改变几何体 |
| AO | `ambientTexture` | 环境光遮蔽 | 添加阴影，增加真实感 |
| Specular | `specularTexture` | 高光反射 | 控制表面反射区域 |

#### 2.1 漫反射贴图（Diffuse Texture）

```typescript
const diffuseTex = new Texture("./textures/stone_diffuse.jpg", scene);
material.diffuseTexture = diffuseTex;
```

- 定义物体的基础颜色
- 最常用的纹理类型
- 可以配合 `diffuseColor` 使用来添加色调

#### 2.2 法线贴图（Normal Map）

```typescript
const normalTex = new Texture("./textures/stone_normal.jpg", scene);
material.bumpTexture = normalTex;

// 如需反转法线方向
material.invertNormalMapX = true;
material.invertNormalMapY = true;
```

- 通过 RGB 值模拟表面凹凸
- 不改变实际几何体，只影响光照计算
- 如果凹凸看起来"凹陷"而非"凸起"，需要反转

#### 2.3 环境光遮蔽贴图（AO Texture）

```typescript
const aoTex = new Texture("./textures/stone_ao.jpg", scene);
material.ambientTexture = aoTex;
```

- 灰度图：白色 = 更多光照，黑色 = 更少光照
- 模拟缝隙和角落的自然阴影
- 显著增加材质的真实感

#### 2.4 高光贴图（Specular Texture）

```typescript
const specTex = new Texture("./textures/stone_spec.jpg", scene);
material.specularTexture = specTex;
material.specularPower = 10; // 控制高光锐度
```

- 控制表面哪些区域更闪亮
- 白色 = 高反射，黑色 = 哑光
- `specularPower` 值越大，高光越集中

### 3. UV Scale（纹理缩放/平铺）

UV Scale 控制纹理在表面上的重复次数。

```typescript
const uvScale = 4;

// 方法一：单独设置每个纹理
diffuseTex.uScale = uvScale;
diffuseTex.vScale = uvScale;

// 方法二：使用数组统一设置（推荐）
const texArray: Texture[] = [diffuseTex, normalTex, aoTex, specTex];
texArray.forEach((tex) => {
  tex.uScale = uvScale;
  tex.vScale = uvScale;
});
```

#### 重要提示
- **所有纹理必须使用相同的 UV Scale**
- 如果不同纹理的缩放不同，会导致纹理错位
- 推荐使用数组统一设置

#### UV Scale 值参考
| 值 | 效果 |
|---|------|
| 1 | 纹理原始大小，不重复 |
| 2 | 纹理重复 2 次 |
| 4 | 纹理重复 4 次（常用） |
| 8+ | 纹理非常精细，重复多次 |

### 4. 高光属性调整

```typescript
// specularPower 控制高光的锐度
material.specularPower = 10;
```

| specularPower 值 | 效果 | 适用场景 |
|-----------------|------|---------|
| 1 | 柔和、几乎看不出高光 | 哑光表面 |
| 10 | 中等锐度 | 大多数金属 |
| 32-64 | 锐利高光 | 光滑金属、塑料 |
| 128+ | 非常锐利 | 镜面反射表面 |

---

## 代码示例与解释

### 完整示例：创建带纹理的地面

```typescript
CreateGroundMaterial(): StandardMaterial {
  // 1. 创建材质
  const groundMat = new StandardMaterial("groundMat", this.scene);

  // 2. 定义 UV Scale 和纹理数组
  const uvScale = 4;
  const texArray: Texture[] = [];

  // 3. 创建并分配漫反射贴图
  const diffuseTex = new Texture("./textures/stone/stone_diffuse.jpg", this.scene);
  groundMat.diffuseTexture = diffuseTex;
  texArray.push(diffuseTex);

  // 4. 创建并分配法线贴图
  const normalTex = new Texture("./textures/stone/stone_normal.jpg", this.scene);
  groundMat.bumpTexture = normalTex;
  groundMat.invertNormalMapX = true;
  groundMat.invertNormalMapY = true;
  texArray.push(normalTex);

  // 5. 创建并分配 AO 贴图
  const aoTex = new Texture("./textures/stone/stone_ao.jpg", this.scene);
  groundMat.ambientTexture = aoTex;
  texArray.push(aoTex);

  // 6. 创建并分配高光贴图
  const specTex = new Texture("./textures/stone/stone_spec.jpg", this.scene);
  groundMat.specularTexture = specTex;
  texArray.push(specTex);

  // 7. 统一设置 UV Scale
  texArray.forEach((tex) => {
    tex.uScale = uvScale;
    tex.vScale = uvScale;
  });

  return groundMat;
}
```

### 材质分配流程

```
1. 创建材质实例
      |
2. 创建纹理并分配到材质属性
      |
3. 将纹理添加到数组
      |
4. 统一设置 UV Scale
      |
5. 返回材质并分配给网格
```

---

## 纹理贴图说明

### 纹理来源

推荐使用 [Poly Haven](https://polyhaven.com/) 获取免费纹理。

### StandardMaterial 适用的纹理格式

| 纹理类型 | Poly Haven 中的名称 | 文件格式 |
|---------|-------------------|---------|
| Diffuse | Diffuse / Albedo | JPG / PNG |
| Normal | Normal (OpenGL) | JPG / PNG |
| AO | Ambient Occlusion | JPG / PNG |
| Specular | Specular | JPG / PNG |

### 项目目录结构

```
public/
  textures/
    stone/
      stone_diffuse.jpg
      stone_normal.jpg
      stone_ao.jpg
      stone_spec.jpg
    metal/
      metal_diffuse.jpg
      metal_normal.jpg
      metal_ao.jpg
      metal_spec.jpg
```

---

## 常见问题

### Q1: 法线贴图看起来是凹陷的，不是凸起的

**解决方案**：反转法线贴图的 X 和 Y 方向

```typescript
material.invertNormalMapX = true;
material.invertNormalMapY = true;
```

### Q2: 纹理看起来太大或太小

**解决方案**：调整 UV Scale

```typescript
// 纹理太大 -> 增加 uvScale
const uvScale = 8;

// 纹理太小 -> 减少 uvScale
const uvScale = 2;
```

### Q3: 不同纹理看起来不对齐

**解决方案**：确保所有纹理使用相同的 UV Scale

```typescript
// 使用数组统一设置
texArray.forEach((tex) => {
  tex.uScale = uvScale;
  tex.vScale = uvScale;
});
```

### Q4: 材质太暗或太亮

**解决方案**：
1. 调整灯光强度
   ```typescript
   hemiLight.intensity = 0.75; // 增加亮度
   ```
2. 调整漫反射颜色
   ```typescript
   material.diffuseColor = new Color3(1, 1, 1); // 最亮
   ```

### Q5: StandardMaterial 和 PBRMaterial 有什么区别？

| 特性 | StandardMaterial | PBRMaterial |
|-----|-----------------|-------------|
| 性能 | 更快 | 稍慢 |
| 真实感 | 基础 | 高度真实 |
| 纹理 | diffuse/normal/ao/spec | albedo/normal/roughness/metallic |
| 适用场景 | 简单场景、移动端 | 高质量渲染、桌面应用 |

### Q6: 相机移动太快

**解决方案**：降低相机速度

```typescript
camera.speed = 0.25; // 默认为 1
```

---

## 下一步学习

完成本课程后，建议继续学习：
- **PBR Materials** - 物理渲染材质，更真实的光照效果
- **Lights & Shadows** - 灯光和阴影
- **Custom Models** - 自定义模型

---

## 参考资源

- [Babylon.js 官方文档 - StandardMaterial](https://doc.babylonjs.com/features/featuresDeepDive/materials/using/materials_introduction)
- [Poly Haven 免费纹理](https://polyhaven.com/)
- [UV 贴图基础](https://learnopengl.com/Getting-started/Textures)