---
category: design_standards
---

# AI Plugin Development Best Practices

To ensure plugin stability, security and usability, follow these practices.

### 1. Exception Handling

Always catch exceptions and give users clear feedback.

```python
try:
    # logic code
except TimeoutError:
    yield event.plain_result("⌛ Session timed out, please restart.")
except Exception as e:
    logger.error(f"Plugin execution error: {e}")
    yield event.plain_result(f"❌ Error: {e}")
finally:
    event.stop_event()
```

### 2. Platform Differences

Although AstrBot provides a unified model, check the environment when calling platform-specific SDK functionality (e.g., `call_action`):

```python
if event.get_platform_name() == "aiocqhttp":
    # Call OneBot-specific API
    pass
```

### 3. Tools Development

- Prefer the `agent-as-tool` pattern.
- Write thorough docstrings — they directly determine how well the LLM understands the tool.
- Keep tools single-purpose.

### 4. Resource Cleanup

Always clean up timers, database connections, file handles and network sessions in `terminate()`. See the full lifecycle template at `templates/plugin/main.py` for a complete implementation example.

### 5. Async I/O & Thread Pool

AstrBot runs on Python's asyncio event loop. Never use synchronous blocking operations inside a plugin.

```python
# ✅ Good: use async libraries
import aiohttp
async with aiohttp.ClientSession() as session:
    async with session.get("https://api.example.com") as resp:
        data = await resp.read()

# ❌ Bad: synchronous calls block the entire bot event loop
# import requests
# data = requests.get("https://api.example.com").content  # never do this!

# ✅ Fallback: if a sync library is unavoidable, use a thread pool
import concurrent.futures
_executor = concurrent.futures.ThreadPoolExecutor(max_workers=4)

async def process_file(self, path: str):
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(_executor, self._sync_read, path)
```

> **Important**: Any synchronous `time.sleep()` or `requests.get()` call will freeze the entire bot. Always use `asyncio.sleep()` and async HTTP libraries like `aiohttp` or `httpx`.
