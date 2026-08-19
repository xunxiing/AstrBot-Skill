用 OpenAPI 调试 AstrBot 插件有三个核心技巧：

1. 用 /api/v1/plugin/reload 热重载，能立刻生效新代码。配合 /api/v1/config/read/logs 确认状态。
2. 用 /api/v1/chat 直接注入命令（如 550cnews_test_md file），触发插件命令而不是自由 chat。记得用你的前缀（如 550c）。
3. 结果/图片/日志都可直接 GET 查看，如 /data/attachments/ 下图，/api/v1/logs 查 Traceback，能精确定位问题。
二：对于plugin page的开发，请使用/api/v1/plugins/pages 进行检索插件页面的列表、HTML 入口与静态资源，并作为代理转发对插件扩展路由的各种 HTTP 请求
