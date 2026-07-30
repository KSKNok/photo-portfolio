// Cart management module
import { formatMoney, escapeHtml, escapeAttr, fetchProducts } from "./utils.js";
import {
  activateDialog,
  deactivateDialog,
  setPageHidden,
  getFocusableElements,
  openModalPair,
  closeModalPair,
} from "./modal.js";

const CART_KEY = "photo-portfolio-cart";

export function getCart() {
  try {
    const raw = localStorage.getItem(CART_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.warn("Failed to load cart from localStorage:", e);
    return [];
  }
}

export function setCart(items) {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
    updateCartBadge();
  } catch (e) {
    console.error("Failed to save cart to localStorage:", e);
  }
}

export function addToCart(product, qty) {
  qty = qty == null ? 1 : Math.max(1, parseInt(qty, 10) || 1);
  const normalized = {
    id: String(product.id),
    title: product.title,
    priceCents: Number(product.priceCents) || 0,
    currency: product.currency || "USD",
    image: product.image || "",
  };
  const line = {
    id: normalized.id,
    title: normalized.title,
    priceCents: normalized.priceCents,
    currency: normalized.currency,
    image: normalized.image,
    qty: qty,
  };
  const cart = getCart();
  const found = cart.find((i) => {
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

export function getCartCount() {
  return getCart().reduce((sum, i) => {
    return sum + (i.qty || 0);
  }, 0);
}

export function updateCartBadge() {
  const badge = document.querySelector(".cart-badge");
  if (!badge) return;
  const n = getCartCount();
  badge.textContent = n > 99 ? "99+" : String(n);
  badge.classList.toggle("is-visible", n > 0);
}

function renderCartModalBody() {
  const body = document.getElementById("cart-modal-body");
  if (!body) return;
  const cart = getCart();
  if (!cart.length) {
    body.innerHTML = '<p class="cart-empty">Your cart is empty.</p>';
    return;
  }

  const total = cart.reduce((s, i) => {
    return s + i.priceCents * (i.qty || 1);
  }, 0);
  const currency = cart[0].currency || "USD";
  const lines = cart
    .map((i, idx) => {
      return `
        <li data-item-idx='${idx}' class='cart-modal-item'>
          <span class="cart-modal-item-details">${escapeHtml(i.title)}</span>
          <div class="cart-qty">
            <button type="button" class="btn btn--ghost qty-btn" data-action="decrease" data-item-idx="${idx}" data-qty="-1">−</button>
            <span class="qty-val">${i.qty || 1}</span>
            <button type="button" class="btn btn--ghost qty-btn" data-action="increase" data-item-idx="${idx}" data-qty="1">+</button>
          </div>
          <span style="flex-shrink: 0;">${formatMoney(i.priceCents * (i.qty || 1), i.currency)}</span>
          <button type="button" class="btn btn--ghost trash-item-btn" data-item-idx="${idx}" aria-label="Remove this item">&times;</button></li>`;
    })
    .join("");

  body.innerHTML =
    `<ul class="cart-list">${lines}</ul>
    <p><strong style='display: block; margin-top: 1rem;'>Subtotal:</strong> ${formatMoney(total, currency)}</p>`;
}

export function renderCartPage() {
  const content = document.getElementById("cart-page-content");
  if (!content) return;
  const cart = getCart();
  if (!cart.length) {
    content.innerHTML = '<div class="cart-empty-state"><p class="cart-empty">Your cart is empty.</p><a href="store.html" class="btn btn--primary">Continue shopping</a></div>';
    return;
  }

  const total = cart.reduce((s, i) => {
    return s + i.priceCents * (i.qty || 1);
  }, 0);
  const currency = cart[0].currency || "USD";
  const lines = cart
    .map((i, idx) => {
      return `
        <li data-item-idx="${idx}" class="cart-item">
          <div class="cart-item__media">
            <img src="${escapeAttr(i.image)}" alt="${escapeAttr(i.title)}" loading="lazy" />
          </div>
          <div class="cart-item__details">
            <h3 class="cart-item__title">${escapeHtml(i.title)}</h3>
            <p class="cart-item__price">${formatMoney(i.priceCents, i.currency)}</p>
          </div>
          <div class="cart-item__controls">
            <div class="qty-controls">
              <button type="button" class="qty-btn qty-btn--decrease" data-action="decrease" data-item-idx="${idx}" data-qty="-1" aria-label="Decrease quantity">−</button>
              <span class="qty-val">${i.qty || 1}</span>
              <button type="button" class="qty-btn qty-btn--increase" data-action="increase" data-item-idx="${idx}" data-qty="1" aria-label="Increase quantity">+</button>
            </div>
            <span class="cart-item__subtotal">${formatMoney(i.priceCents * (i.qty || 1), i.currency)}</span>
          </div>
          <button type="button" class="cart-item__remove trash-item-btn" data-item-idx="${idx}" aria-label="Remove this item from cart" title="Remove item">×</button>
        </li>`;
    })
    .join("");

  content.innerHTML =
    `<ul class="cart-items">${lines}</ul>
    <div class="cart-summary">
      <div class="cart-summary__row">
        <span class="cart-summary__label">Subtotal:</span>
        <span class="cart-summary__value">${formatMoney(total, currency)}</span>
      </div>
      <div class="cart-actions">
        <button type="button" class="btn btn--ghost" id="empty-cart-page">Empty Cart</button>
        <button type="button" class="btn btn--primary" data-open-coming-soon>Proceed to Checkout</button>
      </div>
    </div>`;

  content.removeEventListener("click", handleCartPageClick);
  content.addEventListener("click", handleCartPageClick);
  content.querySelectorAll(".cart-item__media img").forEach((img) => {
    addImgFallback(img);
  });
}

function handleCartPageClick(e) {
  const target = e.target;
  if (!target) return;

  if (target.classList.contains("qty-btn")) {
    const btn = target;
    const idx = parseInt(btn.dataset.itemIdx, 10);
    const delta = parseInt(btn.dataset.qty, 10);
    const currentCart = getCart();
    if (currentCart[idx]) {
      const newQty = currentCart[idx].qty + delta;
      if (newQty < 1) {
        showConfirmation("Remove item", "Remove this item from your cart?")
          .then((confirmed) => {
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

  if (target.classList.contains("trash-item-btn")) {
    const idx = parseInt(target.dataset.itemIdx, 10);
    const currentCart = getCart();
    if (currentCart[idx]) {
      showConfirmation("Remove item", "Remove this item from your cart?")
        .then((confirmed) => {
          if (confirmed) {
            currentCart.splice(idx, 1);
            setCart(currentCart);
            renderCartPage();
          }
        });
    }
  }

  if (target.id === "empty-cart-page") {
    showConfirmation("Empty cart", "Remove all items from your cart?")
      .then((confirmed) => {
        if (confirmed) {
          localStorage.removeItem(CART_KEY);
          setCart([]);
          renderCartPage();
        }
      });
  }
}

function handleCartModalClick(e) {
  const target = e.target;
  if (!target) return;

  if (target.classList.contains("qty-btn")) {
    const btn = target;
    const idx = parseInt(btn.dataset.itemIdx, 10);
    const delta = parseInt(btn.dataset.qty, 10);
    const currentCart = getCart();
    if (currentCart[idx]) {
      const newQty = currentCart[idx].qty + delta;
      if (newQty < 1) {
        showConfirmation("Remove item", "Remove this item from your cart?")
          .then((confirmed) => {
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

  if (target.classList.contains("trash-item-btn")) {
    const idx = parseInt(target.dataset.itemIdx, 10);
    const currentCart = getCart();
    if (currentCart[idx]) {
      showConfirmation("Remove item", "Remove this item from your cart?")
        .then((confirmed) => {
          if (confirmed) {
            currentCart.splice(idx, 1);
            setCart(currentCart);
            renderCartModalBody();
          }
        });
    }
  }

  if (target.dataset && target.dataset.emptyCart != null) {
    showConfirmation("Empty cart", "Remove all items from your cart?")
      .then((confirmed) => {
        if (confirmed) {
          localStorage.removeItem(CART_KEY);
          setCart([]);
          renderCartModalBody();
        }
      });
  }
}

function injectComingSoonModal() {
  if (document.getElementById("modal-coming-soon-backdrop")) return;
  const wrap = document.createElement("div");
  wrap.innerHTML =
    `<div class="modal-backdrop" id="modal-coming-soon-backdrop" aria-hidden="true"></div>
    <div class="modal" id="modal-coming-soon" role="dialog" aria-modal="true" aria-labelledby="coming-soon-title" hidden>
    <h2 id="coming-soon-title">Coming soon</h2>
    <p>Checkout and print fulfillment will be available shortly. Thank you for your interest.</p>
    <div class="modal__actions">
      <button type="button" class="btn btn--primary" data-close-coming-soon>OK</button>
    </div></div>`;
  document.body.appendChild(wrap);
}

function injectCartModal() {
  if (document.getElementById("modal-cart-backdrop")) return;
  const wrap = document.createElement("div");
  wrap.innerHTML =
    `<div class="modal-backdrop" id="modal-cart-backdrop" aria-hidden="true"></div>
    <div class="modal" id="modal-cart" role="dialog" aria-modal="true" aria-labelledby="cart-title" hidden>
    <h2 id="cart-title">Cart</h2>
    <div id="cart-modal-body"></div>
    <div class="modal__actions">
      <button type="button" class="btn btn--ghost" data-empty-cart>Empty Cart</button>
      <button type="button" class="btn btn--ghost" data-close-cart>Close</button>
    </div></div>`;
  document.body.appendChild(wrap);
}

let pendingConfirmation = null;

function injectConfirmationModal() {
  if (document.getElementById("modal-confirm-backdrop")) return;
  const wrap = document.createElement("div");
  wrap.innerHTML =
    `<div class="modal-backdrop modal-backdrop--confirm" id="modal-confirm-backdrop" aria-hidden="true"></div>
    <div class="modal modal--confirm" id="modal-confirm" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" aria-describedby="confirm-msg" hidden>
    <h2 id="confirm-title"></h2>
    <p id="confirm-msg"></p>
    <div class="modal__actions">
      <button type="button" class="btn btn--ghost" id="confirm-cancel">Cancel</button>
      <button type="button" class="btn btn--primary" id="confirm-ok">Confirm</button>
    </div></div>`;
  document.body.appendChild(wrap);
}

export function showConfirmation(title, message) {
  return new Promise((resolve) => {
    injectConfirmationModal();
    const bd = document.getElementById("modal-confirm-backdrop");
    const m = document.getElementById("modal-confirm");
    if (!bd || !m) { resolve(false); return; }
    document.getElementById("confirm-title").textContent = title;
    document.getElementById("confirm-msg").textContent = message;
    const okBtn = document.getElementById("confirm-ok");
    const cancelBtn = document.getElementById("confirm-cancel");

    function cleanup() {
      bd.classList.remove("is-open");
      m.classList.remove("is-open");
      m.hidden = true;
      pendingConfirmation = null;
    }

    okBtn.onclick = () => { cleanup(); resolve(true); };
    cancelBtn.onclick = () => { cleanup(); resolve(false); };
    bd.onclick = () => { cleanup(); resolve(false); };

    m.hidden = false;
    bd.classList.add("is-open");
    m.classList.add("is-open");
    m.querySelector("#confirm-ok").focus();
    pendingConfirmation = { resolve: resolve };
  });
}

function initCartButton() {
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
  const bd = document.getElementById("modal-coming-soon-backdrop");
  if (bd) {
    bd.addEventListener("click", () => {
      closeModalPair("modal-coming-soon-backdrop", "modal-coming-soon");
    });
  }
}

export {
  handleCartPageClick,
  handleCartModalClick,
};

export {
  initCartButton,
  initComingSoonTriggers,
  renderCartModalBody,
  injectCartModal,
};
