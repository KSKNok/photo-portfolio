// CoolGallery module - swipe-to-choose interactive gallery
import { escapeHtml, escapeAttr, addImgFallback, formatMoney, initReveal } from "./utils.js";
import { addToCart } from "./cart.js";

let coolGalleryState = null;

export function startCoolGallery(container, products) {
  coolGalleryState = {
    container: container,
    products: products.slice(),
    index: 0,
    selected: [],
  };
  const hero = document.querySelector('.coolgallery-hero');
  if (hero) hero.style.display = 'none';
  renderCoolGalleryCard();
}

export function initCoolGalleryPage() {
  const hero = document.querySelector('.coolgallery-hero');
  const startBtn = hero ? hero.querySelector('[data-action="start"]') : null;
  const content = document.getElementById("coolgallery-content");
  if (!startBtn || !content) return;

  import("./utils.js").then((utils) => {
    utils.fetchProducts()
      .then((products) => {
        startBtn.addEventListener("click", () => {
          startCoolGallery(content, products);
        });
      })
      .catch((error) => {
        console.error("Failed to load CoolGallery:", error);
        startBtn.disabled = true;
        startBtn.textContent = 'Gallery unavailable';
      });
  });
}

function updateCoolGalleryHint(card, offset) {
  if (!card) return;
  const left = card.querySelector(".swipe-hint--left");
  const right = card.querySelector(".swipe-hint--right");
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
  const state = coolGalleryState;
  if (!state || !state.container) return;
  const card = state.container.querySelector(".coolgallery-card");
  if (!card) return;
  const product = state.products[state.index];
  const direction = action === "like" ? 1 : -1;
  if (action === "like") {
    state.selected.push(product);
  }

  card.style.transition = "transform 0.35s ease, opacity 0.35s ease";
  card.style.transform = `translateX(${direction * 110}vw) rotate(${direction * 26}deg)`;
  card.style.opacity = "0";
  card.querySelectorAll(".swipe-hint").forEach((hint) => {
    hint.classList.remove("is-active");
  });

  window.setTimeout(() => {
    state.index += 1;
    renderCoolGalleryCard();
  }, 360);
}

function renderCoolGalleryCard() {
  const state = coolGalleryState;
  if (!state || !state.container) return;
  const container = state.container;
  if (state.index >= state.products.length) {
    renderCoolGalleryResults();
    return;
  }

  const product = state.products[state.index];
  container.innerHTML = `
    <section class="coolgallery-stage reveal">
      <div class="coolgallery-card" role="group" aria-label="Swipeable image card">
        <img src="${escapeAttr(product.image)}" alt="${escapeAttr(product.title)}" loading="lazy" decoding="async" />
        <div class="swipe-hint swipe-hint--left">Pass</div>
        <div class="swipe-hint swipe-hint--right">Keep</div>
        <div class="coolgallery-card__info">
          <p class="page-subtitle">Swipe right to select</p>
          <h2 class="page-title">${escapeHtml(product.title)}</h2>
          <p class="coolgallery-copy">${escapeHtml(product.description)}</p>
          <p class="coolgallery-meta">${escapeHtml(product.category)} • ${formatMoney(product.priceCents, product.currency)}</p>
        </div>
      </div>
      <div class="coolgallery-actions">
        <button type="button" class="btn btn--ghost coolgallery-action" data-action="pass">Swipe left</button>
        <button type="button" class="btn btn--primary coolgallery-action" data-action="like">Swipe right</button>
      </div>
      <p class="coolgallery-hint">Drag the image left to pass or right to keep. Use buttons if you prefer.</p>
      <p class="coolgallery-progress">${state.index + 1} of ${state.products.length} prints</p>
    </section>`;

  const card = container.querySelector(".coolgallery-card");
  if (!card) return;
  card.style.touchAction = "none";
  let pointerData = null;

  card.addEventListener("pointerdown", (event) => {
    pointerData = {
      id: event.pointerId,
      startX: event.clientX,
      currentX: event.clientX,
    };
    card.setPointerCapture(event.pointerId);
    card.style.transition = "none";
  });

  card.addEventListener("pointermove", (event) => {
    if (!pointerData || event.pointerId !== pointerData.id) return;
    pointerData.currentX = event.clientX;
    const offset = pointerData.currentX - pointerData.startX;
    card.style.transform = `translateX(${offset}px) rotate(${offset / 20}deg)`;
    updateCoolGalleryHint(card, offset);
  });

  card.addEventListener("pointerup", (event) => {
    if (!pointerData || event.pointerId !== pointerData.id) return;
    const offset = pointerData.currentX - pointerData.startX;
    card.releasePointerCapture(event.pointerId);
    if (offset >= 90) swipeCoolGalleryCard("like");
    else if (offset <= -90) swipeCoolGalleryCard("pass");
    else resetCoolGalleryCard(card);
    pointerData = null;
  });

  card.addEventListener("pointercancel", (event) => {
    if (!pointerData || event.pointerId !== pointerData.id) return;
    card.releasePointerCapture(event.pointerId);
    resetCoolGalleryCard(card);
    pointerData = null;
  });

  container.querySelectorAll("[data-action='pass'], [data-action='like']").forEach((button) => {
    button.addEventListener("click", () => {
      swipeCoolGalleryCard(button.dataset.action);
    });
  });
  container.querySelectorAll(".coolgallery-card img").forEach((img) => {
    addImgFallback(img);
  });
  // Initialize reveal animations for the card
  initReveal();
}

function renderCoolGalleryResults() {
  const state = coolGalleryState;
  if (!state || !state.container) return;
  const container = state.container;
  const selected = state.selected;
  const count = selected.length;

  container.innerHTML = `
    <section class="coolgallery-results reveal">
      <div class="page-header">
        <p class="page-subtitle">Finished</p>
        <h1 class="page-title">${count ? 'Congratulations!' : 'Gallery complete'}</h1>
        <p class="page-description">${count
          ? `You selected ${count} image${count === 1 ? '' : 's'}. Here are your favorites with price details.`
          : 'No favorites were kept this time. You can restart to try again.'}</p>
      </div>
      ${count ? `<div class="coolgallery-grid">${selected.map((product) => `
        <article class="coolgallery-result-card">
          <img src="${escapeAttr(product.image)}" alt="${escapeAttr(product.title)}" loading="lazy" decoding="async" />
          <div class="coolgallery-result-body">
            <p class="title">${escapeHtml(product.title)}</p>
            <p class="coolgallery-meta">${escapeHtml(product.category)}</p>
            <p class="coolgallery-result-price">${formatMoney(product.priceCents, product.currency)}</p>
            <div class="coolgallery-result-actions">
              <button type="button" class="btn btn--primary" data-add-to-cart data-id="${escapeAttr(product.id)}">Add to cart</button>
            </div>
          </div>
        </article>`).join('')}</div>` : ''}
      <div class="coolgallery-actions">
        <button type="button" class="btn btn--primary" data-action="restart">Start again</button>
        <a href="store.html" class="btn btn--ghost">Browse store</a>
      </div>
    </section>`;

  const restartBtn = container.querySelector('[data-action="restart"]');
  if (restartBtn) {
    restartBtn.addEventListener("click", () => {
      startCoolGallery(container, state.products);
    });
  }
  container.querySelectorAll('[data-add-to-cart]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      const product = state.selected.find((p) => p.id === id);
      if (product) {
        addToCart(product, 1);
      }
    });
  });
  container.querySelectorAll(".coolgallery-result-card img").forEach((img) => {
    addImgFallback(img);
  });
  // Initialize reveal animations for the results
  initReveal();
}
