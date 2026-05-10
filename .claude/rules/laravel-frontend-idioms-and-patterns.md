## Laravel Frontend Idioms and Patterns

### Core Philosophy

Laravel frontend covers **four** distinct rendering strategies. Pick **one** primary stack per app — do not mix Livewire and Inertia in the same UI. Blade is the universal substrate; Livewire/Inertia/Filament build on top of it.

| Stack | When to use | Trade-off |
|---|---|---|
| **Blade only** | Mostly static, server-rendered, low interactivity (marketing, admin internal tools) | Simplest; full page reloads |
| **Blade + Alpine.js** | Server-rendered + sprinkles of interactivity (dropdowns, modals, tabs) | No SPA feel; tiny JS footprint |
| **Livewire 3 + Alpine** | Reactive UI with PHP-only logic; team has no JS expertise | Server round-trip per interaction; not for offline/mobile |
| **Inertia + Vue/React** | SPA experience; team has JS expertise; rich client-side interactivity | Two languages to maintain; bigger build |
| **Filament 3** | Admin panels, internal CRUD-heavy tools | Opinionated; not for public-facing custom UI |

> **Scope:** Laravel-specific frontend patterns. PHP/Laravel backend: `laravel-idioms-and-patterns.md`. Vue idioms (when using Inertia + Vue): `vue-idioms-and-patterns.md`. TypeScript: `typescript-idioms-and-patterns.md`. Accessibility: `accessibility-principles.md`.

---

### Universal Rules — All Stacks

1. **Vite is the only asset bundler** — never `mix`, never raw `webpack`. Laravel 10+ ships Vite.
2. **All assets compiled** — never link CDN scripts/styles in production templates (CSP, integrity, caching reasons)
3. **CSRF tokens auto-injected** — `@csrf` in forms; never disable CSRF middleware globally
4. **XSS-safe by default** — use `{{ $var }}` (escaped); `{!! $var !!}` (raw) is FORBIDDEN unless content is provably safe HTML from a sanitizer (HTMLPurifier, `Str::sanitizeHtml`)
5. **Never expose secrets to the frontend** — no API keys, DB credentials, internal IDs in `window.*` or compiled JS
6. **CSP headers in production** — strict `Content-Security-Policy` excluding `unsafe-inline`, `unsafe-eval`
7. **Tailwind CSS is the canonical utility framework** — Tailwind v4+ with `@layer`, `@apply` discouraged in favor of components

---

### Blade — Universal Substrate

#### Component-First

1. **Anonymous components for presentation primitives** — `resources/views/components/button.blade.php`
   ```blade
   {{-- resources/views/components/button.blade.php --}}
   @props(['variant' => 'primary', 'type' => 'button'])

   <button
       type="{{ $type }}"
       {{ $attributes->class([
           'inline-flex items-center px-4 py-2 rounded font-medium',
           'bg-blue-600 text-white hover:bg-blue-700' => $variant === 'primary',
           'bg-gray-200 text-gray-900 hover:bg-gray-300' => $variant === 'secondary',
       ]) }}
   >
       {{ $slot }}
   </button>
   ```
2. **Class-based components only when logic is needed** — `php artisan make:component Card`
3. **`@props` declares typed inputs** — every prop documented; never `$attributes->get('foo')` for known props
4. **`$attributes->class([...])` and `$attributes->merge([...])`** for class/attribute composition
5. **Slot-based composition over deep prop trees** — named slots: `<x-card><x-slot:header>...</x-slot:header></x-card>`

#### Blade Discipline

| ❌ Anti-Pattern | ✅ Correct |
|---|---|
| `{!! $userInput !!}` | `{{ $userInput }}` (or sanitize first) |
| Database queries in views (`Task::all()` inline) | Pass data from controller; use View Composers for layout-wide data |
| Inline `<?php ?>` blocks | Blade directives (`@php` only as last resort) |
| `@include` for reusable UI | `<x-component>` |
| Logic in Blade (`@if($task->user->orders->count() > ...)`) | Compute in controller / model accessor |
| Hardcoded URLs in views | `route('tasks.show', $task)` |
| Deep `with()` chains in templates | Eager-load in controller; use `whenLoaded()` patterns |
| Translating strings inline | `__('messages.task.created')` with `lang/` files |

#### Layouts

1. **Single root layout via `<x-layouts.app>`** — extend in pages, not `@extends`
2. **Stack assets correctly** — `@push('scripts')` / `@stack('scripts')` for per-page JS
3. **Use `@vite(['resources/css/app.css', 'resources/js/app.js'])`** — never manual `<script src="...">`

---

### Livewire 3

Use Livewire when team is PHP-first and SPA isn't needed. Component = a Blade view + PHP class.

#### Component Rules

1. **One component per file** — `app/Livewire/TaskList.php` + `resources/views/livewire/task-list.blade.php`
2. **`Form Objects` for input handling** — never accumulate properties on the component
   ```php
   final class TaskForm extends Form
   {
       #[Validate('required|min:1|max:200')]
       public string $title = '';

       #[Validate(['required', new Enum(Priority::class)])]
       public Priority $priority = Priority::Medium;
   }
   ```
3. **`#[Validate]` attribute over `rules()` method** — co-located, type-safe
4. **`#[Computed]` for derived state** — cached per request
5. **`#[On('event')]` for event listeners** — typed, explicit
6. **`wire:model.live` only when necessary** — defaults to deferred; live = network round-trip per keystroke
7. **Always use `wire:loading` and `wire:target` for UX feedback**

#### Performance & Security

1. **Lazy-load heavy components** — `<livewire:task-list lazy />`
2. **`#[Locked]` on properties that must NOT be modified from the client** — IDs, foreign keys, computed flags
   ```php
   #[Locked]
   public int $taskId;  // Cannot be tampered via DOM payload
   ```
3. **Authorize in mount() AND in actions** — never trust component state from prior request
4. **Never put models with sensitive attributes as public properties** — pass IDs, hydrate on demand
5. **Pagination via `WithPagination` trait** — never load full collections
6. **Polling judiciously** — `wire:poll.30s` only where freshness matters; prefer events for real-time

#### Alpine.js Integration

1. **Alpine for client-only state** — dropdowns, modals, tabs, transitions
2. **`@entangle` for two-way Livewire ↔ Alpine binding** — never manual JS to manipulate Livewire state
3. **`x-data` blocks small** — extract to Alpine components (`Alpine.data('taskCard', () => ({...}))`) when >10 lines

---

### Inertia.js + Vue/React

Use Inertia when you want SPA UX without building a separate API. Controllers return Inertia responses; the frontend is a real Vue/React app.

> When using Inertia + Vue: `vue-idioms-and-patterns.md` applies in full.
> When using Inertia + React: standard React idioms (hooks, function components, TypeScript strict).

#### Required Stack

- **TypeScript mandatory** — `resources/js/**/*.ts` / `*.vue` / `*.tsx`; `tsconfig.json` with `strict: true`
- **Vite + `@inertiajs/vue3`** (or `@inertiajs/react`)
- **Ziggy** — for `route()` helper in JS, sharing Laravel route names
- **Tailwind CSS v4+**

#### Project Layout

```
resources/
  js/
    Pages/                     # 1:1 with Inertia::render('Pages/Tasks/Index')
      Tasks/
        Index.vue
        Show.vue
        Create.vue
    Layouts/
      AppLayout.vue
      AuthLayout.vue
    Components/                # Shared dumb UI primitives
      ui/
        Button.vue
        Input.vue
      layout/
        Sidebar.vue
    Composables/               # Vue composables (use*)
    Stores/                    # Pinia (Vue) or Zustand (React) — only for client-only state
    types/                     # TypeScript types matching server DTOs
      task.ts
      user.ts
    app.ts                     # Inertia + Vue bootstrap
    ssr.ts                     # SSR entry (optional)
```

#### Inertia Rules

1. **Controllers return `Inertia::render('Pages/...', $props)`** — never `view()` or `response()->json()` mixed in same controller
2. **Props are server-shaped, frontend-typed** — define TS types matching the controller's prop shape
   ```typescript
   // resources/js/types/task.ts
   export interface Task {
       id: string;
       title: string;
       status: 'pending' | 'in_progress' | 'done';
       due_date: string | null;
   }
   export interface TasksIndexProps {
       tasks: Paginated<Task>;
       filters: { status?: string };
   }
   ```
3. **`useForm` for all forms** — built-in CSRF, validation errors, processing state
   ```typescript
   const form = useForm<{ title: string; priority: string }>({
       title: '',
       priority: 'medium',
   });
   const submit = () => form.post(route('tasks.store'));
   ```
4. **Never `axios`/`fetch` directly** — use Inertia's `router.post/put/delete` so server validation errors flow back into `useForm.errors`
5. **Partial reloads via `only`** — `router.reload({ only: ['tasks'] })` to refresh subset of props
6. **Lazy props with `Inertia::lazy(fn() => ...)`** — heavy data loaded on-demand
7. **Shared props (auth user, flash messages, ziggy routes) in `HandleInertiaRequests` middleware** — never duplicate in every page
8. **Layouts via persistent layout pattern** — `Page.layout = AppLayout` to preserve scroll/state across navigation

#### Validation Errors

Server `ValidationException` automatically populates `form.errors` keyed by field name. Never re-validate client-side as a security measure (only as UX). Server is the only source of truth.

#### SSR (Optional)

Enable Inertia SSR for SEO-sensitive pages. Run `php artisan inertia:start-ssr` as a separate process. Avoid client-only browser APIs (`window`, `localStorage`) in code paths that run during SSR.

---

### Filament 3 (Admin Panels)

Use Filament for internal admin/CRUD UIs — not for public-facing custom UX.

1. **Resources represent Eloquent models** — `php artisan make:filament-resource Task --generate`
2. **Forms via Schema API** — typed component builders, no raw HTML
3. **Tables via Schema API** — column types, filters, actions, bulk actions
4. **Authorization via Policies** — Filament respects existing Laravel Policies automatically
5. **Custom pages for non-CRUD workflows** — never hack Resources for non-CRUD
6. **One Panel per audience** — `AdminPanelProvider`, `CustomerPanelProvider` — separate auth, navigation, theme
7. **Never expose Filament panel publicly** — middleware-gated, admin-only

---

### Asset Pipeline (Vite)

#### `vite.config.js`

```javascript
import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.ts'],
            refresh: true,  // Hot reload on Blade/PHP changes
        }),
        vue({ template: { transformAssetUrls: { base: null, includeAbsolute: false } } }),
    ],
    server: {
        host: '0.0.0.0',
        hmr: { host: 'localhost' },
    },
});
```

#### Rules

1. **Pin all asset dependencies** — exact versions in `package.json` for production builds
2. **Use `@vite()` directive** — never `<script src="/build/...">` manually
3. **Lazy-load route-specific JS** — dynamic `import()` in Inertia / split entry points in Blade
4. **Production build in CI** — `npm ci && npm run build` before deploy; manifest.json committed-as-built artifact only
5. **Source maps in dev only** — disabled in production for size + obfuscation
6. **Asset versioning automatic via Vite manifest** — never manual `?v=` query strings

---

### Forms — Universal Rules

1. **Always `@csrf` in non-Inertia forms** — Inertia handles automatically
2. **`@method('PUT')` / `@method('DELETE')` for non-POST** — HTML forms only support GET/POST
3. **Display validation errors next to fields** — `@error('title') ... @enderror` in Blade
4. **Old input on validation failure** — `value="{{ old('title', $task->title ?? '') }}"`
5. **Disable submit button while submitting** — Livewire `wire:loading.attr="disabled"`, Inertia `form.processing`, plain Blade Alpine `:disabled`
6. **File uploads:** `enctype="multipart/form-data"`, validate `mimes:`/`max:` server-side, store outside webroot, never trust filename

---

### Internationalization (i18n)

1. **Use `__('key.path')` / `@lang()` / `trans_choice()`** — never hardcoded strings in views
2. **Translation files in `lang/{locale}/{group}.php`** — return arrays, not raw strings
3. **JSON translations in `lang/{locale}.json`** — for natural-language keys
4. **Pluralization via `trans_choice('messages.tasks', $count)`**
5. **Locale switching via middleware** — never `App::setLocale()` inside controllers
6. **Inertia: ship translations as shared prop** — typed, accessed via composable on client

---

### Accessibility (Frontend)

> See `accessibility-principles.md` for WCAG 2.1 AA baseline.

Laravel-specific:

1. **`<x-input>` components MUST render `<label>` with `for=` matching the input `id`**
2. **Validation errors: `aria-describedby` linking input to error message**
3. **Livewire `wire:loading` regions need `aria-live="polite"`**
4. **Inertia route changes: announce via SR-only live region** (Inertia doesn't auto-announce)
5. **Focus management on dynamic content** — return focus to trigger after modal close
6. **Skip-to-main-content link** in master layout

---

### Testing Frontend

#### Blade
- **Test rendering via `$response->assertSee()`, `assertViewHas()`** in HTTP feature tests
- **Component tests via `Blade::render()`** for pure component snapshots
- **Never test against compiled HTML structure** — assert visible content + accessible roles

#### Livewire
- **`Livewire::test(Component::class)`** — fluent API for set/call/assertSee/assertDispatched
- **Test all `#[On]` listeners** — fire from peer components
- **Test authorization** — unauthorized user should not be able to call public methods even via crafted payload
- **`#[Locked]` properties** — explicitly test that mutation attempts fail

#### Inertia
- **`$response->assertInertia(fn (Assert $page) => $page->component('Pages/Tasks/Index')->has('tasks'))`**
- **Frontend unit tests via Vitest** — components in isolation; mock Inertia router
- **E2E with Playwright** — see `testing-strategy.md` § E2E

---

### Security — Frontend-Specific

> See `security-principles.md` for OWASP top 10. Backend Laravel-specific in `laravel-idioms-and-patterns.md` § Security.

1. **CSP headers in production** — strict; whitelist Vite asset host + nonce for inline scripts (avoid inline)
2. **`X-Frame-Options: DENY`** unless framing intentional
3. **Sanctum SPA auth: cookie-based, NOT localStorage tokens** — `withCredentials: true` on Inertia
4. **`SameSite=Lax` minimum on session cookies; `Strict` for sensitive flows**
5. **Never embed user-controlled content in JavaScript template literals** — even with backticks, escape via JSON-encoded data attributes
6. **Inertia: `Inertia::share()` carefully** — anything shared is sent on every page load and exposed to client
7. **Livewire: never put sensitive data in public properties** — they round-trip in DOM payload (signed but visible)
8. **Filament: never expose admin panel without IP allowlist or VPN** for production

---

### Static Analysis and Formatting (Frontend)

| Tool | Purpose | Command |
|---|---|---|
| `pint` | PHP / Blade formatting | `vendor/bin/pint` |
| `prettier` + `prettier-plugin-blade` | Blade prettier formatting | `npx prettier --write resources/views` |
| `eslint` + `@typescript-eslint` | JS/TS linting | `npm run lint` |
| `vue-tsc --noEmit` | Vue + TS type checking (Inertia + Vue) | `npm run type-check` |
| `npm audit` | JS dependency CVE scan | `npm audit --audit-level=high` |

**Mandatory CI gates for FE:** `pint --test`, `eslint`, `vue-tsc --noEmit` (if Inertia+Vue), `npm run build`, `npm audit`.

---

### Anti-Patterns — NEVER

| ❌ Anti-Pattern | ✅ Correct |
|---|---|
| `{!! $userInput !!}` | `{{ $userInput }}` |
| `<script src="https://cdn..."></script>` in production | `@vite()` bundled assets |
| Eloquent queries inside Blade | Pass data from controller |
| Mixing Livewire + Inertia in same UI | Pick one; use Blade for the other (transitional only) |
| `axios` direct calls in Inertia pages | `router.post/put/delete` or `useForm` |
| Public Livewire properties for IDs/FKs | `#[Locked]` |
| Inline JS in Blade (`<script>let x = {{ $data }}</script>`) | `@json($data)` into data attribute, read via Alpine/Vue |
| `localStorage` for auth tokens (Sanctum SPA) | HttpOnly cookies via Sanctum |
| Hardcoded URLs (`<a href="/tasks">`) | `route('tasks.index')` / Ziggy `route()` in JS |
| Hardcoded text in views | `__('key.path')` |
| `@if(auth()->user()->isAdmin())` in Blade | `@can('admin')` (uses Gates) |
| `dd()` / `dump()` in committed views | Logger / browser devtools |
| Disabling CSRF on POST routes | Add `@csrf` (or use Sanctum `withCredentials`) |

---

### Decision Matrix — Which Stack?

```
Need SEO + simple UI?              → Blade (+ Alpine sprinkles)
Need reactive UI, PHP team only?   → Livewire 3 + Alpine
Need SPA feel, JS team available?  → Inertia + Vue/React + TypeScript
Building admin panel?              → Filament 3
Public-facing + complex client UX? → Inertia + Vue/React (with SSR)
Mobile app?                        → Native API + Flutter (see flutter-idioms)
```

---

### Related Principles
- Laravel Idioms and Patterns laravel-idioms-and-patterns.md
- PHP Idioms and Patterns php-idioms-and-patterns.md
- Vue Idioms and Patterns vue-idioms-and-patterns.md (when using Inertia + Vue)
- TypeScript Idioms and Patterns typescript-idioms-and-patterns.md (when using Inertia)
- Project Structure — Laravel Backend project-structure-laravel-backend.md
- Accessibility Principles accessibility-principles.md
- Security Principles security-principles.md
- Testing Strategy testing-strategy.md
