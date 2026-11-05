# Neo demo

Independent static page for the orchestrator management API. It is not a DeepSeek Harness `ui-*` plugin. The browser stays on this dev server and calls relative `/orchestrator/api/*` only.

Host loopback is `http://127.0.0.1:3082`. This checkout does not start Host. Start Host on your machine, then run this app. The client is written for that loopback. A cloud run cannot prove a live Host.

## Start

1. Start Host so the management API is on `http://127.0.0.1:3082`. [006 Deployment](../../docs/006-deployment.md) is the service guide. The Vite proxy adds `x-orchestrator-request: 1` and the loopback `Origin`. The page does not call Host directly.

2. Install and start the demo:

```sh
cd apps/neo-standalone
pnpm install
pnpm dev
```

From the repo root, after that install:

```sh
pnpm neo:dev
```

That script is `pnpm --dir apps/neo-standalone dev`.

3. Open http://127.0.0.1:5179/

The dev server listens on `127.0.0.1:5179` and proxies `/orchestrator` to `http://127.0.0.1:3082` with `changeOrigin: true`. On `proxyReq` it sets `x-orchestrator-request: 1` and `Origin: http://127.0.0.1:3082`. Vite CORS is off. The freeze is [009a Vite proxy](../../docs/009a-vite-proxy.md). The product note is [009 Neo standalone](../../docs/009-neo-standalone.md).

## Smoke

With Host up:

1. Home shows a live snapshot. `paused`, `health`, and `setup.problem` come from `GET /orchestrator/api/state`. Overview `problems`, `executor`, and `flow` come from `GET /orchestrator/api/overview`, after state. Both sends carry `x-orchestrator-request: 1` and `cache: no-store`. The page refetches every 4 seconds while the browser tab is visible.
2. The document does not scroll. `html`, `body`, and `#root` are `height: 100%` and `overflow: hidden`. The column under the tabs scrolls.
3. State lists each health entry (`state`, `detail`, and `at` / `code` when Host sent them) and shows `setup.problem` and `setup.feishuProblem` as `null` or the problem object (`place`, `code`, `values`, `detail`).
4. Overview lists each problem `kind` with the fields Host sent, plus executor load (`running`, `queued`, `maxWorkers`, `idle`) and the flow counts (`received`, `filtered`, `triggers`, `judged`, `accepted`, `evaluating`, `dropped`).
5. Pause posts `{"paused":true}` or `{"paused":false}` to `POST /orchestrator/api/executor/pause` and shows the JSON body that came back. Home and State then show the new `paused` value.
6. In the browser network panel, those calls go to `http://127.0.0.1:5179/orchestrator/api/...`. None go to port 3082.

If Host is down, the page shows the proxy error and leaves the counts unread. It does not fill them in.

## Checks

```sh
pnpm test
pnpm typecheck
pnpm build
```

`pnpm test` reads the proxy and the viewport rules. It does not start Host.
