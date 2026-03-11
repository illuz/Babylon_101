# Babylon.js 自定义加载屏幕知识点

## 概述

加载屏幕是 3D 应用程序中重要的用户体验组件。当加载大型 3D 模型、纹理或其他资源时，加载屏幕为用户提供视觉反馈，告知他们内容正在加载中。Babylon.js 提供了灵活的机制来实现自定义加载屏幕。

## 核心概念

### 1. ILoadingScreen 接口

Babylon.js 定义了 `ILoadingScreen` 接口，任何自定义加载屏幕都必须实现此接口：

```typescript
interface ILoadingScreen {
  // 必须实现的属性
  loadingUIBackgroundColor: string;  // 背景颜色
  loadingUIText: string;              // 加载文字

  // 必须实现的方法
  displayLoadingUI(): void;  // 显示加载界面
  hideLoadingUI(): void;     // 隐藏加载界面
}
```

### 2. Engine 的加载屏幕管理

Engine 类提供了加载屏幕的管理接口：

```typescript
// 显示加载界面
engine.displayLoadingUI();

// 隐藏加载界面
engine.hideLoadingUI();

// 替换默认加载屏幕
engine.loadingScreen = customLoadingScreen;
```

## 实现方式

### 方式一：使用默认加载屏幕

Babylon.js 内置了默认的加载屏幕，包含 logo 和旋转动画：

```typescript
// 显示默认加载界面
engine.displayLoadingUI();

// 加载资源...

// 隐藏加载界面
engine.hideLoadingUI();
```

### 方式二：实现自定义加载屏幕

创建自定义加载屏幕类：

```typescript
import { ILoadingScreen } from "@babylonjs/core";

export class CustomLoadingScreen implements ILoadingScreen {
  loadingUIBackgroundColor: string;
  loadingUIText: string;

  constructor(
    private loadingBar: HTMLElement,      // 进度条元素
    private percentLoaded: HTMLElement,   // 百分比文字元素
    private loader: HTMLElement           // 加载容器元素
  ) {}

  // 显示加载界面时调用
  displayLoadingUI(): void {
    this.loadingBar.style.width = "0%";
    this.percentLoaded.innerText = "0%";
  }

  // 隐藏加载界面时调用
  hideLoadingUI(): void {
    // 实现淡出效果
    this.loader.id = "loaded";

    setTimeout(() => {
      this.loader.style.display = "none";
    }, 1000);
  }

  // 自定义方法：更新加载进度
  updateLoadStatus(status: string): void {
    this.loadingBar.style.width = `${status}%`;
    this.percentLoaded.innerText = `${status}%`;
  }
}
```

### 方式三：Vue 组件化加载屏幕

在 Vue 中实现加载屏幕，通过 props 和 watchers 控制：

```vue
<template>
  <main :class="['loader', { loaded: isLoaded }]">
    <div class="animation-container">
      <p class="child1">{</p>
      <p class="child2">CS</p>
      <p class="child3">}</p>
    </div>
    <p>Loading</p>
  </main>
</template>

<script>
export default {
  props: {
    isLoaded: Boolean
  },
  watch: {
    isLoaded(newVal) {
      if (newVal) {
        setTimeout(() => {
          const loader = document.getElementsByClassName("loader")[0];
          loader.setAttribute("style", "display: none");
        }, 1000);
      }
    }
  }
};
</script>
```

## 实时进度跟踪

### 使用 SceneLoader 的 onProgress 回调

```typescript
await SceneLoader.ImportMeshAsync(
  "",
  "./models/",
  "model.glb",
  this.scene,
  // onProgress 回调
  (evt) => {
    // 计算加载百分比
    const loadStatus = ((evt.loaded * 100) / evt.total).toFixed();

    // 更新加载屏幕
    this.loadingScreen.updateLoadStatus(loadStatus);
  }
);
```

### 进度事件对象

`onProgress` 回调接收一个事件对象：

| 属性 | 类型 | 描述 |
|------|------|------|
| `loaded` | number | 已加载的字节数 |
| `total` | number | 总字节数 |
| `lengthComputable` | boolean | 是否可以计算长度 |

## 过渡效果实现

### CSS 过渡动画

```css
/* 加载状态 */
#loader {
  position: absolute;
  width: 100%;
  height: 100%;
  background-color: white;
  z-index: 100;
}

/* 加载完成状态 */
#loaded {
  position: absolute;
  width: 100%;
  height: 100%;
  background-color: white;
  z-index: 100;
  opacity: 0;
  transition: opacity 1s;  /* 1秒淡出动画 */
}
```

### JavaScript 控制流程

```typescript
hideLoadingUI(): void {
  // 1. 更改 ID 触发 CSS 过渡
  this.loader.id = "loaded";

  // 2. 等待过渡完成后隐藏元素
  setTimeout(() => {
    this.loader.style.display = "none";
  }, 1000);
}
```

## 最佳实践

### 1. 加载屏幕设计原则

- **简洁明了**：用户需要立即知道正在加载
- **进度反馈**：显示具体进度百分比
- **视觉一致**：与应用整体风格一致
- **平滑过渡**：加载完成时平滑淡出

### 2. 性能考虑

- 加载屏幕本身的资源应该尽可能小
- 避免在加载屏幕中使用复杂的动画
- 使用 CSS 动画而非 JavaScript 动画

### 3. 用户体验

```typescript
// 建议的最小显示时间，避免闪烁
const MIN_DISPLAY_TIME = 500; // 毫秒

async CreateEnvironment(): Promise<void> {
  const startTime = Date.now();

  await SceneLoader.ImportMeshAsync(...);

  const elapsed = Date.now() - startTime;
  const remainingTime = Math.max(0, MIN_DISPLAY_TIME - elapsed);

  setTimeout(() => {
    this.engine.hideLoadingUI();
  }, remainingTime);
}
```

### 4. 错误处理

```typescript
async CreateEnvironment(): Promise<void> {
  try {
    await SceneLoader.ImportMeshAsync(...);
    this.engine.hideLoadingUI();
  } catch (error) {
    // 显示错误信息
    console.error("加载错误:", error);
  }
}
```

## 代码示例结构

```
src/BabylonExamples/
├── CustomLoading.ts           # 自定义加载场景主类
├── CustomLoadingScreen.ts     # 自定义加载屏幕实现
└── snippets/
    └── LoadingSceneDemo.ts    # 默认加载屏幕演示
```

## 相关 API 参考

### Engine

| 方法/属性 | 描述 |
|-----------|------|
| `displayLoadingUI()` | 显示加载界面 |
| `hideLoadingUI()` | 隐藏加载界面 |
| `loadingScreen` | 加载屏幕实例（可替换） |

### SceneLoader

| 方法 | 描述 |
|------|------|
| `ImportMeshAsync(meshName, rootUrl, sceneFilename, scene?, onProgress?)` | 异步加载网格 |

### ILoadingScreen

| 方法/属性 | 描述 |
|-----------|------|
| `displayLoadingUI()` | 显示加载界面 |
| `hideLoadingUI()` | 隐藏加载界面 |
| `loadingUIBackgroundColor` | 背景颜色属性 |
| `loadingUIText` | 加载文字属性 |

## 总结

自定义加载屏幕是提升 3D 应用用户体验的重要手段。Babylon.js 通过 `ILoadingScreen` 接口提供了灵活的扩展机制，开发者可以：

1. 使用默认加载屏幕快速实现
2. 实现 `ILoadingScreen` 接口创建完全自定义的加载界面
3. 使用 Vue 等框架实现组件化的加载屏幕
4. 通过 `onProgress` 回调实现实时进度跟踪
5. 使用 CSS 过渡实现平滑的加载完成动画

合理设计加载屏幕可以显著提升用户对应用加载时间的感知，减少等待时的焦虑感。