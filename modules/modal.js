// Shared modal/dialog helpers
let activeDialog = null;
let lastFocusElement = null;

export function activateDialog(dialog) {
  if (!dialog) return;
  activeDialog = dialog;
  lastFocusElement = document.activeElement;
  document.body.classList.add("modal-open");
  setPageHidden(true);
  const focusable = getFocusableElements(dialog);
  if (focusable.length) {
    focusable[0].focus();
  }
}

export function deactivateDialog() {
  if (!activeDialog) return;
  document.body.classList.remove("modal-open");
  setPageHidden(false);
  if (lastFocusElement && lastFocusElement.focus) {
    lastFocusElement.focus();
  }
  activeDialog = null;
  lastFocusElement = null;
}

export function setPageHidden(hidden) {
  document.querySelectorAll("header, main, footer").forEach((el) => {
    if (!el) return;
    if (hidden) el.setAttribute("aria-hidden", "true");
    else el.removeAttribute("aria-hidden");
  });
}

export function getFocusableElements(root) {
  if (!root) return [];
  return Array.prototype.filter.call(
    root.querySelectorAll(
      'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
    ),
    (el) => {
      return (
        el.offsetWidth > 0 ||
        el.offsetHeight > 0 ||
        el.getClientRects().length
      );
    }
  );
}

export function handleDialogTab(event) {
  if (!activeDialog || event.key !== "Tab") return;
  const focusable = getFocusableElements(activeDialog);
  if (!focusable.length) return;
  const currentIndex = focusable.indexOf(document.activeElement);
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

export function openModalPair(backdropId, modalId) {
  const bd = document.getElementById(backdropId);
  const m = document.getElementById(modalId);
  if (!bd || !m) return;
  m.hidden = false;
  bd.classList.add("is-open");
  m.classList.add("is-open");
  activateDialog(m);
}

export function closeModalPair(backdropId, modalId) {
  const bd = document.getElementById(backdropId);
  const m = document.getElementById(modalId);
  if (!bd || !m) return;
  bd.classList.remove("is-open");
  m.classList.remove("is-open");
  m.hidden = true;
  deactivateDialog();
}
