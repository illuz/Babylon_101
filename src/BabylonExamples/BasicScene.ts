/**
 * 基础场景示例 - Babylon.js 入门
 *
 * 本课程介绍 Babylon.js 的核心组件：
 * - Engine（引擎）：WebGL 渲染引擎，管理渲染循环
 * - Scene（场景）：所有 3D 对象的容器
 * - FreeCamera（自由相机）：支持鼠标和键盘控制
 * - HemisphericLight（半球光）：模拟天空环境光
 * - MeshBuilder（网格构建器）：创建基础几何体
 */
import {
  Scene,
  Engine,
  FreeCamera,
  Vector3,
  HemisphericLight,
  MeshBuilder,
} from "@babylonjs/core";

export class BasicScene {
  /** 场景容器，包含所有 3D 对象 */
  scene: Scene;
  /** 渲染引擎，管理 WebGL 上下文和渲染循环 */
  engine: Engine;

  /**
   * 构造函数 - 初始化 Babylon.js 场景
   * @param canvas - HTML Canvas 元素，用于渲染输出
   */
  constructor(private canvas: HTMLCanvasElement) {
    // 创建引擎，参数 true 启用抗锯齿（anti-aliasing）
    this.engine = new Engine(this.canvas, true);

    // 创建场景
    this.scene = this.CreateScene();

    // 启动渲染循环（每秒 60 帧）
    // render() 会被持续调用，更新画面
    this.engine.runRenderLoop(() => {
      this.scene.render();
    });
  }

  /**
   * 创建场景 - 搭建 3D 世界
   * @returns 配置好的 Scene 对象
   */
  CreateScene(): Scene {
    // 创建场景容器
    const scene = new Scene(this.engine);

    // 创建自由相机
    // 参数：名称, 初始位置 (x, y, z), 所属场景
    // 位置 (0, 1, -5) 表示：x=0, y=1（略高于地面）, z=-5（向后退5个单位）
    const camera = new FreeCamera("camera", new Vector3(0, 1, -5), this.scene);

    // 将相机控制绑定到 canvas，启用鼠标和键盘交互
    camera.attachControl();

    // 创建半球光（环境光）
    // 参数：名称, 光照方向（指向天空）, 所属场景
    // 半球光模拟天空散射光，不会产生阴影
    const hemiLight = new HemisphericLight(
      "hemiLight",
      new Vector3(0, 1, 0), // 指向上方（天空方向）
      this.scene
    );

    // 设置光照强度（0-1，默认 1）
    hemiLight.intensity = 0.5;

    // 创建地面
    // 参数：名称, 配置对象 { 宽度, 高度 }, 所属场景
    const ground = MeshBuilder.CreateGround(
      "ground",
      { width: 10, height: 10 }, // 10x10 的平面
      this.scene
    );

    // 创建球体
    // 参数：名称, 配置对象 { 直径 }, 所属场景
    const ball = MeshBuilder.CreateSphere("ball", { diameter: 1 }, this.scene);

    // 设置球体位置
    // y=1 使球体位于地面上方（球体半径 0.5 + 地面高度 0.5）
    ball.position = new Vector3(0, 1, 0);

    return scene;
  }
}