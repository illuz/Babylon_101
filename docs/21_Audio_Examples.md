# Babylon.js 音频系统详解

## 概述
Babylon.js 提供了强大的音频系统，支持两种主要音频类型：
| 类型 | 特点 | 典型用途 |
|------|------|----------|
| **2D 音频** | 全场景相同音量播放 | 背景音乐（BGM）、UI 音效 |
| **3D 音频** | 根据距离动态调整音量 | 环境音效、角色音效、空间定位音效 |
## 核心 API：Sound 类
### 基本用法
```typescript
import { Sound } from "@babylonjs/core";
// 创建声音
const sound = new Sound(
  "soundName",           // 声音名称（标识符）
  "./audio/file.mp3",    // 音频文件路径
  scene,                 // 场景对象
  callback,              // 加载完成回调（可为 null）
  options                // 配置选项
);
```
### 常用配置选项
```typescript
interface SoundOptions {
  volume?: number;        // 音量 (0.0 - 1.0)，默认 1.0
  autoplay?: boolean;     // 自动播放，默认 false
  loop?: boolean;         // 循环播放，默认 false
  spatialSound?: boolean; // 启用 3D 空间音频，默认 false
  maxDistance?: number;   // 最大可听距离（仅 linear 模型）
  distanceModel?: "linear" | "inverse" | "exponential";
}
```
---
## 2D 音频：背景音乐（BGM）
### 特点
- 在整个场景中以**相同音量**播放
- 不受相机位置影响
- 适合背景音乐、全局音效
### 示例代码
```typescript
const backgroundMusic = new Sound(
  "backgroundMusic",
  "./audio/terror_ambience.mp3",
  this.scene,
  null,
  {
    volume: 0.75,   // 设置音量为 75%
    autoplay: true, // 自动播放
  }
);
```
### 淡入淡出效果
使用 `setVolume()` 方法实现平滑的音量变化：
```typescript
// 创建时音量设为 0
const bgm = new Sound("bgm", "./audio/music.mp3", scene, null, {
  volume: 0,
  autoplay: true
});
// 在 30 秒内渐变到目标音量
bgm.setVolume(0.75, 30);  // 参数：目标音量, 过渡时间（秒）
```
---
## 3D 音频：空间音效（SFX）
### 特点
- 音量根据**听者与声源的距离**动态变化
- 需要 `spatialSound: true` 启用
- 适合游戏中的环境音效、角色音效
### 示例代码
```typescript
const growlFx = new Sound(
  "growlFx",
  "./audio/growl.mp3",
  this.scene,
  null,
  {
    spatialSound: true,  // 启用 3D 空间音频（关键设置！）
    maxDistance: 10,     // 最大可听距离 10 单位
  }
);
```
### 距离模型（Distance Model）
| 模型 | 说明 | 适用场景 |
|------|------|----------|
| `linear` | 线性衰减，超过 maxDistance 完全消失 | 简单场景 |
| `inverse` | 反比衰减（物理真实） | 自然环境 |
| `exponential` | 指数衰减，距离越远衰减越快 | 特殊效果 |
### 定位方式
#### 方式一：固定位置（setPosition）
适用于**静止**的声源：
```typescript
growlFx.setPosition(new Vector3(-7, 0, 0));
```
#### 方式二：附加到网格（attachToMesh）
适用于**移动**的声源：
```typescript
growlFx.attachToMesh(zombieMesh);
```
---
## 音频控制方法
### 播放控制
```typescript
sound.play();
sound.pause();
sound.stop();
if (sound.isPlaying) {
  // 音频正在播放
}
```
### 音量控制
```typescript
sound.setVolume(0.5);
sound.setVolume(0.8, 3);  // 3 秒内渐变
```
### 播放速率
```typescript
// 1.0 = 正常速度
// < 1.0 = 减速（声音变低沉）
// > 1.0 = 加速（声音变尖锐）
sound.setPlaybackRate(1.87);
```
---
## 动画事件触发音频
结合 `AnimationEvent` 在动画特定帧播放音效：
```typescript
import { AnimationEvent } from "@babylonjs/core";
const audioEvent = new AnimationEvent(
  70,  // 触发帧号
  () => {
    if (!soundFx.isPlaying) {
      soundFx.play();
    }
  },
  false  // 是否只触发一次
);
animation.addEvent(audioEvent);
```
---
## 关键知识点总结
### Sound 类核心概念
| 概念 | 说明 |
|------|------|
| `autoplay` | 自动播放 |
| `spatialSound` | 启用 3D 空间音频 |
| `maxDistance` | 最大可听距离（linear 模型） |
| `distanceModel` | 距离衰减算法 |
### 常用方法
| 方法 | 用途 |
|------|------|
| `play()` | 播放音频 |
| `pause()` | 暂停播放 |
| `stop()` | 停止播放 |
| `setVolume(value, time)` | 设置音量 |
| `setPlaybackRate(rate)` | 设置播放速率 |
| `setPosition(vector3)` | 设置 3D 音频位置 |
| `attachToMesh(mesh)` | 将音频附加到网格 |
### 最佳实践
1. 背景音乐使用 2D 音频 + 淡入淡出
2. 环境音效使用 3D 音频 + 固定位置
3. 角色音效使用 3D 音频 + attachToMesh
4. 播放前检查 `isPlaying` 防止重叠
5. 避免同时播放过多 3D 音频
