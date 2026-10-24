---
title: Sandbox 存储挂载与文件共享 (Sandbox Storage Mounting & File Sharing)
type: improvement
status: stable
last_updated: 2025-02-10
related_base: agent/sandbox.md
---

## 概述
在基于 Shipyard 的 Sandbox 运行时中，系统通过 Docker Volume 建立了宿主机与沙盒环境之间的共享临时目录。这一变更明确了文件在宿主机与沙盒之间流转的物理路径契约，是 `astrbot_upload_file` 等文件操作工具正常运行的基础设施保障。

## 存储映射契约
为了实现宿主机与沙盒环境的高效文件交换，系统建立了以下挂载关系：
- **宿主机源路径**: `${PWD}/data/temp` (即 AstrBot 运行根目录下的临时文件夹)
- **沙盒目标路径**: `/AstrBot/data/temp` (沙盒环境内的绝对路径)

## 变更影响分析
1. **文件访问一致性**：AI 开发者在编写涉及沙盒文件操作的工具（Tools）时，应知晓 `/AstrBot/data/temp` 是预设的共享交换区。上传到宿主机临时目录的文件将直接映射至此路径，无需通过网络流重复传输。
2. **底层实现透明化**：此变更解释了 `ShipyardBooter` 如何在物理层面处理文件可见性。如果开发者在非标准 Docker 环境下部署，需手动配置类似的卷挂载以维持 `astrbot_upload_file` 和 `astrbot_download_file` 的功能兼容性。
3. **边界情况**：宿主机对 `data/temp` 的清理操作会同步反映在沙盒内。在执行长时间运行的 Agent 任务时，需注意临时文件的生命周期管理，避免因宿主机清理导致沙盒内路径失效。