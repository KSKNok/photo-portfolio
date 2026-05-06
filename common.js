// Common utilities for the photo portfolio
(function() {
  "use strict";

  // Set copyright year
  function setCopyrightYear() {
    var yearElements = document.querySelectorAll("#y");
    yearElements.forEach(function(el) {
      el.textContent = new Date().getFullYear();
    });
  }

  // Initialize common functionality
  function initCommon() {
    setCopyrightYear();
  }

  // Run on DOM ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initCommon);
  } else {
    initCommon();
  }
})();