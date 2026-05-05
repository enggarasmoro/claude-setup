## API Design Principles

### RESTful API Standards

**Resource-Based URLs:**
- Use plural nouns: `/api/{version}/users`, `/api/{version}/orders`
- Hierarchical relationships: `/api/{version}/users/:userId/orders`
- Avoid verbs in URLs: `/api/v1/getUser` ❌ → `/api/v1/users/:id` ✅

**HTTP Methods:**
- GET: Read/retrieve (safe, idempotent, cacheable)
- POST: Create new resource (not idempotent)
- PUT: Replace entire resource (idempotent)
- PATCH: Partial update (idempotent)
- DELETE: Remove resource (idempotent)

**Versioning:** URL path versioning — `/api/v1/users` (explicit, clear).

**Pagination:**
- Limit results per page (default 20, max 100)
- Cursor-based: `?cursor=abc123` (better for real-time data)
- Offset-based: `?page=2&limit=20` (simpler, less accurate when data changes)

**Filtering / sorting / search:** `?status=active&role=admin`, `?sort=created_at:desc,name:asc`, `?q=search+term`.

### HTTP Status Codes and Error Categories

**Success (2xx):**
- **200 OK** — Success (GET, PUT, PATCH)
- **201 Created** — Resource created (POST)
- **204 No Content** — Success with no body (DELETE)

**Client Errors (4xx) — User Can Fix:**

- **400 Bad Request (Validation):** Input doesn't meet requirements (invalid email, password too short, missing required field). Response: field-level errors. User action: correct input and retry.
- **401 Unauthorized (Authentication):** Identity verification failed (invalid/expired/missing token). User action: provide valid credentials.
- **403 Forbidden (Authorization):** User identified but lacks permission. User action: contact admin.
- **404 Not Found:** Resource doesn't exist (or user lacks permission to know it exists). User action: none.
- **409 Conflict / 422 Unprocessable Entity (Business Rule):** Domain rule violations (insufficient balance, duplicate email, order already shipped). Response: business rule explanation.
- **429 Too Many Requests (Rate Limit):** Too many requests in time window. User action: wait and retry.

**Server Errors (5xx) — System Issue:**
- **500/502/503 (Infrastructure):** Database down, network timeout, external service failure. Response: generic message with correlation ID. User action: none (retry later).

### API Success Response Format
```
{
  "data": { /* resource or array */ },
  "meta": { "total": 100, "page": 1, "perPage": 20 },
  "links": {
    "self": "/api/v1/users?page=1",
    "next": "/api/v1/users?page=2",
    "prev": null
  }
}
```

### API Error Response Format

All API errors follow a consistent envelope:
```
{
  "status": "error",                  // Transport: "error" or "fail"
  "code": 400,                        // Transport: redundant HTTP status
  "error": {                          // Domain: actual business problem
    "code": "VALIDATION_ERROR",       // Machine-readable (UPPER_SNAKE)
    "message": "Invalid email format",
    "details": { "field": "email", "reason": "Must be a valid address" },
    "correlationId": "req-1234567890",
    "doc_url": "https://..."          // Optional
  }
}
```

### Related Principles
- Error Handling Principles error-handling-principles.md
- Security Mandate security-mandate.md
- Security Principles security-principles.md
- Logging and Observability Mandate logging-and-observability-mandate.md
- Data Serialization and Interchange Principles data-serialization-and-interchange-principles.md
