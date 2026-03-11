/**
 * 加载场景演示 - 展示 Babylon.js 内置加载屏幕的基础用法
 *
 * 本示例演示：
 * 1. 使用 Engine 的 displayLoadingUI() 显示内置加载界面
 * 2. 使用 Engine 的 hideLoadingUI() 隐藏加载界面
 * 3. 加载 GLB 模型时的加载状态管理
 */

import {
  Scene,
  Engine,
  FreeCamera,
  Vector3,
  MeshBuilder,
  CubeTexture,
  SceneLoader,
} from "@babylonjs/core";
import "@babylonjs/loaders";

/**
 * 加载场景演示类
 *
 * 用于展示 Babylon.js 默认加载屏幕的使用方法。
 * 默认加载屏幕包含 Babylon.js logo 和旋转动画。
 */
export class LoadingSceneDemo {
  scene: Scene;
  engine: Engine;

  /**
   * 构造函数
   * @param canvas - 用于渲染的 HTML Canvas 元素
   */
  constructor(private canvas: HTMLCanvasElement) {
    // 创建 Babylon.js 引擎，启用抗锯齿
    this.engine = new Engine(this.canvas, true);

    // 创建场景
    this.scene = this.CreateScene();

    // 异步加载环境（模型等资源）
    this.CreateEnvironment();

    // 启动渲染循环，持续渲染场景
    this.engine.runRenderLoop(() => {
      this.scene.render();
    });
  }

  /**
   * 创建场景
   * @returns 配置好的 Scene 对象
   *
   * 场景配置包括：
   * - 自由相机：允许用户控制视角
   * - 环境贴图：用于 PBR 材质的光照计算
   * - 天空盒：提供背景环境
   */
  CreateScene(): Scene {
    const scene = new Scene(this.engine);

    // 创建自由相机，设置初始位置
    const camera = new FreeCamera(
      "camera",
      new Vector3(0, 0.75, -8),
      this.scene
    );
    camera.attachControl();  // 将相机控制附加到 canvas
    camera.speed = 0.25;     // 设置移动速度

    // 从预过滤数据创建环境贴图
    // 这种格式 (.env) 专为实时渲染优化，包含多级模糊版本
    const envTex = CubeTexture.CreateFromPrefilteredData(
      "./environment/sky.env",
      scene
    );

    // 设置场景的环境贴图，用于 PBR 材质的光照反射
    scene.environmentTexture = envTex;

    // 创建默认天空盒，基于环境贴图
    // 第二个参数 true 表示自动调整大小以覆盖整个场景
    scene.createDefaultSkybox(envTex, true);

    // 设置环境光强度
    scene.environmentIntensity = 0.5;

    return scene;
  }

  /**
   * 创建环境 - 加载外部 3D 模型
   *
   * 使用 SceneLoader.ImportMeshAsync 异步加载 GLB 格式的 3D 模型。
   * 加载较大模型时，用户会看到 Babylon.js 默认的加载界面。
   *
   * 注意：本示例未实现自定义加载屏幕，仅展示默认加载行为。
   * 如需自定义加载界面，请参考 CustomLoading.ts 示例。
   */
  async CreateEnvironment(): Promise<void> {
    await SceneLoader.ImportMeshAsync(
      "",                  // 空字符串表示加载模型中的所有网格
      "./models/",         // 模型文件所在目录
      "LightingScene.glb"  // 模型文件名
    );
  }
}