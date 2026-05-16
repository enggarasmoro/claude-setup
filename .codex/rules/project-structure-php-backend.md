## PHP Backend Layout (Native / Framework-Agnostic)

Use this structure for native PHP backends, micro-framework apps (Slim, Mezzio), or PHP libraries. The vertical slice principle applies — features are namespaces, not technical layers.

> Laravel-specific layout: `project-structure-laravel-backend.md`.

```
apps/
  backend/                            # Backend application source code
    composer.json                     # Project metadata, autoload (PSR-4), dependencies
    composer.lock                     # Locked dependency versions (committed)
    phpstan.neon                      # Static analysis config
    phpunit.xml                       # Test runner config
    .php-cs-fixer.dist.php            # Formatter config (PSR-12)
    public/
      index.php                       # Front controller (only entry point)
      .htaccess                       # OR nginx config — rewrites to index.php
    src/
      App/                            # Root namespace (PSR-4: "App\\" → "src/App/")
        Bootstrap.php                 # Application factory: builds container, registers routes
        Platform/                     # Foundational technical concerns (the "Framework")
          Container/
            ContainerFactory.php      # PSR-11 container setup (PHP-DI / league/container)
          Database/
            ConnectionFactory.php     # PDO connection factory
            TransactionManager.php
          Http/
            Kernel.php                # PSR-15 middleware pipeline
            Router.php                # Route definition and dispatch
            ErrorHandler.php          # Top-level exception → HTTP response
            Middleware/
              CorrelationIdMiddleware.php
              RequestLoggerMiddleware.php
              AuthenticationMiddleware.php
          Logger/
            LoggerFactory.php         # Monolog setup (PSR-3)
          Config/
            Config.php                # Immutable config object
            ConfigLoader.php          # Loads from env + config files

        Features/                     # Business Features (Vertical Slices)
          Task/
            # --- Public API ---
            TaskService.php           # Service class (public API of this feature)
            TaskServiceInterface.php  # Optional — when multiple consumers/implementations exist

            # --- Delivery (HTTP) ---
            Http/
              TaskController.php      # PSR-15 request handlers (one per route)
              StoreTaskRequest.php    # Input DTO + validator
              TaskResource.php        # Output transformer (entity → array)
              Routes.php              # Route registration callable

            # --- Domain (Business Logic) ---
            Domain/
              Task.php                # Domain entity (readonly value object preferred)
              TaskStatus.php          # Enum
              CreateTaskCommand.php   # Input DTO (immutable)
              TaskLogic.php           # Pure functions (no I/O)
              Exceptions/
                TaskNotFoundException.php
                TaskValidationException.php

            # --- Storage (Data Access) ---
            Repository/
              TaskRepository.php           # Interface
              PdoTaskRepository.php        # Production implementation
              InMemoryTaskRepository.php   # Test implementation

          Order/                      # Same internal structure as Task
            ...

    config/                           # Configuration files (return arrays)
      app.php
      database.php
      logging.php
      services.php                    # Container bindings

    tests/
      Unit/                           # Unit tests (mirror src/ structure, test_doubles)
        Features/
          Task/
            Domain/
              TaskLogicTest.php
            TaskServiceTest.php
      Integration/                    # Real DB / external services (Testcontainers)
        Features/
          Task/
            Repository/
              PdoTaskRepositoryTest.php
      Feature/                        # HTTP-level (full pipeline, in-memory or test DB)
        Features/
          Task/
            Http/
              TaskControllerTest.php
      e2e/                            # Optional: cross-feature end-to-end

    var/                              # Runtime artifacts (gitignored)
      cache/
      logs/

    bin/                              # CLI entry points
      console                         # Symfony Console / custom CLI

    .env.example                      # Documented env vars (committed)
    .env                              # Local env (gitignored)
```

### Key PHP Conventions

- **PSR-4 autoloading** via `composer.json` — `"App\\": "src/App/"` — never use require/include for class loading
- **Single front controller** — all HTTP requests route through `public/index.php`; nothing else web-accessible
- **`public/`** is the only web-exposed directory — `src/`, `vendor/`, `config/` MUST be outside webroot
- **Tests separated by tier** (Unit/Integration/Feature) — different bootstrap, different speed expectations
- **Each feature directory contains its own Http/Domain/Repository sub-namespaces** — vertical slice
- **Interfaces live with their consumer** — `TaskRepository` interface in `Features/Task/Repository/`, not in a global `Contracts/` directory

### composer.json Baseline

```json
{
    "name": "company/app",
    "type": "project",
    "require": {
        "php": "^8.2",
        "psr/log": "^3.0",
        "psr/http-server-handler": "^1.0",
        "psr/container": "^2.0",
        "monolog/monolog": "^3.0"
    },
    "require-dev": {
        "phpunit/phpunit": "^10.5",
        "phpstan/phpstan": "^1.11",
        "friendsofphp/php-cs-fixer": "^3.50",
        "rector/rector": "^1.0"
    },
    "autoload": {
        "psr-4": { "App\\": "src/App/" }
    },
    "autoload-dev": {
        "psr-4": { "App\\Tests\\": "tests/" }
    },
    "config": {
        "sort-packages": true,
        "optimize-autoloader": true
    },
    "scripts": {
        "test": "phpunit",
        "lint": "php-cs-fixer fix --dry-run --diff",
        "fix": "php-cs-fixer fix",
        "analyse": "phpstan analyse",
        "audit": "composer audit"
    }
}
```

### Composition Root (Bootstrap.php)

```php
<?php
declare(strict_types=1);

namespace App;

use App\Platform\Container\ContainerFactory;
use App\Platform\Http\Kernel;
use Psr\Container\ContainerInterface;

final class Bootstrap
{
    public static function createKernel(): Kernel
    {
        $container = ContainerFactory::create();
        $container->get(RouteRegistry::class)->register();
        return $container->get(Kernel::class);
    }
}
```

### Front Controller (public/index.php)

```php
<?php
declare(strict_types=1);

require __DIR__ . '/../vendor/autoload.php';

use App\Bootstrap;

$kernel = Bootstrap::createKernel();
$kernel->handle()->send();
```

### phpstan.neon Baseline

```neon
parameters:
    level: 8
    paths:
        - src
        - tests
    checkMissingIterableValueType: true
    checkGenericClassInNonGenericObjectType: true
    treatPhpDocTypesAsCertain: false
```

### phpunit.xml Baseline

```xml
<?xml version="1.0" encoding="UTF-8"?>
<phpunit
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:noNamespaceSchemaLocation="vendor/phpunit/phpunit/phpunit.xsd"
    bootstrap="vendor/autoload.php"
    colors="true"
    cacheDirectory=".phpunit.cache"
    failOnRisky="true"
    failOnWarning="true">
    <testsuites>
        <testsuite name="Unit"><directory>tests/Unit</directory></testsuite>
        <testsuite name="Integration"><directory>tests/Integration</directory></testsuite>
        <testsuite name="Feature"><directory>tests/Feature</directory></testsuite>
    </testsuites>
    <source><include><directory>src</directory></include></source>
</phpunit>
```

### Related Principles
- Project Structure project-structure.md (core philosophy)
- PHP Idioms and Patterns php-idioms-and-patterns.md (coding idioms, error handling, naming)
