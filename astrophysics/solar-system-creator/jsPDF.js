async function generarPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  const grupo = document.getElementById("groupSelect").value;

  //const notaFinal = Math.max(0, (notaBase - penalizacion).toFixed(2));
  const notaFinal = totalScore;

  // Variables para manejar líneas
  let y = 50;
  const step = 6;

  // Función auxiliar en inglés
  function writeLine(text) {
    doc.text(text, 20, y);
    y += step;
  }

  // Cargar logo JPG
  const img = new Image();
  img.src = "logo.jpg"; // coloca tu logo en la misma carpeta
  img.onload = function() {
    // Insertar logo
    doc.addImage(img, "JPG", 15, 10, 50, 25);

    // Texto de cabecera
    doc.setFontSize(18);
    doc.text("Universidad del Pacífico", 92, 20);
    doc.setFontSize(14);
    doc.text("Introducción a la Cosmología y la Ciencia de la Vida", 70, 30);

    // Línea divisoria
    doc.setLineWidth(0.5);
    doc.line(15, 35, 195, 35);

    doc.rect(150, 50, 30, 30);
    doc.setFontSize(32);
    drawCenteredText(doc, `${notaFinal.toFixed(2)}`, 150+15, 62.5);

    // Datos del estudiante
    doc.setFontSize(12);
    writeLine(`Número de grupo: ${grupo}`);
    writeLine(`Nota final: ${notaFinal.toFixed(2)}`);

    // Fecha y hora automática
    const ahora = new Date();
    const fecha = ahora.toLocaleDateString();
    const hora = ahora.toLocaleTimeString();
    writeLine(`Fecha de emisión: ${fecha}`);
    writeLine(`Hora de emisión: ${hora}`);

    // Pie de página
    doc.setFontSize(10);
    doc.text("Introducción a la Cosmología y la Ciencia de la Vida", 20, 280);

    // Guardar PDF
    doc.save(`resultado_${grupo}.pdf`);
  };
}

function drawCenteredText(doc, text, x, y) {
  // Ancho del texto
  const textWidth = doc.getTextWidth(text);

  // Altura de la línea en unidades del PDF
  const fontSize = doc.internal.getFontSize();
  const lineHeight = fontSize / doc.internal.scaleFactor;

  // Calcular coordenadas para centrar en (x, y)
  const centeredX = x - (textWidth / 2);
  const centeredY = y + (lineHeight / 2);

  doc.text(text, centeredX, centeredY);
}

