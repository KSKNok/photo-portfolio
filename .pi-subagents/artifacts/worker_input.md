# Worker Task: Apply Code Quality Fixes

You are a delegated subagent running from a fork of the parent session. Treat the inherited conversation as reference-only context, NOT a live thread to continue. Do not continue or answer prior messages as if they are waiting for a reply. Your sole job is to execute the task below.

## Task

Apply the following code quality fixes to the photo-portfolio codebase at /home/karri/projectsK/photo-portfolio. Do NOT re-edit modules/store.js — it is already fixed.

### 1. Remove `setCopyrightYear` from `modules/app.js`
- Remove the `setCopyrightYear()` function definition (lines 11-16)
- Remove the `setCopyrightYear()` call from `onReady()` (it is already handled by `common.js`)

### 2. Replace ALL `var` declarations with `const` or `let` throughout all modules
- `const` for declarations that are never reassigned
- `let` for declarations that are reassigned (e.g., `newQty`, `offset`, `activeDialog` shadow variables)
- Apply to ALL modules: app.js, cart.js, gallery.js, product.js, coolgallery.js, modal.js, lightbox.js, utils.js

### 3. Replace string concatenation HTML generation with template literals
- modules/gallery.js: The article.innerHTML concatenation block
- modules/cart.js: Both `renderCartModalBody()` and `renderCartPage()` concatenation blocks
- modules/product.js: The `htmlContent` concatenation block  
- modules/coolgallery.js: Both `renderCoolGalleryCard()` and `renderCoolGalleryResults()` concatenation blocks
- modules/modal.js: The `wrap.innerHTML` concatenation blocks in `injectConfirmationModal()`, `injectCartModal()`, `injectComingSoonModal()`

### 4. Wrap `onReady` initializers in `modules/app.js` in try/catch blocks
Each page init function called from onReady should be wrapped in try/catch with error logging:
```js
try { initHome(); } catch (e) { console.error("initHome failed:", e); }
```

### 5. Move inline styles from `modules/utils.js` (`addImgFallback`) to `style.css`
- In `modules/utils.js`: Replace the inline style assignments in `addImgFallback` with a CSS class name like `img-fallback`
- In `style.css`: Add a `.img-fallback` rule (or nested rule) that includes all the inline styles currently in addImgFallback (background, min-height, display, align-items, justify-content, color)
- The `label` creation and styling in addImgFallback should stay as JS since it's dynamic content

### 6. Also fix `modules/app.js` `var` declarations:
- `var yearElements` → `const yearElements`
- `var header` → `const header`
- `var page` → `const page`
- `var active` → `const active`
- `var container` → `const container` (in initHome)
- `var masonry` → `const masonry` (in initHome)
- `var container` → `const container` (in initStorePage)
- `var grid` → `const grid` (in initStorePage)
- `var page` → `const page` (in onReady)

### IMPORTANT: Every call to `edit` MUST include the `path` parameter. Do not omit it. Focus on getting the edits done correctly. Do not make changes outside the approved scope.

After completing all edits, run these validation commands and report their output:
- `cd /home/karri/projectsK/photo-portfolio && grep -rn "var " modules/` (should return no results)
- `cd /home/karri/projectsK/photo-portfolio && grep -n "setCopyrightYear" modules/app.js` (should return no results, confirming removal)
- `cd /home/karri/projectsK/photo-portfolio && wc -l modules/*.js`

Report changed files, commands run with exit codes, validation output, surprises, and anything left undone. End with an acceptance report in fenced JSON format matching the acceptance contract.

## Acceptance Contract
Acceptance level: checked
Completion is not accepted from prose alone. End with a structured acceptance report.

Criteria:
- criterion-1: Implement the requested change without widening scope
- criterion-2: Return evidence sufficient for an independent acceptance review

Required evidence: changed-files, tests-added, commands-run, residual-risks, no-staged-files

Review gate: required by reviewer.

Finish with a fenced JSON block tagged `acceptance-report` in this shape:
Use empty arrays when no items apply; array fields contain strings unless object entries are shown.
`criteriaSatisfied[].status` must be exactly one of: satisfied, not-satisfied, not-applicable.
`commandsRun[].result` must be exactly one of: passed, failed, not-run.
`manualNotes` and `notes` are optional strings; an empty string means no note and does not satisfy `manual-notes` evidence.
\`\`\`acceptance-report
{
  "criteriaSatisfied": [
    {
      "id": "criterion-1",
      "status": "satisfied",
      "evidence": "specific proof"
    },
    {
      "id": "criterion-2",
      "status": "satisfied",
      "evidence": "specific proof"
    }
  ],
  "changedFiles": [
    "src/file.ts"
  ],
  "testsAddedOrUpdated": [
    "test/file.test.ts"
  ],
  "commandsRun": [
    {
      "command": "command",
      "result": "passed",
      "summary": "short result"
    }
  ],
  "validationOutput": [
    "validation output or concise summary"
  ],
  "residualRisks": [
    "none"
  ],
  "noStagedFiles": true,
  "diffSummary": "short description of the diff",
  "reviewFindings": [
    "blocker: file.ts:12 - issue found, or no blockers"
  ],
  "manualNotes": "anything else the parent should know"
}
\`\`\`