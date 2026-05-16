# Frontend Design Skill

Guides creation of **distinctive, production-grade frontend interfaces** that avoid generic "AI slop". Follow the phased workflow — each phase has concrete reference material.

---

## Phased Workflow

### Phase 1: Design Direction

**Context questions:**
- What problem does this interface solve? Who uses it?
- What's the one thing someone will remember about this design?
- What aesthetic direction fits? (Choose ONE — don't blend randomly)

**Aesthetic directions (pick one):** Brutally minimal · Maximalist chaos · Retro-futuristic · Organic/natural · Luxury/refined · Playful/toy-like · Editorial/magazine · Brutalist/raw · Art deco/geometric · Soft/pastel · Industrial/utilitarian · Sci-fi/cyberpunk

**CRITICAL:** Every generation makes a fresh choice. Never default twice. Vary themes/fonts/palettes.

**Deliverables:**
- ✓ Named aesthetic direction (e.g., "editorial luxury, dark theme")
- ✓ Font pairing from `references/typography.md`
- ✓ Color palette from `references/color-palettes.md`
- ✓ Layout composition(s) from `references/layout-compositions.md`

---

### Phase 2: Token System

1. Copy `examples/design-tokens.css` into project
2. Override palette primitives with chosen palette HSL values
3. Override `--font-display` and `--font-body` with chosen fonts
4. Add Google Fonts `@import` to `<head>` (with preconnect hints)

```html
<!-- Always preconnect BEFORE the font stylesheet -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="[your @import from typography.md]">
```

**Deliverables:**
- ✓ `design-tokens.css` in place with chosen palette/fonts
- ✓ All colors, spacing, typography, shadows, motion as CSS variables
- ✓ No hardcoded color values or magic numbers in component code

---

### Phase 3: Build

| Target | Module |
|---|---|
| Vue 3 (`<script setup>`) | `frameworks/vue.md` |
| HTML + Vanilla CSS/JS | `frameworks/html-css.md` |

**Build principles:**
- Implement components from chosen layout compositions
- Apply motion from `references/motion-patterns.md` at high-impact moments: page load, scroll reveals, hover
- Use only `transform` and `opacity` for animations — never `width`, `height`, `top`, `left`
- Every interactive element needs hover AND focus-visible states
- Stagger entrance animations for groups (cards, lists)

**Mobile responsive (load `references/mobile-responsive.md`):**
- Mobile-first CSS: base styles for phone, `min-width` queries for larger
- Tap targets ≥ 44×44px (`min-height: 44px; min-width: 44px`)
- Use `100svh` not `100vh` (iOS Safari)
- Add `env(safe-area-inset-*)` padding on fixed bottom elements
- Test at 375px, 768px, 1280px minimum

**PWA readiness (load `references/pwa-checklist.md` for production apps):**
- `manifest.json` with `name`, `icons` (192 + 512 + maskable), `theme_color`
- PWA meta tags in `<head>` (theme-color, apple-mobile-web-app-capable, apple-touch-icon)
- Service worker with appropriate caching strategy
- Offline fallback page (`offline.html`)
- Vite projects: prefer `vite-plugin-pwa` over manual SW

---

### Phase 4: Polish & Verify

**Visual polish checklist:**
- [ ] Typography: display and body fonts visually distinct and harmonious?
- [ ] Color: palette cohesive? Accents draw eye correctly?
- [ ] Spacing: breathing room between sections? (min `--space-20` between major sections)
- [ ] Motion: page feels alive on load? Hover states immediate and satisfying?
- [ ] Backgrounds: depth/texture/gradient — not flat color?
- [ ] Responsive: looks great at 375/768/1280px? No horizontal overflow?
- [ ] Touch: all targets ≥ 44px? Mobile nav works?
- [ ] PWA (if applicable): Lighthouse PWA 100? Offline fallback works?

**Accessibility verification:**
```bash
bash .codex/skills/frontend-design/scripts/visual-audit.sh http://localhost:[port]
```

The audit checks: color contrast (WCAG AA 4.5:1), missing alt/accessible names/ARIA, skip link, semantic heading structure (one `<h1>`), font loading (CLS), `prefers-reduced-motion` override.

**Fix all CRITICAL issues before marking complete.** Warnings acceptable if documented.

---

## Anti-Pattern Catalog

| Anti-Pattern | What It Looks Like | Fix |
|---|---|---|
| **Gradient Soup** | Purple-to-blue gradient on white cards everywhere | One deliberate gradient for ONE element. Source from `color-palettes.md`. |
| **Font Stack Collapse** | Entire page in Inter/Roboto/system | Pick a pairing from `typography.md`. 2 distinct fonts with display/body roles. |
| **Shadow Boxing** | `box-shadow: 0 4px 6px rgba(0,0,0,0.1)` everywhere | `--shadow-sm` resting, `--shadow-md` hover. Never same shadow everywhere. |
| **Animation Scatter** | `transition: all 0.3s ease` on dozens of elements | `--transition-all-interactions` only for interactive. Apply entrance animations sparingly. |
| **Whitespace Desert** | Cramped 16px gaps everywhere | Section padding min `--space-16`. Hero min `100svh`. Let content breathe. |
| **Button Rainbow** | 5 button colors on one page | One `--primary`, one `--secondary`, one `--ghost`. |
| **Flat Backgrounds** | Solid `#1a1a2e` with nothing else | Add texture: gradient mesh, noise overlay, subtle pattern, layered radial gradient. |
| **Generic Layout** | Centered content, full-width rows, constant padding | Use a layout composition. Break the grid deliberately. |
| **Hover Nothing** | No state change on hover | Every card/button/link needs hover. Min: color change. Better: lift + shadow. |
| **One-Size Typography** | Body text size for everything | Use full type scale. Hero `--text-hero`, headings `--text-3xl`, body `--text-base`. |
| **Desktop-First CSS** | `max-width` breakpoints everywhere, mobile breaks | Mobile-first base, layer up with `min-width`. |
| **Tiny Tap Targets** | 24px buttons, links no padding on mobile | Min 44×44px. Expand with padding or `::after`. |

---

## Reference Modules

| Module | When to Load |
|---|---|
| `references/typography.md` | Choosing fonts — 30 curated pairings |
| `references/color-palettes.md` | Choosing colors — 15 named palettes, light + dark |
| `references/motion-patterns.md` | Animations — entrance, hover, scroll, micro |
| `references/layout-compositions.md` | Structuring pages — 15 named compositions |
| `references/mobile-responsive.md` | Mobile-first, touch targets, viewport units, navigation |
| `references/pwa-checklist.md` | Manifest, service worker, offline, install, Lighthouse |
| `frameworks/vue.md` | Building in Vue 3 |
| `frameworks/html-css.md` | Building in HTML/CSS |
| `examples/design-tokens.css` | Starting a token system |

---

## Rule Compliance

Before marking complete, verify:
- **Project Structure** — `project-structure.md`
- **Testing** — `testing-strategy.md`
- **Security** — XSS prevention, no `innerHTML` with unescaped user data (`security-principles.md`)
- **Accessibility** — WCAG AA contrast, keyboard nav, semantic HTML (`accessibility-principles.md`)
- **Audit script** — visual-audit.sh passes with no CRITICAL failures

**IMPORTANT:** Implementation complexity must match aesthetic vision. Maximalist requires elaborate animation; minimalist requires meticulous spacing. Both fail without care.
