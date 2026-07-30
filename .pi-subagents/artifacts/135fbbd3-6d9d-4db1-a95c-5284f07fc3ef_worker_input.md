# Task for worker

You are a delegated subagent running from a fork of the parent session. Treat the inherited conversation as reference-only context, not a live thread to continue. Do not continue or answer prior messages as if they are waiting for a reply. Your sole job is to execute the task below and return a focused result for that task using your tools.

Task:
Apply the following code quality fixes to the photo-portfolio codebase at /home/karri/projectsK/photo-portfolio. modules/store.js has already been fixed (template literals, const/let). Do NOT re-edit store.js. Apply fixes to the remaining files:

1. Remove `setCopyrightYear` from `modules/app.js` (it is already handled by `common.js`).
2. Replace ALL `var` declarations with `const` or `let` throughout all modules.
3. Replace string concatenation HTML generation with template literals in `modules/gallery.js`, `modules/cart.js`, `modules/product.js`, `modules/coolgallery.js`, and `modules/modal.js`.
4. Wrap `onReady` initializers in `modules/app.js` in `try/catch` blocks (each page init function called from onReady should be wrapped).
5. Move inline styles from `modules/utils.js` (`addImgFallback` function) to `style.css` by adding a CSS class.

IMPORTANT: Every call to `edit` MUST include the `path` parameter. Do not omit it. Focus on getting the edits done correctly. Do not make changes outside the approved scope.

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
```acceptance-report
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
```