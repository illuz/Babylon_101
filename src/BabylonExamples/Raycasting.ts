import {
  Scene,
  Engine,
  SceneLoader,
  FreeCamera,
  Vector3,
  MeshBuilder,
  PhysicsImpostor,
  CubeTexture,
  AmmoJSPlugin,
  PBRMaterial,
  Color3,
  Texture,
  Matrix,
} from "@babylonjs/core";
import "@babylonjs/loaders";
import Ammo from "ammojs-typed";

/**
 * Raycasting（射线检测）示例类
 *
 * 射线检测是一种创建不可见线条来检测其他对象的技术。
 * 常用于：
 * - 第一人称射击游戏中的命中检测（hitscan weapons）
 * - 检测到其他对象的距离
 * - 鼠标点击场景中的对象
 *
 * 本示例模拟了射击彩弹到球体上的效果：
 * - 动态在命中点放置贴花（decal）
 * - 对被击中的对象施加物理冲量
 */
export class Raycasting {
  scene: Scene;
  engine: Engine;
  camera: FreeCamera;
  // 存储三种不同颜色的贴花材质，用于随机选择
  splatters: PBRMaterial[];

  constructor(private canvas: HTMLCanvasElement) {
    this.engine = new Engine(this.canvas, true);
    this.scene = this.CreateScene();
    this.CreateEnvironment();
    // 创建贴花纹理材质
    this.CreateTextures();

    // 设置射线检测（必须在场景创建后调用）
    this.CreatePickingRay();

    // 初始化物理系统
    this.CreatePhysics();

    this.engine.runRenderLoop(() => {
      this.scene.render();
    });
  }

  /**
   * 创建基础场景
   * 包含环境贴图和天空盒
   */
  CreateScene(): Scene {
    const scene = new Scene(this.engine);

    // 创建预过滤的环境贴图
    const envTex = CubeTexture.CreateFromPrefilteredData(
      "./environment/sky.env",
      scene
    );

    envTex.gammaSpace = false;

    // 旋转环境贴图
    envTex.rotationY = Math.PI / 2;

    scene.environmentTexture = envTex;

    // 创建默认天空盒（参数：环境贴图、是否创建天空盒、尺寸、模糊程度）
    scene.createDefaultSkybox(envTex, true, 1000, 0.25);

    // 创建自由摄像机
    const camera = new FreeCamera("camera", new Vector3(0, 2, -10), this.scene);
    camera.attachControl();
    camera.minZ = 0.5;

    this.camera = camera;

    return scene;
  }

  /**
   * 初始化物理引擎
   * 使用 Ammo.js 作为物理引擎
   */
  async CreatePhysics(): Promise<void> {
    const ammo = await Ammo();
    const physics = new AmmoJSPlugin(true, ammo);
    // 启用物理，设置重力为 -9.81（模拟真实重力）
    this.scene.enablePhysics(new Vector3(0, -9.81, 0), physics);

    this.CreateImpostors();
  }

  /**
   * 加载环境模型
   */
  async CreateEnvironment(): Promise<void> {
    await SceneLoader.ImportMeshAsync(
      "",
      "./models/",
      "Prototype_Level.glb",
      this.scene
    );
  }

  /**
   * 创建物理碰撞体
   * - 地面：静态碰撞体（mass: 0）
   * - 球体：动态碰撞体，用于射线检测演示
   */
  CreateImpostors(): void {
    // 创建地面
    const ground = MeshBuilder.CreateGround("ground", {
      width: 40,
      height: 40,
    });

    ground.isVisible = false;

    // 地面物理碰撞体
    // mass: 0 表示静态物体（不受重力影响）
    // friction: 10 摩擦系数，值越大越难滑动
    ground.physicsImpostor = new PhysicsImpostor(
      ground,
      PhysicsImpostor.BoxImpostor,
      { mass: 0, friction: 10 }
    );

    // 创建球体 - 射线检测的目标对象
    const sphere = MeshBuilder.CreateSphere("sphere", { diameter: 3 });
    const sphereMat = new PBRMaterial("sphereMat", this.scene);
    sphereMat.roughness = 1;

    sphere.position.y = 3;

    sphereMat.albedoColor = new Color3(1, 0.5, 0);
    sphere.material = sphereMat;

    // 球体物理碰撞体
    // mass: 20 质量
    // friction: 1 摩擦系数
    sphere.physicsImpostor = new PhysicsImpostor(
      sphere,
      PhysicsImpostor.SphereImpostor,
      { mass: 20, friction: 1 }
    );
  }

  /**
   * 创建贴花纹理材质
   *
   * 贴花（Decal）是一种可以在运行时动态放置在网格表面的纹理。
   * 常用于：弹孔、血迹、脚印等效果。
   *
   * 注意事项：
   * - 需要设置 albedoTexture.hasAlpha = true 以支持透明度
   * - 需要设置 zOffset 避免Z-fighting（纹理闪烁）问题
   */
  CreateTextures(): void {
    // 创建三种颜色的 PBR 材质
    const blue = new PBRMaterial("blue", this.scene);
    const orange = new PBRMaterial("orange", this.scene);
    const green = new PBRMaterial("green", this.scene);

    // 设置粗糙度为 1（完全不光滑）
    blue.roughness = 1;
    orange.roughness = 1;
    green.roughness = 1;

    // 加载贴花纹理
    blue.albedoTexture = new Texture("./textures/blue.png", this.scene);
    green.albedoTexture = new Texture("./textures/green.png", this.scene);
    orange.albedoTexture = new Texture("./textures/orange.png", this.scene);

    // 启用纹理的 Alpha 通道，支持透明度
    // 这样贴花只有彩色部分可见，背景透明
    blue.albedoTexture.hasAlpha = true;
    orange.albedoTexture.hasAlpha = true;
    green.albedoTexture.hasAlpha = true;

    // Z偏移量：解决 Z-fighting 问题
    // Z-fighting：当两个面非常接近时，GPU 无法确定渲染哪个，导致闪烁
    // 负值会将贴花稍微"推向"摄像机，避免与球体表面重叠
    blue.zOffset = -0.25;
    orange.zOffset = -0.25;
    green.zOffset = -0.25;

    // 将材质存入数组，方便随机选择
    this.splatters = [blue, orange, green];
  }

  /**
   * 创建射线检测
   *
   * 射线（Ray）的三个关键属性：
   * 1. Origin（原点）：射线起始位置
   * 2. Direction（方向）：射线指向的方向
   * 3. Length（长度）：射线延伸的距离
   *
   * 在本示例中：
   * - 原点：摄像机位置
   * - 方向：从摄像机指向鼠标点击位置
   * - 长度：到点击点的距离
   */
  CreatePickingRay(): void {
    // 当鼠标按下时触发
    // onPointerDown 会在任何鼠标按键按下时触发
    this.scene.onPointerDown = () => {
      // 创建拾取射线
      // 参数：
      // - pointerX/Y: 鼠标在屏幕上的坐标
      // - Matrix.Identity(): 变换矩阵（使用单位矩阵）
      // - camera: 用于计算射线的摄像机
      const ray = this.scene.createPickingRay(
        this.scene.pointerX,
        this.scene.pointerY,
        Matrix.Identity(),
        this.camera
      );

      // 使用射线进行场景拾取
      // 返回射线碰撞结果（PickingInfo）
      // 包含：是否命中、命中的网格、命中点坐标、命中面法线等信息
      const raycastHit = this.scene.pickWithRay(ray);

      // 检查是否命中了名为 "sphere" 的网格
      // raycastHit.hit: 布尔值，表示射线是否命中任何物体
      // raycastHit.pickedMesh: 被命中的网格对象
      if (raycastHit.hit && raycastHit.pickedMesh.name === "sphere") {
        // 创建贴花
        // 参数：
        // - name: 贴花名称
        // - sourceMesh: 要放置贴花的目标网格
        // - options: 配置对象
        const decal = MeshBuilder.CreateDecal("decal", raycastHit.pickedMesh, {
          // 命中点坐标：射线与网格相交的精确位置
          position: raycastHit.pickedPoint,
          // 命中面的法线方向：确保贴花正确对齐到表面
          // 参数 true 表示使用世界坐标系的法线
          normal: raycastHit.getNormal(true),
          // 贴花尺寸
          size: new Vector3(1, 1, 1),
        });

        // 随机选择一种颜色材质
        // Math.random() 返回 [0, 1) 的随机数
        // Math.floor() 向下取整
        decal.material =
          this.splatters[Math.floor(Math.random() * this.splatters.length)];

        // 将贴花设置为球体的子对象
        // 这样当球体移动时，贴花会跟随移动
        // 使用 setParent 而不是直接赋值 parent，可以保持贴花的相对位置不变
        decal.setParent(raycastHit.pickedMesh);

        // 对球体施加冲量（瞬间力）
        // applyImpulse(force, contactPoint)
        // - force: 力的方向和大小（使用射线方向并缩放5倍）
        // - contactPoint: 施力点（命中点）
        // 冲量与力的区别：
        // - applyImpulse: 瞬间力，立即改变速度
        // - applyForce: 持续力，需要每帧应用
        raycastHit.pickedMesh.physicsImpostor.applyImpulse(
          ray.direction.scale(5),
          raycastHit.pickedPoint
        );
      }
    };
  }
}