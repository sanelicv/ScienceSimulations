/* ==================================================================
 *  TAMBO: ajustes de los textos
 *  Cambia un número, guarda y recarga la página (F5).
 *  Todos los tamaños están en píxeles.
 * ================================================================== */
const CONFIG = {
  // Multiplica todos los textos a la vez (por ejemplo, 1.3 para proyectar en un aula).
  escalaGeneral: 1,

  // Multiplica el tamaño del logo en todas las pantallas (por ejemplo, 1.2 para agrandarlo un 20 %).
  escalaLogo: 1,

  // Roca translúcida en "Nuevo evento": true para activarla, false para dejarla opaca.
  // En el tour guiado siempre es translúcida.
  rocaTranslucidaEnEvento: true,

  // Opacidad de la roca cuando es translúcida: 1 = opaca, 0 = invisible.
  // Cada montaña por separado: la que atraviesa el neutrino y la de los detectores.
  rocaOpacidadOrigen: 0.5,
  rocaOpacidadDetectores: 1,

  fontSizes: {
    // Laptops y computadoras: pantallas de más de 1100 px de ancho
    escritorio: {
      botones: 13.5,         // "Nuevo evento", "Tour guiado"
      teclaBoton: 10.5,      // letra del atajo dentro de cada botón
      narracion: 20,         // descripciones del tour guiado
      etiqueta: 15,          // "cascada de partículas"
      etiquetaPequena: 12.5, // "Río", "choque", "decae"
      etiquetaGrande: 19,    // "ντ" y "τ"
      leyenda: 13,           // leyenda de color y altura
      idioma: 12,            // selector ES/EN
    },

    // Tablets y laptops pequeñas: hasta 1100 px de ancho, o cualquier pantalla táctil más grande
    tablet: {
      botones: 13.5,         // "Nuevo evento", "Tour guiado"
      teclaBoton: 10.5,      // letra del atajo dentro de cada botón
      narracion: 18,         // descripciones del tour guiado
      etiqueta: 15,          // "cascada de partículas"
      etiquetaPequena: 12.5, // "Río", "choque", "decae"
      etiquetaGrande: 19,    // "ντ" y "τ"
      leyenda: 13,           // leyenda de color y altura
      idioma: 12,            // selector ES/EN
    },

    // Celulares: hasta 700 px de ancho o, en horizontal, hasta 500 px de alto
    celular: {
      botones: 12,         // "Nuevo evento", "Tour guiado"
      teclaBoton: 10.5,      // letra del atajo dentro de cada botón
      narracion: 15,         // descripciones del tour guiado
      etiqueta: 15,          // "cascada de partículas"
      etiquetaPequena: 12.5, // "Río", "choque", "decae"
      etiquetaGrande: 19,    // "ντ" y "τ"
      leyenda: 11,           // leyenda de color y altura
      idioma: 12,            // selector ES/EN
    },
  },

  // Tamaños del logo y los botones, en píxeles, con las mismas tres pantallas.
  // En pantallas táctiles conviene no bajar de 44: es el mínimo cómodo para el dedo.
  botones: {
    // Laptops y computadoras
    escritorio: {
      logoAncho: 100,        // ancho del logo de TAMBO (el alto se ajusta solo)
      menuAncho: 120,        // ancho de "Nuevo evento" y "Tour guiado"
      menuAlto: 32,          // alto de esos botones
      pantallaCompleta: 38,  // icono de la esquina (es cuadrado)
      flechas: 40,           // flechas del tour guiado (son cuadradas)
      idiomaAlto: 38,        // alto del selector ES/EN
    },

    // Tablets y laptops pequeñas
    tablet: {
      logoAncho: 110,        // ancho del logo de TAMBO (el alto se ajusta solo)
      menuAncho: 120,        // ancho de "Nuevo evento" y "Tour guiado"
      menuAlto: 44,          // alto de esos botones
      pantallaCompleta: 44,  // icono de la esquina (es cuadrado)
      flechas: 44,           // flechas del tour guiado (son cuadradas)
      idiomaAlto: 44,        // alto del selector ES/EN
    },

    // Celulares
    celular: {
      logoAncho: 80,        // ancho del logo de TAMBO (el alto se ajusta solo)
      menuAncho: 100,        // ancho de "Nuevo evento" y "Tour guiado"
      menuAlto: 30,          // alto de esos botones
      pantallaCompleta: 44,  // icono de la esquina (es cuadrado)
      flechas: 44,           // flechas del tour guiado (son cuadradas)
      idiomaAlto: 44,        // alto del selector ES/EN
    },
  },
};
