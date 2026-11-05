# 009 Neo standalone

`apps/neo-standalone` is an independent Neo demo page for the management API in [006 Deployment](006-deployment.md). It is a static Vite app, separate from the Harness panel in [005 Panel](005-panel.md). It is not a `ui-*` plugin, and this round does not mount it on the Host.

## Option A

The browser opens `http://127.0.0.1:5179/` and calls relative `/orchestrator/api/*` with `x-orchestrator-request: 1`. Vite proxies `/orchestrator` to Host at `http://127.0.0.1:3082`.

That proxy is the only unlock. Host `sameOrigin` stays as it is. The Host does not gain a CORS allow-list, and it does not serve a static `/neo/` tree. Welcome-notice and `settings.mutate` are out of this page.

The proxy freeze, including `changeOrigin` and the `proxyReq` headers, is recorded in `docs/009a-vite-proxy.md` and in `apps/neo-standalone/vite.config.ts`:

```ts
server: {
  host: '127.0.0.1',
  port: 5179,
  strictPort: true,
  cors: false,
  proxy: {
    '/orchestrator': {
      target: 'http://127.0.0.1:3082',
      changeOrigin: true,
      configure(proxy) {
        proxy.on('proxyReq', (proxyReq) => {
          proxyReq.setHeader('x-orchestrator-request', '1')
          proxyReq.setHeader('origin', 'http://127.0.0.1:3082')
        })
      },
    },
  },
}
```

`changeOrigin: true` rewrites `Host` to `127.0.0.1:3082`. The hook forces `Origin` to `http://127.0.0.1:3082`, which is the loopback origin `sameOrigin` already accepts. The page itself never fetches `http://127.0.0.1:3082/...`.

## What the page reads

On load, and every 4 seconds while the browser tab is visible, the page calls `GET state`, then `GET overview`. Home shows `paused`, `health`, and `setup.problem` from state, and `problems`, `executor`, and `flow` from overview. Pause posts `{"paused": true}` or `{"paused": false}` to `POST executor/pause`.

`html`, `body`, and `#root` are `height: 100%` with `overflow: hidden`. The column under the tabs scrolls.

## Run

Start Host on port 3082, then from `apps/neo-standalone` run `pnpm install` and `pnpm dev`, and open `http://127.0.0.1:5179/`. From the repo root, `pnpm neo:dev` is `pnpm --dir apps/neo-standalone dev`. Smoke steps are in `apps/neo-standalone/README.md`.

This repository does not start Host for the demo. The client is correct for a Host that is already listening on loopback.
