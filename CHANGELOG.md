# Changelog

## Unreleased

### Added

- `apps/neo-standalone` is an independent Neo demo. Vite on `127.0.0.1:5179` proxies `/orchestrator` to Host `http://127.0.0.1:3082` with `changeOrigin` and a `proxyReq` hook that sets `x-orchestrator-request: 1` and `Origin: http://127.0.0.1:3082`. The page calls relative `/orchestrator/api/*` only. [009 Neo standalone](docs/009-neo-standalone.md) and [009a Vite proxy](docs/009a-vite-proxy.md).

### Fixed

- Management routes at `/orchestrator/api/` answer before startup's `ready` promise. A slow or failed account probe no longer leaves the Superagent panel on "loading", so first-run Settings can save the GitHub (and Feishu) Source, Policy, and Execution blocks.
- Settings groups other than the one that fixes a setup problem show that problem and a link to the Source card or Deployment group.
- A Feishu `[event] ready` line that arrives after a bad event no longer clears that error. The next consumer start still reports ready on its own.

### Changed

- The Neo-Brutalist panel is viewport-locked. `.dt-page` is a flex column with `overflow: hidden`. `.dt-column` scrolls inside it, so the Harness page does not grow a document scrollbar. Jumps to a tab, a Source card, a history row, or a Trigger scroll that column or the tab strip, not the host page.
- The client stays on the real orchestrator API: base path `/orchestrator/api/` and header `x-orchestrator-request: 1`. Panel tests reject a request that drops either. Key calls covered: `GET state`, `GET overview`, `POST executor/pause`, `POST tickets/:id/retry`, `POST tickets/:id/stop`, `PUT settings/:block`.

### Smoke on profile `superagent`

From this checkout. Do not commit tokens or a real profile's `cordis.patch.yml`.

```sh
pnpm check
scripts/dsh-superagent --profile superagent status
```

Open `http://127.0.0.1:3082/` (or the `webserver` port in that profile) and choose **Superagent**. Exit 0 means the runtime is up. Exit 3 means it is waiting for setup; the panel can still save settings. `scripts/dsh-superagent` needs Python 3, `tmux`, and POSIX `ps`. Where those are missing, start with `dsh --profile superagent` and open the URL it prints. Paths in the profile patch must be absolute on that machine. The checklist is in [docs/006-deployment.md](docs/006-deployment.md).
