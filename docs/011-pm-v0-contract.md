> NO GITHUB PUSH / DEFER REVIEW: 竖切仅纪要→本机文档文件夹→系统状态；以 docs/012-pm-v0-plan.md 为准。

> DEFER REVIEW: 2026-11-03 竖切先不含 91bot/审查；以 docs/012-pm-v0-plan.md 为准。hooks/91bot 整段待定。

# 011 Product v0 contract — meeting minutes → repo → 91bot → status

Product lock (Manager 2026-11-03): **independent web app**, not a Feishu plugin. **dsh-superagent hosts** parent/child orchestration + dashboard (pause etc.). **Feishu = mapping only** (show / allow edit of conclusions). Main data & flow live in our system; later always-on server.

## v0 scope

1. Ingest meeting minutes (paste first; live recording later)
2. Parent agent: create project folder + push GitHub (`README.md` + design doc required; other docs may be stubs)
3. Trigger 91bot review → callback persisted → **visible in product API** + **Feishu mapping notice**
4. Existing dsh panel/Neo can observe related agent state / `executor/pause` (Option A proxy unchanged)

**Out of v0:** realtime STT, smart task dispatch, full four-doc generation, unit/API/load suite, delay @, weekly reports/portraits.

Neo Demo push remains a separate user nod.

## Blockers (integration red; drafts OK)

| ID | Need | Blocks |
|----|------|--------|
| B1 | TopView `chat_id` + bot in chat | Feishu **mapping** write |
| B2 | Cloud doc/folder token + write identity | Optional folder-on-Feishu; **not** required if local+GitHub only |
| B3 | 91bot trigger URL, callback auth, sample payload | Live review gate |
| B4 | GitHub `owner`/`org` + `repo` token | Live create/push |

Frontend skeleton + this contract proceed without B1–B3. E2E with Feishu/91bot waits for greens.

## HTTP — product API

Prefix `/v0/pm` on the orchestrator/Host (same-origin or Vite proxy like 009a). Header `x-orchestrator-request: 1` when hitting Host. Mutations take `Idempotency-Key`.

### A. Ingest minutes → create project

`POST /v0/pm/projects`

```json
{
  "title": "string",
  "minutes_md": "string",
  "map_feishu": false,
  "chat_id": null,
  "design_md": null
}
```

`201`:

```json
{
  "project_id": "pm_...",
  "folder": { "path": "projects/<slug>/", "files": ["README.md", "docs/DESIGN.md", "docs/REQUIREMENTS.md", "docs/API.md", "docs/DEPLOY.md", "docs/MINUTES.md"] },
  "repo": { "owner": "", "name": "", "url": "", "branch": "main" },
  "push": { "sha": "", "ok": true },
  "agents": { "parent_ticket_id": "", "status": "running|paused|done|error" },
  "review": { "status": "pending", "verdict": null, "summary": null },
  "feishu_map": { "enabled": false, "message_id": null }
}
```

Fail: `MINUTES_EMPTY`, `GITHUB_CREATE_DENIED`, `GITHUB_PUSH_DENIED`, `AGENT_START_FAILED`.

Stub mode (no B4): still returns `project_id` + local `folder` + `review.status=pending`; `repo.url` null and `push.ok=false` with code `GITHUB_SKIPPED` — Test marks integration pending, not fake PASS.

### B. Status (system-visible source of truth)

`GET /v0/pm/projects/{id}`

Returns latest `agents`, `push`, `review`, `feishu_map`. Product UI reads **only** this for v0 (not Feishu).

### C. 91bot webhook

`POST /v0/pm/hooks/91bot/review`

Auth per B3. Body:

```json
{
  "project_id": "pm_...",
  "verdict": "pass|fail|pending",
  "summary": "string",
  "raw_ref": null,
  "at": "ISO-8601"
}
```

Order: verify → upsert `review` → if `map_feishu` and B1 ok, post mapping to chat → never claim 已通过 on auth fail / missing row / watchdog timeout (`HOOK_AUTH_FAIL`, `HOOK_TIMEOUT`, `PROJECT_NOT_FOUND`).

`202 { "stored": true, "feishu_message_id": null }`

### D. Feishu mapping write (optional)

`POST /v0/pm/projects/{id}/feishu/map`

```json
{ "chat_id": "...", "summary_override": null }
```

Writes conclusion card/text from stored `review` only. Fail `FEISHU_MAP_FORBIDDEN` / `REVIEW_NOT_READY`. No Feishu-originated workflow control in v0.

### E. Dashboard / pause

Reuse existing orchestrator:

- `GET /orchestrator/api/state` / `overview`
- `POST /orchestrator/api/executor/pause` `{ "paused": true|false }`

Product page may link or embed Neo; **no new pause API**. Parent ticket id from create response ties the run.

## Acceptance alignment (for Test)

| Step | Assert |
|------|--------|
| 1 | `POST /projects` with pasted minutes → `project_id` |
| 2 | Folder has README + DESIGN (+ stubs OK) |
| 3 | GitHub sha when B4 present |
| 4 | Webhook → `GET` shows same verdict/summary |
| 5 | If mapping on: Feishu text matches stored review; else skip B1 without failing system path |
| 6 | Pause via orchestrator flips agent observable state |

三态: 正常 / 缺权(GitHub|Feishu map) / 回调失败 — same FAIL codes; no false green.

## dsh wiring (draft)

Parent agent Ticket from minutes → Assignment: materialize folder, `gh` create+push, emit `review.pending`, call 91bot trigger (B3). Child agents out of v0 except what parent needs for docs stubs. Feishu Source **not** the ingress; only mapping egress via `lark-cli`/API wrapper.

## Supersedes

`010-topview-v0-contract.md` Feishu-first ingress — replaced by this product-first ingress. Keep 010 as historical; implement against **011**.


