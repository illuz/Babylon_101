/**
 * Babylon.js 相机机制示例
 *
 * 本示例演示如何使用 ArcRotateCamera（弧形旋转相机）实现产品展示功能
 * 主要知识点：
 * 1. ArcRotateCamera 的基本设置（alpha、beta、radius 参数）
 * 2. 相机控制参数配置（wheelPrecision、minZ 等）
 * 3. 相机行为（AutoRotationBehavior、FramingBehavior）
 * 4. 相机限制（lowerRadiusLimit、upperRadiusLimit）
 * 5. 目标设置与产品展示最佳实践
 */

import {
  Scene,
  Engine,
  FreeCamera,
  Vector3,
  CubeTexture,
  SceneLoader,
  AbstractMesh,
  ArcRotateCamera,
} from "@babylonjs/core";
import "@babylonjs/loaders";

export class CameraMechanics {
  scene: Scene;
  engine: Engine;
  watch: AbstractMesh;
  camera: ArcRotateCamera;

  constructor(private canvas: HTMLCanvasElement) {
    // 创建 Babylon.js 渲染引擎，第二个参数 true 表示开启抗锯齿
    this.engine = new Engine(this.canvas, true);
    this.scene = this.CreateScene();
    // 显示加载界面，在模型加载完成前显示
    this.engine.displayLoadingUI();

    this.CreateCamera();

    this.CreateWatch();

    // 启动渲染循环
    this.engine.runRenderLoop(() => {
      this.scene.render();
    });
  }

  /**
   * 创建场景并设置环境
   * 使用预过滤的环境贴图创建逼真的反射效果
   */
  CreateScene(): Scene {
    const scene = new Scene(this.engine);

    // 从预过滤数据创建立方体贴图（环境贴图）
    // 这种格式专门用于 PBR 渲染，提供高质量的反射
    const envTex = CubeTexture.CreateFromPrefilteredData(
      "./environment/xmas_bg.env", // 环境贴图路径
      scene
    );

    // 设置环境贴图不在伽马空间中，对于 PBR 材质，通常设为 false
    envTex.gammaSpace = false;

    // 旋转环境贴图 180 度，用于调整背景的方向
    envTex.rotationY = Math.PI;

    // 将环境贴图应用到场景
    scene.environmentTexture = envTex;

    // 创建默认天空盒
    // 参数：环境贴图、是否使用 PBR 材质、天空盒大小、材质粗糙度
    scene.createDefaultSkybox(envTex, true, 1000, 0.25);

    return scene;
  }

  /**
   * 创建并配置 ArcRotateCamera（弧形旋转相机）
   *
   * ArcRotateCamera 是一种特殊的相机，它始终围绕一个目标点旋转
   * 非常适合产品展示、模型查看等场景
   *
   * 关键参数说明：
   * - alpha: 水平旋转角度（绕 Y 轴）
   * - beta: 垂直旋转角度（从 Y 轴向下）
   * - radius: 相机到目标点的距离
   */
  CreateCamera(): void {
    // 创建 ArcRotateCamera 实例
    // 参数：相机名称、alpha（水平角度）、beta（垂直角度）、radius（距离）、目标点、场景
    this.camera = new ArcRotateCamera(
      "camera",
      -Math.PI / 2, // alpha: 水平旋转 -90 度，使相机从正面观察
      Math.PI / 2, // beta: 垂直旋转 90 度，从侧面观察
      40, // radius: 相机距离目标的初始距离
      Vector3.Zero(), // target: 相机观察的目标点（世界坐标原点）
      this.scene
    );

    // 将相机控制附加到画布，第二个参数 true 表示使用 preventDefault
    this.camera.attachControl(this.canvas, true);

    // 设置鼠标滚轮精度，值越大缩放越慢越精细，产品展示建议设为 50-100
    this.camera.wheelPrecision = 100;

    // 设置近裁剪面距离，小于此距离的物体将被裁剪，产品展示设为较小值可近距离观察细节
    this.camera.minZ = 0.3;

    // 设置半径限制范围，防止相机太近穿透模型或太远
    this.camera.lowerRadiusLimit = 1; // 最小距离
    this.camera.upperRadiusLimit = 5; // 最大距离

    // 设置平移灵敏度，设为 0 禁用平移功能，产品展示通常不需要平移
    this.camera.panningSensibility = 0;

    // 启用自动旋转行为，当用户不操作时相机会自动缓慢旋转展示产品
    this.camera.useAutoRotationBehavior = true;

    // 配置自动旋转行为的参数
    this.camera.autoRotationBehavior.idleRotationSpeed = 0.5; // 闲置时的旋转速度
    this.camera.autoRotationBehavior.idleRotationSpinupTime = 1000; // 开始旋转前的加速时间（毫秒）
    this.camera.autoRotationBehavior.idleRotationWaitTime = 2000; // 用户停止操作后等待多久开始自动旋转（毫秒）
    this.camera.autoRotationBehavior.zoomStopsAnimation = true; // 用户缩放时是否停止自动旋转

    // 启用取景行为（Framing Behavior），自动调整相机以正确框住目标对象
    this.camera.useFramingBehavior = true;

    // framingTime: 取景动画的持续时间（毫秒）
    this.camera.framingBehavior.framingTime = 4000;
  }

  /**
   * 异步加载手表模型
   * 使用 GLTF 加载器加载 .glb 格式的 3D 模型
   */
  async CreateWatch(): Promise<void> {
    // 使用 SceneLoader 异步导入模型
    const { meshes } = await SceneLoader.ImportMeshAsync(
      "", // 网格名称（空字符串表示导入所有网格）
      "./models/", // 模型所在目录
      "vintage_watch.glb" // 模型文件名
    );

    // 保存主网格引用，meshes[0] 是模型的根节点或主网格
    this.watch = meshes[0];

    // 调试时可以显示网格的边界框
    // meshes[1].showBoundingBox = true;
    // meshes[2].showBoundingBox = true;
    // meshes[3].showBoundingBox = true;

    // 设置相机的目标为特定网格
    // 选择合适的网格作为目标可以确保相机聚焦在产品的重要部分
    this.camera.setTarget(meshes[2]);

    // 模型加载完成，隐藏加载界面
    this.engine.hideLoadingUI();
  }
}