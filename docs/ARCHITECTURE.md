# 鱼者架构

`apps/mobile` 是 React/Vite/TypeScript 的跨平台 UI 原型，由 Capacitor 打包；`apps/api` 是 Node HTTP API；`packages/contracts` 维护会话、消息、附件、任务和聊天响应类型；`packages/dsh-adapter` 是唯一允许接触 DSH SDK 的边界。客户端只访问 API，密钥不进入客户端。DSH Web 端口不对公网暴露。

真实请求链路目标是：移动端 → `POST /chat` → 进程内 `DshAdapter` → 官方 `@deepseek-ai/dsh-sdk-client` 子进程 → `dsh --profile sdk` → 已配置 provider/model → 事件流 → 稳定 `ChatResponse`。API 负责输入校验、请求超时、错误分类和适配器生命周期；SDK 内部事件对象不会直接暴露给客户端。

当前 API 已实现这条链路的公共边界，但默认注入 `UnconfiguredDshAdapter`，所以运行时返回明确的 503。只有固定版本的官方 runtime、provider/model 配置和真实 Smoke Test 成功后，才允许替换为 SDK-backed adapter。不同用户的会话与工作目录必须由后续 adapter/认证层按用户身份隔离；当前演示 API 尚未提供账号层。

移动端视觉基准见 `design-reference/鱼者-首页与模式轮盘.html`，其设计原则已映射到顶部栏、输入框和弧形轮盘。
