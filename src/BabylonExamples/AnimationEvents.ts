import {
  Scene,
  Engine,
  FreeCamera,
  Vector3,
  CubeTexture,
  SceneLoader,
  AnimationGroup,
  AnimationEvent,
} from "@babylonjs/core";
import "@babylonjs/loaders";

/**
 * 动画事件（Animation Events）示例类
 *
 * 动画事件允许我们在动画的特定关键帧上执行自定义操作。
 * 这对于以下场景非常有用：
 * - 在攻击动画的特定帧触发伤害计算
 * - 在角色跳跃的特定帧播放音效
 * - 在动画结束时触发后续事件链
 *
 * 关键概念：
 * 1. AnimationEvent - 事件对象，包含触发帧、回调函数和是否只触发一次
 * 2. 事件必须在动画播放前创建并关联到动画
 * 3. AnimationEvent 只能关联到 Animation，不能直接关联到 AnimationGroup
 */
export class AnimationEvents {
  scene: Scene;
  engine: Engine;

  // 角色的欢庆动画组（全局变量，供僵尸死亡事件使用）
  cheer: AnimationGroup;

  // 僵尸的动画组数组（全局变量，供角色攻击事件使用）
  zombieAnims: AnimationGroup[];

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

  CreateScene(): Scene {
    const scene = new Scene(this.engine);
    const envTex = CubeTexture.CreateFromPrefilteredData(
      "./environment/sky.env",
      scene
    );

    envTex.gammaSpace = false;
    envTex.rotationY = Math.PI / 2;

    scene.environmentTexture = envTex;
    scene.createDefaultSkybox(envTex, true, 1000, 0.25);

    const camera = new FreeCamera("camera", new Vector3(0, 2, -10), this.scene);
    camera.attachControl();
    camera.minZ = 0.5;
    camera.speed = 0.5;

    return scene;
  }

  async CreateEnvironment(): Promise<void> {
    await SceneLoader.ImportMeshAsync("", "./models/", "Prototype_Level.glb");
  }

  /**
   * 创建角色并设置攻击动画事件
   *
   * 动画事件工作流程：
   * 1. 首先获取动画组中的具体动画（Animation）
   * 2. 创建 AnimationEvent 对象，指定触发帧和回调函数
   * 3. 将事件添加到动画上
   * 4. 播放动画时，事件会在指定帧自动触发
   */
  async CreateCharacter(): Promise<void> {
    const { meshes, animationGroups } = await SceneLoader.ImportMeshAsync(
      "",
      "./models/",
      "character_attack.glb"
    );

    meshes[0].rotate(Vector3.Up(), Math.PI);

    // 打印动画组以便调试
    // 注意：动画组的顺序是按字母顺序排列的，而不是按创建顺序
    // 例如：cheer, idle, spell（spell 被命名为 attack）
    console.log("animation groups", animationGroups);

    // 为动画组创建有意义的变量名，提高代码可读性
    // animationGroups[0] = cheer（欢庆）
    // animationGroups[1] = idle（待机）
    // animationGroups[2] = attack（攻击，实际动画名为 spell）
    const cheer = animationGroups[0];
    const idle = animationGroups[1];
    const attack = animationGroups[2];

    // 存储欢庆动画为全局变量，供僵尸死亡事件触发
    this.cheer = cheer;

    // 停止默认播放的欢庆动画
    cheer.stop();
    // 播放待机动画并设置循环
    idle.play(true);

    // ============================================
    // 动画事件创建步骤
    // ============================================

    // 步骤1：从动画组中获取具体的动画对象
    // AnimationEvent 需要关联到 Animation，而不是 AnimationGroup
    // targetedAnimations[0] 获取动画组中的第一个动画
    const attackAnim = animationGroups[2].targetedAnimations[0].animation;

    // 步骤2：创建动画事件
    // AnimationEvent 构造函数参数：
    // - frame: 触发事件的帧数（在第100帧触发，对应攻击动作击中目标的时刻）
    // - action: 事件触发时执行的回调函数
    // - onlyOnce: 是否只触发一次（攻击动画只触发一次，所以设为 false）
    const attackEvt = new AnimationEvent(
      100, // 帧数：在动画的第100帧触发
      () => {
        // 事件回调：在攻击帧触发时执行的操作
        // 先停止僵尸的待机动画
        this.zombieAnims[1].stop();
        // 然后播放僵尸的死亡动画（不循环）
        this.zombieAnims[0].play(false);
      },
      false // onlyOnce: false 表示每次动画播放都会触发
    );

    // 步骤3：将事件添加到动画上
    // 必须在播放动画之前完成此步骤
    attackAnim.addEvent(attackEvt);

    // 步骤4：设置触发动画播放的输入事件
    // 右键点击触发攻击动画
    this.scene.onPointerDown = (evt) => {
      if (evt.button === 2) {
        // button === 2 表示右键
        attack.play(false); // 播放攻击动画（不循环）
      }
    };
  }

  /**
   * 创建僵尸并设置死亡动画事件
   *
   * 展示动画事件链：
   * 角色攻击 -> 僵尸死亡（第100帧触发）-> 角色欢庆（第150帧触发）
   */
  async CreateZombie(): Promise<void> {
    const { meshes, animationGroups } = await SceneLoader.ImportMeshAsync(
      "",
      "./models/",
      "zombie_1.glb"
    );

    meshes[0].rotate(Vector3.Up(), Math.PI);
    meshes[0].position = new Vector3(2, 0, 0);

    // 存储僵尸动画组为全局变量
    // animationGroups[0] = death（死亡）
    // animationGroups[1] = idle（待机）
    this.zombieAnims = animationGroups;

    // 停止默认的死亡动画
    animationGroups[0].stop();
    // 播放待机动画并循环
    animationGroups[1].play(true);

    // ============================================
    // 僵尸死亡动画事件
    // ============================================

    // 从死亡动画组中获取动画对象
    const deathAnim = animationGroups[0].targetedAnimations[0].animation;

    // 创建死亡动画事件
    // 在死亡动画的第150帧触发角色欢庆
    const deathEvt = new AnimationEvent(
      150, // 帧数：在死亡动画的第150帧触发（僵尸倒地后）
      () => {
        // 停止角色的待机动画
        this.cheer.play(true); // 播放欢庆动画并循环
      },
      false // onlyOnce: false
    );

    // 将事件添加到死亡动画
    deathAnim.addEvent(deathEvt);
  }
}
