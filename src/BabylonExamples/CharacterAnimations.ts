/**
 * 骨骼动画示例类
 *
 * 本示例演示如何在 Babylon.js 中导入和使用带有骨骼绑定的角色动画。
 *
 * 核心概念：
 * - 骨骼绑定（Rigging）：为3D模型添加骨骼结构，使其能够进行动画
 * - 动画组（AnimationGroups）：从GLB文件导入的动画集合
 * - 混合动画：可以在不同的动画组之间切换
 *
 * 工作流程：
 * 1. 从 Mixamo 下载动画（idle、jump、run）
 * 2. 在 Blender 中将动画合并到角色模型
 * 3. 使用 NLA（非线性动画）编辑器组织动画
 * 4. 导出为 GLB 格式供 Babylon.js 使用
 */
import {
  Scene,
  Engine,
  FreeCamera,
  Vector3,
  CubeTexture,
  SceneLoader,
} from "@babylonjs/core";
import "@babylonjs/loaders";

export class CharacterAnimations {
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
   * 创建场景并设置环境
   *
   * 环境贴图（Environment Texture）：
   * - 提供场景的间接光照和反射
   * - createDefaultSkybox 创建天空盒背景
   */
  CreateScene(): Scene {
    const scene = new Scene(this.engine);

    // 创建预过滤的环境贴图，用于基于图像的照明（IBL）
    const envTex = CubeTexture.CreateFromPrefilteredData(
      "./environment/sky.env",
      scene
    );

    // 禁用伽马空间，确保正确的颜色渲染
    envTex.gammaSpace = false;

    // 旋转环境贴图以匹配场景方向
    envTex.rotationY = Math.PI / 2;

    scene.environmentTexture = envTex;

    // 创建默认天空盒：贴图、启用、尺寸、模糊度
    scene.createDefaultSkybox(envTex, true, 1000, 0.25);

    // 创建自由相机，位于角色前方10单位，高度2单位
    const camera = new FreeCamera("camera", new Vector3(0, 2, -10), this.scene);
    camera.attachControl();
    camera.minZ = 0.5;  // 近裁剪面，防止相机太近时物体被裁剪
    camera.speed = 0.5;  // 相机移动速度

    return scene;
  }

  /**
   * 创建环境（关卡场景）
   *
   * 使用 SceneLoader.ImportMeshAsync 异步加载 GLB 格式的场景模型
   */
  async CreateEnvironment(): Promise<void> {
    await SceneLoader.ImportMeshAsync("", "./models/", "Prototype_Level.glb");
  }

  /**
   * 创建带有骨骼动画的角色
   *
   * 骨骼动画关键概念：
   * - meshes: 模型的网格数组，meshes[0] 通常是根节点
   * - animationGroups: 动画组数组，每个组代表一个独立的动画片段
   *
   * 从 Blender 导出的动画组命名：
   * - 在 Blender NLA 编辑器中设置的轨道名称会成为动画组名称
   * - 本示例包含：idle（待机）、jump（跳跃）、run（跑步）
   *
   * 重要提示：
   * - 默认情况下，第一个动画会自动播放
   * - 使用 stop() 停止当前动画
   * - 使用 play(loop) 播放指定动画，loop 参数控制是否循环
   */
  async CreateCharacter(): Promise<void> {
    // 解构导入结果：meshes（网格）和 animationGroups（动画组）
    const { meshes, animationGroups } = await SceneLoader.ImportMeshAsync(
      "",           // 空字符串表示导入所有网格
      "./models/",  // 模型路径
      "character.glb"  // 带骨骼动画的角色文件
    );

    // 旋转角色180度，使其面向正确的方向
    // 注意：不要在 Blender 中旋转骨骼，这可能导致动画问题
    // 应该在 Babylon.js 中通过代码旋转
    meshes[0].rotate(Vector3.Up(), Math.PI);

    // 打印动画组信息，用于调试和确认动画名称
    // 可以在浏览器控制台看到：idle、jump、run
    console.log("animation groups", animationGroups);

    // 停止默认播放的第一个动画（idle）
    // 这可以让角色保持在动画的某一帧，而不是自动播放
    animationGroups[0].stop();

    // 播放第三个动画（run），参数 true 表示循环播放
    // 动画组索引：
    // [0] = idle（待机）
    // [1] = jump（跳跃）- 通常不循环
    // [2] = run（跑步）- 通常循环
    animationGroups[2].play(true);

    // 动画控制示例：
    // animationGroups[0].play(true);   // 播放 idle，循环
    // animationGroups[1].play(false);  // 播放 jump，不循环
    // animationGroups[2].play(true);   // 播放 run，循环
  }
}
