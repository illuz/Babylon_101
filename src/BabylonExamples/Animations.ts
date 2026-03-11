import {
  Scene,
  Engine,
  SceneLoader,
  FreeCamera,
  Vector3,
  CubeTexture,
  AbstractMesh,
  Animation,
  Mesh,
} from "@babylonjs/core";
import "@babylonjs/loaders";

/**
 * Babylon.js 基础动画教程
 *
 * 本类演示 Babylon.js 中动画系统的核心概念：
 * 1. Animation 类 - 动画的基本构建单元
 * 2. 动画类型 - FLOAT(单值) 和 VECTOR3(三维向量)
 * 3. 关键帧系统 - 定义动画的时间点和对应值
 * 4. 循环模式 - CYCLE(循环) 和 CONSTANT(单次播放)
 * 5. 动画控制 - 播放、停止、异步等待
 * 6. 动画回调 - 动画结束时的回调函数
 */
export class Animations {
  scene: Scene;
  engine: Engine;
  target: AbstractMesh; // 目标网格对象，将对其应用动画

  constructor(private canvas: HTMLCanvasElement) {
    this.engine = new Engine(this.canvas, true);
    this.scene = this.CreateScene();
    this.CreateEnvironment();
    this.CreateTarget();

    this.engine.runRenderLoop(() => {
      this.scene.render();
    });
  }

  /**
   * 创建场景和天空盒
   * 使用 CubeTexture 创建环境贴图和天空盒
   */
  CreateScene(): Scene {
    const scene = new Scene(this.engine);

    // 创建预过滤的环境贴图（用于 PBR 渲染）
    const envTex = CubeTexture.CreateFromPrefilteredData(
      "./environment/sky.env",
      scene
    );

    envTex.gammaSpace = false;
    envTex.rotationY = Math.PI / 2;

    scene.environmentTexture = envTex;

    // 创建默认天空盒（true: 使用 HDR, 1000: 天空盒大小, 0.25: 粗糙度）
    scene.createDefaultSkybox(envTex, true, 1000, 0.25);

    // 创建自由相机（可自由移动观察）
    const camera = new FreeCamera("camera", new Vector3(0, 2, -10), this.scene);
    camera.attachControl();
    camera.minZ = 0.5;
    camera.speed = 0.5;

    return scene;
  }

  /**
   * 异步加载环境模型
   * 使用 SceneLoader 导入 GLB 格式的场景模型
   */
  async CreateEnvironment(): Promise<void> {
    await SceneLoader.ImportMeshAsync(
      "",
      "./models/",
      "Prototype_Level.glb",
      this.scene
    );
  }

  /**
   * 创建并合并目标网格
   *
   * 重要概念：当导入的模型包含多个材质（多个子网格）时，
   * 需要使用 Mesh.MergeMeshes 将它们合并为单个网格才能正确应用动画。
   *
   * 参数说明：
   * - meshes: 要合并的网格数组
   * - disposeSource: 是否销毁源网格（true）
   * - allow32BitsIndices: 是否允许32位索引（true，用于复杂网格）
   * - meshSubclass: 网格子类（undefined）
   * - subdivideWithSubMeshes: 是否使用子网格细分（false）
   * - multiMultiMaterials: 是否保留多材质（true，重要！保留原有材质）
   */
  async CreateTarget(): Promise<void> {
    const { meshes } = await SceneLoader.ImportMeshAsync(
      "",
      "./models/",
      "target.glb",
      this.scene
    );

    // 移除第一个元素（根节点），只保留实际的网格数据
    meshes.shift();

    // 合并多个子网格为单个网格（因为模型有多个材质）
    this.target = Mesh.MergeMeshes(
      meshes as Mesh[],
      true,    // disposeSource - 销毁源网格
      true,    // allow32BitsIndices - 允许32位索引
      undefined,
      false,   // subdivideWithSubMeshes
      true     // multiMultiMaterials - 保留多材质
    );

    // 设置目标位置（在地面之上）
    this.target.position.y = 3;

    // 创建动画
    this.CreateAnimations();
  }

  /**
   * 创建动画的核心方法
   *
   * Babylon.js 动画系统核心概念：
   *
   * 1. Animation 构造函数参数：
   *    - name: 动画名称（字符串）
   *    - targetProperty: 目标属性（字符串）
   *      * "rotation.z" - 绕 Z 轴旋转（单值）
   *      * "position" - 位置（Vector3）
   *      * "visibility" - 可见度（0-1）
   *    - framePerSecond: 帧率（通常60fps）
   *    - dataType: 数据类型
   *      * Animation.ANIMATIONTYPE_FLOAT - 浮点数
   *      * Animation.ANIMATIONTYPE_VECTOR3 - 三维向量
   *    - loopMode: 循环模式
   *      * ANIMATIONLOOPMODE_CYCLE - 循环播放
   *      * ANIMATIONLOOPMODE_CONSTANT - 单次播放后保持最终值
   *
   * 2. 关键帧（Keyframes）：
   *    - 每个关键帧包含 frame（帧号）和 value（值）
   *    - 帧号与时间的关系：时间(秒) = 帧号 / FPS
   *    - 例如：60fps 下，frame 180 = 3秒
   *
   * 3. 动画播放方式：
   *    - beginAnimation: 播放目标对象上的所有动画
   *    - beginDirectAnimation: 播放指定的动画数组
   *
   * 4. 动画控制：
   *    - 返回 Animatable 对象，可调用 stop()、pause() 等方法
   *    - waitAsync(): 返回 Promise，等待动画完成
   */
  CreateAnimations(): void {
    // 关键帧数组 - 定义动画的时间点和值
    const rotateFrames = [];
    const slideFrames = [];
    const fadeFrames = [];
    const fps = 60; // 帧率：每秒60帧

    // ============================================
    // 动画1: 旋转动画（Z轴旋转）
    // 数据类型: FLOAT - 单个浮点数值
    // 循环模式: CYCLE - 循环播放
    // ============================================
    const rotateAnim = new Animation(
      "rotateAnim",                          // 动画名称
      "rotation.z",                          // 目标属性：绕Z轴旋转
      fps,                                   // 帧率
      Animation.ANIMATIONTYPE_FLOAT,         // 数据类型：浮点数
      Animation.ANIMATIONLOOPMODE_CYCLE      // 循环模式：循环播放
    );

    // ============================================
    // 动画2: 滑动动画（位置移动）
    // 数据类型: VECTOR3 - 三维向量（包含x,y,z）
    // 循环模式: CYCLE - 循环播放
    // ============================================
    const slideAnim = new Animation(
      "slideAnim",                           // 动画名称
      "position",                            // 目标属性：位置
      fps,                                   // 帧率
      Animation.ANIMATIONTYPE_VECTOR3,       // 数据类型：Vector3
      Animation.ANIMATIONLOOPMODE_CYCLE      // 循环模式：循环播放
    );

    // ============================================
    // 动画3: 淡出动画（可见度变化）
    // 数据类型: FLOAT - 浮点数（可见度范围0-1）
    // 循环模式: CONSTANT - 单次播放后停止
    // ============================================
    const fadeAnim = new Animation(
      "fadeAnim",                            // 动画名称
      "visibility",                          // 目标属性：可见度
      fps,                                   // 帧率
      Animation.ANIMATIONTYPE_FLOAT,         // 数据类型：浮点数
      Animation.ANIMATIONLOOPMODE_CONSTANT   // 循环模式：单次播放
    );

    // ============================================
    // 设置旋转动画的关键帧
    // 帧号 0 -> 180 = 3秒动画（180帧 / 60fps = 3秒）
    // 值从 0 旋转到 PI/2（90度）
    // ============================================
    rotateFrames.push({ frame: 0, value: 0 });              // 起始：旋转角度0
    rotateFrames.push({ frame: 180, value: Math.PI / 2 });  // 结束：旋转90度

    // ============================================
    // 设置滑动动画的关键帧
    // 创建左右摇摆的动画效果
    // 帧号计算：每45帧 = 0.75秒
    // ============================================
    slideFrames.push({ frame: 0, value: new Vector3(0, 3, 0) });      // 中心点
    slideFrames.push({ frame: 45, value: new Vector3(-3, 2, 0) });    // 左移并下沉
    slideFrames.push({ frame: 90, value: new Vector3(0, 3, 0) });     // 回到中心
    slideFrames.push({ frame: 135, value: new Vector3(3, 2, 0) });    // 右移并下沉
    slideFrames.push({ frame: 180, value: new Vector3(0, 3, 0) });    // 回到中心

    // ============================================
    // 设置淡出动画的关键帧
    // 可见度从1（完全可见）到0（完全不可见）
    // ============================================
    fadeFrames.push({ frame: 0, value: 1 });    // 起始：完全可见
    fadeFrames.push({ frame: 180, value: 0 });  // 结束：完全不可见

    // 将关键帧绑定到动画
    rotateAnim.setKeys(rotateFrames);
    slideAnim.setKeys(slideFrames);
    fadeAnim.setKeys(fadeFrames);

    // 将动画添加到目标对象的动画数组
    // 注意：动画必须添加到 target.animations 数组才能被 beginAnimation 播放
    this.target.animations.push(rotateAnim);
    this.target.animations.push(slideAnim);
    this.target.animations.push(fadeAnim);

    // ============================================
    // 播放动画 - 方式1: beginAnimation
    // beginAnimation 会播放目标对象上的所有动画
    // 参数: target, fromFrame, toFrame, loop
    // this.scene.beginAnimation(this.target, 0, 180, true);
    // ============================================

    // 动画结束回调函数
    // 当动画停止时调用，用于清理或状态更新
    const onAnimationEnd = () => {
      console.log("animation ended");
      this.target.setEnabled(false);  // 禁用目标对象
    };

    // ============================================
    // 播放动画 - 方式2: beginDirectAnimation
    // 可以指定播放哪些动画
    // 参数: target, animations[], from, to, loop, speedRatio, onAnimationEnd
    // 返回 Animatable 对象，可用于控制动画
    // ============================================
    const animControl = this.scene.beginDirectAnimation(
      this.target,                      // 目标对象
      [slideAnim, rotateAnim],          // 要播放的动画数组（不包含淡出动画）
      0,                                // 起始帧
      180,                              // 结束帧
      true,                             // 是否循环
      1,                                // 速度比率（1=正常速度）
      onAnimationEnd                    // 动画结束回调
    );

    // ============================================
    // 基于事件触发动画
    // 鼠标中键点击时触发淡出动画
    // 使用 async/await 和 waitAsync() 等待动画完成
    // ============================================
    this.scene.onPointerDown = async (evt) => {
      // evt.button: 0=左键, 1=中键, 2=右键
      if (evt.button === 1) {
        // 播放淡出动画并等待完成
        // waitAsync() 返回 Promise，动画完成时 resolve
        await this.scene
          .beginDirectAnimation(this.target, [fadeAnim], 0, 180)
          .waitAsync();

        // 淡出完成后，停止其他动画（会触发 onAnimationEnd 回调）
        animControl.stop();
      }
    };
  }
}
