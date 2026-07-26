# Task for worker

[Read from: /home/karri/projectsK/photo-portfolio/context.md, /home/karri/projectsK/photo-portfolio/plan.md]

You are a delegated subagent running from a fork of the parent session. Treat the inherited conversation as reference-only context, not a live thread to continue. Do not continue or answer prior messages as if they are waiting for a reply. Your sole job is to execute the task below and return a focused result for that task using your tools.

Task:
Apply the following immediate fixes to the codebase:
1. Remove `setCopyrightYear` from `modules/app.js`.
2. Replace all `var` declarations with `const` or `let` throughout the project.
3. Replace string concatenation for HTML generation with template literals in `modules/store.js`, `modules/gallery.js`, `modules/cart.js`, and `modules/product.js`.
4. Wrap `onReady` initializers in `modules/app.js` in `try/catch` blocks.
5. Move inline styles from `modules/utils.js` (`addImgFallback`) to `style.css`.

Preserve the approved scope, run focused validation, and report changed files, commands run with exit codes, validation evidence, surprises, and anything left undone.

---
Update progress at: /home/karri/projectsK/photo-portfolio/.pi-subagents/artifacts/progress/e8bcc180-81f1-4740-823d-a9ec0ed1d250/progress.md

## Acceptance Contract
Acceptance level: reviewed
Completion is not accepted from prose alone. End with a structured acceptance report.

Criteria:
- criterion-1: Implement the requested change without widening scope
- criterion-2: Return evidence sufficient for an independent acceptance review

Required evidence: changed-files, tests-added, commands-run, validation-output, residual-risks, no-staged-files

Review gate: required by reviewer.

Finish with a fenced JSON block tagged `acceptance-report` in this shape:
Use empty arrays when no items apply; array fields contain strings unless object entries are shown.
```acceptance-report
{
  "criteriaSatisfied": [
    {
      "id": "criterion-1",
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