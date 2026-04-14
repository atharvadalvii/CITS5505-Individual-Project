/**
 * Light / dark appearance toggle. Persists choice in localStorage under cits5505-theme.
 * Run from <head> (before CSS) so stored dark theme applies before first paint.
 */
(function () {
  "use strict";

  var STORAGE_KEY = "cits5505-theme";

  try {
    if (localStorage.getItem(STORAGE_KEY) === "dark") {
      document.documentElement.setAttribute("data-theme", "dark");
    }
  } catch (err) {
    /* ignore */
  }

  function getStoredTheme() {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch (err) {
      return null;
    }
  }

  function setStoredTheme(theme) {
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch (err) {
      /* private mode */
    }
  }

  function applyTheme(theme) {
    var root = document.documentElement;
    if (theme === "dark") {
      root.setAttribute("data-theme", "dark");
    } else {
      root.removeAttribute("data-theme");
    }
    var btn = document.getElementById("themeToggle");
    if (btn) {
      btn.setAttribute(
        "aria-label",
        theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
      );
      btn.setAttribute("aria-pressed", theme === "dark" ? "true" : "false");
    }
  }

  function readInitialTheme() {
    var stored = getStoredTheme();
    if (stored === "dark") return "dark";
    return "light";
  }

  function init() {
    applyTheme(readInitialTheme());
    var btn = document.getElementById("themeToggle");
    if (!btn) return;
    btn.addEventListener("click", function () {
      var next =
        document.documentElement.getAttribute("data-theme") === "dark"
          ? "light"
          : "dark";
      setStoredTheme(next);
      applyTheme(next);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
