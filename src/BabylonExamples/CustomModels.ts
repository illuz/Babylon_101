/**
 * CustomModels - 自定义模型导入示例
 *
 * 本课程介绍如何在 Babylon.js 中导入自定义 3D 模型
 *
 * 核心知识点：
 * 1. SceneLoader - 用于导入外部 3D 模型文件
 * 2. 支持的模型格式：GLB、GLTF、OBJ 等
 * 3. 异步加载模型 (ImportMeshAsync) vs 回调方式 (ImportMesh)
 * 4. 模型的 Root Mesh 概念 - 用于统一控制整个模型的变换
 * 5. Blender 导出设置 - 坐标系统转换 (Y-up)
 */
import {
  Scene,
  Engine,
  FreeCamera,
  Vector3,
  MeshBuilder,
  CubeTexture,
  Texture,
  PBRMaterial,
  SceneLoader, // 场景加载器 - 用于导入外部 3D 模型
} from "@babylonjs/core";
// 必须导入 loaders 包才能加载自定义模型
// 支持格式：GLB、GLTF、OBJ、STL 等
import "@babylonjs/loaders";

export class CustomModels {
  scene: Scene;
  engine: Engine;

  constructor(private canvas: HTMLCanvasElement) {
    // 创建 Babylon 引擎
    this.engine = new Engine(this.canvas, true);
    this.scene = this.CreateScene();

    // 注释掉地面和木桶，只加载篝火场景
    //this.CreateGround();
    //this.CreateBarrel();
    this.CreateCampfire();

    // 启动渲染循环
    this.engine.runRenderLoop(() => {
      this.scene.render();
    });
  }

  /**
   * 创建场景 - 设置相机和环境光照
   *
   * 环境光照 (Environment Lighting) 对 PBR 材质非常重要
   * 模型会根据环境贴图反射光线，产生真实感
   */
  CreateScene(): Scene {
    const scene = new Scene(this.engine);

    // 创建自由相机，位置在 (0, 0.75, -8)
    // 注意：Babylon 使用左手坐标系，Y轴向上
    const camera = new FreeCamera(
      "camera",
      new Vector3(0, 0.75, -8),
      this.scene
    );
    camera.attachControl();
    camera.speed = 0.25; // 相机移动速度

    // 创建预过滤的环境贴图
    // 环境贴图用于 IBL (Image-Based Lighting) 光照
    const envTex = CubeTexture.CreateFromPrefilteredData(
      "./environment/sky.env",
      scene
    );

    // 设置场景的环境贴图
    scene.environmentTexture = envTex;

    // 创建默认天空盒，使环境可见
    scene.createDefaultSkybox(envTex, true);

    // 环境光照强度（0.5 比较柔和，1.0 更明亮）
    scene.environmentIntensity = 0.5;

    return scene;
  }

  /**
   * 创建地面 - 为模型提供基础平面
   */
  CreateGround(): void {
    const ground = MeshBuilder.CreateGround(
      "ground",
      { width: 10, height: 10 },
      this.scene
    );

    // 应用沥青材质
    ground.material = this.CreateAsphalt();
  }

  /**
   * 创建沥青 PBR 材质
   *
   * PBR 材质需要的贴图：
   * - albedo (漫反射/基础颜色)
   * - normal (法线贴图 - 增加表面细节)
   * - metallic/roughness/AO (ORM 贴图 - 金属度、粗糙度、环境光遮蔽)
   */
  CreateAsphalt(): PBRMaterial {
    const pbr = new PBRMaterial("pbr", this.scene);

    // 基础颜色贴图（漫反射）
    pbr.albedoTexture = new Texture(
      "./textures/asphalt/asphalt_diffuse.jpg",
      this.scene
    );

    // 法线贴图 - 模拟表面凹凸细节
    pbr.bumpTexture = new Texture(
      "./textures/asphalt/asphalt_normal.jpg",
      this.scene
    );

    // 法线贴图坐标反转（根据贴图格式可能需要调整）
    pbr.invertNormalMapX = true;
    pbr.invertNormalMapY = true;

    // ORM 贴图通道设置：
    // R 通道 = 环境光遮蔽 (Ambient Occlusion)
    // G 通道 = 粗糙度 (Roughness)
    // B 通道 = 金属度 (Metalness)
    pbr.useAmbientOcclusionFromMetallicTextureRed = true;
    pbr.useRoughnessFromMetallicTextureGreen = true;
    pbr.useMetallnessFromMetallicTextureBlue = true;

    // ORM 贴图
    pbr.metallicTexture = new Texture(
      "./textures/asphalt/asphalt_ao_rough_metal.jpg",
      this.scene
    );

    return pbr;
  }

  /**
   * 加载木桶模型 - 展示两种加载方式
   *
   * 方式一：SceneLoader.ImportMesh (回调方式)
   * 方式二：SceneLoader.ImportMeshAsync (异步/Promise 方式)
   *
   * 参数说明：
   * - meshNames: 要加载的网格名称，空字符串 "" 表示加载所有
   * - rootUrl: 模型文件所在目录路径（以 / 结尾）
   * - sceneFilename: 模型文件名
   * - scene: 目标场景（异步版本可省略）
   *
   * 返回值：
   * - meshes: 网格数组，meshes[0] 是根节点 (__root__)
   * - meshes[1+] 是实际的网格对象
   */
  async CreateBarrel(): Promise<void> {
    // ========== 方式一：回调方式 ==========
    // SceneLoader.ImportMesh(
    //   "",              // meshNames: 空字符串 = 加载所有网格
    //   "./models/",     // rootUrl: 模型目录
    //   "barrel.glb",    // sceneFilename: GLB 格式模型文件
    //   this.scene,      // scene: 目标场景
    //   (meshes) => {    // onSuccess: 加载成功回调
    //     console.log("meshes", meshes);
    //   }
    // );

    // ========== 方式二：异步方式（推荐）==========
    // 使用解构直接获取 meshes
    const { meshes } = await SceneLoader.ImportMeshAsync(
      "",              // meshNames: 空字符串加载所有网格
      "./models/",     // rootUrl: 模型文件目录
      "barrel.glb"     // sceneFilename: GLB 二进制格式
    );

    // meshes 数组说明：
    // [0] = __root__ (根节点，用于统一变换整个模型)
    // [1] = 实际的网格对象（如 barrel_01）
    console.log("meshes", meshes);
  }

  /**
   * 加载篝火场景 - 复杂多网格模型示例
   *
   * 这个场景包含多个网格对象：
   * - 木柴、石头、帐篷等
   *
   * 关键概念：Root Mesh
   * - meshes[0] 是 __root__ 节点
   * - 可以通过 root mesh 统一控制位置、旋转、缩放
   * - 例如：models.meshes[0].position = new Vector3(-15, 0, 0)
   */
  async CreateCampfire(): Promise<void> {
    // 异步加载篝火场景
    const models = await SceneLoader.ImportMeshAsync(
      "",              // 加载所有网格
      "./models/",     // 模型目录
      "campfire.glb"   // GLB 文件（包含多个网格）
    );

    // 通过 root mesh 可以移动整个场景
    // models.meshes[0].position = new Vector3(-15, 0, 0);

    // 输出加载的模型信息
    // 包含：meshes, particleSystems, skeletons, animationGroups 等
    console.log("models", models);
  }
}