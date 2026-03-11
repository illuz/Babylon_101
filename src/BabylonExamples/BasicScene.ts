import {
  Scene,
  Engine,
  FreeCamera,
  Vector3,
  HemisphericLight,
  MeshBuilder,
} from "@babylonjs/core";

/**
 * BasicScene - Babylon.js 基础场景类
 *
 * 本类演示了 Babylon.js 中最基础的场景构建，包含以下核心组件：
 * - Engine（引擎）：负责渲染循环和 WebGL 上下文管理
 * - Scene（场景）：所有 3D 对象、灯光、相机的容器
 * - Camera（相机）：定义观察者的视角
 * - Light（灯光）：为场景提供光照
 * - Mesh（网格）：3D 几何体对象
 */
export class BasicScene {
  scene: Scene;  // 场景对象，存储所有 3D 元素
  engine: Engine;  // 引擎对象，负责渲染

  /**
   * 构造函数 - 初始化 Babylon.js 场景
   *
   * 工作流程：
   * 1. 创建 Engine 实例，绑定到 canvas 元素
   * 2. 调用 CreateScene() 构建场景内容
   * 3. 启动渲染循环，持续渲染场景
   *
   * @param canvas - HTML 画布元素，用于 WebGL 渲染
   */
  constructor(private canvas: HTMLCanvasElement) {
    // 创建引擎实例
    // 第二个参数 'true' 表示启用抗锯齿（anti-aliasing）
    this.engine = new Engine(this.canvas, true);

    // 构建场景（包含相机、灯光、网格等）
    this.scene = this.CreateScene();

    // 启动渲染循环
    // runRenderLoop 会在每一帧调用回调函数
    // this.scene.render() 执行场景的渲染操作
    this.engine.runRenderLoop(() => {
      this.scene.render();
    });
  }

  /**
   * CreateScene - 创建并配置场景
   *
   * 场景是 Babylon.js 的核心概念，所有 3D 对象都需要添加到场景中。
   * 一个典型的场景包含：
   * - 相机：决定观察角度和投影方式
   * - 灯光：照亮场景中的物体
   * - 网格：可见的 3D 对象
   *
   * @returns 配置完成的 Scene 实例
   */
  CreateScene(): Scene {
    // 创建场景实例，关联到引擎
    const scene = new Scene(this.engine);

    // =====================
    // 相机配置
    // =====================
    // FreeCamera 是一种可以自由移动的相机
    // 参数说明：
    // - "camera": 相机名称（用于调试和识别）
    // - new Vector3(0, 1, -5): 相机位置 (x, y, z)
    //   - x=0: 水平居中
    //   - y=1: 距地面1个单位高度
    //   - z=-5: 向后移动5个单位（负Z方向是"前方"）
    // - this.scene: 所属场景
    const camera = new FreeCamera("camera", new Vector3(0, 1, -5), this.scene);

    // 将相机控件绑定到 canvas
    // 启用后可以使用鼠标/键盘控制相机移动
    camera.attachControl();

    // =====================
    // 灯光配置
    // =====================
    // HemisphericLight（半球光）模拟环境光照
    // 特点：
    // - 模拟天空和地面的漫反射光
    // - 没有明确的方向性，光照均匀柔和
    // - 适合作为基础环境光
    // 参数说明：
    // - "hemiLight": 灯光名称
    // - new Vector3(0, 1, 0): 光照方向（从上往下）
    const hemiLight = new HemisphericLight(
      "hemiLight",
      new Vector3(0, 1, 0),
      this.scene
    );

    // 设置灯光强度
    // 范围通常是 0-1，值越大越亮
    hemiLight.intensity = 0.5;

    // =====================
    // 网格（Mesh）配置
    // =====================
    // MeshBuilder 是创建几何体的工具类
    // 提供多种预定义几何体的创建方法

    // 创建地面
    // CreateGround 创建一个水平平面
    // 参数说明：
    // - "ground": 网格名称
    // - { width: 10, height: 10 }: 平面尺寸（10x10 单位）
    const ground = MeshBuilder.CreateGround(
      "ground",
      { width: 10, height: 10 },
      this.scene
    );

    // 创建球体
    // CreateSphere 创建一个球体
    // 参数说明：
    // - "ball": 网格名称
    // - { diameter: 1 }: 球体直径为1个单位
    const ball = MeshBuilder.CreateSphere("ball", { diameter: 1 }, this.scene);

    // 设置球体位置
    // 将球体放置在地面上方
    // y=1 意味着球心距地面1个单位（球体半径为0.5，所以底部刚好接触地面）
    ball.position = new Vector3(0, 1, 0);

    return scene;
  }
}
