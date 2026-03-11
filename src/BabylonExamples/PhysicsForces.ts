import {
  Scene,
  Engine,
  SceneLoader,
  FreeCamera,
  Vector3,
  MeshBuilder,
  PhysicsImpostor,
  CubeTexture,
  Mesh,
  AmmoJSPlugin,
  PBRMaterial,
  Color3,
  ActionManager,
  ExecuteCodeAction,
} from "@babylonjs/core";
import "@babylonjs/loaders";
import Ammo from "ammojs-typed";

/**
 * 物理力演示类
 *
 * 本课程讲解如何在 Babylon.js 中应用物理力（Forces）和冲量（Impulses）
 *
 * 核心概念：
 * - applyImpulse：冲量，用于模拟爆炸等瞬时力的效果，会考虑物体质量
 * - applyForce：持续力，用于模拟火箭推进等持续施加的力，也会考虑物体质量
 *
 * 与直接设置 velocity 的区别：
 * - velocity：直接设置速度，不考虑物体质量
 * - force/impulse：考虑物体质量，更符合物理规律
 */
export class PhysicsForces {
  scene: Scene;
  engine: Engine;
  camera: FreeCamera;
  cannonball: Mesh;  // 炮弹模板，用于克隆生成多个炮弹
  ground: Mesh;      // 地面网格，用于碰撞检测

  constructor(private canvas: HTMLCanvasElement) {
    this.engine = new Engine(this.canvas, true);
    this.scene = this.CreateScene();
    this.CreateEnvironment();
    this.CreatePhysics();

    // 监听鼠标点击事件
    // button === 2 表示右键点击（左键用于控制视角）
    this.scene.onPointerDown = (e) => {
      if (e.button === 2) this.ShootCannonball();
    };

    this.engine.runRenderLoop(() => {
      this.scene.render();
    });
  }

  /**
   * 创建场景和相机
   */
  CreateScene(): Scene {
    const scene = new Scene(this.engine);

    // 创建环境贴图（用于 PBR 材质的光照）
    const envTex = CubeTexture.CreateFromPrefilteredData(
      "./environment/sky.env",
      scene
    );

    envTex.gammaSpace = false;
    envTex.rotationY = Math.PI / 2;

    scene.environmentTexture = envTex;

    // 创建天空盒
    scene.createDefaultSkybox(envTex, true, 1000, 0.25);

    // 创建自由相机
    const camera = new FreeCamera("camera", new Vector3(0, 2, -10), this.scene);
    camera.attachControl();
    camera.minZ = 0.5;

    this.camera = camera;

    return scene;
  }

  /**
   * 初始化物理系统
   *
   * 使用 Ammo.js 作为物理引擎（与 Cannon.js 类似但功能更强大）
   */
  async CreatePhysics(): Promise<void> {
    // 异步加载 Ammo.js 物理引擎
    const ammo = await Ammo();
    const physics = new AmmoJSPlugin(true, ammo);

    // 启用物理模拟，设置重力为 -9.81（模拟地球重力）
    this.scene.enablePhysics(new Vector3(0, -9.81, 0), physics);

    // 创建物理碰撞器
    this.CreateImpostors();
    // 创建冲量演示（点击盒子模拟爆炸效果）
    this.CreateImpulse();
    // 创建炮弹模板
    this.CreateCannonball();
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
   * 创建物理碰撞器（地面）
   *
   * PhysicsImpostor 是 Babylon.js 中用于物理模拟的组件
   * - mass: 0 表示静态物体（不受重力影响）
   * - restitution: 弹性系数（1 = 完全弹性碰撞）
   */
  CreateImpostors(): void {
    const ground = MeshBuilder.CreateGround("ground", {
      width: 40,
      height: 40,
    });

    ground.isVisible = false;  // 隐藏地面网格（使用模型中的地面）

    ground.physicsImpostor = new PhysicsImpostor(
      ground,
      PhysicsImpostor.BoxImpostor,
      { mass: 0, restitution: 1 }  // mass: 0 = 静态物体
    );

    this.ground = ground;
  }

  /**
   * 创建冲量演示
   *
   * 冲量（Impulse）用于模拟瞬时力，如爆炸效果
   *
   * applyImpulse 参数：
   * @param force - 力的方向和大小（Vector3）
   * @param contactPoint - 力的作用点（世界坐标）
   *
   * 力的作用点很重要：
   * - 作用在物体质心：产生直线运动
   * - 作用在物体边缘：产生旋转效果
   */
  CreateImpulse(): void {
    // 创建一个高盒子（便于观察旋转效果）
    const box = MeshBuilder.CreateBox("box", { height: 4 });
    const boxMat = new PBRMaterial("boxMat", this.scene);
    boxMat.roughness = 1;

    box.position.y = 3;

    boxMat.albedoColor = new Color3(1, 0.5, 0);  // 橙色
    box.material = boxMat;

    // 添加物理碰撞器
    // mass: 0.5 - 较轻的物体，更容易被推动
    // friction: 1 - 高摩擦力，防止滑动
    box.physicsImpostor = new PhysicsImpostor(
      box,
      PhysicsImpostor.BoxImpostor,
      { mass: 0.5, friction: 1 }
    );

    // 添加点击交互
    box.actionManager = new ActionManager(this.scene);

    // 当点击盒子时，应用冲量
    box.actionManager.registerAction(
      new ExecuteCodeAction(ActionManager.OnPickDownTrigger, () => {
        // applyImpulse(力的方向, 力的作用点)
        // 力的方向: (-3, 0, 0) - 向左推（模拟右侧爆炸）
        // 作用点: 盒子中心位置向上偏移 2 个单位（打击盒子上部，产生倾倒效果）
        box.physicsImpostor.applyImpulse(
          new Vector3(-3, 0, 0),
          box.getAbsolutePosition().add(new Vector3(0, 2, 0))
        );
      })
    );
  }

  /**
   * 创建炮弹模板
   *
   * 这个炮弹作为模板，每次发射时克隆一个新的实例
   * 模板本身被禁用，不会出现在场景中
   */
  CreateCannonball(): void {
    this.cannonball = MeshBuilder.CreateSphere("cannonball", { diameter: 0.5 });
    const ballMat = new PBRMaterial("ballMat", this.scene);
    ballMat.roughness = 1;
    ballMat.albedoColor = new Color3(0, 1, 0);  // 绿色

    this.cannonball.material = ballMat;

    // 添加物理碰撞器
    this.cannonball.physicsImpostor = new PhysicsImpostor(
      this.cannonball,
      PhysicsImpostor.SphereImpostor,
      { mass: 1, friction: 1 }
    );

    // 将炮弹位置设置在相机位置
    this.cannonball.position = this.camera.position;
    // 禁用模板（克隆的实例会被启用）
    this.cannonball.setEnabled(false);
  }

  /**
   * 发射炮弹
   *
   * 使用 applyForce 方法施加持续力
   *
   * applyForce 与 applyImpulse 的区别：
   * - applyImpulse：瞬时冲量，适合爆炸等一次性效果
   * - applyForce：持续力，适合火箭推进等持续效果
   *
   * 但在实际使用中，两者效果相似，主要区别在于力的作用方式
   */
  ShootCannonball(): void {
    // 克隆炮弹模板
    const clone = this.cannonball.clone("clone");
    clone.position = this.camera.position;

    // 启用克隆的炮弹
    clone.setEnabled(true);

    // applyForce(力的方向和大小, 力的作用点)
    // getForwardRay().direction - 获取相机的前进方向
    // scale(1000) - 放大力的强度
    // 力的作用点在炮弹中心
    clone.physicsImpostor.applyForce(
      this.camera.getForwardRay().direction.scale(1000),
      clone.getAbsolutePosition()
    );

    // 注册碰撞事件：当炮弹碰到地面时，3 秒后销毁
    // 这样可以防止场景中积累太多炮弹影响性能
    clone.physicsImpostor.registerOnPhysicsCollide(
      this.ground.physicsImpostor,
      () => {
        setTimeout(() => {
          clone.dispose();  // 销毁炮弹
        }, 3000);
      }
    );
  }
}
