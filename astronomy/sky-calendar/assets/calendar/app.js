document.addEventListener('DOMContentLoaded', () => {

  // Configuration Elements
  const numMonthsInput = document.getElementById('num-months');
  const daysPerWeekInput = document.getElementById('days-per-week');
  const startDayInput = document.getElementById('start-day');
  const durationsContainer = document.getElementById('month-durations-container');
  const generateBtn = document.getElementById('generate-btn');
  const scoreBtn = document.getElementById('score-btn');
  const downloadPdfBtn = document.getElementById('download-pdf-btn');
  const calendarContainer = document.getElementById('calendar-container');
  const scoringResults = document.getElementById('scoring-results');
  const caseResolvedTitle = document.getElementById('case-resolved-title');
  const scorePercentage = document.getElementById('score-percentage');
  const scoreDecimal = document.getElementById('score-decimal');
  const scoreHints = document.getElementById('score-hints');

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
      input.value = ''; // Default 30 days

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
    scoringResults.classList.add('hidden'); // Clear previous score

    // Create Score Header for PDF (hidden by default in UI, shown in PDF or via score)
    const scorePrintHeader = document.createElement('div');
    scorePrintHeader.id = 'pdf-score-header';
    scorePrintHeader.style.display = 'none';
    scorePrintHeader.style.marginBottom = '20px';
    scorePrintHeader.style.padding = '15px';
    scorePrintHeader.style.backgroundColor = '#f8f9fa';
    scorePrintHeader.style.border = '1px solid #ccc';
    scorePrintHeader.style.borderRadius = '8px';
    scorePrintHeader.style.color = '#333';
    calendarContainer.appendChild(scorePrintHeader);

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

    // Show score and download buttons
    scoreBtn.style.display = 'inline-flex';
    downloadPdfBtn.style.display = 'inline-flex';
  }

  // --- Scoring Logic ---
  scoreBtn.addEventListener('click', () => {
    //generateCalendar();
    calculateScore();
  });

  function calculateScore() {
    // 1. Get Simulation Data
    const simApp = window.parent.app;
    if (!simApp || !simApp.currentCase) {
      alert("No se pudo obtener la información de la simulación. Asegúrate de ejecutar este calendario dentro del planetario.");
      return;
    }

    const currentCase = simApp.currentCase;
    const tropicalYear = currentCase.tropicalYear;
    const moons = currentCase.moons || [];
    const planets = currentCase.planets || [];

    let score = 0;
    const hints = [];

    // Parse User Inputs
    const numMonths = parseInt(numMonthsInput.value) || 0;
    const durationInputs = document.querySelectorAll('.month-duration-input');
    const monthDurations = Array.from(durationInputs).map(input => parseInt(input.value) || 30);
    const totalDays = monthDurations.reduce((acc, curr) => acc + curr, 0);

    // Criteria 1: Duración del Año (20 pts)
    if (Math.abs(totalDays - tropicalYear) <= 1) {
      score += 20;
      hints.push({ text: "Duración del año correcta.", perfect: true });
    } else {
      hints.push({ text: "Verifica que la duración total de días de tu calendario coincida aproximadamente con el año trópico del caso.", perfect: false });
    }

    // Criteria 2: Configuración de Meses (30 pts)
    if (moons.length > 0) {
      let monthCorrect = false;
      const expectedMonths = moons.map(m => Math.floor(tropicalYear / m.synodicMonthDays));

      const avgSynodic = moons.reduce((acc, curr) => acc + curr.synodicMonthDays, 0) / moons.length;
      expectedMonths.push(Math.floor(tropicalYear / avgSynodic));

      if (expectedMonths.includes(numMonths)) {
        monthCorrect = true;
      }

      if (monthCorrect) {
        score += 30;
        hints.push({ text: "Cantidad de meses adecuada.", perfect: true });
      } else {
        hints.push({ text: "Verifica la cantidad de meses. Recuerda dividir el año trópico entre la duración del mes sinódico.", perfect: false });
      }
    } else {
      // If no moons, give free points?
      score += 30;
    }

    // Criteria 3: Distribución de Meses (10 pts)
    if (numMonths > 0) {
      const base = Math.floor(totalDays / numMonths);
      let isEven = true;
      for (let dur of monthDurations) {
        if (dur !== base && dur !== base + 1) {
          isEven = false;
          break;
        }
      }
      if (isEven) {
        score += 10;
        hints.push({ text: "Distribución de días equitativa.", perfect: true });
      } else {
        hints.push({ text: "Verifica que los días sobrantes estén distribuidos equitativamente, sin acumular más de un día extra en un solo mes.", perfect: false });
      }
    }

    // Criteria 4: Fases Lunares (40 pts) - Solo primeros 4 meses
    if (moons.length > 0) {
      const moonParam = moons[0];
      const synodic = moonParam.synodicMonthDays;
      const delta = moonParam.delta;

      let userNewMoons = [];
      let userFullMoons = [];

      let solarDay = 0; // t = 0 is day 1
      const maxMonthsToCheck = Math.min(4, numMonths);

      // We need to iterate the generated calendar cells explicitly for the first 4 months
      const monthCards = calendarContainer.querySelectorAll('.month-card');
      for (let m = 0; m < maxMonthsToCheck; m++) {
        const card = monthCards[m];
        if (!card) continue;
        const cells = card.querySelectorAll('.day-cell:not(.empty)');
        cells.forEach(cell => {
          if (cell.dataset.moon === 'new') userNewMoons.push(solarDay);
          if (cell.dataset.moon === 'full') userFullMoons.push(solarDay);
          solarDay++;
        });
      }

      let phaseScore = 0;
      let phaseHints = [];

      const evalPhaseSequence = (userMarks, targetDelta, phaseName) => {
        let pScore = 0;
        let pHints = [];
        if (userMarks.length === 0) {
          pHints.push(`Faltan marcas de ${phaseName} en los primeros 4 meses.`);
          return { score: 0, hints: pHints };
        }

        // Calculate theoretical first occurrence of this phase
        const normalizedDelta = targetDelta % (2 * Math.PI);
        const firstOccurrence = ((2 * Math.PI - normalizedDelta) % (2 * Math.PI)) / (2 * Math.PI) * synodic;

        // Find if user got the starting position right (tolerance +- 1.5 days)
        let rootFound = false;
        for (let m of userMarks) {
          // Check if it's close to any valid phase occurrence
          const k = Math.round((m - firstOccurrence) / synodic);
          const expected = firstOccurrence + k * synodic;
          if (Math.abs(m - expected) <= 1.5) {
            rootFound = true;
            break;
          }
        }

        if (rootFound) {
          pScore += 10; // Right start
        } else {
          pHints.push(`Verifica la fecha de inicio de la ${phaseName}. Ayúdate del simulador.`);
        }

        // Check rhythm
        if (userMarks.length > 1) {
          let goodIntervals = 0;
          for (let i = 1; i < userMarks.length; i++) {
            const diff = userMarks[i] - userMarks[i - 1];
            if (Math.abs(diff - synodic) <= 1.5) {
              goodIntervals++;
            }
          }
          if (goodIntervals > 0 && goodIntervals >= userMarks.length - 2) {
            pScore += 10; // Good rhythm
          } else {
            pHints.push(`Verifica que el intervalo entre las ${phaseName} equivalga a un mes sinódico.`);
          }
        } else {
          // Should there be more marks in 4 months? 
          // 4 months depends on length. If 4 months > synodic, yes.
          let daysChecked = monthDurations.slice(0, maxMonthsToCheck).reduce((a, b) => a + b, 0);
          if (daysChecked > synodic + 5) {
            pHints.push(`Parece que faltan más marcas de ${phaseName}.`);
          } else {
            pScore += 10; // Only space for 1
          }
        }
        return { score: pScore, hints: pHints };
      };

      const newEval = evalPhaseSequence(userNewMoons, delta, 'Luna Nueva');
      const fullEval = evalPhaseSequence(userFullMoons, delta + Math.PI, 'Luna Llena');

      phaseScore = newEval.score + fullEval.score;
      if (phaseScore === 40) {
        hints.push({ text: "Fases lunares de los primeros 4 meses correctas.", perfect: true });
      } else {
        hints.push(...newEval.hints.map(h => ({ text: h, perfect: false })));
        hints.push(...fullEval.hints.map(h => ({ text: h, perfect: false })));
      }

      score += phaseScore;
    } else {
      score += 40; // No moons to evaluate
    }

    // Display Score
    const finalScore = Math.max(0, Math.min(100, score));
    const decimalScore = (finalScore / 100 * 2.0).toFixed(1);

    scorePercentage.textContent = `${finalScore}%`;
    scoreDecimal.textContent = decimalScore;
    if (caseResolvedTitle) caseResolvedTitle.textContent = `Caso: ${currentCase.title || 'Desconocido'}`;

    scoreHints.innerHTML = '';
    const pdfHintsList = [];
    hints.forEach(h => {
      const li = document.createElement('li');
      li.textContent = h.text;
      if (h.perfect) li.className = 'perfect';
      scoreHints.appendChild(li);
      pdfHintsList.push(`<li style="${h.perfect ? 'color: green;' : ''}">${h.text}</li>`);
    });

    scoringResults.classList.remove('hidden');

    // Update PDF Header
    const pdfHeader = document.getElementById('pdf-score-header');
    if (pdfHeader) {
      pdfHeader.innerHTML = `
        <h2 style="margin-top: 0; border-bottom: 1px solid #ccc; padding-bottom: 10px;">Reporte de Calificación - ${currentCase.title || 'Caso'}</h2>
        <h3>Puntaje Final: ${finalScore}% (${decimalScore}/2.0)</h3>
        <ul style="padding-left: 20px;">
          ${pdfHintsList.join('')}
        </ul>
      `;
    }

    // Scroll to results
    scoringResults.scrollIntoView({ behavior: 'smooth' });
  }

  // --- PDF Download Logic ---
  downloadPdfBtn.addEventListener('click', () => {
    // Automatically calculate score before downloading
    //generateCalendar();
    calculateScore();

    const element = document.getElementById('calendar-container');
    const simApp = window.parent.app;
    const currentCase = (simApp && simApp.currentCase) ? simApp.currentCase : { title: 'cosmico' };

    // Show the PDF header temporarily
    const pdfHeader = document.getElementById('pdf-score-header');
    if (pdfHeader && pdfHeader.innerHTML.trim() !== '') {
      pdfHeader.style.display = 'block';
    }

    // Calculate the real full size of the container
    const width = element.scrollWidth;
    let height = element.scrollHeight;

    const opt = {
      margin: 10,
      filename: `reporte-calendario-${currentCase.title.toLowerCase().replace(/\s+/g, '-')}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        logging: false,
        width: width,
        height: height
      },
      jsPDF: {
        unit: 'px',
        format: [width + 20, height + 40],
        orientation: width > height ? 'landscape' : 'portrait',
        compress: true
      },
      pagebreak: { mode: 'avoid-all' }
    };

    html2pdf().set(opt).from(element).save().then(() => {
      if (pdfHeader) pdfHeader.style.display = 'none';
    });
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
