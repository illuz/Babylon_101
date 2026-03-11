/**
 * 自定义加载场景 - 完整的自定义加载屏幕实现
 *
 * 本示例展示了如何实现完全自定义的加载屏幕，包括：
 * 1. 创建自定义加载屏幕类（CustomLoadingScreen）
 * 2. 替换引擎默认的加载屏幕
 * 3. 实时跟踪和显示加载进度
 * 4. 实现平滑的加载完成过渡效果
 *
 * 工作流程：
 * 1. 创建 CustomLoadingScreen 实例
 * 2. 将自定义实例赋值给 engine.loadingScreen
 * 3. 调用 engine.displayLoadingUI() 显示加载界面
 * 4. 在模型加载的 onProgress 回调中更新进度
 * 5. 加载完成后调用 engine.hideLoadingUI() 隐藏加载界面
 */

import {
  Scene,
  Engine,
  FreeCamera,
  Vector3,
  CubeTexture,
  SceneLoader,
} from "@babylonjs/core";
import "@babylonjs/loaders";
import { CustomLoadingScreen } from "./CustomLoadingScreen";

/**
 * 自定义加载场景类
 *
 * 演示如何将自定义加载屏幕集成到 Babylon.js 场景中。
 * 支持实时进度更新和平滑的加载完成过渡。
 */
export class CustomLoading {
  scene: Scene;
  engine: Engine;

  /**
   * 自定义加载屏幕实例
   * 用于控制加载界面的显示、更新和隐藏
   */
  loadingScreen: CustomLoadingScreen;

  /**
   * 构造函数
   * @param canvas - 用于渲染的 HTML Canvas 元素
   * @param setLoaded - 加载完成后的回调函数，用于通知 Vue 组件更新状态
   * @param loadingBar - 可选：进度条 HTML 元素
   * @param percentLoaded - 可选：百分比文字 HTML 元素
   * @param loader - 可选：加载容器 HTML 元素
   */
  constructor(
    private canvas: HTMLCanvasElement,
    private setLoaded: () => void,
    private loadingBar?: HTMLElement,
    private percentLoaded?: HTMLElement,
    private loader?: HTMLElement
  ) {
    // 创建 Babylon.js 引擎，启用抗锯齿
    this.engine = new Engine(this.canvas, true);

    // 创建自定义加载屏幕实例
    // 传入 HTML 元素引用，用于控制 UI 更新
    this.loadingScreen = new CustomLoadingScreen(
      this.loadingBar,
      this.percentLoaded,
      this.loader
    );

    // 关键步骤：将引擎的默认加载屏幕替换为自定义加载屏幕
    // 这样调用 displayLoadingUI/hideLoadingUI 时会使用我们的自定义实现
    this.engine.loadingScreen = this.loadingScreen;

    // 显示加载界面
    // 这会调用 CustomLoadingScreen.displayLoadingUI() 方法
    this.engine.displayLoadingUI();

    // 创建场景
    this.scene = this.CreateScene();

    // 异步加载环境（包含进度回调）
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
    const envTex = CubeTexture.CreateFromPrefilteredData(
      "./environment/sky.env",
      scene
    );

    // 设置场景的环境贴图
    scene.environmentTexture = envTex;

    // 创建默认天空盒
    scene.createDefaultSkybox(envTex, true);

    // 设置环境光强度
    scene.environmentIntensity = 0.5;

    return scene;
  }

  /**
   * 创建环境 - 加载外部 3D 模型并跟踪进度
   *
   * 这是实现实时加载进度的关键方法。
   * 使用 SceneLoader.ImportMeshAsync 的 onProgress 回调来获取加载状态。
   *
   * 进度计算公式：(evt.loaded / evt.total) * 100
   * - evt.loaded: 已加载的字节数
   * - evt.total: 总字节数
   */
  async CreateEnvironment(): Promise<void> {
    await SceneLoader.ImportMeshAsync(
      "",                  // 空字符串表示加载模型中的所有网格
      "./models/",         // 模型文件所在目录
      "LightingScene.glb", // 模型文件名
      this.scene,          // 目标场景
      // onProgress 回调：实时跟踪加载进度
      (evt) => {
        // 计算加载百分比
        // evt.loaded 是已加载字节数，evt.total 是总字节数
        // toFixed() 将结果四舍五入为整数
        const loadStatus = ((evt.loaded * 100) / evt.total).toFixed();

        // 更新自定义加载屏幕的进度显示
        // 这会更新进度条宽度和百分比文字
        this.loadingScreen.updateLoadStatus(loadStatus);
      }
    );

    // 可选：如果使用 Vue 组件的加载状态，可以调用 setLoaded 回调
    // this.setLoaded();

    // 隐藏加载界面
    // 这会调用 CustomLoadingScreen.hideLoadingUI() 方法
    // 实现平滑的淡出过渡效果
    this.engine.hideLoadingUI();
  }
}