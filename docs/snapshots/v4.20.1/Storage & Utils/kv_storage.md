---
category: storage
---

# 键值对存储 (KV Storage)

AstrBot 为插件提供了简单易用的 KV 存储接口，适合存储配置、轻量级状态或用户数据。

### 核心接口 (>= v4.9.2)

这些方法在插件类（继承自 `Star`）中可以直接调用：

- `await self.put_kv_data(key: str, value: Any)`: 存储数据。
- `await self.get_kv_data(key: str, default: Any = None) -> Any`: 获取数据。
- `await self.delete_kv_data(key: str)`: 删除数据。

### 特点

- **隔离性**: 数据按插件 ID 隔离，不同插件之间的 Key 不会冲突。
- **持久化**: 数据会自动持久化到 `data/metadata/kv_storage.db`（或相应目录）。
- **异步**: 接口均为异步方法。
