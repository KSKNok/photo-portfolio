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
    var badge = document.querySelector(".cart-badge");
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
      // New button for emptying the whole cart
      '<button type="button" class="btn btn--ghost" data-empty-cart>Empty Cart</button>' +
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
        // Item line rendering, now including trash button
        return (
          "<li data-item-idx='" + idx + "' class='cart-modal-item'>" +
          // Item details and quantity controls
          '<span class="cart-modal-item-details">' +
          escapeHtml(i.title) +
          '</span><div class="cart-qty">' +
          // Quantity decrement button
          '<button type="button" class="btn btn--ghost qty-btn" data-action="decrease" data-item-idx="' + idx + '" data-qty="-1">−</button>' +
          '<span class="qty-val">' + (i.qty || 1) + '</span>' +
          // Quantity increment button
          '<button type="button" class="btn btn--ghost qty-btn" data-action="increase" data-item-idx="' + idx + '" data-qty="1">+</button>' +
          '</div><span style="flex-shrink: 0;">' + formatMoney(i.priceCents * (i.qty || 1), i.currency) + '</span>' +
          // Trash button for line item removal
          '<button type="button" class="btn btn--ghost trash-item-btn" data-item-idx="' + idx + '" aria-label="Remove this item">&times;</button></li>'
        );
      })
      .join("");

    body.innerHTML =
      '<ul class="cart-list">' + lines + '</ul>' +
      "<p><strong style='display: block; margin-top: 1rem;'>Subtotal:</strong> " + formatMoney(total, currency) + "</p>";

    // Event Delegation for all dynamic buttons - removed since listener is now on modal
  }


  function renderCartPage() {
    var content = document.getElementById("cart-page-content");
    if (!content) return;
    var cart = getCart();
    if (!cart.length) {
      content.innerHTML = '<div class="cart-empty-state"><p class="cart-empty">Your cart is empty.</p><a href="store.html" class="btn btn--primary">Continue shopping</a></div>';
      return;
    }

    var total = cart.reduce(function (s, i) {
      return s + i.priceCents * (i.qty || 1);
    }, 0);
    var currency = cart[0].currency || "USD";
    var lines = cart
      .map(function (i, idx) {
        return (
          '<li data-item-idx="' + idx + '" class="cart-item">' +
          '<div class="cart-item__media">' +
          '<img src="' + escapeAttr(i.image) + '" alt="' + escapeAttr(i.title) + '" loading="lazy" />' +
          '</div>' +
          '<div class="cart-item__details">' +
          '<h3 class="cart-item__title">' + escapeHtml(i.title) + '</h3>' +
          '<p class="cart-item__price">' + formatMoney(i.priceCents, i.currency) + '</p>' +
          '</div>' +
          '<div class="cart-item__controls">' +
          '<div class="qty-controls">' +
          '<button type="button" class="qty-btn qty-btn--decrease" data-action="decrease" data-item-idx="' + idx + '" data-qty="-1" aria-label="Decrease quantity">−</button>' +
          '<span class="qty-val">' + (i.qty || 1) + '</span>' +
          '<button type="button" class="qty-btn qty-btn--increase" data-action="increase" data-item-idx="' + idx + '" data-qty="1" aria-label="Increase quantity">+</button>' +
          '</div>' +
          '<span class="cart-item__subtotal">' + formatMoney(i.priceCents * (i.qty || 1), i.currency) + '</span>' +
          '</div>' +
          '<button type="button" class="cart-item__remove trash-item-btn" data-item-idx="' + idx + '" aria-label="Remove this item from cart" title="Remove item">×</button>' +
          '</li>'
        );
      })
      .join("");

    content.innerHTML =
      '<ul class="cart-items">' + lines + '</ul>' +
      '<div class="cart-summary">' +
      '<div class="cart-summary__row">' +
      '<span class="cart-summary__label">Subtotal:</span>' +
      '<span class="cart-summary__value">' + formatMoney(total, currency) + '</span>' +
      '</div>' +
      '<div class="cart-actions">' +
      '<button type="button" class="btn btn--ghost" id="empty-cart-page">Empty Cart</button>' +
      '<button type="button" class="btn btn--primary" data-open-coming-soon>Proceed to Checkout</button>' +
      '</div>' +
      '</div>';

    content.removeEventListener("click", handleCartPageClick);
    content.addEventListener("click", handleCartPageClick);
    content.querySelectorAll(".cart-item__media img").forEach(function (img) {
      addImgFallback(img);
    });
  }

  function handleCartPageClick(e) {
    var target = e.target;
    if (!target) return;

    // Handle Quantity Changes
    if (target.classList.contains("qty-btn")) {
      var btn = target;
      var idx = parseInt(btn.dataset.itemIdx, 10);
      var delta = parseInt(btn.dataset.qty, 10);
      var currentCart = getCart();

      if (currentCart[idx]) {
        var newQty = currentCart[idx].qty + delta;
        if (newQty < 1) {
          showConfirmation("Remove item", "Remove this item from your cart?")
            .then(function (confirmed) {
              if (confirmed) {
                currentCart.splice(idx, 1);
                setCart(currentCart);
                renderCartPage();
              }
            });
        } else {
          currentCart[idx].qty = newQty;
          setCart(currentCart);
          renderCartPage();
        }
      }
    }

    // Handle Individual Item Removal
    if (target.classList.contains("trash-item-btn")) {
      var idx = parseInt(target.dataset.itemIdx, 10);
      var currentCart = getCart();
      if (currentCart[idx]) {
        showConfirmation("Remove item", "Remove this item from your cart?")
          .then(function (confirmed) {
            if (confirmed) {
              currentCart.splice(idx, 1);
              setCart(currentCart);
              renderCartPage();
            }
          });
      }
    }

    // Handle Empty Cart
    if (target.id === "empty-cart-page") {
      showConfirmation("Empty cart", "Remove all items from your cart?")
        .then(function (confirmed) {
          if (confirmed) {
            localStorage.removeItem(CART_KEY);
            setCart([]);
            renderCartPage();
          }
        });
    }
  }

  function escapeHtml(s) {
    var d = document.createElement("div");
    d.textContent = s;
    return d.innerHTML;
  }

  function handleCartModalClick(e) {
    var target = e.target;
    if (!target) return;

    // Handle Quantity Changes
    if (target.classList.contains("qty-btn")) {
      var btn = target;
      var idx = parseInt(btn.dataset.itemIdx, 10);
      var delta = parseInt(btn.dataset.qty, 10);
      var currentCart = getCart();

      if (currentCart[idx]) {
        var newQty = currentCart[idx].qty + delta;
        if (newQty < 1) {
          showConfirmation("Remove item", "Remove this item from your cart?")
            .then(function (confirmed) {
              if (confirmed) {
                currentCart.splice(idx, 1);
                setCart(currentCart);
                renderCartModalBody();
              }
            });
        } else {
          currentCart[idx].qty = newQty;
          setCart(currentCart);
          renderCartModalBody();
        }
      }
    }

    // Handle Individual Item Removal
    if (target.classList.contains("trash-item-btn")) {
      var idx = parseInt(target.dataset.itemIdx, 10);
      var currentCart = getCart();
      if (currentCart[idx]) {
        showConfirmation("Remove item", "Remove this item from your cart?")
          .then(function (confirmed) {
            if (confirmed) {
              currentCart.splice(idx, 1);
              setCart(currentCart);
              renderCartModalBody();
            }
          });
      }
    }

    // Handle Empty Cart
    if (target.dataset && target.dataset.emptyCart != null) {
      showConfirmation("Empty cart", "Remove all items from your cart?")
        .then(function (confirmed) {
          if (confirmed) {
            localStorage.removeItem(CART_KEY);
            setCart([]);
            renderCartModalBody();
          }
        });
    }
  }


  function initCartButton() {
    // Initialize cart badge on navigation link
    // Cart link navigates to cart.html (default behavior)
    // Just ensure the badge is updated
    updateCartBadge();
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
    initReveal();
  }


  function renderStore(products, container) {
    container.innerHTML = "";
    products.forEach(function (p) {
      var a = document.createElement("a");
      a.className = "store-card reveal";
      a.href = "product.html?id=" + encodeURIComponent(p.id);
      a.innerHTML =
        '<div class="store-card__media">' +
        '<img src="' + escapeAttr(p.image) + '" alt="' + escapeAttr(p.title) + '" loading="lazy" decoding="async" />' +
        "</div>" +
        '<div class="store-card__body">' +
        "<h2>" + escapeHtml(p.title) + "</h2>"
        '<p class="store-card__meta">' + escapeHtml(p.category) + "</p>" +
        '<p class="store-card__price">' + formatMoney(p.priceCents, p.currency) + "</p>" +
        "</div>";
      container.appendChild(a);
    });
    container.querySelectorAll(".store-card img").forEach(function (img) {
      addImgFallback(img);
    });
    initReveal();
  }

  function initHome() {
    var container = document.getElementById("gallery-root");
    if (!container) return;
    container.innerHTML = '<p class="loading-state">Loading work…</p>';
    container.setAttribute("aria-busy", "true");
    fetchProducts()
      .then(function (products) {
        container.innerHTML = "";
        container.setAttribute("aria-busy", "false");
        var masonry = document.createElement("div");
        masonry.className = "gallery-masonry";
        container.appendChild(masonry);
        // Only load first 3 for initial page view performance (as per old logic)
        renderGallery(products.slice(0, 3), masonry);
      })
      .catch(function (error) {
        console.error("Failed to load gallery:", error);
        container.setAttribute("aria-busy", "false");
        container.innerHTML = '<p class="error-state">Could not load gallery. Check that products.json is available.</p>';
      });
  }

  function initStorePage() {
    var container = document.getElementById("store-root");
    if (!container) return;
    container.innerHTML = '<p class="loading-state">Loading store…</p>';
    container.setAttribute("aria-busy", "true");
    fetchProducts()
      .then(function (products) {
        container.innerHTML = "";
        container.setAttribute("aria-busy", "false");
        var grid = document.createElement("div");
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

  function renderCoolGalleryIntro(container, products) {
    container.innerHTML =
      '<section class="coolgallery-intro reveal">' +
      '<div class="coolgallery-stage">' +
      '<p class="page-subtitle">Interactive selection</p>' +
      '<h2 class="page-title">Ready to swipe your next favorite?</h2>' +
      '<p class="coolgallery-copy">Click Start to begin. Then drag the card left to pass or right to keep. When the deck is finished, your selected prints appear with price details.</p>' +
      '<button type="button" class="btn btn--primary coolgallery-start" data-action="start">Start swiping</button>' +
      '</div>' +
      '</section>';

    var startBtn = container.querySelector('[data-action="start"]');
    if (startBtn) {
      startBtn.addEventListener("click", function () {
        startCoolGallery(container, products);
      });
    }
    initReveal();
  }

  function initCoolGalleryPage() {
    var container = document.getElementById("coolgallery-root");
    if (!container) return;
    container.innerHTML = '<p class="loading-state">Loading your gallery…</p>';
    container.setAttribute("aria-busy", "true");
    fetchProducts()
      .then(function (products) {
        container.setAttribute("aria-busy", "false");
        renderCoolGalleryIntro(container, products);
      })
      .catch(function (error) {
        console.error("Failed to load CoolGallery:", error);
        container.setAttribute("aria-busy", "false");
        container.innerHTML = '<p class="error-state">Could not load the gallery. Try again later.</p>';
      });
  }

  function updateCoolGalleryHint(card, offset) {
    if (!card) return;
    var left = card.querySelector(".swipe-hint--left");
    var right = card.querySelector(".swipe-hint--right");
    if (!left || !right) return;
    left.classList.toggle("is-active", offset < -60);
    right.classList.toggle("is-active", offset > 60);
  }

  function resetCoolGalleryCard(card) {
    if (!card) return;
    card.style.transition = "transform 0.3s ease, opacity 0.3s ease";
    card.style.transform = "none";
    card.style.opacity = "1";
    updateCoolGalleryHint(card, 0);
  }

  function swipeCoolGalleryCard(action) {
    var state = coolGalleryState;
    if (!state || !state.container) return;
    var card = state.container.querySelector(".coolgallery-card");
    if (!card) return;
    var product = state.products[state.index];
    var direction = action === "like" ? 1 : -1;
    if (action === "like") {
      state.selected.push(product);
    }

    card.style.transition = "transform 0.35s ease, opacity 0.35s ease";
    card.style.transform = "translateX(" + direction * 110 + "vw) rotate(" + direction * 26 + "deg)";
    card.style.opacity = "0";
    card.querySelectorAll(".swipe-hint").forEach(function (hint) {
      hint.classList.remove("is-active");
    });

    window.setTimeout(function () {
      state.index += 1;
      renderCoolGalleryCard();
    }, 360);
  }

  function renderCoolGalleryCard() {
    var state = coolGalleryState;
    if (!state || !state.container) return;
    var container = state.container;
    if (state.index >= state.products.length) {
      renderCoolGalleryResults();
      return;
    }

    var product = state.products[state.index];
    container.innerHTML =
      '<section class="coolgallery-stage reveal">' +
      '<div class="coolgallery-card" role="group" aria-label="Swipeable image card">' +
      '<img src="' + escapeAttr(product.image) + '" alt="' + escapeAttr(product.title) + '" loading="lazy" decoding="async" />' +
      '<div class="swipe-hint swipe-hint--left">Pass</div>' +
      '<div class="swipe-hint swipe-hint--right">Keep</div>' +
      '<div class="coolgallery-card__info">' +
      '<p class="page-subtitle">Swipe right to select</p>' +
      '<h2 class="page-title">' + escapeHtml(product.title) + '</h2>' +
      '<p class="coolgallery-copy">' + escapeHtml(product.description) + '</p>' +
      '<p class="coolgallery-meta">' + escapeHtml(product.category) + ' • ' + formatMoney(product.priceCents, product.currency) + '</p>' +
      '</div>' +
      '</div>' +
      '<div class="coolgallery-actions">' +
      '<button type="button" class="btn btn--ghost coolgallery-action" data-action="pass">Swipe left</button>' +
      '<button type="button" class="btn btn--primary coolgallery-action" data-action="like">Swipe right</button>' +
      '</div>' +
      '<p class="coolgallery-hint">Drag the image left to pass or right to keep. Use buttons if you prefer.</p>' +
      '<p class="coolgallery-progress">' + (state.index + 1) + ' of ' + state.products.length + ' prints</p>' +
      '</section>';

    var card = container.querySelector(".coolgallery-card");
    if (!card) return;
    card.style.touchAction = "none";
    var pointerData = null;

    card.addEventListener("pointerdown", function (event) {
      pointerData = {
        id: event.pointerId,
        startX: event.clientX,
        currentX: event.clientX,
      };
      card.setPointerCapture(event.pointerId);
      card.style.transition = "none";
    });

    card.addEventListener("pointermove", function (event) {
      if (!pointerData || event.pointerId !== pointerData.id) return;
      pointerData.currentX = event.clientX;
      var offset = pointerData.currentX - pointerData.startX;
      card.style.transform = "translateX(" + offset + "px) rotate(" + offset / 20 + "deg)";
      updateCoolGalleryHint(card, offset);
    });

    card.addEventListener("pointerup", function (event) {
      if (!pointerData || event.pointerId !== pointerData.id) return;
      var offset = pointerData.currentX - pointerData.startX;
      card.releasePointerCapture(event.pointerId);
      if (offset >= 90) swipeCoolGalleryCard("like");
      else if (offset <= -90) swipeCoolGalleryCard("pass");
      else resetCoolGalleryCard(card);
      pointerData = null;
    });

    card.addEventListener("pointercancel", function (event) {
      if (!pointerData || event.pointerId !== pointerData.id) return;
      card.releasePointerCapture(event.pointerId);
      resetCoolGalleryCard(card);
      pointerData = null;
    });

    container.querySelectorAll("[data-action='pass'], [data-action='like']").forEach(function (button) {
      button.addEventListener("click", function () {
        swipeCoolGalleryCard(button.dataset.action);
      });
    });
    container.querySelectorAll(".coolgallery-card img").forEach(function (img) {
      addImgFallback(img);
    });
    initReveal();
  }

  function renderCoolGalleryResults() {
    var state = coolGalleryState;
    if (!state || !state.container) return;
    var container = state.container;
    var selected = state.selected;
    var count = selected.length;

    container.innerHTML =
      '<section class="coolgallery-results reveal">' +
      '<div class="page-header">' +
      '<p class="page-subtitle">Finished</p>' +
      '<h1 class="page-title">' + (count ? 'Congratulations!' : 'Gallery complete') + '</h1>' +
      '<p class="page-description">' +
      (count
        ? 'You selected ' + count + ' image' + (count === 1 ? '' : 's') + '. Here are your favorites with price details.'
        : 'No favorites were kept this time. You can restart to try again.') +
      '</p>' +
      '</div>' +
      (count ? '<div class="coolgallery-grid">' + selected.map(function (product) {
        return (
          '<article class="coolgallery-result-card">' +
          '<img src="' + escapeAttr(product.image) + '" alt="' + escapeAttr(product.title) + '" loading="lazy" decoding="async" />' +
          '<div class="coolgallery-result-body">' +
          '<p class="title">' + escapeHtml(product.title) + '</p>' +
          '<p class="coolgallery-meta">' + escapeHtml(product.category) + '</p>' +
          '<p class="coolgallery-result-price">' + formatMoney(product.priceCents, product.currency) + '</p>' +
          '<div class="coolgallery-result-actions">' +
          '<button type="button" class="btn btn--primary" data-add-to-cart data-id="' + escapeAttr(product.id) + '">Add to cart</button>' +
          '</div>' +
          '</div>' +
          '</article>'
        );
      }).join('') + '</div>' : '') +
      '<div class="coolgallery-actions">' +
      '<button type="button" class="btn btn--primary" data-action="restart">Start again</button>' +
      '<a href="store.html" class="btn btn--ghost">Browse store</a>' +
      '</div>' +
      '</section>';

    var restartBtn = container.querySelector('[data-action="restart"]');
    if (restartBtn) {
      restartBtn.addEventListener("click", function () {
        startCoolGallery(container, state.products);
      });
    }
    container.querySelectorAll('[data-add-to-cart]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.dataset.id;
        var product = state.selected.find(function (p) { return p.id === id; });
        if (product) {
          addToCart(product, 1);
        }
      });
    });
    container.querySelectorAll(".coolgallery-result-card img").forEach(function (img) {
      addImgFallback(img);
    });
    initReveal();
  }

  function startCoolGallery(container, products) {
    coolGalleryState = {
      container: container,
      products: products.slice(),
      index: 0,
      selected: [],
    };
    var hero = document.querySelector('.coolgallery-hero');
    if (hero) hero.style.display = 'none';
    renderCoolGalleryCard();
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
    else if (page === "coolgallery") {
        var cgr = document.getElementById("coolgallery-root");
        if (cgr) {
          cgr.setAttribute("aria-busy", "true");
          fetchProducts()
            .then(function (products) {
              cgr.setAttribute("aria-busy", "false");
              renderCoolGalleryIntro(cgr, products);
            })
            .catch(function (error) {
              console.error("Failed to load CoolGallery:", error);
              cgr.setAttribute("aria-busy", "false");
              cgr.innerHTML = '<p class="error-state">Could not load the gallery. Try again later.</p>';
            });
        }
      }
    else if (page === "product") initProductPage();
    else if (page === "cart") renderCartPage();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", onReady);
  } else {
    onReady();
  }

  // Cache products to avoid redundant network calls
  var _productsCache = null;
  var coolGalleryState = null;
  var pendingConfirmation = null;

  function injectConfirmationModal() {
    if (document.getElementById("modal-confirm-backdrop")) return;
    var wrap = document.createElement("div");
    wrap.innerHTML =
      '<div class="modal-backdrop modal-backdrop--confirm" id="modal-confirm-backdrop" aria-hidden="true"></div>' +
      '<div class="modal modal--confirm" id="modal-confirm" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" aria-describedby="confirm-msg" hidden>' +
      '<h2 id="confirm-title"></h2>' +
      '<p id="confirm-msg"></p>' +
      '<div class="modal__actions">' +
      '<button type="button" class="btn btn--ghost" id="confirm-cancel">Cancel</button>' +
      '<button type="button" class="btn btn--primary" id="confirm-ok">Confirm</button>' +
      "</div></div>";
    document.body.appendChild(wrap);
  }

  function showConfirmation(title, message) {
    return new Promise(function (resolve) {
      injectConfirmationModal();
      var bd = document.getElementById("modal-confirm-backdrop");
      var m = document.getElementById("modal-confirm");
      if (!bd || !m) { resolve(false); return; }
      document.getElementById("confirm-title").textContent = title;
      document.getElementById("confirm-msg").textContent = message;
      var okBtn = document.getElementById("confirm-ok");
      var cancelBtn = document.getElementById("confirm-cancel");

      function cleanup() {
        bd.classList.remove("is-open");
        m.classList.remove("is-open");
        m.hidden = true;
        pendingConfirmation = null;
      }

      okBtn.onclick = function () { cleanup(); resolve(true); };
      cancelBtn.onclick = function () { cleanup(); resolve(false); };
      bd.onclick = function () { cleanup(); resolve(false); };

      m.hidden = false;
      bd.classList.add("is-open");
      m.classList.add("is-open");
      m.querySelector("#confirm-ok").focus();
      pendingConfirmation = { resolve: resolve };
    });
  }

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

  // Utility: replace broken images with a colored placeholder
  function addImgFallback(img) {
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

  // Utility function to safely escape attributes for HTML injection
  function escapeAttr(s) {
    s = s == null ? "" : String(s);
    return s
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

        var htmlContent = '<div class="product-layout">' +
                          '<div class="product-hero">' +
                          '<img src="' + escapeAttr(p.image) + '" alt="' + escapeAttr(p.title) + '" loading="lazy" decoding="async" />' +
                          "</div>" +
                          '<div class="product-detail">' +
                          '<p class="eyebrow">' + escapeHtml(p.category) + "</p>" +
                          '<h1 style="font-size: clamp(1.75rem, 4vw, 2.25rem); margin: 0 0 0.5rem; line-height: 1.2;">' + escapeHtml(p.title) + "</h1>" +
                          '<p class="price">' + formatMoney(p.priceCents, p.currency) + "</p>" +
                          '<p class="description">' + escapeHtml(p.description) + '</p>' +
                          '<div class="btn-row">' +
                          // The button is a placeholder and needs JS to handle size/edition logic based on JSON data.
                          '<button type="button" class="btn btn--primary" data-add-print data-id="' + escapeAttr(p.id) + '" data-size="default">Add to cart</button>' +
                          '</div>' +
                          '</div>' +
                          '</div>';

        root.innerHTML = htmlContent;
        var addBtn = root.querySelector("[data-add-print]");
        if (addBtn) {
          addBtn.addEventListener("click", function () {
            addToCart(p, 1);
          });
        }
        var prodImg = root.querySelector(".product-hero img");
        if (prodImg) addImgFallback(prodImg);
      })
      .catch(function (error) {
        console.error("Failed to load product:", error);
        root.innerHTML = '<p class="error-state">Could not load product.</p>';
      });
  }

})();