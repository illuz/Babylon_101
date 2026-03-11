import {
  Scene,
  Engine,
  FreeCamera,
  Vector3,
  CubeTexture,
  SceneLoader,
  AnimationEvent,
  Sound,
} from "@babylonjs/core";
import "@babylonjs/loaders";

/**
 * AudioExample - Babylon.js 音频示例
 *
 * 本示例演示了 Babylon.js 中两种音频类型的用法：
 * 1. 2D 音频（背景音乐 BGM）- 在整个场景中以相同音量播放
 * 2. 3D 音频（空间音效 SFX）- 根据听者与声源的距离动态调整音量
 *
 * 核心概念：
 * - Sound 类：Babylon.js 中用于播放音频的主要类
 * - spatialSound：设置为 true 时启用 3D 空间音频
 * - distanceModel：距离模型，决定音量随距离变化的算法
 * - maxDistance：最大可听距离（仅适用于 linear 距离模型）
 */
export class AudioExample {
  scene: Scene;
  engine: Engine;

  constructor(private canvas: HTMLCanvasElement) {
    this.engine = new Engine(this.canvas, true);
    this.scene = this.CreateScene();
    this.CreateEnvironment();
    this.CreateCharacter();
    this.CreateZombie();

    this.engine.runRenderLoop(() => {
      this.scene.render();
    });
  }

  /**
   * 创建场景和相机
   * @returns Scene 对象
   */
  CreateScene(): Scene {
    const scene = new Scene(this.engine);

    // 创建环境贴图用于 PBR 渲染
    const envTex = CubeTexture.CreateFromPrefilteredData(
      "./environment/sky.env",
      scene
    );

    envTex.gammaSpace = false;

    envTex.rotationY = Math.PI / 2;

    scene.environmentTexture = envTex;

    // 创建天空盒
    scene.createDefaultSkybox(envTex, true, 1000, 0.25);

    // 创建自由相机 - 相机位置将影响 3D 音频的听感
    const camera = new FreeCamera("camera", new Vector3(0, 2, -10), this.scene);
    camera.attachControl();
    camera.minZ = 0.5;
    camera.speed = 0.5;

    return scene;
  }

  /**
   * 创建环境并播放 2D 背景音乐
   *
   * 2D 音频特点：
   * - 在整个场景中以相同音量播放
   * - 适合用作背景音乐（BGM）
   * - 不受相机/听者位置影响
   */
  async CreateEnvironment(): Promise<void> {
    await SceneLoader.ImportMeshAsync("", "./models/", "Prototype_Level.glb");

    // ============================================
    // 2D 音频示例 - 背景音乐（BGM）
    // ============================================
    // Sound 构造函数参数：
    // 1. name: 声音名称（用于标识）
    // 2. urlOrArrayBuffer: 音频文件路径或 ArrayBuffer
    // 3. scene: 场景对象
    // 4. readyToPlayCallback: 音频加载完成后的回调（可为 null）
    // 5. options: 音频配置选项
    const backgroundMusic = new Sound(
      "backgroundMusic",           // 声音名称
      "./audio/terror_ambience.mp3", // 音频文件路径
      this.scene,                   // 场景引用
      null,                         // 加载完成回调（null 表示不使用）
      {
        volume: 0,      // 初始音量设为 0（用于淡入效果）
        autoplay: true, // 自动播放 - 场景加载后立即播放
      }
    );

    // ============================================
    // 音量控制与淡入效果
    // ============================================
    // setVolume(newVolume, time) 方法：
    // - newVolume: 目标音量（0.0 - 1.0）
    // - time: 过渡时间（秒），实现平滑的音量变化
    // 这里在 30 秒内将音量从 0 渐变到 0.75，实现背景音乐淡入效果
    backgroundMusic.setVolume(0.75, 30);
  }

  /**
   * 创建场景中的角色（视觉效果）
   */
  async CreateCharacter(): Promise<void> {
    const { meshes } = await SceneLoader.ImportMeshAsync(
      "",
      "./models/",
      "character_scared.glb"
    );

    meshes[0].rotate(Vector3.Up(), -Math.PI / 2);
    meshes[0].position = new Vector3(7, 0, 0);
  }

  /**
   * 创建僵尸角色并播放 3D 空间音效
   *
   * 3D 音频特点：
   * - 音量根据听者与声源的距离动态变化
   * - 适合用于游戏中的音效（如脚步声、怪物咆哮等）
   * - 需要设置声源位置或附加到网格
   */
  async CreateZombie(): Promise<void> {
    const { meshes, animationGroups } = await SceneLoader.ImportMeshAsync(
      "",
      "./models/",
      "zombie_growl.glb"
    );
    meshes[0].rotate(Vector3.Up(), Math.PI / 2);
    meshes[0].position = new Vector3(-7, 0, 0);

    // 停止默认动画，我们稍后会手动控制
    animationGroups[0].stop();

    // ============================================
    // 3D 音频示例 - 空间音效（SFX）
    // ============================================
    // 3D 音频配置选项：
    // - spatialSound: true - 启用空间音频（这是关键！）
    // - distanceModel: 距离模型（默认为 "linear"）
    //   - "linear": 线性衰减，需要设置 maxDistance
    //   - "inverse": 反比衰减，更符合物理规律
    //   - "exponential": 指数衰减
    // - maxDistance: 最大可听距离（仅 linear 模型有效）
    //   - 超过此距离后音频完全消失
    //   - 默认值为 100 单位
    const growlFx = new Sound(
      "growlFx",                  // 声音名称
      "./audio/growl.mp3",        // 音频文件路径
      this.scene,                 // 场景引用
      null,                       // 加载完成回调
      {
        spatialSound: true,  // 启用 3D 空间音频
        maxDistance: 10,     // 最大可听距离为 10 单位
        // 注意：没有设置 autoplay，默认为 false
      }
    );

    // ============================================
    // 3D 音频定位方式
    // ============================================
    // 方式一：setPosition() - 设置固定位置
    // 适用于静止的声源
    growlFx.setPosition(new Vector3(-7, 0, 0)); // 与僵尸位置相同

    // 方式二：attachToMesh() - 附加到网格
    // 适用于移动的声源，音频会跟随网格移动
    // growlFx.attachToMesh(meshes[0]); // 取消注释可使音效跟随僵尸移动

    // ============================================
    // 播放速率控制
    // ============================================
    // setPlaybackRate(rate) 方法：
    // - rate = 1.0: 正常速度
    // - rate < 1.0: 减速播放，声音变低沉
    // - rate > 1.0: 加速播放，声音变尖锐
    // 这里加速到 1.87 倍以匹配僵尸动画速度
    growlFx.setPlaybackRate(1.87);

    // ============================================
    // 动画事件触发音频播放
    // ============================================
    // AnimationEvent 用于在动画的特定帧触发回调
    // 参数：帧号, 回调函数, 是否只触发一次
    const growlAnim = animationGroups[0].targetedAnimations[0].animation;

    const growlEvt = new AnimationEvent(
      70,  // 在第 70 帧触发
      () => {
        // ============================================
        // 播放控制与防重叠
        // ============================================
        // isPlaying 属性：检查音频是否正在播放
        // 防止动画快速循环时音频重叠播放
        if (!growlFx.isPlaying) growlFx.play();
      },
      false  // false = 每次动画循环都会触发
    );

    // 将事件添加到动画并播放动画（true = 循环播放）
    growlAnim.addEvent(growlEvt);
    animationGroups[0].play(true);
  }
}