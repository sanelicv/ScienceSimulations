# Guía Definitiva de Implementación y Reutilización del Menú Superior (Top Menu Bar)

Esta guía documenta la arquitectura, estilos CSS, marcado HTML y controladores JavaScript para implementar y reutilizar la barra de menú superior en cualquier aplicación web de forma **100% modular y Plug-and-Play**.

---

## ⚡ Inicio Rápido: Uso del Módulo Co-localizado (`components/MenuBar/`)

Para implementar el menú superior en una **nueva aplicación** en menos de 2 minutos utilizando la carpeta de componente co-localizado:

### 1. Copiar la Carpeta del Componente

Copia la carpeta `components/MenuBar/` a tu nuevo proyecto:
- 🎨 **Estilos CSS**: `components/MenuBar/MenuBar.css`
- ⚡ **Lógica JS**: `components/MenuBar/MenuBarController.js`
- 📄 **Documentación**: `components/MenuBar/MENU_BAR_GUIDE.md`

### 2. Incluir el CSS y el HTML

En el `<head>` de tu `index.html`, vincula la hoja de estilos:
```html
<link rel="stylesheet" href="components/MenuBar/MenuBar.css">
```

Pega la estructura HTML del menú como primer elemento dentro de `<body>`:

```html
<header class="top-menubar">
  <!-- Branding / Logo -->
  <div class="menubar-branding">
    <svg class="app-logo" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.8" fill="none" />
      <ellipse cx="12" cy="12" rx="9" ry="3.5" stroke="currentColor" stroke-width="1.2" fill="none" />
      <circle cx="12" cy="12" r="2.5" fill="currentColor" />
    </svg>
    <span class="app-title">Mi Nueva Aplicación</span>
  </div>

  <!-- Navegación y Desplegables -->
  <nav class="menubar-nav">
    <div class="menu-item">
      <button class="menu-btn">
        <span>Opciones</span>
        <svg class="chevron" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"></polyline></svg>
      </button>
      <div class="dropdown-menu">
        <button class="dropdown-item" id="btnAccion">
          <span>Ejecutar Acción</span>
        </button>
      </div>
    </div>
  </nav>
</header>
```

### 3. Inicializar el Controlador JavaScript

En tu archivo JS principal o script de módulo (ej. `js/main.js`):

```javascript
import { MenuBarController } from '../components/MenuBar/MenuBarController.js';

document.addEventListener('DOMContentLoaded', () => {
  // Instanciar el controlador para activar la interactividad del menú
  const menuBar = new MenuBarController();
  
  // (Opcional) Si tu menú usa un selector diferente a '.top-menubar':
  // const menuBar = new MenuBarController({ containerSelector: '#miHeader' });
});
```

---

## 📐 Patrón de Maquetación Recomendado (Non-Overlapping Layout)

> [!TIP]
> **Recomendación de Diseño**: Para garantizar que la barra de menú ocupe sus **48px fijos** en la parte superior y que el contenedor principal de tu aplicación (o lienzo Three.js / WebGL) ocupe exactamente el espacio vertical restante **sin solaparse ni tapar elementos**, utiliza la siguiente estructura CSS Flexbox en columna:

```css
/* 1. Estructurar el body como contenedor Flexbox vertical */
body, html {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column; /* Apila el menú arriba y el lienzo abajo */
}

/* 2. El menú superior toma 48px fijos (definidos en MenuBar.css) */
header.top-menubar {
  height: 48px;
  flex-shrink: 0;
}

/* 3. El contenedor de la app / canvas 3D toma todo el alto restante */
#canvas-container, .main-app-content {
  width: 100%;
  flex: 1;
  position: relative;
  overflow: hidden;
}
```

---

## 🛠️ Detalle Técnico de los Archivos Módulo

### A. El Archivo CSS (`components/MenuBar/MenuBar.css`)

El archivo `MenuBar.css` incluye todas las definiciones necesarias en un solo bloque:

1. **Variables `:root` Incluidas**:
```css
:root {
  --bg-page: #060911;
  --menubar-bg: rgba(15, 23, 42, 0.88);
  --menubar-border: rgba(255, 255, 255, 0.1);
  --dropdown-bg: #0f172a;
  --dropdown-border: rgba(255, 255, 255, 0.15);
  --card-bg: rgba(30, 41, 59, 0.7);
  --text-primary: #f8fafc;
  --text-secondary: #cbd5e1;
  --text-muted: #94a3b8;
  --accent-primary: #38bdf8;
  --accent-danger: #ef4444;
  --shadow-sm: 0 4px 12px rgba(0, 0, 0, 0.3);
  --shadow-md: 0 20px 40px rgba(0, 0, 0, 0.5);
}
```

2. **Resets Tipográficos Aislados**:
```css
.top-menubar,
.top-menubar * {
  box-sizing: border-box;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  -webkit-font-smoothing: antialiased;
}
```

---

### B. El Controlador JavaScript (`components/MenuBar/MenuBarController.js`)

El archivo `MenuBarController.js` exporta la clase `MenuBarController` con los siguientes comportamientos integrados:

- **Toggle de Desplegables**: Al hacer clic en un `.menu-btn`, alterna la clase `.active` en su `.menu-item` padre y cierra cualquier otro desplegable abierto.
- **Detención de Propagación**: Los clics dentro de `.dropdown-menu` no cierran el menú accidentalmente.
- **Cierre por Clic Externo**: Cualquier clic fuera del encabezado cierra automáticamente todos los desplegables.
- **Cierre por Tecla Escape**: Escucha la tecla `Escape` a nivel global para cerrar menús abiertos.
- **API Pública**: Método `closeAllDropdowns()` para cerrar los menús programáticamente desde otros componentes de tu app.
