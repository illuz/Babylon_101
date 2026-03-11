/**
 * Babylon.js 相机演示 - 基础版本
 *
 * 本示例展示了使用 FreeCamera（自由相机）的基础场景
 * FreeCamera 适合用于：第一人称漫游、建筑可视化、大场景导航
 * 对于产品展示，建议使用 ArcRotateCamera（见 CameraMechanics.ts）
 */

import {
  Scene,
  Engine,
  FreeCamera,
  Vector3,
  CubeTexture,
  SceneLoader,
  AbstractMesh,
} from "@babylonjs/core";
import "@babylonjs/loaders";

export class CameraDemo {
  scene: Scene;
  engine: Engine;
  watch: AbstractMesh;

  constructor(private canvas: HTMLCanvasElement) {
    // 创建渲染引擎，第二个参数 true 表示开启抗锯齿
    this.engine = new Engine(this.canvas, true);
    this.scene = this.CreateScene();

    this.CreateCamera();

    // 显示加载界面
    this.engine.displayLoadingUI();

    this.CreateWatch();

    // 启动渲染循环
    this.engine.runRenderLoop(() => {
      this.scene.render();
    });
  }

  /**
   * 创建场景，设置环境贴图和天空盒
   */
  CreateScene(): Scene {
    const scene = new Scene(this.engine);

    // 创建环境贴图
    const envTex = CubeTexture.CreateFromPrefilteredData(
      "./environment/xmas_bg.env",
      scene
    );

    // 设置伽马空间，对于 PBR 材质通常设为 false
    envTex.gammaSpace = false;

    // 应用环境贴图到场景
    scene.environmentTexture = envTex;

    // 创建天空盒
    scene.createDefaultSkybox(envTex, true, 1000, 0.25);

    return scene;
  }

  /**
   * 创建 FreeCamera（自由相机）
   *
   * FreeCamera 特点：
   * - 允许用户自由移动和旋转相机
   * - 使用 WASD 或方向键移动，鼠标控制视角
   * - 适合大场景漫游，不适合产品展示
   */
  CreateCamera(): void {
    // 创建 FreeCamera
    // 参数：相机名称、相机初始位置、所属场景
    const camera = new FreeCamera("camera", new Vector3(0, 0, -2), this.scene);

    // 将相机控制附加到画布，启用键盘和鼠标控制
    camera.attachControl();

    // 设置相机移动速度，值越小移动越慢，适合精细观察
    camera.speed = 0.25;
  }

  /**
   * 加载手表模型
   */
  async CreateWatch(): Promise<void> {
    // 异步导入 GLB 模型
    const { meshes } = await SceneLoader.ImportMeshAsync(
      "",
      "./models/",
      "Vintage_Watch.glb"
    );

    // 保存主网格引用
    this.watch = meshes[0];

    // 隐藏加载界面
    this.engine.hideLoadingUI();
  }
}