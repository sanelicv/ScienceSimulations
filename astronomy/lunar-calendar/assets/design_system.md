# Guía de Estilo y Sistema de Diseño (Design System)

Este documento detalla el estilo visual, paleta de colores, tipografía y la estructura de componentes utilizados en la aplicación "Dados Cósmicos - Parallel Earth". Su objetivo es servir como base para mantener la coherencia estética en otras aplicaciones desarrolladas.

## 1. Concepto y Estética General
La aplicación utiliza una estética **Dark Mode / Espacial Moderna**. Se caracteriza por:
- Colores de fondo profundos y oscuros para simular el espacio.
- Colores de acento brillantes pero elegantes (con opacidades controladas) para crear un efecto de "resplandor" (glow) estilo neón/holográfico.
- Transiciones suaves y sutiles interacciones de hover.
- Elementos minimalistas con bordes finos y limpios.

## 2. Paleta de Colores (Variables CSS)

```css
:root {
    /* Fondos */
    --bg-color: #0d0d0f; /* Fondo principal de la app (Casi negro) */
    --surface-color: #1a1a1f; /* Fondo de tarjetas o paneles */
    --surface-color-hover: #23232a; /* Fondo en hover para elementos interactivos */
    
    /* Textos */
    --text-primary: #f0f0f5; /* Texto principal (Casi blanco) */
    --text-secondary: #a0a0ab; /* Texto secundario, descripciones y subtítulos (Gris plata) */
    
    /* Bordes */
    --border-color: #2a2a35; /* Color sutil para separar tarjetas y paneles */

    /* Colores de Acento (Elegantes y apagados) */
    --accent-blue: #4a88cc; /* Color principal para botones y resaltados */
    --accent-blue-hover: #5b9ce0; /* Azul ligeramente más claro para hover */
    
    /* Estados y Similitudes */
    --similarity-high: #4acc88; /* Verde para éxito / alta similitud */
    --similarity-med: #ccaa4a; /* Amarillo/Dorado para advertencia / similitud media */
    --similarity-low: #cc4a4a; /* Rojo para error / baja similitud / peligro */
}
```

## 3. Tipografía
- **Familia principal:** `'Inter', sans-serif`
- **Pesos utilizados:** 
  - `300` (Light) - Para títulos, subtítulos e información secundaria.
  - `400` (Regular) - Para cuerpo de texto y valores.
  - `500` (Medium) - Para botones y etiquetas destacadas.
  - `600` (Semi-bold) - Para información muy destacada (ej. contador de velocidad).

### Aspectos Especiales:
- **Títulos (`h1`):** Usan un peso muy ligero (`300`) y un estilo de gradiente metálico para que resalte sutilmente:
  ```css
  background: linear-gradient(135deg, #ffffff 0%, #a0a0ab 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  ```
- **Monospace:** Algunos elementos visualizan datos numéricos (como los contadores o información de las barras) utilizando familias `monospace` (`font-family: var(--font-mono);` o fallback directo) para un look más técnico o de panel de control.

## 4. Estructura y Layout (Grilla y Espaciado)
- **Container Principal:** `max-width: 1200px` centrado con padding (`2rem 1rem`).
- **Cards/Grillas:** Para visualización de muchos elementos, se usa CSS Grid adaptativo:
  ```css
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
  ```
- **Variables Globales Visuales:**
  - `--border-radius: 8px;` (Esquinas ligeramente redondeadas en toda la UI).
  - `--transition-speed: 0.3s;` (Transiciones fluidas predeterminadas).

## 5. UI Components

### 5.1 Botones (`.btn`)
- **Estilo Base:** Padding de `0.75rem 1.5rem`, letra con peso `500`, y borde redondeado (`8px`). Outline oculto temporalmente y transición en todas las propiedades.
- **Botón Primario:** Fondo `--accent-blue`, texto blanco. 
  - *Hover:* Sombra suave tipo brillo: `box-shadow: 0 4px 12px rgba(74, 136, 204, 0.3)`.
- **Botón Secundario:** Transparente con borde de 1px usando `--border-color`.
  - *Hover:* Fondo rgba sutil `rgba(255, 255, 255, 0.05)`.
- **Botón "Deshabilitado":** Tienen opacidad reducida (`opacity: 0.5`) y `cursor: not-allowed`.

### 5.2 Tarjetas (Cards)
Características de las tarjetas que muestran información (como `.parameter-card`):
- **Bordes y fondo:** Utilizan `--surface-color` para el fondo y un borde fino de `--border-color`.
- **Micro-interacciones:** Escala sutil. `transform: scale(0.98)` inactivo a `transform: scale(1)` al activarse.
- **Estado Activo/Seleccionado:** Ganan un resplandor azul con:
  - Borde: `rgba(74, 136, 204, 0.5)`
  - Sombra: `box-shadow: 0 4px 20px rgba(74, 136, 204, 0.15)`
  - Fondo ligeramente más oscuro: `rgba(26, 26, 31, 0.95)`

### 5.3 Controles de Panel (Inputs range & toggles)
- **Sliders (`input[type="range"]`):** 
  - Track de `6px` de alto color `--bg-color` y con borde `--border-color`.
  - Thumb (El círculo de arrastre) color `--accent-blue` de `18x18px` con ligera sombra para darle pop visual: `box-shadow: 0 0 10px rgba(74, 136, 204, 0.5)`. Crece un `scale(1.2)` al hacer *hover*.
- **Tooltips:** Fondos tipo pizarra (Gris oscuro `#2a2a35`), con flecha CSS (mediante `::after` usando `border-style: solid`) posicionada con precisión mediante márgenes negativos y sombreado suave.

### 5.4 Elementos Gráficos y Animaciones
- **Controles circulares SVG (Gráficos Gauge):** Emplean un trazo base con color `--bg-color` y se rellenan animando el atributo `stroke-dasharray`.
- **Efectos de resplandor:** Las secciones importantes emplean radiantes inversos. Por ejemplo: `radial-gradient(circle at center, #1a1a24 0%, #0d0d0f 100%)` para enfocar la vista al centro de paneles importantes.

---

**Instrucción para Agente IA:** 
*Cuando generes código nuevo que siga este estilo, apégate estrictamente al uso de las variables CSS arriba declaradas. Evita los marcos de trabajo pesados (frameworks como Tailwind o Bootstrap). Prefiere Vanilla CSS bien estructurado usando Grid, Flexbox y manteniendo las jerarquías de colores de esta guía.*
