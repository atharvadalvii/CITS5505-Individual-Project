/**
 * AI log: close the table-of-contents dropdown after navigation or when clicking away.
 */
(function () {
  "use strict";

  var shell = document.querySelector(".reflection-toc-shell");
  var det = document.getElementById("reflection-toc-details");
  if (!shell || !det) return;

  det.querySelectorAll(".reflection-doc-toc a").forEach(function (a) {
    a.addEventListener("click", function () {
      det.removeAttribute("open");
    });
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && det.open) {
      det.removeAttribute("open");
    }
  });

  document.addEventListener("click", function (e) {
    if (!det.open) return;
    if (!shell.contains(e.target)) {
      det.removeAttribute("open");
    }
  });
})();
