/**
 * StadiumPulse — shared utilities.
 * Pure, dependency-free functions kept separate from DOM code so they can be
 * unit tested directly (see /tests) and reused by both the Fan Assistant and
 * Ops Command Center views.
 */
(function (global) {
  'use strict';

  var MAX_INPUT_LENGTH = 500;

  /**
   * Strips angle brackets and collapses whitespace so user text can never be
   * interpreted as markup, and caps length to prevent oversized payloads.
   * @param {string} raw
   * @param {number} [maxLen]
   * @returns {string}
   */
  function sanitizeInput(raw, maxLen) {
    maxLen = typeof maxLen === 'number' ? maxLen : MAX_INPUT_LENGTH;
    if (typeof raw !== 'string') return '';
    var cleaned = raw.replace(/[<>]/g, '').replace(/\s+/g, ' ').trim();
    return cleaned.length > maxLen ? cleaned.slice(0, maxLen) : cleaned;
  }

  /**
   * Escapes a string for safe insertion into innerHTML.
   * @param {string} str
   * @returns {string}
   */
  function escapeHtml(str) {
    if (typeof str !== 'string') return '';
    var map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
    return str.replace(/[&<>"']/g, function (c) { return map[c]; });
  }

  /**
   * Classifies a gate wait time in minutes into a severity level.
   * Centralizing the thresholds avoids magic numbers scattered across the UI.
   * @param {number} minutes
   * @returns {'low'|'med'|'high'}
   */
  function waitLevel(minutes) {
    if (typeof minutes !== 'number' || Number.isNaN(minutes)) return 'low';
    if (minutes >= 20) return 'high';
    if (minutes >= 10) return 'med';
    return 'low';
  }

  /**
   * Summarizes an array of density labels into counts per level.
   * Used to drive the metric row from real data instead of hardcoded copy.
   * @param {string[]} densities
   * @returns {{low:number, med:number, high:number, crit:number, total:number}}
   */
  function densityStats(densities) {
    var stats = { low: 0, med: 0, high: 0, crit: 0, total: Array.isArray(densities) ? densities.length : 0 };
    (densities || []).forEach(function (d) {
      if (Object.prototype.hasOwnProperty.call(stats, d)) stats[d]++;
    });
    return stats;
  }

  /**
   * Standard debounce: delays invoking fn until wait ms have passed
   * since the last call. Used to avoid firing a request per keystroke.
   */
  function debounce(fn, wait) {
    wait = typeof wait === 'number' ? wait : 300;
    var timer;
    return function () {
      var args = arguments, ctx = this;
      clearTimeout(timer);
      timer = setTimeout(function () { fn.apply(ctx, args); }, wait);
    };
  }

  /**
   * A tiny time-to-live cache. Used to avoid re-calling the AI model for a
   * question that was just asked (same language), cutting latency and cost.
   * @param {number} [ttlMs]
   */
  function createTTLCache(ttlMs) {
    ttlMs = typeof ttlMs === 'number' ? ttlMs : 60000;
    var store = new Map();
    return {
      get: function (key) {
        var hit = store.get(key);
        if (!hit) return undefined;
        if (Date.now() - hit.t > ttlMs) { store.delete(key); return undefined; }
        return hit.v;
      },
      set: function (key, value) { store.set(key, { v: value, t: Date.now() }); },
      clear: function () { store.clear(); },
      size: function () { return store.size; }
    };
  }

  /**
   * Builds a stable cache key from a question + language pair.
   */
  function cacheKey(question, lang) {
    return (lang || '').toLowerCase().trim() + '::' + (question || '').toLowerCase().trim();
  }

  var api = {
    MAX_INPUT_LENGTH: MAX_INPUT_LENGTH,
    sanitizeInput: sanitizeInput,
    escapeHtml: escapeHtml,
    waitLevel: waitLevel,
    densityStats: densityStats,
    debounce: debounce,
    createTTLCache: createTTLCache,
    cacheKey: cacheKey
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else {
    global.StadiumPulseUtils = api;
  }
})(typeof window !== 'undefined' ? window : globalThis);
