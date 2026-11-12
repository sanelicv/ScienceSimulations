document.addEventListener('DOMContentLoaded', () => {
  // Opened by double-click (file://): some simulations need a local server.
  // The notice and the badges are shown via CSS (html.is-file).
  if (window.location.protocol === 'file:') document.documentElement.classList.add('is-file');

  // =========================================================
  // Internationalization (i18n)
  // =========================================================
  const langOptions = document.querySelectorAll('.lang-option');
  let currentLang = 'es';
  try {
    currentLang = localStorage.getItem('site_lang') || 'es';
  } catch (e) { /* storage blocked */ }

  const getNested = (obj, path) => path.split('.').reduce((acc, part) => acc && acc[part], obj);

  function applyTranslations(t) {
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const text = getNested(t, el.getAttribute('data-i18n'));
      if (typeof text === 'string') el.textContent = text;
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
      const text = getNested(t, el.getAttribute('data-i18n-placeholder'));
      if (typeof text === 'string') el.placeholder = text;
    });
    const title = getNested(t, 'site.title');
    if (title) {
      const pageTitle = document.querySelector('h1.page-title');
      document.title = pageTitle ? `${pageTitle.textContent} · ${title}` : title;
    }
  }

  async function loadTranslations(lang) {
    try {
      const basePath = window.assetsPath || './assets/homepage/';
      const response = await fetch(`${basePath}locales/${lang}.json`);
      if (!response.ok) throw new Error(`Could not load translations for ${lang}`);
      applyTranslations(await response.json());

      langOptions.forEach((opt) => {
        const active = opt.getAttribute('data-lang') === lang;
        opt.classList.toggle('active', active);
        opt.setAttribute('aria-pressed', String(active));
      });
      document.documentElement.lang = lang;
      currentLang = lang;
      try { localStorage.setItem('site_lang', lang); } catch (e) { /* storage blocked */ }
      applyFilters();
    } catch (error) {
      console.error('Error loading translations:', error);
    }
  }

  langOptions.forEach((opt) => {
    opt.addEventListener('click', () => {
      const lang = opt.getAttribute('data-lang');
      if (lang !== currentLang) loadTranslations(lang);
    });
  });

  // =========================================================
  // Catalog: category filters + search
  // =========================================================
  const chips = Array.from(document.querySelectorAll('.chip[data-filter]'));
  const sections = Array.from(document.querySelectorAll('.category'));
  const searchInput = document.getElementById('search');
  const emptyState = document.querySelector('.empty-state');
  const validFilters = new Set(chips.map((c) => c.dataset.filter));
  let activeFilter = 'all';

  // Lowercase and strip accents so "orbitas" matches "Órbitas"
  const normalize = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

  function applyFilters() {
    if (!sections.length) return;
    const query = normalize(searchInput ? searchInput.value.trim() : '');
    let visibleTotal = 0;

    sections.forEach((section) => {
      const inCategory = activeFilter === 'all' || section.dataset.category === activeFilter;
      let visibleInSection = 0;

      section.querySelectorAll('.card').forEach((card) => {
        const text = normalize(card.querySelector('.card-title').textContent + ' ' + card.querySelector('.card-desc').textContent);
        const match = inCategory && (!query || text.includes(query));
        card.hidden = !match;
        if (match) visibleInSection++;
      });

      section.hidden = visibleInSection === 0;
      visibleTotal += visibleInSection;
    });

    if (emptyState) emptyState.hidden = visibleTotal > 0;
  }

  function setFilter(filter, { updateHash = true } = {}) {
    activeFilter = validFilters.has(filter) ? filter : 'all';
    chips.forEach((chip) => {
      const active = chip.dataset.filter === activeFilter;
      chip.classList.toggle('is-active', active);
      chip.setAttribute('aria-pressed', String(active));
    });
    applyFilters();

    if (updateHash) {
      const url = activeFilter === 'all' ? window.location.pathname : `#${activeFilter}`;
      history.replaceState(null, '', url);
    }
  }

  chips.forEach((chip) => {
    chip.addEventListener('click', () => {
      setFilter(chip.dataset.filter);
      chip.scrollIntoView({ block: 'nearest', inline: 'nearest' });
      const catalog = document.getElementById('catalog');
      if (catalog && catalog.getBoundingClientRect().top < 0) {
        catalog.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  if (searchInput) {
    searchInput.addEventListener('input', applyFilters);
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        searchInput.value = '';
        applyFilters();
      }
    });
  }

  // "/" focuses the search box
  document.addEventListener('keydown', (e) => {
    if (e.key === '/' && searchInput && document.activeElement !== searchInput &&
      !/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName)) {
      e.preventDefault();
      searchInput.focus();
    }
  });

  window.addEventListener('hashchange', () => setFilter(window.location.hash.slice(1), { updateHash: false }));

  // =========================================================
  // Featured strip: copies every catalog card marked with data-featured
  // =========================================================
  const featured = document.querySelector('.featured');
  const featuredGrid = featured && featured.querySelector('.featured-grid');
  if (featuredGrid) {
    // Order: data-featured="1", "2"… first; cards without a number keep catalog order, at the end.
    const rank = (card) => {
      const n = parseInt(card.dataset.featured, 10);
      return Number.isFinite(n) ? n : Infinity;
    };
    const picks = Array.from(document.querySelectorAll('.catalog .card[data-featured]'))
      .map((card, i) => ({ card, i }))
      .sort((x, y) => rank(x.card) - rank(y.card) || x.i - y.i)
      .map((x) => x.card);
    picks.forEach((card) => {
      const copy = card.cloneNode(true);
      copy.classList.add('is-featured');
      copy.removeAttribute('data-featured');
      copy.removeAttribute('data-category');
      copy.hidden = false;
      featuredGrid.appendChild(copy);
    });
    featured.hidden = picks.length === 0;
  }

  // =========================================================
  // Init
  // =========================================================
  if (chips.length) setFilter(window.location.hash.slice(1), { updateHash: false });
  loadTranslations(currentLang);
});
