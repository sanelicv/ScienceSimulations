export class UnitSelectorModal {
  constructor() {
    this.overlayEl = null;
    this.modalEl = null;
    this.onConfirmCallback = null;
    this.initDOM();
  }

  initDOM() {
    if (document.getElementById('unit-selector-overlay')) return;

    this.overlayEl = document.createElement('div');
    this.overlayEl.id = 'unit-selector-overlay';
    this.overlayEl.className = 'unit-selector-overlay hidden';

    this.overlayEl.innerHTML = `
      <div class="unit-selector-modal">
        <div class="modal-header">
          <h3>⚙️ Configurar Unidades del Catálogo</h3>
          <p class="modal-subtitle">Selecciona las columnas de coordenadas a representar en el mapa 3D:</p>
        </div>
        <div class="modal-body" id="unit-selector-body">
          <!-- Dynamic dropdowns generated here -->
        </div>
        <div class="modal-footer">
          <button id="unit-selector-confirm" class="btn">Aplicar y Cargar Mapa 3D</button>
        </div>
      </div>
    `;

    document.body.appendChild(this.overlayEl);

    const confirmBtn = document.getElementById('unit-selector-confirm');
    if (confirmBtn) {
      confirmBtn.addEventListener('click', () => this.onConfirm());
    }
  }

  show(availableColumns, activeSelections, onConfirmCallback) {
    this.onConfirmCallback = onConfirmCallback;
    const bodyEl = document.getElementById('unit-selector-body');
    if (!bodyEl) return;

    bodyEl.innerHTML = '';

    const { raOptions, decOptions, distanceOptions, idOptions, lumOptions } = availableColumns || {};

    // ID / Nombre Selector (Mostrar si hay ambigüedad o múltiples candidatos)
    if (idOptions && idOptions.length > 1) {
      const group = document.createElement('div');
      group.className = 'modal-group';
      group.innerHTML = `<label for="modal-select-id">Nombre / ID del Astro:</label>`;

      const select = document.createElement('select');
      select.id = 'modal-select-id';
      select.className = 'modal-select';

      idOptions.forEach(opt => {
        const option = document.createElement('option');
        option.value = opt.key;
        option.textContent = opt.label;
        if (activeSelections && activeSelections.idKey === opt.key) {
          option.selected = true;
        }
        select.appendChild(option);
      });

      group.appendChild(select);
      bodyEl.appendChild(group);
    }

    // RA Selector
    if (raOptions && raOptions.length > 0) {
      const group = document.createElement('div');
      group.className = 'modal-group';
      group.innerHTML = `<label for="modal-select-ra">Ascensión Recta:</label>`;

      const select = document.createElement('select');
      select.id = 'modal-select-ra';
      select.className = 'modal-select';

      raOptions.forEach(opt => {
        const option = document.createElement('option');
        option.value = opt.key;
        option.textContent = opt.label;
        if (activeSelections && activeSelections.raKey === opt.key) {
          option.selected = true;
        }
        select.appendChild(option);
      });

      group.appendChild(select);
      bodyEl.appendChild(group);
    }

    // Dec Selector
    if (decOptions && decOptions.length > 0) {
      const group = document.createElement('div');
      group.className = 'modal-group';
      group.innerHTML = `<label for="modal-select-dec">Declinación:</label>`;

      const select = document.createElement('select');
      select.id = 'modal-select-dec';
      select.className = 'modal-select';

      decOptions.forEach(opt => {
        const option = document.createElement('option');
        option.value = opt.key;
        option.textContent = opt.label;
        if (activeSelections && activeSelections.decKey === opt.key) {
          option.selected = true;
        }
        select.appendChild(option);
      });

      group.appendChild(select);
      bodyEl.appendChild(group);
    }

    // Distance Selector
    if (distanceOptions && distanceOptions.length > 0) {
      const group = document.createElement('div');
      group.className = 'modal-group';
      group.innerHTML = `<label for="modal-select-dist">Distancia (Dist):</label>`;

      const select = document.createElement('select');
      select.id = 'modal-select-dist';
      select.className = 'modal-select';

      distanceOptions.forEach(opt => {
        const option = document.createElement('option');
        option.value = opt.key;
        option.textContent = opt.label;
        if (activeSelections && activeSelections.distKey === opt.key) {
          option.selected = true;
        }
        select.appendChild(option);
      });

      group.appendChild(select);
      bodyEl.appendChild(group);
    }

    // Luminosity Selector (si hay múltiples)
    if (lumOptions && lumOptions.length > 1) {
      const group = document.createElement('div');
      group.className = 'modal-group';
      group.innerHTML = `<label for="modal-select-lum">Luminosidad (Lum):</label>`;

      const select = document.createElement('select');
      select.id = 'modal-select-lum';
      select.className = 'modal-select';

      lumOptions.forEach(opt => {
        const option = document.createElement('option');
        option.value = opt.key;
        option.textContent = opt.label;
        if (activeSelections && activeSelections.lumKey === opt.key) {
          option.selected = true;
        }
        select.appendChild(option);
      });

      group.appendChild(select);
      bodyEl.appendChild(group);
    }

    this.overlayEl.classList.remove('hidden');
  }

  hide() {
    if (this.overlayEl) {
      this.overlayEl.classList.add('hidden');
    }
  }

  onConfirm() {
    const idSelect = document.getElementById('modal-select-id');
    const raSelect = document.getElementById('modal-select-ra');
    const decSelect = document.getElementById('modal-select-dec');
    const distSelect = document.getElementById('modal-select-dist');
    const lumSelect = document.getElementById('modal-select-lum');

    const selectedSelections = {
      idKey: idSelect ? idSelect.value : (this.activeSelections ? this.activeSelections.idKey : null),
      raKey: raSelect ? raSelect.value : (this.activeSelections ? this.activeSelections.raKey : null),
      decKey: decSelect ? decSelect.value : (this.activeSelections ? this.activeSelections.decKey : null),
      distKey: distSelect ? distSelect.value : (this.activeSelections ? this.activeSelections.distKey : null),
      lumKey: lumSelect ? lumSelect.value : (this.activeSelections ? this.activeSelections.lumKey : null)
    };

    this.hide();

    if (this.onConfirmCallback) {
      this.onConfirmCallback(selectedSelections);
    }
  }
}
