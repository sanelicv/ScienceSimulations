# Guía Definitiva de Implementación y Reutilización del Menú Superior (Top Menu Bar)

Esta guía documenta la arquitectura, estilos CSS, marcado HTML y controladores JavaScript de la barra de menú superior.

> **Adaptada a la simulación:** es un script clásico, sin fuentes externas, para que la app funcione con doble clic en `index.html` y sin internet. La barra flota sobre el lienzo, que ocupa toda la ventana.

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

Carga el script antes del tuyo. No uses `type="module"`: los navegadores bloquean los módulos en `file://`.

```html
<script src="lib/MenuBar/MenuBarController.js"></script>
<script>
  const menuBar = new MenuBarController();
  // Si tu menú usa otro selector:
  // const menuBar = new MenuBarController({ containerSelector: '#miHeader' });
</script>
```

---

## 📐 Maquetación

La barra usa `position: fixed` y flota sobre el contenido, con 48px de alto. El contenedor del lienzo puede ocupar toda la ventana con `position: fixed; inset: 0`.

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
- **Cambio con el cursor**: Con un menú abierto, pasar el cursor sobre otro botón cambia de menú.
- **Acciones y casillas**: Un `.dropdown-item` cierra el menú; un `.dropdown-checkbox` lo deja abierto.
- **Cierre por pulsación externa**: Pulsar fuera del encabezado cierra los desplegables, también sobre un lienzo con controles de cámara.
- **Teclado**: Flechas para moverse entre menús y opciones; `Escape` cierra y devuelve el foco al botón.
- **API Pública**: Método `closeAllDropdowns()` para cerrar los menús desde otros componentes de tu app.
