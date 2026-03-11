import {
  Scene,
  Engine,
  FreeCamera,
  Vector3,
  CubeTexture,
  SceneLoader,
  AnimationGroup,
  AsyncCoroutine,
} from "@babylonjs/core";
import "@babylonjs/loaders";

/**
 * 动画混合（Animation Blending）示例类
 *
 * 动画混合是角色动画系统中的核心技术，允许在同一骨架上同时播放多个动画，
 * 并通过权重控制它们的影响力，实现平滑的动画过渡效果。
 *
 * 本示例演示：
 * - 使用协程（Coroutine）实现逐帧的动画权重调整
 * - 在空闲（Idle）和奔跑（Run）动画之间平滑过渡
 * - 理解动画权重的工作原理（0 = 无影响，1 = 完全影响）
 */
export class AnimBlending {
  scene: Scene;
  engine: Engine;

  constructor(private canvas: HTMLCanvasElement) {
    this.engine = new Engine(this.canvas, true);
    this.scene = this.CreateScene();
    this.CreateEnvironment();
    this.CreateCharacter();

    this.engine.runRenderLoop(() => {
      this.scene.render();
    });
  }

  /**
   * 创建场景和相机
   */
  CreateScene(): Scene {
    const scene = new Scene(this.engine);

    // 创建环境贴图（HDR天空盒）
    const envTex = CubeTexture.CreateFromPrefilteredData(
      "./environment/sky.env",
      scene
    );

    envTex.gammaSpace = false;
    envTex.rotationY = Math.PI / 2;
    scene.environmentTexture = envTex;
    scene.createDefaultSkybox(envTex, true, 1000, 0.25);

    // 创建自由相机，用于观察角色
    const camera = new FreeCamera("camera", new Vector3(0, 2, -6), this.scene);
    camera.attachControl();
    camera.minZ = 0.5;
    camera.speed = 0.5;

    return scene;
  }

  /**
   * 加载环境场景
   */
  async CreateEnvironment(): Promise<void> {
    await SceneLoader.ImportMeshAsync("", "./models/", "Prototype_Level.glb");
  }

  /**
   * 创建角色并设置动画混合
   *
   * 动画混合的核心概念：
   * 1. 动画组（AnimationGroup）：包含一组相关的动画轨道
   * 2. 权重（Weight）：0-1之间的值，表示动画对骨架的影响力
   * 3. 当多个动画同时播放时，它们的权重值会影响最终的动作表现
   *
   * 混合原理：
   * - 权重 1 = 该动画完全影响角色动作
   * - 权重 0 = 该动画对角色动作无影响
   * - 权重 0.5 = 两个动画各占一半影响力，产生混合效果
   */
  async CreateCharacter(): Promise<void> {
    // 加载角色模型及其动画组
    // character_blending.glb 包含两个动画：idle（空闲）和 run（奔跑）
    const { meshes, animationGroups } = await SceneLoader.ImportMeshAsync(
      "",
      "./models/",
      "character_blending.glb"
    );

    // 旋转角色使其面向相机
    meshes[0].rotate(Vector3.Up(), -Math.PI);

    // 获取动画组引用
    // animationGroups 数组的顺序取决于模型文件中动画的定义顺序
    const idle = animationGroups[0];  // 空闲动画
    const run = animationGroups[1];   // 奔跑动画

    // 设置鼠标点击事件来触发动画混合
    this.scene.onPointerDown = (evt) => {
      // 中键点击：从 Idle 过渡到 Run
      // 权重变化：idle(1->0), run(0->1)
      if (evt.button === 1)
        this.scene.onBeforeRenderObservable.runCoroutineAsync(
          this.animationBlending(run, idle)
        );

      // 左键点击：从 Run 过渡到 Idle
      // 权重变化：run(1->0), idle(0->1)
      if (evt.button === 0)
        this.scene.onBeforeRenderObservable.runCoroutineAsync(
          this.animationBlending(idle, run)
        );
    };
  }

  /**
   * 动画混合协程（Coroutine）
   *
   * 协程是一种特殊的函数，可以暂停执行并稍后恢复。
   * 在 Babylon.js 中，协程与渲染循环配合使用，实现逐帧的动画效果。
   *
   * @param toAnim - 目标动画（将要过渡到的动画）
   * @param fromAnim - 源动画（当前正在播放的动画）
   * @returns AsyncCoroutine - 异步协程类型
   *
   * 权重混合原理：
   * - currentWeight: 当前动画的权重（从 1 递减到 0）
   * - newWeight: 目标动画的权重（从 0 递增到 1）
   *
   * 平滑过渡的实现：
   * - 每帧调整 0.01 的权重值（可调整此值改变过渡速度）
   * - 较小的值产生更平滑、更长的过渡
   * - 较大的值产生更快、更明显的过渡
   *
   * yield 关键字：
   * - 暂停协程执行，等待下一帧
   * - 在 60 FPS 下，每次 yield 约等待 16.67ms
   * - 这确保动画混合在多个帧中逐步完成，而非瞬间完成
   */
  *animationBlending(
    toAnim: AnimationGroup,
    fromAnim: AnimationGroup
  ): AsyncCoroutine<void> {
    // 初始化权重值
    let currentWeight = 1;  // 当前动画的权重，初始为完全影响
    let newWeight = 0;      // 目标动画的权重，初始为无影响

    // 播放目标动画（必须播放才能应用权重）
    // true 参数表示循环播放
    toAnim.play(true);

    // 循环直到目标动画权重达到 1（完全过渡）
    while (newWeight < 1) {
      // 递增目标动画的权重
      newWeight += 0.01;
      // 递减当前动画的权重
      currentWeight -= 0.01;

      // 设置动画权重
      // setWeightForAllAnimatables 会将权重应用到该动画组的所有可动画对象
      toAnim.setWeightForAllAnimatables(newWeight);
      fromAnim.setWeightForAllAnimatables(currentWeight);

      // yield 暂停协程，等待下一帧继续执行
      // 这是实现逐帧动画混合的关键
      yield;
    }
  }
}
