# HR Workflow Section Reorder Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Place the HR workflow section immediately after Planning in both the page and the staggered menu.

**Architecture:** Make a structural-only edit in `index.html`: move the existing `#hr-workflow` section without changing its contents, and move its existing menu item to the matching position. Keep every anchor, ID, class, and interaction hook intact.

**Tech Stack:** Static HTML, Vite 6, PowerShell verification.

## Global Constraints

- Preserve the existing `#hr-workflow` and `#planning` IDs.
- Do not change section contents, styles, or JavaScript behavior.
- Keep DOM order, visual order, menu order, and keyboard navigation order aligned.

---

### Task 1: Reorder the HR workflow section and menu item

**Files:**
- Modify: `index.html:42-59`
- Modify: `index.html:98-174`
- Modify: `index.html:281-344`

**Interfaces:**
- Consumes: Existing `href="#planning"`, `href="#hr-workflow"`, `id="planning"`, and `id="hr-workflow"` anchors.
- Produces: Menu and page DOM order where `planning` precedes `hr-workflow`, with anchors unchanged.

- [ ] **Step 1: Verify the current order fails the acceptance check**

Run:

```powershell
@'
const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
const menu = html.slice(html.indexOf('<ul class="sm-panel-list"'), html.indexOf('</ul>', html.indexOf('<ul class="sm-panel-list"')));
if (!(menu.indexOf('href="#planning"') < menu.indexOf('href="#hr-workflow"'))) throw new Error('Menu order is not Planning then Workflow');
if (!(html.indexOf('<section id="planning"') < html.indexOf('<section id="hr-workflow"'))) throw new Error('Section order is not Planning then Workflow');
'@ | node
```

Expected: FAIL with `Menu order is not Planning then Workflow`.

- [ ] **Step 2: Move the existing menu item**

Change the menu item order to:

```html
<li class="sm-panel-itemWrap">
  <a class="sm-panel-item" href="#works">
    <span class="sm-panel-itemLabel">Tweet</span>
  </a>
</li>
<li class="sm-panel-itemWrap">
  <a class="sm-panel-item" href="#planning">
    <span class="sm-panel-itemLabel">Planning</span>
  </a>
</li>
<li class="sm-panel-itemWrap">
  <a class="sm-panel-item" href="#hr-workflow">
    <span class="sm-panel-itemLabel">Workflow</span>
  </a>
</li>
```

- [ ] **Step 3: Move the existing HR workflow section**

Cut the complete block beginning with:

```html
<section id="hr-workflow" class="hr-workflow section-band section-band-hr" data-section>
```

and ending at its matching `</section>`, then insert it immediately after the closing `</section>` for `#planning` and before `#interactive`. Do not alter any content inside the moved block.

- [ ] **Step 4: Verify the new structural order**

Run the PowerShell/Node acceptance check from Step 1.

Expected: exit code `0` with no output.

- [ ] **Step 5: Build the project**

Run:

```powershell
npm run build
```

Expected: exit code `0` and Vite reports a successful production build.

- [ ] **Step 6: Review the diff**

Run:

```powershell
git diff --check
git diff -- index.html
```

Expected: no whitespace errors; the diff contains only the two intended moves.
