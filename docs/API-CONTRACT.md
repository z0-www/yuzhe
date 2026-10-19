# API 契约

## 健康检查

`GET /health` 返回：

```json
{"status":"ok","service":"yuzhe-api","dsh":"not-configured"}
```

当 API 进程注入了 `DshAdapter` 且 `isConfigured === true` 时，`dsh` 为 `configured`。默认进程不创建模拟适配器，保持 `not-configured`。

## 真实聊天边界

`POST /chat`（`/v1/chat` 同义）接受 `ChatRequest`：

```json
{
  "sessionId": "optional-session-id",
  "content": "用户文字",
  "mode": "chat",
  "answerStyle": "quick",
  "attachments": []
}
```

服务端校验模式、回答风格、附件元数据、请求体大小（默认 512 KiB）和非空内容，然后把请求交给进程内 `DshAdapter`。API 不接受可执行文件、Shell 命令、文件路径或插件参数。

真实成功响应必须是 `ChatResponse`，其中 `demo` 固定为 `false`、`provider` 固定为 `dsh`，并包含共享的 `Session` 与 assistant `Message`。API 不生成固定或 mock 回复。

错误响应使用稳定代码：

- `400 invalid_request`：JSON、字段或附件校验失败；
- `413 invalid_request`：请求体超过限制；
- `503 dsh_unavailable`：DSH 未配置、启动/初始化失败或运行时已关闭；
- `504 timeout`：请求超时或客户端断开；
- `502 upstream_error`：其他 DSH 上游错误。

响应会带非敏感 `requestId`，不会回传 SDK 原始错误、API key 或访问令牌。

## 当前接入状态

`apps/api` 已具备真实适配器的安全边界和超时映射，但默认仍使用 `UnconfiguredDshAdapter`。官方 DSH SDK/runtime 尚未在当前云环境完成真实 Smoke Test，因此 `packages/dsh-adapter` 尚未实例化 SDK 子进程；没有凭据时 API 会明确返回 503，而不是伪造 AI 回复。
