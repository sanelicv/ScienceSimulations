# Guía de Implementación: Cámara de Observador Fijo (Three.js)

Esta guía explica paso a paso cómo implementar un sistema de cámara diseñado específicamente para simulaciones inmersivas desde un punto fijo (por ejemplo, un observador en la Tierra mirando al cielo estrellado), replicando el comportamiento core del proyecto "miniStellarium".

A diferencia de una cámara 3D tradicional que "vuela" por el espacio, este patrón mantiene la cámara estática, rota la dirección visual y hace zoom óptico modificando el Campo de Visión (FOV).

---

## 1. Concepto Core

- **Posición Fija**: La cámara no se desplaza en el espacio 3D (traslación cero).
- **Esfera Celeste**: Todos los objetos lejanos (estrellas, cuadrículas) se proyectan sobre una gran esfera circundante.
- **Paneo Invertido**: Al arrastrar el ratón, se da la ilusión de "arrastrar el cielo" o rotar sobre uno mismo, en lugar de orbitar un objeto central.
- **Zoom Óptico (FOV)**: El acercamiento no mueve la cámara hacia adelante en el eje Z, sino que reduce el FOV, funcionando como el objetivo de un telescopio o cámara fotográfica real.

---

## 2. Configuración de la Escena y la Cámara

La cámara debe estar instanciada en o muy cerca del origen. Evitamos usar exactamente `(0, 0, 0)` si usamos `OrbitControls`, para que los controles (cuyo objetivo o *target* por defecto es `0,0,0`) tengan un vector de dirección inicial válido.

```javascript
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// 1. Instanciar la cámara
// FOV Inicial recomendado: 60 | Rango de clipping: 0.1 a 2000
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 2000);

// 2. Colocarla ligeramente desplazada del origen (0,0,0) para que OrbitControls tenga dirección.
// ¡ATENCIÓN! Este offset DEBE aplicarse en un eje Ortogonal al Vector `up` de tu cámara.
// - Si tu cámara tiene up = (0, 1, 0) [Por defecto], desplaza en el Eje X o Z. Ejemplo:
camera.position.set(0.1, 0, 0); 
// - Si tu cámara tiene up = (0, 0, 1) [Eje Z arriba], desplaza en el Eje X o Y. Ejemplo:
// camera.position.set(0, 0.1, 0);
```

---

## 3. Configuración de Controles (OrbitControls modificado)

Utilizaremos `OrbitControls` pero anularemos completamente su capacidad de mover o acercar la cámara espacialmente. Solo lo usaremos para manejar la rotación matemática eficientemente y con inercia (damping) si se desea.

```javascript
// El domElement suele ser renderer.domElement
const controls = new OrbitControls(camera, renderer.domElement);

// Desactivar traslación geométrica
controls.enablePan = false;   // No permite movimiento lateral (X, Y)
controls.enableZoom = false;  // Desactiva el zoom por defecto (movimiento en Z)

// Invertir controles para dar la sensación de manipular la "Bóveda Celeste"
controls.rotateSpeed = -0.15; // Un valor negativo invierte el arrastre del mouse
```

---

## 4. Implementación del Zoom Personalizado (Modificando FOV)

Dado que `controls.enableZoom` se estableció en falso, capturaremos el evento de `wheel` de la rueda del ratón o el scroll del pad táctil de forma manual para modificar exclusivamente el FOV de la cámara.

Además, cuando hacemos mucho zoom (FOV muy bajo), los movimientos del ratón abarcan menos grados del cielo, por lo que la cámara se vuelve exageradamente sensible. Escalar dinámicamente la velocidad de rotación de los controles (`rotateSpeed`) en función del nivel de zoom mantiene un paneo fluido y controlable independientemente del acercamiento.

```javascript
// Rango permitido para el zoom 
// (1 grado = telescopio potente, 90 grados = visión humana normal/amplia)
const minFov = 1; 
const maxFov = 90;

window.addEventListener('wheel', (event) => {
    // 1. Calcular el nuevo FOV basado en la dirección del scroll
    // event.deltaY positivo = alejar, negativo = acercar
    let newFov = camera.fov + event.deltaY * 0.05;
    
    // 2. Limitar el FOV a los rangos permitidos (clamping)
    newFov = Math.max(minFov, Math.min(maxFov, newFov));
    
    // 3. Aplicar el FOV a la cámara
    camera.fov = newFov;
    camera.updateProjectionMatrix(); // OBLIGATORIO siempre que se cambia el FOV o el Aspect Ratio
    
    // 4. Ajustar la sensibilidad de rotación (rotación más suave y lenta con mayor zoom)
    controls.rotateSpeed = -0.15 * (camera.fov / maxFov);
    
    // 5. Opcional: Actualizar Uniforms en Shaders si usas THREE.Points (Ver Sección 5)
    // if (starsMaterial) starsMaterial.uniforms.uFov.value = camera.fov;
});
```

---

## 5. El Comportamiento Visual del Zoom según el Tipo de Objeto Geometry vs Points

Cómo reaccionan los astros al `zoom por FOV` depende enteramente de **cómo** se estén renderizando en Three.js. Existen dos escenarios principales:

### Escenario A: Los Astros son Geometrías 3D (THREE.Mesh con CircleGeometry / SphereGeometry)

Si tu aplicación en lugar de usar nubes de puntos (`THREE.Points`) decidió usar simples círculos poligonales (`THREE.Mesh` + `THREE.CircleGeometry`) o esferitas (`THREE.SphereGeometry`) esparcidas por la esfera celeste:

> **¡El Zoom óptico funcionará mágicamente sin que tengas que programar nada extra!**

No necesitas multiplicar proporcionalmente sus radios por código cuando el usuario hace scroll. Como son geometrías reales dentro del mundo 3D, están sujetas a la Matriz de Proyección (`Projection Matrix`) de la cámara. Al reducir el campo de visión (FOV), la matriz de proyección magnifica automáticamente la región central, haciendo que las geometrías ocupen más píxeles en pantalla como lo haría un objeto visto a través un telescopio real.

**Conclusión para Escenario A:** No necesitas modificar sus radios al hacer *scroll*. El motor 3D lo hace implícitamente alterando la proyección.

### Escenario B: Los Astros son Píxeles (THREE.Points y Custom Shaders)

A diferencia de las geometrías reales, los vértices renderizados dentro de un componente `THREE.Points` se dibujan usando `gl_PointSize` (un tamaño fijo en los píxeles de la pantalla, ej. si el radio es de 5 píxeles, siempre medirá 5 píxeles).

El FOV **NO** altera el tamaño en pantalla del `gl_PointSize` de forma nativa en la mayoría de los vertex shaders comunes. Si haces "zoom" reduciendo el FOV, el espacio visual entre una estrella y otra se acercará, pero el tamaño del puntito seguirá igual, arruinando totalmente la ilusión óptica inmersiva. 

Aquí sí es imperativo calcular "el aumento" manualmente dentro del shader enviando el último FOV.

#### Paso 1: Definir el Uniform
```javascript
const material = new THREE.ShaderMaterial({
    uniforms: {
        uFov: { value: camera.fov }, // Actualízalo cada vez que dispares la ruleta del ratón
    },
    // ...
});
```

#### Paso 2: Escalar proporciones en el Vertex Shader
En el Vertex Shader (GLSL), debes obtener la relación inversamente proporcional del aumento del campo visual:

```glsl
uniform float uFov;
attribute float size; // El tamaño base (magnitud del astro)

void main() {
    vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 ); 
    gl_Position = projectionMatrix * mvPosition;
    
    // Factor de distancia normal
    float distanceFactor = 300.0 / -mvPosition.z; 
    
    // FACTOR DE FOV (ESCALADO MANUAl)
    // Si mi campo visual inicial base era 60 y el usuario hizo zoom hasta 30,
    // ( 60.0 / 30.0 ) = 2.0 -> el astro dibujará sus pixeles nativos al DOBLE de escala.
    float fovFactor = 60.0 / uFov; 
    
    gl_PointSize = size * distanceFactor * fovFactor; 
}
```

---

## 6. Instrucciones Resumidas para un Agente IA

Si te solicitan implementar "la cámara tipo Stellarium" en un nuevo proyecto:

1. **Instancia** la cámara en `(0.1, 0, 0)` o cercano al centro. Impide traslaciones.
2. **Configura** `OrbitControls` deshabilitando `enablePan` y `enableZoom`. `rotateSpeed` en -0.15 para simular paneo inmersivo de bóveda.
3. **Maneja** el scroll / zoom atrapando globalmente la señal `wheel`. Modifica exclusivamente `camera.fov` (entre 1 y 90) mandando un respectivo `updateProjectionMatrix()`.
4. **Acopla** la inercia del ratón reduciendo iterativamente el mismo parámetro de sensitividad `controls.rotateSpeed` en sintonía fraccionaria con la limitación de visualización `camera.fov / maxFov`.
5. **Decide comportamiento de aumento (Aumento Óptico):**
   - *¿Son astros poligonales (`THREE.Mesh`/`Sprite`)?* No hagas nada, la transformación matricial escala tus geometrías ante cualquier cambio de FOV automáticamente y su aspecto será preciso.
   - *¿Son partículas (`THREE.Points`)?* Inyecta el último `camera.fov` en los uniforms shader actualizando reactivamente la variable `gl_PointSize` mediante la fórmula: `(fovNormalizado / FOV_actual)`.
