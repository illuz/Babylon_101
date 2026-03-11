/**
 * 第一人称控制器 (First Person Controller)
 *
 * 本模块实现了 FPS 游戏风格的第一人称相机控制，包括：
 * - 鼠标锁定与视角控制
 * - WASD 键盘移动控制
 * - 重力系统
 * - 碰撞检测
 */
import {
  Scene,
  Engine,
  SceneLoader,
  Vector3,
  HemisphericLight,
  FreeCamera,
} from "@babylonjs/core";
import "@babylonjs/loaders";

/**
 * 第一人称控制器类
 *
 * 实现了完整的第一人称视角控制，包括：
 * - 鼠标控制视角旋转
 * - WASD 键控制移动
 * - 重力和碰撞
 */
export class FirstPersonController {
  scene: Scene;
  engine: Engine;

  /**
   * 构造函数
   * @param canvas - 用于渲染的 canvas 元素
   */
  constructor(private canvas: HTMLCanvasElement) {
    // 创建 Babylon.js 引擎，启用抗锯齿
    this.engine = new Engine(this.canvas, true);
    // 创建场景
    this.scene = this.CreateScene();

    // 异步加载环境（3D 模型）
    this.CreateEnvironment();

    // 创建玩家控制器
    this.CreateController();

    // 启动渲染循环
    this.engine.runRenderLoop(() => {
      this.scene.render();
    });
  }

  /**
   * 创建场景并配置基础设置
   *
   * 关键配置：
   * - 半球光源：提供基础照明
   * - 指针锁定：点击鼠标左键锁定指针
   * - 重力设置：模拟真实重力效果
   * - 碰撞系统：启用场景级别的碰撞检测
   */
  CreateScene(): Scene {
    const scene = new Scene(this.engine);

    // 创建半球光源
    // 参数：名称、方向（从上向下）、场景
    // 半球光源模拟天空和地面的环境光
    new HemisphericLight("hemi", new Vector3(0, 1, 0), this.scene);

    // 配置鼠标指针锁定（Pointer Lock API）
    // 这是实现 FPS 风格视角控制的关键
    scene.onPointerDown = (evt) => {
      // 鼠标左键（button === 0）：进入指针锁定模式
      if (evt.button === 0) this.engine.enterPointerlock();
      // 鼠标中键（button === 1）：退出指针锁定模式
      if (evt.button === 1) this.engine.exitPointerlock();
    };

    // 配置重力系统
    // Babylon.js 的重力是按帧计算的，需要除以帧率
    const framesPerSecond = 60;
    const gravity = -9.81; // 地球重力加速度 (m/s²)
    // 注意：重力值需要除以帧率，因为 Babylon.js 每帧应用一次
    scene.gravity = new Vector3(0, gravity / framesPerSecond, 0);

    // 启用场景级别的碰撞检测
    // 这是所有碰撞检测的基础设置
    scene.collisionsEnabled = true;

    return scene;
  }

  /**
   * 创建环境：加载 3D 场景模型
   *
   * 从 GLB 文件加载场景，并为所有网格启用碰撞检测
   * 这样玩家就不会穿过墙壁或地板
   */
  async CreateEnvironment(): Promise<void> {
    // 异步加载 GLB 模型
    // 参数：空字符串（不筛选网格）、模型路径、模型文件名、场景
    const { meshes } = await SceneLoader.ImportMeshAsync(
      "",
      "./models/",
      "Prototype_Level.glb",
      this.scene
    );

    // 为所有加载的网格启用碰撞检测
    // 这样相机就无法穿过这些网格（墙壁、地板等）
    meshes.map((mesh) => {
      mesh.checkCollisions = true;
    });
  }

  /**
   * 创建第一人称控制器（相机）
   *
   * 配置项：
   * - 位置：初始高度 10 单位
   * - 重力：相机受重力影响
   * - 碰撞：相机与环境碰撞
   * - 椭圆体：碰撞检测的范围（玩家体积）
   * - 键盘映射：WASD 键控制移动
   */
  CreateController(): void {
    // 创建自由相机（第一人称相机）
    // 参数：名称、位置（y=10 表示在空中 10 个单位）、场景
    const camera = new FreeCamera("camera", new Vector3(0, 10, 0), this.scene);

    // 将相机绑定到 canvas，启用鼠标控制
    camera.attachControl();

    // 启用重力影响
    // 相机会自动下落，直到碰到可碰撞的表面
    camera.applyGravity = true;

    // 启用相机碰撞检测
    // 防止相机穿过墙壁和障碍物
    camera.checkCollisions = true;

    // 设置相机的碰撞椭圆体（玩家碰撞体积）
    // Vector3(1, 1, 1) 表示一个半径为 1 的椭圆体
    // 这个椭圆体定义了相机的"体积"，可以理解为玩家的"身体大小"
    camera.ellipsoid = new Vector3(1, 1, 1);

    // 近裁剪面
    // 值 0.45 表示相机距离物体小于 0.45 单位时不会渲染
    // 防止相机太靠近墙壁时出现穿模
    camera.minZ = 0.45;

    // 移动速度
    // 值越小移动越慢，适合 FPS 游戏的精细控制
    camera.speed = 0.75;

    // 角度灵敏度
    // 值越大，鼠标移动相同的距离，视角旋转越少
    // 4000 是一个较低的灵敏度值，适合 FPS 游戏
    camera.angularSensibility = 4000;

    // 配置键盘控制键
    // 默认情况下，FreeCamera 使用方向键控制
    // 这里添加 WASD 键映射

    // W 键（ASCII 码 87）- 向前移动
    camera.keysUp.push(87);
    // A 键（ASCII 码 65）- 向左移动
    camera.keysLeft.push(65);
    // S 键（ASCII 码 83）- 向后移动
    camera.keysDown.push(83);
    // D 键（ASCII 码 68）- 向右移动
    camera.keysRight.push(68);
  }
}
