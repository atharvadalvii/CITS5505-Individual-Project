/**
 * External HTTP API for post-pass reward (Quotable random quote).
 * CITS5505: response body is validated before any string is returned (no hard-coded reward text).
 */
(function () {
  "use strict";

  var QUOTE_URL = "https://api.quotable.io/random";
  var MAX_QUOTE_LEN = 2400;
  var MAX_AUTHOR_LEN = 120;

  /**
   * Normalises API JSON into { content, author } or null if unusable.
   */
  function normaliseQuotePayload(data) {
    if (!data || typeof data !== "object") return null;
    if (typeof data.content !== "string") return null;
    var content = data.content.trim();
    if (!content.length || content.length > MAX_QUOTE_LEN) return null;
    var author =
      typeof data.author === "string" && data.author.trim()
        ? data.author.trim().slice(0, MAX_AUTHOR_LEN)
        : "Unknown";
    return { content: content, author: author };
  }

  /**
   * Fetches a random quote when the user passes the quiz. Returns a Promise of object or null.
   */
  function fetchPassRewardQuote() {
    return fetch(QUOTE_URL)
      .then(function (resp) {
        if (!resp.ok) return null;
        var ct = resp.headers.get("content-type");
        if (ct && ct.indexOf("application/json") === -1) return null;
        return resp.json();
      })
      .then(function (data) {
        if (data === null || typeof data !== "object") return null;
        return normaliseQuotePayload(data);
      })
      .catch(function () {
        return null;
      });
  }

  window.QuizApi = {
    fetchPassRewardQuote: fetchPassRewardQuote,
  };
})();
