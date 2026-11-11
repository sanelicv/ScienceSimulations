function drawSubscript(p, base, baseFontSize, sub, subFontSize, x, y) {
  p.push();
  p.textAlign(p.LEFT, p.BASELINE);
  p.textSize(baseFontSize);
  p.text(base, x, y);
  const w = p.textWidth(base);
  p.textSize(subFontSize); // smaller for subscript
  p.text(sub, x + w + 2, y + 6); // adjust subscript position
  p.pop();
}
