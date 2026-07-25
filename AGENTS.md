# Prototype Instructions

Run the local server yourself and open the preview in the browser available to this environment. Do not give the user server-start instructions when you can run it.

Before making substantial visual changes, use the Product Design plugin's `get-context` skill when the visual source is unclear or no longer matches the current goal. When the user gives durable prototype-specific design feedback, preferences, or decisions, record them in `AGENTS.md`.

When implementing from a selected generated mock, treat that image as the source of truth for layout, component anatomy, density, spacing, color, typography, visible content, and hierarchy.

Build app UI in `src/`. Keep `.openai/hosting.json`, `worker/index.js`, `scripts/prepare-sites-build.mjs`, and `tests/sites-worker.test.mjs` intact so the same local prototype can be handed to Sites. Before a Sites handoff, run `npm run build` and `npm run test:sites`; the build must leave `dist/client/index.html`, `dist/server/index.js`, and `dist/.openai/hosting.json`.

## xingbuild product decisions

- `xingbuild` is an author-led personal website and an evolving body of work, not an online resume.
- `xingbuild` connects the author identity `金星 · Xingjin` with the works he continues to design and build. This is private design context: use it to judge naming and structure, but do not turn the user's explanation about growth, social value, or long-term self-recording into public website copy unless the user explicitly asks.
- The current `v0.2.0` information architecture is `观察 / 作品 / 关于我`.
- `观察` contains author-written Robotaxi, enterprise-operation, digitalization, and related analysis. It is not a generic news feed and is not an automated engineering activity log.
- A future build log may project verified project and release activity, but it is not a top-level navigation item at the current stage.
- Robotaxi and the enterprise operating system / digitalization cognition framework are both works.
- Career experience, positioning, capabilities, direction, resume, and contact belong to `关于我`.
- Desktop follows the warm editorial visual direction; mobile follows the compact Swiss systems direction.
- Diagrams are simple, direct business architecture diagrams. Do not use hand-drawn, sketch, watercolor, notebook, botanical, landscape, or decorative metaphor styles.
- Keep content, presentation, and visual tokens separate so future editing does not require rewriting page components.
- Career and Robotaxi source projects remain upstream factual authorities. Website content is a versioned presentation snapshot and must preserve evidence boundaries.

## Iteration and release workflow

- Before changing product content, structure, visual language, deployment behavior, or domain configuration, read `docs/rules/iteration-and-release.md`.
- The active iteration is recorded only in `docs/iterations/current.md`. Completed plans move to `docs/iterations/history/`; do not rewrite completed history.
- Use `./start-xingbuild.command` for the standard local startup path.
- Before saying an iteration is complete, run `npm run release:check`.
- After a stable iteration passes validation, create a local Git commit and matching version tag as the normal closeout action. This does not authorize a remote push or production deployment.
- GitHub remote creation and the first push require the user's authorization or an explicit execution request. Later pushes follow the release instruction for that iteration.
- Production publishing uses `./publish-xingbuild.command` and targets the EdgeOne Makers project `xingbuild-nochina` (`makers-ze0f6txvlhco`). The user normally runs this command manually. Codex must not publish, trigger a remote deployment, change DNS, or bind a production domain unless the user explicitly asks Codex to do so in the current task.
- The publish command must not contain API tokens or other credentials.
- Publishing is a separate state from implementation: code complete, locally verified, committed, deployed, domain active, and publicly verified must be reported separately.
- `xingbuild.top` is the canonical personal-site domain. `www.xingbuild.top` is reserved for redirecting to the canonical domain. `robotaxi.xingbuild.top` belongs to the independent Robotaxi deployment and must not be published from this repository.
