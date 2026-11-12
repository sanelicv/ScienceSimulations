# Science Simulations · Simulaciones Científicas

Colección de **45 simulaciones interactivas** de matemáticas, física, astronomía, astrofísica, cosmología y física de altas energías, creadas como **herramienta didáctica** para la enseñanza en el aula y la divulgación.

*A collection of 45 interactive simulations of mathematics, physics, astronomy, astrophysics, cosmology and high-energy physics, built as an educational tool. An English summary is available [at the end](#english-summary).*

> [!IMPORTANT]
> **Herramienta didáctica, no validada científicamente.** Las simulaciones tienen fines exclusivamente educativos. Los modelos incluyen simplificaciones y aproximaciones, por lo que sus resultados **no deben usarse para investigación ni para tomar decisiones técnicas**.

**Autor:** Saneli Alcides Carbajal Vigo · Universidad del Pacífico, Lima, Perú · ORCID [0000-0001-6064-7250](https://orcid.org/0000-0001-6064-7250)

**DOI:** [10.5281/zenodo.24148468](https://doi.org/10.5281/zenodo.24148468)

Las simulaciones también se pueden encontrar en [3o4cosas.com](https://3o4cosas.com).

---

## Cómo usarlas

### Opción recomendada: servidor local (un doble clic)

Descarga el repositorio (botón **Code → Download ZIP** en GitHub, o `git clone`) y luego:

| Sistema | Qué hacer |
|---|---|
| Windows | Doble clic en **`start-server.bat`** |
| macOS / Linux | Doble clic en **`start-server.command`** (o `./start-server.command` en la terminal) |
| Cualquiera | `python start-server.py` |

Se abrirá el navegador con el menú en `http://localhost:8000`. **Deja abierta la ventana del servidor** mientras uses las simulaciones; ciérrala (o pulsa `Ctrl+C`) para detenerlo. Solo necesita [Python 3](https://www.python.org/downloads/) (3.7 o superior), sin instalar nada más ni conexión a internet.

```bash
python start-server.py                         # abre el menú
python start-server.py astronomy/sky-calendar  # abre directamente una simulación
python start-server.py --port 9000             # usa otro puerto
```

### ¿Por qué hace falta un servidor?

Al abrir un archivo HTML con doble clic (`file://`), los navegadores bloquean por seguridad los módulos JavaScript y la carga de archivos (fuentes, modelos 3D, texturas, datos). Por eso **19 simulaciones solo funcionan servidas por HTTP**; en el menú aparecen con la etiqueta *«Requiere servidor local»* cuando se abre sin servidor. Las demás funcionan también con doble clic.

Seleccionar archivos propios (por ejemplo, un Excel en *Regresión lineal*) **no** requiere servidor: el navegador los lee localmente y no se suben a ningún sitio.

### Usar una sola simulación

Cada simulación es **autocontenida**: sus librerías, fuentes, texturas y modelos 3D están dentro de su carpeta, así que puedes copiar solo la que te interese y funcionará **sin conexión a internet**. Si es una de las que requieren servidor, copia también `start-server.py` dentro de esa carpeta y ejecútalo allí.

```
astronomy/copernicus-moon-phases/
├── index.html      ← punto de entrada
├── sketch1.js      ← código de la simulación
├── lib/            ← librerías JavaScript (p5.js, three.js…)
├── fonts/          ← fuentes
└── models/         ← modelos 3D
```

> `astrophysics/stellar-map` carga su lista de casos predefinidos con PHP (`get_cases.php`). Con `start-server.py` la simulación funciona, pero sin esos casos; para tenerlos hace falta un servidor con PHP (por ejemplo, XAMPP).

## Simulaciones

### Matemáticas — `math/`

| Simulación | Carpeta |
|---|---|
| Calculadora Científica | [`math/scientific-calculator`](math/scientific-calculator/index.html) |
| Regresión Lineal Simple | [`math/linear-regression`](math/linear-regression/index.html) |
| Excentricidad de la Elipse | [`math/ellipse-eccentricity`](math/ellipse-eccentricity/index.html) |

### Física — `physics/`

| Simulación | Carpeta |
|---|---|
| Cañón de Newton | [`physics/newton-cannon`](physics/newton-cannon/index.html) |
| Órbitas en el modelo de Kepler | [`physics/kepler-orbits`](physics/kepler-orbits/index.html) |
| El Sol desaparece | [`physics/sun-disappears`](physics/sun-disappears/animation.html) |
| Campo y Potencial Eléctrico | [`physics/electric-field`](physics/electric-field/index.html) |
| Generador Eléctrico | [`physics/electric-generator`](physics/electric-generator/index.html) |
| Modelos de la Luz | [`physics/light-models`](physics/light-models/index.html) |
| Efecto Fotoeléctrico | [`physics/photoelectric-effect`](physics/photoelectric-effect/index.html) |
| Efecto Doppler de la Luz | [`physics/relativistic-doppler`](physics/relativistic-doppler/index.html) |
| Espectro del Hidrógeno | [`physics/hydrogen-spectrum`](physics/hydrogen-spectrum/index.html) |

### Astronomía — `astronomy/`

| Simulación | Carpeta |
|---|---|
| Solsticios y Equinoccios | [`astronomy/solstices-equinoxes`](astronomy/solstices-equinoxes/index.html) |
| Eclíptica y Planetas | [`astronomy/ecliptic-and-planets`](astronomy/ecliptic-and-planets/index.html) |
| Horizonte Astronómico | [`astronomy/astronomical-horizon`](astronomy/astronomical-horizon/index.html) |
| Coordenadas Ecuatoriales | [`astronomy/equatorial-coordinates`](astronomy/equatorial-coordinates/index.html) |
| Calendario Astronómico | [`astronomy/sky-calendar`](astronomy/sky-calendar/index.html) |
| Calendario Lunar | [`astronomy/lunar-calendar`](astronomy/lunar-calendar/index.html) |
| Sol y Esfera Celeste | [`astronomy/ptolemy-sun-celestial-sphere`](astronomy/ptolemy-sun-celestial-sphere/index.html) |
| Eclíptica en el modelo ptolemaico | [`astronomy/ptolemy-ecliptic-3d`](astronomy/ptolemy-ecliptic-3d/index.html) |
| Órbitas en el modelo ptolemaico | [`astronomy/ptolemy-geocentric-orbits`](astronomy/ptolemy-geocentric-orbits/index.html) |
| Movimiento retrógrado en el modelo ptolemaico | [`astronomy/ptolemy-epicycles-3d`](astronomy/ptolemy-epicycles-3d/index.html) |
| Deferentes y Epiciclos | [`astronomy/ptolemy-deferents-epicycles`](astronomy/ptolemy-deferents-epicycles/index.html) |
| Múltiples Epiciclos | [`astronomy/ptolemy-multiple-epicycles`](astronomy/ptolemy-multiple-epicycles/index.html) |
| Fases de Venus en el modelo ptolemaico | [`astronomy/ptolemy-venus-phases`](astronomy/ptolemy-venus-phases/index.html) |
| Sistema Tierra-Sol | [`astronomy/copernicus-earth-sun-system`](astronomy/copernicus-earth-sun-system/index.html) |
| Eclíptica en el modelo copernicano | [`astronomy/copernicus-ecliptic-3d`](astronomy/copernicus-ecliptic-3d/index.html) |
| Fases Lunares | [`astronomy/copernicus-moon-phases`](astronomy/copernicus-moon-phases/index.html) |
| Órbitas Copernicanas | [`astronomy/copernicus-heliocentric-orbits`](astronomy/copernicus-heliocentric-orbits/index.html) |
| Movimiento Retrógrado Aparente | [`astronomy/copernicus-retrograde-3d`](astronomy/copernicus-retrograde-3d/index.html) |
| Fases de Venus en el modelo copernicano | [`astronomy/copernicus-venus-phases`](astronomy/copernicus-venus-phases/index.html) |
| Órbitas Elípticas | [`astronomy/copernicus-elliptical-orbits`](astronomy/copernicus-elliptical-orbits/index.html) |

### Astrofísica — `astrophysics/`

| Simulación | Carpeta |
|---|---|
| Creador de Sistema Solar | [`astrophysics/solar-system-creator`](astrophysics/solar-system-creator/index.html) |
| Buscador de Exoplanetas | [`astrophysics/exoplanets`](astrophysics/exoplanets/index.html) |
| Distancias Estelares | [`astrophysics/stellar-map`](astrophysics/stellar-map/index.html) |
| Espectros Comunes | [`astrophysics/spectra`](astrophysics/spectra/index.html) |
| Distancia y Luminosidad | [`astrophysics/distance-luminosity`](astrophysics/distance-luminosity/index.html) |
| Agujero Negro | [`astrophysics/black-hole`](astrophysics/black-hole/index.html) |

### Cosmología — `cosmology/`

| Simulación | Carpeta |
|---|---|
| Expansión del Universo | [`cosmology/universe-expansion`](cosmology/universe-expansion/index.html) |
| Radiación Cósmica de Fondo | [`cosmology/cmb`](cosmology/cmb/index.html) |
| Parámetros Cosmológicos | [`cosmology/cosmological-parameters`](cosmology/cosmological-parameters/index.html) |
| Evolución del Universo | [`cosmology/universe-evolution`](cosmology/universe-evolution/index.html) |
| Big Bang | [`cosmology/big-bang`](cosmology/big-bang/index.html) |

### Física de Altas Energías — `hep/`

| Simulación | Carpeta |
|---|---|
| Super-Kamiokande | [`hep/super-kamiokande`](hep/super-kamiokande/index.html) |
| TAMBO | [`hep/tambo`](hep/tambo/index.html) |

## Estructura del repositorio

```
├── index.html               menú principal
├── assets/homepage/         estilos, traducciones (ES/EN), fuentes y miniaturas del menú
├── math/ physics/ astronomy/ astrophysics/ cosmology/ hep/
│   └── <simulación>/        cada simulación, independiente de las demás
├── LICENSE
└── CITATION.cff
```

## Aviso de no oficialidad

Este es un proyecto personal e independiente. Las simulaciones que representan experimentos o colaboraciones científicas (por ejemplo, **Super-Kamiokande** o **TAMBO**) son recreaciones divulgativas propias: **no son productos oficiales de esas colaboraciones ni están avaladas por ellas**, y tampoco representan la posición de la institución a la que pertenece el autor. Los nombres y logotipos mencionados pertenecen a sus respectivos titulares.

## Cómo citar

Si utilizas estas simulaciones en un trabajo académico, cítalas usando los metadatos de [`CITATION.cff`](CITATION.cff) (GitHub muestra un botón *"Cite this repository"* en la página del repositorio). Por ejemplo, en formato APA:

> Carbajal Vigo, S. A. (2026). *Science Simulations: interactive physics, astronomy and cosmology simulations for teaching* [Software]. Zenodo. https://doi.org/10.5281/zenodo.24148468

## Licencia

El código propio de este repositorio se distribuye bajo la [licencia MIT](LICENSE).

### Software de terceros

Las librerías y fuentes incluidas dentro de las carpetas de las simulaciones **no** están cubiertas por la licencia MIT de este repositorio; cada una conserva su propia licencia:

| Componente | Versión(es) | Licencia |
|---|---|---|
| [p5.js](https://p5js.org) | 1.4.2, 1.5.0, 1.9.0, 1.9.3 | LGPL-2.1 |
| [three.js](https://threejs.org) (incl. `OrbitControls`) | r128, r160 | MIT |
| [KaTeX](https://katex.org) | 0.16.x | MIT |
| [Plotly.js](https://plotly.com/javascript/) | 2.35.2 | MIT |
| [Chart.js](https://www.chartjs.org) | 4.6.1 | MIT |
| [SheetJS (xlsx)](https://sheetjs.com) | 0.18.5 | Apache-2.0 |
| [jsPDF](https://github.com/parallax/jsPDF) | 2.5.1 | MIT |
| [html2pdf.js](https://github.com/eKoopmans/html2pdf.js) | — | MIT |
| [Slim Select](https://slimselectjs.com) | 4.6.4 | MIT |
| [Lucide](https://lucide.dev) | 1.72.0 | ISC |
| [Font Awesome Free](https://fontawesome.com) | 6.5.2 | Iconos CC BY 4.0 · fuentes SIL OFL 1.1 · código MIT |
| Fuentes Inter, Outfit, JetBrains Mono ([Fontsource](https://fontsource.org)) | 5.3.0 | SIL OFL 1.1 |
| Fuente Roboto | — | Apache-2.0 |

---

## English summary

**Science Simulations** is a collection of 45 self-contained interactive simulations covering mathematics, physics, astronomy (including the Ptolemaic and Copernican models), astrophysics, cosmology and high-energy physics, created as an **educational tool**.

- **Not scientifically validated.** The simulations are for teaching purposes only; their models include simplifications and must not be used for research or technical decisions.
- **Unofficial.** Simulations depicting experiments or collaborations (e.g. Super-Kamiokande, TAMBO) are independent outreach recreations, not official products of, nor endorsed by, those collaborations.
- **Offline and self-contained.** Every simulation folder bundles its own libraries and assets. Double-click `start-server.bat` (Windows) or `start-server.command` (macOS/Linux), or run `python start-server.py`, to open the menu on a local server. 19 simulations require it because browsers block JavaScript modules and file loading on `file://`; the rest also work by double-clicking their `index.html`.
- **Author:** Saneli Alcides Carbajal Vigo, Universidad del Pacífico (Lima, Peru), ORCID [0000-0001-6064-7250](https://orcid.org/0000-0001-6064-7250).
- **License:** MIT for the original code; bundled third-party components keep their own licenses (see table above). Please cite using [`CITATION.cff`](CITATION.cff) or the DOI [10.5281/zenodo.24148468](https://doi.org/10.5281/zenodo.24148468).
