/**
 * 原型关卡示例
 *
 * 这是一个简单的场景加载示例，用于测试第一人称控制器。
 * 从 GLB 文件加载 3D 场景模型。
 *
 * 关键概念：
 * - SceneLoader: 用于加载外部 3D 模型文件
 * - GLB 格式: glTF 二进制格式，包含模型、材质和动画
 */

import { Scene, Engine, SceneLoader } from "@babylonjs/core";
import "@babylonjs/loaders";

/**
 * 原型关卡类
 *
 * 用于加载和显示简单的 3D 关卡场景
 */
export class PrototypeLevel {
  scene: Scene;
  engine: Engine;

  /**
   * 构造函数
   * @param canvas - 用于渲染的 canvas 元素
   */
  constructor(private canvas: HTMLCanvasElement) {
    // 创建 Babylon.js 引擎
    this.engine = new Engine(this.canvas, true);
    // 创建场景
    this.scene = this.CreateScene();

    // 启动渲染循环
    this.engine.runRenderLoop(() => {
      this.scene.render();
    });
  }

  /**
   * 创建基础场景
   * @returns 创建的场景对象
   */
  CreateScene(): Scene {
    const scene = new Scene(this.engine);

    // 注意：这个示例没有添加光源
    // 如果模型没有内置光照信息，场景可能会很暗

    return scene;
  }

  /**
   * 创建环境：加载 3D 模型
   *
   * 使用 SceneLoader 加载 GLB 格式的 3D 模型
   * GLB 是 glTF 的二进制格式，适合网络传输
   */
  async CreateEnvironment(): Promise<void> {
    // 异步加载模型
    // 参数说明：
    // - "": 空字符串表示加载所有网格
    // - "./models/": 模型文件所在目录
    // - "Prototype_Level.glb": 模型文件名
    // - this.scene: 目标场景
    const { meshes } = await SceneLoader.ImportMeshAsync(
      "",
      "./models/",
      "Prototype_Level.glb",
      this.scene
    );

    // meshes 数组包含加载的所有网格
    // 可以在这里对网格进行进一步处理
    // 例如：添加碰撞检测、调整位置等
  }
}
