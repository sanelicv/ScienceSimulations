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
      updateChipArrows();
      updateFeaturedArrows();
      updateDots();
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
    revealActiveChip();

    if (updateHash) {
      const url = activeFilter === 'all' ? window.location.pathname : `#${activeFilter}`;
      history.replaceState(null, '', url);
    }
  }

  chips.forEach((chip) => {
    chip.addEventListener('click', () => {
      setFilter(chip.dataset.filter);
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
  // Horizontal scrollers (category chips, featured carousel):
  // arrows + edge fade, shown only when the row overflows
  // =========================================================
  function setupScroller(wrap, step) {
    const row = wrap && wrap.querySelector('.scroll-row');
    if (!row) return () => {};
    const prev = wrap.querySelector('.scroll-arrow.prev');
    const next = wrap.querySelector('.scroll-arrow.next');
    const update = () => {
      const max = row.scrollWidth - row.clientWidth;
      const x = row.scrollLeft;
      const canPrev = max > 4 && x > 4;
      const canNext = max > 4 && x < max - 4;
      wrap.classList.toggle('can-prev', canPrev);
      wrap.classList.toggle('can-next', canNext);
      if (prev) prev.hidden = !canPrev;
      if (next) next.hidden = !canNext;
    };
    row.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    if (prev) prev.addEventListener('click', () => row.scrollBy({ left: -step(row), behavior: 'smooth' }));
    if (next) next.addEventListener('click', () => row.scrollBy({ left: step(row), behavior: 'smooth' }));
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(update);
    return update;
  }

  const filtersRow = document.querySelector('.filters');
  const updateChipArrows = setupScroller(document.querySelector('.filters-wrap'), (row) => row.clientWidth * 0.7);

  function revealActiveChip() {
    if (!filtersRow) return;
    const chip = filtersRow.querySelector('.chip.is-active');
    if (!chip || filtersRow.scrollWidth <= filtersRow.clientWidth) return;
    const row = filtersRow.getBoundingClientRect();
    const c = chip.getBoundingClientRect();
    const margin = 48;
    if (c.left < row.left + margin || c.right > row.right - margin) {
      filtersRow.scrollBy({ left: c.left - row.left - (row.width - c.width) / 2, behavior: 'smooth' });
    }
  }

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
  // Featured carousel: drag with the mouse, edge fade, dots
  // =========================================================
  const updateFeaturedArrows = setupScroller(document.querySelector('.featured-carousel'), () => 0);
  const dots = featured && featured.querySelector('.carousel-dots');

  const cardsOf = (row) => Array.from(row.querySelectorAll('.card'));
  // Reachable stop positions: each card start, clamped to the end of the row (duplicates removed)
  const stops = (row) => {
    const max = Math.max(0, row.scrollWidth - row.clientWidth);
    const first = row.firstElementChild ? row.firstElementChild.offsetLeft : 0;
    const out = [];
    cardsOf(row).forEach((c) => {
      const x = Math.min(max, Math.max(0, c.offsetLeft - first));
      if (!out.length || x - out[out.length - 1] > 4) out.push(x);
    });
    return out.length ? out : [0];
  };
  const nearestIndex = (row, x = row.scrollLeft) => {
    const st = stops(row);
    let best = 0;
    st.forEach((p, i) => { if (Math.abs(p - x) < Math.abs(st[best] - x)) best = i; });
    return best;
  };
  const goTo = (row, i) => {
    const st = stops(row);
    row.scrollTo({ left: st[Math.max(0, Math.min(st.length - 1, i))], behavior: 'smooth' });
  };

  function updateDots() {
    if (!dots || !featuredGrid) return;
    const overflow = featuredGrid.scrollWidth - featuredGrid.clientWidth > 4;
    dots.hidden = !overflow;
    if (!overflow) return;
    const n = stops(featuredGrid).length;
    if (dots.children.length !== n) {
      dots.innerHTML = '';
      for (let i = 0; i < n; i++) {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'carousel-dot';
        b.setAttribute('role', 'tab');
        b.setAttribute('aria-label', String(i + 1));
        b.addEventListener('click', () => goTo(featuredGrid, i));
        dots.appendChild(b);
      }
    }
    const active = nearestIndex(featuredGrid);
    Array.from(dots.children).forEach((b, i) => {
      b.classList.toggle('is-active', i === active);
      b.setAttribute('aria-selected', String(i === active));
    });
  }

  // Mouse drag (touch and trackpads already scroll natively)
  function enableDrag(row) {
    if (!row) return;
    let startX = 0, startScroll = 0, lastX = 0, lastT = 0, velocity = 0, dragging = false, moved = false;

    row.addEventListener('pointerdown', (e) => {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      if (row.scrollWidth - row.clientWidth <= 4) return;
      dragging = true;
      moved = false;
      startX = lastX = e.clientX;
      startScroll = row.scrollLeft;
      lastT = performance.now();
      velocity = 0;
    });

    row.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const dx = e.clientX - startX;
      if (!moved && Math.abs(dx) > 5) {
        moved = true;
        row.classList.add('is-dragging');
        row.setPointerCapture(e.pointerId);
      }
      if (!moved) return;
      const now = performance.now();
      velocity = (e.clientX - lastX) / Math.max(1, now - lastT);
      lastX = e.clientX;
      lastT = now;
      row.scrollLeft = startScroll - dx;
    });

    const end = (e) => {
      if (!dragging) return;
      dragging = false;
      if (!moved) return;
      row.classList.remove('is-dragging');
      if (row.hasPointerCapture && row.hasPointerCapture(e.pointerId)) row.releasePointerCapture(e.pointerId);
      if (performance.now() - lastT > 120) velocity = 0; // held still before releasing
      // A quick flick moves one card in that direction; a slow drag snaps to the nearest card
      const i = Math.abs(velocity) > 0.35
        ? nearestIndex(row, startScroll) + (velocity < 0 ? 1 : -1)
        : nearestIndex(row);
      goTo(row, i);
    };
    row.addEventListener('pointerup', end);
    row.addEventListener('pointercancel', end);

    // A drag must not open the simulation
    row.addEventListener('click', (e) => {
      if (moved) {
        e.preventDefault();
        e.stopPropagation();
        moved = false;
      }
    }, true);
    row.addEventListener('dragstart', (e) => e.preventDefault());
  }

  if (featuredGrid) {
    enableDrag(featuredGrid);
    featuredGrid.addEventListener('scroll', updateDots, { passive: true });
    window.addEventListener('resize', updateDots);
  }

  // =========================================================
  // Init
  // =========================================================
  if (chips.length) setFilter(window.location.hash.slice(1), { updateHash: false });
  updateChipArrows();
  updateFeaturedArrows();
  updateDots();
  loadTranslations(currentLang);
});
