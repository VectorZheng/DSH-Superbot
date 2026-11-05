# 009a Vite proxy

Option A is the only unlock for the Neo demo in `apps/neo-standalone`. The page is a Vite app on `http://127.0.0.1:5179`. It does not patch Host `sameOrigin`, does not add CORS on the Host, and does not mount a Host static `/neo/` route. Welcome-notice and `settings.mutate` are out of scope.

Host loopback is `http://127.0.0.1:3082`. The browser stays on port 5179 and calls relative `/orchestrator/api/*`.

`apps/neo-standalone/vite.config.ts`:

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

`cors: false` keeps the Vite dev server from adding a cross-origin allow-list. `changeOrigin: true` rewrites `Host` to `127.0.0.1:3082`. The `proxyReq` hook sets `x-orchestrator-request: 1` and `Origin: http://127.0.0.1:3082` on the request that reaches Host. The page also sends `x-orchestrator-request: 1` on each `fetch`, with `cache: 'no-store'`.

The page must not call `http://127.0.0.1:3082/...` from the browser.
