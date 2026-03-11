/**
 * 过场动画示例 - Babylon.js
 *
 * 本课程介绍如何创建过场动画（Cutscene）：
 * - 相机路径动画：控制相机在场景中移动
 * - 动画组（AnimationGroup）：管理角色动画
 * - 关键帧动画（Keyframe Animation）：定义动画的关键点
 * - 动画同步：协调多个动画的播放时机
 * - 动画结束回调：过场动画完成后切换到游戏模式
 */
import {
  Scene,
  Engine,
  FreeCamera,
  Vector3,
  CubeTexture,
  SceneLoader,
  AnimationGroup,
  Animation,
} from "@babylonjs/core";
import "@babylonjs/loaders";

export class Cutscene {
  /** 场景容器 */
  scene: Scene;
  /** 渲染引擎 */
  engine: Engine;
  /** 角色动画组数组，存储从 GLB 文件加载的动画 */
  characterAnimations: AnimationGroup[];
  /** 自由相机，用于过场动画和玩家控制 */
  camera: FreeCamera;

  /**
   * 构造函数 - 初始化过场动画场景
   * @param canvas - HTML Canvas 元素
   */
  constructor(private canvas: HTMLCanvasElement) {
    // 创建渲染引擎
    this.engine = new Engine(this.canvas, true);
    // 创建场景
    this.scene = this.CreateScene();
    // 创建环境（异步加载场景模型）
    this.CreateEnvironment();
    // 创建主角（异步加载角色模型和动画）
    this.CreateCharacter();
    // 创建僵尸敌人
    this.CreateZombies();

    // 创建并播放过场动画
    this.CreateCutscene();

    // 启动渲染循环
    this.engine.runRenderLoop(() => {
      this.scene.render();
    });
  }

  /**
   * 创建场景 - 设置环境贴图和天空盒
   * @returns 配置好的 Scene 对象
   */
  CreateScene(): Scene {
    const scene = new Scene(this.engine);

    // 加载预过滤的环境贴图（用于 PBR 反射）
    const envTex = CubeTexture.CreateFromPrefilteredData(
      "./environment/sky.env",
      scene
    );

    // 设置为线性颜色空间（PBR 材质需要）
    envTex.gammaSpace = false;

    // 旋转环境贴图（调整天空盒方向）
    envTex.rotationY = Math.PI / 2;

    // 将环境贴图应用到场景
    scene.environmentTexture = envTex;

    // 创建默认天空盒
    // 参数：环境贴图, 自动调整曝光, 天空盒尺寸, 模糊程度
    scene.createDefaultSkybox(envTex, true, 1000, 0.25);

    // 创建自由相机
    // 初始位置在场景边缘，便于开始过场动画
    this.camera = new FreeCamera("camera", new Vector3(10, 2, -10), this.scene);
    // 设置近裁剪面，防止相机太近时裁剪物体
    this.camera.minZ = 0.5;
    // 降低相机移动速度（过场动画结束后玩家控制用）
    this.camera.speed = 0.5;

    return scene;
  }

  /**
   * 创建环境 - 加载关卡场景模型
   */
  async CreateEnvironment(): Promise<void> {
    // 异步加载 GLB 场景模型
    await SceneLoader.ImportMeshAsync("", "./models/", "Prototype_Level.glb");
  }

  /**
   * 创建主角 - 加载角色模型和动画
   */
  async CreateCharacter(): Promise<void> {
    // 加载角色模型，同时获取动画组
    const { meshes, animationGroups } = await SceneLoader.ImportMeshAsync(
      "",
      "./models/",
      "character.glb"
    );

    // 旋转角色朝向正确方向
    meshes[0].rotate(Vector3.Up(), -Math.PI / 2);
    // 设置角色初始位置
    meshes[0].position = new Vector3(8, 0, -4);

    // 保存动画组引用，便于后续控制
    this.characterAnimations = animationGroups;

    // 停止第一个动画（可能是待机动画）
    this.characterAnimations[0].stop();
    // 播放第二个动画（可能是跑步或战斗动画）
    this.characterAnimations[1].play();
  }

  /**
   * 创建僵尸敌人 - 加载多个僵尸模型
   */
  async CreateZombies(): Promise<void> {
    // 加载第一个僵尸
    const zombieOne = await SceneLoader.ImportMeshAsync(
      "",
      "./models/",
      "zombie_1.glb"
    );

    // 加载第二个僵尸
    const zombieTwo = await SceneLoader.ImportMeshAsync(
      "",
      "./models/",
      "zombie_2.glb"
    );

    // 设置第一个僵尸的位置和旋转
    zombieOne.meshes[0].rotate(Vector3.Up(), Math.PI / 2);
    zombieOne.meshes[0].position = new Vector3(-8, 0, -4);

    // 设置第二个僵尸的位置和旋转
    zombieTwo.meshes[0].rotate(Vector3.Up(), Math.PI / 2);
    zombieTwo.meshes[0].position = new Vector3(-6, 0, -2);
  }

  /**
   * 创建过场动画 - 定义相机路径动画
   *
   * 过场动画流程：
   * 1. 从场景边缘开始
   * 2. 平移到角色附近
   * 3. 停留片刻展示角色
   * 4. 移动到最终位置
   * 5. 动画结束后切换到玩家控制模式
   */
  async CreateCutscene(): Promise<void> {
    // 关键帧数组，定义相机的路径点
    const camKeys = [];
    // 帧率，用于计算关键帧时间
    const fps = 60;

    // 创建相机位置动画
    const camAnim = new Animation(
      "camAnim",           // 动画名称
      "position",          // 动画属性（相机位置）
      fps,                 // 帧率
      Animation.ANIMATIONTYPE_VECTOR3,  // 动画类型（Vector3）
      Animation.ANIMATIONLOOPMODE_CONSTANT  // 循环模式（播放一次后停止）
    );

    // 定义关键帧：
    // 帧 0：起始位置 (10, 2, -10)
    camKeys.push({ frame: 0, value: new Vector3(10, 2, -10) });
    // 帧 300 (5秒)：移动到 (-6, 2, -10)，靠近角色
    camKeys.push({ frame: 5 * fps, value: new Vector3(-6, 2, -10) });
    // 帧 480 (8秒)：停留不动，展示角色动作
    camKeys.push({ frame: 8 * fps, value: new Vector3(-6, 2, -10) });
    // 帧 720 (12秒)：移动到最终位置 (0, 3, -16)
    camKeys.push({ frame: 12 * fps, value: new Vector3(0, 3, -16) });

    // 设置关键帧
    camAnim.setKeys(camKeys);

    // 将动画添加到相机的动画数组
    this.camera.animations.push(camAnim);

    // 开始播放动画，等待完成后再继续
    // waitAsync() 返回 Promise，动画播放完成后 resolve
    await this.scene.beginAnimation(this.camera, 0, 12 * fps).waitAsync();

    // 过场动画结束，切换到玩家控制模式
    this.EndCutscene();
  }

  /**
   * 结束过场动画 - 切换到玩家控制模式
   *
   * 当过场动画播放完成后：
   * 1. 启用玩家相机控制
   * 2. 切换角色动画（从跑步切换到待机）
   */
  EndCutscene(): void {
    // 将相机控制绑定到 canvas，允许玩家自由移动
    this.camera.attachControl();
    // 停止当前角色动画（跑步动画）
    this.characterAnimations[1].stop();
    // 播放待机动画
    this.characterAnimations[0].play();
  }
}