# Guía de Integración y Uso: Bottom Time HUD (`TimeHudController`)

Esta guía explica la arquitectura, el funcionamiento, la gestión de iconos y el proceso paso a paso para integrar el **Bottom Time HUD** (controlador flotante de animación, velocidad y tiempo) en cualquier aplicación web o simulación 3D interactiva.

---

## 📌 Descripción General

El **Bottom Time HUD** es un componente UI modular, flotante y desacoplado, diseñado siguiendo los estándares modernos de desarrollo web y experiencia de usuario (UX/UI en simulaciones 3D).

### Características Clave
- **Co-location / Arquitectura por Componente:** Todos los archivos del componente (CSS, JS y Documentación) viven juntos dentro de su propia carpeta dedicada (`components/TimeHud/`).
- **Zero-Boilerplate (Plug & Play):** No requiere escribir marcado HTML manual en `index.html`. El controlador crea e inyecta dinámicamente su estructura en el DOM.
- **Iconografía SVG Incrustada:** Todos los iconos (Play, Pausa, Velocidad, Reloj) están encapsulados en código SVG dentro de la clase JS, eliminando dependencias de archivos de imagen externos.
- **Atajos de Teclado Nativos:** Soporte para alternar Play/Pausa mediante la **Barra Espaciadora** (`Espacio`).
- **Diseño Premium:** Estética moderna con *glassmorphism* (`backdrop-filter: blur`), bordes redondeados y adaptabilidad móvil en pantallas reducidas.
- **Sincronización Bidireccional:** Permite controlar la animación a través de callbacks y actualizar los valores numéricos/deslizadores desde el bucle principal de la aplicación.

---

## 📂 Archivos del Componente (Co-located)

El componente está encapsulado 100% dentro de su directorio dedicado `components/TimeHud/`:

```text
components/TimeHud/
├── TimeHudController.js   # Clase JS (Lógica, Eventos y DOM)
├── TimeHud.css             # Estilos visuales y adaptabilidad móvil
└── hud-guide.md            # Documentación de integración y API
```

| Archivo | Ruta | Descripción / Responsabilidad |
| :--- | :--- | :--- |
| **Hoja de Estilos** | `components/TimeHud/TimeHud.css` | Contiene los estilos visuales, animaciones, variables CSS de color, estilos de los deslizadores (`range input`) y reglas de diseño responsivo. |
| **Controlador JS** | `components/TimeHud/TimeHudController.js` | Clase JavaScript (ES Module) encargada de la inyección DOM, lógica de estado (`play`, `speed`, `day`), eventos y la API pública. |

---

## 🎨 Iconos Necesarios (Iconografía SVG)

Por defecto, **`TimeHudController.js` ya incluye los iconos en formato SVG incrustado**, por lo que **NO necesitas descargar ni copiar imágenes externas** para que el HUD funcione.

Sin embargo, si tu equipo prefiere cargar los archivos `.svg` de forma independiente dentro de una carpeta de assets, estos son los **4 iconos utilizados** con sus respectivos códigos SVG vectoriales:

### 1. Botón Reproducir (`play.svg`)
```xml
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z" />
</svg>
```

### 2. Botón Pausa (`pause.svg`)
```xml
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <rect x="14" y="3" width="5" height="18" rx="1" />
  <rect x="5" y="3" width="5" height="18" rx="1" />
</svg>
```

### 3. Icono de Velocidad (`sliders-horizontal.svg`)
```xml
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M10 5H3" />
  <path d="M12 19H3" />
  <path d="M14 3v4" />
  <path d="M16 17v4" />
  <path d="M21 12h-9" />
  <path d="M21 19h-5" />
  <path d="M21 5h-7" />
  <path d="M8 10v4" />
  <path d="M8 12H3" />
</svg>
```

### 4. Icono de Tiempo / Reloj (`clock.svg`)
```xml
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <circle cx="12" cy="12" r="10" />
  <path d="M12 6v6l4 2" />
</svg>
```

---

## 🚀 Guía de Integración Paso a Paso

### Paso 1: Copiar la Carpeta del Componente
Copia la carpeta completa `components/TimeHud/` al directorio de tu nueva aplicación.

### Paso 2: Vincular la Hoja de Estilos en `index.html`
Agrega la etiqueta `<link>` dentro de la sección `<head>` de tu `index.html`:

```html
<head>
  <!-- Otros estilos del proyecto -->
  <link rel="stylesheet" href="components/TimeHud/TimeHud.css">
</head>
```

### Paso 3: Importar e Instanciar en JavaScript
Importa la clase `TimeHudController` en el script principal de tu aplicación (ej. `js/main.js`) e instanciala configurando los eventos deseados:

```javascript
import { TimeHudController } from '../components/TimeHud/TimeHudController.js';

// Instanciación y vinculación del HUD
const timeHud = new TimeHudController({
  container: '#canvas-container', // Contenedor donde se inyectará el HUD
  minDay: 0,
  maxDay: 365,
  initialDay: 0,
  minSpeed: 1,
  maxSpeed: 30,
  initialSpeed: 1,
  autoPlay: true,

  // Callback al presionar Play / Pausa (o la tecla Espacio)
  onPlayChange: (isPlaying) => {
    console.log('Estado de animación:', isPlaying ? 'Reproduciendo' : 'Pausado');
    // Ejemplo: miSimulacion.isAnimating = isPlaying;
  },

  // Callback al mover el slider de velocidad
  onSpeedChange: (speed) => {
    console.log('Multiplicador de velocidad:', speed);
    // Ejemplo: miSimulacion.velocidad = speed;
  },

  // Callback al arrastrar manualmente el slider de días
  onDayChange: (day, isUserInitiated) => {
    console.log('Día seleccionado:', day, 'Iniciado por usuario:', isUserInitiated);
    // Ejemplo: miSimulacion.setDia(day);
  }
});
```

### Paso 4: Sincronizar en el Bucle de Animación (`requestAnimationFrame`)
En cada fotograma de tu animación, incrementa el tiempo y notifica al controlador para actualizar la UI:

```javascript
function renderLoop() {
  requestAnimationFrame(renderLoop);

  if (miSimulacion.isAnimating) {
    // Incrementar día según la velocidad
    miSimulacion.dia += miSimulacion.velocidad * 0.01;

    // Actualizar la interfaz del HUD
    timeHud.setDay(miSimulacion.dia);
  }

  // Renderizar escena 3D o actualizar objetos
  miSimulacion.update();
}
```

---

## ⚙️ Referencia de la API (`TimeHudController`)

### Opciones del Constructor (`options`)

| Opción | Tipo | Valor por Defecto | Descripción |
| :--- | :--- | :--- | :--- |
| `container` | `string \| HTMLElement` | `'body'` | Selector CSS o elemento DOM donde se insertará el HUD. |
| `minDay` | `number` | `0` | Valor mínimo del slider de días. |
| `maxDay` | `number` | `365` | Valor máximo del slider de días. |
| `initialDay` | `number` | `0` | Día inicial. |
| `minSpeed` | `number` | `0` | Velocidad mínima. |
| `maxSpeed` | `number` | `30` | Velocidad máxima. |
| `initialSpeed` | `number` | `1` | Velocidad inicial. |
| `autoPlay` | `boolean` | `true` | Iniciar en estado reproduciendo (`true`) o pausado (`false`). |
| `enableKeyboard` | `boolean` | `true` | Habilitar/deshabilitar la barra espaciadora para Play/Pausa. |
| `onPlayChange` | `Function` | `null` | Callback `(isPlaying: boolean) => {}`. |
| `onSpeedChange` | `Function` | `null` | Callback `(speed: number) => {}`. |
| `onDayChange` | `Function` | `null` | Callback `(day: number, isUserInitiated: boolean) => {}`. |

---

### Métodos Públicos

#### `setDay(day: number, updateSlider: boolean = true)`
Actualiza el valor del día mostrado en pantalla y sincroniza la posición del slider (si el usuario no lo está arrastrando).

#### `setSpeed(speed: number, updateSlider: boolean = true)`
Cambia el multiplicador de velocidad y su representación en la UI (ej. `5x`).

#### `setPlaying(isPlaying: boolean)`
Fuerza el estado de reproducción a `true` (Play) o `false` (Pausa), conmutando el icono visual.

#### `togglePlay()`
Alterna automáticamente entre Play y Pausa.

#### `getState(): { isPlaying: boolean, speed: number, day: number }`
Devuelve un objeto con el estado actual del HUD.

#### `destroy()`
Elimina el HUD del DOM y desvincula los event listeners globales de teclado.

---

## 🎨 Personalización de Estilos (Tematización)

El archivo `components/TimeHud/TimeHud.css` utiliza variables CSS en su raíz `:root`. Puedes modificar estas variables para adaptar los colores al tema de tu nueva aplicación:

```css
:root {
  --hud-bg: rgba(15, 23, 42, 0.88);       /* Color de fondo del panel flotante */
  --hud-border: rgba(255, 255, 255, 0.12); /* Color del borde del panel */
  --hud-text: #f8fafc;                    /* Color de texto principal */
  --hud-text-muted: #cbd5e1;              /* Color de etiquetas e iconos secundarios */
  --hud-accent: #38bdf8;                  /* Color de acento (Botón Play, Sliders, Valores) */
  --hud-accent-hover: #0284c7;            /* Color de acento al pasar el cursor (Hover) */
}
```
