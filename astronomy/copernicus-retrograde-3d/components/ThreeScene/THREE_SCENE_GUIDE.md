# Guía Definitiva de Integración y Uso: Escena Base Three.js (`ThreeSceneController`)

Esta guía documenta la arquitectura, estilos CSS y el controlador JavaScript reutilizable para inicializar una **escena 3D vacía lista para usar en Three.js** de forma **100% modular, desacoplada y Plug & Play**.

---

## 📌 Descripción General

El componente **`ThreeSceneController`** elimina todo el código repetitivo (*boilerplate*) necesario para arrancar una aplicación WebGL 3D:
- **Zero-Boilerplate:** Crea la escena (`THREE.Scene`), la cámara de perspectiva, el renderizador WebGL, la luz ambiental y los controles de órbita (`OrbitControls`) automáticamente.
- **Inyección DOM Inteligente:** Si no existe un contenedor `#canvas-container` en tu HTML, el controlador lo crea e inyecta dinámicamente en el `<body>`.
- **Diseño Responsivo Integrado:** Escucha los cambios de tamaño de la ventana (`resize`) y ajusta la relación de aspecto de la cámara y el tamaño del lienzo automáticamente.
- **Totalmente Desacoplado:** No posee dependencias astronómicas ni globales (`window.CONFIG`). Es apto para cualquier tipo de proyecto 3D.

---

## 📂 Archivos del Componente (Co-located)

El módulo reside 100% dentro de su directorio dedicado `components/ThreeScene/`:

```text
components/ThreeScene/
├── ThreeSceneController.js   # Clase JS (Motor 3D, Cámara, Renderer, Resize y Loop)
├── ThreeScene.css             # Estilos del lienzo (Ancho y alto 100%, posicionamiento)
└── THREE_SCENE_GUIDE.md      # Documentación de integración y API
```

| Archivo | Ruta | Descripción / Responsabilidad |
| :--- | :--- | :--- |
| **Hoja de Estilos** | `components/ThreeScene/ThreeScene.css` | Define las propiedades CSS del contenedor para ocupar el 100% de la pantalla o contenedor padre. |
| **Controlador JS** | `components/ThreeScene/ThreeSceneController.js` | Módulo ES Module con la clase `ThreeSceneController` que gestiona Three.js. |

---

## 🚀 Inicio Rápido: Uso del Módulo en 3 Pasos

### Paso 1: Copiar la Carpeta del Componente
Copia la carpeta completa `components/ThreeScene/` al directorio de tu nueva aplicación.

### Paso 2: Vincular el CSS y la Importación de Módulos (`importmap`) en `index.html`
Agrega la etiqueta `<link>` de estilos y la etiqueta `<script type="importmap">` dentro de la sección `<head>` de tu `index.html` para resolver las librerías `three` y `OrbitControls`:

```html
<head>
  <!-- Estilos del lienzo 3D -->
  <link rel="stylesheet" href="components/ThreeScene/ThreeScene.css">

  <!-- Resolución de dependencias ES Module (archivos locales o CDN) -->
  <script type="importmap">
    {
      "imports": {
        "three": "./assets/js/three.module.js",
        "OrbitControls": "./assets/js/OrbitControls.js"
      }
    }
  </script>
</head>
```

> [!NOTE]
> **Nota sobre CDN**: Si tu nuevo proyecto no tiene los archivos locales en `./assets/js/`, puedes apuntar los mapas de importación directamente a un CDN como unpkg o cdnjs:
> ```json
> {
>   "imports": {
>     "three": "https://unpkg.com/three@0.160.0/build/three.module.js",
>     "OrbitControls": "https://unpkg.com/three@0.160.0/examples/jsm/controls/OrbitControls.js"
>   }
> }
> ```

Y define un contenedor en el `<body>` (opcional, si no se incluye se creará automáticamente):

```html
<body>
  <div id="canvas-container"></div>

  <script type="module" src="js/main.js"></script>
</body>
```

### Paso 3: Importar e Instanciar en tu JavaScript Principal (`main.js`)

```javascript
import { ThreeSceneController } from './components/ThreeScene/ThreeSceneController.js';
import * as THREE from 'three';

// 1. Instanciar la escena 3D vacía
const sceneApp = new ThreeSceneController({
  container: '#canvas-container',
  backgroundColor: '#0a0e17', // Color de fondo
  cameraPos: { x: 0, y: 100, z: 300 }
});

// 2. Crear tus objetos 3D (Ejemplo: Un cubo giratorio)
const geometry = new THREE.BoxGeometry(30, 30, 30);
const material = new THREE.MeshStandardMaterial({ color: 0x38bdf8 });
const cube = new THREE.Mesh(geometry, material);

// 3. Añadir el objeto a la escena
sceneApp.add(cube);

// 4. Registrar callback de renderizado para animar
sceneApp.options.onRender = () => {
  cube.rotation.x += 0.01;
  cube.rotation.y += 0.01;
};

// 5. Iniciar el bucle de animación
sceneApp.startLoop();
```

---

## ⚙️ Referencia de la API (`ThreeSceneController`)

### Opciones del Constructor (`options`)

| Opción | Tipo | Valor por Defecto | Descripción |
| :--- | :--- | :--- | :--- |
| `container` | `string \| HTMLElement` | `'#canvas-container'` | Selector CSS o elemento DOM del contenedor. |
| `backgroundColor` | `number \| string` | `0x0a0e17` | Color de fondo de la escena (Hexadecimal o string CSS). |
| `fov` | `number` | `45` | Campo de visión vertical de la cámara en grados. |
| `near` | `number` | `0.1` | Plano cercano de recorte (*near frustum*). |
| `far` | `number` | `100000` | Plano lejano de recorte (*far frustum*). |
| `cameraPos` | `Object` | `{x:0, y:1000, z:2000}` | Posición tridimensional inicial de la cámara `{x, y, z}`. |
| `ambientLightIntensity` | `number` | `0.5` | Intensidad inicial de la luz ambiental. |
| `enableControls` | `boolean` | `true` | Activa o desactiva `OrbitControls`. |
| `enableDamping` | `boolean` | `true` | Habilita la inercia/amortiguación en los controles de órbita. |
| `dampingFactor` | `number` | `0.05` | Inercia de rotación del usuario (menor = más suave). |
| `onRender` | `Function` | `null` | Callback ejecutado en cada fotograma del bucle `update()`. |

---

### Métodos Públicos

#### `add(object: THREE.Object3D)`
Añade una malla (`Mesh`), grupo (`Group`), luz o cualquier objeto Three.js a la escena.

```javascript
sceneApp.add(miMalla3D);
```

#### `remove(object: THREE.Object3D)`
Remueve un objeto previamente añadido de la escena.

```javascript
sceneApp.remove(miMalla3D);
```

#### `setBackgroundColor(color: number | string)`
Cambia el color de fondo de la escena en tiempo real.

```javascript
sceneApp.setBackgroundColor('#1e293b'); // Cambio a azul grisáceo
```

#### `setAmbientLightIntensity(intensity: number)`
Ajusta la intensidad de la luz ambiental.

```javascript
sceneApp.setAmbientLightIntensity(1.0); // Luz ambiental brillante
```

#### `setCameraPosition(x: number, y: number, z: number)`
Reposiciona la cámara en las coordenadas $(x, y, z)$ dadas.

```javascript
sceneApp.setCameraPosition(0, 500, 1000);
```

#### `update()`
Ejecuta un solo cuadro de renderizado (actualiza `OrbitControls`, ejecuta `onRender()` y llama a `renderer.render()`).

#### `startLoop()`
Inicia el bucle de animación continuo a 60 FPS mediante `requestAnimationFrame`.

```javascript
sceneApp.startLoop();
```

#### `stopLoop()`
Detiene el bucle de animación activo.

#### `destroy()`
Cancela la animación, elimina el lienzo del DOM y limpia los event listeners para liberar memoria GPU.

```javascript
sceneApp.destroy();
```

---

## 💡 Ejemplo Avanzado: Múltiples Objetos y Luces

```javascript
import { ThreeSceneController } from './components/ThreeScene/ThreeSceneController.js';
import * as THREE from 'three';

const app = new ThreeSceneController({
  backgroundColor: 0x0f172a,
  cameraPos: { x: 0, y: 150, z: 400 }
});

// Añadir una Luz Puntual adicional (PointLight)
const pointLight = new THREE.PointLight(0xffffff, 2, 1000);
pointLight.position.set(100, 200, 100);
app.add(pointLight);

// Añadir un plano base (Suelo)
const planeGeo = new THREE.PlaneGeometry(500, 500);
const planeMat = new THREE.MeshStandardMaterial({ color: 0x1e293b });
const plane = new THREE.Mesh(planeGeo, planeMat);
plane.rotation.x = -Math.PI / 2;
app.add(plane);

// Añadir una Esfera
const sphereGeo = new THREE.SphereGeometry(30, 32, 32);
const sphereMat = new THREE.MeshStandardMaterial({ color: 0xef4444 });
const sphere = new THREE.Mesh(sphereGeo, sphereMat);
sphere.position.y = 30;
app.add(sphere);

app.startLoop();
```

---

## 🔧 (Opcional) Integración con Archivos de Configuración Global (`config.js` / `window.CONFIG`)

Si tu nueva aplicación prefiere centralizar los parámetros en un archivo `js/config.js` para modificar variables fácilmente desde la consola del navegador:

### 1. Crear el archivo `js/config.js`

```javascript
window.CONFIG = {
  SCENE_BACKGROUND_COLOR: '#0a0e17',
  AMBIENT_LIGHT_INTENSITY: 0.5,
  CAMERA_FOV: 45,
  CAMERA_POS: { x: 0, y: 1000, z: 2000 }
};

// Alias globales directos en window para pruebas en consola
window.SCENE_BACKGROUND_COLOR = window.CONFIG.SCENE_BACKGROUND_COLOR;
window.AMBIENT_LIGHT_INTENSITY = window.CONFIG.AMBIENT_LIGHT_INTENSITY;
```

### 2. Incluir `config.js` en `index.html` (antes del script principal)

```html
<script src="js/config.js"></script>
```

### 3. Conectar `window.CONFIG` con `ThreeSceneController`

```javascript
const app = new ThreeSceneController({
  backgroundColor: (window.CONFIG && window.CONFIG.SCENE_BACKGROUND_COLOR) ? window.CONFIG.SCENE_BACKGROUND_COLOR : 0x0a0e17,
  ambientLightIntensity: (window.CONFIG && window.CONFIG.AMBIENT_LIGHT_INTENSITY !== undefined) ? window.CONFIG.AMBIENT_LIGHT_INTENSITY : 0.5,
  fov: (window.CONFIG && window.CONFIG.CAMERA_FOV) ? window.CONFIG.CAMERA_FOV : 45,
  cameraPos: (window.CONFIG && window.CONFIG.CAMERA_POS) ? window.CONFIG.CAMERA_POS : { x: 0, y: 1000, z: 2000 }
});
```

---

## 💎 Buenas Prácticas Recomendadas

### 1. Patrón de Herencia Orientado a Objetos (Extender la Clase Base)
Si tu nueva aplicación requiere características avanzadas específicas de tu dominio (como transiciones de cámara suaves entre vistas, modos de seguimiento o física), la mejor práctica es **crear una clase que herede de `ThreeSceneController`**:

```javascript
import { ThreeSceneController } from './components/ThreeScene/ThreeSceneController.js';

export class CustomAppManager extends ThreeSceneController {
  constructor(containerSelector) {
    super({
      container: containerSelector,
      backgroundColor: '#0f172a',
      cameraPos: { x: 0, y: 200, z: 500 }
    });

    this.miEstadoEspecifico = {};
  }

  // Método personalizado de tu aplicación
  enfocarObjeto(objeto3D) {
    this.controls.target.copy(objeto3D.position);
    this.controls.update();
  }
}
```

### 2. Liberación de Memoria GPU (`Dispose Pattern`)
En aplicaciones 3D interactivas donde añades y eliminas objetos continuamente, Three.js requiere liberar manualmente la memoria de la tarjeta gráfica (GPU). Siempre destruye geometrías y materiales al remover un objeto:

```javascript
function eliminarObjeto(escena, mesh) {
  escena.remove(mesh);
  if (mesh.geometry) mesh.geometry.dispose();
  if (mesh.material) {
    if (Array.isArray(mesh.material)) {
      mesh.material.forEach(mat => mat.dispose());
    } else {
      mesh.material.dispose();
    }
  }
}
```

### 3. Ecosistema de Componentes Modulares
El componente **`ThreeScene`** está diseñado para trabajar en armonía con los demás componentes modulares de la suite:
- **`MenuBar` (`components/MenuBar/`)**: Controla opciones de vista, menús y capas superiores.
- **`TimeHud` (`components/TimeHud/`)**: Administra la barra de tiempo flotante inferior y la reproducción de animaciones.
- **`ThreeScene` (`components/ThreeScene/`)**: Administra el lienzo 3D base y la experiencia visual WebGL.
