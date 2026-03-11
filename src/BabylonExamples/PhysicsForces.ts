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
 * PhysicsForces 类 - 演示 Babylon.js 中物理力的应用
 *
 * 本教程涵盖两个核心概念：
 * 1. applyImpulse - 冲量：用于快速爆发的力（如爆炸）
 * 2. applyForce - 持续力：用于持续施加的力（如火箭推进）
 *
 * 关键区别：
 * - 冲量和力都会考虑物体的质量（mass）
 * - 与直接设置速度不同，速度不受质量影响
 */
export class PhysicsForces {
  scene: Scene;
  engine: Engine;
  camera: FreeCamera;

  // 炮弹模板 - 用于克隆生成新的炮弹
  cannonball: Mesh;

  // 地面对象 - 用于碰撞检测
  ground: Mesh;

  constructor(private canvas: HTMLCanvasElement) {
    this.engine = new Engine(this.canvas, true);
    this.scene = this.CreateScene();
    this.CreateEnvironment();

    // 初始化物理系统
    this.CreatePhysics();

    // 监听鼠标点击事件
    // 右键点击发射炮弹
    this.scene.onPointerDown = (e) => {
      // button === 2 表示右键点击
      // 0 = 左键, 1 = 中键, 2 = 右键
      if (e.button === 2) this.ShootCannonball();
    };

    this.engine.runRenderLoop(() => {
      this.scene.render();
    });
  }

  CreateScene(): Scene {
    const scene = new Scene(this.engine);

    // 创建环境贴图用于 PBR 材质的光照
    const envTex = CubeTexture.CreateFromPrefilteredData(
      "./environment/sky.env",
      scene
    );

    envTex.gammaSpace = false;

    // 旋转环境贴图
    envTex.rotationY = Math.PI / 2;

    scene.environmentTexture = envTex;

    // 创建天空盒
    scene.createDefaultSkybox(envTex, true, 1000, 0.25);

    // 创建自由相机并设置位置
    // y=2 高度, z=-10 后退
    const camera = new FreeCamera("camera", new Vector3(0, 2, -10), this.scene);
    camera.attachControl();
    camera.minZ = 0.5;

    this.camera = camera;

    return scene;
  }

  /**
   * 初始化物理系统
   * 使用 Ammo.js 作为物理引擎
   *
   * Ammo.js 设置步骤：
   * 1. 异步加载 Ammo.js
   * 2. 创建 AmmoJSPlugin 插件
   * 3. 启用物理模拟，设置重力
   */
  async CreatePhysics(): Promise<void> {
    // 异步加载 Ammo.js 物理引擎
    const ammo = await Ammo();

    // 创建 Ammo.js 物理插件
    const physics = new AmmoJSPlugin(true, ammo);

    // 启用物理模拟
    // 参数1: 重力向量 (0, -9.81, 0) 模拟地球重力
    this.scene.enablePhysics(new Vector3(0, -9.81, 0), physics);

    // 初始化各个演示组件
    this.CreateImpostors();
    this.CreateImpulse();
    this.CreateCannonball();
  }

  async CreateEnvironment(): Promise<void> {
    // 加载场景模型
    await SceneLoader.ImportMeshAsync(
      "",
      "./models/",
      "Prototype_Level.glb",
      this.scene
    );
  }

  /**
   * 创建基础的物理碰撞体
   * 包括不可见的地面
   */
  CreateImpostors(): void {
    // 创建地面的物理碰撞体
    const ground = MeshBuilder.CreateGround("ground", {
      width: 40,
      height: 40,
    });

    // 隐藏地面网格（使用模型中的地面）
    ground.isVisible = false;

    // 创建静态物理体
    // mass: 0 表示静态物体，不受重力影响
    // restitution: 1 表示完全弹性碰撞
    ground.physicsImpostor = new PhysicsImpostor(
      ground,
      PhysicsImpostor.BoxImpostor,
      { mass: 0, restitution: 1 }
    );

    this.ground = ground;
  }

  /**
   * 创建冲量演示 - 模拟爆炸效果
   *
   * applyImpulse(impulse, contactPoint)
   * - impulse: Vector3 冲量向量，表示力的方向和大小
   * - contactPoint: Vector3 力的作用点（世界坐标）
   *
   * 冲量特点：
   * - 瞬时作用，模拟突然的力（如爆炸、碰撞）
   * - 受物体质量影响，质量越大，效果越小
   * - 单位：牛顿·秒 (N·s)
   */
  CreateImpulse(): void {
    // 创建一个高盒子作为目标物体
    const box = MeshBuilder.CreateBox("box", { height: 4 });

    // 创建 PBR 材质
    const boxMat = new PBRMaterial("boxMat", this.scene);
    boxMat.roughness = 1; // 设置粗糙度，1 表示完全粗糙

    // 设置盒子位置
    box.position.y = 3;

    // 设置橙色
    boxMat.albedoColor = new Color3(1, 0.5, 0);
    box.material = boxMat;

    // 创建物理碰撞体
    // mass: 0.5 - 质量较轻，便于观察冲量效果
    // friction: 1 - 高摩擦力，防止滑动
    box.physicsImpostor = new PhysicsImpostor(
      box,
      PhysicsImpostor.BoxImpostor,
      { mass: 0.5, friction: 1 }
    );

    // 使用 ActionManager 添加点击交互
    // 当左键点击盒子时，模拟爆炸力将其推开
    box.actionManager = new ActionManager(this.scene);

    // 注册点击触发器 - OnPickDownTrigger 在鼠标按下时触发
    box.actionManager.registerAction(
      new ExecuteCodeAction(ActionManager.OnPickDownTrigger, () => {
        /**
         * applyImpulse 参数详解：
         *
         * 参数1 - impulse (冲量向量):
         *   new Vector3(-3, 0, 0)
         *   - x: -3 表示向左（负X方向）施加力
         *   - y: 0 表示垂直方向无力
         *   - z: 0 表示前后方向无力
         *   这模拟了从右侧爆炸将物体推向左边
         *
         * 参数2 - contactPoint (作用点):
         *   box.getAbsolutePosition().add(new Vector3(0, 2, 0))
         *   - getAbsolutePosition() 获取盒子中心的世界坐标
         *   - add(new Vector3(0, 2, 0)) 在Y轴上方偏移2单位
         *   - 力作用在盒子上方，会导致旋转效果（类似推倒）
         *
         * 物理原理：
         *   当力的作用点不在物体重心时，会产生力矩
         *   导致物体在移动的同时发生旋转
         */
        box.physicsImpostor.applyImpulse(
          new Vector3(-3, 0, 0), // 冲量方向：向左
          box.getAbsolutePosition().add(new Vector3(0, 2, 0)) // 作用点：盒子上方
        );
      })
    );
  }

  /**
   * 创建炮弹模板
   *
   * 模板设计模式：
   * - 创建一个不可见的原始对象
   * - 通过 clone() 方法创建可见的副本
   * - 节省资源，便于统一管理
   */
  CreateCannonball(): void {
    // 创建球体作为炮弹
    this.cannonball = MeshBuilder.CreateSphere("cannonball", { diameter: 0.5 });

    // 创建绿色材质
    const ballMat = new PBRMaterial("ballMat", this.scene);
    ballMat.roughness = 1;
    ballMat.albedoColor = new Color3(0, 1, 0); // 绿色

    this.cannonball.material = ballMat;

    // 添加物理碰撞体到炮弹
    this.cannonball.physicsImpostor = new PhysicsImpostor(
      this.cannonball,
      PhysicsImpostor.SphereImpostor,
      { mass: 1, friction: 1 }
    );

    // 将炮弹模板位置设置到相机位置
    this.cannonball.position = this.camera.position;

    // 禁用模板 - 克隆的副本才会被显示和使用
    this.cannonball.setEnabled(false);
  }

  /**
   * 发射炮弹 - 演示 applyForce
   *
   * applyForce(force, contactPoint)
   * - force: Vector3 力向量，表示力的方向和大小
   * - contactPoint: Vector3 力的作用点
   *
   * 力与冲量的区别：
   * - applyForce: 持续作用的力，每帧都需要调用
   * - applyImpulse: 瞬时冲量，只调用一次
   *
   * 本例中使用 applyForce 发射炮弹，模拟持续推力
   */
  ShootCannonball(): void {
    // 克隆炮弹模板
    const clone = this.cannonball.clone("clone");

    // 设置克隆体的位置为当前相机位置
    clone.position = this.camera.position;

    // 启用克隆体（模板是禁用状态）
    clone.setEnabled(true);

    /**
     * applyForce 参数详解：
     *
     * 参数1 - force (力向量):
     *   this.camera.getForwardRay().direction.scale(1000)
     *   - getForwardRay() 获取相机前方的射线
     *   - direction 获取射线方向（单位向量）
     *   - scale(1000) 将方向向量放大1000倍作为力的大小
     *   1000 是力的倍数，值越大，炮弹飞得越快
     *
     * 参数2 - contactPoint (作用点):
     *   clone.getAbsolutePosition()
     *   - 使用克隆体的中心作为力的作用点
     *   - 对于球形物体，中心施力不会产生旋转
     *
     * 物理单位：
     *   力的单位是牛顿 (N)
     *   scale(1000) 表示施加1000牛顿的力
     */
    clone.physicsImpostor.applyForce(
      this.camera.getForwardRay().direction.scale(1000), // 力：相机前方，放大1000倍
      clone.getAbsolutePosition() // 作用点：克隆体中心
    );

    /**
     * 注册碰撞事件 - 炮弹落地后自动销毁
     *
     * registerOnPhysicsCollide(otherImpostor, callback)
     * - otherImpostor: 要检测碰撞的另一个物理体
     * - callback: 碰撞发生时的回调函数
     *
     * 性能优化：
     *   炮弹落地后延时销毁，防止场景中积累过多对象
     *   实际项目中可以使用对象池（Object Pooling）进一步优化
     */
    clone.physicsImpostor.registerOnPhysicsCollide(
      this.ground.physicsImpostor, // 检测与地面的碰撞
      () => {
        // 3秒后销毁炮弹
        setTimeout(() => {
          clone.dispose();
        }, 3000);
      }
    );
  }
}
