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
 * CustomLoading 类 - 自定义加载屏幕完整示例
 *
 * 这个类展示了如何在 Babylon.js 中实现自定义加载屏幕：
 * 1. 创建并使用 CustomLoadingScreen 实例
 * 2. 将自定义加载屏幕绑定到 engine
 * 3. 在模型加载过程中实时更新进度条
 * 4. 加载完成后平滑淡出过渡
 *
 * 与默认加载屏幕的对比：
 * ┌─────────────────┬──────────────────────────────────┐
 * │ 默认加载屏幕     │ 黑色背景 + Babylon.js logo + 旋转动画 │
 * ├─────────────────┼──────────────────────────────────┤
 * │ 自定义加载屏幕   │ 任意 HTML/CSS 设计 + 进度条 + 动画   │
 * └─────────────────┴──────────────────────────────────┘
 */
export class CustomLoading {
  scene: Scene;
  engine: Engine;

  // 自定义加载屏幕实例
  loadingScreen: CustomLoadingScreen;

  /**
   * 构造函数
   *
   * @param canvas - 渲染用的 canvas 元素
   * @param setLoaded - 加载完成回调函数（用于通知 Vue 组件更新状态）
   * @param loadingBar - 加载进度条 HTML 元素（可选）
   * @param percentLoaded - 加载百分比文本 HTML 元素（可选）
   * @param loader - 加载器容器 HTML 元素（可选）
   */
  constructor(
    private canvas: HTMLCanvasElement,
    private setLoaded: () => void,
    private loadingBar?: HTMLElement,
    private percentLoaded?: HTMLElement,
    private loader?: HTMLElement
  ) {
    // ============================================================
    // 步骤 1: 创建渲染引擎
    // ============================================================
    this.engine = new Engine(this.canvas, true);

    // ============================================================
    // 步骤 2: 创建自定义加载屏幕实例
    // ============================================================
    // 将 Vue 组件中的 HTML 元素传递给 CustomLoadingScreen
    // 这些元素用于显示加载进度和百分比
    this.loadingScreen = new CustomLoadingScreen(
      this.loadingBar,
      this.percentLoaded,
      this.loader
    );

    // ============================================================
    // 步骤 3: 关键步骤 - 替换 engine 的默认加载屏幕
    // ============================================================
    // 将 engine.loadingScreen 属性设置为我们的自定义加载屏幕实例
    // 这样当调用 engine.displayLoadingUI() 时，会调用我们的自定义实现
    this.engine.loadingScreen = this.loadingScreen;

    // ============================================================
    // 步骤 4: 显示加载界面
    // ============================================================
    // 这会调用 CustomLoadingScreen.displayLoadingUI()
    // 初始化进度条为 0%
    this.engine.displayLoadingUI();

    // 创建场景
    this.scene = this.CreateScene();

    // 开始加载环境（异步）
    this.CreateEnvironment();

    // 启动渲染循环
    this.engine.runRenderLoop(() => {
      this.scene.render();
    });
  }

  /**
   * 创建场景 - 包含相机和环境贴图
   *
   * @returns 配置好的 Scene 实例
   */
  CreateScene(): Scene {
    const scene = new Scene(this.engine);

    // 创建自由相机
    // 位置设置在场景中心偏后，方便观察模型
    const camera = new FreeCamera(
      "camera",
      new Vector3(0, 0.75, -8),
      this.scene
    );

    // 将相机控制绑定到 canvas
    camera.attachControl();

    // 设置相机移动速度
    camera.speed = 0.25;

    // ============================================================
    // 创建环境贴图和天空盒
    // ============================================================
    // 使用预过滤的环境贴图（.env 格式）
    // 这种格式优化了反射和光照质量
    const envTex = CubeTexture.CreateFromPrefilteredData(
      "./environment/sky.env",
      scene
    );

    // 设置场景的环境贴图
    // 用于 PBR 材质的反射和环境光照
    scene.environmentTexture = envTex;

    // 创建默认天空盒
    // 第二个参数 true 表示使用 HDR 纹理
    scene.createDefaultSkybox(envTex, true);

    // 设置环境光照强度
    // 0.5 是一个适中的值，避免过亮或过暗
    scene.environmentIntensity = 0.5;

    return scene;
  }

  /**
   * 创建场景环境 - 异步加载 3D 模型并更新进度
   *
   * 这个方法展示了如何使用 onProgress 回调来实时更新加载进度
   */
  async CreateEnvironment(): Promise<void> {
    // ============================================================
    // 异步加载模型 + 进度回调
    // ============================================================
    // SceneLoader.ImportMeshAsync 参数说明：
    // - 第1个参数：要加载的网格名称（空字符串 = 加载所有）
    // - 第2个参数：模型文件所在目录
    // - 第3个参数：模型文件名
    // - 第4个参数：目标场景
    // - 第5个参数：onProgress 回调函数（可选）
    await SceneLoader.ImportMeshAsync(
      "",
      "./models/",
      "LightingScene.glb",
      this.scene,
      // ============================================================
      // onProgress 回调 - 实时更新加载进度
      // ============================================================
      // evt 对象包含：
      // - evt.loaded: 已加载的字节数
      // - evt.total: 总字节数
      (evt) => {
        // 计算加载百分比
        // 公式：(已加载 / 总大小) * 100
        // toFixed() 返回字符串，保留整数部分
        const loadStatus = ((evt.loaded * 100) / evt.total).toFixed();

        // 调用自定义加载屏幕的更新方法
        // 这会更新进度条宽度和百分比文本
        this.loadingScreen.updateLoadStatus(loadStatus);
      }
    );

    // ============================================================
    // 加载完成处理
    // ============================================================
    // 可以选择使用回调函数通知 Vue 组件
    // this.setLoaded();

    // 或者直接使用 engine 的 hideLoadingUI()
    // 这会调用 CustomLoadingScreen.hideLoadingUI()
    // 实现淡出动画并最终隐藏加载器
    this.engine.hideLoadingUI();
  }
}
