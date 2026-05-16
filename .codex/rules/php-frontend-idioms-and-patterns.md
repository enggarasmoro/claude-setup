## PHP Frontend Idioms and Patterns (Native / Framework-Agnostic)

### Core Philosophy

Native PHP frontend means **server-rendered HTML without a framework's view helpers**. No Blade, no Livewire — just a template engine (Twig/Plates/raw PHP) + Vite/esbuild for assets + optional HTMX/Alpine for interactivity. Discipline replaces convention: every escape, every CSRF token, every asset URL is your responsibility.

> **Scope:** PHP-native frontend. Laravel users: `laravel-frontend-idioms-and-patterns.md`. Backend layout: `project-structure-php-backend.md`. PHP language idioms: `php-idioms-and-patterns.md`. Accessibility: `accessibility-principles.md`.

---

### Template Engine — Pick One, Stay Consistent

| Engine | When to use | Notes |
|---|---|---|
| **Twig** | Default choice for any non-trivial app | Sandboxed, auto-escape, mature, large ecosystem |
| **Plates** | When you want native PHP syntax with structure | No compilation step; layouts/sections via PHP |
| **Raw PHP** | Tiny apps, single-file scripts, prototypes | High discipline required; no auto-escape |
| **Latte** | If team prefers Nette ecosystem | Strong type-checking, context-aware escaping |

**Rules:**
- Choose **one engine** per project — never mix
- **Twig is the recommended default** for production apps — context-aware auto-escaping is a security win
- Never invent a homegrown templating system

---

### Twig — Recommended Default

#### Setup

```php
use Twig\Loader\FilesystemLoader;
use Twig\Environment;

$twig = new Environment(
    new FilesystemLoader(__DIR__ . '/../templates'),
    [
        'cache' => __DIR__ . '/../var/cache/twig',
        'auto_reload' => $isDev,
        'strict_variables' => true,           // Fail on undefined vars
        'autoescape' => 'html',                // Default context
        'debug' => $isDev,
    ]
);
```

#### Rules

1. **`strict_variables: true`** — never silently render `null` for typos
2. **Never disable auto-escape globally** — use `|raw` filter ONLY on content from a trusted sanitizer
3. **Use context-specific escapers** — `|e('html')`, `|e('html_attr')`, `|e('js')`, `|e('css')`, `|e('url')`
4. **No PHP logic in templates** — no `{% set query = User.findAll() %}`; data flows from controller
5. **One template = one responsibility** — `templates/task/index.html.twig`, `templates/task/_card.html.twig` (partial)
6. **Layouts via `{% extends %}` + `{% block %}`** — never copy-paste shared chrome
7. **Macros for reusable presentational fragments** — `{% macro button(label, variant) %}`
8. **Path conventions** — partials prefixed `_`, layouts in `templates/_layouts/`
9. **Cache compiled templates** — `var/cache/twig/` in production; warm on deploy

#### Twig Anti-Patterns

| ❌ | ✅ |
|---|---|
| `{{ user_input|raw }}` | `{{ user_input }}` (escaped by default) |
| Database calls in templates | Pass data from controller |
| Logic chains in `{% if user.profile.preferences.theme.color == 'dark' %}` | Compute in controller / view model |
| Hardcoded URLs `/tasks/{{ id }}` | Inject URL generator (PSR-7 router) → `{{ url('task.show', {id: id}) }}` |
| Inline `<style>` / `<script>` | Compiled assets via Vite |

---

### Raw PHP Templates (Only When Necessary)

If using raw PHP templates (small projects, no Twig):

1. **Always escape with `htmlspecialchars` or a helper alias `e()`** — context-appropriate
   ```php
   <?= e($task->title) ?>
   ```
2. **Never `echo $userInput` without escaping** — XSS is one missed echo away
3. **Use short-tag echo `<?= ... ?>`** — never long-form `<?php echo ... ?>` for output
4. **No business logic** — only presentation
5. **Define helpers in a `View` namespace** — `e()`, `url()`, `csrf()`, `asset()`

```php
function e(mixed $value, string $context = 'html'): string {
    return match($context) {
        'html' => htmlspecialchars((string) $value, ENT_QUOTES | ENT_SUBSTITUTE | ENT_HTML5, 'UTF-8'),
        'attr' => htmlspecialchars((string) $value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8'),
        'url'  => rawurlencode((string) $value),
        'js'   => json_encode($value, JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_THROW_ON_ERROR),
        default => throw new InvalidArgumentException("Unknown context: {$context}"),
    };
}
```

---

### Project Layout — View Tier

```
apps/backend/
  templates/                          # All template files
    _layouts/
      base.html.twig                  # <html>, <head>, blocks
      auth.html.twig                  # Minimal layout for login/register
    _partials/                        # Cross-feature partials (header, footer, flash)
      header.html.twig
      footer.html.twig
      flash.html.twig
    _components/                      # Reusable Twig macros / Plates includes
      button.html.twig
      input.html.twig
    task/                             # Per-feature templates (mirrors Features/Task)
      index.html.twig
      show.html.twig
      _card.html.twig                 # Partial (leading underscore)
    error/
      404.html.twig
      500.html.twig
  public/
    index.php                         # Front controller
    build/                            # Vite output (gitignored)
  resources/
    css/
      app.css
    js/
      app.js
  vite.config.js
  package.json
```

**Rules:**
- Templates **outside** `public/` — never directly accessible via URL
- Per-feature templates mirror backend `Features/{Feature}/` structure
- `_layouts/`, `_partials/`, `_components/` are global; per-feature partials live under that feature's folder
- Compiled assets land in `public/build/` — only `public/` is webroot

---

### CSRF — Manual But Mandatory

PHP-native = no framework middleware. **You MUST implement CSRF protection yourself** (or via library: `paragonie/anti-csrf`, Symfony Security CSRF component).

1. **Generate token per session** — `random_bytes(32)` → base64
2. **Embed in every state-changing form** — hidden input named `_token`
3. **Validate before processing** — `hash_equals($sessionToken, $submittedToken)` (timing-safe)
4. **Use SameSite cookies as defense-in-depth** — not a CSRF replacement

```php
// In layout / form macro
<input type="hidden" name="_token" value="<?= e($csrf->token()) ?>">

// In dispatcher (PSR-15 middleware)
if ($request->getMethod() !== 'GET' && !$csrf->validate($request)) {
    throw new HttpException(419, 'CSRF token mismatch');
}
```

---

### Asset Pipeline — Vite (Recommended)

Use Vite even without Laravel — it's the modern standard.

#### `vite.config.js`

```javascript
import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
    build: {
        outDir: 'public/build',
        emptyOutDir: true,
        manifest: 'manifest.json',
        rollupOptions: {
            input: {
                app: resolve(__dirname, 'resources/js/app.js'),
                styles: resolve(__dirname, 'resources/css/app.css'),
            },
        },
    },
    server: {
        host: '0.0.0.0',
        port: 5173,
        strictPort: true,
        origin: 'http://localhost:5173',
    },
});
```

#### `vite()` Helper for PHP

```php
final class Vite
{
    public function __construct(
        private readonly string $manifestPath,
        private readonly string $devServerUrl,
        private readonly bool $isDev,
    ) {}

    public function asset(string $entry): string
    {
        if ($this->isDev) {
            return "{$this->devServerUrl}/{$entry}";
        }
        $manifest = json_decode(file_get_contents($this->manifestPath), true, flags: JSON_THROW_ON_ERROR);
        return '/build/' . ($manifest[$entry]['file'] ?? throw new RuntimeException("Asset not found: {$entry}"));
    }
}
```

In Twig:
```twig
<link rel="stylesheet" href="{{ vite('resources/css/app.css') }}">
<script type="module" src="{{ vite('resources/js/app.js') }}"></script>
```

**Rules:**
- Pin all asset deps in `package.json` — exact versions
- Build runs in CI: `npm ci && npm run build` — never on the production server
- `manifest.json` is committed-as-built artifact; never hand-edited
- Source maps disabled in production

---

### Interactivity — Pick One Strategy

| Strategy | When to use |
|---|---|
| **HTMX** | Reactive UI without writing JS — server returns HTML fragments |
| **Alpine.js** | Tiny client-side state (dropdowns, modals, tabs) |
| **Vanilla JS / TypeScript** | Custom rich interactivity, build with Vite |
| **Vue/React standalone** | Full SPA — but reconsider; Inertia.js (with a tiny shim) works without Laravel |

#### HTMX — Recommended for Server-Rendered Apps

1. **Server returns HTML partials**, not JSON, on `HX-Request` header
2. **Use `hx-target`, `hx-swap`** explicitly — never rely on defaults for critical UX
3. **CSRF token via `hx-headers='{"X-CSRF-Token": "..."}'`** in body or per-element
4. **`hx-confirm` for destructive actions** — never silent DELETE
5. **Loading states via `hx-indicator`** — required for >100ms operations
6. **Validate on server** — return 422 with error fragment on validation failure

```html
<form hx-post="/tasks" hx-target="#task-list" hx-swap="beforeend">
    <input type="hidden" name="_token" value="<?= e($csrf->token()) ?>">
    <input name="title" required>
    <button type="submit">Add</button>
    <span class="htmx-indicator">Saving…</span>
</form>
```

#### Alpine.js for Sprinkles

Same rules as Laravel frontend — see `laravel-frontend-idioms-and-patterns.md` § Alpine.js Integration. The patterns are framework-agnostic.

---

### Forms

1. **All forms include CSRF token** — non-negotiable
2. **Server-side validation is the only validation** — client-side is UX, not security
3. **Old input on validation failure** — repopulate via session flash
4. **Display errors next to fields** — `aria-describedby` linking
5. **`enctype="multipart/form-data"` for uploads** — validate `mime`, `size`, store outside webroot, regenerate filename

```twig
<label for="title">Title</label>
<input
    id="title"
    name="title"
    value="{{ old('title', task.title|default('')) }}"
    aria-describedby="title-error"
    aria-invalid="{{ errors.title is defined ? 'true' : 'false' }}"
>
{% if errors.title is defined %}
    <p id="title-error" role="alert">{{ errors.title }}</p>
{% endif %}
```

---

### Sessions and Flash Messages

PHP-native = manual session handling.

1. **Configure session cookies securely**
   ```php
   session_set_cookie_params([
       'lifetime' => 0,
       'path' => '/',
       'domain' => '',
       'secure' => true,           // HTTPS only
       'httponly' => true,         // No JS access
       'samesite' => 'Lax',        // 'Strict' for sensitive flows
   ]);
   session_name('app_session');
   session_start();
   ```
2. **Regenerate session ID on auth state change** — `session_regenerate_id(true)` after login/logout/privilege change
3. **Flash messages via session** — read once, then clear
4. **Never store user objects in session** — store user ID, hydrate per request

---

### i18n

Use `symfony/translation` or `gettext` — never roll your own.

1. **`__('messages.task.created')`** as a global helper that wraps the translator
2. **Translation files in `translations/{locale}/messages.{locale}.yaml`** (Symfony) or `.po`/`.mo` (gettext)
3. **Locale resolution via middleware** — header / URL prefix / cookie
4. **Pluralization via ICU MessageFormat** — `{count, plural, one {# task} other {# tasks}}`

---

### Accessibility

> See `accessibility-principles.md` for WCAG 2.1 AA. PHP-native specifics:

1. **Form components MUST render `<label for="">` matching input `id`**
2. **Validation errors: `aria-describedby` + `role="alert"`**
3. **HTMX swap regions: `aria-live="polite"`** — announce content updates
4. **Skip-to-main link in layout**
5. **Focus management on dynamic content** — return focus to trigger after modal close

---

### Security — Frontend-Specific

> See `security-principles.md` for OWASP top 10. PHP-language specifics in `php-idioms-and-patterns.md`.

1. **CSP headers in production** — strict; whitelist Vite asset host; no `unsafe-inline`/`unsafe-eval`
2. **`X-Frame-Options: DENY`** unless framing intentional
3. **`Strict-Transport-Security` (HSTS)** in production
4. **`Referrer-Policy: strict-origin-when-cross-origin`**
5. **`X-Content-Type-Options: nosniff`**
6. **Never trust `$_SERVER['HTTP_*']` headers** — assume they're attacker-controlled
7. **Output encoding always context-appropriate** — HTML body ≠ HTML attribute ≠ JS string ≠ URL ≠ CSS
8. **Never embed user data into JS without `json_encode(..., JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_THROW_ON_ERROR)`**
9. **File uploads:** validate MIME via `finfo`, regenerate filename, store outside webroot, serve via streaming controller

---

### Testing Frontend

1. **Render templates in tests via the engine directly** — `$twig->render('task/index.html.twig', $context)`
2. **Assert on DOM structure with `symfony/dom-crawler`** — `$crawler->filter('h1')->text()`
3. **Full HTTP feature tests** — assert response body contains expected accessible text
4. **HTMX flows: assert returned partial on `HX-Request` header**
5. **E2E with Playwright** — see `testing-strategy.md` § E2E

---

### Static Analysis and Formatting (Frontend)

| Tool | Purpose | Command |
|---|---|---|
| `twig-cs-fixer` | Twig formatting/lint | `vendor/bin/twig-cs-fixer lint templates` |
| `prettier` | CSS / JS / TS formatting | `npx prettier --write resources/` |
| `eslint` | JS / TS linting | `npm run lint` |
| `npm audit` | JS dep CVE scan | `npm audit --audit-level=high` |
| `pint` / `php-cs-fixer` | PHP-side helpers | `vendor/bin/pint` |

**Mandatory CI gates:** `twig-cs-fixer lint`, `eslint`, `npm run build`, `npm audit`.

---

### Anti-Patterns — NEVER

| ❌ | ✅ |
|---|---|
| `<?= $userInput ?>` (raw echo) | `<?= e($userInput) ?>` |
| `{{ data\|raw }}` in Twig with user content | Sanitize first via HTMLPurifier / `Str::sanitizeHtml` |
| DB queries inside templates | Pass data from controller |
| Hardcoded URLs in templates | URL generator with route names |
| CDN script tags in production | Vite-bundled assets |
| Skipping CSRF on POST/PUT/DELETE | Always validate token |
| Storing user object in session | Store user ID; hydrate per request |
| Mixing template engines | Pick one |
| Inline `<style>`/`<script>` blocks with user data | External files + JSON data attributes |
| `$_GET`/`$_POST` directly in templates | Pass validated data from controller |
| Trusting `$_SERVER['HTTP_X_FORWARDED_FOR']` | Validate trusted proxies |
| Custom hand-rolled CSRF/auth/session crypto | Battle-tested libraries |

---

### Decision Matrix — Which Strategy?

```
Tiny app / single page?               → Raw PHP + e() helper
Production multi-page server-rendered → Twig + Vite + HTMX
Need rich client UI without SPA?      → Twig + HTMX + Alpine
Full SPA needed?                      → Reconsider — use Inertia.js + a PHP framework, or split frontend/backend
Admin / internal CRUD?                → Reconsider — Filament (Laravel) is far less work
```

---

### Related Principles
- PHP Idioms and Patterns php-idioms-and-patterns.md
- Project Structure — PHP Backend project-structure-php-backend.md
- Laravel Frontend Idioms (for comparison) laravel-frontend-idioms-and-patterns.md
- Accessibility Principles accessibility-principles.md
- Security Principles security-principles.md
- Testing Strategy testing-strategy.md
- Data Serialization Principles data-serialization-and-interchange-principles.md
