## TypeScript Idioms and Patterns

### Core Philosophy

TypeScript's type system is your documentation, test, and specification. Encode domain invariants in types so invalid states are unrepresentable.

> **Scope:** TS-specific type system & language idioms. For Vue: `vue-idioms-and-patterns.md`. Layout: `project-structure-vue-frontend.md`. Quality commands: `code-completion-mandate.md`.

---

### Strict Mode — Non-Negotiable

**Always enable strict mode** in `tsconfig.json`:

```json
{ "compilerOptions": { "strict": true, "noUncheckedIndexedAccess": true, "exactOptionalPropertyTypes": true } }
```

Never disable per-file without a `// STRICT-DISABLE:` comment explaining the rationale.

---

### Type System Idioms

1. **`unknown` over `any` — always**
   ```typescript
   // ✅ Forces narrowing
   function parse(data: unknown): User { if (!isUser(data)) throw new Error('Invalid'); return data; }
   // ❌ Disables type checker
   function parse(data: any): User { return data; }
   ```

2. **Use `readonly` to enforce immutability**
   ```typescript
   interface TaskState { readonly id: string; readonly items: readonly Task[]; }
   function process(tasks: readonly Task[]): Summary { ... }
   ```

3. **Discriminated unions for type-safe state machines** — exhaustive `switch` catches missing cases
   ```typescript
   type AsyncState<T> = { status: 'idle' } | { status: 'loading' } | { status: 'success'; data: T } | { status: 'error'; error: Error };
   ```

4. **Const assertions for literal types**
   ```typescript
   const ROLES = ['admin', 'editor', 'viewer'] as const;
   type Role = typeof ROLES[number];
   ```

5. **Type narrowing — use type guards instead of `as` casts**
   ```typescript
   // ✅ Type guard
   function isError(value: unknown): value is Error { return value instanceof Error; }
   // ❌ Bypasses checker: const err = value as Error;
   ```

6. **Never use non-null assertion `!` in production code**
   ```typescript
   // ❌ const name = user!.profile!.name;
   // ✅ const name = user?.profile?.name ?? 'Anonymous';
   ```

7. **`satisfies` operator for type-checked object literals (TS 4.9+)** — compile-checked but type stays as literal
   ```typescript
   const config = { endpoint: '/api/tasks', retries: 3 } satisfies ApiConfig;
   ```

---

### Null Safety

1. **Prefer `??` over `||`** for default values (only falls back for null/undefined, not 0/''/false)
2. **Use optional chaining `?.`** for safe navigation
3. **Distinguish `undefined` (absence) from `null` (explicit empty)** — `undefined` for optional fields; `null` only for "intentionally empty" on the wire (JSON APIs)

---

### Async/Await

> See `concurrency-and-threading-mandate.md` for general async principles.

1. **Always `await` or handle returned Promises — no floating promises**
   ```typescript
   // ❌ sendEmail(user);          // errors silently swallowed
   // ✅ await sendEmail(user);
   // ✅ void sendEmail(user);     // intentional fire-and-forget
   ```

2. **Use `Promise.all` for concurrent independent operations**
   ```typescript
   const [user, tasks] = await Promise.all([getUser(id), getTasks(id)]);
   ```

3. **Use `Promise.allSettled` when partial failure is acceptable**
4. **Never mix `async/await` with raw `.then()/.catch()` chains in the same function**

---

### Runtime Validation at Boundaries

**All data crossing a system boundary must be validated at runtime**, not just typed.

```typescript
import { z } from 'zod';
const CreateTaskSchema = z.object({
    title: z.string().min(1).max(200),
    priority: z.enum(['low', 'medium', 'high']),
    dueDate: z.string().datetime().optional(),
});
type CreateTaskRequest = z.infer<typeof CreateTaskSchema>;
function parseCreateTask(body: unknown): CreateTaskRequest { return CreateTaskSchema.parse(body); }
```

- Use `zod` for runtime validation at API ingress and external API egress
- Never use `as` as a substitute for runtime validation
- Validate on ingress; trust validated types thereafter

---

### Centralized HTTP Client

**All outbound HTTP calls MUST go through the project's single, shared API client utility.** Do not call `fetch()` or `axios()` directly in feature code.

Why: consistent auth header injection, correlation-ID propagation, centralized error normalization, single place for retries/timeouts/logging.

```typescript
// ❌ Bypass: no auth, no correlation-ID, no logging
const res = await fetch('/api/tasks');
// ✅ Use shared client
import { apiFetch } from '@/infrastructure/apiFetch';
const res = await apiFetch('/api/tasks');
```

**Exception:** The centralized client itself may use raw `fetch`/`axios` internally.

> Audit Integration Contracts (Phase 1.5, Dimension A) flags any direct `fetch`/`axios` outside the shared client as `[INT]`.

---

### Module and Export Patterns

1. **Prefer named exports over default exports** — explicit, refactor-safe, IDE-friendly
2. **Avoid barrel re-exports that risk circular dependency** — feature `index.ts` exports only the feature's public API
3. **Import type separately**: `import type { Task } from './types';`

---

### Testing

> Test naming/conventions/pyramid in `testing-strategy.md`. Below: TS-specific tooling.

1. **Type your mocks with Vitest types** — never `as any` in test doubles
   ```typescript
   import { vi } from 'vitest';
   import type { MockedObject } from 'vitest';
   const mockStore: MockedObject<TaskStore> = { create: vi.fn(), getById: vi.fn() };
   ```
2. **Assert on error types, not just messages**: `await expect(...).rejects.toThrow(ZodError);`
3. **Use `satisfies` in tests** for type-checked fixtures

---

### Formatting and Static Analysis

| Tool | Purpose | Notes |
| --- | --- | --- |
| `vue-tsc --noEmit` | Full type checking (incl. `.vue`) | Zero errors; use `tsc --noEmit` for non-Vue |
| `eslint` | Lint + style | `@typescript-eslint/recommended-type-checked` |
| `prettier` | Canonical formatting | Non-negotiable |
| `npm/pnpm audit` | Dependency CVE scanning | Run in CI; fail on high severity |

See `code-completion-mandate.md` for exact commands.

---

### Related Principles
- Code Idioms and Conventions @code-idioms-and-conventions.md
- Vue Idioms and Patterns @vue-idioms-and-patterns.md
- Testing Strategy @testing-strategy.md
- Error Handling Principles @error-handling-principles.md
- Concurrency and Threading Mandate @concurrency-and-threading-mandate.md
- Security Principles @security-principles.md
- Dependency Management Principles @dependency-management-principles.md
