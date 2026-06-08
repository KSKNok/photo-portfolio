// Shared utilities for the photo portfolio

export function initReveal() {
  var els = document.querySelectorAll(".reveal");
  if (!els.length) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    els.forEach(function (el) {
      el.classList.add("is-visible");
    });
    return;
  }
  var io = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add("is-visible");
          io.unobserve(en.target);
        }
      });
    },
    { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
  );
  els.forEach(function (el) {
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

var _productsCache = null;
var PRODUCTS_URL = "./products.json";

export function fetchProducts() {
  if (_productsCache) return Promise.resolve(_productsCache);

  return fetch(PRODUCTS_URL)
    .then(function (r) {
      if (!r.ok) throw new Error("Failed to load products");
      return r.json();
    })
    .then(function (data) {
      _productsCache = (Array.isArray(data) ? data : []).map(normalizeProduct);
      return _productsCache;
    })
    .catch(function (error) {
      console.error("Failed to fetch products:", error);
      throw error;
    });
}

export function escapeHtml(s) {
  var d = document.createElement("div");
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
  var parent = img && img.parentElement;
  img.onerror = function () {
    this.style.display = "none";
    if (parent) {
      parent.style.background = "linear-gradient(135deg, #2d2d2d 0%, #1a1a1a 100%)";
      parent.style.minHeight = "120px";
      parent.style.display = "flex";
      parent.style.alignItems = "center";
      parent.style.justifyContent = "center";
      parent.style.color = "var(--color-muted)";
      var label = document.createElement("span");
      label.className = "img-placeholder";
      label.textContent = "Image unavailable";
      label.style.fontSize = "0.75rem";
      label.style.textAlign = "center";
      parent.appendChild(label);
    }
  };
}
