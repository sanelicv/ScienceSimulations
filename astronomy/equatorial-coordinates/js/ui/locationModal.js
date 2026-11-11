import { CAPITAL_CITIES } from '../capitalsData.js';

export class LocationModalController {
  constructor(uiController) {
    this.ui = uiController;
    this.scene = uiController.scene;
    this.initDOM();
    this.bindEvents();
  }

  initDOM() {
    this.locationModal = document.getElementById('locationModal');
    this.openLocationModalBtn = document.getElementById('openLocationModalBtn');
    this.closeLocationModalButton = document.getElementById('closeLocationModalButton');
    this.closeLocationModalBtn = document.getElementById('closeLocationModalBtn');
    this.citySearchInput = document.getElementById('citySearchInput');
    this.clearCitySearchBtn = document.getElementById('clearCitySearchBtn');
    this.cityResultsList = document.getElementById('cityResultsList');
    this.noCityResults = document.getElementById('noCityResults');
    this.currentCityBadge = document.getElementById('currentCityBadge');
  }

  bindEvents() {
    if (!this.openLocationModalBtn || !this.locationModal) return;

    this.openLocationModalBtn.addEventListener('click', () => {
      this.ui.closeAllDropdowns();
      this.locationModal.classList.add('active');
      if (this.citySearchInput) {
        this.citySearchInput.value = '';
      }
      if (this.clearCitySearchBtn) {
        this.clearCitySearchBtn.style.display = 'none';
      }
      this.renderCityList(CAPITAL_CITIES);
      setTimeout(() => {
        if (this.citySearchInput) this.citySearchInput.focus();
      }, 100);
    });

    const closeModal = () => this.locationModal.classList.remove('active');
    if (this.closeLocationModalButton) {
      this.closeLocationModalButton.addEventListener('click', closeModal);
    }
    if (this.closeLocationModalBtn) {
      this.closeLocationModalBtn.addEventListener('click', closeModal);
    }

    this.locationModal.addEventListener('click', (e) => {
      if (e.target === this.locationModal) {
        closeModal();
      }
    });

    const filterCities = () => {
      const query = (this.citySearchInput ? this.citySearchInput.value : '')
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

      if (this.clearCitySearchBtn) {
        this.clearCitySearchBtn.style.display = query ? 'flex' : 'none';
      }

      if (!query) {
        this.renderCityList(CAPITAL_CITIES);
        return;
      }

      const filtered = CAPITAL_CITIES.filter(item => {
        const cityNorm = item.city.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const countryNorm = item.country.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        return cityNorm.includes(query) || countryNorm.includes(query);
      });

      this.renderCityList(filtered);
    };

    if (this.citySearchInput) {
      this.citySearchInput.addEventListener('input', filterCities);
    }

    if (this.clearCitySearchBtn) {
      this.clearCitySearchBtn.addEventListener('click', () => {
        if (this.citySearchInput) {
          this.citySearchInput.value = '';
        }
        filterCities();
        if (this.citySearchInput) this.citySearchInput.focus();
      });
    }
  }

  renderCityList(cities) {
    if (!this.cityResultsList) return;
    this.cityResultsList.innerHTML = '';

    if (cities.length === 0) {
      if (this.noCityResults) this.noCityResults.style.display = 'block';
      return;
    }

    if (this.noCityResults) this.noCityResults.style.display = 'none';

    cities.forEach(item => {
      const li = document.createElement('li');
      li.className = 'city-item';
      const formattedLat = item.lat >= 0 ? `+${item.lat.toFixed(2)}°` : `${item.lat.toFixed(2)}°`;

      li.innerHTML = `
        <div class="city-info">
          <span class="city-name">${item.city}</span>
          <span class="city-country">${item.country}</span>
        </div>
        <span class="city-lat">${formattedLat}</span>
      `;

      li.addEventListener('click', () => {
        if (this.ui.latitudeInput) this.ui.latitudeInput.value = item.lat;
        if (this.ui.latitudeRange) this.ui.latitudeRange.value = item.lat;
        this.scene.setLatitude(item.lat);
        this.updateCityBadge(item.lat, `📍 ${item.city}, ${item.country}`);
        this.locationModal.classList.remove('active');
      });

      this.cityResultsList.appendChild(li);
    });
  }

  updateCityBadge(latVal, explicitCityName = null) {
    if (!this.currentCityBadge) return;
    const badgeTextEl = this.currentCityBadge.querySelector('.city-badge-text') || this.currentCityBadge;

    if (explicitCityName) {
      badgeTextEl.textContent = explicitCityName;
      this.currentCityBadge.classList.remove('custom-location');
      return;
    }

    const val = parseFloat(latVal);
    if (isNaN(val)) {
      badgeTextEl.textContent = '📍 Personalizada';
      this.currentCityBadge.classList.add('custom-location');
      return;
    }

    const match = (typeof CAPITAL_CITIES !== 'undefined') ? CAPITAL_CITIES.find(c => Math.abs(c.lat - val) < 0.05) : null;

    if (match) {
      badgeTextEl.textContent = `📍 ${match.city}, ${match.country}`;
      this.currentCityBadge.classList.remove('custom-location');
    } else if (Math.abs(val - 90) < 0.05) {
      badgeTextEl.textContent = '📍 Polo Norte';
      this.currentCityBadge.classList.remove('custom-location');
    } else if (Math.abs(val - (-90)) < 0.05) {
      badgeTextEl.textContent = '📍 Polo Sur';
      this.currentCityBadge.classList.remove('custom-location');
    } else if (Math.abs(val - 0) < 0.05) {
      badgeTextEl.textContent = '📍 Ecuador';
      this.currentCityBadge.classList.remove('custom-location');
    } else {
      badgeTextEl.textContent = '📍 Personalizada';
      this.currentCityBadge.classList.add('custom-location');
    }
  }
}
