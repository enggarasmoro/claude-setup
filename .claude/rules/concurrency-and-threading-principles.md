## Concurrency and Threading Principles

**1. Avoid Race Conditions**

**Race condition:** multiple threads access shared data concurrently, at least one writes, no synchronization → result depends on unpredictable timing.

**Prevention:** synchronization (locks, mutexes, semaphores); immutability (thread-safe by default); message passing; thread-local storage.

**Detection:** Go `-race` flag; Rust Miri; C/C++ ThreadSanitizer (TSan); Java JCStress / FindBugs.

**2. Prevent Deadlocks**

**Deadlock:** two+ threads waiting for each other indefinitely (A holds Lock 1, waits for Lock 2; B holds Lock 2, waits for Lock 1).

**Four conditions (ALL must hold):** mutual exclusion, hold and wait, no preemption, circular wait.

**Prevention (break any one):** lock ordering (always acquire in same order); `try_lock` with timeout + back off; avoid nested locks; use lock-free data structures.

**3. Prefer Immutability**

Immutable data is thread-safe by default — no synchronization needed. Share freely between threads. If data must change, use message passing instead of shared mutable state.

**4. Message Passing Over Shared Memory**

"Don't communicate by sharing memory; share memory by communicating" (Go proverb). Send data through channels/queues — reduces locks, easier to reason about and test.

**5. Graceful Degradation**

Handle concurrency errors gracefully (timeouts, retries, circuit breakers). Don't crash the whole app on one thread failure. Use supervisors/monitors for fault tolerance (Erlang/Elixir actor model). Implement backpressure for producer-consumer.

### Concurrency Models by Use Case

- **I/O-bound:** async/await, event loops, coroutines, green threads
- **CPU-bound:** OS threads, thread pools, parallel processing
- **Actor model:** Erlang/Elixir, Akka (message passing, isolated state)
- **CSP:** Go channels, Rust channels

### Testing Concurrent Code

- Unit tests with controlled, deterministic concurrency
- Test timeout scenarios and resource exhaustion
- Test thread pool full / queue full scenarios

### Related Principles
- Resource and Memory Management Principles resources-and-memory-management-principles.md
- Error Handling Principles error-handling-principles.md
- Testing Strategy testing-strategy.md
