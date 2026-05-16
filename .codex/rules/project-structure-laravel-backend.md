## Laravel Backend Layout (Laravel 11+)

Use this structure for Laravel applications. The vertical slice principle applies — features live under `app/Features/`, NOT scattered across `app/Http/Controllers`, `app/Models`, `app/Services`.

> Native PHP layout: `project-structure-php-backend.md`. Laravel idioms: `laravel-idioms-and-patterns.md`.

```
apps/
  backend/                            # Laravel application root
    composer.json
    composer.lock
    artisan                           # Laravel CLI entry point
    phpstan.neon                      # Larastan config (level 8)
    phpunit.xml                       # OR pest.xml
    pint.json                         # Formatter config
    .env.example                      # Documented env vars (committed)
    .env                              # Local env (gitignored)

    app/
      # === Default Laravel directories (kept thin) ===
      Console/
        Commands/                     # Artisan commands (thin — delegate to feature services)
      Exceptions/
        Handler.php                   # Maps domain exceptions → HTTP responses
      Http/
        Kernel.php                    # Global middleware stack
        Middleware/                   # Cross-cutting middleware (CorrelationId, Auth, Throttle)
      Providers/
        AppServiceProvider.php
        AuthServiceProvider.php       # Policy registration
        EventServiceProvider.php
        RouteServiceProvider.php
        FeatureServiceProvider.php    # Auto-registers per-feature providers

      # === Vertical Slice Organization ===
      Features/                       # Business features (one directory per bounded context)
        Task/
          # --- Service Provider (per-feature wiring) ---
          TaskServiceProvider.php     # Bind interfaces, register policies, register routes

          # --- Public API ---
          Services/
            TaskService.php           # Business logic orchestration
          Actions/                    # Single-purpose use cases (alternative to fat services)
            CreateTaskAction.php
            CompleteTaskAction.php
            ArchiveTaskAction.php

          # --- Delivery (HTTP) ---
          Http/
            Controllers/
              TaskController.php      # Thin: validate → service → resource
              Api/
                V1/
                  TaskApiController.php
            Requests/
              StoreTaskRequest.php    # FormRequest: rules + authorize + prepareForValidation
              UpdateTaskRequest.php
            Resources/
              TaskResource.php        # JSON output shaping
              TaskCollection.php
            Middleware/
              EnsureTaskOwnership.php # Feature-specific middleware

          # --- Domain ---
          Domain/
            Models/
              Task.php                # Eloquent model (thin — relationships, casts, scopes only)
            Enums/
              TaskStatus.php          # PHP 8.1 backed enum
              Priority.php
            Events/
              TaskCreated.php         # ShouldDispatchAfterCommit
              TaskCompleted.php
            Listeners/
              SendTaskNotification.php # ShouldQueue
            Exceptions/
              TaskNotFoundException.php
              InvalidTaskStateException.php
            ValueObjects/
              TaskId.php              # readonly value object
            Policies/
              TaskPolicy.php          # Authorization policies

          # --- Persistence ---
          Repositories/
            TaskRepository.php             # Interface
            EloquentTaskRepository.php     # Production implementation
            InMemoryTaskRepository.php     # Test implementation (optional)

          # --- Async ---
          Jobs/
            ProcessTaskAttachments.php  # ShouldQueue
            CleanupArchivedTasks.php

          # --- Mail / Notifications ---
          Notifications/
            TaskAssignedNotification.php

          # --- Routes (loaded by TaskServiceProvider) ---
          Routes/
            api.php
            web.php

        Order/                        # Same internal structure as Task
          ...
        Auth/
          ...

      # === Shared Kernel (cross-feature primitives) ===
      Shared/
        ValueObjects/                 # Truly shared types (Money, Email, ULID)
        Exceptions/
          DomainException.php
          ValidationException.php
        Support/                      # Pure utilities, no framework dependencies
          Clock.php                   # Clock interface (testable time)
          SystemClock.php

    bootstrap/
      app.php                         # Laravel 11 bootstrap
      cache/                          # Compiled config/routes (gitignored)
      providers.php                   # Auto-discovered providers

    config/                           # Standard Laravel config (return arrays)
      app.php
      auth.php
      database.php
      logging.php
      queue.php
      services.php                    # Third-party service credentials
      cache.php
      filesystems.php

    database/
      factories/                      # Model factories (one per model)
        TaskFactory.php
      migrations/                     # Sequential, reversible migrations
        2026_01_15_000000_create_tasks_table.php
      seeders/
        DatabaseSeeder.php

    public/
      index.php                       # ONLY entry point exposed to web
      .htaccess                       # OR nginx rewrite to index.php

    resources/
      views/                          # Blade templates (only if server-rendered)
      lang/                           # i18n files
      js/, css/                       # Frontend assets (if Inertia/Livewire)

    routes/
      api.php                         # Top-level API routes (registers feature routes)
      web.php                         # Top-level web routes
      console.php                     # Closure-based artisan commands (avoid for non-trivial)
      channels.php                    # Broadcasting channels

    storage/                          # Runtime artifacts (gitignored except .gitkeep)
      app/
      framework/
      logs/

    tests/
      Unit/                           # Pure logic, no framework boot
        Features/
          Task/
            Domain/
              TaskStatusTest.php
            Services/
              TaskServiceTest.php     # In-memory repo, no DB
      Integration/                    # Real DB, real cache, real queue
        Features/
          Task/
            Repositories/
              EloquentTaskRepositoryTest.php
      Feature/                        # Full HTTP pipeline (RefreshDatabase)
        Features/
          Task/
            Http/
              CreateTaskTest.php
              ListTasksTest.php
      Pest.php                        # If using Pest
      TestCase.php

    vendor/                           # Composer dependencies (gitignored)
```

### Key Laravel Conventions

- **`app/Features/{FeatureName}/`** — vertical slice; each feature is self-contained with its own Service Provider, routes, controllers, models, repositories, jobs
- **One ServiceProvider per feature** — registers bindings, policies, routes, event listeners. Aggregated in `FeatureServiceProvider` or `config/app.php`
- **Models are thin** — only relationships, casts, scopes, accessors. Multi-aggregate logic belongs in Services/Actions
- **Controllers are thin** — validate (FormRequest) → call service → return Resource. Zero business logic
- **Tests organized by tier** — Unit (pure, no boot) / Integration (real infra) / Feature (HTTP pipeline)
- **`Shared/`** holds truly cross-feature primitives only — resist the temptation to dump utilities here

### Per-Feature ServiceProvider

```php
<?php
declare(strict_types=1);

namespace App\Features\Task;

use App\Features\Task\Domain\Models\Task;
use App\Features\Task\Domain\Policies\TaskPolicy;
use App\Features\Task\Repositories\EloquentTaskRepository;
use App\Features\Task\Repositories\TaskRepository;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Route;

final class TaskServiceProvider extends ServiceProvider
{
    protected $policies = [Task::class => TaskPolicy::class];

    public function register(): void
    {
        $this->app->bind(TaskRepository::class, EloquentTaskRepository::class);
    }

    public function boot(): void
    {
        $this->registerPolicies();

        Route::middleware('api')
            ->prefix('api/v1')
            ->group(__DIR__ . '/Routes/api.php');
    }
}
```

### Service Class Pattern

```php
<?php
declare(strict_types=1);

namespace App\Features\Task\Services;

use App\Features\Task\Domain\Events\TaskCreated;
use App\Features\Task\Domain\Models\Task;
use App\Features\Task\Repositories\TaskRepository;
use Illuminate\Contracts\Events\Dispatcher;
use Illuminate\Support\Facades\DB;
use Psr\Log\LoggerInterface;

final class TaskService
{
    public function __construct(
        private readonly TaskRepository $repository,
        private readonly Dispatcher $events,
        private readonly LoggerInterface $logger,
    ) {}

    public function create(CreateTaskCommand $command): Task
    {
        return DB::transaction(function () use ($command) {
            $task = $this->repository->create($command->toArray());
            $this->logger->info('task_created', [
                'task_id' => $task->id,
                'user_id' => $command->userId,
            ]);
            $this->events->dispatch(new TaskCreated($task));
            return $task;
        });
    }
}
```

### composer.json Scripts (CI Gates)

```json
"scripts": {
    "test": "php artisan test",
    "test:unit": "php artisan test --testsuite=Unit",
    "test:feature": "php artisan test --testsuite=Feature",
    "lint": "vendor/bin/pint --test",
    "fix": "vendor/bin/pint",
    "analyse": "vendor/bin/phpstan analyse",
    "refactor": "vendor/bin/rector process --dry-run",
    "audit": "composer audit",
    "ci": [
        "@lint",
        "@analyse",
        "@audit",
        "@test"
    ]
}
```

### phpstan.neon Baseline (Larastan)

```neon
includes:
    - vendor/larastan/larastan/extension.neon

parameters:
    level: 8
    paths:
        - app
        - config
        - database
        - routes
        - tests
    checkMissingIterableValueType: true
    treatPhpDocTypesAsCertain: false
```

### Migration Naming and Discipline

- **Naming:** `YYYY_MM_DD_HHMMSS_verb_noun.php` — `2026_01_15_103000_create_tasks_table.php`, `2026_01_16_090000_add_priority_to_tasks_table.php`
- **One concern per migration** — adding a column ≠ adding an index ≠ backfilling
- **Always implement reversible `down()`** — except for irreversible data migrations (document why)
- **Foreign keys:** `foreignUlid('user_id')->constrained()->cascadeOnDelete()` (or `nullOnDelete`)
- **Backfill in separate migration or queued job** — never block deploy

### Test Layout — Tier Discipline

| Tier | Boots framework? | Hits DB? | Speed | Example |
|---|---|---|---|---|
| **Unit** | No (or minimal) | No | <50ms | Pure service logic with in-memory repo |
| **Integration** | Yes | Yes (test DB) | 100ms-500ms | Eloquent repository against real schema |
| **Feature** | Yes | Yes (test DB, `RefreshDatabase`) | 200ms-1s | Full HTTP request → response |

> See `testing-strategy.md` for pyramid proportions and naming.

### Production Deployment Checklist

- [ ] `APP_ENV=production`, `APP_DEBUG=false`
- [ ] `php artisan config:cache` + `route:cache` + `view:cache` + `event:cache`
- [ ] `php artisan optimize` run on deploy
- [ ] OPcache enabled, `validate_timestamps=0`
- [ ] Queue worker running (Horizon for Redis) — never `sync` driver
- [ ] Scheduler entry in cron: `* * * * * php artisan schedule:run`
- [ ] Logs shipped to centralized aggregator (CloudWatch / ELK / Datadog)
- [ ] HTTPS enforced (`URL::forceScheme('https')` + HSTS)
- [ ] Secrets from secret manager — not `.env` on prod servers
- [ ] DB migrations gated behind `--force` and run in deploy pipeline, not at boot

### Related Principles
- Project Structure project-structure.md (core philosophy)
- Laravel Idioms and Patterns laravel-idioms-and-patterns.md (Eloquent, Validation, Queues, Events)
- PHP Idioms and Patterns php-idioms-and-patterns.md (PHP language idioms)
- Testing Strategy testing-strategy.md
- Database Design Principles database-design-principles.md
