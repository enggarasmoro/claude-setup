## CI/CD Principles

> **Agent scope:** This rule applies when writing CI/CD manifests (Dockerfile, docker-compose, GitHub Actions, GitLab CI, etc.). It is layered by deployment complexity — apply only the levels relevant to the project.

### Deployment Complexity Levels

| Level | Applies When | Key Additions |
|-------|-------------|---------------|
| **0 — All projects** | Always | Lint, test, security scan, secrets management |
| **1 — Containerized** | Docker image is the artifact | Multi-stage build, image scan, SBOM attestation |
| **2 — Orchestrated** | Kubernetes or managed container platform | Deployment strategies, GitOps |

Load supplementary rules when reaching Level 2 → **ci-cd-gitops-kubernetes.md**.

### Level 0 — Universal Pipeline Design

**Pipeline Stages (in order):**

1. **Lint** — static analysis, formatting checks
2. **Build** — compile, bundle, generate artifacts
3. **Unit Test** — fast tests with mocked dependencies
4. **Integration Test** — tests against real dependencies (Testcontainers)
5. **Security Scan** — dependency audit, SAST, secrets detection
6. **Deploy** — push to target environment

**Rules:**

- **Fail fast** — run cheapest checks first (lint before build, build before test)
- **Pipeline must be deterministic** — same input = same output, every time
- **Keep pipelines under 15 minutes** — optimize slow stages
- **Never skip failing steps** — fix the pipeline, don't bypass it
- **Build once, deploy many** — same artifact promotes through all environments

### Level 0 — Deploy Targets

The deploy stage varies by target; pipeline stages before it are identical.
- **Docker Compose:** `docker compose up --build`
- **Cloud Run:** `gcloud run deploy myapp --image gcr.io/project/myapp:$GIT_SHA --region us-central1`
- **Vercel:** `vercel deploy --prod`
- **Kubernetes:** Use GitOps — see **ci-cd-gitops-kubernetes.md**.

### Level 0 — Manifest Patterns

#### GitHub Actions

```yaml
name: CI
on: { push: { branches: [main] }, pull_request: { branches: [main] } }
jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-go@v5
        with: { go-version-file: go.mod, cache: true }
      - run: gofumpt -l -e -d .
      - run: go vet ./...
  test:
    needs: lint
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-go@v5
        with: { go-version-file: go.mod, cache: true }
      - run: go test -race -cover ./...
  security:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: trufflesecurity/trufflehog@v3
      - run: go run golang.org/x/vuln/cmd/govulncheck@latest ./...
```

**Rules:**
- Pin action versions (`@v4`, not `@latest` or `@main`)
- Use `needs:` to enforce stage ordering
- Cache dependencies (`cache: true` in setup actions)
- Use `go-version-file` / `node-version-file` instead of hardcoding versions
- Never put secrets in workflow files — use `${{ secrets.NAME }}`

### Level 1 — Containerized Projects

#### Dockerfile (Multi-Stage Build)

```dockerfile
FROM golang:1.22-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -o /bin/api ./cmd/api

FROM gcr.io/distroless/static-debian12
COPY --from=builder /bin/api /bin/api
EXPOSE 8080
CMD ["/bin/api"]
```

**Rules:**
- Always use multi-stage builds (build → runtime)
- Pin base image versions (never use `:latest`)
- Copy dependency files first, then source (layer caching)
- Use minimal runtime images (distroless, alpine, scratch)
- Never copy `.env`, secrets, or `.git` into images

#### Docker Compose (Local Development)

```yaml
services:
  backend:
    build: { context: ./apps/backend }
    ports: ["8080:8080"]
    env_file: .env
    depends_on: { postgres: { condition: service_healthy } }
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: ${DB_NAME}
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER}"]
      interval: 5s
      timeout: 5s
      retries: 5
    volumes: [pgdata:/var/lib/postgresql/data]
volumes: { pgdata: }
```

**Rules:**
- Always define health checks for dependencies
- Use `depends_on` with `condition: service_healthy`
- Pin all image versions
- Use volumes for persistent data
- Never hardcode credentials — use env_file or environment variables

#### Image Scan + SBOM Attestation

After building and pushing, scan and attach a signed SBOM. **Prefer Cosign keyless signing** (uses CI OIDC token; no key management; signature anchored to Rekor transparency log).

```yaml
build:
  needs: security
  permissions: { contents: read, packages: write, id-token: write }  # id-token for keyless
  steps:
    - uses: actions/checkout@v4
    - uses: sigstore/cosign-installer@v3
    - run: |
        docker build -t ghcr.io/${{ github.repository }}:${{ github.sha }} .
        docker push ghcr.io/${{ github.repository }}:${{ github.sha }}
    - run: trivy image --severity HIGH,CRITICAL --exit-code 1 ghcr.io/${{ github.repository }}:${{ github.sha }}
    - run: syft ghcr.io/${{ github.repository }}:${{ github.sha }} -o cyclonedx-json > sbom.json
    - run: cosign attest --predicate sbom.json --type cyclonedx ghcr.io/${{ github.repository }}:${{ github.sha }}
```

The SBOM attestation is stored as an OCI reference alongside the image digest — works on any OCI-compatible registry (ghcr.io, GAR, ECR, Docker Hub). Verify: `cosign verify-attestation --type cyclonedx ghcr.io/org/app@sha256:<digest>`.

**Use ORAS instead of Cosign** when attaching arbitrary supply chain artifacts (scan reports, provenance JSON) beyond Cosign's attestation model: `oras attach ghcr.io/org/app@sha256:<digest> scan-report.json`.

**Rules:**
- Prefer Cosign keyless signing — eliminates secret key management
- SBOM is attached to the image in the OCI registry — not stored as a CI artifact
- Scan BEFORE attesting — the SBOM reflects the scanned image
- For non-containerized apps (Vercel, Netlify), use `npm audit`/`yarn audit`; no SBOM attachment

### Deployment vs Release (Feature Flags)

Code deployment and feature release are separate concerns. When the PRD or technical architecture explicitly requires gradual rollout, A/B testing, or kill switches, feature flags can decouple them.

> **Agent rule:** Do NOT implement feature flags unless explicitly required by the PRD or technical architecture. See **feature-flags-principles.md**.

### Environment Promotion

`dev → staging → production`

- **Dev:** Deployed on every push to feature branch
- **Staging:** Deployed on merge to main/develop
- **Production:** Deployed via manual approval or automated release

**Rules:**
- Same artifacts promote through environments (build once, deploy many)
- Environment-specific config via environment variables, not build flags
- Never deploy directly to production without staging validation

### CI/CD Checklist

**Always (all projects):**
- [ ] Pipeline stages run in correct order (lint → build → test → security → deploy)?
- [ ] All versions pinned (base images, CI actions, tool versions)?
- [ ] Dependency caching enabled?
- [ ] No secrets in config files (use env vars or secrets manager)?
- [ ] Secret scanning in CI?
- [ ] Health checks defined for all service dependencies?
- [ ] Pipeline completes in under 15 minutes?

**If building container images (Level 1):**
- [ ] Multi-stage Docker builds used?
- [ ] Container image scanned for HIGH/CRITICAL CVEs?
- [ ] SBOM generated and attested to image via Cosign (keyless)?

**If deploying to Kubernetes (Level 2):**
- [ ] Deployment strategy defined (blue-green, canary, or rolling)?
- [ ] GitOps in place — no direct `kubectl apply` in production?
- [ ] Secrets reference external store, not plaintext in git?
- See **ci-cd-gitops-kubernetes.md** for full checklist

**If feature flags are required by PRD/architecture:**
- [ ] Flag infrastructure specified in tech architecture document?
- [ ] Every flag has an owner and expiry date?
- See **feature-flags-principles.md** for full checklist

### Related Principles
- Code Completion Mandate code-completion-mandate.md (validation before ship)
- Security Mandate security-mandate.md (secrets management)
- Security Principles security-principles.md (image scanning, SBOM)
- Git Workflow Principles git-workflow-principles.md (branch strategy)
- Project Structure project-structure.md (service paths)
- Testing Strategy testing-strategy.md (unit and integration test stages)
- GitOps + Kubernetes Deployment ci-cd-gitops-kubernetes.md
- Feature Flags feature-flags-principles.md
