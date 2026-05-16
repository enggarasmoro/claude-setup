## Laravel Idioms and Patterns (Laravel 11+)

### Core Philosophy

Laravel is opinionated — work *with* the framework, not around it. Use Eloquent, Queues, Events, and the Service Container as designed. But: **business logic does not live in controllers, models, or framework classes**. Wrap framework primitives in domain services. Treat Laravel as the delivery mechanism, not the application.

> **Scope:** Laravel-specific patterns layered on top of `php-idioms-and-patterns.md`. PHP-level idioms (types, PSR-12, error handling) apply universally — read that file first. Layout: `project-structure-laravel-backend.md`. Test naming: `testing-strategy.md`.

---

### Required Versions and Stack

- **PHP 8.2+** — `declare(strict_types=1);` mandatory
- **Laravel 11.x** (or current LTS)
- **Composer 2.x**
- **Database:** PostgreSQL preferred; MySQL 8.0+ acceptable

**Required dev dependencies:**
- `laravel/pint` — formatter (Laravel's PSR-12 wrapper)
- `larastan/larastan` — Laravel-aware PHPStan (level 8)
- `pestphp/pest` OR `phpunit/phpunit` — test runner (pick one, do not mix)
- `rector/rector` + `driftingly/rector-laravel` — automated refactoring

---

### Architectural Discipline — The Cardinal Rule

**Controllers are thin. Models are thin. Services hold business logic.**

| Layer | Responsibility | What MUST NOT live here |
|---|---|---|
| **Routes** | Map URLs to controller methods | Logic of any kind |
| **FormRequest** | Validation + authorization of HTTP input | Business rules |
| **Controller** | Translate HTTP → Service call → HTTP Response | DB queries, business logic, side effects |
| **Service / Action** | Business logic, orchestration, transactions | HTTP concerns, view rendering |
| **Model** | Persistence + relationships + casts | Multi-aggregate business rules, side effects |
| **Repository** (optional) | Encapsulate complex queries | Business decisions |
| **Resource** | Shape JSON output | Loading data, computing derived state |

```php
// ✅ Thin controller
final class TaskController
{
    public function __construct(private readonly TaskService $service) {}

    public function store(StoreTaskRequest $request): JsonResponse
    {
        $task = $this->service->create(
            CreateTaskCommand::fromRequest($request->validated())
        );
        return TaskResource::make($task)->response()->setStatusCode(201);
    }
}

// ❌ Fat controller — DB queries, business rules, side effects
public function store(Request $request) {
    $data = $request->validate([...]);
    $task = Task::create($data);
    if ($task->priority === 'high') { Mail::to(...)->send(...); }
    return response()->json($task);
}
```

---

### Project Organization — Vertical Slices

Default Laravel layout (`app/Http`, `app/Models`, `app/Services`) is technical-layer organization. **For non-trivial apps, organize by feature** under `app/Features/` (or `Domains/` / `Modules/`).

> See `project-structure-laravel-backend.md` for full layout.

---

### Eloquent

#### When to Use Eloquent vs Repository

- **Use Eloquent directly** in services for simple CRUD against a single aggregate
- **Wrap behind a Repository interface** when:
  - Queries are complex enough to warrant testing in isolation
  - Multiple persistence backends may exist (e.g., search index + DB)
  - You need to swap implementations in tests beyond the in-memory DB

Avoid premature repositories — Laravel's testing DB + factories cover most cases.

#### Eloquent Rules

1. **`HasFactory` on every model** — factories drive tests and seeding
2. **Mass assignment: explicit `$fillable` OR `$guarded = []` with FormRequest validation upstream** — never accept `$request->all()` blindly
3. **Type all attributes via `$casts`** — including dates, enums, JSON, custom value objects
   ```php
   protected function casts(): array {
       return [
           'status' => TaskStatus::class,
           'due_date' => 'immutable_datetime',
           'metadata' => AsArrayObject::class,
           'is_archived' => 'boolean',
       ];
   }
   ```
4. **Always eager-load relationships you'll touch** — `with()` to prevent N+1
   ```php
   $tasks = Task::with(['assignee', 'tags'])->where('status', TaskStatus::Pending)->get();
   ```
5. **Detect N+1 in tests** — `Model::preventLazyLoading()` in `AppServiceProvider::boot()` for non-prod
6. **Scopes for reusable query fragments** — `scopeActive`, `scopeForUser`
7. **Never put business logic in model methods that mutate state** — that's a service's job; models hold derived getters and scopes

#### Migrations

1. **Every migration MUST be reversible** — implement both `up()` and `down()`
2. **Never modify shipped migrations** — write a new migration instead
3. **One logical change per migration** — adding a column ≠ adding an index ≠ backfilling data
4. **Use `->after()`, explicit nullability, and FK constraints**
   ```php
   Schema::table('tasks', function (Blueprint $table) {
       $table->foreignUlid('assignee_id')->nullable()->after('id')->constrained('users')->nullOnDelete();
       $table->index(['status', 'due_date']);
   });
   ```
5. **Backfill via separate migration or queued job** — never block deploy on long backfills
6. **For zero-downtime: additive → backfill → switch reads → drop old** (multi-step)

---

### Validation — FormRequest Always

1. **Never validate inside the controller** — always extract a `FormRequest`
2. **Authorize in `authorize()`, validate in `rules()`, normalize in `prepareForValidation()`, transform with `passedValidation()`**
   ```php
   final class StoreTaskRequest extends FormRequest
   {
       public function authorize(): bool {
           return $this->user()->can('create', Task::class);
       }

       public function rules(): array {
           return [
               'title' => ['required', 'string', 'min:1', 'max:200'],
               'priority' => ['required', Rule::enum(Priority::class)],
               'due_date' => ['nullable', 'date', 'after:now'],
           ];
       }
   }
   ```
3. **Use `Rule::*` builders for complex rules** — `Rule::unique()`, `Rule::exists()`, `Rule::enum()`
4. **Custom rules as invokable `Rule` objects** — never closures in production code

---

### Authorization

1. **Always use Policies for model authorization** — never inline `if` checks in controllers
   ```php
   // ✅ In controller
   $this->authorize('update', $task);
   // ✅ In FormRequest
   public function authorize(): bool { return $this->user()->can('update', $this->task); }
   ```
2. **Register policies in `AuthServiceProvider`**
3. **Use Gates for non-model permissions** (e.g., `viewAdminPanel`)
4. **Test policies independently** — they are pure logic

---

### Routing

1. **Group routes by feature/version** — `routes/api/v1/tasks.php` registered in `RouteServiceProvider`
2. **Always name routes** — `->name('tasks.store')` — use `route()` helper, never hardcode URLs
3. **Use route model binding** — including custom keys (`{task:slug}`) and scoped bindings
4. **Apply middleware at group level**, not duplicated per route
5. **Throttle public + auth endpoints** — `throttle:api`, `throttle:6,1` on login

---

### Service Container and Providers

1. **Bind interfaces to implementations in a dedicated ServiceProvider per feature**
   ```php
   // app/Features/Task/TaskServiceProvider.php
   public function register(): void {
       $this->app->bind(TaskRepository::class, EloquentTaskRepository::class);
   }
   ```
2. **Use contextual binding for variants** — `$this->app->when(...)->needs(...)->give(...)`
3. **Never resolve from the container inside business logic** — only at composition root (controllers, jobs, console commands)
4. **Singletons only for stateless services with no per-request state** — never for anything tied to a user/request

---

### Queues, Jobs, Events

1. **Implement `ShouldQueue` for anything that can be async** — emails, notifications, third-party API calls, heavy reports
2. **Jobs MUST be idempotent** — use `Bus::chain()` for sequences, `WithoutOverlapping` for serialization
3. **Set `$tries`, `$backoff`, `$timeout` explicitly** — never rely on defaults for production
   ```php
   public int $tries = 3;
   public array $backoff = [10, 60, 300];
   public int $timeout = 120;
   ```
4. **Use `failed()` method** — log + alert on permanent failure
5. **Events for cross-feature decoupling, not for sequential workflow** — sequential = service method or job chain
6. **Never queue closures in production** — always typed Job classes
7. **Use Horizon for Redis queue monitoring** — required for any non-trivial production deploy

---

### API Resources (HTTP Response Shaping)

1. **Always wrap output in API Resources** — never return Eloquent models directly from controllers
   ```php
   return TaskResource::collection($tasks);
   ```
2. **Resources are presentation, not domain** — never put business logic inside `toArray()`
3. **Use `whenLoaded()` to avoid leaking lazy-load N+1**
4. **Conditional fields via `when()` / `mergeWhen()`** — never `if` blocks

---

### Caching

1. **Tag-based cache for invalidation** — `Cache::tags(['tasks', "user:{$id}"])->put(...)`
2. **Use `Cache::remember`/`rememberForever` for read-through caching** — do not write get/check/set manually
3. **Cache at the query/aggregate boundary** — never cache full HTTP responses unless intentional CDN-level
4. **Always set explicit TTL** — `Cache::remember($key, now()->addMinutes(10), $callback)`

---

### Database Transactions

1. **Wrap multi-write operations in `DB::transaction()`** — closure form, not manual `beginTransaction`
   ```php
   return DB::transaction(function () use ($command) {
       $task = Task::create([...]);
       $this->auditLog->record('task_created', $task);
       event(new TaskCreated($task));
       return $task;
   });
   ```
2. **Dispatch events AFTER commit** — use `DB::afterCommit()` or `ShouldDispatchAfterCommit` interface to prevent firing on rollback
3. **Keep transactions short** — no HTTP calls inside, no user interaction
4. **Set explicit isolation level only when required** — default is fine for most cases

---

### Logging and Observability

> See `logging-and-observability-principles.md`.

1. **Use the `Log` facade or inject `LoggerInterface`** — never `error_log()`, `dd()`, `dump()`
2. **Structured context per call**
   ```php
   Log::info('task_created', [
       'correlation_id' => $correlationId,
       'task_id' => $task->id,
       'user_id' => $user->id,
   ]);
   ```
3. **Log channel per concern** — `daily` for app, `slack` for critical, `stderr` for cloud
4. **Correlation ID middleware** — generate UUID at request ingress, attach to log context, propagate to outbound HTTP

---

### Configuration and Secrets

1. **Never call `env()` outside `config/*.php` files** — config is cached in production; `env()` returns `null` after `config:cache`
2. **All env vars must have a default** in `config/*.php` and a documented entry in `.env.example`
3. **Validate critical env at boot** — fail fast on missing `APP_KEY`, `DATABASE_URL`, etc.
4. **Secrets in production come from a secret manager** — Vault, AWS Secrets Manager, GCP Secret Manager — never `.env` files on prod servers

---

### Testing

> See `testing-strategy.md` for pyramid and naming.

1. **Use `RefreshDatabase` trait OR transactions** — never share state between tests
2. **Factory-driven test data** — never hand-craft DB rows in tests
   ```php
   $user = User::factory()->withTeam()->admin()->create();
   ```
3. **Feature tests hit the HTTP layer** — `$this->postJson('/api/v1/tasks', [...])->assertStatus(201)`
4. **Unit-test services with in-memory or mocked repositories** — services must be testable without DB
5. **`fake()` Laravel facades for side effects** — `Bus::fake()`, `Queue::fake()`, `Mail::fake()`, `Event::fake()`, `Http::fake()`
6. **Assert event/job dispatch, not internal calls**
   ```php
   Bus::fake();
   $this->service->create($command);
   Bus::assertDispatched(SendTaskNotification::class);
   ```
7. **Pest preferred for new projects** — terser syntax, better DX. PHPUnit acceptable for legacy
8. **`Model::preventLazyLoading()` in test bootstrap** — fail tests on N+1

---

### Performance

1. **Always cache config + routes + views in production** — `config:cache`, `route:cache`, `view:cache`
2. **OPcache enabled with `validate_timestamps=0`** in production
3. **Use chunked iteration for bulk data** — `Model::chunk(1000)` or `lazy()`
4. **Index foreign keys + frequent WHERE columns** — every FK should have an index
5. **Use database queues for low-volume / Redis for high-volume** — never `sync` driver in production
6. **Eager loading default-on for known relationships** — `$with` property where it makes sense

---

### Security — Laravel-Specific

> See `security-principles.md` for OWASP top 10. PHP-specific rules in `php-idioms-and-patterns.md` § Security.

1. **CSRF protection on all `web` routes** — never disable globally; per-route exception only with strong reason
2. **Sanctum for SPA/API auth, Passport for OAuth2** — never roll your own token system
3. **Rate-limit auth endpoints aggressively** — `throttle:5,1` on login, password reset
4. **Never disable `mass assignment` protection globally** — set per-model `$fillable`
5. **Hash passwords with `Hash::make()`** — uses bcrypt by default (acceptable); switch to argon2id via config for new projects
6. **Use signed URLs for sensitive one-off links** — password resets, email verification, file downloads
7. **Validate file uploads** — `mimes:`, `max:`, dimensions; store outside webroot; never use original filename
8. **Set `APP_DEBUG=false` and `APP_ENV=production` in production** — non-negotiable
9. **HTTPS only** — `URL::forceScheme('https')` in production provider; `Strict-Transport-Security` header

---

### Static Analysis and Formatting

| Tool | Purpose | Command |
|---|---|---|
| `pint` | Formatting (Laravel's PSR-12) | `vendor/bin/pint` |
| `larastan` | Laravel-aware PHPStan (level 8) | `vendor/bin/phpstan analyse` |
| `rector` | Automated refactoring + Laravel upgrades | `vendor/bin/rector process` |
| `composer audit` | Dependency CVE scan | `composer audit` |
| `php artisan insights` | Code quality (optional) | — |

**`phpstan.neon` baseline:**
```neon
includes:
    - vendor/larastan/larastan/extension.neon
parameters:
    level: 8
    paths: [app, config, database, routes, tests]
    checkMissingIterableValueType: true
```

**Mandatory CI gates:** `pint --test`, `phpstan analyse`, `php artisan test`, `composer audit`.

---

### Anti-Patterns — NEVER

| ❌ Anti-Pattern | ✅ Correct |
|---|---|
| Business logic in controllers | Service / Action class |
| Business logic in models (state mutations) | Service / Action class |
| `$request->all()` into `Model::create()` | FormRequest + DTO |
| `env()` outside `config/*.php` | `config('app.key')` |
| `dd()`, `dump()`, `var_dump()` in committed code | Logger |
| Closures in queued jobs | Typed Job classes |
| Closures in routes (production) | Controller actions |
| Manual `beginTransaction` / `commit` | `DB::transaction(fn() => ...)` |
| Returning Eloquent models from API controllers | API Resources |
| Lazy-loading in production (N+1) | `with()`, `preventLazyLoading()` in non-prod |
| Service Locator (`app(X::class)`) inside services | Constructor injection |
| `Auth::user()->id` deep in services | Pass user/userId as parameter |
| `try { ... } catch (\Exception $e) { return null; }` | Typed exceptions, propagate |
| `sync` queue driver in production | Redis or database driver |
| Disabling CSRF globally | Targeted per-route exception |
| Using Eloquent `update()` to bypass observers/events | Use `save()` after attribute set |

---

### Related Principles
- PHP Idioms and Patterns php-idioms-and-patterns.md
- Project Structure — Laravel Backend project-structure-laravel-backend.md
- Testing Strategy testing-strategy.md
- Error Handling Principles error-handling-principles.md
- Security Principles security-principles.md
- Logging and Observability Principles logging-and-observability-principles.md
- API Design Principles api-design-principles.md
- Database Design Principles database-design-principles.md
- Configuration Management Principles configuration-management-principles.md
- Dependency Management Principles dependency-management-principles.md
