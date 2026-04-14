/**
 * Tutorial page: button demo, live sandbox, read-time estimate, smooth TOC,
 * reading mode, and checklist persisted in localStorage.
 */
(function () {
  "use strict";

  var CHECKLIST_STORAGE_KEY = "cits5505-tutorial-checklist";

  function initButtonDemo() {
    var demoBtn = document.getElementById("demoBtn");
    var demoText = document.getElementById("demoText");
    if (!demoBtn || !demoText) return;
    demoBtn.addEventListener("click", function () {
      demoText.textContent = "Button clicked — the DOM was updated without reloading the page.";
    });
  }

  /**
   * Live sandbox: CSS custom property driven by range + textContent update from input.
   */
  function initLiveSandbox() {
    var box = document.getElementById("sandboxBox");
    var hueSlider = document.getElementById("sandboxHueSlider");
    var labelInput = document.getElementById("sandboxLabelInput");
    var liveCaption = document.getElementById("sandboxLiveCaption");

    if (!box || !hueSlider || !labelInput || !liveCaption) return;

    function applyHue() {
      var h = parseInt(hueSlider.value, 10);
      box.style.setProperty("--sandbox-hue", String(h));
    }

    function applyLabel() {
      liveCaption.textContent = labelInput.value.trim() || "(type a label)";
    }

    hueSlider.addEventListener("input", applyHue);
    labelInput.addEventListener("input", applyLabel);
    applyHue();
    applyLabel();
  }

  /** Rough reading time from visible text in the tutorial main column. */
  function initReadTime() {
    var main = document.querySelector(".tutorial-container");
    var out = document.getElementById("tutorial-read-time");
    if (!main || !out) return;

    var raw = (main.innerText || main.textContent || "").replace(/\s+/g, " ").trim();
    var words = raw ? raw.split(" ").length : 0;
    var minutes = Math.max(1, Math.round(words / 200));
    out.textContent = "About " + minutes + " min read (" + words + " words)";
  }

  /** Smooth scroll for same-page anchor links inside the table of contents. */
  function initTocSmoothScroll() {
    var toc = document.querySelector(".tutorial-toc");
    if (!toc) return;

    toc.addEventListener("click", function (e) {
      var a = e.target && e.target.closest ? e.target.closest("a[href^='#']") : null;
      if (!a || toc !== a.closest(".tutorial-toc")) return;
      var id = a.getAttribute("href");
      if (!id || id.length < 2) return;
      var el = document.getElementById(id.slice(1));
      if (!el) return;
      e.preventDefault();
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      history.replaceState(null, "", id);
    });
  }

  function escapeForScriptTag(source) {
    return source.replace(/<\/script>/gi, "<\\/script>");
  }

  function buildTryDoc(mode, source) {
    if (mode === "css") {
      return (
        "<!doctype html><html><head><meta charset='utf-8'><style>" +
        source +
        "</style></head><body>" +
        "<section class='card'><h2>Sample card</h2><p>Edit CSS and click Run to preview changes.</p><span class='accent-chip'>Accent sample</span></section>" +
        "<div class='card-row'><section class='card'><h3>Card A</h3><p>Uses shared tokens.</p></section>" +
        "<section class='card'><h3>Card B</h3><p>Responsive at 700px.</p></section></div>" +
        "</body></html>"
      );
    }

    if (mode === "js") {
      return (
        "<!doctype html><html><head><meta charset='utf-8'><style>" +
        "body{font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;padding:16px;color:#111;}" +
        "input{padding:8px;width:100%;max-width:320px;margin:0 0 12px;}" +
        "#namePreview{padding:10px;border:1px solid #d5d5d5;background:#f7f7f7;}" +
        "#jsError{color:#b00020;font-family:ui-monospace,monospace;font-size:12px;white-space:pre-wrap;margin-top:10px;}" +
        "</style></head><body>" +
        "<label for='nameInput'>Name</label><input id='nameInput' value=''>" +
        "<p id='namePreview'>Run your code to see preview text.</p><pre id='jsError'></pre>" +
        "<script>try{" +
        escapeForScriptTag(source) +
        "}catch(err){document.getElementById('jsError').textContent=String(err && err.message ? err.message : err);}<\\/script>" +
        "</body></html>"
      );
    }

    return (
      "<!doctype html><html><head><meta charset='utf-8'><style>" +
      "body{font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;padding:16px;line-height:1.45;}" +
      "input,button{margin-top:8px;}" +
      "</style></head><body>" +
      source +
      "</body></html>"
    );
  }

  function initTryItYourself() {
    var toggleButtons = document.querySelectorAll(".tutorial-example-btn--toggle[data-try-target]");
    for (var i = 0; i < toggleButtons.length; i++) {
      (function (btn) {
        var targetId = btn.getAttribute("data-try-target");
        var panel = targetId ? document.getElementById(targetId) : null;
        if (!panel) return;

        var editor = panel.querySelector(".tutorial-try-editor");
        var runBtn = panel.querySelector(".tutorial-try-run");
        var resetBtn = panel.querySelector(".tutorial-try-reset");
        var frame = panel.querySelector(".tutorial-try-frame");
        if (!editor || !runBtn || !resetBtn || !frame) return;

        var initial = editor.value;
        var mode = panel.getAttribute("data-try-mode") || "html";

        function render() {
          var doc = buildTryDoc(mode, editor.value);
          // Prefer srcdoc, with data URL fallback for browsers that behave inconsistently.
          frame.srcdoc = doc;
          frame.src = "data:text/html;charset=utf-8," + encodeURIComponent(doc);
        }

        btn.addEventListener("click", function () {
          var hidden = panel.hasAttribute("hidden");
          if (hidden) {
            panel.removeAttribute("hidden");
            btn.textContent = "Hide Editor";
            render();
            return;
          }
          panel.setAttribute("hidden", "");
          btn.textContent = "Try it Yourself »";
        });

        runBtn.addEventListener("click", render);
        resetBtn.addEventListener("click", function () {
          editor.value = initial;
          render();
        });
      })(toggleButtons[i]);
    }
  }

  function initReadingMode() {
    var btn = document.getElementById("readingModeBtn");
    if (!btn) return;

    function setPressed(on) {
      document.body.classList.toggle("reading-mode", on);
      btn.setAttribute("aria-pressed", on ? "true" : "false");
      btn.textContent = on ? "Exit reading mode" : "Reading mode";
    }

    btn.addEventListener("click", function () {
      setPressed(!document.body.classList.contains("reading-mode"));
    });

    // Keyboard escape hatch when reading mode is active.
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && document.body.classList.contains("reading-mode")) {
        setPressed(false);
      }
    });
  }

  function loadChecklistState() {
    try {
      var raw = window.localStorage.getItem(CHECKLIST_STORAGE_KEY);
      if (!raw) return {};
      var parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch (err) {
      return {};
    }
  }

  function saveChecklistState(state) {
    try {
      window.localStorage.setItem(CHECKLIST_STORAGE_KEY, JSON.stringify(state));
    } catch (err) {
      /* quota or private mode — ignore */
    }
  }

  function initChecklist() {
    var list = document.getElementById("tutorialChecklist");
    var resetBtn = document.getElementById("checklistResetBtn");
    if (!list) return;

    var state = loadChecklistState();
    var boxes = list.querySelectorAll('input[type="checkbox"][data-check-key]');

    for (var i = 0; i < boxes.length; i++) {
      var box = boxes[i];
      var key = box.getAttribute("data-check-key");
      if (key && state[key]) {
        box.checked = true;
      }
      box.addEventListener("change", function () {
        var k = this.getAttribute("data-check-key");
        if (!k) return;
        if (this.checked) {
          state[k] = true;
        } else {
          delete state[k];
        }
        saveChecklistState(state);
      });
    }

    if (resetBtn) {
      resetBtn.addEventListener("click", function () {
        if (!window.confirm("Clear all checklist ticks in this browser?")) return;
        state = {};
        try {
          window.localStorage.removeItem(CHECKLIST_STORAGE_KEY);
        } catch (err) {
          /* ignore */
        }
        for (var j = 0; j < boxes.length; j++) {
          boxes[j].checked = false;
        }
      });
    }
  }

  function init() {
    initButtonDemo();
    initLiveSandbox();
    initReadTime();
    initTocSmoothScroll();
    initTryItYourself();
    initReadingMode();
    initChecklist();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
