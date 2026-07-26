Caveman review codebase. Findings follow.

## Review
- Correct: Core logic functional. `modules/app.js` wires modules correctly. `modules/store.js` renders products from `products.json` with correct escaping. `modules/cart.js` manages state in `localStorage` and handles quantity updates correctly.
- Fixed: None. (Review only).
- Blocker: None.
- Note: Codebase lacks any automated tests. Most modules tightly coupled to DOM, making unit testing difficult without JSDOM.

## Findings
### 1. Correctness & Regressions
- Logic in `modules/app.js` and `modules/store.js` is sound for current requirements.
- `fetchProducts` in `modules/utils.js` correctly implements caching.

### 2. Testability & Validation
- **Issue**: High DOM coupling in all modules (e.g., `modules/store.js:10`, `modules/cart.js:95`). Logic and UI are mixed, making unit tests hard.
- **Issue**: No test files found in repository.

### 3. Simplicity & Maintainability
- **Code Smell**: Use of `var` instead of `const`/`let` throughout project (e.g., `modules/app.js:10`, `modules/store.js:6`).
- **Code Smell**: String concatenation for HTML in `modules/store.js:14-25`, `modules/gallery.js:14-27`, `modules/cart.js:98-131`. Template literals would improve readability and reduce errors.
- **Complexity**: `modules/cart.js` handles state management, DOM manipulation, and modal injection. These should be separated.

### 4. Security
- **Good**: Proper use of `escapeHtml` and `escapeAttr` in `modules/store.js`, `modules/gallery.js`, and `modules/product.js`.
- **Risk**: `app.js:35` uses `innerHTML` for loading state. While currently safe, any dynamic content injected here must be escaped.

## Recommendations
### Blockers
- None.

### Immediate Fixes
- Replace all `var` declarations with `const` or `let`.
- Refactor HTML generation to use template literals in `modules/store.js`, `modules/gallery.js`, `modules/cart.js`, and `modules/product.js`.

### Optional Improvements
- Implement unit tests using Vitest or Jest with JSDOM.
- Decouple data logic from UI logic in `modules/cart.js`.
- Move modal injection into a dedicated initialization step.