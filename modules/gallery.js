// Gallery module - home page masonry grid
import { escapeHtml, escapeAttr, addImgFallback, initReveal } from "./utils.js";
import { openLightbox } from "./lightbox.js";

export function renderGallery(products, container) {
  container.innerHTML = "";
  products.forEach(function (p, i) {
    var article = document.createElement("article");
    article.className = "gallery-item reveal";
    article.innerHTML =
      '<button type="button" class="gallery-open" data-index="' +
      i +
      '">' +
      '<img src="' +
      escapeAttr(p.image) +
      '" alt="' +
      escapeAttr(p.title) +
      '" loading="lazy" decoding="async" />' +
      "</button>" +
      "<figcaption>" +
      '<p class="title">' +
      escapeHtml(p.title) +
      "</p>" +
      "<span class='category'>" +
      escapeHtml(p.category) +
      "</span>" +
      "</figcaption>";
    container.appendChild(article);
  });

  container.querySelectorAll(".gallery-open").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var idx = parseInt(btn.getAttribute("data-index"), 10);
      openLightbox(products, idx);
    });
    addImgFallback(btn.querySelector("img"));
  });
  // Initialize reveal animations
  initReveal();
}
