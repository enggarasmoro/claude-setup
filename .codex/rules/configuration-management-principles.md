## Configuration Management Principles

### Separation of Configuration and Code

**Configuration:** environment-specific values (URLs, credentials, timeouts); changes between dev/staging/prod; can change without code deployment.

**Code:** business logic and application behavior; same across environments; requires deployment to change.

**Never hardcode configuration in code:**
- ❌ `const DB_URL = "postgresql://prod-db:5432/myapp"`
- ✅ `const DB_URL = process.env.DATABASE_URL`

### Configuration Validation

**Validate at startup:**
- Check all required configuration is present
- Fail fast if required config is missing or invalid
- Provide clear error messages (e.g., "DATABASE_URL environment variable is required")

**Validation checks:** type (string/number/boolean/enum), format (URL, email, file path), range (port 1–65535), dependencies (if feature X enabled, config Y required).

### Configuration Hierarchy

**Precedence (highest to lowest):**
1. **Command-line arguments** — override everything (testing, debugging)
2. **Environment variables** — override config files
3. **Config files** — environment-specific (config.prod.yaml, config.dev.yaml)
4. **Defaults** — reasonable defaults in code (fallback)

Example DB port: CLI `--db-port=5433` → env `DB_PORT=5432` → config `database.port=5432` → default `5432`.

### Configuration Organization

**Hybrid approach (config files + .env files):** define structure in config files (e.g. `config/database.yaml`), inject secret values via .env files.

**.env files:** for secrets (API keys, passwords) and environment-specific values (server IP). In production, secrets come from a secret manager — not a physical `.env` file. Never commit except `.env.template`.
- `.env.template` — credentials/secrets with blank values (commit to git)
- `.env.development` — local dev credentials/secrets (do NOT commit)

```
# .env.development
DEV_DB_HOST=123.45.67.89
DEV_DB_USERNAME=prod_user
DEV_DB_PASSWORD=a_very_secure_production_password
```

**Feature files:** group non-secret settings by purpose (database, auth, etc.). Primary method for organizing configuration.
- `config/database.yaml`, `config/redis.yaml`, `config/auth.yaml`

```yaml
# config/database.yaml
default: &default
  adapter: postgresql
  pool: 5
development:
  <<: *default
  host: localhost
  database: myapp_dev
  username: <%= ENV['DEV_DB_USERNAME'] %>
  password: <%= ENV['DEV_DB_PASSWORD'] %>
production:
  <<: *default
  host: <%= ENV['PROD_DB_HOST'] %>
  database: myapp_prod
  username: <%= ENV['PROD_DB_USERNAME'] %>
  password: <%= ENV['PROD_DB_PASSWORD'] %>
```

> **Note:** Feature flag configuration is a distinct, PRD-gated concern — see Feature Flags Principles feature-flags-principles.md.

### Related Principles
- Security Mandate security-mandate.md
- Security Principles security-principles.md
- Feature Flags Principles feature-flags-principles.md
