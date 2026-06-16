# A2UI

> **语言：** **简体中文** | [English](./README_en.md)

**[A2UI](https://github.com/a2ui-project/a2ui) v1.0** 的 TypeScript 实现 —— 一种服务端驱动的 UI 协议：服务端以流式方式下发组件描述与数据，由一个轻量客户端完成渲染。本仓库提供：框架无关的核心层、可替换预设的 React 与 Vue 3 渲染器、框架无关的原生 DOM 渲染器、SSE 传输层，以及可在线运行的示例 gallery。v1.0 协议规范内置于 [`a2ui/specification/`](./a2ui/specification)。

> 规范状态：**v1.0 候选版**（趋于稳定；仅在很高门槛下才接受破坏性变更）。

## 包（Packages）

本仓库是一个 [pnpm](https://pnpm.io) workspace，所有可发布的包都位于 npm 的 `@anycms` scope 下。

| 包 | 说明 | 是否发布 |
| --- | --- | --- |
| [`@anycms/a2ui-core`](./packages/a2ui-core) | 框架无关的数据层：自研零依赖响应式（`Signal` / `EventSource` / `Computed` / `batch`）、JSON-Pointer 数据模型、消息处理，以及基于 Zod 的协议校验。 | ✅ |
| [`@anycms/a2ui-dom`](./packages/a2ui-dom) | **框架无关的原生 DOM 渲染器** —— 同样 18 个组件，用原生 DOM 元素渲染，零 UI 框架依赖（`mountDomSurface`）。 | ✅ |
| [`@anycms/a2ui-react`](./packages/a2ui-react) | React 适配器：`createReactComponent`、`<A2uiSurface>`，以及 18 个基础目录（basic catalog）的 **vanilla** 视图。 | ✅ |
| [`@anycms/a2ui-react-shadcn`](./packages/a2ui-react-shadcn) | **shadcn/ui 预设** —— 同样 18 个组件，使用 Radix UI + Tailwind 重新换肤（cva + tailwind-merge + lucide）。 | ✅ |
| [`@anycms/a2ui-vue`](./packages/a2ui-vue) | **Vue 3 渲染器** —— `createVueComponent`、`<A2uiSurface>`，以及 18 个基础目录的 vanilla 视图（以 Vue 组件形式）。 | ✅ |
| [`@anycms/a2ui-transport-sse`](./packages/a2ui-transport-sse) | SSE 传输适配器：将后端接入 `MessageProcessor`（客户端 → 服务端 → 客户端 action 的闭环）。 | ✅ |
| [`@anycms/a2ui-gallery`](./packages/a2ui-gallery) | Vite 三栏示例应用：官方示例离线单步回放 + 实时 SSE，可在 Vanilla/shadcn/DOM 之间切换。 | ❌ `private` |
| [`@anycms/a2ui-vue-gallery`](./packages/a2ui-vue-gallery) | Vite **Vue 3** 示例应用：同样的离线示例 + 实时 SSE，可在 Vue/DOM 渲染器之间切换。 | ❌ `private` |

## 快速开始

```bash
pnpm add @anycms/a2ui-core @anycms/a2ui-react react react-dom
```

```tsx
import { MessageProcessor, basicCatalog } from '@anycms/a2ui-core';
import { A2uiSurface } from '@anycms/a2ui-react';

// 1. 创建 processor（注册你的服务端会下发的 catalog）
const processor = new MessageProcessor({ catalogs: [basicCatalog] });

// 2. 喂入 服务端 -> 客户端 的 A2UI 消息
processor.processMessages(serverMessages);

// 3. 渲染服务端创建的 surface
export function App() {
  const surface = processor.model.get('primary')!; // surfaceId 来自你的服务端
  return <A2uiSurface surface={surface} />;
}
```

`<A2uiSurface>` 接受的 props：
- `surface: SurfaceModel` *（必填）* —— 通过 `processor.model.get(surfaceId)` 获取
- `catalog?: Catalog` —— 默认为 `basicCatalog`
- `registry?: ReactComponentRegistry` —— 默认为 `basicReactComponents`

属性与数据变更都经由响应式数据模型流动，因此被绑定的节点会自动重新渲染 —— 无需手动订阅。

### 渲染器预设（Presets）

“预设（preset）”是一组 View 组件加上一个 `ReactComponentRegistry`。binder 与适配器原样复用，只有 View 不同。切换外观只需一个 prop：

```tsx
import { A2uiSurface } from '@anycms/a2ui-react';
import { shadcnReactComponents } from '@anycms/a2ui-react-shadcn';
import '@anycms/a2ui-react-shadcn/styles.css';

<A2uiSurface surface={surface} registry={shadcnReactComponents} />
```

新增预设（MUI、Chakra……）遵循同样的结构 —— 以 `a2ui-react-shadcn` 为模板复制即可。

### 框架无关的 DOM 渲染器

对于不运行 UI 框架的宿主环境（Web Components、SSR 片段、嵌入式 widget），`@anycms/a2ui-dom` 用原生 DOM 元素渲染同样的消息流，**零框架依赖**。它原样复用核心的 binder 与响应式运行时，仅重新实现了适配器与 18 个 View。

```ts
import { MessageProcessor, basicCatalog } from '@anycms/a2ui-core';
import { mountDomSurface } from '@anycms/a2ui-dom';

const processor = new MessageProcessor({ catalogs: [basicCatalog] });
processor.processMessages(serverMessages);

const surface = processor.model.get('primary')!;
const handle = mountDomSurface(surface, document.getElementById('host')!);
// 之后：handle.dispose();
```

每个被绑定的节点都订阅自己的响应式 props 流；输入框在重新渲染间保持焦点，交互式组件保留本地 UI 状态（如选中的 Tab、打开的 Modal）。

### Vue 3 渲染器

对于 Vue 3 宿主环境，`@anycms/a2ui-vue` 用原生 Vue 组件（`createVueComponent`、`<A2uiSurface>`）渲染同样的消息流。它原样复用核心的 binder 与响应式运行时，仅重新实现了适配器与 18 个 View。

```vue
<script setup lang="ts">
import { MessageProcessor, basicCatalog } from '@anycms/a2ui-core';
import { A2uiSurface } from '@anycms/a2ui-vue';

const processor = new MessageProcessor({ catalogs: [basicCatalog] });
processor.processMessages(serverMessages);
const surface = processor.model.get('primary')!;
</script>

<template>
  <A2uiSurface :surface="surface" />
</template>
```

每个被绑定的节点自行订阅结构事件，因此组件类型变化会重建其绑定、迟到的子组件会自动挂载 —— 无需顶层强制重渲染。输入框保持焦点（Vue 运行时会保护 `value` 属性），`Tabs`/`Modal` 保留本地 UI 状态。

### SSE 传输层

```ts
import { MessageProcessor, basicCatalog } from '@anycms/a2ui-core';
import { SseA2uiTransport } from '@anycms/a2ui-transport-sse';

const processor = new MessageProcessor({ catalogs: [basicCatalog] });
const transport = new SseA2uiTransport({
  baseUrl: 'http://127.0.0.1:3000',
  prompt: 'weather in beijing',
  processor,
});
```

传输层将入站的 A2UI 消息解析进 processor，并把出站的客户端 action 序列化发出。可与任何遵循 v1.0 协议的后端搭配（参考 `anycms-agent` Rust 的 `27_a2ui_interceptor_renderer` 示例服务端）。

## 开发

```bash
pnpm install
pnpm dev        # gallery 启动于 http://localhost:5173
pnpm typecheck  # 对所有包执行 tsc --noEmit
pnpm test       # 对所有包执行 vitest
pnpm build      # 构建所有可发布的包
```

要求 Node ≥ 20、pnpm 10。

### 发布

版本号由 [release-it](https://github.com/release-it/release-it) 统一编排；
changelog 由 [git-cliff](https://git-cliff.org)（[`cliff.toml`](./cliff.toml)）生成。
六个可发布的包采用**锁定步进（lockstep）**版本（共享同一个版本号）；
`@anycms/a2ui-gallery` 与 `@anycms/a2ui-vue-gallery` 为私有包，不参与。发布时，release-it
提升版本号（`@release-it/bumper` 写入全部六个 `package.json`），通过 `git cliff` 重新生成
[`CHANGELOG.md`](./CHANGELOG.md)，然后提交、打 tag（`v<version>`）并推送。

```bash
pnpm release       # 交互式 —— 依据提交历史推荐一个版本增量，随后执行 增量 / changelog / 提交 / 打 tag / 推送
pnpm release:dry   # 预览发布流程，不实际改动任何内容
```

发布到 npm 是**单独、显式的一步**（在带 tag 的提交推送之后、并已确认构建通过时执行）：

```bash
pnpm publish:npm   # 构建所有可发布的包，随后 pnpm -r publish
```

`just` 用户：`just release`、`just release-dry`、`just publish`。

## 仓库结构

```
anycms-a2ui/
├─ packages/
│  ├─ a2ui-core/             # 框架无关核心层（响应式 + 数据 + 消息）
│  ├─ a2ui-dom/              # 框架无关的原生 DOM 渲染器
│  ├─ a2ui-react/            # React 适配器 + vanilla 预设
│  ├─ a2ui-react-shadcn/     # shadcn/ui 预设
│  ├─ a2ui-vue/              # Vue 3 渲染器（vanilla 预设）
│  ├─ a2ui-transport-sse/    # SSE 传输层
│  ├─ a2ui-gallery/          # React 示例应用（私有）
│  └─ a2ui-vue-gallery/      # Vue 示例应用（私有）
└─ a2ui/specification/v1_0/  # 内置的 A2UI v1.0 规范（json / docs / catalogs / test / eval）
```

## 规范（Specification）

协议定义于 [`a2ui/specification/v1_0/`](./a2ui/specification/v1_0)。基础组件目录（basic catalog）标识为：

```
https://a2ui.org/specification/v1_0/catalogs/basic/catalog.json
```

规范文档：
- [协议（Protocol）](./a2ui/specification/v1_0/docs/a2ui_protocol.md)
- [渲染器指南（Renderer guide）](./a2ui/specification/v1_0/docs/renderer_guide.md)
- [自定义函数（Custom functions）](./a2ui/specification/v1_0/docs/a2ui_custom_functions.md)
- [扩展规范（Extension specification）](./a2ui/specification/v1_0/docs/a2ui_extension_specification.md)
- [演进指南（Evolution guide）](./a2ui/specification/v1_0/docs/evolution_guide.md)

## License

[MIT](./LICENSE) © Liangdi
