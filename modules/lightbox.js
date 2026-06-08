// Lightbox module
import { escapeAttr } from "./utils.js";
import {
  activateDialog,
  deactivateDialog,
  setPageHidden,
  getFocusableElements,
  openModalPair,
  closeModalPair,
} from "./modal.js";

var lightboxState = {
  items: [],
  index: 0,
  lastFocus: null,
};

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

export function openLightbox(items, index) {
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

export function closeLightbox() {
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

export function lightboxPrev() {
  if (!lightboxState.items.length) return;
  lightboxState.index =
    (lightboxState.index - 1 + lightboxState.items.length) %
    lightboxState.items.length;
  updateLightboxSlide();
}

export function lightboxNext() {
  if (!lightboxState.items.length) return;
  lightboxState.index =
    (lightboxState.index + 1) %
    lightboxState.items.length;
  updateLightboxSlide();
}

export function initLightboxUi() {
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

export function initModalEscape() {
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

function handleDialogTab(event) {
  if (!event || event.key !== "Tab") return;
  // Check if any dialog is active by looking for is-open modals
  var cart = document.getElementById("modal-cart");
  var lb = document.getElementById("lightbox");
  var confirm = document.getElementById("modal-confirm");

  if (!cart && !lb && !confirm) return;

  var activeDialog = null;
  if (cart && cart.classList.contains("is-open")) activeDialog = cart;
  if (lb && lb.classList.contains("is-open")) activeDialog = lb;
  if (confirm && confirm.classList.contains("is-open")) activeDialog = confirm;
  if (!activeDialog) return;

  var focusable = Array.prototype.filter.call(
    activeDialog.querySelectorAll(
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
