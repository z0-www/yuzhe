# 鱼者架构

`apps/mobile` 是 React/Vite/TypeScript 的跨平台 UI 原型，未来由 Capacitor 打包；`apps/api` 是 Node HTTP API；`packages/contracts` 维护会话、消息、附件和任务类型；`packages/dsh-adapter` 隔离 DSH SDK 版本与协议。客户端只访问 API，密钥不进入客户端。DSH Web 端口不对公网暴露。

当前 API 仅健康检查，移动端明确处于演示模式。移动端视觉基准见 `design-reference/鱼者-首页与模式轮盘.html`，其设计原则已映射到顶部栏、输入框和弧形轮盘。真实 DSH SDK 需要在官方版本、启动/恢复、事件流、超时和关闭流程完成审计后接入适配器。
