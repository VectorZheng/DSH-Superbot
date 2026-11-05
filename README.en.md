# dsh-superagent

> **Research prototype for reference only, not an official DeepSeek product.** This code grew out of our team's day-to-day development work, with much of the engineering done by coding agents. Treat it as research code, not production-ready software. It may still contain bugs, and its coding style and engineering practices may be inconsistent. Review and adapt it before using it in your own environment.
>
> We have adapted it for publication, so it is not identical to our internal version or the implementation described in *Exploring Super-agent Design: Towards a More Autonomous Agent System*. Some designs discussed in the article are directions for future development and are not implemented in this prototype.

dsh-superagent is a proactive coding agent for one GitHub repository, packaged as a bundle for [DeepSeek Harness](https://www.deepseek.com/en/harness/). It listens to GitHub and, optionally, Feishu. When someone allowed asks the agent for work, it opens a work item, works on it in its own agent session and directory, and answers in the original conversation, for example with a pull request. A web panel shows what needs a person.

It is also a way of working with an agent: **take as little human attention as possible, and give as much value as possible.** An agent that can act for a whole team can also waste a whole team's attention, so it acts only when asked or when a rule the team wrote allows it, and speaks only when someone must act or can use a result. [docs/000-philosophy.md](docs/000-philosophy.md) explains the principle and what it asks of the operator.

## Setup

Setup has many steps, so an agent does it with you. Ask your coding agent:

> Read SETUP.md in this repository and set up dsh-superagent with me.

It asks one short question at a time, shows the full plan once, and then installs and configures everything. [SETUP.md](SETUP.md) is what it follows.

## Documentation

Read the numbered documents in order; each builds only on the ones before it.

- [000 Philosophy](docs/000-philosophy.md)
- [001 Domain model](docs/001-domain.md)
- [002 Authorization](docs/002-authorization.md)
- [003 Execution](docs/003-execution.md)
- [004 Prompts](docs/004-prompts.md)
- [005 Panel](docs/005-panel.md)
- [006 Deployment](docs/006-deployment.md): manual setup, configuration, upgrades and troubleshooting
- [007 Architecture](docs/007-architecture.md)
- [008 Cookbook](docs/008-cookbook.md): adding a Source
- [009 Neo standalone](docs/009-neo-standalone.md): independent demo page and its Vite proxy

## Panel

Start the service (`scripts/dsh-superagent start`), open the Harness URL printed in the log, and choose **Superagent** in the web sidebar. That entry is the bundle's sidebar panel (`dsh-superagent` in `src/client/index.tsx`).

The panel reads and writes the management API at `/orchestrator/api/` on `localhost` or `127.0.0.1`, and every request sends `x-orchestrator-request: 1`. Another host, a missing header, or a foreign `Origin` is rejected with 403. [005 Panel](docs/005-panel.md) is the screen guide. [006 Deployment](docs/006-deployment.md) is the API and the host check.

The panel surface is Neo-Brutalist (square corners, hard black borders and offset shadows, high-contrast black and white with pink, yellow, acid and cyan). The Harness window frame, sidebar list and Plugin Manager shell stay on host chrome and are not overridden. The page is viewport-locked: `.dt-page` hides overflow and the column scrolls inside it. Overview, Execution and Settings call the existing routes, including `GET state`, `POST executor/pause`, `POST tickets/:id/retry`, `POST tickets/:id/stop` and `PUT settings/:block`, each with `x-orchestrator-request: 1`. Those routes answer during the first account probe, so Settings can fix setup before startup finishes.

To smoke it on profile `superagent`: `pnpm check`, then `scripts/dsh-superagent --profile superagent status`, then open `http://127.0.0.1:3082/` and choose **Superagent**. [006 Deployment](docs/006-deployment.md) has the checklist, including a direct `dsh --profile superagent` start where `tmux` is unavailable.

## Neo demo

`apps/neo-standalone` is a separate static page. Vite on `http://127.0.0.1:5179` proxies `/orchestrator` to Host at `http://127.0.0.1:3082`. The page calls relative `/orchestrator/api/*` only. [009 Neo standalone](docs/009-neo-standalone.md) describes the page. [009a Vite proxy](docs/009a-vite-proxy.md) is the proxy freeze.

Start Host on port 3082, then:

```sh
cd apps/neo-standalone
pnpm install
pnpm dev
```

Open `http://127.0.0.1:5179/`. After that install, `pnpm neo:dev` from the repo root runs the same dev server (`pnpm --dir apps/neo-standalone dev`). Smoke steps for state and overview are in `apps/neo-standalone/README.md`.

## Development

`pnpm check` runs the typecheck, the tests and the build.

## License

[MIT](LICENSE)
