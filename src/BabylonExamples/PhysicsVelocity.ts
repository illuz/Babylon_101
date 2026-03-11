/**
 * 物理速度示例 (Physics Velocity Demo)
 *
 * 本示例演示如何在 Babylon.js 物理环境中使用速度控制物体运动：
 * - 线性速度 (Linear Velocity)：控制物体的移动速度和方向
 * - 角速度 (Angular Velocity)：控制物体的旋转速度和轴向
 *
 * 速度与力的区别：
 * - 力 (Force)：施加力会产生加速度，速度会逐渐变化，受质量影响
 * - 速度 (Velocity)：直接设置物体的速度，立即生效，不受质量影响
 *
 * 适用场景：
 * - 速度：适合需要精确控制移动速度的场景（如飞行器推进）
 * - 力：适合模拟真实的物理效果（如重力、碰撞弹开）
 */
import {
  Scene,
  Engine,
  SceneLoader,
  FreeCamera,
  Vector3,
  CannonJSPlugin,
  MeshBuilder,
  PhysicsImpostor,
  CubeTexture,
} from "@babylonjs/core";
import "@babylonjs/loaders";
import * as CANNON from "cannon";

export class PhysicsVelocity {
  scene: Scene;
  engine: Engine;
  camera: FreeCamera;

  constructor(private canvas: HTMLCanvasElement) {
    this.engine = new Engine(this.canvas, true);
    this.scene = this.CreateScene();
    this.CreateEnvironment();
    this.CreateImpostors();
    this.CreateRocket();

    this.engine.runRenderLoop(() => {
      this.scene.render();
    });
  }

  /**
   * 创建场景
   *
   * 设置环境贴图、天空盒、相机和物理引擎
   * 物理引擎使用 Cannon.js，重力设置为 -9.81（模拟真实重力）
   */
  CreateScene(): Scene {
    const scene = new Scene(this.engine);

    // 创建环境贴图，用于 PBR 材质的反射效果
    const envTex = CubeTexture.CreateFromPrefilteredData(
      "./environment/sky.env",
      scene
    );

    envTex.gammaSpace = false;
    envTex.rotationY = Math.PI / 2;

    scene.environmentTexture = envTex;

    // 创建天空盒，参数：环境贴图、启用 HDR、尺寸、模糊度
    scene.createDefaultSkybox(envTex, true, 1000, 0.25);

    // 创建自由相机，初始位置在火箭后方
    const camera = new FreeCamera("camera", new Vector3(0, 2, -5), this.scene);
    camera.attachControl();
    camera.minZ = 0.5;

    this.camera = camera;

    // 启用物理引擎
    // 参数：重力向量、物理插件
    // 重力 Vector3(0, -9.81, 0) 表示 Y 轴向下的重力加速度
    scene.enablePhysics(
      new Vector3(0, -9.81, 0),
      new CannonJSPlugin(true, 10, CANNON)
    );

    return scene;
  }

  /**
   * 创建环境（导入 3D 模型）
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
   *
   * 创建一个不可见的地面用于物理碰撞
   * mass: 0 表示静态物体（不受重力影响）
   * restitution: 1 表示完全弹性碰撞（无能量损失）
   */
  CreateImpostors(): void {
    const ground = MeshBuilder.CreateGround("ground", {
      width: 40,
      height: 40,
    });

    ground.isVisible = false;

    ground.physicsImpostor = new PhysicsImpostor(
      ground,
      PhysicsImpostor.BoxImpostor,
      { mass: 0, restitution: 1 }
    );
  }

  /**
   * 创建火箭并设置物理速度
   *
   * 本方法演示以下核心概念：
   *
   * 1. 碰撞体与视觉模型的分离
   *    - 视觉模型（toon_rocket.glb）：用于渲染显示
   *    - 碰撞体（rocketCol）：简单的 Box 碰撞器，用于物理计算
   *    - 使用 setParent() 将视觉模型作为碰撞体的子对象
   *
   * 2. 线性速度 (setLinearVelocity)
   *    - 直接设置物体的移动速度（单位：米/秒）
   *    - 参数是 Vector3，表示在 X/Y/Z 轴上的速度分量
   *    - 使用 rocketCol.up 可以沿物体局部坐标的 Y 轴（上方）移动
   *
   * 3. 角速度 (setAngularVelocity)
   *    - 直接设置物体的旋转速度（单位：弧度/秒）
   *    - 参数是 Vector3，表示绕 X/Y/Z 轴的旋转速度
   *
   * 4. 每帧更新速度
   *    - 使用 registerBeforeRender 在每帧应用速度
   *    - 这样可以持续推动物体（如火箭推进器）
   *    - 使用 unregisterBeforeRender 停止应用速度
   */
  async CreateRocket(): Promise<void> {
    // 导入火箭的视觉模型
    const { meshes } = await SceneLoader.ImportMeshAsync(
      "",
      "/models/",
      "toon_rocket.glb",
      this.scene
    );

    // ============================================================
    // 创建碰撞体（Collider）
    // ============================================================
    // 使用简单的 Box 作为碰撞体，而不是复杂的火箭模型
    // 原因：
    // 1. 简单的碰撞体计算效率更高
    // 2. 火箭模型的网格可能太复杂，不适合做碰撞检测
    // 3. 可以根据需要调整碰撞体的尺寸来匹配视觉模型
    const rocketCol = MeshBuilder.CreateBox("rocketCol", {
      width: 1,    // 宽度
      height: 1.7, // 高度（与火箭主体匹配）
      depth: 1,    // 深度
    });

    // 设置碰撞体位置，使其刚好在地面上方
    // 高度的一半（1.7/2 约 0.85）使 Box 底部与地面齐平
    rocketCol.position.y = 0.85;

    // 设置可见度为 0，使碰撞体不可见
    // 也可以使用 rocketCol.isVisible = false
    rocketCol.visibility = 0;

    // 为碰撞体添加物理模拟
    // mass: 1 表示有质量，受重力影响
    rocketCol.physicsImpostor = new PhysicsImpostor(
      rocketCol,
      PhysicsImpostor.BoxImpostor,
      { mass: 1 }
    );

    // ============================================================
    // 设置父子关系（Parenting）
    // ============================================================
    // setParent() vs parent 属性的区别：
    // - meshes[0].parent = rocketCol：会重新计算子对象的位置和旋转
    // - meshes[0].setParent(rocketCol)：保持子对象的视觉位置不变
    //
    // 这里使用 setParent() 让火箭视觉模型成为碰撞体的子对象
    // 当碰撞体移动/旋转时，视觉模型会跟随
    meshes[0].setParent(rocketCol);

    // 预先旋转火箭 90 度（1.5 弧度），使其水平飞行
    // Vector3.Forward() 表示 Z 轴方向
    rocketCol.rotate(Vector3.Forward(), 1.5);

    // ============================================================
    // 物理速度更新函数
    // ============================================================
    const rocketPhysics = () => {
      // 让相机跟随火箭的 X 和 Y 位置，保持 Z 位置不变
      this.camera.position = new Vector3(
        rocketCol.position.x,
        rocketCol.position.y,
        this.camera.position.z
      );

      // ----------------------------------------------------------
      // setLinearVelocity - 设置线性速度
      // ----------------------------------------------------------
      // 线性速度决定物体的移动方向和速度
      //
      // 参数：Vector3(x速度, y速度, z速度)
      // - 世界坐标系：new Vector3(0, 5, 0) 表示向世界 Y 轴正方向移动
      // - 局部坐标系：rocketCol.up 表示沿火箭自身的 Y 轴（向上方向）
      //
      // rocketCol.up.scale(5) 的含义：
      // - rocketCol.up 是火箭自身的"向上"方向向量
      // - scale(5) 将向量长度乘以 5，即速度为 5 米/秒
      // - 这样火箭会沿自身朝向飞行，而不是世界坐标的上方
      rocketCol.physicsImpostor.setLinearVelocity(rocketCol.up.scale(5));

      // ----------------------------------------------------------
      // setAngularVelocity - 设置角速度
      // ----------------------------------------------------------
      // 角速度决定物体的旋转速度
      //
      // 参数：Vector3(绕X轴旋转, 绕Y轴旋转, 绕Z轴旋转)
      // - Vector3(1, 0, 0)：绕 X 轴旋转，1 弧度/秒
      // - Vector3(0, 1, 0)：绕 Y 轴旋转（原地旋转）
      // - rocketCol.up：沿火箭自身 Y 轴旋转
      //
      // 注意：角速度使用弧度，1 弧度 约 57.3 度
      rocketCol.physicsImpostor.setAngularVelocity(rocketCol.up);
    };

    // 游戏状态标记
    let gameOver = false;

    // ============================================================
    // 注册每帧更新函数
    // ============================================================
    // registerBeforeRender：在每帧渲染前调用注册的函数
    // 这对于需要持续更新的物理效果非常有用
    // 60 FPS 时，函数每秒调用约 60 次
    if (!gameOver) this.scene.registerBeforeRender(rocketPhysics);

    // ============================================================
    // 点击事件：停止火箭推进
    // ============================================================
    // onPointerDown：鼠标/触摸点击事件
    // 点击后将游戏状态设为结束，并取消注册物理更新函数
    // 火箭将不再获得推进力，会因重力下落
    this.scene.onPointerDown = () => {
      gameOver = true;
      // unregisterBeforeRender：取消注册的渲染前回调
      // 停止持续应用速度，让火箭受重力影响下落
      this.scene.unregisterBeforeRender(rocketPhysics);
    };
  }
}