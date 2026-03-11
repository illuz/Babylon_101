/**
 * PBR（Physically Based Rendering，基于物理的渲染）材质示例
 *
 * PBR 是一种现代材质工作流程，模拟物体在真实环境中对光照的反应。
 * 与 Standard Material 相比，PBR 材质能够创建更加逼真的渲染效果，
 * 特别适合需要真实感的项目。
 *
 * PBR 与 Standard Material 的主要区别：
 * 1. 物理准确性：PBR 基于真实世界的物理规律，确保材质在不同光照条件下表现一致
 * 2. 能量守恒：反射和漫反射遵循能量守恒定律
 * 3. 金属度/粗糙度工作流：使用金属度和粗糙度控制材质外观
 * 4. 环境光照：PBR 材质与 HDR 环境贴图配合使用，获得更真实的光照效果
 */

import {
  Scene,
  Engine,
  FreeCamera,
  Vector3,
  HemisphericLight,
  MeshBuilder,
  CubeTexture,
  PBRMaterial,
  Texture,
  Color3,
  GlowLayer,
} from "@babylonjs/core";

export class PBR {
  scene: Scene;
  engine: Engine;

  constructor(private canvas: HTMLCanvasElement) {
    // 创建 Babylon.js 渲染引擎，启用抗锯齿
    this.engine = new Engine(this.canvas, true);
    // 初始化场景
    this.scene = this.CreateScene();

    // 创建环境中的网格对象（地面和球体）
    this.CreateEnvironment();

    // 启动渲染循环，每帧渲染场景
    this.engine.runRenderLoop(() => {
      this.scene.render();
    });
  }

  /**
   * 创建基础场景并设置环境
   *
   * 关键概念：
   * - 环境贴图（Environment Texture）：从 HDR 图像转换而来，
   *   用于提供真实的环境光照和反射效果
   * - Skybox（天空盒）：一个包围场景的立方体，显示环境贴图作为背景
   */
  CreateScene(): Scene {
    const scene = new Scene(this.engine);

    // 创建自由相机，位于场景中心偏后位置
    const camera = new FreeCamera("camera", new Vector3(0, 1, -5), this.scene);
    camera.attachControl();
    // 降低相机移动速度，方便观察
    camera.speed = 0.25;

    // 创建半球光（环境光）
    // 注意：使用 PBR 材质时，主要依靠环境贴图提供光照
    // 因此将强度设置为 0，完全依赖环境光照
    const hemiLight = new HemisphericLight(
      "hemiLight",
      new Vector3(0, 1, 0),
      this.scene
    );

    // 关闭半球光，使用环境贴图作为主要光源
    hemiLight.intensity = 0;

    // 从预过滤数据创建立方体贴图（环境贴图）
    // 这是 PBR 材质的关键组件，提供环境光照信息
    // .env 文件是从 HDR 图像通过 Babylon.js 工具转换而来
    const envTex = CubeTexture.CreateFromPrefilteredData(
      "./environment/sky.env",
      scene
    );

    // 将环境贴图应用到场景
    // PBR 材质会使用这个贴图进行光照计算
    scene.environmentTexture = envTex;

    // 创建默认天空盒，使用环境贴图作为背景
    // 第二个参数 true 表示使用 PBR 材质渲染天空盒
    scene.createDefaultSkybox(envTex, true);

    // 可选：调整整体环境光照强度
    // scene.environmentIntensity = 0.25;

    return scene;
  }

  /**
   * 创建场景中的网格对象
   */
  CreateEnvironment(): void {
    // 创建地面网格
    const ground = MeshBuilder.CreateGround(
      "ground",
      { width: 10, height: 10 },
      this.scene
    );

    // 创建球体网格，用于展示 PBR 材质效果
    const ball = MeshBuilder.CreateSphere("ball", { diameter: 1 }, this.scene);

    // 将球体放置在地面上方
    ball.position = new Vector3(0, 1, 0);

    // 应用 PBR 材质
    // 地面使用沥青材质（展示真实材质效果）
    ground.material = this.CreateAsphalt();
    // 球体使用魔法发光材质（展示自发光效果）
    ball.material = this.CreateMagic();
  }

  /**
   * 创建沥青路面 PBR 材质
   *
   * PBR 材质核心属性：
   * - albedo（反照率）：基础颜色贴图，相当于 diffuse map
   * - metallic（金属度）：0=非金属（电介质），1=金属
   * - roughness（粗糙度）：0=光滑（镜面反射），1=粗糙（漫反射）
   * - ambientOcclusion（环境光遮蔽）：模拟缝隙和角落的阴影
   *
   * 通道打包（Channel Packing）：
   * 将多个灰度贴图合并到一张 RGB 图像的不同通道中：
   * - R 通道：环境光遮蔽（AO）
   * - G 通道：粗糙度（Roughness）
   * - B 通道：金属度（Metallic）
   * 这样可以减少纹理数量，提高性能
   */
  CreateAsphalt(): PBRMaterial {
    const pbr = new PBRMaterial("pbr", this.scene);

    // 反照率贴图（基础颜色）
    // 注意：albedo 与 diffuse 的区别在于 albedo 不包含光照信息
    pbr.albedoTexture = new Texture(
      "./textures/asphalt/asphalt_diffuse.jpg",
      this.scene
    );

    // 法线贴图（凹凸效果）
    // 模拟表面细节，无需增加几何体复杂度
    pbr.bumpTexture = new Texture(
      "./textures/asphalt/asphalt_normal.jpg",
      this.scene
    );

    // 法线贴图轴向反转
    // 某些法线贴图需要反转才能正确显示
    // 可以通过观察凹凸是否"凹陷"或"凸起"来判断
    pbr.invertNormalMapX = true;
    pbr.invertNormalMapY = true;

    // 通道打包设置：从 metallicTexture 的不同通道读取对应信息
    // 使用 R 通道作为环境光遮蔽（AO）贴图
    pbr.useAmbientOcclusionFromMetallicTextureRed = true;
    // 使用 G 通道作为粗糙度贴图
    pbr.useRoughnessFromMetallicTextureGreen = true;
    // 使用 B 通道作为金属度贴图
    pbr.useMetallnessFromMetallicTextureBlue = true;

    // 金属度贴图（包含 AO、粗糙度、金属度的组合贴图）
    pbr.metallicTexture = new Texture(
      "./textures/asphalt/asphalt_ao_rough_metal.jpg",
      this.scene
    );

    // 可选：单独设置粗糙度值（与贴图叠加）
    // pbr.roughness = 1;

    return pbr;
  }

  /**
   * 创建魔法发光 PBR 材质
   *
   * 自发光（Emissive）属性：
   * - emissiveColor：自发光颜色，默认为黑色（无发光）
   * - emissiveTexture：自发光贴图，定义哪些区域发光
   * - emissiveIntensity：发光强度
   *
   * GlowLayer（发光层）：
   * 为场景添加泛光效果，使发光物体看起来更加真实
   *
   * 注意：此方法的贴图未包含在代码库中，仅作示例参考
   */
  CreateMagic(): PBRMaterial {
    // 注意：此方法的贴图未包含在代码中，仅作示例
    const pbr = new PBRMaterial("pbr", this.scene);

    // 可选：单独调整此材质的环境光照强度
    // pbr.environmentIntensity = 0.25;

    // 反照率贴图（基础颜色）
    // pbr.albedoTexture = new Texture(
    //   "./textures/magic/magic_baseColor.png",
    //   this.scene
    // );

    // 法线贴图
    // pbr.bumpTexture = new Texture(
    //   "./textures/magic/magic_normal.png",
    //   this.scene
    // );

    // 法线贴图轴向反转
    // pbr.invertNormalMapX = true;
    // pbr.invertNormalMapY = true;

    // 通道打包设置
    // pbr.useAmbientOcclusionFromMetallicTextureRed = true;
    // pbr.useRoughnessFromMetallicTextureGreen = true;
    // pbr.useMetallnessFromMetallicTextureBlue = true;

    // 金属度贴图（组合贴图）
    // pbr.metallicTexture = new Texture(
    //   "./textures/magic/magic_ao_rough_metal.png",
    //   this.scene
    // );

    // ========== 自发光设置 ==========

    // 自发光颜色：设置为白色以使用贴图原始颜色
    // 重要：默认为黑色，黑色会完全屏蔽自发光效果
    // pbr.emissiveColor = new Color3(1, 1, 1);

    // 自发光贴图：定义发光区域
    // 贴图中黑色区域不发光，其他颜色区域会发光
    // pbr.emissiveTexture = new Texture(
    //   "./textures/magic/magic_emissive.png",
    //   this.scene
    // );

    // 发光强度：调整发光效果的亮度
    // pbr.emissiveIntensity = 1;

    // ========== 泛光效果设置 ==========

    // GlowLayer：为场景添加泛光/辉光效果
    // 使发光物体看起来更加真实
    // const glowLayer = new GlowLayer("glow", this.scene);

    // 泛光强度
    // glowLayer.intensity = 1;

    // 可选：单独设置粗糙度
    // pbr.roughness = 1;

    return pbr;
  }
}