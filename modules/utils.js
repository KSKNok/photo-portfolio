// Shared utilities for the photo portfolio

export function initReveal() {
  const els = document.querySelectorAll(".reveal");
  if (!els.length) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    els.forEach((el) => {
      el.classList.add("is-visible");
    });
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) {
          en.target.classList.add("is-visible");
          io.unobserve(en.target);
        }
      });
    },
    { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
  );
  els.forEach((el) => {
    io.observe(el);
  });
}

export function formatMoney(cents, currency) {
  currency = currency || "USD";
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currency,
    }).format(cents / 100);
  } catch (e) {
    return "$" + (cents / 100).toFixed(2);
  }
}

export function normalizeProduct(raw) {
  return {
    id: String(raw.id),
    title: raw.title,
    category: raw.category || "",
    description: raw.description || "",
    priceCents: Number(raw.priceCents) || 0,
    currency: raw.currency || "USD",
    image: raw.image || "",
  };
}

let _productsCache = null;
const PRODUCTS_URL = "./products.json";

export function fetchProducts() {
  if (_productsCache) return Promise.resolve(_productsCache);

  return fetch(PRODUCTS_URL)
    .then((r) => {
      if (!r.ok) throw new Error("Failed to load products");
      return r.json();
    })
    .then((data) => {
      _productsCache = (Array.isArray(data) ? data : []).map(normalizeProduct);
      return _productsCache;
    })
    .catch((error) => {
      console.error("Failed to fetch products:", error);
      throw error;
    });
}

export function escapeHtml(s) {
  const d = document.createElement("div");
  d.textContent = s;
  return d.innerHTML;
}

export function escapeAttr(s) {
  s = s == null ? "" : String(s);
  return s
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function addImgFallback(img) {
  const parent = img && img.parentElement;
  img.onerror = function () {
    this.style.display = "none";
    if (parent) {
      parent.classList.add("img-placeholder");
      const label = document.createElement("span");
      label.textContent = "Image unavailable";
      parent.appendChild(label);
    }
  };
}
