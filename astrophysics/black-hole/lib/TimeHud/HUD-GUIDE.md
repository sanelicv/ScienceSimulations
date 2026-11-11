# Guía del Time HUD (`TimeHudController`)

Botón flotante para pausar y continuar una simulación, centrado abajo en la ventana.

> **Adaptado a esta app:** es un script clásico, para que funcione con doble clic en `index.html`. Solo tiene pausa y continuar; se quitaron los deslizadores de velocidad y de día.

## Integración

```html
<link rel="stylesheet" href="lib/TimeHud/TimeHud.css">
<script src="lib/TimeHud/TimeHudController.js"></script>
```

No usa `type="module"`, porque los navegadores bloquean los módulos en `file://`. El controlador crea su propio HTML.

```javascript
const hud = new TimeHudController({
  onPlayChange: (isPlaying) => { simulacion.pausada = !isPlaying; },
});
```

## Opciones

| Opción | Tipo | Por defecto | Descripción |
| :--- | :--- | :--- | :--- |
| `container` | `string \| HTMLElement` | `'body'` | Dónde se inserta el HUD. |
| `autoPlay` | `boolean` | `true` | Iniciar reproduciendo. |
| `enableKeyboard` | `boolean` | `true` | Usar la barra espaciadora como atajo. |
| `onPlayChange` | `Function` | `null` | `(isPlaying) => {}`. Se llama solo cuando el estado cambia, no al crear el HUD. |

## Métodos

- `togglePlay()`: alterna entre pausar y continuar.
- `setPlaying(isPlaying)`: fija el estado.
- `destroy()`: quita el HUD y su atajo de teclado.

La propiedad `isPlaying` da el estado actual.

## Barra espaciadora

Alterna la pausa, salvo si el foco está en un botón, casilla, campo de texto, lista o enlace, donde el Espacio conserva su función normal. Sobre un deslizador sí funciona, porque ahí el Espacio no hace nada.

## Colores

Se cambian con las variables de `:root` en `TimeHud.css`: `--hud-accent` para el estado normal y `--hud-paused` para la pausa.
