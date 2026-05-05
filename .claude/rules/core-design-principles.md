## Core Design Principles

### SOLID Principles

**Single Responsibility (SRP):** Each class/module/function has ONE reason to change. If explaining it requires "and", it likely violates SRP.

**Open/Closed (OCP):** Open for extension, closed for modification. Use abstractions (interfaces, ports) + composition + DI to enable extensibility without modifying existing code.

**Liskov Substitution (LSP):** Subtypes must be substitutable for base types without altering correctness. Inheritance hierarchies must maintain behavioral consistency.

**Interface Segregation (ISP):** Clients shouldn't depend on interfaces they don't use. Many small, role-specific interfaces > one large monolithic one.

**Dependency Inversion (DIP):** Depend on abstractions, not concretions. High-level modules and low-level modules both depend on abstractions. Core enabler of Testability-First architecture.

### Essential Design Practices

**DRY (Don't Repeat Yourself):** Eliminate duplication via abstraction, shared utilities, composable functions. Each piece of knowledge has a single authoritative representation. Don't duplicate logic, algorithms, or business rules.

**YAGNI (You Aren't Gonna Need It):**
**CRITICAL:** Code maintainability always prevails.
- Avoid implementing functionality before required
- Don't add features based on speculation
- Build for today's requirements, refactor when needs change

**KISS (Keep It Simple, Stupid):**
**CRITICAL:** Code maintainability always prevails.
- Prefer simple, straightforward solutions over complex/clever ones
- Complexity must be justified by actual requirements, not theoretical flexibility
- Simple code is easier to test, maintain, debug

**Separation of Concerns:** Divide functionality into distinct sections with minimal overlap. Each concern isolated in its own module/layer.

**Composition Over Inheritance:** Favor composition + delegation over class inheritance. More flexible, easier to test. Use interfaces/traits for polymorphism instead of deep hierarchies.

**Principle of Least Astonishment:** Code behaves as users/maintainers expect. Avoid surprising behavior. Follow established conventions.

**User Experience vs Maintainability:**
- Both matter. When they conflict, **prefer maintainable code** that can evolve.
- Poor UX from clean code can be fixed; poor code from UX pressure becomes tech debt.
- Maintainability enables future UX improvements.
- Never sacrifice code quality for short-term UX gains.

### Related Principles
- Architectural Patterns — Testability-First Design @architectural-pattern.md
- Code Organization Principles @code-organization-principles.md
- Documentation Principles @documentation-principles.md
- Accessibility Principles @accessibility-principles.md
