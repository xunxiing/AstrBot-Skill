---
title: 临时文件管理与自动清理 (Temporary File Management)
type: improvement
status: stable
last_updated: 2024-05-22
related_base: storage/file_storage.md
---

## 概述

AstrBot 引入了中心化的临时文件管理机制，将所有插件、适配器和核心组件产生的瞬时资源（如 TTS 音频、沙箱输出、平台媒体）统一收拢至 `data/temp` 目录，并由系统自动执行生命周期管理。开发者不再需要手动删除临时文件，转而依赖全局的清理策略。

## 核心机制

### 1. 路径标准化

所有临时资源必须通过 `get_astrbot_temp_path()` 获取存储路径，严禁硬编码 `data/temp`。该路径确保了跨平台兼容性，并受 `TempDirCleaner` 监控。

### 2. 自动清理 (TempDirCleaner)

系统内置 `TempDirCleaner` 异步任务，每 10 分钟执行一次容量检查：
- **容量限制**: 由配置项 `temp_dir_max_size` (MB) 定义。
- **清理逻辑**: 当目录总大小超过阈值时，系统按文件修改时间 (mtime) 从旧到新排序，自动删除文件直至释放约 30% 的空间。
- **生命周期**: 随 `CoreLifecycle` 启动，作为核心 Event Loop 的一部分运行。

## 命名规范与可追溯性

为便于管理，存入临时目录的文件应遵循前缀命名规范：
- `sandbox_[uuid]_`: 代码沙箱执行产生的输出文件。
- `tts_`: TTS Provider 生成的语音片段。
- `imgseg_` / `videoseg_` / `fileseg_`: 消息组件转换过程中产生的中间资源。
- `[platform_id]_`: 平台适配器（如 `telegram_`, `qqofficial_`）下载的媒体文件。

## 变更影响分析

### 1. 插件与适配器开发者
- **弃用手动删除**: 开发者应移除代码中针对临时文件的 `os.remove` 或 `unlink` 调用。手动删除可能与 `TempDirCleaner` 的扫描逻辑冲突，且不利于系统级的资源审计。
- **并发安全**: 建议在生成临时文件名时附加 `uuid.uuid4().hex[:4]` 等随机后缀，防止多会话并发操作导致的文件名碰撞。
- **非持久性保证**: 临时目录中的文件随时可能因达到容量上限而被清理。**严禁**将需要持久化存储的数据（如用户配置、数据库文件）放入此目录。

### 2. 系统架构影响
- **解耦资源管理**: 核心组件（如 `AstrMainAgent`）与底层文件系统的耦合度降低，资源回收逻辑从业务代码中剥离，提升了系统的健壮性。
- **IO 性能**: 集中式的清理机制减少了频繁的同步磁盘 IO 操作，通过异步批处理优化了整体性能。