/**
 * Babylon.js 光源与阴影示例
 *
 * 本课程涵盖 Babylon.js 中的四种光源类型：
 * 1. HemisphericLight（半球光）- 模拟环境光，从天空到地面的渐变
 * 2. DirectionalLight（方向光）- 平行光，如太阳光
 * 3. PointLight（点光源）- 从一点向所有方向发散的光
 * 4. SpotLight（聚光灯）- 锥形光束，可产生阴影
 *
 * 同时演示阴影生成系统（ShadowGenerator）
 */

import {
  Scene,
  Engine,
  FreeCamera,
  Vector3,
  HemisphericLight,
  MeshBuilder,
  SceneLoader,
  AbstractMesh,
  GlowLayer,
  LightGizmo,
  GizmoManager,
  Light,
  Color3,
  DirectionalLight,
  PointLight,
  SpotLight,
  ShadowGenerator,
} from "@babylonjs/core";
import "@babylonjs/loaders";

export class LightsShadows {
  scene: Scene;
  engine: Engine;
  lightTubes!: AbstractMesh[]; // 灯管模型数组，用于作为光源的父对象
  models!: AbstractMesh[];     // 场景中导入的所有模型
  ball!: AbstractMesh;         // 用于演示阴影的球体

  constructor(private canvas: HTMLCanvasElement) {
    this.engine = new Engine(this.canvas, true);
    this.scene = this.CreateScene();
    this.CreateEnvironment();

    // 启动渲染循环
    this.engine.runRenderLoop(() => {
      this.scene.render();
    });
  }

  /**
   * 创建基础场景和相机
   * @returns Scene - Babylon.js 场景对象
   */
  CreateScene(): Scene {
    const scene = new Scene(this.engine);

    // 创建自由相机，位置在 (0, 1, -4)
    const camera = new FreeCamera("camera", new Vector3(0, 1, -4), this.scene);
    camera.attachControl(); // 将相机控制附加到画布
    camera.speed = 0.2;     // 设置相机移动速度

    return scene;
  }

  /**
   * 创建环境 - 加载3D模型并设置光照
   * 使用 GLB 格式的场景文件（从 Blender 导出）
   */
  async CreateEnvironment(): Promise<void> {
    // 异步加载 GLB 模型文件
    const { meshes } = await SceneLoader.ImportMeshAsync(
      "",             // 模型名称前缀（空字符串表示不添加前缀）
      "./models/",    // 模型目录
      "LightingScene.glb" // 模型文件名
    );

    this.models = meshes;

    // 筛选出灯管模型，用于作为点光源的父对象
    // 这样点光源会跟随灯管位置移动
    this.lightTubes = meshes.filter(
      (mesh) =>
        mesh.name === "lightTube_left" || mesh.name === "lightTube_right"
    );

    // 创建一个球体用于演示阴影投射
    this.ball = MeshBuilder.CreateSphere("ball", { diameter: 0.5 }, this.scene);
    this.ball.position = new Vector3(0, 1, -1);

    // 创建发光层，为场景添加辉光效果
    // GlowLayer 会让自发光材质产生辉光
    const glowLayer = new GlowLayer("glowLayer", this.scene);
    glowLayer.intensity = 0.75; // 辉光强度

    this.CreateLights();
  }

  /**
   * 创建各种类型的光源
   *
   * Babylon.js 支持四种主要光源类型：
   *
   * 1. HemisphericLight（半球光）
   *    - 模拟天空环境光
   *    - 有三个颜色属性：diffuse（天空色）、groundColor（地面色）、specular（高光色）
   *    - 适合作为场景的基础照明
   *
   * 2. DirectionalLight（方向光）
   *    - 平行光，所有光线方向一致
   *    - 适合模拟太阳光
   *    - 可以产生阴影
   *
   * 3. PointLight（点光源）
   *    - 从一点向所有方向发散
   *    - 有衰减范围（range）属性
   *    - 适合模拟灯泡、火焰等
   *
   * 4. SpotLight（聚光灯）
   *    - 锥形光束，有方向和角度
   *    - 最适合产生高质量阴影
   *    - 参数：位置、方向、角度（弧度）、指数（边缘柔和度）
   */
  CreateLights(): void {
    // ============ 半球光示例（已注释）============
    // HemisphericLight 模拟从天空到地面的环境光
    // 第一个参数是方向向量，指向天空的方向
    // const hemiLight = new HemisphericLight(
    //   "hemiLight",
    //   new Vector3(0, 1, 0), // 方向向上
    //   this.scene
    // );

    // 光源颜色属性：
    // hemiLight.diffuse = new Color3(1, 0, 0);      // 天空色（漫反射）- 红色
    // hemiLight.groundColor = new Color3(0, 0, 1);  // 地面色 - 蓝色
    // hemiLight.specular = new Color3(0, 1, 0);     // 高光色 - 绿色

    // ============ 方向光示例（已注释）============
    // DirectionalLight 是平行光，所有光线方向相同
    // 适合模拟太阳光等远距离光源
    // const directionalLight = new DirectionalLight(
    //   "directionalLight",
    //   new Vector3(0, -1, 0), // 光线方向向下
    //   this.scene
    // );

    // ============ 点光源 ============
    // PointLight 从一个点向所有方向发射光线
    // 适合模拟灯泡、蜡烛等光源
    const pointLight = new PointLight(
      "pointLight",
      new Vector3(0, 1, 0), // 光源位置
      this.scene
    );

    // 设置点光源颜色（青色调）
    // Color3 的值范围是 0-1，这里用 RGB 分数表示
    pointLight.diffuse = new Color3(172 / 255, 246 / 255, 250 / 255);
    pointLight.intensity = 0.25; // 光照强度

    // 克隆点光源，创建第二个相同的点光源
    const pointClone = pointLight.clone("pointClone") as PointLight;

    // 将点光源附加到灯管模型上
    // 这样光源会跟随灯管位置
    pointLight.parent = this.lightTubes[0];
    pointClone.parent = this.lightTubes[1];

    // ============ 聚光灯与阴影 ============
    // SpotLight 是锥形光束，最适合产生阴影
    // 参数说明：
    // - position: 光源位置
    // - direction: 光线方向
    // - angle: 光锥角度（弧度），Math.PI/2 = 90度
    // - exponent: 边缘衰减指数，值越大边缘越锐利
    const spotLight = new SpotLight(
      "spotLight",
      new Vector3(0, 0.5, -3),   // 位置
      new Vector3(0, 1, 3),      // 方向（指向前方和上方）
      Math.PI / 2,               // 光锥角度：90度
      10,                        // 边缘衰减指数
      this.scene
    );

    spotLight.intensity = 100; // 聚光灯强度较高

    // ============ 阴影相关设置 ============
    // 启用阴影渲染
    spotLight.shadowEnabled = true;
    // 阴影的最小/最大深度范围
    // 只有在这个范围内的物体才会产生/接收阴影
    spotLight.shadowMinZ = 1;
    spotLight.shadowMaxZ = 10;

    // ============ 阴影生成器 ============
    // ShadowGenerator 用于生成动态阴影
    // 参数：mapSize（阴影贴图尺寸，越大越清晰但越耗性能）
    const shadowGen = new ShadowGenerator(2048, spotLight);

    // 使用模糊的指数阴影贴图
    // useBlurCloseExponentialShadowMap 提供柔和的阴影边缘
    // 其他选项：
    // - usePoissonSampling: 泊松采样，质量较低但速度快
    // - useExponentialShadowMap: 指数阴影贴图
    // - useBlurExponentialShadowMap: 模糊指数阴影贴图
    shadowGen.useBlurCloseExponentialShadowMap = true;

    // ============ 阴影投射和接收 ============
    // receiveShadows = true: 该物体可以接收其他物体的阴影
    this.ball.receiveShadows = true;
    // addShadowCaster: 将该物体添加为阴影投射者
    shadowGen.addShadowCaster(this.ball);

    // 为所有导入的模型设置阴影
    this.models.map((mesh) => {
      mesh.receiveShadows = true;     // 可以接收阴影
      shadowGen.addShadowCaster(mesh); // 可以投射阴影
    });

    // 创建光源可视化控制器
    this.CreateGizmos(spotLight);
  }

  /**
   * 创建光源可视化工具（Gizmo）
   * Gizmo 是可视化的控制器，可以在场景中拖拽调整光源位置和旋转
   *
   * @param customLight - 要添加控制器的光源
   */
  CreateGizmos(customLight: Light): void {
    // LightGizmo 为光源创建可视化表示
    const lightGizmo = new LightGizmo();
    lightGizmo.scaleRatio = 2;      // 缩放比例
    lightGizmo.light = customLight; // 关联的光源

    // GizmoManager 管理所有的 Gizmo 控制器
    const gizmoManager = new GizmoManager(this.scene);
    gizmoManager.positionGizmoEnabled = true;  // 启用位置控制器
    gizmoManager.rotationGizmoEnabled = true;  // 启用旋转控制器
    gizmoManager.usePointerToAttachGizmos = false; // 不使用点击选择
    gizmoManager.attachToMesh(lightGizmo.attachedMesh); // 附加到光源的网格
  }
}
