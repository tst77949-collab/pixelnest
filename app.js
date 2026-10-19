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

  // ---------- tabs + sort pills (filtering + reordering, not cosmetic) ----------

  // Platform assignment per card (data-app value -> tab). Web is the default
  // platform of this gallery; Mobile/Agent SDK variants are tagged explicitly.
  var TAB_RULES = [
    { tab: 'mobile',    apps: ['habit', 'recipe', 'fitness', 'journal', 'chat'] },
    { tab: 'agent sdk', apps: ['analytics', 'finance', 'saas'] },
    { tab: 'web',       apps: ['checkout', 'onboarding', 'marketplace', 'booking',
                               'landing', 'ecommerce', 'gallery', 'dashboard'] }
  ];

  function tabForCard(card) {
    var app = normalize(card.getAttribute('data-app'));
    for (var i = 0; i < TAB_RULES.length; i++) {
      var apps = TAB_RULES[i].apps;
      for (var j = 0; j < apps.length; j++) {
        if (app.indexOf(apps[j]) !== -1) return TAB_RULES[i].tab;
      }
    }
    return 'web';
  }

  var currentTab = 'agent sdk'; // first pill is active by default in the HTML
  var currentSort = 'latest';

  function cardDate(card) {
    // Synthetic recency: index in DOM = publish order (latest first).
    // Cards get a stable synthetic timestamp for sorting.
    if (!card._pnestDate) {
      var idx = cards.indexOf(card);
      card._pnestDate = 1000 - idx; // earlier in DOM = newer
    }
    return card._pnestDate;
  }

  function cardScore(card) {
    // Synthetic relevance: char-richness of the SVG mockup as a quality proxy,
    // combined with journey text length (richer mock = more "recommended").
    if (!card._pnestScore) {
      var svg = card.querySelector('svg');
      var rich = svg ? svg.outerHTML.length : 0;
      var journey = (card.getAttribute('data-journey') || '').length;
      card._pnestScore = rich + journey * 3;
    }
    return card._pnestScore;
  }

  function applyTabsAndSort() {
    var grid = document.querySelector('.card-grid, .cards, main');
    cards = cards.length ? cards : all('.card');

    // filter by tab
    var visible = cards.filter(function (card) {
      var show = tabForCard(card) === currentTab;
      card._pnestTabOk = show;
      return show;
    });

    // sort within visible
    if (currentSort === 'recommended') {
      visible.sort(function (a, b) { return cardScore(b) - cardScore(a); });
    } else {
      visible.sort(function (a, b) { return cardDate(b) - cardDate(a); });
    }

    // reorder DOM: append visible in sorted order, hide the rest
    visible.forEach(function (card) {
      card.style.display = '';
      if (grid) grid.appendChild(card);
    });
    cards.forEach(function (card) {
      if (!card._pnestTabOk) card.style.display = 'none';
    });
  }

  function initTabs() {
    var pills = all('.tab-pill');
    pills.forEach(function (pill) {
      pill.addEventListener('click', function () {
        clearActive(pills);
        pill.classList.add('active');
        currentTab = normalize(pill.textContent);
        applyTabsAndSort();
      });
    });
  }

  function initSort() {
    var pills = all('.sort-pill');
    pills.forEach(function (pill) {
      pill.addEventListener('click', function () {
        if (pill.classList.contains('active')) return; // one always stays active
        clearActive(pills);
        pill.classList.add('active');
        currentSort = normalize(pill.textContent);
        applyTabsAndSort();
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
