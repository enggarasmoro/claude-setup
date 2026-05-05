## Flutter Idioms and Patterns (Riverpod 3)

### Core Philosophy

Flutter is a UI toolkit first — performance is a first-class concern. `const` widgets and immutable data keep the render tree efficient. **Riverpod 3** is the canonical state management: compile-safe, testable without `BuildContext`, no implicit global state, automatic retry and pause/resume built in.

**Code generation is mandatory.** All providers use `@riverpod` / `@Riverpod(keepAlive: true)` with `riverpod_generator` and `build_runner`.

**Required dependencies:**

```yaml
# pubspec.yaml
dependencies:
  flutter_riverpod: 3.2.1
  riverpod_annotation: 4.0.2
dev_dependencies:
  riverpod_generator: 4.0.3
  build_runner: # latest
  riverpod_lint: # latest
```

> **Scope:** Flutter/Dart coding idioms. Layout: `project-structure-flutter-mobile.md`. Tests: `testing-strategy.md`. Errors: `error-handling-principles.md`.

---

### `const` Constructors — Everywhere

`const` widgets are created once and not rebuilt unless inputs change — Flutter's most impactful perf optimization.

```dart
// ✅
class TaskCard extends StatelessWidget {
    const TaskCard({super.key, required this.task});
    final Task task;
}
const TaskCard(task: myTask)

// ❌ Missing const — rebuilt on every parent rebuild
TaskCard(task: myTask)
```

**Rules:**
- Every `StatelessWidget` without mutable state MUST have a `const` constructor
- Pass `const` at the call site, not just the definition
- `prefer_const_constructors` lint must be enabled

---

### Widget Decomposition

**Rules:**
1. Extract a new widget when a subtree has distinct responsibilities — use `const` sub-widgets
2. NEVER use `_buildHeader()` builder methods as a substitute — they don't benefit from `const` and rerun on every parent rebuild
3. Keep `build` methods under ~30 lines

---

### Immutable Data with `freezed`

All domain models must be immutable. Use `freezed` for value objects (`copyWith`), union/sealed states, generated `==`/`hashCode`/`toString`.

```dart
@freezed
class Task with _$Task {
    const factory Task({
        required String id,
        required String title,
        @Default(TaskStatus.pending) TaskStatus status,
        DateTime? dueDate,
    }) = _Task;
    factory Task.fromJson(Map<String, dynamic> json) => _$TaskFromJson(json);
}
final updated = task.copyWith(status: TaskStatus.done);
```

**Rules:** all domain models use `@freezed`; never expose mutable fields; run `dart run build_runner build` after changes.

---

### Provider Decision Tree

| Has side-effects? | Async? | Pattern | Generated type |
|---|---|---|---|
| No | No | `@riverpod` function | `Provider` |
| No | Yes | `@riverpod` async function | `FutureProvider` |
| No | Stream | `@riverpod` Stream function | `StreamProvider` |
| Yes | No | `@riverpod` class (Notifier) | `NotifierProvider` |
| Yes | Yes | `@riverpod` class (Future build) | `AsyncNotifierProvider` |
| Yes | Stream | `@riverpod` class (Stream build) | `StreamNotifierProvider` |

Top-to-bottom — first match wins.

---

### Riverpod — State Management

**Riverpod 3 is the only state management.** Do not introduce BLoC, Cubit, package:provider, or GetX.

#### App Entry — `ProviderScope`

```dart
void main() => runApp(const ProviderScope(child: MyApp()));
```

**Rules:** exactly one `ProviderScope` at the app root (never nest); `overrides:` only in tests; configure `retry:` at the root scope.

#### Class-Based Providers (Side-Effects)

```dart
@riverpod
class TaskList extends _$TaskList {
    @override
    Future<List<Task>> build() async => ref.watch(taskRepositoryProvider).getTasks();

    Future<void> addTask(CreateTaskRequest request) async {
        state = const AsyncLoading();
        state = await AsyncValue.guard(() async {
            final repo = ref.read(taskRepositoryProvider);
            await repo.createTask(request);
            if (!ref.mounted) return state.requireValue; // REQUIRED after await
            return repo.getTasks();
        });
    }
}
```

#### Functional Providers (Read-Only / Computed)

```dart
@riverpod
List<Task> filteredTasks(Ref ref) {
    final tasks = ref.watch(taskListProvider).valueOrNull ?? [];
    final filter = ref.watch(taskFilterProvider);
    return tasks.where((t) => filter.matches(t)).toList();
}

@riverpod
Stream<List<Task>> taskStream(Ref ref) => ref.watch(taskRepositoryProvider).watchAll();
```

**Family providers (parameterized):** any number of params (named, optional, defaults). Each unique arg combo = independent instance with own cache/disposal. All params must implement `==`/`hashCode`.

```dart
@riverpod
Future<List<Task>> projectTasks(Ref ref, String projectId, {TaskStatus? status}) async =>
    ref.watch(taskRepositoryProvider).getByProject(projectId, status: status);
```

#### `ref.watch` vs `ref.read`

```dart
// ✅ ref.watch — subscribes; use in build()
final tasks = ref.watch(taskListProvider);

// ✅ ref.read — one-shot; use in handlers / notifier actions
await ref.read(taskListProvider.notifier).addTask(request);

// ❌ Never ref.watch inside async functions or event handlers
```

#### `Ref.mounted` — Mandatory After Awaits

Riverpod 3 throws if you interact with a disposed `Ref`/`Notifier`. **Always check `ref.mounted` after every `await` in a notifier.**

```dart
Future<void> updateTask(Task task) async {
    final repo = ref.read(taskRepositoryProvider);
    await repo.update(task);
    if (!ref.mounted) return;
    state = await AsyncValue.guard(() => repo.getTasks());
}
```

#### Auto-Dispose and `keepAlive`

`autoDispose` is the default with `@riverpod`. Opt into `keepAlive` for app-wide, long-lived state (auth, repositories).

```dart
@Riverpod(keepAlive: true)
TaskRepository taskRepository(Ref ref) =>
    TaskRepositoryImpl(apiClient: ref.watch(apiClientProvider));
```

**Rules:**
- ❌ Never `keepAlive: false` (it's the default)
- ❌ Never `keepAlive: true` for screen-scoped state
- Repositories should be `keepAlive: true`

#### Repository Interface Pattern (Testability-First)

All data access goes through an abstract repository interface.

```dart
abstract class TaskRepository {
    Future<List<Task>> getTasks();
    Future<Task> getById(String id);
    Future<void> createTask(CreateTaskRequest request);
    Future<void> deleteTask(String id);
}

class TaskRepositoryImpl implements TaskRepository {
    const TaskRepositoryImpl({required this.apiClient});
    final ApiClient apiClient;
    @override
    Future<List<Task>> getTasks() async {
        final response = await apiClient.get('/tasks');
        return (response.data as List)
            .map((e) => Task.fromJson(e as Map<String, dynamic>)).toList();
    }
    // getById/createTask/deleteTask follow the same pattern
}

class MockTaskRepository implements TaskRepository {
    final List<Task> _tasks = [];
    @override Future<List<Task>> getTasks() async => List.unmodifiable(_tasks);
    // ...
}
// Test override: taskRepositoryProvider.overrideWith((_) => MockTaskRepository())
```

#### ConsumerWidget vs ConsumerStatefulWidget

Prefer `ConsumerWidget`. Use `ConsumerStatefulWidget` only when local widget state + Riverpod is needed.

```dart
class TaskListView extends ConsumerWidget {
    const TaskListView({super.key});
    @override
    Widget build(BuildContext context, WidgetRef ref) {
        return ref.watch(taskListProvider).when(
            data: (tasks) => TaskListBody(tasks: tasks),
            loading: () => const LoadingIndicator(),
            error: (e, _) => ErrorView(error: e),
        );
    }
}
```

---

### Riverpod 3 — Runtime Behaviors

**Automatic Retry:** providers that throw auto-retry with exponential backoff. Disable for non-idempotent writes / non-transient failures.

```dart
@Riverpod(retry: null)
Future<Config> appConfig(Ref ref) async => ref.watch(configRepositoryProvider).load();
// Globally: ProviderScope(retry: (_, __) => null, child: const MyApp())
```

**Rules:** leave enabled for network/IO; disable for non-idempotent writes / validation errors.

**Pause / Resume:** listeners pause when consuming widget is not visible; resume when re-visible. Automatic.

**`ProviderException` Wrapping:** failed provider reads throw `ProviderException` wrapping the original error.

```dart
try {
    final value = container.read(myProvider);
} on ProviderException catch (e) {
    // e.exception = original error; e.provider = which provider failed
}
expect(() => container.read(myProvider), throwsA(isA<ProviderException>()));
```

**State Change Detection:** uses `==` (not `identical`). `freezed` works out of the box. Custom models MUST implement `==`/`hashCode` or use `freezed`. Override `updateShouldNotify` for custom comparison.

---

### Async Patterns

1. **Always handle all three `AsyncValue` states**
   ```dart
   asyncValue.when(
       data: (data) => DataWidget(data: data),
       loading: () => const CircularProgressIndicator(),
       error: (err, stack) => ErrorText(err.toString()),
   );
   ```

2. **`when(error:...)` for exhaustive handling; `hasError` only for inline banners alongside stale data**

3. **Safe accessors:** `.valueOrNull` is safe. `.requireValue` throws if not loaded — use only after confirming state.

4. **Use `AsyncValue.guard` inside notifier actions** — auto-wraps exceptions in `AsyncError`.

5. **Use `StreamProvider` for real-time data** — never poll with `Timer`.

6. **Always check `ref.mounted` after `await`.**

7. **Force re-fetch with `ref.invalidate` / `ref.invalidateSelf()`**
   ```dart
   ref.invalidate(taskListProvider);   // from outside
   ref.invalidateSelf();               // inside a notifier (after !ref.mounted check)
   ```
   Use manual `AsyncValue.guard` only for optimistic UI; otherwise `invalidateSelf()`.

---

### Error Handling in Flutter/Riverpod

Use sealed classes (Dart 3+) for typed exceptions. Map infrastructure → domain exceptions inside notifier actions.

```dart
sealed class AppException implements Exception {
    const AppException(this.message);
    final String message;
    @override String toString() => message;
}
class NetworkException extends AppException {
    const NetworkException(super.message, {this.statusCode});
    final int? statusCode;
}
class ValidationException extends AppException {
    const ValidationException(super.message, {required this.field});
    final String field;
}
class NotFoundException extends AppException {
    const NotFoundException(super.message);
}

// ✅ Map infrastructure → domain inside notifier actions
state = await AsyncValue.guard(() async {
    try {
        await repo.createTask(request);
        if (!ref.mounted) return state.requireValue;
        return repo.getTasks();
    } on DioException catch (e) {
        throw NetworkException('Failed: ${e.message}', statusCode: e.response?.statusCode);
    }
});

// ✅ Exhaustive switch on sealed class in UI
error: (error, _) => switch (error) {
    NetworkException() => ErrorView(message: 'Network: ${error.message}'),
    NotFoundException() => const ErrorView(message: 'Not found'),
    _ => ErrorView(message: 'Unexpected: $error'),
},
```

**Rules:** all custom exceptions extend `AppException` (sealed); catch infrastructure exceptions and re-throw as domain; never expose infrastructure types to UI; use exhaustive `switch` on the sealed class.

---

### Navigation with `go_router`

`go_router` is the canonical navigation library.

```dart
@riverpod
GoRouter appRouter(Ref ref) => GoRouter(
    initialLocation: '/tasks',
    routes: [
        GoRoute(path: '/tasks', builder: (_, __) => const TaskListView()),
        GoRoute(path: '/tasks/:id',
            builder: (_, state) => TaskDetailView(id: state.pathParameters['id']!)),
    ],
);
context.go('/tasks/$taskId');
context.push('/tasks/new');
```

Navigate by path, never by widget reference. `!` is acceptable in route infrastructure (path param guaranteed by `:id`).

---

### Dart Language Idioms

1. **Null safety:** `?.`, `??`, `??=` — `final city = user?.address?.city ?? 'Unknown';`
2. **Use `late` only when `final` won't work** — `late` without initialization is unsafe
3. **Extension methods** for behaviour on types you don't own
4. **`switch` expressions (Dart 3+)** for exhaustive pattern matching
5. **Avoid `dynamic`** — Dart's equivalent of `any`

---

### Testing

> Naming and pyramid in `testing-strategy.md`.

**`ProviderContainer.test`** — auto-disposes after the test:

```dart
test('addTask updates state', () async {
    final container = ProviderContainer.test(overrides: [
        taskRepositoryProvider.overrideWith((_) => MockTaskRepository()),
    ]);
    await container.read(taskListProvider.notifier).addTask(request);
    expect(container.read(taskListProvider).value, hasLength(1));
});
```

**`overrideWithBuild`** — seed initial state, keep methods intact:

```dart
taskListProvider.overrideWithBuild((ref, notifier) =>
    Future.value([mockTask1, mockTask2])),
```

**Widget tests** with `ProviderScope`:

```dart
await tester.pumpWidget(ProviderScope(
    overrides: [taskRepositoryProvider.overrideWith((_) => MockTaskRepository())],
    child: const MaterialApp(home: TaskListView()),
));
```

**`mockito` with `@GenerateNiceMocks`:**

```dart
@GenerateNiceMocks([MockSpec<TaskRepository>()])
library;
import 'task_notifier_test.mocks.dart'; // generated
```

---

### Anti-Patterns — NEVER DO THIS

Every item below is a hard rule violation.

| ❌ Anti-Pattern | ✅ Correct |
|---|---|
| `StateProvider` | `@riverpod` class with `Notifier` |
| `StateNotifierProvider` | `@riverpod` class with `Notifier` |
| `ChangeNotifierProvider` | `@riverpod` class with `Notifier` |
| `import 'package:riverpod/legacy.dart'` | Never import legacy APIs |
| Typed ref subclass (`TaskDetailRef ref`) | `Ref ref` — single type in Riverpod 3 |
| `ref.watch` in async/event handler | `ref.read` for one-shot reads |
| Accessing `state`/`ref` after `await` without `ref.mounted` | Always check `ref.mounted` |
| `ProviderContainer()` + `addTearDown(container.dispose)` | `ProviderContainer.test(overrides: [...])` |
| `Timer.periodic` for polling | `StreamProvider` |
| `keepAlive: false` in annotation | Omit — false is the default |
| Manual providers without `@riverpod` | Always use code generation |
| Catching raw exceptions from provider reads | Catch `ProviderException` |
| `overrideWith((_) => MockNotifier())` for initial-state-only | `overrideWithBuild(...)` |

---

### Linting and Formatting

| Tool | Purpose |
| --- | --- |
| `dart format` | Canonical formatting |
| `flutter analyze` | Static analysis + lint |
| `riverpod_lint` | Riverpod-specific lints |
| `dart run build_runner build` | Generate provider code |

**Mandatory `analysis_options.yaml` (Dart 3+):**
```yaml
analyzer:
  language:
    strict-casts: true
    strict-raw-types: true
  errors:
    invalid_assignment: error
  plugins:
    - riverpod_lint
linter:
  rules:
    - prefer_const_constructors
    - prefer_const_declarations
    - avoid_dynamic_calls
    - avoid_print
    - use_super_parameters
```

**After any provider change:**
```bash
dart run build_runner build --delete-conflicting-outputs
flutter analyze
dart format .
```

**Active development — watch mode:**
```bash
dart run build_runner watch --delete-conflicting-outputs
```

---

### Related Principles
- Code Idioms and Conventions code-idioms-and-conventions.md
- Project Structure — Flutter Mobile project-structure-flutter-mobile.md
- Architectural Patterns — Testability-First Design architectural-pattern.md
- Testing Strategy testing-strategy.md
- Error Handling Principles error-handling-principles.md
- Dependency Management Principles dependency-management-principles.md
