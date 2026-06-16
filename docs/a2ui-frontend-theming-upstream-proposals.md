# A2UI 前端主题化：上游（`@anycms/a2ui`）优化建议

> **目标**：让宿主应用能以「换 CSS 变量即换肤」的方式，为不同客户 / 租户定制 A2UI surface 的视觉。
> **范围**：本文档只记录**需要提交给底层库 [`anycms-a2ui`](../../../../../anycms-rs/anycms-a2ui) 的改造建议**。宿主侧（ai-station-react）的落地实现（Agent.theme 字段、registry 工厂化、SurfaceCard 令牌容器）另行处理，不在本文档内。

---

## 1. 背景与动机

当前集成现状：

- `app/lib/a2ui/registry.tsx`：以 `shadcnReactComponents` 为基座，覆写了 `Text / Column / Row / List / Card` 5 个 layout 组件。
- `app/lib/a2ui/renderer.tsx`：用 `<A2uiSurface surface registry={a2uiRegistry}>` 渲染 surface。
- `app/routes/dashboard.agents.$id.tsx`：按 `agent.enable_a2ui` 把 surface 卡片按时间混排进对话流。

业务需求：**不同客户有不同的 UI 设计样式需求**（品牌色、字体、圆角，乃至组件观感）。A2UI 的 preset 架构（`registry` 可替换、binder 与 view 解耦）在设计上已经支持换肤——「换肤 = 换一个 `registry` prop」。但落到「**Tailwind v4 宿主 + 多租户动态主题**」这一具体场景，有几处底层库的摩擦需要打磨。

A2UI 的分层定位决定了分工：

| 层次 | 职责 | 归属 |
| --- | --- | --- |
| 换肤**机制**（preset = 可替换 registry） | 提供 + 维护 | **底层库（已完成）** |
| 基座 preset（vanilla / shadcn） | 提供 | **底层库（已完成）** |
| 选哪套 preset、令牌是什么、客户长什么样 | 选 / 注入 | 宿主应用 |

因此本文档的建议都属于「让底层库更好地**支撑**多租户主题」，而非让库去认识具体客户。

---

## 2. 已核验的现状（证据基线）

> 证据取自上游源码 `/home/liangdi/workspace/anycms-rs/anycms-a2ui` 与宿主 `ai-station-react`。

| 项 | 现状 | 证据 |
| --- | --- | --- |
| `ReactComponentRegistry` 类型 | `ReadonlyMap<string, ComponentType<{ ctx }>>`，已从 `@anycms/a2ui-react` 导出 | `packages/a2ui-react/src/adapter.tsx:25` |
| registry 合并 helper | **不存在** | 全仓库 `grep mergeRegist*` 无结果 |
| shadcn preset 导出 | `shadcnReactComponents`、`cn`、`Card`/`CardContent`、`variants`、全套 `ui/*` 原语 | `packages/a2ui-react-shadcn/src/index.ts` |
| shadcn 的 18 个 View 中硬编码颜色 / 十六进制 | **0 处**（视觉全部委托给 `ui/*` 原语） | `grep` 硬编码色 / `#hex` = 0 命中 |
| shadcn View 直接用语义 token | 仅 1 处 `text-foreground`（其余走 `ui/*`） | `grep` `src/components` |
| **shadcn token 契约** | 老版 shadcn 约定：`--primary` / `--background`…，**HSL 三元组**，钉在 `:root` | `packages/a2ui-react-shadcn/styles.css` |
| **宿主 token 契约** | Tailwind **v4**：`--color-primary` / `--color-background`…（hex / oklch） | `app/app.css:117-130` |
| 宿主是否 import preset `styles.css` | **否** | `grep a2ui-react-shadcn/styles` 无命中 |
| `<A2uiSurface>` props | `{ surface, catalog?, registry? }`，**无** `className` / `style` / `theme` | `packages/a2ui-react/src/Surface.tsx:17-21` |
| `themeSchema` | 类型 `unknown` 占位，**渲染层未消费** | `packages/a2ui-core/src/catalog/index.ts:8,21,28` |

**关键结论**：宿主是 Tailwind v4（`--color-*`），而 shadcn preset 基于老版约定（`--primary`，HSL）且宿主未 import 其 `styles.css`——**两套 token 契约并存且命名 / 格式不同**。这正是多租户主题化的主要摩擦点。

---

## 3. 上游优化建议（按优先级）

### P0 —— Tailwind v4 token 契约对齐（含金量最高）

**问题**：shadcn preset 的 `ui/*` 原语与 `styles.css` 使用老版 shadcn token 契约（`--primary` 等 HSL 三元组）；而 Tailwind v4 宿主的原生契约是 `--color-primary`（hex / oklch）。导致宿主想做「按客户换 CSS 变量」时，**容器上设的变量名必须迁就 preset 的老约定**，无法复用宿主已有的 v4 主题令牌，每个客户主题都要在两套命名间搭桥。

**证据**：

- preset：`packages/a2ui-react-shadcn/styles.css`（`:root { --primary: 240 5.9% 10%; ...}`）
- 宿主：`app/app.css`（`--color-primary: ...`）
- 宿主**未 import** preset 的 `styles.css`

**建议方案（二选一，推荐 A）**：

- **A. 双轨兼容**：preset 同时识别 v4 的 `--color-*` 与老版 `--primary`。`styles.css` / `ui/*` 改为以 `--color-*` 为一等契约，并为老版 `--primary` 提供向后兼容别名（例如 `:root { --primary: var(--color-primary); }` 过渡期）。这样 v4 宿主可直接用自身令牌驱动 preset。
- **B. 迁移到 v4**：彻底切到 `--color-*`，`bg-primary` 等编译为 `var(--color-primary)`；老版用户在 breaking change 中迁移。

**预期收益**：宿主的「SurfaceCard 令牌容器」方案可直接套用自身 v4 token，无需桥接；多客户主题 = 容器上换一组 `--color-*`，preset 自动跟随。

**风险**：触及 preset 全部 `ui/*` 与 `styles.css`，需回归 gallery 的 vanilla/shadcn 切换与各组件快照测试。

---

### P1 —— `mergeRegistries(base, ...overrides)` 工具（纯 DX，零风险）

**问题**：`ReactComponentRegistry` 是 `ReadonlyMap`，库未提供合并工具。每个消费者都在手写 `new Map(shadcnReactComponents)` + 循环 `.set()`（宿主 `app/lib/a2ui/registry.tsx` 也是）。多 preset / 多覆写场景下这是重复样板。

**建议 API**：

```ts
// packages/a2ui-react/src/registry.ts （新增导出）
import type { ReactComponentRegistry } from "./adapter";

/**
 * 合并多个 registry，后者覆盖前者（按组件 type）。
 * 返回新的 ReadonlyMap，不修改入参。
 */
export function mergeRegistries(
  base: ReactComponentRegistry,
  ...overrides: ReactComponentRegistry[]
): ReactComponentRegistry {
  const merged = new Map(base);
  for (const o of overrides) {
    for (const [type, comp] of o) merged.set(type, comp);
  }
  return merged;
}
```

**预期收益**：registry 工厂化从样板代码变成一行 `mergeRegistries(base, brandOverrides)`。无破坏性，纯增量。

---

### P2 —— `<A2uiSurface>` 透传 `className` / `style`（或 `theme`）

**问题**：`<A2uiSurface>` 目前只接受 `{ surface, catalog?, registry? }`。宿主做「令牌容器」主题化时必须在外层**多包一层 div** 来承载 CSS 变量。

**建议 API**：

```ts
// packages/a2ui-react/src/Surface.tsx
export interface A2uiSurfaceProps {
  surface: SurfaceModel;
  catalog?: Catalog;
  registry?: ReactComponentRegistry;
  className?: string;          // 透传到根节点
  style?: React.CSSProperties; // 令牌容器：style={{ "--color-primary": "#x" } as React.CSSProperties}
}
```

**预期收益**：去掉外层 wrapper div；`className` 也便于挂 `a2ui-surface` hook 与主题作用域 class。低风险、增量。

---

### P3 —— `styles.css` 默认主题作用域化

**问题**：preset 把默认 zinc 主题钉死在 `:root`（`packages/a2ui-react-shadcn/styles.css`），并要求宿主「import after tailwind」。多租户动态主题时，全局 `:root` 会与 wrapper 上的覆盖竞争（后代选择器能赢，但不优雅，也难以做「不引入默认主题」的纯宿主驱动场景）。

**建议**：把默认主题从裸 `:root` 迁到一个可选项 class，例如 `.a2ui-shadcn-default-theme`；`styles.css` 注释说明「需要默认主题就在根节点加该 class」。宿主想完全自控 token 时可不引入 / 不挂该 class。

**预期收益**：多租户主题不与全局默认打架；纯宿主驱动主题成为一等支持路径。

---

## 4. 非议题：`themeSchema`

`Catalog.themeSchema` 当前是 `unknown` 占位字段，**渲染层没有任何消费**。它**不是**一个可用的「数据驱动主题」功能。本主题化方案（宿主侧静态令牌）**不需要**它。

> 只有当未来需要「服务端 / 客户端按会话下发一段 theme JSON 驱动设计令牌」时，才需要底层库去实现 `themeSchema` 的解析与渲染消费。届时另立设计，不在本建议范围内。

---

## 5. 建议的 PR 拆分（给上游）

| PR | 内容 | 优先级 | 风险 |
| --- | --- | --- | --- |
| PR1 | P1 `mergeRegistries` 工具 + 单测 | 高 | 极低（纯增量） |
| PR2 | P0 Tailwind v4 token 契约对齐（含 gallery 回归） | 高 | 中（触及全部 `ui/*` 与 `styles.css`） |
| PR3 | P2 `<A2uiSurface>` 透传 `className`/`style` + P3 `styles.css` 作用域化 | 中 | 低 |

建议从 PR1 起步（零风险、立即收益），PR2 作为核心收益项单独评审。

---

## 6. 关联

- **宿主侧落地**（不在本文档）：`app/lib/a2ui/registry.tsx`（registry 工厂化）、`app/lib/a2ui/renderer.tsx`（SurfaceCard 令牌容器）、`packages/types/src/agent.ts`（`Agent.theme` 字段）。
- **上游仓库**：`/home/liangdi/workspace/anycms-rs/anycms-a2ui`
- **协议规范**：`anycms-a2ui` 仓库内 `a2ui/specification/v1_0/`
