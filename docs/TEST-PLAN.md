# 测试计划

## 自动化验收

- `npm ci`：依赖锁定安装。
- `npm run typecheck --workspaces`：API、移动端、contracts、DSH adapter 类型检查。
- `npm run build --workspaces`：API TypeScript 输出、移动端 Vite 构建和共享包构建。
- `npm run test --workspaces`：Node test runner/tsx 执行 API、移动端逻辑和 DSH adapter 测试。
- `npm run lint --workspaces`：当前各 workspace 使用 TypeScript 无输出检查作为 lint 门槛。

移动端自动化覆盖五种模式和环绕切换、快速/深度状态、空输入拒绝、演示回复标记；API 覆盖 `/health` 和 404；DSH adapter 覆盖未配置时明确报错和幂等关闭。

## UI 检查

已修复：轮盘触摸监听限制在轮盘区域；轮盘使用百分比位置和 `clamp` 尺寸，避免 320/375/393/430px 宽度的固定像素裁切；增加 viewport、`100dvh`、安全区底部 inset 和可滚动主区以适配软键盘；附件、录音、设置返回路径均保留明确状态。

仍需真机或浏览器设备模拟验证：各尺寸实际截图、Android 状态栏/手势区、软键盘弹出时的滚动位置、VoiceOver/TalkBack、触摸滑动与按钮点击的手势细节。

## Android

`npx cap add android` 与 `npm run cap:sync --workspace=@yuzhe/mobile` 已通过。`apps/mobile/android/gradlew --no-daemon assembleDebug` 未通过：wrapper 尝试从 `https://services.gradle.org/distributions/gradle-8.2.1-all.zip` 下载时收到 `java.net.UnknownHostException: services.gradle.org`。没有 APK 产物，因此不能声称可安装。
