# API 契约

`GET /health` 返回 `{ status: "ok", service: "yuzhe-api", dsh: "not-configured" }`。

聊天请求使用 `ChatRequest`：会话可选、文本、模式、回答风格和附件；响应为 `ChatResponse`。共享定义位于 `packages/contracts/src/index.ts`。附件只接受元数据，上传协议和鉴权将在 DSH 集成阶段确定。
