/**
 * BakedLighting 类 - 烘焙光照示例
 *
 * 烘焙光照是将光照信息预先计算并存储到纹理贴图中的技术。
 * 在 Blender 中烘焙光照后，Babylon.js 无需实时光照计算即可渲染。
 *
 * 【核心优势】
 * - 性能提升：无需运行时计算光照和阴影
 * - 视觉质量：Blender Cycles 提供高质量光照
 * - 复杂效果：可烘焙全局光照、环境光遮蔽等
 *
 * 【主要限制】
 * - 仅适用于静态场景，物体不能移动
 * - 阴影和光照固定在贴图中
 */
import {
  Scene,
  Engine,
  FreeCamera,
  Vector3,
  // 注意：烘焙光照场景不需要导入光源类
  // 因为所有光照信息已经烘焙到纹理中
  SceneLoader,
} from "@babylonjs/core";
import "@babylonjs/loaders";

export class BakedLighting {
  scene: Scene;
  engine: Engine;

  constructor(private canvas: HTMLCanvasElement) {
    // 创建 Babylon.js 渲染引擎
    // 第二个参数 true 表示启用抗锯齿
    this.engine = new Engine(this.canvas, true);
    this.scene = this.CreateScene();

    // 加载带有烘焙光照的 3D 模型
    this.CreateEnvironment();

    // 启动渲染循环
    this.engine.runRenderLoop(() => {
      this.scene.render();
    });
  }

  /**
   * 创建场景和相机
   *
   * 注意：此方法中没有创建任何光源
   * 所有光照信息已经烘焙到模型的纹理贴图中
   */
  CreateScene(): Scene {
    const scene = new Scene(this.engine);

    // 创建自由相机（第一人称视角控制）
    // 相机位置：x=0, y=0.5, z=-2（在物体前方）
    const camera = new FreeCamera(
      "camera",
      new Vector3(0, 0.5, -2),
      this.scene
    );

    // 将相机控制绑定到画布
    camera.attachControl();

    // 设置相机移动速度
    // 较低的速度 (0.1) 适合近距离观察烘焙光照细节
    camera.speed = 0.1;

    // 设置近裁剪平面 (minZ)
    // 0.01 允许相机非常接近物体而不会产生裁剪
    // 这对于近距离观察烘焙光照细节很重要
    camera.minZ = 0.01;

    return scene;
  }

  /**
   * 加载带有烘焙光照的环境模型
   *
   * 【Blender 烘焙流程概述】
   * 1. 在 Blender 中设置场景和光照
   * 2. 创建纹理图集 - 将多个物体的 UV 合并到一张大图
   * 3. 为每个物体创建新的 UV 映射用于烘焙（如 "joined"）
   * 4. 在材质中添加 Image Texture 节点，指向烘焙目标图像
   * 5. 使用 Cycles 渲染器进行烘焙 (Bake Type: Combined)
   * 6. 通过 Compositor 应用颜色管理设置
   * 7. 导出为 GLB 格式
   *
   * 【烘焙设置要点】
   * - 渲染引擎：Cycles（支持更高质量的光照计算）
   * - 采样数：256 或更高（影响烘焙质量）
   * - 烘焙类型：Combined（包含漫反射、光泽、AO 等）
   * - 边距 (Margin)：8 像素（防止 UV 岛之间颜色溢出）
   */
  async CreateEnvironment(): Promise<void> {
    // 使用 SceneLoader 加载 glTF/GLB 格式的 3D 模型
    // 该模型包含烘焙好的光照纹理
    //
    // 参数说明：
    // - 第一个参数：要加载的网格名称（空字符串表示加载所有）
    // - 第二个参数：模型文件所在目录
    // - 第三个参数：模型文件名
    const { meshes } = await SceneLoader.ImportMeshAsync(
      "",
      "./models/",
      "bust_demo.glb"
    );

    // 模型加载后，meshes 数组包含场景中的所有网格
    // 由于光照已烘焙，无需额外设置光源
    // 纹理贴图中的颜色信息已经包含了完整的光照和阴影

    // 【性能优势】
    // - 不需要实时阴影计算
    // - 不需要动态光源
    // - 渲染管线更简单，帧率更稳定
    // - 适合移动端和低性能设备
  }
}