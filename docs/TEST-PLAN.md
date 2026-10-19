# 测试计划

必做：npm workspaces 安装、各包 TypeScript 类型检查、移动端 Vite 构建、API 构建、`GET /health`。

手动 UI：切换五模式、回答风格、发送消息、空输入、设置页、图片/语音占位提示、窄屏安全区域。未来接入 Capacitor 后增加 Android 构建；无 macOS/Xcode 时不声称 iOS 原生构建。

已执行：Capacitor `cap add android` 与 `cap sync` 成功；Android `assembleDebug` 未完成，因为 Gradle 发行包下载时无法解析 `services.gradle.org`。
