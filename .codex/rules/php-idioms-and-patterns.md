## PHP Idioms and Patterns (PHP 8.2+)

### Core Philosophy

Modern PHP (8.2+) is a strongly-typed, object-oriented language. Treat it as such. Lean on the type system, readonly properties, enums, and constructor property promotion. PSR standards are non-negotiable. The language has moved past the "loose, scripty" era — write code that reflects that.

> **Scope:** PHP-specific *coding idioms*. Layout: `project-structure-php-backend.md`. Laravel-specific patterns: `laravel-idioms-and-patterns.md`. Test naming: `testing-strategy.md`. Logging: `logging-and-observability-principles.md`.

---

### PSR Standards — Non-Negotiable

| Standard | Purpose |
|---|---|
| **PSR-1** | Basic coding standard |
| **PSR-4** | Autoloading (composer) |
| **PSR-7** | HTTP message interfaces |
| **PSR-12** | Extended coding style (supersedes PSR-2) |
| **PSR-15** | HTTP server middleware |
| **PSR-3** | Logger interface |
| **PSR-11** | Container interface |

All code MUST conform to PSR-12 formatting. All packages MUST autoload via PSR-4.

---

### Type Declarations — Always Strict

1. **`declare(strict_types=1);` at the top of every PHP file** — non-negotiable
   ```php
   <?php
   declare(strict_types=1);

   namespace App\Features\Task;
   ```

2. **All function/method signatures fully typed** — parameters, return types, properties
   ```php
   // ✅ Fully typed
   public function findById(string $id): ?Task { ... }

   // ❌ Untyped
   public function findById($id) { ... }
   ```

3. **Use union types and intersection types (PHP 8.0+/8.1+)**
   ```php
   public function send(string|Stringable $message): void { ... }
   public function process(Countable&Traversable $items): int { ... }
   ```

4. **`never` return type for functions that always throw or exit**
   ```php
   public function abort(string $reason): never {
       throw new RuntimeException($reason);
   }
   ```

5. **Avoid `mixed`** — narrow the type. `mixed` is the equivalent of `any` and disables type safety.

---

### Modern Class Design

1. **Constructor property promotion (PHP 8.0+)** — eliminate boilerplate
   ```php
   final class TaskService
   {
       public function __construct(
           private readonly TaskRepository $repository,
           private readonly LoggerInterface $logger,
       ) {}
   }
   ```

2. **`readonly` properties (PHP 8.1+) for immutable value objects**
   ```php
   final class Task
   {
       public function __construct(
           public readonly string $id,
           public readonly string $title,
           public readonly TaskStatus $status,
       ) {}
   }
   ```

3. **`final` by default** — open classes for extension only with explicit reason. Inheritance is a design decision, not a default.

4. **Enums (PHP 8.1+) replace string/int constants** — never use raw strings for closed sets
   ```php
   enum TaskStatus: string
   {
       case Pending = 'pending';
       case InProgress = 'in_progress';
       case Done = 'done';

       public function isTerminal(): bool {
           return match($this) {
               self::Done => true,
               default => false,
           };
       }
   }
   ```

5. **Interfaces define contracts; abstract classes share implementation** — prefer interfaces for ports/adapters.

---

### Error Handling

> See `error-handling-principles.md` for general principles.

1. **Throw typed exceptions, never raw `Exception`**
   ```php
   final class TaskNotFoundException extends DomainException
   {
       public function __construct(public readonly string $taskId) {
           parent::__construct("Task '{$taskId}' not found");
       }
   }
   ```

2. **Define a domain exception hierarchy**
   ```php
   abstract class AppException extends RuntimeException {}
   class ValidationException extends AppException {}
   class NotFoundException extends AppException {}
   class AuthorizationException extends AppException {}
   ```

3. **Never silence errors with `@`** — never use the error suppression operator
   ```php
   // ❌ NEVER
   $result = @file_get_contents($path);
   // ✅ Handle explicitly
   $result = file_get_contents($path);
   if ($result === false) {
       throw new IoException("Failed to read {$path}");
   }
   ```

4. **Catch specific exceptions, never broad `Throwable`/`Exception`** unless re-throwing or at top-level boundaries
   ```php
   try {
       $task = $this->repository->findById($id);
   } catch (TaskNotFoundException $e) {
       $this->logger->info('task_not_found', ['id' => $id]);
       throw new NotFoundResponseException();
   }
   ```

5. **Use `finally` for resource cleanup** — files, locks, transactions
   ```php
   try {
       $this->db->beginTransaction();
       // ... work ...
       $this->db->commit();
   } catch (Throwable $e) {
       $this->db->rollBack();
       throw $e;
   }
   ```

---

### Dependency Injection

1. **Constructor injection only** — never service locator pattern, never static singletons in business code
   ```php
   // ✅
   public function __construct(private readonly TaskRepository $repo) {}

   // ❌ Service locator
   public function findTask(string $id): Task {
       $repo = Container::get(TaskRepository::class);
   }
   ```

2. **Depend on interfaces, not concrete implementations** — bind interface→implementation in container configuration

3. **Never instantiate dependencies inside business logic** — pass them in

---

### Naming Conventions (PSR-1 / PSR-12)

| Construct | Convention | Example |
|---|---|---|
| Namespace / Class | `PascalCase` | `App\Features\Task\TaskService` |
| Interface | `PascalCase` (no `I` prefix) | `TaskRepository` (not `ITaskRepository`) |
| Method | `camelCase` | `findById`, `createTask` |
| Property | `camelCase` | `private readonly string $createdAt` |
| Constant | `UPPER_SNAKE_CASE` | `const MAX_TITLE_LENGTH = 200` |
| Enum case | `PascalCase` | `TaskStatus::InProgress` |
| File | matches class name | `TaskService.php` |

1. **Boolean methods read as questions** — `isActive()`, `hasPermission()`, `canEdit()`
2. **Avoid Hungarian notation** — no `$strName`, `$intCount`
3. **No abbreviations** — `$repository`, not `$repo` (except in tight scopes)

---

### Idiomatic Patterns

1. **`match` over `switch`** for value mapping (strict comparison, expression form, no fall-through)
   ```php
   $label = match($status) {
       TaskStatus::Pending => 'Waiting',
       TaskStatus::InProgress => 'Active',
       TaskStatus::Done => 'Complete',
   };
   ```

2. **Named arguments (PHP 8.0+)** for clarity at call sites with many parameters
   ```php
   $task = new Task(
       id: $id,
       title: $title,
       priority: Priority::High,
       dueDate: $date,
   );
   ```

3. **Null-safe operator `?->`** for optional chains
   ```php
   $city = $user?->address?->city ?? 'Unknown';
   ```

4. **Spread operator for argument unpacking**
   ```php
   $args = [...$baseArgs, ...$extraArgs];
   ```

5. **First-class callable syntax (PHP 8.1+)** — `$fn = $this->process(...);`

6. **Avoid global state** — no `$GLOBALS`, no `static` mutable state, no `define()` for app config

---

### Collections and Iteration

1. **Type-hint collections at boundaries** — use `array<int, Task>` in PHPDoc, or value object collections
   ```php
   /** @return array<int, Task> */
   public function findAll(): array { ... }
   ```

2. **Prefer `array_map` / `array_filter` / `array_reduce` for transformations** — clearer intent than imperative loops for data pipelines

3. **Generators for large datasets** — avoid loading entire result sets into memory
   ```php
   public function streamAll(): iterable {
       foreach ($this->cursor() as $row) {
           yield Task::fromRow($row);
       }
   }
   ```

---

### Database Access (PDO / PHP Native)

> Laravel users: see `laravel-idioms-and-patterns.md` for Eloquent patterns.

1. **Always use prepared statements** — never concatenate user input into SQL
   ```php
   // ❌ SQL injection
   $stmt = $pdo->query("SELECT * FROM users WHERE email = '{$email}'");

   // ✅ Prepared
   $stmt = $pdo->prepare('SELECT * FROM users WHERE email = :email');
   $stmt->execute(['email' => $email]);
   ```

2. **Configure PDO with strict error mode**
   ```php
   $pdo = new PDO($dsn, $user, $pass, [
       PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
       PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
       PDO::ATTR_EMULATE_PREPARES => false,
   ]);
   ```

3. **Wrap multi-statement operations in transactions** — short, focused, never across user interaction

4. **Map rows to value objects at the repository boundary** — never leak raw arrays into the domain

---

### Testing

> Naming and pyramid in `testing-strategy.md`.

1. **PHPUnit is the standard test runner** — `phpunit.xml` at project root

2. **Test class naming:** `{Class}Test` in `tests/` mirroring `src/` structure

3. **One assertion concept per test** — multiple `assert*` calls fine if testing one behavior

4. **Use data providers for table-driven tests**
   ```php
   #[DataProvider('priorityProvider')]
   public function testPriorityScore(Priority $priority, int $expected): void {
       self::assertSame($expected, priorityScore($priority));
   }

   public static function priorityProvider(): array {
       return [
           'low' => [Priority::Low, 1],
           'medium' => [Priority::Medium, 5],
           'high' => [Priority::High, 10],
       ];
   }
   ```

5. **Mock at the boundary, not internals** — use `createMock(TaskRepository::class)` for ports
6. **In-memory test doubles preferred over mocks** for repository-style ports — `InMemoryTaskRepository` co-located with the interface
7. **Use `#[Test]` attribute or `test*` prefix** — never both in the same project

---

### Static Analysis and Formatting

All MUST pass with zero warnings/errors before commit. See `code-completion-mandate.md`.

| Tool | Purpose | Command |
|---|---|---|
| `php-cs-fixer` or `pint` | Canonical formatting (PSR-12) | `vendor/bin/pint` |
| `phpstan` | Static analysis (level 8 minimum) | `vendor/bin/phpstan analyse` |
| `psalm` | Alternative static analyzer | `vendor/bin/psalm` |
| `rector` | Automated refactoring / upgrades | `vendor/bin/rector process` |
| `composer audit` | Dependency CVE scanning | `composer audit` |

**Mandatory `phpstan.neon` baseline:**
```neon
parameters:
    level: 8
    paths:
        - src
    checkMissingIterableValueType: true
    checkGenericClassInNonGenericObjectType: true
```

**Never use `@phpstan-ignore`/`@psalm-suppress` without a `// reason:` comment.**

---

### Security — Critical PHP-Specific Rules

> See `security-principles.md` for OWASP top 10.

1. **Never use `eval()`, `assert()` with strings, or `create_function()`** — arbitrary code execution
2. **Never use `unserialize()` on untrusted input** — use `json_decode` with `JSON_THROW_ON_ERROR`
3. **Hash passwords with `password_hash($pwd, PASSWORD_ARGON2ID)`** — verify with `password_verify`
4. **Random tokens via `random_bytes()` / `random_int()`** — never `rand()` or `mt_rand()`
5. **Escape output context-appropriately** — `htmlspecialchars($s, ENT_QUOTES | ENT_HTML5, 'UTF-8')` for HTML; URL/JS/CSS contexts have different rules
6. **Never enable `display_errors` in production** — leaks stack traces, paths, internals
7. **Set strict cookie flags** — `Secure`, `HttpOnly`, `SameSite=Strict`

---

### Logging

> See `logging-and-observability-principles.md`.

1. **Use a PSR-3 compatible logger** — `Monolog` is standard
2. **Never `echo`, `var_dump`, `print_r` in production code** — use the logger
3. **Structured context as the second argument**
   ```php
   $this->logger->info('task_created', [
       'correlation_id' => $correlationId,
       'task_id' => $task->id,
       'user_id' => $userId,
       'duration_ms' => $duration,
   ]);
   ```

---

### Anti-Patterns — NEVER

| ❌ Anti-Pattern | ✅ Correct |
|---|---|
| `extract($_POST)` | Explicit field access with validation |
| `@function()` (error suppression) | Explicit error handling |
| `eval()`, `create_function()` | Refactor to first-class functions/closures |
| Global `$GLOBALS`, `static` mutable state | Constructor injection |
| `Singleton` pattern for app services | DI container |
| String concat in SQL | Prepared statements |
| Untyped properties / parameters | Full type declarations |
| `if ($x == $y)` (loose comparison) | `===` strict comparison |
| `unserialize` on user input | `json_decode(..., flags: JSON_THROW_ON_ERROR)` |
| Returning `false` for "not found" | Return `null` or throw typed exception |
| `mixed` return type as default | Narrow the type |

---

### Related Principles
- Code Idioms and Conventions code-idioms-and-conventions.md
- Project Structure — PHP Backend project-structure-php-backend.md
- Laravel Idioms and Patterns laravel-idioms-and-patterns.md
- Testing Strategy testing-strategy.md
- Error Handling Principles error-handling-principles.md
- Security Principles security-principles.md
- Logging and Observability Principles logging-and-observability-principles.md
- Dependency Management Principles dependency-management-principles.md
