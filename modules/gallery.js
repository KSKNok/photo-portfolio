// Gallery module - home page masonry grid
import { escapeHtml, escapeAttr, addImgFallback, initReveal } from "./utils.js";
import { openLightbox } from "./lightbox.js";

export function renderGallery(products, container) {
  container.innerHTML = "";
  products.forEach((p, i) => {
    const article = document.createElement("article");
    article.className = "gallery-item reveal";
    article.innerHTML = `
      <button type="button" class="gallery-open" data-index="${i}">
        <img src="${escapeAttr(p.image)}" alt="${escapeAttr(p.title)}" loading="lazy" decoding="async" />
      </button>
      <figcaption>
        <p class="title">${escapeHtml(p.title)}</p>
        <span class="category">${escapeHtml(p.category)}</span>
      </figcaption>`;
    container.appendChild(article);
  });

  container.querySelectorAll(".gallery-open").forEach((btn) => {
    btn.addEventListener("click", () => {
      const idx = parseInt(btn.getAttribute("data-index"), 10);
      openLightbox(products, idx);
    });
    addImgFallback(btn.querySelector("img"));
  });
  // Initialize reveal animations
  initReveal();
}
