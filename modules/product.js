// Product detail page module
import { escapeHtml, escapeAttr, addImgFallback, fetchProducts, formatMoney } from "./utils.js";
import { addToCart } from "./cart.js";

export function initProductPage() {
  const root = document.getElementById("product-root");
  if (!root) return;

  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");

  if (!id || typeof id !== "string") {
    root.innerHTML = '<p class="error-state">Missing product ID. <a href="store.html">Back to store</a></p>';
    return;
  }

  root.innerHTML = '<p class="loading-state">Loading…</p>';
  fetchProducts()
    .then((products) => {
      const p = products.find((x) => x.id === id);
      if (!p) {
        root.innerHTML = '<p class="error-state">Print not found. <a href="store.html">Back to store</a></p>';
        return;
      }

      document.title = p.title + " — AL";

      // Inject JSON-LD for SEO
      const ld = document.createElement("script");
      ld.type = "application/ld+json";
      ld.textContent = JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Product",
        "name": p.title,
        "image": p.image,
        "description": p.description,
        "offers": {
          "@type": "Offer",
          "price": (p.priceCents / 100).toString(),
          "priceCurrency": p.currency,
          "availability": "https://schema.org/InStock"
        }
      });
      document.head.appendChild(ld);

      root.innerHTML = `
        <div class="product-layout">
          <div class="product-hero">
            <img src="${escapeAttr(p.image)}" alt="${escapeAttr(p.title)}" loading="lazy" decoding="async" />
          </div>
          <div class="product-detail">
            <p class="eyebrow">${escapeHtml(p.category)}</p>
            <h1 style="font-size: clamp(1.75rem, 4vw, 2.25rem); margin: 0 0 0.5rem; line-height: 1.2;">${escapeHtml(p.title)}</h1>
            <p class="price">${formatMoney(p.priceCents, p.currency)}</p>
            <p class="description">${escapeHtml(p.description)}</p>
            <div class="btn-row">
              <button type="button" class="btn btn--primary" data-add-print data-id="${escapeAttr(p.id)}" data-size="default">Add to cart</button>
            </div>
          </div>
        </div>`;

      const addBtn = root.querySelector("[data-add-print]");
      if (addBtn) {
        addBtn.addEventListener("click", () => {
          addToCart(p, 1);
        });
      }
      const prodImg = root.querySelector(".product-hero img");
      if (prodImg) addImgFallback(prodImg);
    })
    .catch((error) => {
      console.error("Failed to load product:", error);
      root.innerHTML = '<p class="error-state">Could not load product.</p>';
    });
}
