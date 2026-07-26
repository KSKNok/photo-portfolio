Caveman review codebase. Findings follow:

## Review
- Correct: Core logic solid. `fetchProducts` use cache and normalize data correctly. `addToCart` update `localStorage` and badge count correctly. `renderStore`, `renderGallery`, `renderCartPage` use escaping for security. `lightboxPrev` and `lightboxNext` handle wrapping correctly.
- Fixed: None. I only report findings.
- Blocker: None found. Code work as intended.
- Note: `setCopyrightYear` exist in both `common.js` and `modules/app.js`. Redundant logic.
- Note: `handleDialogTab` duplicated in `modules/modal.js` and `modules/lightbox.js`. Code smell.
- Note: `onReady` in `modules/app.js` large function. Hard to test.
- Note: `handleCartPageClick` and `handleCartModalClick` in `modules/cart.js` large functions with many side effects. Hard to test.
- Note: No tests exist in codebase. DOM coupling make unit testing hard.
- Note: Security good. Use `escapeHtml`, `escapeAttr`, and `encodeURIComponent`.

## Recommendations
### Immediate Fixes
- Remove `setCopyrightYear` from `modules/app.js` (already in `common.js`).
- Move `handleDialogTab` to `modules/modal.js` and export it. Import in `modules/lightbox.js` instead of duplicating.

### Optional Improvements
- Add unit tests for `modules/utils.js` (test `formatMoney`, `normalizeProduct`, `escapeHtml`).
- Refactor `onReady` in `modules/app.js` to use registry of init functions.
- Break down `handleCartPageClick` and `handleCartModalClick` into smaller handlers for specific actions (e.g., `handleQtyChange`, `handleRemoveItem`).