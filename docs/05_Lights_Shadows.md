# 05 - 光源与阴影（Lights & Shadows）

## 课程概述

本课程深入讲解 Babylon.js 中的动态光照系统和阴影生成技术。通过学习四种主要光源类型和阴影系统，你将能够为 3D 场景添加逼真的光照效果。

### 学习目标
- 理解四种光源类型的特性与应用场景
- 掌握光源属性（颜色、强度、范围）的设置
- 学会使用 ShadowGenerator 生成动态阴影
- 了解阴影质量优化的方法

---

## 核心知识点

### 1. 光源类型

Babylon.js 提供四种主要光源类型，每种都有独特的特性和用途：

#### 1.1 半球光（HemisphericLight）

半球光模拟环境光，从天空向地面照射，产生自然的渐变效果。

```typescript
// 创建半球光
const hemiLight = new HemisphericLight(
  "hemiLight",
  new Vector3(0, 1, 0), // 方向向量（指向天空）
  scene
);

// 颜色属性
hemiLight.diffuse = new Color3(1, 1, 1);     // 天空色（漫反射）
hemiLight.groundColor = new Color3(0.5, 0.5, 0.5); // 地面色
hemiLight.specular = new Color3(1, 1, 1);    // 高光色
```

**特点**：
- 无法产生阴影
- 性能消耗最低
- 适合作为场景基础照明
- 可以创建天空到地面的颜色渐变

#### 1.2 方向光（DirectionalLight）

方向光是平行光，所有光线方向一致，适合模拟太阳光。

```typescript
const directionalLight = new DirectionalLight(
  "directionalLight",
  new Vector3(0, -1, 0), // 光线方向（向下）
  scene
);

directionalLight.intensity = 1.0; // 光照强度
```

**特点**：
- 可以产生阴影
- 光线平行，适合大范围照明
- 常用于室外场景模拟太阳
- 阴影平行投射，适合大面积阴影

#### 1.3 点光源（PointLight）

点光源从一个点向所有方向发射光线，类似灯泡。

```typescript
const pointLight = new PointLight(
  "pointLight",
  new Vector3(0, 2, 0), // 光源位置
  scene
);

pointLight.diffuse = new Color3(1, 1, 1); // 光源颜色
pointLight.intensity = 1.0;               // 光照强度
pointLight.range = 10;                    // 光照范围（衰减距离）
```

**特点**：
- 光线向所有方向发散
- 有衰减效果（距离越远越暗）
- 可以产生阴影（但性能消耗较大）
- 适合室内灯光、火焰等

#### 1.4 聚光灯（SpotLight）

聚光灯产生锥形光束，最适合产生高质量阴影。

```typescript
const spotLight = new SpotLight(
  "spotLight",
  new Vector3(0, 3, 0),  // 位置
  new Vector3(0, -1, 0), // 方向
  Math.PI / 3,           // 光锥角度（弧度）
  2,                     // 边缘衰减指数
  scene
);

spotLight.intensity = 50; // 聚光灯通常需要更高的强度
```

**特点**：
- 锥形光束，有方向和角度
- **最适合产生阴影**
- 边缘可以设置柔和过渡
- 适合手电筒、舞台灯光等

---

### 2. 阴影系统

#### 2.1 ShadowGenerator 基础

```typescript
// 创建阴影生成器
const shadowGen = new ShadowGenerator(
  2048,     // 阴影贴图尺寸（2的幂次方）
  spotLight // 产生阴影的光源
);

// 添加阴影投射者
shadowGen.addShadowCaster(mesh);

// 设置物体接收阴影
mesh.receiveShadows = true;
```

#### 2.2 阴影贴图类型

Babylon.js 提供多种阴影贴图类型，质量和性能各异：

| 类型 | 质量 | 性能 | 用途 |
|------|------|------|------|
| `usePoissonSampling` | 低 | 快 | 简单场景 |
| `useExponentialShadowMap` | 中 | 中 | 一般场景 |
| `useBlurExponentialShadowMap` | 高 | 慢 | 需要柔和阴影 |
| `useBlurCloseExponentialShadowMap` | 最高 | 最慢 | 高质量场景 |

```typescript
// 推荐设置：高质量柔和阴影
shadowGen.useBlurCloseExponentialShadowMap = true;
shadowGen.blurKernel = 32; // 模糊核大小，越大越柔和
```

#### 2.3 阴影质量优化

```typescript
// 提高阴影贴图分辨率
const shadowGen = new ShadowGenerator(4096, light); // 4K 分辨率

// 设置阴影深度范围
spotLight.shadowMinZ = 1;  // 最近阴影距离
spotLight.shadowMaxZ = 50; // 最远阴影距离

// 使用级联阴影（大场景）
shadowGen.useContactHardeningShadowMap = true;
```

---

### 3. 光源属性详解

#### 3.1 颜色属性

```typescript
// Color3 颜色值范围 0-1
light.diffuse = new Color3(1, 0.5, 0); // 橙色漫反射

// 使用 255 进制转换
light.diffuse = new Color3(255/255, 128/255, 0/255);

// 使用十六进制颜色
light.diffuse = Color3.FromHexString("#FF8000");
```

#### 3.2 强度属性

```typescript
light.intensity = 1.0; // 标准强度

// 不同光源的推荐强度范围
// HemisphericLight: 0.5 - 1.0
// DirectionalLight: 0.5 - 2.0
// PointLight: 0.1 - 1.0
// SpotLight: 10 - 100（通常需要更高）
```

#### 3.3 衰减与范围

```typescript
// 点光源范围（超过此距离光照衰减为0）
pointLight.range = 20;

// 聚光灯角度控制
spotLight.angle = Math.PI / 4; // 45度光锥
spotLight.exponent = 2; // 边缘衰减（越大越锐利）
```

---

### 4. 光源层级与继承

将光源附加到网格可以实现相对位置关系：

```typescript
// 将光源作为模型的子对象
light.parent = lampModel;

// 克隆光源
const lightClone = originalLight.clone("lightClone") as PointLight;
```

---

### 5. 发光效果（GlowLayer）

GlowLayer 为自发光材质添加辉光效果：

```typescript
const glowLayer = new GlowLayer("glow", scene);
glowLayer.intensity = 0.5; // 辉光强度

// 只对特定材质生效
glowLayer.addIncludedOnlyMesh(emissiveMesh);
```

---

## 代码示例

### 完整光源设置示例

```typescript
CreateLights(): void {
  // 1. 基础环境光
  const hemiLight = new HemisphericLight(
    "hemiLight",
    new Vector3(0, 1, 0),
    this.scene
  );
  hemiLight.intensity = 0.3;

  // 2. 主光源（方向光模拟太阳）
  const sunLight = new DirectionalLight(
    "sunLight",
    new Vector3(-1, -2, -1),
    this.scene
  );
  sunLight.intensity = 0.8;

  // 3. 室内点光源
  const lamp = new PointLight(
    "lamp",
    new Vector3(0, 2, 0),
    this.scene
  );
  lamp.diffuse = new Color3(1, 0.9, 0.7); // 暖色光
  lamp.range = 10;

  // 4. 聚光灯（带阴影）
  const spotlight = new SpotLight(
    "spotlight",
    new Vector3(0, 5, 0),
    new Vector3(0, -1, 0),
    Math.PI / 4,
    2,
    this.scene
  );

  // 阴影设置
  const shadowGen = new ShadowGenerator(2048, spotlight);
  shadowGen.useBlurCloseExponentialShadowMap = true;

  // 为所有物体设置阴影
  scene.meshes.forEach(mesh => {
    mesh.receiveShadows = true;
    shadowGen.addShadowCaster(mesh);
  });
}
```

---

## 最佳实践

### 光照设计原则

1. **三点布光法**
   - 主光（Key Light）：最强，决定主要阴影
   - 补光（Fill Light）：较弱的反向光，填充阴影
   - 轮廓光（Back Light）：从后方打亮轮廓

2. **性能优化**
   - 限制动态阴影光源数量（最多 2-3 个）
   - 使用合适的阴影贴图尺寸
   - 远处物体使用烘焙光照

3. **场景层次**
   - 总是添加 HemisphericLight 作为基础照明
   - 完全黑暗的场景会让玩家困惑

### 阴影优化技巧

```typescript
// 1. 合理设置阴影范围
light.shadowMinZ = camera.minZ;
light.shadowMaxZ = camera.maxZ * 0.5;

// 2. 根据距离切换阴影质量
if (distanceToCamera > 50) {
  shadowGen.mapSize = 512;
} else {
  shadowGen.mapSize = 2048;
}

// 3. 静态物体使用烘焙阴影
// 使用 lightmapBakedShadows = true
```

---

## 常见问题

### Q1: 阴影出现锯齿怎么办？

**解决方案**：
```typescript
shadowGen.useBlurCloseExponentialShadowMap = true;
shadowGen.blurKernel = 32;
shadowGen.depthScale = 50;
```

### Q2: 光照太暗或太亮？

**解决方案**：
- 检查 intensity 设置
- 确保相机曝光设置正确
- 使用 tone mapping 进行整体调整

### Q3: 点光源阴影性能差？

**解决方案**：
- 点光源阴影需要渲染 6 个方向，性能消耗大
- 考虑用多个 SpotLight 替代
- 或使用 Light Probes 烘焙

### Q4: 如何实现昼夜循环？

**解决方案**：
```typescript
// 动态调整方向光方向和颜色
scene.registerBeforeRender(() => {
  const time = performance.now() / 1000;

  // 太阳位置变化
  sunLight.direction = new Vector3(
    Math.cos(time * 0.1),
    Math.sin(time * 0.1),
    0
  );

  // 日出日落颜色变化
  const dayColor = new Color3(1, 0.95, 0.8);
  const nightColor = new Color3(0.1, 0.1, 0.3);
  // 使用 lerp 插值...
});
```

---

## 相关资源

- [Babylon.js 官方文档 - Lights](https://doc.babylonjs.com/features/featuresDeepDive/lights/lights_introduction)
- [Babylon.js 官方文档 - Shadows](https://doc.babylonjs.com/features/featuresDeepDive/shadows/shadows_introduction)
- [光源 Playground 示例](https://playground.babylonjs.com/)

---

## 总结

| 光源类型 | 产生阴影 | 性能消耗 | 典型用途 |
|---------|---------|---------|---------|
| HemisphericLight | 否 | 低 | 环境照明 |
| DirectionalLight | 是 | 中 | 太阳光 |
| PointLight | 是 | 高 | 灯泡、火焰 |
| SpotLight | 是 | 中 | **最佳阴影质量** |

掌握光源和阴影是创建逼真 3D 场景的关键。建议从 HemisphericLight + SpotLight 组合开始，逐步添加更多光源细节。
