/**
 * Cutscene - 过场动画示例
 *
 * 本示例演示如何使用 Babylon.js 创建电影式的过场动画效果。
 * 主要知识点：
 * - 相机动画控制
 * - 关键帧动画系统
 * - 异步动画序列
 * - 过场动画与游戏控制的切换
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
  scene: Scene;
  engine: Engine;
  characterAnimations: AnimationGroup[];
  camera: FreeCamera;

  constructor(private canvas: HTMLCanvasElement) {
    this.engine = new Engine(this.canvas, true);
    this.scene = this.CreateScene();
    this.CreateEnvironment();
    this.CreateCharacter();
    this.CreateZombies();

    // 创建并播放过场动画
    this.CreateCutscene();

    this.engine.runRenderLoop(() => {
      this.scene.render();
    });
  }

  /**
   * 创建场景
   * 设置环境贴图、天空盒和相机
   */
  CreateScene(): Scene {
    const scene = new Scene(this.engine);

    // 从预过滤的环境贴图数据创建立方体贴图
    const envTex = CubeTexture.CreateFromPrefilteredData(
      "./environment/sky.env",
      scene
    );

    // 设置为线性颜色空间（物理正确）
    envTex.gammaSpace = false;

    // 旋转环境贴图 90 度
    envTex.rotationY = Math.PI / 2;

    // 将环境贴图应用到场景
    scene.environmentTexture = envTex;

    // 创建默认天空盒
    // 参数：环境贴图，是否使用 PMREM，天空盒大小，模糊程度
    scene.createDefaultSkybox(envTex, true, 1000, 0.25);

    // 创建自由相机（用于过场动画）
    this.camera = new FreeCamera("camera", new Vector3(10, 2, -10), this.scene);
    // 设置近裁剪面
    this.camera.minZ = 0.5;
    // 设置相机移动速度
    this.camera.speed = 0.5;

    return scene;
  }

  /**
   * 创建环境/关卡
   * 异步加载 3D 模型场景
   */
  async CreateEnvironment(): Promise<void> {
    await SceneLoader.ImportMeshAsync("", "./models/", "Prototype_Level.glb");
  }

  /**
   * 创建角色
   * 加载角色模型并设置动画
   */
  async CreateCharacter(): Promise<void> {
    const { meshes, animationGroups } = await SceneLoader.ImportMeshAsync(
      "",
      "./models/",
      "character.glb"
    );

    // 旋转角色面向正确方向
    meshes[0].rotate(Vector3.Up(), -Math.PI / 2);
    // 设置角色初始位置
    meshes[0].position = new Vector3(8, 0, -4);

    // 保存动画组引用
    this.characterAnimations = animationGroups;

    // 停止第一个动画，播放第二个动画
    this.characterAnimations[0].stop();
    this.characterAnimations[1].play();
  }

  /**
   * 创建僵尸
   * 加载两个僵尸模型并放置在场景中
   */
  async CreateZombies(): Promise<void> {
    const zombieOne = await SceneLoader.ImportMeshAsync(
      "",
      "./models/",
      "zombie_1.glb"
    );

    const zombieTwo = await SceneLoader.ImportMeshAsync(
      "",
      "./models/",
      "zombie_2.glb"
    );

    // 设置僵尸 1 的位置和旋转
    zombieOne.meshes[0].rotate(Vector3.Up(), Math.PI / 2);
    zombieOne.meshes[0].position = new Vector3(-8, 0, -4);

    // 设置僵尸 2 的位置和旋转
    zombieTwo.meshes[0].rotate(Vector3.Up(), Math.PI / 2);
    zombieTwo.meshes[0].position = new Vector3(-6, 0, -2);
  }

  /**
   * 创建过场动画
   *
   * 使用关键帧动画控制相机移动，创建电影式的过场效果。
   * 动画完成后切换到玩家控制模式。
   */
  async CreateCutscene(): Promise<void> {
    // 相机动画关键帧数组
    const camKeys = [];

    // 帧率设置（每秒 60 帧）
    const fps = 60;

    // 创建相机位置动画
    const camAnim = new Animation(
      "camAnim",                    // 动画名称
      "position",                   // 动画属性（相机位置）
      fps,                          // 帧率
      Animation.ANIMATIONTYPE_VECTOR3,  // 动画类型（Vector3）
      Animation.ANIMATIONLOOPMODE_CONSTANT  // 循环模式（播放一次后停止）
    );

    // 定义关键帧
    // 关键帧格式：{ frame: 帧数, value: 目标值 }

    // 第 0 帧：起始位置
    camKeys.push({ frame: 0, value: new Vector3(10, 2, -10) });

    // 第 5 秒（300帧）：移动到左侧
    camKeys.push({ frame: 5 * fps, value: new Vector3(-6, 2, -10) });

    // 第 8 秒（480帧）：暂停（相同位置）
    camKeys.push({ frame: 8 * fps, value: new Vector3(-6, 2, -10) });

    // 第 12 秒（720帧）：推近到角色位置
    camKeys.push({ frame: 12 * fps, value: new Vector3(0, 3, -16) });

    // 将关键帧应用到动画
    camAnim.setKeys(camKeys);

    // 将动画添加到相机
    this.camera.animations.push(camAnim);

    // 开始播放动画并等待完成
    // waitAsync() 返回一个 Promise，在动画完成时解决
    await this.scene.beginAnimation(this.camera, 0, 12 * fps).waitAsync();

    // 动画完成后结束过场
    this.EndCutscene();
  }

  /**
   * 结束过场动画
   *
   * 将相机控制权交给玩家，并切换角色动画
   */
  EndCutscene(): void {
    // 将相机附加到画布，启用玩家控制
    this.camera.attachControl();

    // 切换角色动画
    this.characterAnimations[1].stop();  // 停止当前动画
    this.characterAnimations[0].play();  // 播放新的动画
  }
}
