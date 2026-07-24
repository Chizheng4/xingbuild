# xingbuild design QA

## Comparison target

- Desktop source visual truth: `/Users/kingjin/.codex/generated_images/019f936f-6fa2-7731-88ba-6325fb7973de/call_i2kLacguGN3MEeipzjDirKF9.png`
- Mobile source visual truth: `/Users/kingjin/.codex/generated_images/019f936f-6fa2-7731-88ba-6325fb7973de/call_xauulRQZh5vrD1MxPUPHSqgg.png`
- Desktop implementation screenshot: `/Users/kingjin/Documents/Builder/xingbuild/qa-desktop-viewport-final.png`
- Mobile implementation screenshot: `/Users/kingjin/Documents/Builder/xingbuild/qa-mobile-viewport-final.png`
- Desktop combined comparison: `docs/qa/desktop-viewport-comparison-final.png`
- Mobile combined comparison: `docs/qa/mobile-viewport-comparison-final.png`

## Viewports and normalization

- Desktop source: 1536 × 1024 px.
- Desktop implementation: browser viewport 1440 × 1024 CSS px, captured at 1425 × 1013 px after the browser scrollbar region, device pixel ratio 1.
- Mobile source: 864 × 1821 px.
- Mobile implementation: browser viewport 390 × 844 CSS px, captured at 375 × 812 px after the browser scrollbar and chrome regions, device pixel ratio 1.
- Combined comparisons normalize each side to the same column width and compare the same top-of-page state. Full-page browser tiling was not used as final evidence because the browser repeated long-page tiles; section structure and lower-page content were checked through DOM and focused navigation instead.

## State and interactions tested

- Initial page opens at the top with no forced hash or scroll offset.
- Top-level navigation contains only `作品` and `关于我`.
- `关于我` updates the hash to `#about` and scrolls to the correct section.
- `进入作品` expands the Robotaxi description and changes `aria-expanded` from `false` to `true`.
- Desktop uses the horizontal operating-loop diagram.
- Mobile switches to the compact sans-serif hierarchy and vertical operating flow.
- Desktop and mobile show no horizontal page overflow.
- Browser console contained no errors.

## Required fidelity surfaces

- Fonts and typography: desktop uses a restrained Chinese serif hierarchy and mobile uses a compact sans-serif hierarchy. System fallbacks are retained for reliability. Weight, wrapping and hierarchy match the chosen directions closely.
- Spacing and layout rhythm: desktop was compressed after the first comparison so the two works and about entry occupy a similar editorial rhythm to the source. Mobile hero spacing and size were reduced after the first comparison.
- Colors and visual tokens: warm desktop paper/ink/rust and white mobile/ink/blue tokens match the two chosen directions.
- Image quality and asset fidelity: the selected designs contain no required photography or illustration assets. Architecture graphics are intentionally responsive, semantic system diagrams.
- Copy and content: title, two works, Robotaxi evidence boundary, framework planes and about summary match the approved information architecture.

## Comparison history

### Iteration 1

- [P1] Initial route replaced the empty hash with `#works`, which could open the site below the hero.
  - Fix: removed hash mutation from application startup.
  - Post-fix evidence: desktop and mobile browser checks both reported empty hash and `scrollY: 0`.
- [P2] Desktop implementation used substantially more vertical space than the selected desktop direction.
  - Fix: reduced header and hero height, headline scale, work-section padding, architecture-node height and about spacing.
  - Post-fix evidence: `docs/qa/desktop-viewport-comparison-final.png`.
- [P2] Mobile hero dominated too much of the initial viewport.
  - Fix: reduced mobile headline scale and hero/version spacing while keeping the compact Swiss direction.
  - Post-fix evidence: `docs/qa/mobile-viewport-comparison-final.png`.

## Findings

No actionable P0, P1 or P2 visual differences remain for this v0.1 scope.

## Follow-up polish

- [P3] Replace the current framework 2 × 2 desktop layout with a four-layer layout if later content confirms that the learning path should dominate over compactness.
- [P3] Add active-section navigation state after the site gains longer work and about pages.
- [P3] Revisit final font delivery when the public hosting region and performance budget are confirmed.

## final result: passed
