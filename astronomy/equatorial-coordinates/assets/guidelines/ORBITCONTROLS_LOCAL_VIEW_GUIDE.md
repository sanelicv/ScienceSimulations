# Guía Técnica Avanzada: Implementación de Cámara de Vista Local (Primera Persona / Observador de Horizonte) usando `OrbitControls` en Three.js

Esta guía documenta en detalle la arquitectura, la lógica matemática, los fundamentos geométricos y las instrucciones paso a paso para transformar **`OrbitControls` de Three.js** en una cámara panorámica de primera persona en el horizonte (estilo observatorio astronómico / planetario $360^\circ$).

Todo esto se logra **sin modificar una sola línea del código fuente original de `OrbitControls`**, reutilizando una única instancia de control en toda la aplicación.

---

## 📌 1. Motivación y Problema Arquitectónico

### El Problema de las Alternativas Tradicionales
En aplicaciones interactiva 3D con Three.js que requieren cambiar entre una vista de maqueta/espacio (Vista Global) y una vista de observador en el suelo (Vista Local):
- **`PointerLockControls`**: Requiere que el usuario capture/bloquee el cursor dentro de la pantalla, destruyendo la usabilidad en aplicaciones web con paneles UI, botones y sliders laterales.
- **`FirstPersonControls`**: Utiliza una lógica de vuelo libre basada en tiempo (`delta`) orientada a videojuegos, difícil de calibrar para rotaciones precisas de astronómicas centradas en un punto pivote exacto.
- **Dos instancias de controles independientes**: Intercambiar entre dos controladores de cámara distintos genera conflictos de eventos de ratón (`mousedown`, `wheel`), desincronización de renderizado y saltos visuales indeseados.

### La Solución Elegante: "Hackear" la Geometría de `OrbitControls`
`OrbitControls` es el controlador más robusto y probado de Three.js. Su funcionamiento nativo orbita la cámara alrededor de un objetivo espacial denominado `controls.target`.

Al manipular matemáticamente la distancia entre la cámara y su `target` reduciéndola a un valor infinitesimal ($r \approx 0.1$), logramos que la traslación orbital se convierta en una **rotación angular pura sobre el eje del observador**, convirtiendo `OrbitControls` en una cámara panorámica de 1.ª persona.

---

## 📐 2. Diagrama de Funcionamiento y Comparación Geométrica

```mermaid
graph TD
    subgraph Vista Global (Órbita Externa de 3ª Persona)
        A[Target en Origen 0,0,0] -->|Radio R = 1500| B[Cámara Externa en R*0.7, R*0.7, R*0.5]
        B -->|Mira hacia adentro| A
    end

    subgraph Vista Local (Cámara de 1ª Persona / Observador)
        C[Target en Observador 0,0,10] -->|Radio r = 0.1| D[Cámara en 0.1, 0, 10]
        D -->|Mira hacia afuera al horizonte| C
    end
```

### Esquema Geométrico en 2D (Vista Superior):

```
VISTA GLOBAL (Tercera Persona):
         [ Cámara ]
             |
             |   (Distancia R = 1500px)
             v
       ( Target 0,0,0 )
      /                \
     |   Objeto 3D      |
      \                /
       ----------------

VISTA LOCAL (Primera Persona interior):
       ----------------
      /   Bóveda       \
     |    Celeste       |
     |                  |
     |   (Cam 0.1,0,10) |
     |        o --->    |  <-- Mira desde adentro hacia la bóveda
     |   (Target 0,0,10)|
      \                /
       ----------------
```

---

## 🧮 3. Demostración Matemática y Fundamento de Rotación

### 3.1. Ecuación Esférica de `OrbitControls`
`OrbitControls` calcula la posición de la cámara en coordenadas esféricas $(\theta, \phi, r)$ tomando como centro el `target` $\vec{T}$:

$$\vec{P}_{\text{cámara}} = \vec{T} + r \begin{pmatrix} \sin\phi \sin\theta \\ \cos\phi \\ \sin\phi \cos\theta \end{pmatrix}$$

Donde:
- $\vec{T}$ es el vector `controls.target`.
- $r = \|\vec{P}_{\text{cámara}} - \vec{T}\|$ es la distancia orbital.
- $\theta$ es el ángulo azimutal.
- $\phi$ es el ángulo de elevación/polar.

### 3.2. Comportamiento en el Límite cuando $r \to 0$
Al fijar $\vec{T} = (0, 0, 10)$ y hacer $r = 0.1$:

$$\lim_{r \to 0.1} \vec{P}_{\text{cámara}}(\theta, \phi) \approx \vec{T}$$

El vector de visión (Look-At) de la cámara por definición apunta desde la cámara hacia el target:

$$\vec{V}_{\text{mirada}} = \frac{\vec{T} - \vec{P}_{\text{cámara}}}{\|\vec{T} - \vec{P}_{\text{cámara}}\|} = -\begin{pmatrix} \sin\phi \sin\theta \\ \cos\phi \\ \sin\phi \cos\theta \end{pmatrix}$$

Como la cámara está situada prácticamente **en el mismo punto espacial que el objetivo**, cualquier cambio en los ángulos $(\theta, \phi)$ provocados por el arrastre del ratón **no mueve físicamente al observador de su lugar**, sino que altera exclusivamente el vector de dirección de su mirada $\vec{V}_{\text{mirada}}$.

### 3.3. Justificación del Signo Negativo en `rotateSpeed`
Al estar situado **dentro** de la esfera y mirar hacia afuera, el vector de mirada está invertido respecto al observador externo. Si se mantuviese la velocidad de rotación positiva por defecto:
- Mover el ratón hacia la izquierda haría girar la vista hacia la derecha.

Al establecer `controls.rotateSpeed = -0.15`, se invierte la derivada angular del ratón:

$$\frac{d\theta}{dx_{\text{mouse}}} < 0$$

Logrando que el arrastre en pantalla coincida perfectamente con el movimiento natural de la cabeza en un entorno $360^\circ$.

---

## 🛠️ 4. Guía de Implementación Código a Código

### Paso 1: Inicialización y Estado de la Escena

En tu clase principal de gestión de escena (ejemplo: `SceneManager.js`):

```javascript
import * as THREE from 'three';
import { OrbitControls } from 'OrbitControls';

export class SceneManager {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        
        // 1. Crear Cámara Perspectiva
        const fov = 45;
        this.camera = new THREE.PerspectiveCamera(
            fov, 
            window.innerWidth / window.innerHeight, 
            0.1,   // NEAR importante: debe ser <= 0.1 para evitar clipping del observador
            10000  // FAR amplio para abarcar la bóveda celeste
        );

        // Posición por defecto en Vista Global (Z-Up)
        const R = 1500;
        this.camera.position.set(R * 0.7, R * 0.7, R * 0.5);

        // 2. Crear OrbitControls
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.1;
        this.controls.enableZoom = false; // Desactivar zoom nativo (lo manejaremos manualmente)
        this.controls.enablePan = false;  // Desactivar desplazamiento para no perder el pivote

        // 3. Variables de Estado de Vista Local
        this.isLocalView = false;
        this.defaultCameraFov = fov;
        this.defaultRotateSpeed = this.controls.rotateSpeed;

        // Buffers Vector3 para preservar la posición al alternar vistas
        this.savedCameraPosition = new THREE.Vector3();
        this.savedControlsTarget = new THREE.Vector3();

        // Listener de Rueda de Ratón
        this.renderer.domElement.addEventListener(
            'wheel', 
            this.onMouseWheel.bind(this), 
            { passive: false }
        );
    }
}
```

---

### Paso 2: Alternar entre Vista Global y Vista Local (`setLocalView`)

Esta función gestiona la transición completa del estado de la cámara:

```javascript
setLocalView(isActive) {
    this.isLocalView = isActive;

    if (isActive) {
        // --- ACTIVAR VISTA LOCAL ---

        // 1. Respaldar la posición y el target de la Vista Global previa
        this.savedCameraPosition.copy(this.camera.position);
        this.savedControlsTarget.copy(this.controls.target);

        // 2. Establecer el Target en la posición exacta del observador sobre el suelo
        // En un sistema Z-Up, Z=10 eleva la vista ligeramente sobre el plano Z=0 del pasto/suelo
        this.controls.target.set(0, 0, 10);

        // 3. Colocar la cámara a un radio de 0.1 del target
        // (Ejemplo: desplazada 0.1 en +X para iniciar mirando hacia el Este/-X)
        this.camera.position.set(0.1, 0, 10);

        // 4. Cambiar a un Campo de Visión (FOV) amplio panorámico
        this.camera.fov = 60;
        this.camera.updateProjectionMatrix();

        // 5. Invertir la velocidad de rotación del ratón para perspectiva de planetario
        this.controls.rotateSpeed = -0.15;

    } else {
        // --- RESTAURAR VISTA GLOBAL ---

        // 1. Restaurar la posición y el target previos guardados
        this.camera.position.copy(this.savedCameraPosition);
        this.controls.target.copy(this.savedControlsTarget);

        // 2. Restaurar FOV original
        this.camera.fov = this.defaultCameraFov;
        this.camera.updateProjectionMatrix();

        // 3. Restaurar velocidad de rotación nativa
        this.controls.rotateSpeed = this.defaultRotateSpeed;
    }

    // Actualizar matriz de controles inmediatamente
    this.controls.update();
}
```

---

### Paso 3: Zoom Telescópico mediante Modificación de FOV

En lugar de mover la posición física de la cámara (lo que destruiría la ubicación del observador en la tierra), en la Vista Local el zoom simula un **telescopio o binoculares** alterando la lente de la cámara (`camera.fov`):

```javascript
onMouseWheel(event) {
    event.preventDefault(); // Evitar scroll de la página web

    if (this.isLocalView) {
        // --- MODO VISTA LOCAL: Zoom por FOV ---
        
        // deltaY > 0 es rueda hacia abajo (alejarse), deltaY < 0 es rueda hacia arriba (acercar)
        let newFov = this.camera.fov + event.deltaY * 0.05;

        // Limitar el FOV entre 1° (máximo zoom telescópico) y 90° (visión panorámica)
        newFov = Math.max(1, Math.min(90, newFov));

        this.camera.fov = newFov;
        this.camera.updateProjectionMatrix();

        // ESCALADO DINÁMICO DE SENSIBILIDAD:
        // Cuanto menor es el FOV (mayor zoom), menor debe ser la sensibilidad del ratón
        // para mantener un control fino al observar astros distantes.
        this.controls.rotateSpeed = -0.15 * (this.camera.fov / 90);

    } else {
        // --- MODO VISTA GLOBAL: Zoom por Distancia Física ---
        // Alterar el radio del vector (camera.position - controls.target)
        const amount = event.deltaY;
        const factor = amount < 0 ? 0.9 : 1.1;
        
        const offset = new THREE.Vector3().copy(this.camera.position).sub(this.controls.target);
        offset.multiplyScalar(factor);
        
        this.camera.position.copy(this.controls.target).add(offset);
    }
}
```

---

### Paso 4: Sistema de Coordenadas, Suelo y Latitud

Para que la experiencia astronómica sea precisa, el plano de la tierra y la bóveda celeste deben interactuar correctamente:

1. **Coordenadas Z-Up**:
   - $Z > 0$: Cenit (arriba).
   - Plano $XY$ ($Z=0$): Plano del horizonte local.
2. **Geometría del Suelo**:
   ```javascript
   const groundGeo = new THREE.CircleGeometry(radius, 64);
   const groundMat = new THREE.MeshLambertMaterial({ color: 0x228B22, side: THREE.DoubleSide });
   const groundMesh = new THREE.Mesh(groundGeo, groundMat);
   groundMesh.position.set(0, 0, 0); // En el plano Z=0
   ```
3. **Inclinación de la Esfera Celeste por Latitud ($\phi$)**:
   La esfera que contiene las estrellas, planeta y ecuador celeste (`skyGroup`) se inclina dinámicamente:
   ```javascript
   function setObserverLatitude(latitudeDegrees) {
       // El eje del polo celeste se inclina (90° - Latitud) respecto al cenit
       const tiltAngleRad = (90 - latitudeDegrees) * (Math.PI / 180);
       this.skyGroup.rotation.x = tiltAngleRad;
   }
   ```

---

### Paso 5: Algoritmo de Seguimiento Automático de Astros ("Seguir Astro")

Cuando el usuario hace clic en un cuerpo celeste (Planeta, Luna, Estrella) para seguirlo con la cámara en Vista Local:

```javascript
updateAstroTracking(followedObject) {
    if (!this.isLocalView || !followedObject) return;

    // 1. Asegurar que las matrices del mundo estén actualizadas
    this.skyGroup.updateMatrixWorld(true);

    // 2. Obtener las coordenadas tridimensionales globales del astro
    const astroWorldPos = new THREE.Vector3();
    
    if (followedObject.isInstancedMesh) {
        // En caso de mallas instanciadas (ej. catálogo de estrellas)
        const matrix = new THREE.Matrix4();
        followedObject.getMatrixAt(followedObject.instanceId, matrix);
        astroWorldPos.setFromMatrixPosition(matrix);
        astroWorldPos.applyMatrix4(followedObject.matrixWorld);
    } else {
        // Para objetos standard MESH / GROUP
        followedObject.getWorldPosition(astroWorldPos);
    }

    // 3. Posición fija del observador
    const targetPos = this.controls.target; // Vector3(0, 0, 10)

    // 4. Calcular el vector unitario de dirección (Observador -> Astro)
    const direction = new THREE.Vector3()
        .subVectors(astroWorldPos, targetPos)
        .normalize();

    // 5. Posicionar la cámara exactamente 0.1 unidades POR DETRÁS del target en esa dirección
    // Esto hace que la mirada de OrbitControls quede perfectamente alineada hacia el astro.
    this.sceneManager.camera.position
        .copy(targetPos)
        .sub(direction.multiplyScalar(0.1));

    // 6. Actualizar OrbitControls
    this.sceneManager.controls.update();
}
```

#### Cancelación por Interacción del Usuario:
Para cancelar el modo de seguimiento automáticamente en cuanto el usuario haga un drag manual con el ratón:

```javascript
this.controls.addEventListener('start', () => {
    if (this.followedTarget) {
        this.followedTarget = null; // Cancela el seguimiento
        console.log("Seguimiento cancelado por interacción manual del usuario.");
    }
});
```

---

## 📊 5. Tabla Comparativa de Parámetros de la Cámara

| Parámetro | Vista Global (3.ª Persona) | Vista Local (1.ª Persona Observador) |
| :--- | :--- | :--- |
| **`controls.target`** | `(0, 0, 0)` (Centro de la escena) | `(0, 0, 10)` (Ojos del observador sobre el suelo) |
| **`camera.position`** | `(1050, 1050, 750)` (Lejos) | `(0.1, 0, 10)` (A distancia $0.1$ del Target) |
| **Radio Orbital ($r$)** | $R \approx 1500 \text{ px}$ | $r = 0.1 \text{ px}$ |
| **`controls.rotateSpeed`** | `0.5` a `1.0` (Positivo) | `-0.15 * (FOV / 90)` (Negativo e Inverso) |
| **`camera.fov`** | $45^\circ$ (Fijo) | Dinámico de $1^\circ$ (Telescopio) a $90^\circ$ (Gran Angular) |
| **`camera.near`** | `0.1` o `1.0` | **Estrictamente $\le 0.1$** (Evita corte de lente) |
| **Comportamiento Zoom** | Traslación vectorial de cámara | Escalado óptico de lente (`camera.fov`) |
| **Seguimiento (Follow)** | Centra el `target` sobre el objeto | Apunta el vector `position -> target` hacia el objeto |

---

## 🚨 6. Trampas Comunes y Soluciones (Troubleshooting)

### 1. El suelo o los astros desaparecen al activar la Vista Local
- **Causa**: El plano de corte cercano (`camera.near`) es demasiado grande (ejemplo: `camera.near = 5`). Como la cámara está a distancia $0.1$ de $(0,0,10)$, la geometría se recorta.
- **Solución**: Asegúrate de que `camera.near` se configure en `0.1` o `0.01` al instanciar la `PerspectiveCamera`.

### 2. El suelo oculta las estrellas que deberían estar sobre el horizonte
- **Causa**: Conflictos de orden de renderizado y prueba de profundidad (*Depth Testing*).
- **Solución**: 
  - Asigna `renderOrder = 2` a la malla del suelo (`groundMesh`).
  - Asegúrate de que el material del suelo tenga `depthWrite = true` y `transparent = false` por defecto para ocluir correctamente los astros que físicamente se encuentran bajo la tierra.

### 3. Los soles o planetas se ven "ovalados" o deformados en los bordes de la pantalla
- **Causa**: Al usar FOV amplios ($60^\circ - 90^\circ$), la proyección perspectiva de Three.js deforma las esferas 3D en los bordes de la pantalla.
- **Solución**: Intercambia dinámicamente las mallas 3D de los astros por `THREE.Sprite` (sprites 2D orientados a cámara) cuando la Vista Local esté activa:
  ```javascript
  setRenderMode(isLocalView) {
      this.mesh.visible = !isLocalView;
      this.sprite.visible = isLocalView;
  }
  ```

---

## ✅ Conclusión

Con este patrón arquitectónico:
1. Reutilizas el 100% de la funcionalidad de `OrbitControls` (damping, suavizado, eventos de ratón/touch).
2. Evitas cargar librerías adicionales de cámara.
3. Permites transiciones instantáneas, matemáticamente exactas e impecables entre la perspectiva espacial global y la perspectiva astronómica desde la superficie terrestre.
