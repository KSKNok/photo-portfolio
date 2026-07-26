// Store module - product cards grid
import { escapeHtml, escapeAttr, addImgFallback, formatMoney, initReveal } from "./utils.js";

export function renderStore(products, container) {
  container.innerHTML = "";
  products.forEach((p) => {
    const a = document.createElement("a");
    a.className = "store-card reveal";
    a.href = `product.html?id=${encodeURIComponent(p.id)}`;
    a.innerHTML = `
      <div class="store-card__media">
        <img src="${escapeAttr(p.image)}" alt="${escapeAttr(p.title)}" loading="lazy" decoding="async" />
      </div>
      <div class="store-card__body">
        <h2>${escapeHtml(p.title)}</h2>
        <p class="store-card__meta">${escapeHtml(p.category)}</p>
        <p class="store-card__price">${formatMoney(p.priceCents, p.currency)}</p>
      </div>`;
    container.appendChild(a);
  });
  container.querySelectorAll(".store-card img").forEach((img) => {
    addImgFallback(img);
  });
  // Initialize reveal animations
  initReveal();
}
