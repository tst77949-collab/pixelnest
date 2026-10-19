/* PixelNest — app.js (JS-BOSS)
   Tab pills / sort pills / synced search filter. Vanilla JS only.
   Cross-file contract: targets .card elements, filters on data-app + data-journey,
   active elements get .active, exposes window.PixelNest = { filter(query) }. */

(function () {
  'use strict';

  // ---------- helpers ----------

  function all(sel) {
    return Array.prototype.slice.call(document.querySelectorAll(sel));
  }

  function clearActive(elements) {
    elements.forEach(function (el) { el.classList.remove('active'); });
  }

  // ---------- tab pills (Agent SDK / Mobile / Web) ----------

  function initTabs() {
    var pills = all('.tab-pill');
    pills.forEach(function (pill) {
      pill.addEventListener('click', function () {
        clearActive(pills);
        pill.classList.add('active');
      });
    });
  }

  // ---------- sort pills (Latest / Recommended) ----------

  function initSort() {
    var pills = all('.sort-pill');
    pills.forEach(function (pill) {
      pill.addEventListener('click', function () {
        if (pill.classList.contains('active')) return; // one always stays active
        clearActive(pills);
        pill.classList.add('active');
      });
    });
  }

  // ---------- search filter (header + hero, synced) ----------

  var searchInputs = [];
  var cards = [];

  function normalize(s) {
    return (s || '').toLowerCase().replace(/\s+/g, ' ').trim();
  }

  function applyFilter(query) {
    var q = normalize(query);

    // keep header + hero inputs in sync
    searchInputs.forEach(function (input) {
      if (input.value !== query) input.value = query;
    });

    cards = cards.length ? cards : all('.card');

    cards.forEach(function (card) {
      var app = normalize(card.getAttribute('data-app'));
      var journey = normalize(card.getAttribute('data-journey'));

      var match = !q ||
        app.indexOf(q) !== -1 ||
        journey.indexOf(q) !== -1 ||
        (app + ' ' + journey).indexOf(q) !== -1;

      card.style.display = match ? '' : 'none';
    });
  }

  function initSearch() {
    searchInputs = all('.search-pill input, .hero .search-pill input');
    // fallback: any input inside a .search-pill
    if (!searchInputs.length) {
      searchInputs = all('.search-pill').map(function (pill) {
        return pill.querySelector('input');
      }).filter(Boolean);
    }

    searchInputs.forEach(function (input) {
      input.addEventListener('input', function () {
        applyFilter(input.value);
      });
    });
  }

  // ---------- smooth scroll to top on logo click ----------

  function initLogoScroll() {
    var logo = document.querySelector('.site-header .logo, .site-header [class*="logo"]');
    if (!logo) return;
    logo.addEventListener('click', function (e) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // ---------- init ----------

  function init() {
    initTabs();
    initSort();
    initSearch();
    initLogoScroll();
    cards = all('.card');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // ---------- public API (contract) ----------

  window.PixelNest = {
    filter: function (query) {
      applyFilter(String(query == null ? '' : query));
    }
  };
})();
