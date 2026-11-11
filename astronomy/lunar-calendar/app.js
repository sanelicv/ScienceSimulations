document.addEventListener('DOMContentLoaded', () => {

  // Configuration Elements
  const numMonthsInput = document.getElementById('num-months');
  const daysPerWeekInput = document.getElementById('days-per-week');
  const startDayInput = document.getElementById('start-day');
  const durationsContainer = document.getElementById('month-durations-container');
  const generateBtn = document.getElementById('generate-btn');
  const downloadPdfBtn = document.getElementById('download-pdf-btn');
  const calendarContainer = document.getElementById('calendar-container');

  // Context Menu Elements
  const contextMenu = document.getElementById('context-menu');
  const menuNewMoon = document.getElementById('menu-new-moon');
  const menuFullMoon = document.getElementById('menu-full-moon');
  const menuRemoveMoon = document.getElementById('menu-remove-moon');

  // Help Modal Elements
  const helpBtn = document.getElementById('help-btn');
  const helpModal = document.getElementById('help-modal');
  const closeModalBtn = document.getElementById('close-modal');

  let currentDayCell = null;

  // --- Configuration Logic ---

  // Generate Month Duration Inputs dynamically
  function renderMonthDurationInputs() {
    const count = parseInt(numMonthsInput.value) || 0;
    durationsContainer.innerHTML = '';

    for (let i = 1; i <= count; i++) {
      const group = document.createElement('div');
      group.className = 'input-group';

      const label = document.createElement('label');
      label.textContent = `Días Mes ${i}`;
      label.htmlFor = `month-${i}-duration`;

      const input = document.createElement('input');
      input.type = 'number';
      input.id = `month-${i}-duration`;
      input.className = 'month-duration-input';
      input.min = '1';
      input.max = '100';
      input.value = '30'; // Default 30 days

      group.appendChild(label);
      group.appendChild(input);
      durationsContainer.appendChild(group);
    }
  }

  // Listen for changes on numMonths
  numMonthsInput.addEventListener('input', renderMonthDurationInputs);
  // Initial render
  renderMonthDurationInputs();

  // Validate start day against days per week
  function validateStartDay() {
    const daysPerWeek = parseInt(daysPerWeekInput.value) || 1;
    let startDay = parseInt(startDayInput.value) || 1;

    startDayInput.max = daysPerWeek;

    if (startDay > daysPerWeek) {
      startDayInput.value = daysPerWeek;
    }
  }

  daysPerWeekInput.addEventListener('input', validateStartDay);
  startDayInput.addEventListener('input', validateStartDay);
  validateStartDay(); // Initial validation

  // --- Calendar Generation Logic ---

  generateBtn.addEventListener('click', generateCalendar);

  function generateCalendar() {
    const numMonths = parseInt(numMonthsInput.value) || 0;
    const daysPerWeek = parseInt(daysPerWeekInput.value) || 7;
    let startDay = parseInt(startDayInput.value) || 1;

    // Safety check just in case it bypasses input validation
    if (startDay > daysPerWeek) {
      startDay = daysPerWeek;
      startDayInput.value = startDay;
    }

    const durationInputs = document.querySelectorAll('.month-duration-input');
    const monthDurations = Array.from(durationInputs).map(input => parseInt(input.value) || 30);
    const totalDays = monthDurations.reduce((acc, curr) => acc + curr, 0);

    calendarContainer.innerHTML = '';

    // Create Information Header
    const infoPanel = document.createElement('div');
    infoPanel.className = 'calendar-info card';
    infoPanel.innerHTML = `
      <div class="info-item">
        <span class="info-label">Días Totales</span>
        <span class="info-value highlight">${totalDays}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Meses</span>
        <span class="info-value">${numMonths}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Días/Semana</span>
        <span class="info-value">${daysPerWeek}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Día Inicial</span>
        <span class="info-value">D${startDay}</span>
      </div>
    `;
    calendarContainer.appendChild(infoPanel);

    // Track the current day of the week (1 to daysPerWeek)
    let currentDayOfWeek = startDay;

    for (let m = 0; m < numMonths; m++) {
      const monthCard = document.createElement('div');
      monthCard.className = 'month-card';

      // Month Title
      const monthTitle = document.createElement('h2');
      monthTitle.textContent = `Mes ${m + 1}`;
      monthCard.appendChild(monthTitle);

      // Days Grid
      const daysGrid = document.createElement('div');
      daysGrid.className = 'days-grid';
      daysGrid.style.gridTemplateColumns = `repeat(${daysPerWeek}, 1fr)`;

      // Headers (D1, D2...)
      for (let d = 1; d <= daysPerWeek; d++) {
        const header = document.createElement('div');
        header.className = 'day-header';
        header.textContent = `D${d}`;
        daysGrid.appendChild(header);
      }

      // Empty Cells (Offset for start day of the month)
      // If currentDayOfWeek is 3, we need 2 empty cells (1 and 2)
      for (let e = 1; e < currentDayOfWeek; e++) {
        const emptyCell = document.createElement('div');
        emptyCell.className = 'day-cell empty';
        daysGrid.appendChild(emptyCell);
      }

      // Day Cells
      const daysInMonth = monthDurations[m];
      for (let day = 1; day <= daysInMonth; day++) {
        const dayCell = document.createElement('div');
        dayCell.className = 'day-cell';
        dayCell.textContent = day;

        // State tracking using data attributes
        dayCell.dataset.highlighted = "false";
        dayCell.dataset.moon = "none";

        daysGrid.appendChild(dayCell);

        // Advance day of week
        currentDayOfWeek++;
        if (currentDayOfWeek > daysPerWeek) {
          currentDayOfWeek = 1;
        }
      }

      monthCard.appendChild(daysGrid);
      calendarContainer.appendChild(monthCard);
    }

    // Show download button
    downloadPdfBtn.style.display = 'inline-flex';
  }

  // --- PDF Download Logic ---
  downloadPdfBtn.addEventListener('click', () => {
    const element = document.getElementById('calendar-container');

    // Calculate the real full size of the container
    const width = element.scrollWidth;
    const height = element.scrollHeight;

    const opt = {
      margin: 10,
      filename: 'calendario-cosmico.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: {
        scale: 2,
        width: width,
        height: height
      },
      jsPDF: {
        unit: 'px',
        format: [width + 20, height + 20],
        orientation: width > height ? 'landscape' : 'portrait'
      }
    };

    html2pdf().set(opt).from(element).save();
  });


  // --- Context Menu Logic ---

  // Left Click: Toggle Highlight
  calendarContainer.addEventListener('click', (e) => {
    const cell = e.target.closest('.day-cell:not(.empty)');

    // Ignore if click was specifically on the moon icon (though pointer-events is none in CSS)
    if (!cell) return;

    // If context menu is open, let the document click handler close it without highlighting
    if (!contextMenu.classList.contains('hidden')) return;

    const isHighlighted = cell.dataset.highlighted === "true";

    if (isHighlighted) {
      cell.classList.remove('highlighted');
      cell.dataset.highlighted = "false";
    } else {
      cell.classList.add('highlighted');
      cell.dataset.highlighted = "true";
    }
  });

  // Open Menu
  calendarContainer.addEventListener('contextmenu', (e) => {
    const cell = e.target.closest('.day-cell:not(.empty)');
    if (!cell) return; // Prevent menu on empty cells or gaps

    e.preventDefault();
    currentDayCell = cell;

    const hasMoon = cell.dataset.moon !== "none";

    if (hasMoon) {
      menuRemoveMoon.classList.remove('hidden');
    } else {
      menuRemoveMoon.classList.add('hidden');
    }

    // Position menu
    // Adjust if it goes out of screen
    let x = e.pageX;
    let y = e.pageY;

    contextMenu.style.left = `${x}px`;
    contextMenu.style.top = `${y}px`;
    contextMenu.classList.remove('hidden');
  });

  // Close Menu
  document.addEventListener('click', (e) => {
    if (!contextMenu.contains(e.target)) {
      closeMenu();
    }
  });

  // Menu Actions

  menuNewMoon.addEventListener('click', () => {
    if (currentDayCell) {
      setMoonPhase('moon-new');
    }
    closeMenu();
  });

  menuFullMoon.addEventListener('click', () => {
    if (currentDayCell) {
      setMoonPhase('moon-full');
    }
    closeMenu();
  });

  menuRemoveMoon.addEventListener('click', () => {
    if (currentDayCell) {
      const moonIcon = currentDayCell.querySelector('.moon-icon');
      if (moonIcon) {
        moonIcon.remove();
      }
      currentDayCell.dataset.moon = "none";
    }
    closeMenu();
  });

  function setMoonPhase(phaseClass) {
    // Remove existing moon
    const existingMoon = currentDayCell.querySelector('.moon-icon');
    if (existingMoon) {
      existingMoon.remove();
    }

    // Add new moon
    const moon = document.createElement('div');
    moon.className = `moon-icon ${phaseClass}`;
    currentDayCell.appendChild(moon);

    currentDayCell.dataset.moon = phaseClass === 'moon-new' ? 'new' : 'full';
  }

  function closeMenu() {
    contextMenu.classList.add('hidden');
    currentDayCell = null;
  }

  // --- Help Modal Logic ---

  helpBtn.addEventListener('click', () => {
    helpModal.classList.remove('hidden');
  });

  closeModalBtn.addEventListener('click', () => {
    helpModal.classList.add('hidden');
  });

  // Close modal when clicking outside the content
  helpModal.addEventListener('click', (e) => {
    if (e.target === helpModal) {
      helpModal.classList.add('hidden');
    }
  });

});
