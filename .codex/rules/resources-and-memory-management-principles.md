## Resource and Memory Management Principles

### Universal Resource Management Rules

**1. Always Clean Up Resources**

**Resources requiring cleanup:** files, network/database connections, locks/semaphores/mutexes, memory allocations (manual-memory languages), OS handles, GPU resources.

**Clean up in ALL paths:** success, error (exception thrown / error returned), and early return (guard clauses, validation failures).

**Use language-appropriate patterns:** Go `defer`, Rust `Drop` (RAII), Python context managers (`with`), TypeScript `try/finally`, Java try-with-resources.

**2. Timeout All I/O Operations**

Network requests can hang indefinitely; timeouts prevent resource exhaustion (connections, threads) and provide predictable failure behavior.

**Recommendations:**
- Network requests: 30s default, 5–10s for interactive
- Database queries: 10s default, configure per query complexity
- File operations: usually fast, but timeout on network filesystems
- Message queue ops: configurable, avoid indefinite blocking

**3. Pool Expensive Resources**

**Pool:** database connections (5–20 per app instance), HTTP connections (keep-alive), thread pools (size by CPU count for CPU-bound, by I/O wait for I/O-bound).

**Benefits:** lower latency (no connection setup), capped resource consumption, higher throughput.

**Connection pool best practices:**
- Min connections: 5 (warm pool)
- Max connections: 20–50 (don't overwhelm DB)
- Idle timeout: close connections idle >5–10 minutes
- Validation: test connections before use
- Monitor: utilization, wait times, timeout rates

**4. Avoid Resource Leaks**

**Leak:** acquire resource → never release → eventually exhaust (OOM, max connections, file descriptors).

**Detection:** monitor open file descriptors / connection counts / memory over time; long-duration tests; leak detection tools (valgrind, ASan, heap profilers).

**Prevention:** use language patterns that guarantee cleanup (RAII, defer, context managers); never rely on manual cleanup alone.

**5. Handle Backpressure**

**Problem:** producer faster than consumer → unbounded queue growth → memory exhaustion / unresponsiveness.

**Solutions:** bounded queues (block or reject when full), rate limiting, flow control (consumer signals producer), circuit breakers, drop/reject (fail fast beats crash).

### Memory Management by Language Type

**Garbage Collected (Go, Java, Python, JavaScript, C#):** memory auto-freed; still must release non-memory resources (files, connections, locks); be aware of GC pauses in latency-sensitive apps; profile to find leaks (retained references).

**Manual (C, C++):** explicit malloc/free or new/delete; use RAII in C++; prefer smart pointers (`unique_ptr`, `shared_ptr`) over manual management.

**Ownership-Based (Rust):** compiler-enforced safety; no GC pauses, no manual management; ownership prevents leaks and use-after-free; use `Arc`/`Rc` for shared ownership.

### Related Principles
- Concurrency and Threading Mandate concurrency-and-threading-mandate.md
- Concurrency and Threading Principles concurrency-and-threading-principles.md
- Error Handling Principles error-handling-principles.md - Resource cleanup in error paths
