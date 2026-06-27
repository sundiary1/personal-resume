# Editorial Collage Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将现有个人作品集改造成暖调流行色的编辑拼贴风，同时保留全部内容、图片、核心交互、响应式能力和无障碍基础。

**Architecture:** 保持现有静态站点结构，通过少量语义化 HTML 钩子、集中 CSS 设计变量和既有交互脚本完成改造。使用 Node 内置 `assert` 编写零依赖结构烟雾测试，浏览器负责布局、动效和交互验收。

**Tech Stack:** HTML5、CSS3、原生 JavaScript、现有 GSAP 3.12.5、现有 Matter.js 0.20.0、Node.js 内置测试能力、Python 本地静态服务器。

## Global Constraints

- 继续使用现有 `index.html`、`styles.css` 和 `script.js` 静态结构，不引入框架或构建工具。
- 保留现有文案、作品图片、作品顺序和联系方式。
- 保留导航、关键词互动、头像还原、轮播、弧形画廊和图片弹窗。
- 暖白为主背景，珊瑚粉为主强调色，亮紫与明黄为辅助色，深黑用于文字、边框和硬阴影。
- 移动端不得出现横向溢出；`prefers-reduced-motion` 下关闭非必要动画。

## File Map

- `index.html`：保留内容和交互属性，补充期刊元信息、装饰性钩子和语义化样式类，移除内联配色。
- `styles.css`：承载全部编辑拼贴视觉系统、响应式布局、状态样式和减少动态规则。
- `script.js`：保留核心交互，移除旧光晕效果并收敛区块视差幅度。
- `tests/smoke.mjs`：检查关键内容、资源数量、必要 DOM 钩子、核心交互入口和视觉约束是否存在。

---

### Task 1: Semantic Hooks and Content-Protection Tests

**Files:**
- Create: `tests/smoke.mjs`
- Modify: `index.html:17-75`
- Modify: `index.html:79-134`
- Modify: `index.html:258-315`
- Modify: `index.html:345-352`

**Interfaces:**
- Consumes: 当前 `index.html` 的文案、`data-*` 交互属性和 13 个 `data-full` 图片入口。
- Produces: `.issue-meta`、`.cover-kicker`、`.nav-card--ink`、`.nav-card--violet`、`.nav-card--coral`、`.showcase-title`、`.contact-stamp` 样式钩子；后续 CSS 任务依赖这些类名。

- [ ] **Step 1: Write the failing structural smoke test**

```js
// tests/smoke.mjs
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const css = readFileSync(new URL("../styles.css", import.meta.url), "utf8");
const js = readFileSync(new URL("../script.js", import.meta.url), "utf8");

const requiredCopy = [
  "周天",
  "HR工作流程建设",
  "公众号排版及AI协作",
  "感谢观看！",
  "zt2693689898@163.com",
  "18921969478（微信同号）",
];
requiredCopy.forEach((copy) => assert.ok(html.includes(copy), `missing copy: ${copy}`));

assert.equal((html.match(/data-full=/g) ?? []).length, 13, "all 13 image viewer entries must remain");
assert.ok(html.includes('class="issue-meta"'));
assert.ok(html.includes('class="cover-kicker"'));
assert.ok(html.includes("nav-card--ink"));
assert.ok(html.includes("nav-card--violet"));
assert.ok(html.includes("nav-card--coral"));
assert.ok(html.includes('class="showcase-title"'));
assert.ok(html.includes('class="contact-stamp"'));
assert.equal((html.match(/style="/g) ?? []).length, 0, "visual rules belong in styles.css");

["[data-falling-text]", "[data-reset-falling-text]", ".carousel-wrap", ".circular-gallery", "[data-full]"].forEach(
  (selector) => assert.ok(js.includes(selector), `missing interaction selector: ${selector}`),
);

assert.ok(css.includes("@media (prefers-reduced-motion: reduce)"));
console.log("smoke checks passed");
```

- [ ] **Step 2: Run the smoke test and verify it fails on missing editorial hooks**

Run: `node tests/smoke.mjs`

Expected: FAIL on `class="issue-meta"` because the new markup has not been added yet.

- [ ] **Step 3: Add semantic editorial hooks without changing portfolio copy**

Replace the three inline nav-card styles with:

```html
<section class="nav-card nav-card--ink">
<section class="nav-card nav-card--violet">
<section class="nav-card nav-card--coral">
```

Insert this as the first child of `.hero`:

```html
<div class="issue-meta" aria-hidden="true">
  <span>PORTFOLIO / 2026</span>
  <span>PEOPLE · CONTENT · AI</span>
</div>
```

Insert this immediately before `.falling-text-container`:

```html
<p class="cover-kicker" aria-hidden="true">Selected practice and experiments</p>
```

Replace the inline-styled showcase heading with:

```html
<h3 class="showcase-title">AI+公众号排版</h3>
```

Insert this as the final child of `#contact`:

```html
<span class="contact-stamp" aria-hidden="true">LET'S TALK ↗</span>
```

- [ ] **Step 4: Run structural smoke test**

Run: `node tests/smoke.mjs`

Expected: `smoke checks passed`

- [ ] **Step 5: Commit the semantic baseline**

```powershell
git add index.html tests/smoke.mjs
git commit -m "test: protect portfolio content and structure"
```

---

### Task 2: Palette, Navigation, and Magazine-Cover Hero

**Files:**
- Modify: `tests/smoke.mjs`
- Modify: `styles.css:1-375`

**Interfaces:**
- Consumes: Task 1 的 `.issue-meta`、`.cover-kicker` 和三种 `.nav-card--*` 类。
- Produces: `--paper`、`--paper-light`、`--ink`、`--coral`、`--pink`、`--violet`、`--yellow`、`--hard-shadow` 设计令牌，以及导航与首页封面样式。

- [ ] **Step 1: Extend the smoke test with exact palette contracts**

Append before the final `console.log` in `tests/smoke.mjs`:

```js
const paletteContracts = [
  "--paper: #f4eadf",
  "--paper-light: #fff8ef",
  "--ink: #17151c",
  "--coral: #ff6b5e",
  "--pink: #ff5cad",
  "--violet: #7452ff",
  "--yellow: #ffd83d",
  "--hard-shadow: 8px 8px 0 var(--ink)",
];
paletteContracts.forEach((contract) => assert.ok(css.includes(contract), `missing palette contract: ${contract}`));
```

- [ ] **Step 2: Run the test and verify the old palette fails**

Run: `node tests/smoke.mjs`

Expected: FAIL with `missing palette contract: --paper: #f4eadf`.

- [ ] **Step 3: Replace root tokens and global background**

Use these root variables and background rules at the start of `styles.css`:

```css
:root {
  --paper: #f4eadf;
  --paper-light: #fff8ef;
  --paper-deep: #e7d6c7;
  --ink: #17151c;
  --muted: #69616b;
  --coral: #ff6b5e;
  --pink: #ff5cad;
  --violet: #7452ff;
  --yellow: #ffd83d;
  --white: #fff8ef;
  --line: rgba(23, 21, 28, 0.42);
  --hard-shadow: 8px 8px 0 var(--ink);
  --soft-shadow: 0 22px 60px rgba(23, 21, 28, 0.16);
}

body {
  min-height: 100vh;
  margin: 0;
  overflow-x: hidden;
  background:
    linear-gradient(rgba(23, 21, 28, 0.035) 1px, transparent 1px),
    linear-gradient(90deg, rgba(23, 21, 28, 0.028) 1px, transparent 1px),
    var(--paper);
  background-size: 32px 32px;
  color: var(--ink);
  font-family: "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif;
}

.grain {
  position: fixed;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  opacity: 0.22;
  background-image: radial-gradient(rgba(23, 21, 28, 0.22) 0.55px, transparent 0.7px);
  background-size: 5px 5px;
  mask-image: linear-gradient(to bottom, #000, transparent 94%);
}
```

- [ ] **Step 4: Restyle navigation as a magazine index**

Apply these contracts to the existing navigation selectors:

```css
.card-nav {
  height: 60px;
  overflow: hidden;
  border: 2px solid var(--ink);
  border-radius: 0;
  background: var(--paper-light);
  box-shadow: 6px 6px 0 var(--ink);
}

.nav-card { border-radius: 0; border: 1px solid var(--ink); }
.nav-card--ink { background: var(--ink); color: var(--paper-light); }
.nav-card--violet { background: var(--violet); color: var(--paper-light); }
.nav-card--coral { background: var(--coral); color: var(--ink); }

.card-nav-cta-button {
  border: 1px solid var(--ink);
  border-radius: 0;
  background: var(--yellow);
  color: var(--ink);
  box-shadow: 3px 3px 0 var(--ink);
  text-transform: uppercase;
}
```

- [ ] **Step 5: Build the asymmetric magazine-cover hero**

Apply these rules while retaining the existing grid and falling-text mechanics:

```css
.hero {
  position: relative;
  min-height: 100vh;
  padding: 122px 0 72px;
  isolation: isolate;
}

.hero::before,
.hero::after {
  position: absolute;
  z-index: -1;
  content: "";
  pointer-events: none;
}

.hero::before {
  top: 15%;
  right: 4%;
  width: clamp(180px, 24vw, 360px);
  aspect-ratio: 0.78;
  background: var(--pink);
  clip-path: polygon(10% 0, 100% 12%, 86% 100%, 0 84%);
  transform: rotate(7deg);
}

.hero::after {
  right: 22%;
  bottom: 9%;
  width: clamp(120px, 17vw, 250px);
  aspect-ratio: 1;
  border-radius: 50%;
  background: var(--yellow);
  mix-blend-mode: multiply;
}

.issue-meta {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  border-top: 2px solid var(--ink);
  border-bottom: 1px solid var(--ink);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.12em;
}

.cover-kicker,
.eyebrow,
.work-number {
  color: var(--ink);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.falling-text-target {
  color: var(--ink);
  font-family: Georgia, "Noto Serif SC", "Songti SC", serif;
  font-size: clamp(30px, 4.5vw, 66px);
  line-height: 0.96;
}

.falling-text-target .word:nth-child(4n + 2) { color: var(--violet); }
.falling-text-target .word:nth-child(4n + 3),
.falling-text-target .highlighted { color: var(--coral); }
.falling-text-target .word-name { color: var(--ink); font-size: clamp(58px, 9vw, 132px); }

.profile-card img {
  border: 3px solid var(--ink);
  border-radius: 0;
  background: var(--paper-light);
  box-shadow: var(--hard-shadow);
  transform: rotate(2.5deg);
}
```

- [ ] **Step 6: Run automated checks**

Run: `node tests/smoke.mjs`

Expected: `smoke checks passed`

- [ ] **Step 7: Commit global visual system**

```powershell
git add styles.css tests/smoke.mjs
git commit -m "feat: add editorial palette and cover hero"
```

---

### Task 3: Editorial Sections, Project Cards, Gallery, and Back Cover

**Files:**
- Modify: `tests/smoke.mjs`
- Modify: `styles.css:376-760`
- Modify: `styles.css:761-1040`

**Interfaces:**
- Consumes: Task 2 的颜色令牌、硬阴影、字体层级和现有 `.section-band`、`.workflow-*`、`.work-*`、`.circular-*`、`.about`、`.contact` 结构。
- Produces: 全站编辑网格、拼贴卡片、纸片画廊、附录式关于区、封底式联系区和移动端单列回退。

- [ ] **Step 1: Add selector and responsive contracts to the smoke test**

Append before the final `console.log` in `tests/smoke.mjs`:

```js
const editorialSelectors = [
  ".section-band-hr",
  ".section-band-works",
  ".workflow-card:nth-child(2)",
  ".work-card:nth-child(even)",
  ".circular-card:nth-child(3n + 2)",
  ".showcase-title",
  ".contact-stamp",
  "@media (max-width: 780px)",
];
editorialSelectors.forEach((selector) => assert.ok(css.includes(selector), `missing editorial selector: ${selector}`));
```

- [ ] **Step 2: Run the test and verify the new card contracts fail**

Run: `node tests/smoke.mjs`

Expected: FAIL with `missing editorial selector: .work-card:nth-child(even)`.

- [ ] **Step 3: Convert section bands and headings to editorial spreads**

Use these rules as the section foundation:

```css
.section-band {
  position: relative;
  isolation: isolate;
  border-top: 2px solid var(--ink);
}

.section-band::before {
  inset: 0 calc(50% - 50vw);
  background: var(--band-bg);
  background-size: auto;
  clip-path: inset(7% 0);
}

.section-band-hr { --band-bg: linear-gradient(108deg, var(--paper-light) 0 72%, rgba(255, 216, 61, 0.62) 72%); }
.section-band-works { --band-bg: linear-gradient(74deg, rgba(255, 92, 173, 0.16) 0 28%, var(--paper) 28%); }
.section-band-about { --band-bg: linear-gradient(120deg, var(--paper-light), rgba(116, 82, 255, 0.13)); }
.section-band-contact { --band-bg: var(--coral); }

.section-heading {
  grid-template-columns: minmax(130px, 0.28fr) minmax(0, 1fr);
  align-items: start;
  padding-top: 18px;
}

.section-heading h2,
.about h2,
.contact h2,
.showcase-title {
  font-family: Georgia, "Noto Serif SC", "Songti SC", serif;
  font-weight: 400;
  letter-spacing: -0.05em;
}
```

- [ ] **Step 4: Restyle workflow and project cards as controlled collage pieces**

```css
.workflow-card,
.work-card {
  position: relative;
  border-top: 2px solid var(--ink);
}

.workflow-card:nth-child(2) { transform: translateY(42px); }
.workflow-card:nth-child(3) { grid-column: 1 / -1; width: min(74%, 920px); justify-self: center; }
.work-card:nth-child(even) { transform: translateX(clamp(0px, 2vw, 28px)); }

.workflow-visual,
.work-image,
.carousel-wrap {
  border: 2px solid var(--ink);
  background: var(--paper-light);
  box-shadow: var(--hard-shadow);
}

.workflow-card:nth-child(odd) .workflow-visual { transform: rotate(-1.2deg); }
.workflow-card:nth-child(even) .workflow-visual { transform: rotate(1.2deg); }

.workflow-copy li,
.work-copy li {
  border: 1px solid var(--ink);
  border-radius: 0;
  background: var(--yellow);
  color: var(--ink);
  font-weight: 700;
  box-shadow: 2px 2px 0 var(--ink);
}

.work-copy h3,
.workflow-copy h3 {
  font-family: Georgia, "Noto Serif SC", "Songti SC", serif;
  letter-spacing: -0.04em;
}
```

- [ ] **Step 5: Restyle gallery, about, contact, and viewer**

```css
.showcase-title { margin: 54px 0 0; font-size: clamp(34px, 5vw, 68px); text-align: center; }
.circular-gallery::before { background: linear-gradient(90deg, var(--paper), transparent); }
.circular-gallery::after { background: linear-gradient(270deg, var(--paper), transparent); }
.circular-card { border: 2px solid var(--ink); border-radius: 0; box-shadow: 6px 6px 0 var(--ink); }
.circular-card:nth-child(3n + 2) { background: var(--yellow); }
.circular-card:nth-child(3n) { background: var(--violet); }

.about-grid article {
  border: 2px solid var(--ink);
  background: var(--paper-light);
  box-shadow: 5px 5px 0 var(--ink);
}
.about-grid article:nth-child(2) { background: var(--yellow); transform: rotate(1deg); }
.about-grid article:nth-child(3) { background: var(--pink); transform: rotate(-1deg); }

.contact { position: relative; color: var(--ink); }
.contact-stamp {
  justify-self: end;
  align-self: end;
  padding: 12px 16px;
  border: 2px solid var(--ink);
  background: var(--yellow);
  box-shadow: 4px 4px 0 var(--ink);
  font-size: 12px;
  font-weight: 800;
  transform: rotate(-3deg);
}

.viewer { border: 2px solid var(--ink); background: var(--paper); box-shadow: 12px 12px 0 rgba(23, 21, 28, 0.72); }
.viewer-bar { border-bottom: 2px solid var(--ink); background: var(--yellow); }
.viewer-close { border: 2px solid var(--ink); border-radius: 0; box-shadow: 3px 3px 0 var(--ink); }
```

- [ ] **Step 6: Add explicit mobile de-collaging rules**

Inside the existing `@media (max-width: 780px)` block, include:

```css
.issue-meta { gap: 12px; font-size: 9px; }
.hero::before { right: -18%; width: 58vw; opacity: 0.64; }
.hero::after { right: 2%; bottom: 18%; opacity: 0.72; }
.workflow-card:nth-child(2),
.workflow-card:nth-child(3),
.work-card:nth-child(even) { grid-column: auto; width: auto; transform: none; }
.workflow-card:nth-child(odd) .workflow-visual,
.workflow-card:nth-child(even) .workflow-visual { transform: none; }
.about-grid article,
.about-grid article:nth-child(2),
.about-grid article:nth-child(3) { transform: none; }
.contact-stamp { justify-self: start; }
```

- [ ] **Step 7: Run automated checks**

Run: `node tests/smoke.mjs`

Expected: `smoke checks passed`

- [ ] **Step 8: Commit complete section styling**

```powershell
git add styles.css tests/smoke.mjs
git commit -m "feat: style portfolio as editorial collage"
```

---

### Task 4: Motion Cleanup and Interaction Preservation

**Files:**
- Modify: `tests/smoke.mjs`
- Modify: `script.js:40-66`
- Modify: `script.js:467-510`
- Modify: `styles.css:1041-1120`

**Interfaces:**
- Consumes: 现有 IntersectionObserver、Matter.js、GSAP、轮播、画廊和 viewer 逻辑。
- Produces: 最大 8px 的克制区块视差、无旧式鼠标光晕、短促揭示动画和完整的减少动态覆盖。

- [ ] **Step 1: Add motion and interaction preservation assertions**

Append before the final `console.log` in `tests/smoke.mjs`:

```js
assert.ok(!js.includes("cursorGlow"), "legacy cursor glow must be removed");
assert.ok(!js.includes('glow.className = "cursor-glow"'), "legacy cursor glow node must be removed");
assert.ok(js.includes("Math.max(-8, Math.min(8"), "section parallax must stay within 8px");
[
  "function resetText()",
  "function startFalling()",
  "function toggleMenu()",
  "function openViewer(button)",
  "function goTo(index)",
  "function circularGallery()",
].forEach((signature) => assert.ok(js.includes(signature), `missing core interaction: ${signature}`));
```

- [ ] **Step 2: Run the test and verify legacy motion fails**

Run: `node tests/smoke.mjs`

Expected: FAIL with `legacy cursor glow must be removed`.

- [ ] **Step 3: Reduce section parallax amplitude**

Replace the shift calculation in `sectionParallax()` with:

```js
const shift = Math.max(-8, Math.min(8, distance * -10));
```

- [ ] **Step 4: Remove the complete cursorGlow IIFE**

Delete the block beginning with:

```js
/* ───── 光标光晕 ───── */
(function cursorGlow() {
```

and ending with its matching `})();` immediately before the carousel block. Do not alter the carousel IIFE that follows.

- [ ] **Step 5: Make reveal motion short and editorial**

Replace the reveal transition rules with:

```css
[data-reveal] {
  opacity: 0;
  transform: translateY(18px) rotate(0.25deg);
  transition: opacity 520ms ease, transform 620ms cubic-bezier(0.2, 0.75, 0.2, 1);
}

[data-reveal].is-visible {
  opacity: 1;
  transform: translateY(0) rotate(0);
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    scroll-behavior: auto !important;
    animation-duration: 1ms !important;
    transition-duration: 1ms !important;
    transition-delay: 0ms !important;
  }
  [data-reveal],
  .section-band > *,
  .workflow-card,
  .work-card,
  .profile-card img {
    opacity: 1 !important;
    transform: none !important;
  }
}
```

- [ ] **Step 6: Run automated checks**

Run: `node tests/smoke.mjs`

Expected: `smoke checks passed`

- [ ] **Step 7: Commit motion cleanup**

```powershell
git add script.js styles.css tests/smoke.mjs
git commit -m "refactor: align motion with editorial direction"
```

---

### Task 5: Browser Verification Across Desktop, Mobile, and Reduced Motion

**Files:**
- Verify: `index.html`
- Verify: `styles.css`
- Verify: `script.js`
- Verify: `assets/**`

**Interfaces:**
- Consumes: Tasks 1–4 的完整静态站点。
- Produces: 可交付的浏览器验证证据；本任务不增加新功能。

- [ ] **Step 1: Run all automated checks**

Run: `node tests/smoke.mjs`

Expected: `smoke checks passed`

- [ ] **Step 2: Start a local server**

Run:

```powershell
$python = (Get-Command python).Source
Start-Process -FilePath $python -ArgumentList '-m','http.server','8765','--bind','127.0.0.1' -WorkingDirectory (Get-Location) -WindowStyle Hidden
```

Expected: `http://127.0.0.1:8765/index.html` responds with the portfolio page.

- [ ] **Step 3: Verify desktop layout at 1280 × 720**

In the in-app browser, open `http://127.0.0.1:8765/index.html`, set the viewport to 1280 × 720, and evaluate:

```js
({
  noHorizontalOverflow: document.documentElement.scrollWidth <= window.innerWidth,
  imagesLoaded: [...document.images].every((img) => img.complete && img.naturalWidth > 0),
  background: getComputedStyle(document.body).backgroundColor,
  navVisible: !!document.querySelector(".card-nav"),
})
```

Expected:

```js
{
  noHorizontalOverflow: true,
  imagesLoaded: true,
  background: "rgb(244, 234, 223)",
  navVisible: true
}
```

- [ ] **Step 4: Verify navigation, carousel, viewer, and reset controls**

Perform these checks in order:

1. Click `.hamburger-menu`; expect `aria-expanded="true"` and `.card-nav.open`.
2. Click `.carousel-next`; expect the second `.carousel-slide` to own `.is-active`.
3. Click the active `[data-full]`; expect `.viewer[open]` and a non-empty `#viewerImage[src]`.
4. Click `.viewer-close`; expect the dialog to close.
5. Trigger `[data-falling-text]`, then click `[data-reset-falling-text]`; expect all `.word` nodes to be visible in the original container.

- [ ] **Step 5: Verify mobile layout at 390 × 844**

Set the viewport to 390 × 844, reload, and evaluate:

```js
({
  noHorizontalOverflow: document.documentElement.scrollWidth <= window.innerWidth,
  workflowColumns: getComputedStyle(document.querySelector(".workflow-grid")).gridTemplateColumns,
  workColumns: getComputedStyle(document.querySelector(".work-card")).gridTemplateColumns,
  menuButtonVisible: getComputedStyle(document.querySelector(".hamburger-menu")).display !== "none",
})
```

Expected: `noHorizontalOverflow` and `menuButtonVisible` are `true`; `workflowColumns` and `workColumns` each describe one column.

- [ ] **Step 6: Verify reduced-motion behavior**

Emulate `prefers-reduced-motion: reduce`, reload, and verify:

```js
({
  revealTransform: getComputedStyle(document.querySelector("[data-reveal]")).transform,
  revealOpacity: getComputedStyle(document.querySelector("[data-reveal]")).opacity,
})
```

Expected: `{ revealTransform: "none", revealOpacity: "1" }`.

- [ ] **Step 7: Verify console and repository state**

Check browser console: expected zero uncaught errors.

Run:

```powershell
git diff --check
git status --short
```

Expected: `git diff --check` returns no output. `git status --short` lists only intentional implementation changes, or no output after prior commits.

- [ ] **Step 8: Commit verification-only corrections if any were required**

If no correction was needed, do not create an empty commit. If a verified correction was made, stage only the corrected project files and commit:

```powershell
git add index.html styles.css script.js tests/smoke.mjs
git commit -m "fix: resolve responsive editorial polish issues"
```
