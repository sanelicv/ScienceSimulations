/* ==================================================================
 *  SUPER-KAMIOKANDE: ajustes a mano
 *  Cambia un valor, guarda y recarga la página (F5).
 *  Los tamaños de texto y botones están en píxeles.
 * ================================================================== */
const CONFIG = {
  // Multiplica todos los textos a la vez (por ejemplo, 1.3 para proyectar en un aula).
  escalaGeneral: 1,

  // Multiplica el tamaño del logo en todas las pantallas (por ejemplo, 1.2 para agrandarlo un 20 %).
  escalaLogo: 1,

  // true: el logo se ve en blanco, como pide el estilo. false: con sus colores originales.
  logoEnBlanco: true,

  // Cómo se marca un fotomultiplicador que recibió luz (siempre con el color del tiempo de llegada):
  //   'tamano' : el fotomultiplicador crece según cuánta luz recibió (como en los event displays de Super-K)
  //   'barras' : sale una barra hacia el centro del tanque; su altura indica cuánta luz recibió
  marcaPMT: 'tamano',

  // Altura de la barra más alta, en metros, si marcaPMT es 'barras'. El tanque mide 33.8 m de diámetro.
  alturaMaximaBarras: 3,

  // Roca de la caverna translúcida en "Nuevo evento": true para activarla, false para dejarla opaca.
  // En el tour guiado siempre es translúcida.
  rocaTranslucidaEnEvento: true,

  // Opacidad de la roca cuando es translúcida: 1 = opaca, 0 = invisible.
  rocaOpacidadCaverna: 0.7,   // paredes de la caverna donde está el tanque
  rocaOpacidadMontana: 0.5,   // la montaña, en el primer paso del tour

  // Vista desplegada del tanque (techo, pared y fondo abiertos como un mapa).
  // Siempre aparece en el último paso del tour. true: también al terminar cada "Nuevo evento".
  vistaDesplegadaEnEvento: false,

  fontSizes: {
    // Laptops y computadoras: pantallas de más de 1100 px de ancho
    escritorio: {
      botones: 13.5,         // "Nuevo evento", "Tour guiado"
      teclaBoton: 10.5,      // letra del atajo dentro de cada botón
      narracion: 20,         // descripciones del tour guiado
      etiqueta: 15,          // "luz Cherenkov"
      etiquetaPequena: 12.5, // "choque", "Monte Ikeno"
      etiquetaGrande: 19,    // "νμ", "μ", "e"
      leyenda: 13,           // leyenda de color y tamaño
      idioma: 12,            // selector ES/EN
    },

    // Tablets y laptops pequeñas: hasta 1100 px de ancho, o cualquier pantalla táctil más grande
    tablet: {
      botones: 13.5,
      teclaBoton: 10.5,
      narracion: 18,
      etiqueta: 15,
      etiquetaPequena: 12.5,
      etiquetaGrande: 19,
      leyenda: 13,
      idioma: 12,
    },

    // Celulares: hasta 700 px de ancho o, en horizontal, hasta 500 px de alto
    celular: {
      botones: 12,
      teclaBoton: 10.5,
      narracion: 15,
      etiqueta: 14,
      etiquetaPequena: 12,
      etiquetaGrande: 18,
      leyenda: 11,
      idioma: 12,
    },
  },

  // Tamaños del logo, los botones y la vista desplegada, en píxeles, con las mismas tres pantallas.
  // En pantallas táctiles conviene no bajar de 44: es el mínimo cómodo para el dedo.
  botones: {
    // Laptops y computadoras
    escritorio: {
      logoAncho: 100,        // ancho del logo de Super-K (el alto se ajusta solo)
      menuAncho: 120,        // ancho de "Nuevo evento" y "Tour guiado"
      menuAlto: 32,          // alto de esos botones
      pantallaCompleta: 38,  // icono de la esquina (es cuadrado)
      flechas: 40,           // flechas del tour guiado (son cuadradas)
      idiomaAlto: 38,        // alto del selector ES/EN
      vistaDesplegada: 240,  // ancho de la vista desplegada del tanque
    },

    // Tablets y laptops pequeñas
    tablet: {
      logoAncho: 100,
      menuAncho: 120,
      menuAlto: 44,
      pantallaCompleta: 44,
      flechas: 44,
      idiomaAlto: 44,
      vistaDesplegada: 210,
    },

    // Celulares
    celular: {
      logoAncho: 70,
      menuAncho: 100,
      menuAlto: 30,
      pantallaCompleta: 44,
      flechas: 44,
      idiomaAlto: 44,
      vistaDesplegada: 140,
    },
  },
};
