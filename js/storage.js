/**
 * Quiz attempt persistence (localStorage).
 * CITS5505: reads/writes wrapped in try/catch for private browsing and corrupt data.
 */
(function () {
  "use strict";

  var STORAGE_KEY = "quizAttempts";

  /**
   * Returns a sanitised array of past attempts (newest first in storage order preserved after filter).
   */
  function loadAttempts() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      var data = JSON.parse(raw);
      if (!Array.isArray(data)) return [];
      return data.filter(function (a) {
        return (
          a &&
          typeof a.date === "string" &&
          typeof a.score === "string" &&
          typeof a.percent === "number" &&
          typeof a.pass === "boolean"
        );
      });
    } catch (err) {
      return [];
    }
  }

  /**
   * Prepends one validated attempt object. Returns false if storage is unavailable or full.
   */
  function saveAttempt(result) {
    try {
      var attempts = loadAttempts();
      attempts.unshift(result);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(attempts));
      return true;
    } catch (err) {
      return false;
    }
  }

  /**
   * Removes all stored attempts (used by Clear history control).
   */
  function clearAttempts() {
    try {
      localStorage.removeItem(STORAGE_KEY);
      return true;
    } catch (err) {
      return false;
    }
  }

  window.QuizStorage = {
    loadAttempts: loadAttempts,
    saveAttempt: saveAttempt,
    clearAttempts: clearAttempts,
    STORAGE_KEY: STORAGE_KEY,
  };
})();
