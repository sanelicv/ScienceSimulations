/* Vista desplegada: el techo, la pared y el fondo del tanque abiertos como un mapa (la vista clásica de Super-K). */
(function () {
  const { R, HH } = SUPERK.settings;
  const { pmt, N_PMT } = SUPERK.pmts;
  const { t, onChange } = SUPERK.i18n;

const box = document.createElement('div');
box.className = 'unrolled';
box.innerHTML = '<canvas></canvas>';
document.body.appendChild(box);
const cv = box.querySelector('canvas'), g = cv.getContext('2d');
const label = () => box.setAttribute('aria-label', t('unrolled'));
label();
onChange(label);

// Proporciones reales: la pared desplegada mide 2πR de ancho y 2HH de alto; techo y fondo, círculos de radio R
const PAD = 4, GAP = 4;
let W = 0, H = 0, BW, BH, RC, CX, TOPC, BAR0, BOTC, dpr = 1;
const bg = document.createElement('canvas');
function layout() {
  const w = box.clientWidth;
  if (!w) return false;
  dpr = Math.min(2, window.devicePixelRatio || 1);
  W = w;
  BW = W - 2 * PAD; BH = BW * (2 * HH) / (2 * Math.PI * R); RC = BW / (2 * Math.PI);
  CX = W / 2; TOPC = PAD + RC; BAR0 = TOPC + RC + GAP; BOTC = BAR0 + BH + GAP + RC;
  H = Math.ceil(BOTC + RC + PAD);
  for (const c of [cv, bg]) { c.width = Math.round(W * dpr); c.height = Math.round(H * dpr); }
  cv.style.height = H + 'px';
  // Fondo: todos los fotomultiplicadores apagados y los contornos
  const b = bg.getContext('2d');
  b.setTransform(dpr, 0, 0, dpr, 0, 0);
  b.fillStyle = 'rgba(160,170,190,0.2)';
  const s = Math.max(0.6, W / 360);
  for (let k = 0; k < N_PMT; k++) { const [x, y] = to2D(k); b.fillRect(x - s / 2, y - s / 2, s, s); }
  b.strokeStyle = 'rgba(160,190,230,0.45)';
  b.lineWidth = 1;
  b.beginPath(); b.arc(CX, TOPC, RC, 0, 2 * Math.PI); b.stroke();
  b.beginPath(); b.arc(CX, BOTC, RC, 0, 2 * Math.PI); b.stroke();
  b.strokeRect(CX - BW / 2, BAR0, BW, BH);
  return true;
}
function to2D(k) {
  const q = pmt[k];
  if (q.part === 'barrel') return [CX - BW / 2 + (q.phi / (2 * Math.PI)) * BW, BAR0 + (HH - q.y) / (2 * HH) * BH];
  const sc = RC / R;
  return q.part === 'top' ? [CX + q.x * sc, TOPC + q.z * sc] : [CX + q.x * sc, BOTC - q.z * sc];
}

let shown = false, lastLit = null, lastHighlight = 0, lastColor = null;
const tmpC = new THREE.Color();
// Dibuja los encendidos, con el resaltado del último paso si lo hay
function draw(lit, highlight = 0, color = null) {
  lastLit = lit; lastHighlight = highlight; lastColor = color;
  if (!shown) return;
  if (!W && !layout()) return;
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.clearRect(0, 0, cv.width, cv.height);
  g.drawImage(bg, 0, 0);
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  const sc = W / 320;
  for (const h of lit) {
    const [x, y] = to2D(h.i);
    tmpC.copy(h.color);
    if (highlight > 0) tmpC.lerp(color, highlight);
    g.fillStyle = '#' + tmpC.getHexString();
    g.beginPath(); g.arc(x, y, sc * (0.9 + 2.2 * h.amount), 0, 2 * Math.PI); g.fill();
  }
}
function show(on) {
  if (shown === on) return;
  shown = on;
  box.classList.toggle('on', on);
  if (on) { W = 0; draw(lastLit || [], lastHighlight, lastColor); }
}
window.addEventListener('resize', () => { if (shown) { W = 0; draw(lastLit || [], lastHighlight, lastColor); } });

SUPERK.unrolled = { draw, show, get shown() { return shown; } };
})();
