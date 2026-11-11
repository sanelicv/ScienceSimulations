// UI & Presets Controller

// Apply global configuration overrides
if (typeof HUD_TIME_TOOLTIP_FONT_SIZE !== 'undefined') {
    document.documentElement.style.setProperty('--hud-time-tooltip-fs', HUD_TIME_TOOLTIP_FONT_SIZE);
}

// UI DOM Selectors
const sliderRm = document.getElementById('slider-rm');
const sliderRl = document.getElementById('slider-rl');
const btnStart = document.getElementById('btnStart');
const hudTime = document.getElementById('hudTime');
const hudTemp = document.getElementById('hudTemp');
const hudScale = document.getElementById('hudScale');
const hudEpoch = document.getElementById('hudEpoch');
const timelineRange = document.getElementById('timelineRange');
const notification = document.getElementById('notification');
const abundancePanel = document.getElementById('abundancePanel');
const presetBtns = document.querySelectorAll('.preset-btn');

// Synchronize sliders
function syncInputSlider(slider) {
    slider.addEventListener('input', () => {
        // Re-initialize and update frame dynamically
        initSimulation();

        // Update math formulas with current slider values
        initKaTeX();

        // Preserve physical time across transitions if possible
        const tPrev = typeof getCosmicTimeFromProgress === 'function' && typeof simProgress !== 'undefined'
            ? getCosmicTimeFromProgress(simProgress)
            : null;

        if (tPrev !== null && typeof getProgressFromCosmicTime === 'function') {
            simProgress = getProgressFromCosmicTime(tPrev);
        }

        updateSimulationFrame();
    });
}
syncInputSlider(sliderRm);
syncInputSlider(sliderRl);

// Preset configurations
presetBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        presetBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const Rm = parseFloat(btn.dataset.rm);
        const RL = parseFloat(btn.dataset.rl);

        sliderRm.value = Rm;
        sliderRl.value = RL;

        // Update math formulas with preset values
        initKaTeX();

        // Re-initialize and update frame dynamically
        initSimulation();
        simProgress = 0;
        timelineRange.value = 0;
        updateSimulationFrame();
    });
});

// Math equation rendering using KaTeX (with clean fallback)
function initKaTeX() {
    const RmVal = parseFloat(sliderRm.value).toFixed(2);
    const RlVal = parseFloat(sliderRl.value).toFixed(2);

    if (window.katex) {
        katex.render(`\\rho_M = 10^{\\htmlId{exp-rm}{${RmVal}}} \\cdot \\rho_{rad}`, document.getElementById("label-rm"), { trust: true });
        katex.render(`\\rho_\\Lambda = 10^{\\htmlId{exp-rl}{${RlVal}}} \\cdot \\rho_{rad}`, document.getElementById("label-rl"), { trust: true });
    } else {
        const rhoHtml = '<span style="font-family: \'KaTeX_Main\', \'KaTeX_Math\', \'Computer Modern\', \'Times New Roman\', Times, serif; font-style: italic; font-weight: normal; text-transform: none;">&rho;</span>';
        document.getElementById("label-rm").innerHTML = `${rhoHtml}<sub>M</sub> = 10<sup><span id="exp-rm">${RmVal}</span></sup> &middot; ${rhoHtml}<sub>rad</sub>`;
        document.getElementById("label-rl").innerHTML = `${rhoHtml}<sub>&Lambda;</sub> = 10<sup><span id="exp-rl">${RlVal}</span></sup> &middot; ${rhoHtml}<sub>rad</sub>`;
    }
}

// Inline exponent click-to-edit event handler
document.addEventListener('click', (e) => {
    const target = e.target.closest('#exp-rm, #exp-rl');
    if (!target) return;

    // Do nothing if already editing
    if (target.tagName === 'INPUT') return;

    const isRm = target.id === 'exp-rm';
    const slider = isRm ? sliderRm : sliderRl;
    const currentVal = parseFloat(slider.value).toFixed(2);

    // Create inline input element
    const input = document.createElement('input');
    input.type = 'number';
    input.value = currentVal;
    input.step = '0.01';
    input.min = slider.min;
    input.max = slider.max;
    input.className = 'sim-control-edit-input';

    const parent = target.parentNode;
    parent.replaceChild(input, target);
    input.focus();
    input.select();

    let updated = false;
    const commitValue = () => {
        if (updated) return;
        updated = true;

        let val = parseFloat(input.value);
        if (isNaN(val)) val = parseFloat(currentVal);

        // Clamp to slider boundaries
        val = Math.max(parseFloat(slider.min), Math.min(parseFloat(slider.max), val));
        slider.value = val;

        // Re-initialize and update frame
        initSimulation();
        initKaTeX();
        updateSimulationFrame();
    };

    input.addEventListener('keydown', (evt) => {
        if (evt.key === 'Enter') {
            commitValue();
        } else if (evt.key === 'Escape') {
            updated = true;
            initKaTeX(); // Re-render without saving
        }
    });

    input.addEventListener('blur', commitValue);
});

// Notification overlay helper
let notificationTimeout = null;
function showNotification(title, detailsHtml = '') {
    if (notificationTimeout) clearTimeout(notificationTimeout);
    if (detailsHtml) {
        const titleFs = typeof MILESTONE_NOTIFICATION_TITLE_FONT_SIZE !== 'undefined' ? MILESTONE_NOTIFICATION_TITLE_FONT_SIZE : '0.95rem';
        const detailsFs = typeof MILESTONE_NOTIFICATION_DETAILS_FONT_SIZE !== 'undefined' ? MILESTONE_NOTIFICATION_DETAILS_FONT_SIZE : '0.8rem';
        notification.innerHTML = `
            <div style="font-weight: 700; font-size: ${titleFs}; margin-bottom: 4px; color: #111827;">${title}</div>
            <div style="font-size: ${detailsFs}; color: #4b5563; display: flex; gap: 12px; justify-content: center; align-items: center; flex-wrap: wrap;">
                ${detailsHtml}
            </div>
        `;
    } else {
        notification.innerHTML = title;
    }
    notification.classList.remove('hidden');
    setTimeout(() => notification.classList.add('show'), 10);
    notificationTimeout = setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.classList.add('hidden'), 500);
    }, 4000);
}

// Format numbers in scientific notation using HTML superscript
function formatScientificHTML(num, decimals = 4) {
    if (num === 0) return "0";
    const str = num.toExponential(decimals);
    const parts = str.split('e');
    const base = parts[0];
    const exponent = parseInt(parts[1]);
    if (exponent === 0) {
        return num.toFixed(decimals);
    }
    return `${base} &times; 10<sup>${exponent}</sup>`;
}

// Format HUD Time with appropriate sub-year units (seconds, minutes, hours, days)
function formatTime(years, decimals = 2) {
    if (years === 0) return `0${decimals > 0 ? '.' + '0'.repeat(decimals) : ''} s`;
    const seconds = years * 31557600;
    if (seconds < 1.0) {
        if (seconds < 1e-3) {
            return `${formatScientificHTML(seconds, decimals > 0 ? decimals : 4)} s`;
        }
        return `${seconds.toFixed(decimals > 0 ? decimals : 4)} s`;
    }
    if (seconds < 60) {
        return `${seconds.toFixed(decimals)} s`;
    }
    if (seconds < 3600) {
        return `${(seconds / 60).toFixed(decimals)} min`;
    }
    if (seconds < 86400) {
        return `${(seconds / 3600).toFixed(decimals)} hr`;
    }
    if (seconds < 31557600) {
        return `${(seconds / 86400).toFixed(decimals)} days`;
    }
    if (years < 1000) {
        return `${years.toFixed(decimals)} yr`;
    }
    if (years < 1e6) {
        return `${(years / 1000).toFixed(decimals)} k-yr`;
    }
    if (years < 1e9) {
        return `${(years / 1e6).toFixed(decimals)} M-yr`;
    }
    return `${(years / 1e9).toFixed(decimals)} B-yr`;
}

// Format HUD Temperature
function formatTemperature(tempKelvin) {
    if (typeof tempKelvin !== 'number' || isNaN(tempKelvin)) {
        return '-- °C';
    }
    const tempCelsius = tempKelvin - 273.15;
    if (Math.abs(tempCelsius) >= 1e5) {
        return `${formatScientificHTML(tempCelsius, 2)} °C`;
    }
    return `${tempCelsius.toLocaleString(undefined, { maximumFractionDigits: 2 })} °C`;
}

// Update HUD elements
function updateHUD(time, temp, scale, epoch) {
    const timeNoDecimals = formatTime(time, 0);
    const timeThreeDecimals = formatTime(time, 3);
    
    hudTime.innerHTML = `<span class="hud-time-display">${timeNoDecimals}<span class="hud-time-tooltip">${timeThreeDecimals}</span></span>`;
    hudTemp.innerHTML = formatTemperature(temp);
    hudScale.innerHTML = formatScientificHTML(scale, 4);
    hudEpoch.innerText = epoch;
}

// BBN Abundance Chart Renderer
function drawAbundanceChart(hydrogenPct, heliumPct) {
    const chartCanvas = document.getElementById('chart-canvas');
    if (!chartCanvas) return;
    const cctx = chartCanvas.getContext('2d');

    chartCanvas.width = chartCanvas.parentElement.clientWidth - 32;
    chartCanvas.height = chartCanvas.parentElement.clientHeight - 48;

    cctx.clearRect(0, 0, chartCanvas.width, chartCanvas.height);
    const w = chartCanvas.width;

    cctx.font = "500 14px 'Inter', sans-serif";

    // Hydrogen
    cctx.fillStyle = "#000000ff";
    cctx.fillText(`Hydrogen (H): ${hydrogenPct.toFixed(1)}%`, 10, 20);
    cctx.fillStyle = "rgba(0, 0, 0, 0.08)";
    cctx.fillRect(10, 28, w - 20, 12);
    cctx.fillStyle = "#3498db"; // Hydrogen Blue
    cctx.fillRect(10, 28, (w - 20) * (hydrogenPct / 100), 12);

    // Helium
    cctx.fillStyle = "#000000ff";
    cctx.fillText(`Helium-4 (He-4): ${heliumPct.toFixed(1)}%`, 10, 64);
    cctx.fillStyle = "rgba(255, 255, 255, 0.08)";
    cctx.fillRect(10, 72, w - 20, 12);
    cctx.fillStyle = "#e67e22"; // Helium Orange
    cctx.fillRect(10, 72, (w - 20) * (heliumPct / 100), 12);
}
