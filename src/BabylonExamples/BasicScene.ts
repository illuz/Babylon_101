/**
 * BasicScene - Babylon.js 基础场景示例
 *
 * 本文件演示了 Babylon.js 中最基础的场景创建流程，包含以下核心概念：
 * - Engine（引擎）：Babylon.js 的核心，负责渲染循环和 WebGL 上下文管理
 * - Scene（场景）：所有 3D 对象、光源、相机的容器
 * - FreeCamera（自由相机）：允许用户通过键盘和鼠标自由浏览场景
 * - HemisphericLight（半球光）：模拟环境光照的光源
 * - MeshBuilder（网格构建器）：用于创建基本几何体的工具类
 */

// 从 Babylon.js 核心库导入必要的类和工具
import {
  Scene,           // 场景类 - 所有 3D 对象的容器
  Engine,          // 引擎类 - 管理 WebGL 渲染上下文和渲染循环
  FreeCamera,      // 自由相机类 - 提供第一人称视角的相机控制
  Vector3,         // 三维向量类 - 用于表示位置、方向和缩放
  HemisphericLight, // 半球光类 - 模拟天空和地面反射的环境光
  MeshBuilder,     // 网格构建器 - 用于创建基础几何体（球体、立方体、地面等）
} from "@babylonjs/core";

/**
 * BasicScene 类 - 封装基础场景的创建和渲染逻辑
 *
 * 这个类展示了 Babylon.js 应用程序的基本结构：
 * 1. 创建 Engine 实例并绑定到 HTML canvas 元素
 * 2. 创建 Scene 实例作为所有对象的容器
 * 3. 设置相机、光源和网格对象
 * 4. 启动渲染循环
 */
export class BasicScene {
  // scene: Scene - 场景实例，包含所有可渲染对象（网格、光源、相机等）
  scene: Scene;

  // engine: Engine - 引擎实例，负责 WebGL 渲染和帧循环管理
  engine: Engine;

  /**
   * 构造函数 - 初始化 Babylon.js 引擎和场景
   *
   * @param canvas - HTML canvas 元素，Babylon.js 将在此元素上渲染 3D 场景
   *
   * 工作流程：
   * 1. 创建 Engine 实例
   *    - 第一个参数：canvas 元素（渲染目标）
   *    - 第二个参数：true 表示启用抗锯齿（antialiasing）
   *
   * 2. 调用 CreateScene() 创建并配置场景
   *    - 添加相机、光源和网格对象
   *
   * 3. 启动渲染循环
   *    - runRenderLoop() 会在每一帧调用回调函数
   *    - scene.render() 负责将场景渲染到 canvas
   *    - 默认情况下，渲染循环会以显示器刷新率（通常 60fps）持续运行
   */
  constructor(private canvas: HTMLCanvasElement) {
    // 创建 Babylon.js 引擎
    // Engine 是 Babylon.js 的核心，它：
    // - 初始化 WebGL 上下文
    // - 管理渲染管线
    // - 处理硬件能力检测
    // - 提供渲染循环机制
    this.engine = new Engine(this.canvas, true);

    // 创建并配置场景
    // CreateScene() 方法返回一个包含相机、光源和网格的完整场景
    this.scene = this.CreateScene();

    // 启动渲染循环
    // 这是 Babylon.js 动画和交互的核心机制：
    // - 每帧调用 scene.render() 更新画面
    // - 引擎会自动处理帧率同步
    // - 场景中的动画会自动更新
    this.engine.runRenderLoop(() => {
      this.scene.render();
    });
  }

  /**
   * CreateScene - 创建并配置 3D 场景
   *
   * 这个方法负责构建场景中的所有对象，包括：
   * - 相机：决定用户如何观察场景
   * - 光源：照亮场景中的物体
   * - 网格：场景中的可渲染几何体
   *
   * @returns Scene - 配置完成的场景实例
   */
  CreateScene(): Scene {
    // ========================================
    // 1. 创建场景实例
    // ========================================
    // Scene 是所有 3D 对象的容器，类似于一个"虚拟世界"
    // 它包含：相机、光源、网格、材质、动画等所有渲染元素
    const scene = new Scene(this.engine);

    // ========================================
    // 2. 创建相机
    // ========================================
    // FreeCamera 是一种基础相机类型，允许用户：
    // - 使用 WASD 键移动
    // - 使用鼠标旋转视角
    //
    // 参数说明：
    // - "camera": 相机的名称（用于调试和识别）
    // - new Vector3(0, 1, -5): 相机的初始位置
    //   - x=0: 位于场景中心（左右方向）
    //   - y=1: 距地面 1 单位高度
    //   - z=-5: 在地面后方 5 单位（Babylon.js 使用右手坐标系，Z 轴负方向为"前方"）
    // - this.scene: 相机所属的场景
    const camera = new FreeCamera("camera", new Vector3(0, 1, -5), this.scene);

    // attachControl() 将相机控制绑定到 canvas
    // 这使得用户可以通过键盘和鼠标控制相机
    // 默认控制：
    // - 鼠标移动：旋转视角
    // - W/A/S/D：前进/左移/后退/右移
    camera.attachControl();

    // ========================================
    // 3. 创建光源
    // ========================================
    // HemisphericLight（半球光）模拟环境光照：
    // - 模拟天空和地面的漫反射光
    // - 提供柔和、均匀的光照效果
    // - 不产生阴影
    //
    // 参数说明：
    // - "hemiLight": 光源名称
    // - new Vector3(0, 1, 0): 光照方向（从上往下）
    //   - 这个方向决定了光照的角度
    // - this.scene: 光源所属的场景
    const hemiLight = new HemisphericLight(
      "hemiLight",
      new Vector3(0, 1, 0),
      this.scene
    );

    // 设置光照强度
    // intensity 范围通常是 0-1，但可以超过 1
    // 0.5 表示中等亮度，适合作为环境光
    hemiLight.intensity = 0.5;

    // ========================================
    // 4. 创建地面网格
    // ========================================
    // MeshBuilder 提供了创建基本几何体的静态方法
    // CreateGround 创建一个平面矩形地面
    //
    // 参数说明：
    // - "ground": 网格名称
    // - { width: 10, height: 10 }: 配置选项
    //   - width: X 轴方向的宽度
    //   - height: Z 轴方向的高度（注意：这里 height 指的是深度）
    // - this.scene: 网格所属的场景
    const ground = MeshBuilder.CreateGround(
      "ground",
      { width: 10, height: 10 },
      this.scene
    );

    // ========================================
    // 5. 创建球体网格
    // ========================================
    // CreateSphere 创建一个球体
    //
    // 参数说明：
    // - "ball": 网格名称
    // - { diameter: 1 }: 配置选项
    //   - diameter: 球体直径为 1 单位
    // - this.scene: 网格所属的场景
    const ball = MeshBuilder.CreateSphere("ball", { diameter: 1 }, this.scene);

    // 设置球体位置
    // 默认情况下，网格创建在原点 (0, 0, 0)
    // 这里将球体移动到 (0, 1, 0)
    // - x=0: 位于地面中心上方
    // - y=1: 距原点 1 单位高度（正好在地面上方，因为球体直径也是 1）
    // - z=0: 位于地面中心
    ball.position = new Vector3(0, 1, 0);

    // 返回配置完成的场景
    // 这个场景将被用于渲染循环中
    return scene;
  }
}
