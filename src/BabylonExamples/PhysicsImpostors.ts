/**
 * Babylon.js 物理引擎示例 - PhysicsImpostors（物理模拟器）
 *
 * 本示例展示如何在 Babylon.js 中集成 Cannon.js 物理引擎
 *
 * === 核心概念 ===
 *
 * 1. 物理引擎（Physics Engine）
 *    - Cannon.js: 纯 JavaScript 编写的轻量级物理引擎
 *    - Ammo.js: Bullet 物理引擎的 Emscripten 移植版本，功能更强大
 *    - Oimo.js: 另一个轻量级选择，适合简单场景
 *
 * 2. PhysicsImpostor（物理模拟器）
 *    - 结合了碰撞器（Collider）和刚体（Rigid Body）的功能
 *    - 使网格对象能够参与物理模拟（重力、碰撞、弹跳等）
 *    - 每个需要物理交互的对象都需要一个 PhysicsImpostor
 *
 * 3. 物理属性
 *    - mass（质量）: 对象的重量，0 表示静态对象（不会移动）
 *    - restitution（弹性/恢复系数）: 控制碰撞后的反弹程度（0-1）
 *    - friction（摩擦力）: 控制对象的滑动程度
 */

// ============================================
// 导入必要的 Babylon.js 核心模块
// ============================================
import {
  Scene,              // 场景容器
  Engine,             // 渲染引擎
  SceneLoader,        // 场景/模型加载器
  FreeCamera,         // 自由摄像机（可用键盘/鼠标控制）
  HemisphericLight,   // 半球光（模拟环境光照）
  Vector3,            // 3D 向量类
  CannonJSPlugin,     // Cannon.js 物理引擎插件
  MeshBuilder,        // 网格构建器（创建基础几何体）
  PhysicsImpostor,    // 物理模拟器类
} from "@babylonjs/core";
import "@babylonjs/loaders";  // 导入 GLB/OBJ 等模型加载器

// 导入 Cannon.js 物理引擎
// Cannon.js 是一个轻量级的 3D 物理引擎，支持刚体动力学、碰撞检测等
import * as CANNON from "cannon";

/**
 * PhysicsImpostors 类
 *
 * 演示如何在 Babylon.js 场景中启用物理模拟，
 * 并为不同的网格对象创建物理行为。
 */
export class PhysicsImpostors {
  // 场景和引擎实例
  scene: Scene;
  engine: Engine;

  /**
   * 构造函数
   * @param canvas - 用于渲染的 HTML Canvas 元素
   */
  constructor(private canvas: HTMLCanvasElement) {
    // 创建渲染引擎（第二个参数 true 启用抗锯齿）
    this.engine = new Engine(this.canvas, true);

    // 初始化场景
    this.scene = this.CreateScene();

    // 异步加载环境（3D 模型）
    this.CreateEnvironment();

    // 创建物理模拟对象（盒子、地面、球体）
    this.CreateImpostors();

    // 启动渲染循环
    this.engine.runRenderLoop(() => {
      this.scene.render();
    });
  }

  /**
   * 创建场景并启用物理引擎
   *
   * 关键步骤：
   * 1. 创建基础场景
   * 2. 添加光源和摄像机
   * 3. 启用物理引擎（设置重力和插件）
   */
  CreateScene(): Scene {
    const scene = new Scene(this.engine);

    // 添加半球光提供基础照明
    new HemisphericLight("hemi", new Vector3(0, 1, 0), this.scene);

    // 创建自由摄像机，位置设置在 (0, 10, -20)，可以俯瞰场景
    const camera = new FreeCamera(
      "camera",
      new Vector3(0, 10, -20),
      this.scene
    );
    camera.setTarget(Vector3.Zero());  // 摄像机看向世界原点
    camera.attachControl();             // 将控制绑定到 canvas
    camera.minZ = 0.5;                  // 近裁剪面距离

    // ========================================
    // 启用物理引擎 - 这是物理模拟的核心
    // ========================================
    // scene.enablePhysics(重力向量, 物理插件)
    //
    // 重力向量：new Vector3(0, -9.81, 0)
    //   - 模拟地球重力加速度（约 9.81 m/s^2）
    //   - Y 轴负值表示向下
    //
    // CannonJSPlugin 参数：
    //   - 第一个参数（useDeltaForWorldStep）：true = 使用帧间隔时间作为物理步长
    //   - 第二个参数（iterations）：约束求解迭代次数，影响模拟精度
    //   - 第三个参数（cannonInjection）：Cannon.js 库的引用
    scene.enablePhysics(
      new Vector3(0, -9.81, 0),        // 地球标准重力
      new CannonJSPlugin(true, 10, CANNON)  // Cannon.js 插件配置
    );

    return scene;
  }

  /**
   * 加载 3D 环境模型
   *
   * 使用 SceneLoader 加载 GLB 格式的 3D 场景
   * 这个模型提供视觉环境，但本身不参与物理模拟
   */
  async CreateEnvironment(): Promise<void> {
    await SceneLoader.ImportMeshAsync(
      "",                    // 要导入的网格名称（空字符串 = 全部）
      "./models/",           // 模型目录
      "Prototype_Level.glb", // 模型文件名
      this.scene             // 目标场景
    );
  }

  /**
   * 创建物理模拟对象
   *
   * 为三个对象创建物理模拟：
   * 1. 盒子 - 动态对象，会受重力影响下落和弹跳
   * 2. 地面 - 静态对象，作为其他物体的碰撞基础
   * 3. 球体 - 动态对象，演示球体碰撞器的效果
   */
  CreateImpostors(): void {
    // ========================================
    // 1. 创建盒子（动态物理对象）
    // ========================================
    const box = MeshBuilder.CreateBox("box", { size: 2 });

    // 设置盒子的初始位置，Y=10 让盒子从高处落下
    box.position = new Vector3(0, 10, 1);

    // 设置盒子的初始旋转，X 轴旋转 45 度让下落过程更有趣
    box.rotation = new Vector3(Math.PI / 4, 0, 0);

    // 为盒子创建物理模拟器
    // PhysicsImpostor.BoxImpostor: 使用盒子形状作为碰撞边界，适合方形物体
    // mass: 1 - 质量为 1，是动态对象，会受重力影响
    // restitution: 0.75 - 弹性系数，碰撞后反弹程度（0=无弹性，1=完全弹性）
    box.physicsImpostor = new PhysicsImpostor(
      box,
      PhysicsImpostor.BoxImpostor,
      { mass: 1, restitution: 0.75 }
    );

    // ========================================
    // 2. 创建地面（静态物理对象）
    // ========================================
    const ground = MeshBuilder.CreateGround("ground", {
      width: 40,   // X 轴方向宽度
      height: 40,  // Z 轴方向深度
    });

    // 隐藏地面网格的渲染
    // isVisible = false 表示不渲染，但物理碰撞仍然有效
    // 这样可以使用场景中的模型作为视觉地面，而用这个隐藏的平面作为物理碰撞面
    ground.isVisible = false;

    // 为地面创建物理模拟器
    // mass: 0 - 质量为 0，表示静态对象，不会移动但其他物体可以与它碰撞
    // restitution: 0.5 - 中等弹性
    ground.physicsImpostor = new PhysicsImpostor(
      ground,
      PhysicsImpostor.BoxImpostor,
      { mass: 0, restitution: 0.5 }
    );

    // ========================================
    // 3. 创建球体（动态物理对象）
    // ========================================
    const sphere = MeshBuilder.CreateSphere("sphere", { diameter: 3 });

    // 设置球体的初始位置，Y=6 让球体从较低的高度落下
    sphere.position = new Vector3(0, 6, 0);

    // 为球体创建物理模拟器
    // PhysicsImpostor.SphereImpostor: 使用球形作为碰撞边界，适合球形物体，滚动效果自然
    // mass: 1 - 质量为 1，动态对象
    // restitution: 0.8 - 较高弹性，球体比盒子弹得更高
    sphere.physicsImpostor = new PhysicsImpostor(
      sphere,
      PhysicsImpostor.SphereImpostor,
      { mass: 1, restitution: 0.8 }
    );
  }
}
