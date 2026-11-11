# MWE Smooth Zoom para Three.js & OrbitControls

Este subproyecto proporciona un **Minimum Working Example (MWE)** modular y limpio para implementar un **Zoom In/Out suave e inercial** en cualquier aplicación de Three.js que utilice `OrbitControls`.

---

## 📁 Estructura del MWE

- **`SmoothZoomController.js`**: Clase ES6 independiente y reusable que gestiona la interpolación inercial (`lerp`) y los eventos de la rueda del ratón.
- **`main.js`**: Código de inicialización de la escena 3D y demostración de uso en 50 líneas.
- **`index.html`**: Interfaz de pruebas minimalista con botones de zoom y control deslizante de inercia/damping.

---

## 🚀 Cómo Integrar `SmoothZoomController` en tu Proyecto

### 1. Importa la clase
```javascript
import { SmoothZoomController } from './SmoothZoomController.js';
```

### 2. Instánciala pasando tu cámara y controles
```javascript
// Después de crear tu cámara y tu OrbitControls:
const zoomController = new SmoothZoomController(camera, controls, renderer.domElement, {
    minDistance: 3,        // Distancia mínima
    maxDistance: 80,       // Distancia máxima
    zoomSensitivity: 0.001,// Sensibilidad de la rueda del ratón
    damping: 0.08          // Factor de suavizado (0.01 = súper inercial, 0.3 = rápido)
});
```

### 3. Ejecuta `update()` en tu bucle de animación
```javascript
function animate() {
    requestAnimationFrame(animate);

    // ⚠️ Actualiza la distancia de la cámara en cada frame
    zoomController.update();

    controls.update();
    renderer.render(scene, camera);
}
animate();
```

---

## 🛠️ Métodos Disponibles para Desarrolladores

- `zoomController.zoomIn(factor)`: Realiza un acercamiento programático (por defecto `0.25` / 25%).
- `zoomController.zoomOut(factor)`: Realiza un alejamiento programático (por defecto `0.25` / 25%).
- `zoomController.setTargetDistance(distancia)`: Establece una distancia objetivo específica en unidades Three.js.
- `zoomController.setDamping(factor)`: Cambia el valor de suavidad dinámicamente.
- `zoomController.destroy()`: Elimina los eventos adjuntos y devuelve el zoom nativo a `OrbitControls`.
