/**
 * External HTTP APIs for post-pass reward.
 * CITS5505: response body is validated before any string is returned (no hard-coded reward text).
 */
(function () {
  "use strict";

  var ZEN_QUOTES_URL = "https://zenquotes.io/api/random";
  var OFFICIAL_JOKE_URL = "https://official-joke-api.appspot.com/random_joke";
  var ADVICE_URL = "https://api.adviceslip.com/advice";
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
   * Normalises ZenQuotes payload (array with { q, a }) into { content, author }.
   */
  function normaliseZenQuotePayload(data) {
    if (!Array.isArray(data) || !data.length) return null;
    var first = data[0];
    if (!first || typeof first !== "object") return null;
    if (typeof first.q !== "string") return null;
    var content = first.q.trim();
    if (!content.length || content.length > MAX_QUOTE_LEN) return null;
    var author =
      typeof first.a === "string" && first.a.trim()
        ? first.a.trim().slice(0, MAX_AUTHOR_LEN)
        : "Unknown";
    return { content: content, author: author };
  }

  /**
   * Normalises Official Joke API payload into { content, author }.
   */
  function normaliseJokePayload(data) {
    if (!data || typeof data !== "object") return null;
    if (typeof data.setup !== "string" || typeof data.punchline !== "string") return null;
    var setup = data.setup.trim();
    var punchline = data.punchline.trim();
    if (!setup || !punchline) return null;
    var content = setup + " " + punchline;
    if (content.length > MAX_QUOTE_LEN) content = content.slice(0, MAX_QUOTE_LEN);
    return { content: content, author: "Official Joke API" };
  }

  /**
   * Normalises Advice Slip payload into { content, author }.
   */
  function normaliseAdvicePayload(data) {
    if (!data || typeof data !== "object" || typeof data.slip !== "object") return null;
    if (typeof data.slip.advice !== "string") return null;
    var content = data.slip.advice.trim();
    if (!content.length || content.length > MAX_QUOTE_LEN) return null;
    return { content: content, author: "Advice Slip" };
  }

  function fetchJson(url) {
    return fetch(url)
      .then(function (resp) {
        if (!resp.ok) return null;
        // Some public endpoints return JSON with inconsistent content-type headers.
        return resp.json();
      })
      .then(function (data) {
        if (data === null || typeof data !== "object") return null;
        return data;
      })
      .catch(function () {
        return null;
      });
  }

  function firstValidReward() {
    var sources = [
      { url: ZEN_QUOTES_URL, normalise: normaliseZenQuotePayload },
      { url: OFFICIAL_JOKE_URL, normalise: normaliseJokePayload },
      { url: ADVICE_URL, normalise: normaliseAdvicePayload },
    ];

    var idx = 0;
    function next() {
      if (idx >= sources.length) return Promise.resolve(null);
      var current = sources[idx++];
      return fetchJson(current.url).then(function (data) {
        var reward = current.normalise(data);
        if (reward) return reward;
        return next();
      });
    }
    return next();
  }

  /**
   * Fetches a random quote when the user passes the quiz. Returns a Promise of object or null.
   * Uses multiple public APIs in sequence for better reliability.
   */
  function fetchPassRewardQuote() {
    return firstValidReward();
  }

  window.QuizApi = {
    fetchPassRewardQuote: fetchPassRewardQuote,
  };
})();
