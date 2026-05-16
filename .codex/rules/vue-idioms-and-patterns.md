## Vue Idioms and Patterns

### Core Philosophy

Vue 3 Composition API is the default. `<script setup>` is the canonical syntax. Think in reactive *data flows*, not lifecycle hooks. Composables (`use*`) are the primary unit of logic reuse.

> **Scope:** Vue 3 *coding idioms*. TS types: `typescript-idioms-and-patterns.md`. Layout: `project-structure-vue-frontend.md`. Test naming: `testing-strategy.md`. Logging: `logging-and-observability-principles.md`.

---

### `<script setup>` — The Only Style

Always use `<script setup lang="ts">`. Never use Options API or class-style for new code.

```vue
<!-- ✅ Canonical -->
<script setup lang="ts">
const props = defineProps<{ title: string; count?: number }>();
const emit = defineEmits<{ 'update:count': [value: number] }>();
const doubled = computed(() => (props.count ?? 0) * 2);
</script>
<!-- ❌ Options API: export default { props: { title: String } } -->
```

---

### Reactivity: `ref` vs `reactive`

| Use          | When                                                                               |
| ------------ | ---------------------------------------------------------------------------------- |
| `ref<T>()`   | Primitives, single values, values that may be reassigned                           |
| `reactive()` | Plain objects where you always access properties (never reassign the whole object) |
| `readonly()` | Expose state that must not be mutated outside its owner                            |

```typescript
// ✅ ref for primitives/replaceable
const user = ref<User | null>(null);
user.value = fetchedUser;
// ✅ reactive for objects accessed by property
const form = reactive({ title: '', priority: 'medium' });
// ❌ Destructuring reactive loses reactivity
const { title } = form;
// ✅ Use toRefs if you must destructure
const { title } = toRefs(form);
```

---

### Computed Properties

1. **Use `computed` for all derived state** — never recompute in template
   ```typescript
   // ✅
   const filteredTasks = computed(() => tasks.value.filter(t => t.status === activeFilter.value));
   // ❌ <template>{{ tasks.filter(...) }}</template>
   ```
2. **Never cause side effects inside `computed`** — must be pure
3. **Use writable computed for two-way bindings**
   ```typescript
   const modelValue = computed({ get: () => props.modelValue, set: v => emit('update:modelValue', v) });
   ```

---

### Watch Strategy

Use the most precise watcher — over-watching is a perf/correctness problem.

| Watcher       | Use When                                                                                                  |
| ------------- | --------------------------------------------------------------------------------------------------------- |
| `watchEffect` | Side effect re-run whenever any reactive dep changes; auto-tracks deps                                    |
| `watch`       | Need old value, lazy execution, or explicit source                                                         |
| `computed`    | Synchronous derived value (prefer over `watch` for transformation)                                         |

```typescript
// ✅ watchEffect — auto-tracks
watchEffect(() => { document.title = `Tasks (${count.value})`; });
// ✅ watch — explicit, has old value
watch(userId, async (newId, oldId) => { if (newId !== oldId) await loadUser(newId); }, { immediate: true });
// ❌ Don't use watch for derived values — use computed
```

---

### Pinia Stores

> Layout: `project-structure-vue-frontend.md`.

1. **Use Setup Store API** (not Options API) for new stores
   ```typescript
   export const useTaskStore = defineStore('task', () => {
       const tasks = ref<Task[]>([]);
       const isLoading = ref(false);
       const completedTasks = computed(() => tasks.value.filter(t => t.status === 'done'));
       async function loadTasks() {
           isLoading.value = true;
           try { tasks.value = await taskAPI.getTasks(); }
           finally { isLoading.value = false; }
       }
       return { tasks, isLoading, completedTasks, loadTasks };
   });
   ```

2. **Never mutate store state from outside the store**
   ```typescript
   // ❌ store.tasks.push(newTask);
   // ✅ await store.addTask(newTask);
   ```

3. **Inject the API dependency** — never import directly inside the store
   ```typescript
   const api = inject<TaskAPI>(TASK_API_KEY);
   if (!api) throw new Error('[TaskStore] TASK_API_KEY not provided');
   ```

4. **Use `storeToRefs` when destructuring a store in components** — preserves reactivity
   ```typescript
   const { tasks, isLoading } = storeToRefs(useTaskStore());
   const { loadTasks } = useTaskStore(); // actions don't need storeToRefs
   ```

---

### Composables (`use*` Functions)

1. **Naming: always prefix with `use`** — `useTaskFilters`, `useAuth`, `usePagination`
2. **Return reactive refs, not raw values**
   ```typescript
   // ✅
   function useCounter(initial = 0) {
       const count = ref(initial);
       return { count, increment: () => count.value++ };
   }
   // ❌ let count = 0; return { count }; — not reactive
   ```
3. **Always clean up side effects in `onUnmounted`**
   ```typescript
   onMounted(() => window.addEventListener('resize', handler));
   onUnmounted(() => window.removeEventListener('resize', handler));
   ```
4. **Template refs with `useTemplateRef` (Vue 3.5+)** — type-safe replacement for `ref(null)`
   ```typescript
   // ✅ const inputEl = useTemplateRef<HTMLInputElement>('myInput');
   // ❌ const inputEl = ref<HTMLInputElement | null>(null);
   ```
5. **Feature-specific composables live inside the feature** — global ones in `src/composables/`

---

### Component Design

1. **`defineProps` with TS generics** — no runtime validators for typed props
   ```typescript
   const props = withDefaults(defineProps<{ variant?: 'compact' | 'full' }>(), { variant: 'full' });
   ```
2. **`defineEmits` with typed event signatures**
   ```typescript
   const emit = defineEmits<{ 'update:modelValue': [value: string]; 'submit': [task: CreateTaskRequest] }>();
   ```
3. **`v-model` contract: always `modelValue` prop + `update:modelValue` emit**
4. **`defineExpose` for intentional parent access only** — `<script setup>` is private by default
   ```typescript
   defineExpose({ reset, focus });
   ```
5. **`v-bind="$attrs"` + `inheritAttrs: false` to forward HTML attributes** to the root element
6. **One concern per component** — extract sub-component if template > 100 lines (excluding boilerplate)
7. **Never put business logic in the template** — use computed/composables in `<script setup>`

---

### Template Patterns

1. **Always bind `:key` with stable, unique IDs in `v-for`** — never use index when order can change
   ```html
   <!-- ✅ --> <TaskCard v-for="task in tasks" :key="task.id" :task="task" />
   <!-- ❌ --> <TaskCard v-for="(task, i) in tasks" :key="i" :task="task" />
   ```
2. **Never combine `v-if` and `v-for` on the same element** — wrap with `<template>`
   ```html
   <template v-for="task in tasks" :key="task.id">
       <TaskCard v-if="task.visible" :task="task" />
   </template>
   ```

---

### Route Transitions

`@layer`-based CSS frameworks (Tailwind v4, Open Props, UnoCSS) can override transition properties in the cascade, causing `transitionend` to never fire and permanently blocking the entering component.

1. **Avoid `mode="out-in"` with `@layer` CSS frameworks** — use simultaneous transitions
   ```html
   <!-- ❌ Dangerous --> <Transition name="fade" mode="out-in"><component :is="Component" /></Transition>
   <!-- ✅ Safe --> <Transition name="fade"><component :is="Component" :key="$route.path" /></Transition>
   ```
2. **Always bind `:key="$route.path"`** on dynamic `<component>` inside `<Transition>` — forces distinct instances
3. **Use `!important` on route transition CSS classes** — wins the `@layer` cascade
   ```css
   .fade-enter-active { transition: opacity 0.15s ease-in !important; }
   .fade-leave-active { transition: opacity 0.15s ease-out !important; position: absolute !important; width: 100% !important; top: 0 !important; left: 0 !important; }
   .fade-enter-from, .fade-leave-to { opacity: 0 !important; }
   ```
4. **Give the transition parent `position: relative`** — contains the absolutely-positioned leaving element

> Diagnosis: Debugging Protocol [Frontend module](.codex/skills/debugging-protocol/languages/frontend.md) § CSS × Animation.

---

### Testing

> See `testing-strategy.md` for naming/proportions.

1. **Use `createTestingPinia` to stub stores in component tests**
   ```typescript
   const wrapper = mount(TaskView, { global: { plugins: [createTestingPinia({ createSpy: vi.fn })] } });
   ```
2. **Test component behaviour, not implementation** — query by accessible role, not CSS class
3. **Test stores independently** — `setActivePinia(createPinia())` in store unit tests

---

### Linting and Type Checking

| Tool                | Purpose                     |
| ------------------- | --------------------------- |
| `vue-tsc --noEmit`  | Full-template type checking |
| `eslint-plugin-vue` | Vue-specific lint rules     |
| `prettier`          | Canonical formatting        |

See `code-completion-mandate.md` for exact commands.

---

### Related Principles
- Code Idioms and Conventions code-idioms-and-conventions.md
- TypeScript Idioms and Patterns typescript-idioms-and-patterns.md
- Project Structure — Vue Frontend project-structure-vue-frontend.md
- Architectural Patterns — Testability-First Design architectural-pattern.md
- Testing Strategy testing-strategy.md
- Logging and Observability Principles logging-and-observability-principles.md
