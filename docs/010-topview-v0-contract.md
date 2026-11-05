> SUPERSEDED by docs/011-pm-v0-contract.md (product-first).

# 010 TopView v0 contract (draft)

Scope lock: cloud path only — create project → push GitHub (README + design doc) → 91bot review callback persisted → Feishu shows verdict. No unit/load tests, no auto doc rewrite, no Host sameOrigin change, no Neo panel unless Frontend later opts in.

Reuse dsh-superagent Sources (`lark-cli` / `gh`). Do not invent a second orchestrator.

## Blockers (implementation red until filled)

| ID | Need |
|----|------|
| B1 | TopView Feishu `chat_id`; bot already in chat? |
| B2 | Cloud doc link / folder token; identity with write |
| B3 | 91bot trigger entry, callback URL, auth (HMAC/header), sample payload |
| B4 | GitHub `owner`/`org` + token scope `repo` (create+push) — soft if user names a fixed owner |

## HTTP surface (orchestrator shell)

Base: same Host loopback style as today; path prefix `/v0/topview` (name frozen for Test). All mutating calls idempotent via `Idempotency-Key`.

### 1. Create project

`POST /v0/topview/projects`

```json
{
  "chat_id": "<feishu chat>",
  "title": "string",
  "doc_token": "<optional cloud doc/folder>",
  "design_md": "string | omit → stub"
}
```

Response `201`:

```json
{
  "project_id": "tv_...",
  "folder_id": "string|null",
  "repo": { "owner": "", "name": "", "url": "", "default_branch": "main" },
  "push": { "sha": "", "files": ["README.md", "docs/DESIGN.md"] },
  "review": { "status": "pending", "external_ref": null }
}
```

Fail codes (Test 三态·缺权): `FEISHU_CHAT_FORBIDDEN`, `DOC_WRITE_FORBIDDEN`, `GITHUB_CREATE_DENIED`, `GITHUB_PUSH_DENIED`.

### 2. Doc probe (Test case 2)

`POST /v0/topview/projects/{id}/doc/probe` → write stamp then read-back; `200 { "written": "...", "read": "...", "ok": true }` or `DOC_WRITE_FORBIDDEN` / `DOC_READ_FORBIDDEN`.

### 3. 91bot webhook (review gate)

`POST /v0/topview/hooks/91bot/review`

Headers: auth per B3 (e.g. `X-91-Signature`).

```json
{
  "project_id": "tv_...",
  "verdict": "pass|fail|pending",
  "summary": "string",
  "raw_ref": "string|null",
  "at": "ISO-8601"
}
```

Behavior: verify → upsert review row → **only then** Feishu reply in `chat_id` (thread if known). Never post 「已通过」 on timeout/bad sig/no row.

Fail codes (Test 三态·回调失败): `HOOK_AUTH_FAIL`, `HOOK_TIMEOUT_NO_CALLBACK` (internal watchdog), `PROJECT_NOT_FOUND`.

Response `202 { "stored": true, "feishu_message_id": "..." }`.

### 4. Readback (Test assert)

`GET /v0/topview/projects/{id}` → `{ project_id, repo, push.sha, review: { status, verdict, summary, at }, feishu: { last_notice } }`.

## Event order (acceptance)

1. Feishu trigger / `POST projects` recognized for B1 chat  
2. Folder + doc probe OK  
3. GitHub remote has README + design; sha recorded  
4. 91bot callback stored (`review.status != empty`)  
5. Feishu notice text == stored `summary`/`verdict`

Out of gate: unit/integration/load tests, auto doc writeback, server deploy, Neo UI.

## Open until B1–B3

Exact Feishu event type for「建项指令」, 91bot trigger (we call them vs they poll sha), signature algorithm. Draft stays draft; no Host code until Vector clears reds.

