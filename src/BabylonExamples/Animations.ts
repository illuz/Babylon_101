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
   * 1. Animation 构造函数：name, targetProperty, fps, dataType, loopMode
   * 2. 关键帧：{frame, value} - frame为帧号，value为属性值
   * 3. 播放方式：beginAnimation / beginDirectAnimation
   * 4. 动画控制：返回 Animatable 对象，可 stop/pause
   */
  CreateAnimations(): void {
    // 关键帧数组
    const rotateFrames = [];
    const slideFrames = [];
    const fadeFrames = [];
    const fps = 60; // 帧率：每秒60帧

    // 动画1: 旋转动画 - FLOAT类型，CYCLE循环
    const rotateAnim = new Animation(
      "rotateAnim",
      "rotation.z",
      fps,
      Animation.ANIMATIONTYPE_FLOAT,
      Animation.ANIMATIONLOOPMODE_CYCLE
    );

    // 动画2: 滑动动画 - VECTOR3类型，CYCLE循环
    const slideAnim = new Animation(
      "slideAnim",
      "position",
      fps,
      Animation.ANIMATIONTYPE_VECTOR3,
      Animation.ANIMATIONLOOPMODE_CYCLE
    );

    // 动画3: 淡出动画 - FLOAT类型，CONSTANT单次播放
    const fadeAnim = new Animation(
      "fadeAnim",
      "visibility",
      fps,
      Animation.ANIMATIONTYPE_FLOAT,
      Animation.ANIMATIONLOOPMODE_CONSTANT
    );

    // 旋转动画关键帧：0到90度，3秒(180帧)
    rotateFrames.push({ frame: 0, value: 0 });
    rotateFrames.push({ frame: 180, value: Math.PI / 2 });

    // 滑动动画关键帧：左右摇摆
    slideFrames.push({ frame: 0, value: new Vector3(0, 3, 0) });
    slideFrames.push({ frame: 45, value: new Vector3(-3, 2, 0) });
    slideFrames.push({ frame: 90, value: new Vector3(0, 3, 0) });
    slideFrames.push({ frame: 135, value: new Vector3(3, 2, 0) });
    slideFrames.push({ frame: 180, value: new Vector3(0, 3, 0) });

    // 淡出动画关键帧：可见度从1到0
    fadeFrames.push({ frame: 0, value: 1 });
    fadeFrames.push({ frame: 180, value: 0 });

    // 绑定关键帧到动画
    rotateAnim.setKeys(rotateFrames);
    slideAnim.setKeys(slideFrames);
    fadeAnim.setKeys(fadeFrames);

    // 添加动画到目标对象
    this.target.animations.push(rotateAnim);
    this.target.animations.push(slideAnim);
    this.target.animations.push(fadeAnim);

    // 动画结束回调
    const onAnimationEnd = () => {
      console.log("animation ended");
      this.target.setEnabled(false);
    };

    // 播放指定动画（beginDirectAnimation）
    const animControl = this.scene.beginDirectAnimation(
      this.target,
      [slideAnim, rotateAnim],
      0,
      180,
      true,
      1,
      onAnimationEnd
    );

    // 鼠标中键触发淡出动画
    this.scene.onPointerDown = async (evt) => {
      if (evt.button === 1) {
        await this.scene
          .beginDirectAnimation(this.target, [fadeAnim], 0, 180)
          .waitAsync();
        animControl.stop();
      }
    };
  }
}
