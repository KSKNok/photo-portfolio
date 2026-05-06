(function () {
  "use strict";

  var PRODUCTS_URL = "./products.json";
  var CART_KEY = "photo-portfolio-cart";

  function formatMoney(cents, currency) {
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

  function normalizeProduct(raw) {
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

  function getCart() {
    try {
      var raw = localStorage.getItem(CART_KEY);
      var parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.warn("Failed to load cart from localStorage:", e);
      return [];
    }
  }

  function setCart(items) {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(items));
      updateCartBadge();
      document.dispatchEvent(new CustomEvent("cart:updated", { detail: items }));
    } catch (e) {
      console.error("Failed to save cart to localStorage:", e);
    }
  }

  /**
   * Add line item to cart; persists to localStorage and logs for payment integration.
   * @param {object} product - normalized product object
   * @param {number} [qty]
   */
  function addToCart(product, qty) {
    qty = qty == null ? 1 : Math.max(1, parseInt(qty, 10) || 1);
    var normalized = normalizeProduct(product);
    var line = {
      id: normalized.id,
      title: normalized.title,
      priceCents: normalized.priceCents,
      currency: normalized.currency,
      image: normalized.image,
      qty: qty,
    };
    var cart = getCart();
    var found = cart.find(function (i) {
      return i.id === line.id;
    });
    if (found) {
      found.qty += qty;
    } else {
      cart.push(line);
    }
    setCart(cart);
    console.log("[addToCart]", line, "cart:", cart);
    return cart;
  }

  function getCartCount() {
    return getCart().reduce(function (sum, i) {
      return sum + (i.qty || 0);
    }, 0);
  }

  function updateCartBadge() {
    var badge = document.querySelector(".cart-btn__badge");
    if (!badge) return;
    var n = getCartCount();
    badge.textContent = n > 99 ? "99+" : String(n);
    badge.classList.toggle("is-visible", n > 0);
  }

  function initHeaderScroll() {
    var header = document.querySelector(".site-header");
    if (!header) return;
    function onScroll() {
      header.classList.toggle("is-solid", window.scrollY > 24);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  function setActiveNav() {
    var page = document.body && document.body.dataset.page;
    if (!page) return;
    document.querySelectorAll(".site-nav a[data-nav]").forEach(function (a) {
      var active = a.dataset.nav === page;
      if (page === "product" && a.dataset.nav === "store") active = true;
      a.classList.toggle("is-active", active);
    });
  }

  function injectShellLightbox() {
    if (document.getElementById("lightbox-root")) return;
    var root = document.createElement("div");
    root.id = "lightbox-root";
    root.innerHTML =
      '<div class="lightbox" id="lightbox" role="dialog" aria-modal="true" aria-label="Image preview" hidden>' +
      '<div class="lightbox__panel" tabindex="-1">' +
      '<button type="button" class="lightbox__close" aria-label="Close preview">&times;</button>' +
      '<button type="button" class="lightbox__prev" aria-label="Previous image">&#8592;</button>' +
      '<button type="button" class="lightbox__next" aria-label="Next image">&#8594;</button>' +
      "<img src=\"\" alt=\"\" />" +
      '<p class="lightbox__caption"></p>' +
      "</div></div>";
    document.body.appendChild(root);
  }

  function injectComingSoonModal() {
    if (document.getElementById("modal-coming-soon-backdrop")) return;
    var wrap = document.createElement("div");
    wrap.innerHTML =
      '<div class="modal-backdrop" id="modal-coming-soon-backdrop" aria-hidden="true"></div>' +
      '<div class="modal" id="modal-coming-soon" role="dialog" aria-modal="true" aria-labelledby="coming-soon-title" hidden>' +
      '<h2 id="coming-soon-title">Coming soon</h2>' +
      "<p>Checkout and print fulfillment will be available shortly. Thank you for your interest.</p>" +
      '<div class="modal__actions">' +
      '<button type="button" class="btn btn--primary" data-close-coming-soon>OK</button>' +
      "</div></div>";
    document.body.appendChild(wrap);
  }

  function injectCartModal() {
    if (document.getElementById("modal-cart-backdrop")) return;
    var wrap = document.createElement("div");
    wrap.innerHTML =
      '<div class="modal-backdrop" id="modal-cart-backdrop" aria-hidden="true"></div>' +
      '<div class="modal" id="modal-cart" role="dialog" aria-modal="true" aria-labelledby="cart-title" hidden>' +
      '<h2 id="cart-title">Cart</h2>' +
      '<div id="cart-modal-body"></div>' +
      '<div class="modal__actions">' +
      '<button type="button" class="btn btn--ghost" data-close-cart>Close</button>' +
      "</div></div>";
    document.body.appendChild(wrap);
  }

  function openModalPair(backdropId, modalId) {
    var bd = document.getElementById(backdropId);
    var m = document.getElementById(modalId);
    if (!bd || !m) return;
    m.hidden = false;
    bd.classList.add("is-open");
    m.classList.add("is-open");
    activateDialog(m);
  }

  var activeDialog = null;
  var lastFocusElement = null;

  function setPageHidden(hidden) {
    document.querySelectorAll("header, main, footer").forEach(function (el) {
      if (!el) return;
      if (hidden) el.setAttribute("aria-hidden", "true");
      else el.removeAttribute("aria-hidden");
    });
  }

  function getFocusableElements(root) {
    if (!root) return [];
    return Array.prototype.filter.call(
      root.querySelectorAll(
        'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
      ),
      function (el) {
        return (
          el.offsetWidth > 0 ||
          el.offsetHeight > 0 ||
          el.getClientRects().length
        );
      }
    );
  }

  function activateDialog(dialog) {
    if (!dialog) return;
    activeDialog = dialog;
    lastFocusElement = document.activeElement;
    document.body.classList.add("modal-open");
    setPageHidden(true);
    var focusable = getFocusableElements(dialog);
    if (focusable.length) {
      focusable[0].focus();
    }
  }

  function deactivateDialog() {
    if (!activeDialog) return;
    document.body.classList.remove("modal-open");
    setPageHidden(false);
    if (lastFocusElement && lastFocusElement.focus) {
      lastFocusElement.focus();
    }
    activeDialog = null;
    lastFocusElement = null;
  }

  function handleDialogTab(event) {
    if (!activeDialog || event.key !== "Tab") return;
    var focusable = getFocusableElements(activeDialog);
    if (!focusable.length) return;
    var currentIndex = focusable.indexOf(document.activeElement);
    if (event.shiftKey) {
      if (currentIndex === 0 || document.activeElement === activeDialog) {
        event.preventDefault();
        focusable[focusable.length - 1].focus();
      }
    } else {
      if (currentIndex === focusable.length - 1) {
        event.preventDefault();
        focusable[0].focus();
      }
    }
  }

  function closeModalPair(backdropId, modalId) {
    var bd = document.getElementById(backdropId);
    var m = document.getElementById(modalId);
    if (!bd || !m) return;
    bd.classList.remove("is-open");
    m.classList.remove("is-open");
    m.hidden = true;
    deactivateDialog();
  }

  function renderCartModalBody() {
    var body = document.getElementById("cart-modal-body");
    if (!body) return;
    var cart = getCart();
    if (!cart.length) {
      body.innerHTML = '<p class="cart-empty">Your cart is empty.</p>';
      return;
    }
    var total = cart.reduce(function (s, i) {
      return s + i.priceCents * (i.qty || 1);
    }, 0);
    var currency = cart[0].currency || "USD";
    var lines = cart
      .map(function (i, idx) {
        return (
          "<li><span>" +
          escapeHtml(i.title) +
          "</span><div class=\"cart-qty\"><button type=\"button\" class=\"btn btn--ghost qty-btn\" data-qty=\"-1\" data-idx=\"" +
          idx +
          "\">−</button><span class=\"qty-val\">" +
          (i.qty || 1) +
          "</span><button type=\"button\" class=\"btn btn--ghost qty-btn\" data-qty=\"1\" data-idx=\"" +
          idx +
          "\">+</button></div><span>" +
          formatMoney(i.priceCents * (i.qty || 1), i.currency) +
          "</span></li>"
        );
      })
      .join("");
    body.innerHTML =
      '<ul class="cart-list">' +
      lines +
      "</ul>" +
      "<p><strong>Subtotal:</strong> " +
      formatMoney(total, currency) +
      "</p>" +
      "<p class=\"prose-muted\" style=\"font-size:0.875rem;margin:0\">Checkout is not wired yet — this is a preview.</p>";

    // Bind quantity buttons
    body.querySelectorAll(".qty-btn").forEach(function(btn) {
      btn.addEventListener("click", function() {
        var idx = parseInt(btn.dataset.idx, 10);
        var delta = parseInt(btn.dataset.qty, 10);
        var currentCart = getCart();

        if (currentCart[idx]) {
          var newQty = currentCart[idx].qty + delta;
          if (newQty < 1) {
            if (confirm("Remove this item from cart?")) {
              currentCart.splice(idx, 1);
            }
          } else {
            currentCart[idx].qty = newQty;
          }
          setCart(currentCart);
          renderCartModalBody();
        }
      });
    });
  }

  function escapeHtml(s) {
    var d = document.createElement("div");
    d.textContent = s;
    return d.innerHTML;
  }

  function initCartButton() {
    var btn = document.querySelector(".cart-btn");
    if (!btn) return;
    injectCartModal();
    btn.addEventListener("click", function () {
      renderCartModalBody();
      openModalPair("modal-cart-backdrop", "modal-cart");
    });
    document.addEventListener("click", function (e) {
      if (e.target && e.target.dataset && e.target.dataset.closeCart != null) {
        closeModalPair("modal-cart-backdrop", "modal-cart");
      }
    });
    var bd = document.getElementById("modal-cart-backdrop");
    if (bd) {
      bd.addEventListener("click", function () {
        closeModalPair("modal-cart-backdrop", "modal-cart");
      });
    }
  }

  function initComingSoonTriggers() {
    injectComingSoonModal();
    document.addEventListener("click", function (e) {
      if (
        e.target &&
        e.target.dataset &&
        e.target.dataset.openComingSoon != null
      ) {
        e.preventDefault();
        openModalPair("modal-coming-soon-backdrop", "modal-coming-soon");
      }
      if (
        e.target &&
        e.target.dataset &&
        e.target.dataset.closeComingSoon != null
      ) {
        closeModalPair("modal-coming-soon-backdrop", "modal-coming-soon");
      }
    });
    var bd = document.getElementById("modal-coming-soon-backdrop");
    if (bd) {
      bd.addEventListener("click", function () {
        closeModalPair("modal-coming-soon-backdrop", "modal-coming-soon");
      });
    }
  }

  var revealObserved = typeof WeakSet !== "undefined" ? new WeakSet() : null;

  function initReveal() {
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
      if (revealObserved && revealObserved.has(el)) return;
      if (revealObserved) revealObserved.add(el);
      io.observe(el);
    });
  }

  var lightboxState = {
    items: [],
    index: 0,
    lastFocus: null,
  };

  function openLightbox(items, index) {
    injectShellLightbox();
    var lb = document.getElementById("lightbox");
    if (!lb) return;
    lightboxState.items = items;
    lightboxState.index = Math.max(
      0,
      Math.min(index, items.length - 1)
    );
    lightboxState.lastFocus = document.activeElement;
    lb.hidden = false;
    requestAnimationFrame(function () {
      lb.classList.add("is-open");
    });
    document.body.classList.add("lightbox-open");
    updateLightboxSlide();
    activateDialog(lb);
  }

  function closeLightbox() {
    var lb = document.getElementById("lightbox");
    if (!lb) return;
    lb.classList.remove("is-open");
    document.body.classList.remove("lightbox-open");
    var end = function () {
      lb.hidden = true;
      lb.removeEventListener("transitionend", end);
      deactivateDialog();
    };
    lb.addEventListener("transitionend", end);
    if (lightboxState.lastFocus && lightboxState.lastFocus.focus) {
      lightboxState.lastFocus.focus();
    }
  }

  function updateLightboxSlide() {
    var lb = document.getElementById("lightbox");
    if (!lb) return;
    var img = lb.querySelector("img");
    var cap = lb.querySelector(".lightbox__caption");
    var item = lightboxState.items[lightboxState.index];
    if (!item || !img) return;
    img.src = item.image;
    img.alt = item.title || "";
    if (cap) cap.textContent = item.title || "";
  }

  function lightboxPrev() {
    if (!lightboxState.items.length) return;
    lightboxState.index =
      (lightboxState.index - 1 + lightboxState.items.length) %
      lightboxState.items.length;
    updateLightboxSlide();
  }

  function lightboxNext() {
    if (!lightboxState.items.length) return;
    lightboxState.index =
      (lightboxState.index + 1) % lightboxState.items.length;
    updateLightboxSlide();
  }

  function initLightboxUi() {
    injectShellLightbox();
    var lb = document.getElementById("lightbox");
    if (!lb) return;
    lb.addEventListener("click", function (e) {
      if (e.target === lb) closeLightbox();
    });
    var closeBtn = lb.querySelector(".lightbox__close");
    if (closeBtn) closeBtn.addEventListener("click", closeLightbox);
    var prev = lb.querySelector(".lightbox__prev");
    var next = lb.querySelector(".lightbox__next");
    if (prev) prev.addEventListener("click", lightboxPrev);
    if (next) next.addEventListener("click", lightboxNext);
    document.addEventListener("keydown", function (e) {
      if (!lb.classList.contains("is-open")) return;
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") lightboxPrev();
      if (e.key === "ArrowRight") lightboxNext();
    });
  }

  function renderGallery(products, container) {
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
        "<span>" +
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
    });
    initReveal();
  }

  function escapeAttr(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/</g, "&lt;");
  }

  function renderStore(products, container) {
    container.innerHTML = "";
    products.forEach(function (p) {
      var a = document.createElement("a");
      a.className = "store-card reveal";
      a.href = "product.html?id=" + encodeURIComponent(p.id);
      a.innerHTML =
        '<div class="store-card__media">' +
        '<img src="' +
        escapeAttr(p.image) +
        '" alt="' +
        escapeAttr(p.title) +
        '" loading="lazy" decoding="async" />' +
        "</div>" +
        '<div class="store-card__body">' +
        "<h2>" +
        escapeHtml(p.title) +
        "</h2>" +
        '<p class="store-card__meta">' +
        escapeHtml(p.category) +
        "</p>" +
        '<p class="store-card__price">' +
        formatMoney(p.priceCents, p.currency) +
        "</p>" +
        "</div>";
      container.appendChild(a);
    });
    initReveal();
  }

  function initHome() {
    var container = document.getElementById("gallery-root");
    if (!container) return;
    container.innerHTML = '<p class="loading-state">Loading work…</p>';
    fetchProducts()
      .then(function (products) {
        container.innerHTML = "";
        var masonry = document.createElement("div");
        masonry.className = "gallery-masonry";
        container.appendChild(masonry);
        renderGallery(products, masonry);
      })
      .catch(function (error) {
        console.error("Failed to load gallery:", error);
        container.innerHTML =
          '<p class="error-state">Could not load gallery. Check that products.json is available.</p>';
      });
  }

  function initStorePage() {
    var container = document.getElementById("store-root");
    if (!container) return;
    container.innerHTML = '<p class="loading-state">Loading store…</p>';
    fetchProducts()
      .then(function (products) {
        container.innerHTML = "";
        var grid = document.createElement("div");
        grid.className = "store-grid";
        container.appendChild(grid);
        renderStore(products, grid);
      })
      .catch(function (error) {
        console.error("Failed to load store:", error);
        container.innerHTML =
          '<p class="error-state">Could not load products.</p>';
      });
  }

  function initModalEscape() {
    document.addEventListener("keydown", function (e) {
      if (e.key === "Tab") {
        handleDialogTab(e);
        return;
      }
      if (e.key !== "Escape") return;
      var cart = document.getElementById("modal-cart");
      if (cart && cart.classList.contains("is-open")) {
        closeModalPair("modal-cart-backdrop", "modal-cart");
        return;
      }
      var cs = document.getElementById("modal-coming-soon");
      if (cs && cs.classList.contains("is-open")) {
        closeModalPair("modal-coming-soon-backdrop", "modal-coming-soon");
      }
    });
  }

  function onReady() {
    initHeaderScroll();
    setActiveNav();
    updateCartBadge();
    initLightboxUi();
    initCartButton();
    initComingSoonTriggers();
    initModalEscape();
    initReveal();

    var page = document.body && document.body.dataset.page;
    if (page === "home") initHome();
    else if (page === "store") initStorePage();
    else if (page === "product") initProductPage();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", onReady);
  } else {
    onReady();
  }

  // Cache products to avoid redundant network calls
  var _productsCache = null;

  function fetchProducts() {
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

  // Fix escapeAttr to handle '>' properly
  function escapeAttr(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  // Enhanced product page with validation and SEO
  function initProductPage() {
    var root = document.getElementById("product-root");
    if (!root) return;

    var params = new URLSearchParams(window.location.search);
    var id = params.get("id");

    if (!id || typeof id !== "string") {
      root.innerHTML = '<p class="error-state">Missing product ID. <a href="store.html">Back to store</a></p>';
      return;
    }

    root.innerHTML = '<p class="loading-state">Loading…</p>';
    fetchProducts()
      .then(function (products) {
        var p = products.find(function (x) { return x.id === id; });
        if (!p) {
          root.innerHTML = '<p class="error-state">Print not found. <a href="store.html">Back to store</a></p>';
          return;
        }

        document.title = p.title + " — AL";

        // Inject JSON-LD for SEO
        var ld = document.createElement("script");
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

        root.innerHTML =
          '<div class="product-layout">' +
          '<div class="product-hero">' +
          '<img src="' +
          escapeAttr(p.image) +
          '" alt="' +
          escapeAttr(p.title) +
          '" loading="lazy" decoding="async" />' +
          "</div>" +
          '<div class="product-detail">' +
          '<p class="eyebrow">' +
          escapeHtml(p.category) +
          "</p>" +
          "<h1>" +
          escapeHtml(p.title) +
          "</h1>" +
          '<p class="price">' +
          formatMoney(p.priceCents, p.currency) +
          "</p>" +
          '<p class="description">' +
          escapeHtml(p.description) +
          "</p>" +
          '<div class="btn-row">' +
          '<button type="button" class="btn btn--primary" data-open-coming-soon>Purchase print</button>' +
          '<button type="button" class="btn btn--ghost" data-add-print data-id="' +
          escapeAttr(p.id) +
          "\">Add to cart</button>" +
          "</div>" +
          "</div></div>";

        var addBtn = root.querySelector("[data-add-print]");
        if (addBtn) {
          addBtn.addEventListener("click", function () {
            addToCart(p, 1);
          });
        }
      })
      .catch(function (error) {
        console.error("Failed to load product:", error);
        root.innerHTML = '<p class="error-state">Could not load product.</p>';
      });
  }
        '<div class="product-hero">' +
        '<img src="' + escapeAttr(p.image) + '" alt="' + escapeAttr(p.title) + '" width="600" height="900" loading="lazy" decoding="async" />' +
        "</div>" +
        '<div class="product-detail">' +
        '<p class="eyebrow">' + escapeHtml(p.category) + "</p>" +
        "<h1>" + escapeHtml(p.title) + "</h1>" +
        '<p class="price">' + formatMoney(p.priceCents, p.currency) + "</p>" +
        '<p class="description">' + escapeHtml(p.description) + "</p>" +
        '<div class="btn-row">' +
        '<button type="button" class="btn btn--primary" data-open-coming-soon>Purchase print</button>' +
        '<button type="button" class="btn btn--ghost" data-add-print data-id="' + escapeAttr(p.id) + '">Add to cart</button>' +
        "</div></div></div>";

      var addBtn = root.querySelector("[data-add-print]");
      if (addBtn) {
        addBtn.addEventListener("click", function () {
          addToCart(p, 1);
        });
      }
    })
    .catch(function (error) {
      console.error("Failed to load product:", error);
      root.innerHTML = '<p class="error-state">Could not load product.</p>';
    });
  
  

  function renderCartModalBody() {
    var body = document.getElementById("cart-modal-body");
  if (!body) return;
  
  var cart = getCart();
  if (!cart.length) {
    body.innerHTML = '<p class="cart-empty">Your cart is empty.</p>';
    return;
  }

  var total = cart.reduce(function (s, i) { return s + i.priceCents * (i.qty || 1); }, 0);
  var currency = cart[0].currency || "USD";

  var lines = cart.map(function (i, idx) {
    return '<li>' +
      '<span>' + escapeHtml(i.title) + '</span>' +
      '<div class="cart-qty">' +
        '<button type="button" class="btn btn--ghost qty-btn" data-qty="-1" data-idx="' + idx + '">−</button>' +
        '<span class="qty-val">' + (i.qty || 1) + '</span>' +
        '<button type="button" class="btn btn--ghost qty-btn" data-qty="1" data-idx="' + idx + '">+</button>' +
      '</div>' +
      '<span>' + formatMoney(i.priceCents * (i.qty || 1), i.currency) + '</span>' +
    '</li>';
  }).join("");

  body.innerHTML = 
    '<ul class="cart-list">' + lines + '</ul>' +
    '<p><strong>Subtotal:</strong> ' + formatMoney(total, currency) + '</p>' +
    '<p class="prose-muted" style="font-size:0.875rem;margin:0">Checkout is not wired yet — this is a preview.</p>';
    
  // Bind quantity buttons
  body.querySelectorAll(".qty-btn").forEach(function(btn) {
    btn.addEventListener("click", function() {
      var idx = parseInt(btn.dataset.idx, 10);
      var delta = parseInt(btn.dataset.qty, 10);
      var currentCart = getCart();
      
      if (currentCart[idx]) {
        var newQty = currentCart[idx].qty + delta;
        if (newQty < 1) {
          if (confirm("Remove this item from cart?")) {
            currentCart.splice(idx, 1);
          }
        } else {
          currentCart[idx].qty = newQty;
        }
        setCart(currentCart);
        renderCartModalBody();
      }
    });
  });
}
})();