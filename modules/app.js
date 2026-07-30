// Entry point - wires all modules together
import { updateCartBadge, getCartCount, initCartButton, initComingSoonTriggers, renderCartPage, injectCartModal } from "./cart.js";
import { initLightboxUi, initModalEscape } from "./lightbox.js";
import { renderGallery } from "./gallery.js";
import { renderStore } from "./store.js";
import { initCoolGalleryPage } from "./coolgallery.js";
import { initProductPage } from "./product.js";
import { fetchProducts, initReveal } from "./utils.js";

function initHeaderScroll() {
  const header = document.querySelector(".site-header");
  if (!header) return;
  function onScroll() {
    header.classList.toggle("is-solid", window.scrollY > 24);
  }
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
}

function setActiveNav() {
  const page = document.body && document.body.dataset.page;
  if (!page) return;
  document.querySelectorAll(".site-nav a[data-nav]").forEach(function (a) {
    const active = a.dataset.nav === page;
    if (page === "product" && a.dataset.nav === "store") active = true;
    a.classList.toggle("is-active", active);
  });
}

function initHome() {
  const container = document.getElementById("gallery-root");
  if (!container) return;
  container.innerHTML = '<p class="loading-state">Loading work…</p>';
  container.setAttribute("aria-busy", "true");
  fetchProducts()
    .then(function (products) {
      container.innerHTML = "";
      container.setAttribute("aria-busy", "false");
      const masonry = document.createElement("div");
      masonry.className = "gallery-masonry";
      container.appendChild(masonry);
      // Show ALL products (removed slice(0,3) limit)
      renderGallery(products, masonry);
    })
    .catch(function (error) {
      console.error("Failed to load gallery:", error);
      container.setAttribute("aria-busy", "false");
      container.innerHTML = '<p class="error-state">Could not load gallery. Check that products.json is available.</p>';
    });
}

function initStorePage() {
  const container = document.getElementById("store-root");
  if (!container) return;
  container.innerHTML = '<p class="loading-state">Loading store…</p>';
  container.setAttribute("aria-busy", "true");
  fetchProducts()
    .then(function (products) {
      container.innerHTML = "";
      container.setAttribute("aria-busy", "false");
      const grid = document.createElement("div");
      grid.className = "store-grid";
      container.appendChild(grid);
      renderStore(products, grid);
    })
    .catch(function (error) {
      console.error("Failed to load store:", error);
      container.setAttribute("aria-busy", "false");
      container.innerHTML = '<p class="error-state">Could not load products.</p>';
    });
}

function onReady() {
  initHeaderScroll();
  setActiveNav();
  updateCartBadge();
  initLightboxUi();
  initCartButton();
  initComingSoonTriggers();
  injectCartModal();
  initModalEscape();
  // Call initReveal for any static reveal elements on the page
  // (page-specific dynamic content calls initReveal inside render functions)
  initReveal();

  const page = document.body && document.body.dataset.page;
  try { if (page === "home") initHome(); } catch (e) { console.error("initHome failed:", e); }
  try { if (page === "store") initStorePage(); } catch (e) { console.error("initStorePage failed:", e); }
  try { if (page === "coolgallery") initCoolGalleryPage(); } catch (e) { console.error("initCoolGalleryPage failed:", e); }
  try { if (page === "product") initProductPage(); } catch (e) { console.error("initProductPage failed:", e); }
  try { if (page === "cart") renderCartPage(); } catch (e) { console.error("renderCartPage failed:", e); }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", onReady);
} else {
  onReady();
}
