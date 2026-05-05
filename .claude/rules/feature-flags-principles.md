## Feature Flags Principles

> [!CAUTION]
> **Do NOT implement feature flags unless explicitly required.** They add real operational complexity (flag infrastructure, lifecycle management, multiplicative test permutations).
>
> Only introduce feature flags when the **PRD** or **technical architecture document** explicitly specifies one of:
> - Gradual / percentage rollout of a risky feature
> - A/B testing or experimentation
> - Emergency kill switches for production code paths
> - Feature entitlement gating by user tier or permission
>
> If none of these are specified, deploy code directly. Do not introduce flags speculatively.

### When to Use Feature Flags

Feature flags decouple **deployment** from **release** — code ships to production but stays dormant until the flag enables it.

| Use case | Flag type | Example |
|----------|-----------|---------|
| Gradual rollout | Release flag | `new-checkout-flow: 0→5→25→100%` |
| Emergency kill switch | Ops flag | `use-legacy-payment-provider` |
| A/B test / experiment | Experiment flag | `button-color-blue-vs-green` |
| Tier / permission gating | Permission flag | `pro-tier-analytics` |

### Infrastructure Requirements

> [!IMPORTANT]
> The flag evaluation backend **must be specified in the technical architecture document** before implementation. Do NOT choose a provider independently — ask the user.

| Approach | When to use | Notes |
|----------|-------------|-------|
| **Managed SaaS** | Teams > 5, multi-environment, complex targeting | LaunchDarkly, Flagsmith, Unleash Cloud |
| **Self-hosted** | Full control, no SaaS dependency | Unleash (OSS), Flagsmith (OSS) |
| **Firebase Remote Config** | Mobile apps in the Firebase ecosystem | Firebase SDK required |
| **Static config (YAML / env)** | Solo dev, simple on/off, single environment | Loaded at startup; no runtime targeting |

Flag configuration is infrastructure — provision before code references it.

### Flag Evaluation Rules

- **Evaluate server-side** for security-sensitive features (never trust the client)
- **Evaluate at request boundary** — never inside pure business logic functions
- **Default to disabled** — if the flag service is unreachable, the flag is off (fail closed)
- **Wrap flag checks once** — in a service method or middleware, not scattered

```go
// ✅ Flag evaluation at the boundary (handler/service entry point)
func (s *Service) CreateOrder(ctx context.Context, req Request) (Response, error) {
    if s.flags.IsEnabled(ctx, "new-pricing-engine", req.UserID) {
        return s.handleWithNewPricing(ctx, req)
    }
    return s.handleWithLegacyPricing(ctx, req)
}

// ❌ Flag evaluation buried inside business logic — NO
func calculateDiscount(items []Item) float64 {
    if flags.IsEnabled("new-discount-rules") { ... }
}
```

### Flag Lifecycle Rules

Flags are temporary by design. Flag debt accumulates fast.

- Every flag **must have an owner**
- Every **release flag** has a **maximum lifespan of 90 days**
- When a release flag reaches 100% rollout, **create a removal ticket immediately**
- **Ops (kill switch) flags** can be permanent but must be documented as such
- **Experiment flags** must be removed when the experiment concludes
- Review all flags in sprint planning — any flag past expiry is tech debt

### Testing with Feature Flags

- Unit tests test **each branch independently** (flag on + flag off)
- Integration tests default the flag to its **production-expected state**
- Do not enumerate every possible flag combination
- Use a test-only override mechanism (e.g., `flags.Override(ctx, "flag", true)`) — never branch test logic on env vars

### CI/CD Checklist (Feature Flags)

- [ ] Flag infrastructure specified in technical architecture document?
- [ ] Flag backend provisioned and accessible by the application?
- [ ] Every flag has an owner and expiry date set?
- [ ] Flag evaluation is server-side for security-sensitive paths?
- [ ] Default state is `disabled` (fail closed)?
- [ ] Unit tests cover both flag-on and flag-off code paths?
- [ ] Removal ticket created once flag reaches 100% rollout?

### Related Principles
- CI/CD Principles ci-cd-principles.md (deployment vs release concept)
- Architectural Patterns — Testability-First Design architectural-pattern.md
- Core Design Principles core-design-principles.md (YAGNI)
- Security Mandate security-mandate.md (server-side evaluation)
