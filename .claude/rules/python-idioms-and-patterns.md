## Python Idioms and Patterns

### Core Philosophy

Python rewards explicitness and readability. Follow the **Zen of Python**. If it reads like plain English, it's probably idiomatic.

> **Scope:** Python *coding idioms*. Layout: `project-structure-python-backend.md`. Test naming: `testing-strategy.md`. Logging: `logging-and-observability-principles.md`.

---

### Type Hints — Non-Negotiable

**Always annotate function signatures and public APIs.** Use `from __future__ import annotations` for forward references.

```python
# ✅ Fully annotated
def calculate_discount(items: Sequence[Item], coupon: Coupon) -> float: ...
# ❌ Untyped
def calculate_discount(items, coupon): ...
```

1. **Use `X | None` over `Optional[X]`** (Python 3.10+) — `def find_user(user_id: str) -> User | None`
2. **Use `TypeAlias` and `TypeVar` for reusable generics** — `T = TypeVar("T")`, `UserId: TypeAlias = str`
3. **Use `Protocol` for structural interfaces** instead of ABCs when duck-typing is sufficient
4. **`TypedDict` for structured dicts crossing system boundaries** (JSON, configs)

---

### Error Handling

> See `error-handling-principles.md` for general principles.

1. **Prefer specific exception types over broad `except Exception`**
   ```python
   # ✅
   try: task = storage.get_by_id(task_id)
   except TaskNotFoundError: raise HTTPException(status_code=404, detail="Task not found")
   # ❌ Broad — may swallow programming errors
   except Exception: ...
   ```

2. **Define domain-specific exception hierarchies**
   ```python
   class FathError(Exception): """Base for all domain errors."""
   class NotFoundError(FathError):
       def __init__(self, resource: str, resource_id: str) -> None:
           super().__init__(f"{resource} '{resource_id}' not found")
   ```

3. **Never silence exceptions** — caught-and-not-reraised must be logged
   ```python
   # ❌ Silent swallow: except Exception: pass
   # ✅ Explicit
   except NotificationError:
       logger.warning("notification_failed", user_id=user_id, exc_info=True)
   ```

4. **Use `contextlib.suppress` only for truly expected, inconsequential exceptions**
   ```python
   with suppress(FileNotFoundError):
       cache_path.unlink()
   ```

---

### Dataclasses and Pydantic

1. **Use `dataclasses` for internal domain models** (no I/O, no validation) — prefer `@dataclass(frozen=True)`
   ```python
   @dataclass(frozen=True)
   class Task:
       id: str
       title: str
       tags: tuple[str, ...] = field(default_factory=tuple)
   ```

2. **Use Pydantic `BaseModel` for data crossing system boundaries** (API requests/responses, config)
   ```python
   class CreateTaskRequest(BaseModel):
       title: str = Field(min_length=1, max_length=200)
       priority: Literal["low", "medium", "high"] = "medium"
       model_config = ConfigDict(frozen=True)  # Pydantic v2
   ```

3. **Keep domain models separate from API schemas** — never use a Pydantic model as a domain entity. `models.py` → dataclasses; `schemas.py` → Pydantic.

---

### Interfaces and Dependency Injection

Python uses Protocols + constructor injection for testability.

1. **Define the Protocol where it is *used*, not where it is *implemented*** — `task/storage.py` defines `TaskStorage` Protocol; `storage_pg.py` implements it.

2. **Inject dependencies through `__init__`** — never instantiate concretes inside a class
   ```python
   # ✅
   class TaskService:
       def __init__(self, storage: TaskStorage) -> None: self._storage = storage
   # ❌ Hardwired: self._storage = PostgresTaskStorage()
   ```

3. **Wire dependencies in the entry point** (`main.py`/`app.py`)
   ```python
   storage = PostgresTaskStorage(db=database)
   service = TaskService(storage=storage)
   ```

---

### Async / Await

> See `concurrency-and-threading-mandate.md` for when to add concurrency.

1. **Choose one async paradigm and stay consistent** — do not mix `asyncio.run` entry points
2. **Never call blocking I/O directly in an async function**
   ```python
   # ❌ async def load_file(p): return open(p).read()
   # ✅
   async with aiofiles.open(path) as f: return await f.read()
   ```
3. **Use `asyncio.gather` for concurrent independent operations**
   ```python
   user, tasks = await asyncio.gather(get_user(user_id), get_tasks(user_id))
   ```
4. **Use `asyncio.TaskGroup` (3.11+) for structured concurrency with cancellation safety**
   ```python
   async with asyncio.TaskGroup() as tg:
       u = tg.create_task(get_user(user_id))
       t = tg.create_task(get_tasks(user_id))
   ```

---

### Naming Conventions

Follow **PEP 8** rigorously.

| Construct               | Convention         | Example                      |
| ----------------------- | ------------------ | ---------------------------- |
| Module / Package        | `snake_case`       | `task_service.py`            |
| Class                   | `PascalCase`       | `TaskService`                |
| Function / Method       | `snake_case`       | `get_by_id`                  |
| Private method/attr     | `_snake_case`      | `_validate_title`            |
| Constant                | `UPPER_SNAKE_CASE` | `MAX_TITLE_LENGTH = 200`     |
| Type alias              | `PascalCase`       | `UserId = str`               |
| Protocol / Interface    | `PascalCase`       | `TaskStorage`                |

1. **Never use single-letter names** outside list comprehensions or math
2. **Avoid `data`, `info`, `obj`, `result` as standalone names** — describe the *domain concept*
3. **Boolean variables/functions should read as yes/no questions**
   ```python
   # ✅ is_active, has_permission, def can_edit(...) -> bool
   # ❌ active, permission
   ```

---

### Idiomatic Patterns

1. **Context managers for resource cleanup** — always prefer `with` over manual `close()`
   ```python
   # ✅
   async with database.transaction() as tx: await tx.execute(query)
   # ❌ Manual tx.commit() — easily forgotten on exception
   ```

2. **Generator expressions over list comprehensions for lazy evaluation**
   ```python
   active_ids = (task.id for task in tasks if task.is_active)  # lazy
   active_tasks = [task for task in tasks if task.is_active]   # only when full list needed
   ```

3. **`dataclasses.replace()` for immutable updates** — `updated = replace(task, title="New")`
4. **`functools.cache` / `lru_cache` for pure function memoization**
5. **`__slots__` on hot-path, frequently instantiated classes**
6. **`enum.StrEnum` (3.11+) for domain-level constants** — never raw strings
   ```python
   class Priority(StrEnum):
       LOW = "low"; MEDIUM = "medium"; HIGH = "high"
   ```

---

### Testing

> See `testing-strategy.md` for naming/proportions.

1. **Use `pytest` as the sole test runner** — never mix `unittest.TestCase`
2. **Parametrize with `@pytest.mark.parametrize`**
   ```python
   @pytest.mark.parametrize("priority,score", [("low",1),("medium",5),("high",10)])
   def test_priority_score(priority, score): assert priority_score(priority) == score
   ```
3. **Use `pytest-mock` (`mocker` fixture)** — not `unittest.mock` directly
   ```python
   mock_storage = mocker.create_autospec(TaskStorage, instance=True)
   ```
4. **Typed mock factory for Protocol interfaces** — co-locate `storage_mock.py` with `storage.py`
   ```python
   class InMemoryTaskStorage:
       def __init__(self) -> None: self._store: dict[str, Task] = {}
       def get_by_id(self, task_id): ...  # raises NotFoundError if missing
       def save(self, task): self._store[task.id] = task
   ```
5. **Use `pytest-asyncio` for async tests** — set `asyncio_mode = "auto"` in `pyproject.toml`
6. **Fixtures for reusable setup** — never repeat identical Arrange blocks

---

### Formatting and Static Analysis

All **must pass with zero warnings/errors** before any commit. See `code-completion-mandate.md`.

| Tool         | Purpose                            | Command                            |
| ------------ | ---------------------------------- | ---------------------------------- |
| `ruff format`| Canonical formatting (fast)        | `ruff format .`                    |
| `ruff check` | Lint (replaces flake8, isort, ...) | `ruff check . --fix`               |
| `mypy`       | Static type checking               | `mypy src/ --strict`               |
| `bandit`     | Security scanning                  | `bandit -r src/ -c pyproject.toml` |
| `pip-audit`  | Dependency CVE scanning            | `pip-audit`                        |

Configure all tools in `pyproject.toml`. Never use per-file pragma comments without a `# NOQA:` reason comment.

```toml
[tool.ruff]
line-length = 100
target-version = "py311"
[tool.ruff.lint]
select = ["E", "F", "I", "N", "UP", "S", "B", "ANN"]
[tool.mypy]
strict = true
python_version = "3.11"
[tool.pytest.ini_options]
asyncio_mode = "auto"
```

> **Logging:** Never use `print()` in production code. Use `logging` or `structlog`. See `logging-and-observability-principles.md`.

---

### Related Principles
- Code Idioms and Conventions code-idioms-and-conventions.md
- Project Structure — Python Backend project-structure-python-backend.md
- Testing Strategy testing-strategy.md
- Error Handling Principles error-handling-principles.md
- Concurrency and Threading Mandate concurrency-and-threading-mandate.md
- Logging and Observability Principles logging-and-observability-principles.md
- Security Principles security-principles.md
- Dependency Management Principles dependency-management-principles.md
