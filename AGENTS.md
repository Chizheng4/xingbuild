# Prototype Instructions

Run the local server yourself and open the preview in the browser available to this environment. Do not give the user server-start instructions when you can run it.

Before making substantial visual changes, use the Product Design plugin's `get-context` skill when the visual source is unclear or no longer matches the current goal. When the user gives durable prototype-specific design feedback, preferences, or decisions, record them in `AGENTS.md`.

When implementing from a selected generated mock, treat that image as the source of truth for layout, component anatomy, density, spacing, color, typography, visible content, and hierarchy.

Build app UI in `src/`. Keep `.openai/hosting.json`, `worker/index.js`, `scripts/prepare-sites-build.mjs`, and `tests/sites-worker.test.mjs` intact so the same local prototype can be handed to Sites. Before a Sites handoff, run `npm run build` and `npm run test:sites`; the build must leave `dist/client/index.html`, `dist/server/index.js`, and `dist/.openai/hosting.json`.

## xingbuild product decisions

- `xingbuild` is an author-led personal website and an evolving body of work, not an online resume.
- `xingbuild` connects the author identity `金星 · Xingjin` with the works he continues to design and build. This is private design context: use it to judge naming and structure, but do not turn the user's explanation about growth, social value, or long-term self-recording into public website copy unless the user explicitly asks.
- The current top-level information architecture is `Robotaxi运营平台 / 企业经营体系 / 观察 / 关于我`; `/` is the author landing page and is not a duplicate Robotaxi page.
- `观察` contains author-written Robotaxi, enterprise-operation, digitalization, and related analysis. It is not a generic news feed and is not an automated engineering activity log.
- The home page uses the positioning statement once as a compact author entrance, then gives direct entry to the two core practices and a latest-observation projection when real content exists. It must not use an oversized display Hero or empty visual staging.
- Observation has exactly two reader forms: `Brief` (date + subject, hashtag dimension, fact body, final source line; no title/card/detail page) and `Article` (one canonical title, dimensions, summary, body, final source line). Evidence governance remains in data and production flow; reader UI does not display claim kinds, source tiers, or governance labels.
- A future build log may project verified project and release activity, but it is not a top-level navigation item at the current stage.
- Robotaxi and the enterprise operating system / digitalization cognition framework are both works.
- Career experience, positioning, capabilities, direction, resume, and contact belong to `关于我`.
- Desktop follows the warm editorial visual direction; mobile uses a compact systems layout without changing the site's brand palette.
- Responsive breakpoints may change layout, density, typography, navigation, and diagram direction, but must not redefine global brand colors. Resizing the same page must preserve its background, ink, line, and accent color identity.
- The global header keeps one compact horizontal identity group: larger `xingbuild` followed by smaller `金星 Xingjin`, with an 8px relationship gap, baseline alignment, and no dot, @, separator, second line, or extra header height. The author text remains a site content field, not hard-coded markup.
- Mobile navigation uses an icon button and a full-viewport overlay. Opening it must replace the page visually, lock background scrolling, and change the control to a close icon.
- Use typography, alignment, and whitespace for page hierarchy. Do not use decorative horizontal rules or boxed sections as general layout scaffolding; retain lines only when they express a real relationship or boundary, such as a business architecture diagram.
- Repeated clickable collections may use one shared interactive card system. A card boundary is allowed only when it identifies one real, clickable content object; do not turn arbitrary page sections into decorative boxes. Brief streams are deliberately not cards and use their own fixed four-line reading grammar.
- The shared card system fixes the site-wide shell, spacing roles, typography roles, surface/border treatment, hit area, hover, focus-visible, and responsive behavior. Cards may vary only by a small declared content-type schema; page-specific card styling and one-off interaction variants are not allowed.
- Every instance of the same content type uses the same field order and anatomy. Article previews do not switch between featured-card and compact-row grammar; work entries do not invent page-specific metadata arrangements. Emphasis may change grid span only when needed, never field order, interaction, or internal spacing.
- Card reading order is reader-first and consistent: title → concise explanation or summary → necessary metadata such as type, topic, date, status, or update time. Omit metadata that does not help recognition, chronology, or decision-making.
- The whole card is the primary link. Use one restrained hover response and a clear keyboard focus state; do not add redundant per-card calls to action such as “继续阅读” when the title or card already opens the content.
- Desktop collections use a consistent grid and card gap; mobile projects the same cards into one column without changing their content schema. Cards of the same type in the same row align visually, but different content types are not forced to contain false fields or identical text lengths.
- Vertical spacing must express the relationship between the preceding and following content objects. Define paragraph, heading, list, callout, and section rhythm by adjacent semantic roles; avoid uniform margins, accidental CSS margin collapse, and doubled spacing from both neighboring components.
- Treat visual structure as a durable hierarchy: page frame → section → content group → content object → element → adjacent relationship. A parent flow owns spacing between siblings; child objects own only their internal composition. Preserve this hierarchy when changing templates or layouts instead of copying old pixel values.
- Numbers must carry semantic information, not simulate structure. Use ordinals only for ordered steps, ranking, stable referenced indexes, or position within a known sequence; use dates and years for chronology, and counts only when collection size helps navigation. Do not number named sections, unordered works, capabilities, or thematic content merely for visual style.
- The footer contains copyright only. Author, location, and update dates belong in relevant content rather than global chrome.
- Diagrams are simple, direct business architecture diagrams. Do not use hand-drawn, sketch, watercolor, notebook, botanical, landscape, or decorative metaphor styles.
- Keep content, presentation, and visual tokens separate so future editing does not require rewriting page components.
- Career and Robotaxi source projects remain upstream factual authorities. Website content is a versioned presentation snapshot and must preserve evidence boundaries.
- Mobile navigation uses a content-driven breakpoint below 520px. Widths around 557px retain the compact inline header; the full-screen mobile menu starts directly below the header instead of vertically centering a short link list.
- Visual design iterations keep only the current valid interactive prototype and explicitly required final evidence. Delete rejected mockups, superseded screenshots, and temporary browser profiles after their review value has ended; do not accumulate invalid visual artifacts.
- Browser rendering must be bounded and serial. Do not leave preview servers, headless Chrome processes, Playwright runtimes, or temporary browser profiles running after capture. Before starting another render, verify the previous process exited; when HTML/SVG inspection is sufficient, do not generate screenshots.
- Daily observation publication is separate from website product version iteration. Published observations live only in `content/observations/`; local candidates and drafts live under ignored `.content-workspace/` and must never enter a production bundle.
- Observation content uses the `ObservationPublication → EvidenceUnit → Source` contract. Candidate tools may normalize lifecycle state, but must not invent facts, sources, business impact, dates, or evidence relationships.
- Product releases use `publish-xingbuild.command`, require the matching version tag, and run the full release check. Content-only releases use `publish-content.command`, keep the product version unchanged, accept exactly one published observation file, and reject engineering, configuration, rule, worker, or draft changes.
- Scheduled tasks may produce candidates only. Human review and explicit production authorization remain required before promotion or either publication command.
- 作品母版：左栏固定按“短作品说明 → 真实视觉证据”两段组织；Robotaxi 使用受控模块说明 + 真实16:10平台图，企业经营体系使用一张可平移、可选择、可复位的总览图和同宽解释面板。当前无批准模块时必须诚实不渲染模块，不得用占位媒体、平台泛链或猜测对象填充。框架局部 view 只能复用同一模型并等待明确入口。
- 布局母版：桌面唯一 shell 最大1280px、外边距至少32px；作品双栏为剩余主栏 + 48px + 固定320px rail，只有可同时容纳时成立。观察集合页使用独立居中单列，不得借用双栏主列左边界。无有效 Brief 时，Practice/Framework 不保留空白 rail。
- 内容入口收口后，Robotaxi 模块只通过受控 Practice 内容与已批准媒体 manifest 增加；观察内容只通过 ObservationPublication 中人工写入的显式 `presentation` 产生。二者都不得再通过页面、组件或视觉特例填充。

## Iteration and release workflow

- Before changing product content, structure, visual language, deployment behavior, or domain configuration, read `docs/rules/iteration-and-release.md`.
- The active iteration is recorded only in `docs/iterations/current.md`. Completed plans move to `docs/iterations/history/`; do not rewrite completed history.
- Use `./start-xingbuild.command` for the standard local startup path.
- Before saying an iteration is complete, run `npm run release:check`.
- After a stable iteration passes validation, create a local Git commit and matching version tag as the normal closeout action. This does not authorize a remote push or production deployment.
- GitHub remote creation and the first push require the user's authorization or an explicit execution request. Later pushes follow the release instruction for that iteration.
- Product-version publishing uses `./publish-xingbuild.command`; content-only publishing uses `./publish-content.command`. Both target the EdgeOne Makers project `xingbuild-nochina` (`makers-ze0f6txvlhco`). The user normally runs these commands manually. Codex must not publish, trigger a remote deployment, change DNS, or bind a production domain unless the user explicitly asks Codex to do so in the current task.
- The publish command must not contain API tokens or other credentials.
- Publishing is a separate state from implementation: code complete, locally verified, committed, deployed, domain active, and publicly verified must be reported separately.
- `xingbuild.top` is the canonical personal-site domain. `www.xingbuild.top` is reserved for redirecting to the canonical domain. `robotaxi.xingbuild.top` belongs to the independent Robotaxi deployment and must not be published from this repository.
- Every iteration completion report must include clickable links for the local preview (`http://127.0.0.1:4317/`) and production site (`https://xingbuild.top/`), while keeping local verification and production deployment status distinct.
