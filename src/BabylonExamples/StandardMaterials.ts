/**
 * StandardMaterials - 标准材质示例
 *
 * 本示例演示如何使用 Babylon.js 的 StandardMaterial 为 3D 对象添加纹理材质
 *
 * StandardMaterial 是 Babylon.js 中最基础的材质类型，适用于：
 * - 基本的颜色和纹理贴图
 * - 不需要 PBR（物理渲染）的简单场景
 * - 性能要求较高的场景
 *
 * 主要概念：
 * - Diffuse Texture（漫反射贴图）: 基本颜色贴图
 * - Normal Map（法线贴图）: 模拟表面细节，不改变几何体
 * - AO Texture（环境光遮蔽贴图）: 添加阴影效果，增加真实感
 * - Specular Texture（高光贴图）: 控制表面反射效果
 * - UV Scale: 控制纹理的平铺/重复次数
 */

import {
  Scene,
  Engine,
  FreeCamera,
  Vector3,
  HemisphericLight,
  MeshBuilder,
  StandardMaterial,
  Texture,
} from "@babylonjs/core";

export class StandardMaterials {
  scene: Scene;
  engine: Engine;

  /**
   * 构造函数 - 初始化 Babylon.js 引擎和场景
   * @param canvas - HTML Canvas 元素，用于渲染 3D 场景
   */
  constructor(private canvas: HTMLCanvasElement) {
    // 创建 Babylon.js 渲染引擎
    // 第二个参数 true 表示启用抗锯齿
    this.engine = new Engine(this.canvas, true);
    this.scene = this.CreateScene();

    // 启动渲染循环，每帧渲染一次场景
    this.engine.runRenderLoop(() => {
      this.scene.render();
    });
  }

  /**
   * 创建场景 - 设置相机、灯光、网格对象和材质
   * @returns Scene - 配置完成的场景对象
   */
  CreateScene(): Scene {
    // 创建场景实例
    const scene = new Scene(this.engine);

    // 创建自由相机（FreeCamera）
    // 参数：名称、位置（x, y, z）、所属场景
    const camera = new FreeCamera("camera", new Vector3(0, 1, -5), this.scene);

    // 将相机控制附加到 canvas，允许用户通过鼠标和键盘控制视角
    camera.attachControl();

    // 设置相机移动速度（默认为 1）
    // 较低的值使移动更平滑，便于近距离观察物体
    camera.speed = 0.25;

    // 创建半球光（HemisphericLight）
    // 模拟天空光照，从上方照射下来的环境光
    // 参数：名称、光照方向、所属场景
    const hemiLight = new HemisphericLight(
      "hemiLight",
      new Vector3(0, 1, 0),
      this.scene
    );

    // 设置光照强度（0-1 之间，默认为 1）
    // 较高的值使场景更亮
    hemiLight.intensity = 0.75;

    // 创建地面网格（Ground）
    // 参数：名称、配置对象（宽度和高度）、所属场景
    const ground = MeshBuilder.CreateGround(
      "ground",
      { width: 10, height: 10 },
      this.scene
    );

    // 创建球体网格（Sphere）
    // 参数：名称、配置对象（直径）、所属场景
    const ball = MeshBuilder.CreateSphere("ball", { diameter: 1 }, this.scene);

    // 设置球体位置（y=1 使球体悬浮在地面上方）
    ball.position = new Vector3(0, 1, 0);

    // 为地面和球体分配材质
    ground.material = this.CreateGroundMaterial();
    ball.material = this.CreateBallMaterial();

    return scene;
  }

  /**
   * 创建地面材质 - 使用石块纹理
   *
   * StandardMaterial 支持多种纹理类型：
   * - diffuseTexture: 漫反射贴图（基础颜色）
   * - bumpTexture: 凹凸贴图（使用法线贴图）
   * - ambientTexture: 环境贴图（AO 贴图）
   * - specularTexture: 高光贴图（控制反射）
   *
   * @returns StandardMaterial - 配置完成的材质对象
   */
  CreateGroundMaterial(): StandardMaterial {
    // 创建标准材质
    // 参数：材质名称、所属场景
    const groundMat = new StandardMaterial("groundMat", this.scene);

    // UV Scale（纹理缩放/平铺）
    // 值越大，纹理重复次数越多，看起来越精细
    const uvScale = 4;

    // 创建纹理数组，用于统一设置 UV Scale
    // 这样可以确保所有纹理的平铺一致，避免纹理错位
    const texArray: Texture[] = [];

    // ========== 漫反射贴图（Diffuse Texture）==========
    // 这是最基础的纹理，定义了物体的表面颜色
    // 路径相对于 public 文件夹
    const diffuseTex = new Texture(
      "./textures/stone/stone_diffuse.jpg",
      this.scene
    );
    groundMat.diffuseTexture = diffuseTex;
    texArray.push(diffuseTex);

    // ========== 法线贴图（Normal Map）==========
    // 通过模拟表面凹凸来增加细节，但不改变实际几何体
    // 使用 bumpTexture 属性来应用法线贴图
    const normalTex = new Texture(
      "./textures/stone/stone_normal.jpg",
      this.scene
    );

    // 将法线贴图分配给 bumpTexture 属性
    groundMat.bumpTexture = normalTex;

    // 有时法线贴图的方向需要反转才能正确显示
    // 如果凹凸看起来是"凹陷"而不是"凸起"，需要反转
    groundMat.invertNormalMapX = true;
    groundMat.invertNormalMapY = true;
    texArray.push(normalTex);

    // ========== 环境光遮蔽贴图（Ambient Occlusion / AO）==========
    // AO 贴图是灰度图，用于模拟缝隙和角落的阴影
    // 白色区域接收更多光照，黑色区域接收更少光照
    // 这增加了材质的真实感和深度
    const aoTex = new Texture("./textures/stone/stone_ao.jpg", this.scene);
    groundMat.ambientTexture = aoTex;
    texArray.push(aoTex);

    // ========== 高光贴图（Specular Texture）==========
    // 控制表面的反射/高光区域
    // 白色区域反射更多光（更亮/更闪亮）
    // 黑色区域反射较少光（更哑光/更暗）
    const specTex = new Texture("./textures/stone/stone_spec.jpg", this.scene);
    groundMat.specularTexture = specTex;

    texArray.push(specTex);

    // ========== 统一设置所有纹理的 UV Scale ==========
    // 使用 forEach 循环确保所有纹理使用相同的缩放值
    // 这很重要！如果不同纹理的 UV Scale 不同，会导致纹理错位
    texArray.forEach((tex) => {
      tex.uScale = uvScale; // U 方向（水平）缩放
      tex.vScale = uvScale; // V 方向（垂直）缩放
    });

    return groundMat;
  }

  /**
   * 创建球体材质 - 使用金属纹理
   *
   * 与地面材质类似，但使用金属纹理和不同的参数
   * 演示了 specularPower 属性的使用
   *
   * @returns StandardMaterial - 配置完成的材质对象
   */
  CreateBallMaterial(): StandardMaterial {
    // 创建金属材质
    const ballMat = new StandardMaterial("ballMat", this.scene);

    // UV Scale - 金属纹理使用较小的值
    // 值为 1 表示纹理不重复，按原始大小显示
    const uvScale = 1;
    const texArray: Texture[] = [];

    // ========== 漫反射贴图 ==========
    const diffuseTex = new Texture(
      "./textures/metal/metal_diffuse.jpg",
      this.scene
    );
    ballMat.diffuseTexture = diffuseTex;
    texArray.push(diffuseTex);

    // ========== 法线贴图 ==========
    const normalTex = new Texture(
      "./textures/metal/metal_normal.jpg",
      this.scene
    );
    ballMat.bumpTexture = normalTex;

    // 反转法线贴图的 X 和 Y 方向
    // 不同的法线贴图可能需要不同的反转设置
    // 如果纹理看起来"凹进去"而不是"凸出来"，尝试反转
    ballMat.invertNormalMapX = true;
    ballMat.invertNormalMapY = true;
    texArray.push(normalTex);

    // ========== AO 贴图 ==========
    const aoTex = new Texture("./textures/metal/metal_ao.jpg", this.scene);
    ballMat.ambientTexture = aoTex;
    texArray.push(aoTex);

    // ========== 高光贴图 ==========
    const specTex = new Texture("./textures/metal/metal_spec.jpg", this.scene);
    ballMat.specularTexture = specTex;

    // ========== 高光强度（Specular Power）==========
    // 控制高光的大小和锐度
    // 值越大，高光越集中、越锐利（类似金属/塑料）
    // 值越小，高光越分散、越柔和（类似哑光表面）
    //
    // 常用值参考：
    // - 1: 非常柔和，几乎看不出高光
    // - 10: 中等锐度，适合大多数金属
    // - 64+: 非常锐利，适合高光金属或塑料
    ballMat.specularPower = 10;
    texArray.push(specTex);

    // 统一设置 UV Scale
    texArray.forEach((tex) => {
      tex.uScale = uvScale;
      tex.vScale = uvScale;
    });

    return ballMat;
  }
}
