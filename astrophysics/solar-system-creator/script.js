/* Global-ish state shared with sketch.js via window.AppState */
let rockyCount = 1;
let giantCount = 1;
let beltCount = 1;
let totalScore = 0;


const AppState = {
  items: [],      // array of CelestialBody | Belt
  nextIndex: 1,   // for "Astro N"
  timeScale: 1,   // reserved if you later add a speed slider
};

window.AppState = AppState;

/* DOM Elements */
const astroList = document.getElementById("astroList");
const btnAdd = document.getElementById("btnAdd");
const modal = document.getElementById("modalOverlay");
const modalClose = document.getElementById("modalClose");
const btnCancel = document.getElementById("btnCancel");
const btnConfirm = document.getElementById("btnConfirmAdd");
const bodyTypeSel = document.getElementById("bodyType");
const bodyNameInput = document.getElementById("bodyName");
const speedFactorLabel = document.getElementById("speedFactorLabel");
const speedFactor = document.getElementById("speedFactor");
const traslationToggle = document.getElementById("traslationToggle");
const orbitToggle = document.getElementById("orbitToggle");
const ringToggle = document.getElementById("ringToggle");
modal.hidden = true;
// Delete-confirm modal elements
const deleteModal = document.getElementById("deleteModalOverlay");
const deleteModalClose = document.getElementById("deleteModalClose");
const btnCancelDelete = document.getElementById("btnCancelDelete");
const btnConfirmDelete = document.getElementById("btnConfirmDelete");
const deleteMsg = document.getElementById("deleteModalMessage");

let pendingDeleteId = null;
let pendingDeleteName = "";

// -------------------

/* ===========================
   GRADING HELPERS (NEW)
   =========================== */

// Epsilon for "non-zero" inclination (deg)
const INC_EPS = 0.1;

function beltsSorted(items) {
  return items.filter(x => x.type === "belt")
    .slice()
    .sort((a, b) => a.orbitRadius - b.orbitRadius);
}
function rockyPlanets(items) { return items.filter(x => x.type === "rocky"); }
function giantPlanets(items) { return items.filter(x => x.type === "giant"); }

// A planet orbit is "inside" a belt if it falls within the belt radial span
function isInsideBelt(orbitR, belt) {
  const inner = belt.orbitRadius - belt.width / 2;
  const outer = belt.orbitRadius + belt.width / 2;
  return orbitR >= inner && orbitR <= outer;
}
// True if a planet is outside ALL belts
function isOutsideAllBelts(planet, belts) {
  return !belts.some(b => isInsideBelt(planet.orbitRadius, b));
}
// Count how many given planets lie inside a specific belt
function countInBelt(planets, belt) {
  return planets.filter(p => isInsideBelt(p.orbitRadius, belt)).length;
}

/**
 * computeGrade(items) returns { score, breakdown }
 * Scoring rules from your spec (8 points total).
 */
function computeGrade(items) {
  let score = 0;
  const detail = [];

  const belts = beltsSorted(items);
  const rockies = rockyPlanets(items);
  const giants = giantPlanets(items);

  // 1) Number of belts == 3
  if (belts.length === 3) { score += 1; detail.push("Belts: OK (=3)"); }
  else { detail.push("Belts: expected 3"); }

  // 2) Relative widths strictly increasing with belt radius
  let widthsInc = false;
  if (belts.length >= 2) {
    widthsInc = true;
    for (let i = 0; i < belts.length - 1; i++) {
      if (!(belts[i + 1].width > belts[i].width)) { widthsInc = false; break; }
    }
  }
  if (widthsInc && belts.length === 3) { score += 1; detail.push("Widths: increasing ✓"); }
  else { detail.push("Widths: not strictly increasing or missing belts"); }

  // Partition rockies/giants outside belts
  const rockiesOutside = rockies.filter(r => isOutsideAllBelts(r, belts));
  const giantsOutside = giants.filter(g => isOutsideAllBelts(g, belts));

  // 3) # rocky planets (rocky & NOT inside any belt) == 4
  if (rockiesOutside.length === 4) { score += 1; detail.push("Rockies count: 4 ✓"); }
  else { detail.push(`Rockies count: ${rockiesOutside.length} (need 4)`); }

  // 4) Position of rocky planets (requires 3 belts & 4 rockies outside):
  //    "3 rockies with radius less than the *inner edge* of the innermost belt
  //     and 1 rocky beyond the *outer edge* of the outermost belt"
  if (belts.length === 3 && rockiesOutside.length === 4) {
    const innermost = belts[0];
    const outermost = belts[2];
    const innerEdge = innermost.orbitRadius - innermost.width / 2;
    const outerEdge = outermost.orbitRadius + outermost.width / 2;

    const rockiesInnerSide = rockiesOutside.filter(r => r.orbitRadius < innerEdge).length;
    const rockiesBeyond = rockiesOutside.filter(r => r.orbitRadius > outerEdge).length;

    if (rockiesInnerSide >= 3 && rockiesBeyond >= 1) {
      score += 1; detail.push("Rockies placement: OK");
    } else {
      detail.push("Rockies placement: expected 3 inside inner side + 1 beyond outer side");
    }
  } else {
    detail.push("Rockies placement: blocked (needs 3 belts and 4 rockies)");
  }

  // 5) # giant planets (giant & NOT inside any belt) == 4
  if (giantsOutside.length === 3) { score += 1; detail.push("Giants count: 3 ✓"); }
  else { detail.push(`Giants count: ${giantsOutside.length} (need 3)`); }

  // 6) Position of giant planets:
  //    With 3 belts: 2 giants between belt2 and belt3, and 1 beyond belt3 (all outside belts)
  if (belts.length === 3) {
    const b1 = belts[0], b2 = belts[1], b3 = belts[2];
    const b2Outer = b2.orbitRadius + b2.width / 2;
    const b3Inner = b3.orbitRadius - b3.width / 2;
    const b3Outer = b3.orbitRadius + b3.width / 2;

    const between23 = giantsOutside.filter(g =>
      g.orbitRadius > b2Outer && g.orbitRadius < b3Inner
    ).length;
    const beyond3 = giantsOutside.filter(g => g.orbitRadius > b3Outer).length;

    if (between23 >= 2 && beyond3 >= 1) {
      score += 1; detail.push("Giants placement: OK");
    } else {
      detail.push("Giants placement: need ≥2 between belts 2–3 and ≥1 beyond belt 3");
    }
  } else {
    detail.push("Giants placement: blocked (needs 3 belts)");
  }

  // 7) # dwarf planets == 4
  //    Dwarf planet = rocky object whose orbit IS inside a belt AND |inclination|>0
  const dwarfs = rockies.filter(r => {
    const inside = belts.find(b => isInsideBelt(r.orbitRadius, b));
    return !!inside && Math.abs(r.inclination || 0) > INC_EPS;
  });

  if (dwarfs.length === 4) { score += 1; detail.push("Dwarfs count: 4 ✓"); }
  else { detail.push(`Dwarfs count: ${dwarfs.length} (need 4)`); }

  // 8) Dwarf positions: 1 in belt1, 1 in belt2, 2 in belt3
  if (belts.length === 3) {
    const inB1 = countInBelt(dwarfs, belts[0]);
    const inB2 = countInBelt(dwarfs, belts[1]);
    const inB3 = countInBelt(dwarfs, belts[2]);
    if (inB1 >= 1 && inB2 >= 1 && inB3 >= 2) {
      score += 1; detail.push("Dwarfs placement: OK");
    } else {
      detail.push(`Dwarfs placement: b1=${inB1}, b2=${inB2}, b3=${inB3} (need 1,1,2)`);
    }
  } else {
    detail.push("Dwarfs placement: blocked (needs 3 belts)");
  }

  score = score * (2 / 8);
  totalScore = score;

  return { score, breakdown: detail };
}

function updateGrade() {
  const { score } = computeGrade(AppState.items);
  const span = document.getElementById("gradeSpan");
  if (span) span.textContent = `${score} / 2`;
}

// -------------------

const SECTION_DEFS = {
  rocky: { title: "🪨 Cuerpos Rocosos", id: "section-rocky" },
  giant: { title: "🪐 Gigantes", id: "section-giant" },
  belt: { title: "💫 Cinturones de Asteroides", id: "section-belt" }
};

function ensureAccordionSections() {
  if (!astroList) return;
  for (const [type, def] of Object.entries(SECTION_DEFS)) {
    if (!document.getElementById(def.id)) {
      const group = document.createElement("div");
      group.className = "accordion-group";
      group.id = def.id;
      group.dataset.type = type;

      const header = document.createElement("div");
      header.className = "accordion-header";
      header.innerHTML = `
        <div class="accordion-title">
          <span>${def.title}</span>
          <span class="accordion-badge" id="badge-${type}">0</span>
        </div>
        <i class="fa-solid fa-chevron-down chevron-icon"></i>
      `;

      header.addEventListener("click", () => {
        group.classList.toggle("collapsed");
      });

      const content = document.createElement("div");
      content.className = "accordion-content";
      content.id = `content-${type}`;

      group.appendChild(header);
      group.appendChild(content);
      astroList.appendChild(group);
    }
  }
}

function updateSectionBadges() {
  for (const type of ["rocky", "giant", "belt"]) {
    const badge = document.getElementById(`badge-${type}`);
    const content = document.getElementById(`content-${type}`);
    if (badge && content) {
      const count = content.querySelectorAll(".astro-card").length;
      badge.textContent = count;
    }
  }
}

function placeCardInSection(card, item) {
  ensureAccordionSections();
  const targetContent = document.getElementById(`content-${item.type}`);
  if (!targetContent) return;

  const existingCards = Array.from(targetContent.querySelectorAll(".astro-card"));
  let targetSibling = null;

  for (const existingCard of existingCards) {
    if (existingCard === card) continue;
    const cardId = existingCard.dataset.id;
    const existingItem = AppState.items.find(x => x.id === cardId);
    if (existingItem && Number(existingItem.orbitRadius) > Number(item.orbitRadius)) {
      targetSibling = existingCard;
      break;
    }
  }

  if (targetSibling) {
    if (card.nextElementSibling !== targetSibling) {
      targetContent.insertBefore(card, targetSibling);
    }
  } else {
    if (targetContent.lastElementChild !== card) {
      targetContent.appendChild(card);
    }
  }

  updateSectionBadges();
}

function renderAstroCard(item) {
  ensureAccordionSections();
  const card = buildAstroCardElement(item);
  placeCardInSection(card, item);
}

function initFilterBar() {
  const filterBar = document.getElementById("filterBar");
  if (!filterBar) return;

  const chips = filterBar.querySelectorAll(".filter-chip");
  chips.forEach(chip => {
    chip.addEventListener("click", () => {
      chips.forEach(c => c.classList.remove("active"));
      chip.classList.add("active");

      const filter = chip.dataset.filter;
      for (const type of ["rocky", "giant", "belt"]) {
        const group = document.getElementById(`section-${type}`);
        if (group) {
          if (filter === "all" || filter === type) {
            group.style.display = "";
          } else {
            group.style.display = "none";
          }
        }
      }
    });
  });
}

function openModal() {
  if (bodyNameInput) bodyNameInput.value = "";
  modal.hidden = false;
}
function closeModal() { modal.hidden = true; }

function openDeleteModal(id, name) {
  pendingDeleteId = id;
  pendingDeleteName = name;
  if (deleteMsg) deleteMsg.textContent = `¿Eliminar ${name}? Esta acción no se puede deshacer.`;
  if (deleteModal) deleteModal.hidden = false;
}

function closeDeleteModal() {
  pendingDeleteId = null;
  pendingDeleteName = "";
  if (deleteModal) deleteModal.hidden = true;
}

if (deleteModalClose) deleteModalClose.addEventListener("click", closeDeleteModal);
if (btnCancelDelete) btnCancelDelete.addEventListener("click", closeDeleteModal);
if (deleteModal) {
  deleteModal.addEventListener("click", (e) => {
    if (e.target === deleteModal) closeDeleteModal();
  });
}

if (btnConfirmDelete) {
  btnConfirmDelete.addEventListener("click", () => {
    if (!pendingDeleteId) return;

    const idx = AppState.items.findIndex(x => x.id === pendingDeleteId);
    if (idx >= 0) AppState.items.splice(idx, 1);

    const card = astroList.querySelector(`.astro-card[data-id="${pendingDeleteId}"]`);
    if (card) card.remove();

    updateSectionBadges();
    updateGrade();
    closeDeleteModal();
  });
}

if (btnAdd) btnAdd.addEventListener("click", openModal);
if (modalClose) modalClose.addEventListener("click", closeModal);
if (btnCancel) btnCancel.addEventListener("click", closeModal);
if (modal) {
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });
}

document.addEventListener("DOMContentLoaded", () => {
  ensureAccordionSections();
  initFilterBar();
  speedFactor.addEventListener("input", () => {
    speedFactorLabel.textContent = "Velocidad: x" + Number(speedFactor.value).toFixed(0);
  });

  // Re-render any existing AppState.items into sections
  const initialItems = [...AppState.items];
  AppState.items = [];
  initialItems.forEach(item => {
    AppState.items.push(item);
    renderAstroCard(item);
  });

  updateGrade();
});

function buildAstroCardElement(item) {
  const card = document.createElement("div");
  card.className = "astro-card";
  card.dataset.id = item.id;
  card.classList.add(item.type);

  const top = document.createElement("div");
  top.className = "astro-top";

  const nameWrap = document.createElement("div");

  const nameInput = document.createElement("input");
  nameInput.type = "text";
  nameInput.className = "astro-name-input";
  nameInput.value = item.name;
  nameInput.placeholder = "Nombre del astro";

  nameInput.addEventListener("input", () => {
    if (nameInput.value.trim()) {
      item.name = nameInput.value.trim();
    }
  });

  nameInput.addEventListener("change", () => {
    if (!nameInput.value.trim()) {
      nameInput.value = item.name;
    } else {
      item.name = nameInput.value.trim();
    }
  });

  nameWrap.appendChild(nameInput);

  const delBtn = document.createElement("button");
  delBtn.className = "icon-btn";
  delBtn.innerHTML = `<i class="fa-solid fa-trash"></i>`;
  delBtn.title = "Eliminar astro";

  top.appendChild(nameWrap);
  top.appendChild(delBtn);

  const controls = document.createElement("div");
  controls.className = "astro-controls";

  // --- Type Selector ---
  const rowType = document.createElement("div");
  rowType.className = "row";

  const labelType = document.createElement("label");
  labelType.textContent = "Tipo: ";

  const selectType = document.createElement("select");
  selectType.className = "select-modern";
  selectType.innerHTML = `
    <option value="rocky" ${item.type === "rocky" ? "selected" : ""}>Cuerpo rocoso</option>
    <option value="giant" ${item.type === "giant" ? "selected" : ""}>Cuerpo gigante</option>
    <option value="belt" ${item.type === "belt" ? "selected" : ""}>Cinturón</option>
  `;

  rowType.appendChild(labelType);
  rowType.appendChild(selectType);
  controls.appendChild(rowType);

  selectType.addEventListener("change", () => {
    const newType = selectType.value;
    const updatedItem = convertAstroType(item, newType);

    const idx = AppState.items.findIndex(x => x.id === item.id);
    if (idx >= 0) AppState.items[idx] = updatedItem;

    const newCard = buildAstroCardElement(updatedItem);
    card.remove();
    placeCardInSection(newCard, updatedItem);
    updateGrade();
  });

  // --- Model / Texture Selector (for non-belts) ---
  if (item.type !== "belt") {
    const rowModel = document.createElement("div");
    rowModel.className = "row";

    const labelModel = document.createElement("label");
    labelModel.textContent = "Modelo: ";

    const selectModel = document.createElement("select");
    selectModel.className = "select-modern";

    for (const [key, info] of Object.entries(TEXTURE_CATALOG)) {
      const opt = document.createElement("option");
      opt.value = key;
      opt.textContent = info.name;
      if (item.textureKey === key) opt.selected = true;
      selectModel.appendChild(opt);
    }

    rowModel.appendChild(labelModel);
    rowModel.appendChild(selectModel);
    controls.appendChild(rowModel);

    selectModel.addEventListener("change", () => {
      if (item.setTextureKey) {
        item.setTextureKey(selectModel.value);
      }
    });
  }

  // --- Distance Input ---
  const rowDist = document.createElement("div");
  rowDist.className = "row";

  const labelDist = document.createElement("label");
  labelDist.textContent = "Distancia [AU]: ";

  const inputDist = document.createElement("input");
  inputDist.type = "number";
  inputDist.className = "input-modern";
  inputDist.min = "0.01";
  inputDist.max = "100";
  inputDist.step = "0.01";
  const currentDist = (item.orbitRadius / 100);
  inputDist.value = currentDist.toFixed(2);

  rowDist.appendChild(labelDist);
  rowDist.appendChild(inputDist);
  controls.appendChild(rowDist);

  const updateDist = () => {
    let val = parseFloat(inputDist.value);
    if (!isNaN(val) && val > 0 && val <= 100) {
      item.orbitRadius = val * 100;
      updateGrade();
    }
  };
  inputDist.addEventListener("input", updateDist);
  inputDist.addEventListener("change", () => {
    let val = parseFloat(inputDist.value);
    if (isNaN(val) || val <= 0) val = 0.01;
    if (val > 100) val = 100;
    val = Math.round(val * 100) / 100;
    inputDist.value = val.toFixed(2);
    item.orbitRadius = val * 100;
    placeCardInSection(card, item);
    updateGrade();
  });

  // --- Inclination row ---
  if (item.type !== "belt") {
    const rowIncl = document.createElement("div");
    rowIncl.className = "row";

    const labelIncl = document.createElement("label");
    labelIncl.innerHTML = "Inclinación<br>orbital [°]: ";

    const inputIncl = document.createElement("input");
    inputIncl.type = "number";
    inputIncl.className = "input-modern";
    inputIncl.min = "-90";
    inputIncl.max = "90";
    inputIncl.step = "0.1";
    inputIncl.value = String(item.inclination || 0);

    const unitIncl = document.createElement("span");
    unitIncl.className = "input-unit";
    unitIncl.textContent = "";

    rowIncl.appendChild(labelIncl);
    rowIncl.appendChild(inputIncl);
    rowIncl.appendChild(unitIncl);
    controls.appendChild(rowIncl);

    const updateIncl = () => {
      let val = parseFloat(inputIncl.value);
      if (!isNaN(val)) {
        item.inclination = val;
        updateGrade();
      }
    };
    inputIncl.addEventListener("input", updateIncl);
    inputIncl.addEventListener("change", () => {
      let val = parseFloat(inputIncl.value);
      if (isNaN(val)) val = 0;
      if (val < -90) val = -90;
      if (val > 90) val = 90;
      val = Math.round(val * 100) / 100;
      inputIncl.value = String(val);
      item.inclination = val;
      updateGrade();
    });
  }

  // Belts: extra controls
  if (item.type === "belt") {
    // --- Belt Width ---
    const rowWidth = document.createElement("div");
    rowWidth.className = "row";

    const labelWidth = document.createElement("label");
    labelWidth.textContent = "Ancho: ";

    const inputWidth = document.createElement("input");
    inputWidth.type = "number";
    inputWidth.className = "input-modern";
    inputWidth.min = "0.01";
    inputWidth.max = "100";
    inputWidth.step = "0.01";
    const currentWidth = (item.width / 100);
    inputWidth.value = currentWidth.toFixed(2);

    rowWidth.appendChild(labelWidth);
    rowWidth.appendChild(inputWidth);
    controls.appendChild(rowWidth);

    const updateWidth = () => {
      let val = parseFloat(inputWidth.value);
      if (!isNaN(val) && val > 0) {
        item.width = val * 100;
        item.generateParticles();
        updateGrade();
      }
    };
    inputWidth.addEventListener("input", updateWidth);
    inputWidth.addEventListener("change", () => {
      let val = parseFloat(inputWidth.value);
      if (isNaN(val) || val <= 0) val = 0.01;
      if (val > 100) val = 100;
      val = Math.round(val * 100) / 100;
      inputWidth.value = val.toFixed(2);
      item.width = val * 100;
      item.generateParticles();
      updateGrade();
    });

    // --- Belt Count ---
    const rowCount = document.createElement("div");
    rowCount.className = "row";

    const labelCount = document.createElement("label");
    labelCount.textContent = "N° cuerpos: ";

    const sliderCount = document.createElement("input");
    sliderCount.type = "range";
    sliderCount.min = "50";
    sliderCount.max = "400";
    sliderCount.step = "50";
    sliderCount.value = String(item.count || 200);

    const valCount = document.createElement("span");
    valCount.textContent = `${sliderCount.value}`;

    rowCount.appendChild(labelCount);
    rowCount.appendChild(sliderCount);
    rowCount.appendChild(valCount);

    sliderCount.addEventListener("input", () => {
      item.count = Number(sliderCount.value);
      valCount.textContent = `${item.count}`;
      item.generateParticles(); // regenerate with new count
    });
  }

  card.appendChild(top);
  card.appendChild(controls);

  delBtn.addEventListener("click", () => openDeleteModal(item.id, item.name));

  return card;
}

/* Add from modal */

btnConfirm.addEventListener("click", () => {
  const type = bodyTypeSel.value; // rocky | giant | belt
  const customName = bodyNameInput ? bodyNameInput.value.trim() : "";
  let defaultName;
  if (type === "rocky") {
    defaultName = `Rocoso ${rockyCount++}`;
  } else if (type === "giant") {
    defaultName = `Gigante ${giantCount++}`;
  } else {
    defaultName = `Cinturón ${beltCount++}`;
  }
  const name = customName || defaultName;
  const id = crypto.randomUUID ? crypto.randomUUID() : `astro-${Date.now()}-${Math.random()}`;
  const orbitRadius = 100;

  let item;
  if (type === "rocky") item = makeRocky(id, name, orbitRadius);
  else if (type === "giant") item = makeGiant(id, name, orbitRadius);
  else item = makeBelt(id, name, orbitRadius);

  AppState.items.push(item);
  renderAstroCard(item);
  updateGrade(); // NEW: recompute grade after adding
  closeModal();
});
