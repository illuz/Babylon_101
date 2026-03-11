/**
 * MeshActions - Babylon.js 网格动作示例
 *
 * 本课程演示如何使用 ActionManager 为网格对象添加交互性。
 * ActionManager 是 Babylon.js 中处理用户交互的核心系统，
 * 允许我们通过简单的配置实现点击、悬停等交互效果。
 *
 * 核心概念：
 * - ActionManager: 动作管理器，负责管理和触发动作
 * - Trigger: 触发器，定义何时执行动作（如点击、悬停、每帧等）
 * - Action: 动作，定义要执行的操作（如设置值、插值、增量等）
 */

import {
  AbstractMesh,
  ActionManager,
  Color3,
  CubeTexture,
  Engine,
  FreeCamera,
  IncrementValueAction,
  InterpolateValueAction,
  PBRMaterial,
  Scene,
  SceneLoader,
  SetValueAction,
  Vector3,
} from "@babylonjs/core";
import "@babylonjs/loaders";

export class MeshActions {
  // Babylon.js 引擎实例
  engine: Engine;
  // 场景实例
  scene: Scene;
  // 立方体网格 - 用于演示 SetValueAction
  cube: AbstractMesh;
  // 球体网格 - 用于演示 InterpolateValueAction
  sphere: AbstractMesh;
  // 圆柱体网格 - 用于演示 IncrementValueAction
  cylinder: AbstractMesh;
  // 球体的 PBR 材质 - 用于演示材质属性插值
  sphereMat: PBRMaterial;

  constructor(private canvas: HTMLCanvasElement) {
    // 初始化 Babylon.js 引擎
    this.engine = new Engine(this.canvas);
    // 创建场景
    this.scene = this.CreateScene();

    // 异步加载网格模型
    this.CreateMeshes();

    // 启动渲染循环
    // 每帧调用 scene.render() 来更新画面
    this.engine.runRenderLoop(() => {
      this.scene.render();
    });
  }

  /**
   * 创建场景
   * 设置相机、环境贴图和天空盒
   */
  CreateScene(): Scene {
    const scene = new Scene(this.engine);

    // 创建自由相机（静态相机，不需要用户控制）
    // 参数：名称、位置、所属场景
    new FreeCamera("camera", new Vector3(0, 0, -8), this.scene);

    // 加载预过滤的环境贴图
    // 环境贴图用于 PBR 材质的环境光照和反射
    const envTex = CubeTexture.CreateFromPrefilteredData(
      "./environment/xmas_bg.env",
      scene
    );

    // 将环境贴图应用到场景
    scene.environmentTexture = envTex;

    // 创建默认天空盒
    // 参数：环境贴图、是否自动调整大小、天空盒大小、模糊程度、是否使用 HDR
    scene.createDefaultSkybox(envTex, true, 1000, 0.2, true);

    // 设置环境光照强度
    scene.environmentIntensity = 1.5;

    return scene;
  }

  /**
   * 创建网格和材质
   * 从 GLB 文件加载模型，并设置初始属性
   */
  async CreateMeshes(): Promise<void> {
    // 创建球体的 PBR 材质
    // PBR（Physically Based Rendering）材质提供更真实的光照效果
    this.sphereMat = new PBRMaterial("sphereMat", this.scene);
    // 设置基础颜色（反照率颜色）为红色
    this.sphereMat.albedoColor = new Color3(1, 0, 0);
    // 设置粗糙度为 1（完全粗糙，无光泽）
    // 粗糙度范围：0（镜面反射）到 1（完全漫反射）
    this.sphereMat.roughness = 1;

    // 从 GLB 文件异步加载网格模型
    // gifts.glb 包含三个网格：立方体、球体、圆柱体
    const { meshes } = await SceneLoader.ImportMeshAsync(
      "", // 空字符串表示加载所有网格
      "./models/", // 模型路径
      "gifts.glb", // 模型文件名
      this.scene
    );

    // 获取各个网格的引用
    // meshes[0] 是根节点，meshes[1-3] 是实际的网格
    this.cube = meshes[1];
    this.sphere = meshes[2];
    this.cylinder = meshes[3];

    // 设置圆柱体的初始旋转角度
    // 绕 X 轴旋转 -45 度，使其倾斜朝向相机
    this.cylinder.rotation = new Vector3(-Math.PI / 4, 0, 0);

    // 将自定义材质应用到球体
    this.sphere.material = this.sphereMat;

    // 创建交互动作
    this.CreateActions();
  }

  /**
   * 创建交互动作
   *
   * ActionManager 工作原理：
   * 1. 为网格或场景创建 ActionManager 实例
   * 2. 使用 registerAction() 注册动作
   * 3. 每个动作需要指定触发器（Trigger）和具体操作
   *
   * 常用触发器（Trigger）：
   * - OnPickDownTrigger: 鼠标点击按下时触发
   * - OnPickUpTrigger: 鼠标点击释放时触发
   * - OnPointerOverTrigger: 鼠标悬停时触发
   * - OnPointerOutTrigger: 鼠标移出时触发
   * - OnEveryFrameTrigger: 每帧触发（场景级动作）
   * - NothingTrigger: 无触发器（用于链式动作的后续动作）
   *
   * 常用动作（Action）：
   * - SetValueAction: 直接设置属性值
   * - InterpolateValueAction: 在指定时间内平滑过渡属性值
   * - IncrementValueAction: 每次触发时增加属性值
   */
  CreateActions(): void {
    // ========================================
    // 为每个网格和场景创建 ActionManager
    // ========================================

    // 立方体的动作管理器
    this.cube.actionManager = new ActionManager(this.scene);

    // 球体的动作管理器
    this.sphere.actionManager = new ActionManager(this.scene);

    // 场景的动作管理器（用于场景级触发器，如每帧更新）
    this.scene.actionManager = new ActionManager(this.scene);

    // ========================================
    // 示例 1: SetValueAction - 直接设置属性值
    // ========================================
    // 点击立方体时，将其缩放设置为 1.5 倍
    //
    // SetValueAction 参数说明：
    // - trigger: 触发器（OnPickDownTrigger = 鼠标点击按下）
    // - target: 目标对象（要修改属性的对象）
    // - propertyPath: 属性路径（字符串形式，如 "scaling"）
    // - value: 要设置的值
    this.cube.actionManager.registerAction(
      new SetValueAction(
        ActionManager.OnPickDownTrigger, // 触发器：点击时
        this.cube, // 目标：立方体
        "scaling", // 属性：缩放
        new Vector3(1.5, 1.5, 1.5) // 值：1.5 倍缩放
      )
    );

    // ========================================
    // 示例 2: InterpolateValueAction - 平滑插值
    // ========================================
    // 点击球体时，在 3 秒内将粗糙度从 1 平滑过渡到 0
    // 再次点击时，在 1 秒内将粗糙度从 0 恢复到 1
    //
    // InterpolateValueAction 参数说明：
    // - trigger: 触发器
    // - target: 目标对象（这里是材质，不是网格）
    // - propertyPath: 属性路径
    // - value: 目标值
    // - duration: 过渡时间（毫秒）
    //
    // .then() 方法用于链式调用，创建连续动作
    // 第一个动作完成后，第二个动作等待下次触发
    this.sphere.actionManager
      .registerAction(
        new InterpolateValueAction(
          ActionManager.OnPickDownTrigger, // 触发器：点击时
          this.sphereMat, // 目标：球体材质
          "roughness", // 属性：粗糙度
          0, // 目标值：0（镜面反射效果）
          3000 // 过渡时间：3000 毫秒（3 秒）
        )
      )
      // 链式动作：第二次点击时执行
      // NothingTrigger 表示不使用特定触发器，而是跟随前一个动作
      .then(
        new InterpolateValueAction(
          ActionManager.NothingTrigger, // 无触发器（链式调用）
          this.sphereMat, // 目标：球体材质
          "roughness", // 属性：粗糙度
          1, // 目标值：1（完全粗糙）
          1000 // 过渡时间：1000 毫秒（1 秒）
        )
      );

    // ========================================
    // 示例 3: IncrementValueAction - 增量更新
    // ========================================
    // 每帧增加圆柱体的 X 轴旋转角度，实现持续旋转动画
    //
    // IncrementValueAction 参数说明：
    // - trigger: 触发器（OnEveryFrameTrigger = 每帧触发）
    // - target: 目标对象
    // - propertyPath: 属性路径（支持嵌套属性，如 "rotation.x"）
    // - value: 每次增加的值
    //
    // 注意：OnEveryFrameTrigger 是场景级触发器
    // 每帧都会执行（60 FPS 时每秒执行 60 次）
    // 因此增量值要很小（0.01），否则旋转会太快
    this.scene.actionManager.registerAction(
      new IncrementValueAction(
        ActionManager.OnEveryFrameTrigger, // 触发器：每帧
        this.cylinder, // 目标：圆柱体
        "rotation.x", // 属性：X 轴旋转
        -0.01 // 增量：每帧减少 0.01（负值表示反向旋转）
      )
    );
  }
}
