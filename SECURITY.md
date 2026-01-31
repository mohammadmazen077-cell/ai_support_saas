# Security Review Report

**Date:** 2025-01-31  
**Scope:** Full codebase security review (OWASP Top 10 + modern best practices)

---

## Summary of Fixes Applied

### 1. Authentication & Authorization

| Issue | Location | Fix |
|-------|----------|-----|
| **Open redirect** | `app/auth/confirm/route.ts` | Validate `next` param against allowlist; reject external/relative paths like `//evil.com` |
| **Missing input validation** | `app/login/actions.ts` | Added email format, length limits (254), password length (6-512) validation |

**No other auth issues found.** Supabase handles sessions; RLS protects data; middleware guards `/dashboard`.

### 2. Input Validation & Injection

| Issue | Location | Fix |
|-------|----------|-----|
| **Missing schema/length validation** | Widget, knowledge, customer-chats, conversations | Added `lib/validation.ts` with UUID validation, `MESSAGE_CONTENT_MAX`, `KNOWLEDGE_SOURCE_*` limits |
| **No validation on IDs** | Server actions | All IDs (businessId, visitorId, conversationId, sourceId) now validated as UUID |

**SQL/NoSQL injection:** Supabase client uses parameterized queries; RPCs use typed params. **No issues found.**

**XSS:** Message content rendered as text in React (no `dangerouslySetInnerHTML`). Widget `innerHTML` uses static SVG only. **No issues found.**

### 3. API & Endpoint Security

| Issue | Location | Fix |
|-------|----------|-----|
| **Debug API in production** | `app/api/debug/rag/route.ts` | Returns 404 when `NODE_ENV=production` |
| **Error details exposed** | Same | Removed `sourcesError`, `chunksError` from response; generic 500 message |
| **Stack trace exposure** | Same | `catch` returns generic "Internal server error" instead of `error.message` |

**Rate limiting:** None implemented. **Action required** – add IP/user rate limiting (e.g. Vercel Edge, Upstash Redis) for login, widget, and API routes.

**401/403/404:** Handled appropriately; no info leakage in responses.

### 4. Secrets & Configuration

| Issue | Location | Fix |
|-------|----------|-----|
| **Real credentials in example** | `.env.local.example` | Replaced with placeholders; **rotate any exposed Supabase keys immediately** |
| **Debug telemetry** | `lib/ai.ts` | Removed hardcoded `fetch` to `http://127.0.0.1:7242` |
| **API key logging** | `lib/ai/openai.ts` | Removed `console.log` of `OPENAI_API_KEY` presence |

**No hardcoded secrets** in application code. Env vars used correctly.

### 5. Data Protection & Privacy

- Passwords handled by Supabase Auth (bcrypt).
- PII not logged.
- **Recommendation:** Ensure TLS in production (Vercel/default hosting provides this).

### 6. Error Handling & Logging

| Issue | Location | Fix |
|-------|----------|-----|
| **Sensitive data in logs** | `lib/ai/rag.ts` | Removed `console.log` of query content, businessId, chunk content |
| **Internal errors to client** | `app/api/debug/rag/route.ts` | Generic error messages; details only in server logs |

### 7. Dependency & Supply Chain

- `npm audit`: **0 vulnerabilities**
- Dependencies are standard (Next.js, Supabase, OpenAI).

### 8. Business Logic & RLS

| Issue | Location | Fix |
|-------|----------|-----|
| **Permissive `customer_messages_insert_public`** | Migration 02 | New RPC `insert_visitor_message` validates `visitor_id`; dropped public insert policy |
| **Direct insert bypass** | `app/widget/actions.ts` | Visitor messages now use `insert_visitor_message` RPC |

---

## Remaining Recommendations

1. **Rate limiting**
   - Login/signup: 5 attempts per IP per 15 min
   - Widget actions: 60 req/min per IP
   - Use Vercel middleware or Upstash

2. **Rotate credentials** if `.env.local.example` was ever committed with real values.

3. **CSP headers** – add Content-Security-Policy in `next.config.ts` for production.

4. **Disable debug scripts in prod** – `debug-rag.mjs` should not run in production; consider moving to `scripts/` and excluding from build.

5. **Widget `business_id`** – ensure embed script only allows UUID format; consider server-side allowlist of valid business IDs.

6. **Key rotation** – document and automate rotation for `OPENAI_API_KEY` and Supabase keys.

---

## Files Modified

- `app/auth/confirm/route.ts` – Open redirect fix
- `app/login/actions.ts` – Input validation
- `app/api/debug/rag/route.ts` – Prod disable, error sanitization
- `app/widget/actions.ts` – Validation, RPC for visitor messages
- `app/dashboard/conversations/actions.ts` – ID and content validation
- `app/dashboard/customer-chats/actions.ts` – ID and content validation
- `app/dashboard/knowledge/actions.ts` – Name/content limits, ID validation
- `lib/ai.ts` – Removed debug telemetry
- `lib/ai/openai.ts` – Removed API key log
- `lib/ai/rag.ts` – Reduced logging
- `lib/validation.ts` – **New** validation helpers
- `supabase/migrations/06_visitor_message_rpc.sql` – **New** RPC + policy change
- `.env.local.example` – Placeholder credentials
- `.gitignore` – Allow `!.env*.example`
