import {
  Scene,
  Engine,
  SceneLoader,
  FreeCamera,
  HemisphericLight,
  Vector3,
  CannonJSPlugin,
  MeshBuilder,
  PhysicsImpostor,
  AbstractMesh,
  StandardMaterial,
  Color3,
} from "@babylonjs/core";
import "@babylonjs/loaders";
import * as CANNON from "cannon";

/**
 * 碰撞与触发器示例类
 *
 * 本示例演示 Babylon.js 中两种不同的碰撞检测机制:
 * 1. 物理碰撞 (Physics Collision) - 基于物理引擎的碰撞检测,需要 PhysicsImpostor
 * 2. 触发器 (Trigger) - 基于网格相交的检测,不需要物理引擎
 *
 * 关键概念:
 * - PhysicsImpostor: 物理代理,为网格赋予物理属性(质量、弹性、摩擦力等)
 * - registerOnPhysicsCollide: 注册物理碰撞回调函数
 * - unregisterOnPhysicsCollide: 注销物理碰撞回调函数
 * - intersectsMesh: 检测两个网格是否相交(用于触发器)
 */
export class CollisionsTriggers {
  scene: Scene;
  engine: Engine;
  // 使用 AbstractMesh 类型存储网格引用,以便在多个方法中访问
  sphere: AbstractMesh;  // 球体网格
  box: AbstractMesh;     // 盒子网格
  ground: AbstractMesh;  // 地面网格

  constructor(private canvas: HTMLCanvasElement) {
    this.engine = new Engine(this.canvas, true);
    this.scene = this.CreateScene();
    this.CreateEnvironment();

    this.CreateImpostors();

    // 调用触发器检测方法
    this.DetectTrigger();

    this.engine.runRenderLoop(() => {
      this.scene.render();
    });
  }

  /**
   * 创建场景并启用物理引擎
   *
   * 物理引擎配置说明:
   * - 重力向量 (0, -9.81, 0): 模拟地球重力,向下 9.81 m/s^2
   * - CannonJSPlugin: 使用 Cannon.js 作为物理引擎
   */
  CreateScene(): Scene {
    const scene = new Scene(this.engine);
    new HemisphericLight("hemi", new Vector3(0, 1, 0), this.scene);
    const camera = new FreeCamera(
      "camera",
      new Vector3(0, 10, -20),
      this.scene
    );
    camera.setTarget(Vector3.Zero());
    camera.attachControl();
    camera.minZ = 0.5;

    // 启用物理引擎
    // 参数1: 重力向量 - 模拟真实世界的重力加速度
    // 参数2: 物理插件 - 使用 Cannon.js 物理引擎
    scene.enablePhysics(
      new Vector3(0, -9.81, 0),
      new CannonJSPlugin(true, 10, CANNON)
    );

    return scene;
  }

  /**
   * 异步加载环境模型
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
   * 创建物理代理 (Physics Impostors)
   *
   * 物理代理为网格赋予物理属性,使其能够参与物理模拟:
   * - mass: 质量 (0 表示静态物体,不受重力影响)
   * - restitution: 弹性系数 (0-1, 1 表示完全弹性)
   * - friction: 摩擦系数 (影响物体滑动时的阻力)
   *
   * 物理代理类型:
   * - BoxImpostor: 盒形碰撞体
   * - SphereImpostor: 球形碰撞体
   * - PlaneImpostor: 平面碰撞体
   */
  CreateImpostors(): void {
    // ========== 盒子 (已注释,可取消注释进行测试) ==========
    // this.box = MeshBuilder.CreateBox("box", { size: 2 });
    // this.box.position = new Vector3(0, 3, 0);

    // // 为盒子创建物理代理
    // // mass: 1 - 有质量,受重力影响
    // // restitution: 1 - 完全弹性碰撞
    // this.box.physicsImpostor = new PhysicsImpostor(
    //   this.box,
    //   PhysicsImpostor.BoxImpostor,
    //   { mass: 1, restitution: 1 }
    // );

    // ========== 地面 ==========
    this.ground = MeshBuilder.CreateGround("ground", {
      width: 40,
      height: 40,
    });

    // 将地面稍微抬高,避免与模型地面产生 Z-fighting 闪烁
    this.ground.position.y = 0.25;

    // 隐藏地面网格(仅用于物理碰撞,不渲染)
    this.ground.isVisible = false;

    // 为地面创建物理代理
    // mass: 0 - 静态物体,不移动,作为碰撞的静态平台
    // restitution: 1 - 完全弹性,物体会完全反弹
    this.ground.physicsImpostor = new PhysicsImpostor(
      this.ground,
      PhysicsImpostor.BoxImpostor,
      { mass: 0, restitution: 1 }
    );

    // ========== 球体 ==========
    this.sphere = MeshBuilder.CreateSphere("sphere", { diameter: 2 });
    // 设置初始位置,在空中开始
    this.sphere.position = new Vector3(0, 8, 0);

    // 为球体创建物理代理
    // mass: 1 - 有质量,受重力影响下落
    // restitution: 1 - 完全弹性
    // friction: 1 - 高摩擦力,减少滑动
    this.sphere.physicsImpostor = new PhysicsImpostor(
      this.sphere,
      PhysicsImpostor.SphereImpostor,
      { mass: 1, restitution: 1, friction: 1 }
    );

    // ========== 碰撞检测注册 (已注释示例) ==========
    // 以下代码展示了如何注册物理碰撞回调:

    // 方式1: 盒子检测与球体的碰撞
    // this.box.physicsImpostor.registerOnPhysicsCollide(
    //   this.sphere.physicsImpostor,  // 检测碰撞的目标对象
    //   this.DetectCollisions          // 碰撞时调用的回调函数
    // );

    // 方式2: 球体检测与盒子的碰撞
    // this.sphere.physicsImpostor.registerOnPhysicsCollide(
    //   this.box.physicsImpostor,
    //   this.DetectCollisions
    // );

    // 方式3: 注销碰撞回调 - 在特定条件下停止检测碰撞
    // 当球体碰到地面时,注销碰撞回调
    // this.sphere.physicsImpostor.unregisterOnPhysicsCollide(
    //   this.ground.physicsImpostor,
    //   this.DetectCollisions
    // );
  }

  /**
   * 物理碰撞回调函数
   *
   * 当注册的碰撞发生时,此函数会被自动调用
   *
   * 参数说明:
   * @param boxCol - 触发碰撞的物理代理 (collider)
   * @param colAgainst - 被碰撞的物理代理 (collided against)
   *
   * 注意事项:
   * 1. 回调函数必须是命名函数(非箭头函数),才能正确注销
   * 2. colAgainst 参数类型为 any,实际使用时需要类型转换
   * 3. 修改网格缩放后,需要调用 setScalingUpdated() 更新物理代理
   */
  DetectCollisions(boxCol: PhysicsImpostor, colAgainst: any): void {
    // 创建红色材质
    const redMat = new StandardMaterial("mat", this.scene);
    redMat.diffuseColor = new Color3(1, 0, 0);  // RGB: 红色

    // ========== 修改碰撞对象属性 (已注释示例) ==========

    // 示例1: 放大碰撞对象的缩放
    // boxCol.object.scaling = new Vector3(3, 3, 3);
    // 重要: 修改网格缩放后,必须更新物理代理的碰撞体
    // 否则碰撞体积不会随视觉缩放变化,导致穿模
    // boxCol.setScalingUpdated();

    // 示例2: 修改被碰撞对象的材质
    // colAgainst.object 是 IPhysicsEnabledObject 类型
    // 需要转换为 AbstractMesh 才能访问 material 属性
    (colAgainst.object as AbstractMesh).material = redMat;
  }

  /**
   * 触发器检测方法
   *
   * 触发器 (Trigger) 与物理碰撞的区别:
   * - 不需要物理引擎参与,纯粹基于网格相交检测
   * - 性能开销较小,适合检测进入/离开区域等逻辑
   * - 典型应用: 检测玩家进入特定区域、触发剧情等
   *
   * 实现原理:
   * 1. 创建一个半透明的"触发区域"网格
   * 2. 在每帧渲染前检测目标网格是否与触发区域相交
   * 3. 使用计数器确保触发逻辑只执行一次
   */
  DetectTrigger(): void {
    // ========== 创建触发区域 ==========
    // 触发区域是一个网格,用于检测其他物体是否进入
    const box = MeshBuilder.CreateBox("box", { width: 4, height: 1, depth: 4 });

    // 位置设置技巧: 盒子中心在几何中心
    // 如果高度为1,要让它平放在地面上,y应设为 height/2 = 0.5
    box.position.y = 0.5;

    // 设置透明度,让玩家知道这是触发区域而非实体障碍
    // visibility 范围 0-1, 0=完全透明, 1=完全不透明
    box.visibility = 0.25;

    // ========== 触发计数器 ==========
    // 用于确保触发逻辑只执行一次
    let counter = 0;

    // ========== 每帧检测 ==========
    // registerBeforeRender: 在每帧渲染前执行的回调
    // 适合用于持续检测状态变化的场景
    this.scene.registerBeforeRender(() => {
      // intersectsMesh: 检测两个网格是否相交
      // 参数: 目标网格 (this.sphere)
      // 返回: boolean - 是否相交
      if (box.intersectsMesh(this.sphere)) counter++;

      // 只在第一次进入时触发
      // counter === 1 表示刚进入触发区域
      if (counter === 1) console.log("Entered Trigger");
    });

    // ========== intersectsMesh 附加选项 ==========
    // intersectsMesh 还支持更多选项:
    // - precise: boolean - 使用精确碰撞检测(适合旋转/变形物体)
    // - includeDescendants: boolean - 是否包含子网格
    //
    // 示例: box.intersectsMesh(this.sphere, true, true)
    // 第二个参数 true = 精确检测
    // 第三个参数 true = 包含子网格
  }
}