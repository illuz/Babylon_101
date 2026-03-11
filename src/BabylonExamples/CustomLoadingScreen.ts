/**
 * 自定义加载屏幕 - 实现 ILoadingScreen 接口
 *
 * 本类展示了如何创建自定义加载屏幕来替代 Babylon.js 默认的加载界面。
 *
 * 关键概念：
 * 1. ILoadingScreen 接口：Babylon.js 定义的标准加载屏幕接口
 * 2. displayLoadingUI()：显示加载界面时调用
 * 3. hideLoadingUI()：隐藏加载界面时调用
 * 4. loadingUIBackgroundColor：背景颜色属性（接口要求必须实现）
 * 5. loadingUIText：加载文字属性（接口要求必须实现）
 *
 * 使用方法：
 * - 创建此类的实例，传入需要控制的 HTML 元素
 * - 将实例赋值给 engine.loadingScreen
 * - 调用 engine.displayLoadingUI() 和 engine.hideLoadingUI()
 */

import { ILoadingScreen } from "@babylonjs/core";

/**
 * 自定义加载屏幕类
 *
 * 实现 ILoadingScreen 接口，允许完全自定义加载界面。
 * 通过操作 DOM 元素来控制加载进度显示和过渡效果。
 */
export class CustomLoadingScreen implements ILoadingScreen {
  /**
   * 加载界面背景颜色
   * 这是接口要求的属性，可以直接设置或忽略
   */
  loadingUIBackgroundColor: string;

  /**
   * 加载界面显示的文字
   * 这是接口要求的属性，可以直接设置或忽略
   */
  loadingUIText: string;

  /**
   * 构造函数
   * @param loadingBar - 进度条 HTML 元素，宽度会根据加载进度动态调整
   * @param percentLoaded - 百分比文字 HTML 元素，显示当前加载百分比
   * @param loader - 加载容器 HTML 元素，用于控制整体显示/隐藏和过渡动画
   */
  constructor(
    private loadingBar: HTMLElement,
    private percentLoaded: HTMLElement,
    private loader: HTMLElement
  ) {}

  /**
   * 显示加载界面
   *
   * 当调用 engine.displayLoadingUI() 时，引擎会自动调用此方法。
   * 在这里初始化加载状态：将进度条和百分比重置为 0%。
   */
  displayLoadingUI(): void {
    // 初始化进度条宽度为 0%
    this.loadingBar.style.width = "0%";
    // 初始化百分比文字为 0%
    this.percentLoaded.innerText = "0%";
  }

  /**
   * 隐藏加载界面
   *
   * 当调用 engine.hideLoadingUI() 时，引擎会自动调用此方法。
   * 实现平滑的淡出过渡效果：
   * 1. 首先通过更改 ID 触发 CSS 过渡动画（透明度渐变）
   * 2. 等待 1 秒后设置 display: none，完全移除加载界面
   *
   * 这样用户可以看到一个平滑的淡出效果，而不是突然消失。
   */
  hideLoadingUI(): void {
    // 更改元素 ID 为 "loaded"，触发 CSS 过渡动画
    // CSS 中应该定义 #loaded { opacity: 0; transition: opacity 1s; }
    this.loader.id = "loaded";

    // 等待 1 秒（与 CSS 过渡时间匹配）后隐藏元素
    // 这样淡出动画完成后，元素才真正从布局中移除
    setTimeout(() => {
      this.loader.style.display = "none";
    }, 1000);
  }

  /**
   * 更新加载状态
   *
   * 这不是 ILoadingScreen 接口的方法，而是我们自定义的辅助方法。
   * 用于在加载过程中实时更新进度条和百分比显示。
   *
   * @param status - 加载进度百分比字符串（如 "50"）
   *
   * 使用方法：
   * 在 SceneLoader.ImportMeshAsync 的 onProgress 回调中调用此方法：
   * ```typescript
   * await SceneLoader.ImportMeshAsync(..., this.scene, (evt) => {
   *   const loadStatus = ((evt.loaded * 100) / evt.total).toFixed();
   *   this.loadingScreen.updateLoadStatus(loadStatus);
   * });
   * ```
   */
  updateLoadStatus(status: string): void {
    // 使用模板字符串设置进度条宽度
    this.loadingBar.style.width = `${status}%`;
    // 更新百分比文字显示
    this.percentLoaded.innerText = `${status}%`;
  }
}