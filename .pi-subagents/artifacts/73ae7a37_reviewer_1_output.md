Caveman review done. Code mostly solid, but some smells found.

## Review
- Correct: `modules/utils.js` handles HTML escaping and attribute escaping correctly for XSS prevention.
- Correct: `modules/cart.js` correctly manages `localStorage` for cart persistence and handles quantity logic.
- Correct: `modules/app.js` correctly routes initialization based on `data-page` attribute.
- Note: `modules/app.js` is becoming "god file" for page initialization. As project grows, this will be hard to maintain.
- Note: Heavy reliance on DOM manipulation (`innerHTML`, `createElement`) makes unit testing difficult. No tests currently exist in repository.
- Note: `modules/store.js` and `modules/gallery.js` use string concatenation for HTML blocks. Template literals would be cleaner and safer.
- Note: `fetchProducts` in `utils.js` caches products indefinitely. If `products.json` changes, user must refresh page.
- Note: `initReveal` is called multiple times across modules. While functional (it observes elements with `.reveal`), it's redundant logic.

## Blockers
- None found. Code functions as intended for current requirements.

## Immediate Fixes
- None required for functionality.

## Optional Improvements
- Add unit tests for `modules/utils.js` (e.g., `formatMoney`, `escapeHtml`).
- Refactor `app.js` to delegate page-specific initialization to separate modules.
- Replace string concatenation in `renderStore` and `renderGallery` with template literals.
- Implement cache invalidation or "refresh" mechanism for `fetchProducts`.