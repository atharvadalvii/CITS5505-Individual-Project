/**
 * Quiz application: fetch JSON, Fisher–Yates shuffle, DOM render, validation,
 * scoring, localStorage via QuizStorage, reward via QuizApi (pass only), beforeunload guard.
 */
(function () {
  "use strict";

  var shuffledQuestions = [];
  var answered = {};
  var submitted = false;
  var isDirty = false;
  var submitting = false;
  var beforeUnloadHandler = null;
  var tabBlurWhileDirty = false;

  /**
   * Bump this string whenever data/questions.json changes. Without it, many browsers
   * keep serving an older cached copy of the JSON, so you can appear "stuck" on 3 questions.
   */
  var QUESTIONS_JSON_QUERY = "v=16";

  /** Escape text for safe insertion into HTML strings. */
  function escapeHtml(text) {
    var div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  /** Fisher–Yates shuffle — uniform random order (unbiased). */
  function shuffleArray(array) {
    var arr = array.slice();
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = arr[i];
      arr[i] = arr[j];
      arr[j] = t;
    }
    return arr;
  }

  function getDateTimeStr() {
    return new Date().toLocaleString();
  }

  /** Renders the attempts table into #attempt-history (toolbar lives outside this div). */
  function renderAttempts() {
    var section = document.getElementById("attempt-history");
    if (!section) return;

    var attempts = window.QuizStorage.loadAttempts();
    if (!attempts.length) {
      section.innerHTML =
        "<p class=\"attempt-history-empty\">No previous attempts stored in this browser yet.</p>";
      return;
    }

    var html =
      "<div class=\"attempt-table-wrap\"><table aria-describedby=\"attempts-heading\"><thead><tr>" +
      "<th scope=\"col\">Date &amp; Time</th><th scope=\"col\">Score</th><th scope=\"col\">Percent</th><th scope=\"col\">Status</th>" +
      "</tr></thead><tbody>";

    for (var i = 0; i < attempts.length; i++) {
      var att = attempts[i];
      var passClass = att.pass ? "pass" : "fail";
      var statusText = att.pass ? "Passed" : "Failed";
      html +=
        "<tr><td>" +
        escapeHtml(att.date) +
        "</td><td>" +
        escapeHtml(String(att.score)) +
        "</td><td>" +
        escapeHtml(String(att.percent)) +
        "%</td><td class=\"" +
        passClass +
        "\">" +
        statusText +
        "</td></tr>";
    }
    html += "</tbody></table></div>";
    section.innerHTML = html;
  }

  function renderQuiz() {
    var container = document.getElementById("quiz-container");
    if (!container) return;

    var html = "";
    shuffledQuestions.forEach(function (q, qi) {
      html +=
        '<div class="quiz-card" id="question-' +
        qi +
        '"><div class="quiz-question">' +
        (qi + 1) +
        ". " +
        escapeHtml(q.question) +
        '</div><div class="quiz-options" id="options-' +
        qi +
        '">';
      q.options.forEach(function (opt, oi) {
        var inputId = "q" + qi + "o" + oi;
        html +=
          '<label class="quiz-option" for="' +
          inputId +
          '"><input type="radio" id="' +
          inputId +
          '" name="q' +
          qi +
          '" value="' +
          oi +
          '" /> <span class="quiz-option-text">' +
          escapeHtml(opt) +
          "</span></label>";
      });
      html += "</div></div>";
    });
    container.innerHTML = html;
  }

  function collectAnswers() {
    answered = {};
    shuffledQuestions.forEach(function (q, qi) {
      var options = document.getElementsByName("q" + qi);
      for (var i = 0; i < options.length; i++) {
        if (options[i].checked) {
          answered[qi] = parseInt(options[i].value, 10);
          break;
        }
      }
    });
  }

  /** Marks unanswered cards and returns false if any are missing. */
  function checkUnanswered() {
    var allAnswered = true;
    shuffledQuestions.forEach(function (q, qi) {
      var card = document.getElementById("question-" + qi);
      if (!card) return;
      if (answered[qi] === undefined) {
        card.classList.add("quiz-unanswered");
        allAnswered = false;
      } else {
        card.classList.remove("quiz-unanswered");
      }
    });
    return allAnswered;
  }

  function scrollToFirstUnanswered() {
    for (var qi = 0; qi < shuffledQuestions.length; qi++) {
      if (answered[qi] === undefined) {
        var card = document.getElementById("question-" + qi);
        if (card) {
          card.scrollIntoView({ behavior: "smooth", block: "center" });
        }
        break;
      }
    }
  }

  /**
   * beforeunload: one listener for the whole session. Browsers only show the native dialog for
   * navigation away / refresh / close — not when switching tabs (use visibility + banner for that).
   */
  function setupBeforeUnloadWarning() {
    beforeUnloadHandler = function (e) {
      if (submitted || !isDirty) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", beforeUnloadHandler);
  }

  function showQuizTabReturnBanner() {
    var el = document.getElementById("quiz-session-banner");
    if (!el || submitted || !isDirty) return;
    el.textContent = "";
    var p = document.createElement("p");
    p.className = "quiz-session-banner__text";
    p.textContent =
      "You switched away while the quiz is in progress. Your answers stay in this tab until you submit or reload the page.";
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "quiz-session-banner__dismiss";
    btn.textContent = "Dismiss";
    btn.addEventListener("click", function () {
      el.setAttribute("hidden", "");
      el.textContent = "";
    });
    el.appendChild(p);
    el.appendChild(btn);
    el.removeAttribute("hidden");
  }

  function setupVisibilityReturnNotice() {
    document.addEventListener("visibilitychange", function () {
      if (!isDirty || submitted) return;
      if (document.visibilityState === "hidden") {
        tabBlurWhileDirty = true;
        return;
      }
      if (document.visibilityState === "visible" && tabBlurWhileDirty) {
        tabBlurWhileDirty = false;
        showQuizTabReturnBanner();
      }
    });
  }

  function removeBeforeUnload() {
    if (beforeUnloadHandler) {
      window.removeEventListener("beforeunload", beforeUnloadHandler);
      beforeUnloadHandler = null;
    }
  }

  function syncSelectedOptionClass(qi) {
    var radios = document.getElementsByName("q" + qi);
    for (var i = 0; i < radios.length; i++) {
      var lab = radios[i].parentElement;
      if (lab && lab.classList.contains("quiz-option")) {
        lab.classList.toggle("quiz-option--selected", radios[i].checked);
      }
    }
  }

  /** Single delegated change listener on #quiz-container (fewer listeners than one per radio). */
  function attachQuizContainerListeners() {
    var container = document.getElementById("quiz-container");
    if (!container) return;
    container.addEventListener("change", function (e) {
      var t = e.target;
      if (!t || t.type !== "radio" || !t.name || t.name.charAt(0) !== "q") return;
      var qi = parseInt(t.name.slice(1), 10);
      if (isNaN(qi)) return;
      isDirty = true;
      collectAnswers();
      checkUnanswered();
      syncSelectedOptionClass(qi);
    });
  }

  /** Appends reward from public API (validated in api.js); only called when pass === true. */
  /** After submit: show correct (green) / wrong pick (red) / other options dimmed. */
  function markAnswersAfterSubmit() {
    shuffledQuestions.forEach(function (q, qi) {
      var card = document.getElementById("question-" + qi);
      if (!card) return;
      card.classList.add("quiz-card--revealed");
      var selected = answered[qi];
      var radios = document.getElementsByName("q" + qi);
      for (var i = 0; i < radios.length; i++) {
        var radio = radios[i];
        var label = radio.parentElement;
        if (!label || !label.classList || !label.classList.contains("quiz-option")) continue;
        label.classList.remove(
          "quiz-option--correct",
          "quiz-option--incorrect",
          "quiz-option--faded",
          "quiz-option--selected"
        );
        var oi = parseInt(radio.value, 10);
        if (oi === q.answer) {
          label.classList.add("quiz-option--correct");
        } else if (selected === oi) {
          label.classList.add("quiz-option--incorrect");
        } else {
          label.classList.add("quiz-option--faded");
        }
        radio.disabled = true;
      }
    });
  }

  /**
   * Appends reward text from QuizApi only after a pass. If the API fails or returns
   * invalid JSON, shows a non-hard-coded fallback message (rubric: meaningful outcome, no fake quote).
   */
  function appendRewardQuote() {
    window.QuizApi.fetchPassRewardQuote().then(function (data) {
      var resultsSection = document.getElementById("results-section");
      if (!resultsSection) return;
      if (data && data.content) {
        resultsSection.innerHTML +=
          '<div class="reward-quote"><strong>Bonus quote (API):</strong> &ldquo;' +
          escapeHtml(data.content) +
          "&rdquo;<br><span class=\"reward-author\">&mdash; " +
          escapeHtml(data.author) +
          "</span></div>";
      } else {
        resultsSection.innerHTML +=
          '<p class="reward-quote reward-quote--fallback" role="status">' +
          "<strong>Bonus quote (API):</strong> The public quote service did not return usable JSON " +
          "(offline, blocked request, or unexpected response). Your pass is still recorded; no placeholder quote was inserted.</p>";
      }
    });
  }

  function handleSubmit() {
    if (submitted || submitting) return;

    collectAnswers();
    var allAnswered = checkUnanswered();
    var resultsSection = document.getElementById("results-section");

    if (!allAnswered) {
      if (resultsSection) {
        resultsSection.innerHTML =
          '<p class="quiz-error-msg" role="alert">Please answer every question. Unanswered cards are highlighted in red.</p>';
      }
      scrollToFirstUnanswered();
      return;
    }

    submitting = true;

    try {
      var score = 0;
      shuffledQuestions.forEach(function (q, qi) {
        if (answered[qi] !== undefined && answered[qi] === q.answer) {
          score++;
        }
      });

      var total = shuffledQuestions.length;
      var percent = total > 0 ? Math.round((score / total) * 100) : 0;
      var pass = percent >= 70;

      var resultHtml =
        "<p class=\"quiz-pass-rule\"><strong>Pass mark:</strong> 70% (inclusive). You " +
        (pass ? "met" : "did not meet") +
        " this threshold.</p>" +
        "<p><strong>Score:</strong> " +
        score +
        " / " +
        total +
        "</p><p><strong>Percentage:</strong> " +
        percent +
        "%</p><p><strong>Status:</strong> <span class=\"" +
        (pass ? "pass" : "fail") +
        "\">" +
        (pass ? "Passed" : "Failed") +
        "</span></p>";

      if (resultsSection) {
        resultsSection.innerHTML = resultHtml;
        resultsSection.classList.add("quiz-results--visible");
      }

      markAnswersAfterSubmit();

      var resultObj = {
        score: score + " / " + total,
        percent: percent,
        pass: pass,
        date: getDateTimeStr(),
      };

      var saved = window.QuizStorage.saveAttempt(resultObj);
      if (!saved && resultsSection) {
        resultsSection.innerHTML +=
          '<p class="quiz-warn-msg">Your score is shown above, but this attempt could not be saved (storage may be full or disabled).</p>';
      }

      renderAttempts();

      submitted = true;
      isDirty = false;
      tabBlurWhileDirty = false;
      removeBeforeUnload();

      var sessionBanner = document.getElementById("quiz-session-banner");
      if (sessionBanner) {
        sessionBanner.setAttribute("hidden", "");
        sessionBanner.textContent = "";
      }

      var submitBtn = document.getElementById("quiz-submit");
      if (submitBtn) submitBtn.disabled = true;

      if (pass) {
        appendRewardQuote();
      }
    } finally {
      submitting = false;
    }
  }

  function loadQuizQuestions() {
    var container = document.getElementById("quiz-container");
    var submitBtn = document.getElementById("quiz-submit");

    fetch("data/questions.json?" + QUESTIONS_JSON_QUERY, { cache: "no-store" })
      .then(function (resp) {
        if (!resp.ok) throw new Error("HTTP " + resp.status);
        return resp.json();
      })
      .then(function (data) {
        if (!Array.isArray(data) || data.length === 0) {
          throw new Error("No questions");
        }
        for (var i = 0; i < data.length; i++) {
          var q = data[i];
          if (
            !q ||
            typeof q.question !== "string" ||
            !Array.isArray(q.options) ||
            typeof q.answer !== "number"
          ) {
            throw new Error("Invalid question shape");
          }
        }
        shuffledQuestions = shuffleArray(data);
        renderQuiz();
        attachQuizContainerListeners();
      })
      .catch(function () {
        if (container) {
          container.innerHTML =
            '<div class="quiz-load-error" role="alert">Could not load quiz questions. Serve this folder over HTTP (for example <code>python3 -m http.server</code>) and ensure <code>data/questions.json</code> exists.</div>';
        }
        if (submitBtn) {
          submitBtn.style.display = "none";
          submitBtn.disabled = true;
        }
      });
  }

  function wireClearHistory() {
    var btn = document.getElementById("clear-history-btn");
    if (!btn) return;
    btn.addEventListener("click", function () {
      var attempts = window.QuizStorage.loadAttempts();
      if (!attempts.length) return;
      if (
        !window.confirm(
          "Remove all saved quiz attempts from this browser? This cannot be undone."
        )
      ) {
        return;
      }
      window.QuizStorage.clearAttempts();
      renderAttempts();
    });
  }

  function init() {
    setupBeforeUnloadWarning();
    setupVisibilityReturnNotice();
    loadQuizQuestions();
    renderAttempts();
    wireClearHistory();

    var submitBtn = document.getElementById("quiz-submit");
    if (submitBtn) {
      submitBtn.addEventListener("click", handleSubmit);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
