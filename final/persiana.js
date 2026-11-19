// Intro: persiana de local grafiteada, con dos LED cálidos arriba del todo que apuntan al logo: titilan dos veces y sube.
// Todo se dibuja en un canvas (sin imágenes pesadas): chapa, afiches, tags, stickers, aerosol y el logo como pieza central.
// Estilo tomado de Referencias/persiana/grafitis: sticker-bombing encimado, tags finos de marcador por todos lados,
// afiches arrancados, un trazo grande de aerosol y alguna pieza wildstyle. Todo apagado: el logo es el protagonista.

const TAGS = ['98', 'OESTE', 'SURF', 'SALT', 'OLA', 'WAX', 'LOCALS', '1998', 'SOL', 'MAREA', 'DROP', 'BRISA', 'ARENA', 'SWELL',
  'REEF', 'DUNA', 'TIBU', 'ESPUMA', 'NOMAD', 'FLOW', 'RAYO', 'CREW', 'OKAY', 'LOBO', 'ZONA'];
const FUENTES = ['Sedgwick Ave Display', 'Rubik Wet Paint', 'Permanent Marker', 'Rock Salt', 'Rubik Bubbles', 'Rubik Spray Paint'];
const MARCADOR = ['Permanent Marker', 'Rock Salt', 'Sedgwick Ave Display'];
// Colores apagados: los grafitis acompañan, el logo es el protagonista
const PINTURAS = ['#d9d4c7', '#9aa0a6', '#c98a5a', '#b9a35c', '#6f8f95', '#a46a6a', '#e6e2d8', '#7d7f86'];
// Stickers: la paleta de la pared de referencia (rojo, naranja, amarillo, azul, turquesa) pero gastada
const PAPEL = '#e6e2d8';
const STICKER_COLORES = ['#e6e2d8', '#e6e2d8', '#0d0d0f', '#0d0d0f', '#b4584c', '#c47a4a', '#c9ad5a', '#4b6a8f', '#5f9a9e', '#b07a8a'];
const STICKER_TEXTOS = [
  ['OESTE'], ['SURF', 'CLUB'], ['LOCALS', 'ONLY'], ['VERANO', '98'], ['HECHO EN', 'LA COSTA'], ['NO WAVE', 'NO FUN'],
  ['SALT &', 'SUN'], ['MAREA', 'ALTA'], ['OFF', 'SHORE'], ['DROP IN'], ['WAX ON'], ['BOARD', 'RIDERS'], ['SWELL', 'REPORT'],
  ['CLUB DE', 'PLAYA'], ['RIDE', 'FREE'], ['KEEP', 'SURFING'], ['WIPE', 'OUT'], ['FLAT', 'DAY'], ['ZONA', 'SUR'], ['TIDE'],
  ['OLAS', 'CREW'], ['SOL Y', 'SAL'], ['1998'], ['HLGM'], ['REEF', 'BREAK'],
];
const CORTOS = ['98', 'SOL', 'OLA', 'SAL', 'ZO', 'SURF', '1998', 'WAX', 'TIDE'];

// azar con semilla fija: la persiana sale SIEMPRE igual (no cambia al recargar)
let semilla = 98;
function rnd() {
  semilla = (semilla + 0x6d2b79f5) | 0;
  let t = Math.imul(semilla ^ (semilla >>> 15), 1 | semilla);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const azar = (a, b) => a + rnd() * (b - a);
const elegir = (arr) => arr[(rnd() * arr.length) | 0];
const gauss = () => (rnd() + rnd() + rnd() - 1.5) / 1.5;
let DPR = 1;
// Safari (iPhone) no aplica ctx.filter: sin esto la persiana "en penumbra" salía igual de clara que la prendida
// (toda la pantalla luminosa y solo titilaba el logo). Se detecta de verdad y, si no anda, se usan equivalentes:
// velo negro + modo 'saturation' en vez de brightness/saturate, y dibujar en chiquito y agrandar en vez de blur.
// prueba: ?sinfiltro simula Safari en la compu
const FILTRO_OK = !new URLSearchParams(location.search).has('sinfiltro') && (() => {
  try {
    const c = document.createElement('canvas');
    c.width = c.height = 1;
    const x = c.getContext('2d');
    x.filter = 'brightness(0)';
    x.fillStyle = '#fff';
    x.fillRect(0, 0, 1, 1);
    return x.getImageData(0, 0, 1, 1).data[0] < 128;
  } catch { return false; }
})();
// oscurece y apaga el color de lo ya pintado (equivale a saturate(sat) brightness(bri))
function apagar(ctx, w, h, bri, sat) {
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  const W = ctx.canvas.width, H = ctx.canvas.height;
  if (sat < 1) {
    ctx.globalCompositeOperation = 'saturation';
    ctx.fillStyle = `rgba(128,128,128,${1 - sat})`;
    ctx.fillRect(0, 0, W, H);
  }
  ctx.globalCompositeOperation = 'source-atop';
  ctx.fillStyle = `rgba(0,0,0,${1 - bri})`;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
}

// canvas auxiliar en coordenadas lógicas (nítido en pantallas retina)
function lienzo(w, h) {
  const c = document.createElement('canvas');
  c.width = Math.ceil(w * DPR);
  c.height = Math.ceil(h * DPR);
  const x = c.getContext('2d');
  x.scale(DPR, DPR);
  return [c, x];
}

function condensada(ctx, tipo = 'condensed') {
  if ('fontStretch' in ctx) ctx.fontStretch = tipo;
}

// texto que se achica hasta entrar en el ancho
function textoAjustado(ctx, str, x, y, maxW, px, peso = 900, familia = 'Archivo') {
  ctx.font = `${peso} ${px}px "${familia}"`;
  const m = ctx.measureText(str).width;
  if (m > maxW) ctx.font = `${peso} ${(px * maxW) / m}px "${familia}"`;
  ctx.fillText(str, x, y);
}

function chapa(ctx, w, h) {
  const g = ctx.createLinearGradient(0, 0, w, 0);
  g.addColorStop(0, '#08080a');
  g.addColorStop(0.5, '#111114');
  g.addColorStop(1, '#09090b');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

// Las ranuras de las lamas se dibujan ENCIMA de la pintura: así parece pintado sobre chapa real
function lamas(ctx, w, h, paso) {
  for (let y = 0; y < h; y += paso) {
    const l = ctx.createLinearGradient(0, y, 0, y + paso);
    l.addColorStop(0, 'rgba(255,255,255,0.10)');
    l.addColorStop(0.12, 'rgba(255,255,255,0.02)');
    l.addColorStop(0.55, 'rgba(0,0,0,0)');
    l.addColorStop(0.86, 'rgba(0,0,0,0.38)');
    l.addColorStop(1, 'rgba(0,0,0,0.75)');
    ctx.fillStyle = l;
    ctx.fillRect(0, y, w, paso);
  }
  // óxido / suciedad
  for (let i = 0; i < w * h * 0.0009; i++) {
    ctx.fillStyle = `rgba(${azar(60, 120)},${azar(50, 80)},${azar(40, 60)},${azar(0.03, 0.1)})`;
    ctx.beginPath();
    ctx.arc(azar(0, w), azar(0, h), azar(0.5, 3), 0, 7);
    ctx.fill();
  }
}

function aerosol(ctx, x, y, r, color, n = 60) {
  ctx.fillStyle = color;
  for (let i = 0; i < n; i++) {
    const a = azar(0, 7), d = r * Math.sqrt(rnd());
    ctx.globalAlpha = azar(0.05, 0.35);
    ctx.fillRect(x + Math.cos(a) * d, y + Math.sin(a) * d, 1.4, 1.4);
  }
  ctx.globalAlpha = 1;
}

function chorreado(ctx, x, y, color, largo) {
  ctx.strokeStyle = color;
  ctx.lineWidth = azar(1.5, 3);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + azar(-1, 1), y + largo);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x, y + largo, ctx.lineWidth * 0.9, 0, 7);
  ctx.fillStyle = color;
  ctx.fill();
}

// ---------- Tags grandes / throw-ups ----------
function tag(ctx, x, y, s) {
  const color = elegir(PINTURAS);
  const fuente = elegir(FUENTES);
  const texto = elegir(TAGS);
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(azar(-0.22, 0.12));
  ctx.font = `${s}px "${fuente}"`;
  ctx.globalAlpha = azar(0.3, 0.55);
  if (rnd() < 0.45) {
    // throw-up: relleno + contorno grueso
    ctx.lineJoin = 'round';
    ctx.lineWidth = s * 0.14;
    ctx.strokeStyle = '#0b0b0d';
    ctx.strokeText(texto, 0, 0);
    ctx.fillStyle = color;
    ctx.fillText(texto, 0, 0);
    ctx.lineWidth = s * 0.03;
    ctx.strokeStyle = elegir(PINTURAS);
    ctx.strokeText(texto, 0, 0);
  } else {
    ctx.shadowColor = color;
    ctx.shadowBlur = s * 0.12; // sobre-pulverizado
    ctx.fillStyle = color;
    ctx.fillText(texto, 0, 0);
  }
  ctx.shadowBlur = 0;
  const ancho = ctx.measureText(texto).width;
  for (let i = 0; i < 3; i++) if (rnd() < 0.5) chorreado(ctx, azar(0, ancho), azar(-s * 0.1, s * 0.05), color, azar(8, s * 0.7));
  ctx.restore();
  aerosol(ctx, x + azar(0, s), y - s * 0.4, s * 0.7, color, 40);
}

// ---------- Pieza wildstyle (como el "piece" blanco y negro de la referencia) ----------
function pieza(ctx, x, y, s) {
  const texto = elegir(['SALT', 'OLA', 'SURF', 'OESTE', 'SWELL', 'MAREA']);
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(azar(-0.12, 0.06));
  ctx.font = `${s}px "Sedgwick Ave Display"`;
  ctx.textAlign = 'center';
  ctx.lineJoin = 'round';
  ctx.globalAlpha = 0.62;
  // extrusión 3D
  ctx.fillStyle = '#2a2b31';
  for (let i = 1; i <= Math.round(s * 0.09); i++) ctx.fillText(texto, i, i);
  // contorno negro grueso + borde claro
  ctx.lineWidth = s * 0.16;
  ctx.strokeStyle = '#08080a';
  ctx.strokeText(texto, 0, 0);
  ctx.lineWidth = s * 0.07;
  ctx.strokeStyle = '#cfcbc0';
  ctx.strokeText(texto, 0, 0);
  // relleno con degradé apagado
  const g = ctx.createLinearGradient(0, -s * 0.8, 0, s * 0.1);
  g.addColorStop(0, '#6f8f95');
  g.addColorStop(1, '#2c3d40');
  ctx.fillStyle = g;
  ctx.fillText(texto, 0, 0);
  // brillos
  ctx.fillStyle = '#e6e2d8';
  const ancho = ctx.measureText(texto).width;
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.arc(azar(-ancho * 0.45, ancho * 0.45), azar(-s * 0.6, -s * 0.2), s * 0.025, 0, 7);
    ctx.fill();
  }
  ctx.restore();
}

// ---------- Tags finos de marcador (la "maraña" de firmas de la referencia) ----------
function firma(ctx, x, y, s, color, ancho) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(azar(-0.3, 0.12));
  ctx.strokeStyle = color;
  ctx.lineWidth = ancho;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const letras = 3 + ((rnd() * 5) | 0);
  let cx = 0;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  for (let i = 0; i < letras; i++) {
    const tipo = rnd();
    const lw = s * azar(0.35, 0.7);
    if (tipo < 0.3) {
      // palo alto con vuelta
      ctx.lineTo(cx + lw * 0.15, -s * azar(0.7, 1.25));
      ctx.quadraticCurveTo(cx + lw * 0.5, -s * 1.2, cx + lw * 0.3, -s * 0.5);
      ctx.lineTo(cx + lw, -s * azar(0, 0.2));
    } else if (tipo < 0.6) {
      // rulo
      ctx.bezierCurveTo(cx + lw * 0.1, -s * 0.95, cx + lw * 0.95, -s * 0.95, cx + lw * 0.6, -s * 0.15);
      ctx.lineTo(cx + lw, 0);
    } else if (tipo < 0.85) {
      // panza (tipo "o", "a", "e")
      ctx.bezierCurveTo(cx + lw * 0.9, -s * 0.1, cx + lw * 0.9, -s * 0.6, cx + lw * 0.4, -s * 0.55);
      ctx.bezierCurveTo(cx, -s * 0.5, cx + lw * 0.2, 0, cx + lw, -s * 0.05);
    } else {
      ctx.lineTo(cx + lw * 0.33, -s * azar(0.4, 0.85));
      ctx.lineTo(cx + lw * 0.66, 0);
      ctx.lineTo(cx + lw, -s * azar(0.3, 0.7));
    }
    cx += lw;
  }
  if (rnd() < 0.6) {
    // subrayado con floritura
    ctx.moveTo(-s * 0.15, s * 0.25);
    ctx.quadraticCurveTo(cx * 0.5, s * azar(0.4, 0.75), cx + s * 0.45, -s * azar(0, 0.3));
  }
  if (rnd() < 0.3) {
    // corona / estrellita del escritor
    ctx.moveTo(cx * 0.3, -s * 1.25);
    ctx.lineTo(cx * 0.35, -s * 1.5);
    ctx.lineTo(cx * 0.42, -s * 1.3);
    ctx.lineTo(cx * 0.5, -s * 1.55);
    ctx.lineTo(cx * 0.55, -s * 1.25);
  }
  ctx.stroke();
  if (rnd() < 0.25) chorreado(ctx, cx * azar(0.2, 0.8), 0, color, azar(6, s * 0.8));
  ctx.restore();
}

function tagMarcador(ctx, x, y, s, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(azar(-0.28, 0.1));
  ctx.font = `${s}px "${elegir(MARCADOR)}"`;
  const t = elegir(TAGS).toLowerCase();
  if (rnd() < 0.5) {
    ctx.fillStyle = color;
    ctx.fillText(t, 0, 0);
  } else {
    ctx.lineWidth = Math.max(1, s * 0.05);
    ctx.strokeStyle = color;
    ctx.strokeText(t, 0, 0);
  }
  ctx.restore();
}

function marana(ctx, w, h, n, esc, colores, alfa) {
  for (let i = 0; i < n; i++) {
    const x = azar(-40, w), y = azar(10, h + 20);
    const color = elegir(colores);
    ctx.globalAlpha = azar(alfa[0], alfa[1]);
    if (rnd() < 0.45) firma(ctx, x, y, azar(18, 52) * esc, color, azar(1.2, 3.2) * Math.max(0.7, esc));
    else tagMarcador(ctx, x, y, azar(18, 56) * esc, color);
  }
  ctx.globalAlpha = 1;
}

// ---------- Afiches pegados y arrancados ----------
function bordeRoto(ctx, w, h, d) {
  ctx.beginPath();
  const pts = [];
  const lado = (x0, y0, x1, y1) => {
    const n = Math.max(4, Math.round(Math.hypot(x1 - x0, y1 - y0) / 9));
    for (let i = 0; i < n; i++) {
      const t = i / n;
      pts.push([x0 + (x1 - x0) * t + azar(-d, d), y0 + (y1 - y0) * t + azar(-d, d)]);
    }
  };
  lado(0, 0, w, 0);
  lado(w, 0, w, h);
  lado(w, h, 0, h);
  lado(0, h, 0, 0);
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.closePath();
}

function afiche(ctx, x, y, s) {
  const w = s * azar(2.2, 3.8), h = s * azar(2.6, 4.2);
  const [c, a] = lienzo(w + 20, h + 20);
  a.translate(10, 10);
  bordeRoto(a, w, h, 5);
  a.fillStyle = elegir(['#cfcabd', '#bdb7a8', '#a8a397', '#d8d3c6']);
  a.fill();
  a.save();
  a.clip();
  const tinta = elegir(['#16161a', '#16161a', '#7a3a33', '#2e4b66']);
  a.fillStyle = tinta;
  condensada(a, 'extra-condensed');
  // titular grande + bloques de texto + semitono
  a.textBaseline = 'top';
  textoAjustado(a, elegir(['SOUND', 'FIESTA', 'LIVE', 'NOCHE', 'BEACH', 'SHOW', 'DJ SET', 'FEST']), 8, 8, w - 16, h * 0.28, 900);
  for (let k = 0; k < 9; k++) a.fillRect(8, h * 0.4 + k * h * 0.055, azar(w * 0.3, w - 16), h * 0.022);
  for (let yy = h * 0.82; yy < h; yy += 6) for (let xx = 4; xx < w; xx += 6) {
    a.beginPath();
    a.arc(xx, yy, ((yy - h * 0.82) / (h * 0.18)) * 2.6, 0, 7);
    a.fill();
  }
  a.restore();
  // arrancado: se ve la chapa a través (agujeros dentados)
  a.globalCompositeOperation = 'destination-out';
  for (let k = 0; k < 3; k++) {
    a.save();
    a.translate(azar(-w * 0.2, w * 0.7), azar(-h * 0.1, h * 0.8));
    a.rotate(azar(0, 3));
    bordeRoto(a, w * azar(0.3, 0.7), h * azar(0.2, 0.5), 10);
    a.fill();
    a.restore();
  }
  a.globalCompositeOperation = 'source-over';
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(azar(-0.08, 0.08));
  ctx.globalAlpha = azar(0.28, 0.42);
  ctx.drawImage(c, -w / 2 - 10, -h / 2 - 10, w + 20, h + 20);
  ctx.restore();
}

// ---------- Parches de fotos reales de paredes (Referencias/persiana/grafitis) ----------
// Se pegan como afiches arrancados: bordes rotos, agujeros, apagados para que convivan con la chapa negra.
function parche(ctx, img, x, y, ancho, rot, alfa) {
  const w = ancho, h = ancho * (img.height / img.width);
  const [c, a] = lienzo(w + 24, h + 24);
  a.translate(12, 12);
  bordeRoto(a, w, h, Math.max(5, w * 0.012));
  a.clip();
  // el filtro se aplica en el recorte chico (barato), no en el canvas grande
  if ('filter' in a) a.filter = 'saturate(0.6) brightness(0.62) contrast(1.25)';
  a.drawImage(img, 0, 0, w, h);
  a.filter = 'none';
  a.globalCompositeOperation = 'destination-out';
  for (let k = 0; k < 2 + ((rnd() * 3) | 0); k++) {
    a.save();
    a.translate(azar(-w * 0.15, w * 0.85), azar(-h * 0.1, h * 0.9));
    a.rotate(azar(0, 3));
    bordeRoto(a, w * azar(0.12, 0.35), h * azar(0.08, 0.25), 9);
    a.fill();
    a.restore();
  }
  a.globalCompositeOperation = 'source-over';
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.globalAlpha = alfa;
  ctx.drawImage(c, -w / 2 - 12, -h / 2 - 12, w + 24, h + 24);
  ctx.restore();
}

// ---------- Stickers (sticker-bombing) ----------
function contraste(color) {
  return color === '#0d0d0f' || color === '#4b6a8f' || color === '#b4584c' ? PAPEL : '#121214';
}

function iconoSol(a, cx, cy, r, color) {
  a.strokeStyle = a.fillStyle = color;
  a.lineWidth = r * 0.16;
  a.beginPath();
  a.arc(cx, cy, r * 0.45, 0, 7);
  a.fill();
  for (let i = 0; i < 10; i++) {
    const ang = (i / 10) * Math.PI * 2;
    a.beginPath();
    a.moveTo(cx + Math.cos(ang) * r * 0.62, cy + Math.sin(ang) * r * 0.62);
    a.lineTo(cx + Math.cos(ang) * r * 0.9, cy + Math.sin(ang) * r * 0.9);
    a.stroke();
  }
}

function iconoOla(a, cx, cy, r, color) {
  a.strokeStyle = color;
  a.lineWidth = r * 0.13;
  a.lineCap = 'round';
  for (let k = -1; k <= 1; k++) {
    a.beginPath();
    for (let i = -r * 0.8; i <= r * 0.8; i += 2) a.lineTo(cx + i, cy + k * r * 0.35 + Math.sin(i / (r * 0.18)) * r * 0.1);
    a.stroke();
  }
}

function iconoCara(a, cx, cy, r, color) {
  a.fillStyle = color;
  a.beginPath();
  a.ellipse(cx - r * 0.3, cy - r * 0.15, r * 0.12, r * 0.2, 0, 0, 7);
  a.ellipse(cx + r * 0.3, cy - r * 0.15, r * 0.12, r * 0.2, 0, 0, 7);
  a.fill();
  a.strokeStyle = color;
  a.lineWidth = r * 0.1;
  a.lineCap = 'round';
  a.beginPath();
  a.arc(cx, cy + r * 0.05, r * 0.45, 0.2 * Math.PI, 0.8 * Math.PI);
  a.stroke();
}

const ICONOS = [iconoSol, iconoOla, iconoCara];

// desgaste: esquina despegada, rayones, roturas y mugre
function gastar(a, w, h) {
  a.globalCompositeOperation = 'source-atop';
  const g = a.createLinearGradient(0, 0, w * azar(0.3, 1), h);
  g.addColorStop(0, `rgba(30,25,20,${azar(0, 0.2)})`);
  g.addColorStop(1, `rgba(30,25,20,${azar(0.15, 0.4)})`);
  a.fillStyle = g;
  a.fillRect(0, 0, w, h);
  a.globalCompositeOperation = 'destination-out';
  a.lineCap = 'round';
  if (rnd() < 0.6) {
    for (let k = 0; k < azar(2, 7); k++) {
      a.lineWidth = azar(0.6, 2);
      a.globalAlpha = azar(0.4, 0.9);
      a.beginPath();
      const x0 = azar(0, w), y0 = azar(0, h);
      a.moveTo(x0, y0);
      a.lineTo(x0 + azar(-w * 0.5, w * 0.5), y0 + azar(-h * 0.3, h * 0.3));
      a.stroke();
    }
    a.globalAlpha = 1;
  }
  if (rnd() < 0.3) {
    // pedazo arrancado desde un borde
    a.save();
    a.translate(rnd() < 0.5 ? 0 : w, azar(0, h));
    a.rotate(azar(0, 6));
    bordeRoto(a, w * azar(0.2, 0.45), h * azar(0.3, 0.6), 4);
    a.fill();
    a.restore();
  }
  // esquina despegada (doblada)
  const p = Math.min(w, h) * azar(0.18, 0.32);
  if (rnd() < 0.55) {
    a.beginPath();
    a.moveTo(w, h);
    a.lineTo(w - p, h);
    a.lineTo(w, h - p);
    a.fill();
    a.globalCompositeOperation = 'source-over';
    a.fillStyle = '#bfb9ad';
    a.shadowColor = 'rgba(0,0,0,0.5)';
    a.shadowBlur = 3;
    a.beginPath();
    a.moveTo(w - p, h);
    a.lineTo(w, h - p);
    a.lineTo(w - p * 0.85, h - p * 0.85);
    a.fill();
    a.shadowBlur = 0;
  }
  a.globalCompositeOperation = 'source-over';
}

function sticker(s) {
  const tipo = rnd();
  let w, h, c, a;
  const fondo = elegir(STICKER_COLORES);
  const tinta = contraste(fondo);
  if (tipo < 0.34) {
    // caja con texto bold condensado (con o sin borde troquelado blanco)
    const lineas = elegir(STICKER_TEXTOS);
    w = s * azar(1.3, 2.3);
    h = s * (lineas.length === 1 ? azar(0.42, 0.6) : azar(0.7, 0.95));
    [c, a] = lienzo(w, h);
    const borde = rnd() < 0.4 ? Math.max(2, s * 0.05) : 0;
    if (borde) { a.fillStyle = PAPEL; a.fillRect(0, 0, w, h); }
    a.fillStyle = fondo;
    a.fillRect(borde, borde, w - borde * 2, h - borde * 2);
    a.fillStyle = tinta;
    a.textAlign = 'center';
    a.textBaseline = 'middle';
    condensada(a, rnd() < 0.5 ? 'extra-condensed' : 'condensed');
    const lh = (h - borde * 2) / lineas.length;
    lineas.forEach((l, i) => textoAjustado(a, l, w / 2, borde + lh * (i + 0.53), w * 0.86, lh * 0.82, 900));
  } else if (tipo < 0.46) {
    // franjas: texto repetido blanco sobre negro con rayas (tipo "ANVA ANVA")
    const t = elegir(CORTOS);
    w = s * azar(1.4, 2);
    h = s * azar(0.75, 1);
    [c, a] = lienzo(w, h);
    a.fillStyle = '#0d0d0f';
    a.fillRect(0, 0, w, h);
    a.fillStyle = PAPEL;
    a.textAlign = 'center';
    a.textBaseline = 'middle';
    condensada(a, 'expanded');
    for (let k = 0; k < 2; k++) textoAjustado(a, t, w / 2, h * (0.3 + k * 0.42), w * 0.86, h * 0.34, 900);
    a.fillRect(w * 0.06, h * 0.06, w * 0.88, h * 0.035);
    a.fillRect(w * 0.06, h * 0.9, w * 0.88, h * 0.035);
  } else if (tipo < 0.62) {
    // círculo con ícono o palabra
    const r = s * azar(0.38, 0.6);
    w = h = r * 2;
    [c, a] = lienzo(w, h);
    a.fillStyle = PAPEL;
    a.beginPath();
    a.arc(r, r, r, 0, 7);
    a.fill();
    a.fillStyle = fondo === PAPEL ? '#c47a4a' : fondo;
    a.beginPath();
    a.arc(r, r, r * 0.9, 0, 7);
    a.fill();
    const t = fondo === PAPEL ? '#121214' : contraste(fondo);
    if (rnd() < 0.55) elegir(ICONOS)(a, r, r, r * 0.75, t);
    else {
      a.fillStyle = t;
      a.textAlign = 'center';
      a.textBaseline = 'middle';
      condensada(a);
      textoAjustado(a, elegir(CORTOS), r, r * 1.04, r * 1.4, r * 0.75, 900);
    }
  } else if (tipo < 0.76) {
    // "HELLO my name is" con un tag de marcador
    w = s * azar(1.4, 1.7);
    h = w * 0.68;
    [c, a] = lienzo(w, h);
    const banda = elegir(['#b4584c', '#4b6a8f', '#b4584c']);
    a.fillStyle = banda;
    a.beginPath();
    a.roundRect(0, 0, w, h, h * 0.08);
    a.fill();
    a.fillStyle = PAPEL;
    a.fillRect(w * 0.04, h * 0.4, w * 0.92, h * 0.5);
    a.textAlign = 'center';
    a.textBaseline = 'middle';
    textoAjustado(a, 'HELLO', w / 2, h * 0.16, w * 0.7, h * 0.2, 900);
    textoAjustado(a, 'my name is', w / 2, h * 0.32, w * 0.6, h * 0.09, 500);
    a.fillStyle = '#121214';
    a.save();
    a.translate(w / 2, h * 0.66);
    a.rotate(azar(-0.12, 0.05));
    textoAjustado(a, elegir(TAGS).toLowerCase(), 0, 0, w * 0.82, h * 0.34, 400, elegir(MARCADOR));
    a.restore();
  } else if (tipo < 0.86) {
    // estallido / estrella
    const r = s * azar(0.42, 0.62);
    w = h = r * 2;
    [c, a] = lienzo(w, h);
    const puntas = 12 + ((rnd() * 6) | 0);
    a.fillStyle = fondo === '#0d0d0f' ? '#c9ad5a' : fondo;
    a.beginPath();
    for (let i = 0; i < puntas * 2; i++) {
      const ang = (i / (puntas * 2)) * Math.PI * 2, rr = i % 2 ? r * 0.72 : r;
      a.lineTo(r + Math.cos(ang) * rr, r + Math.sin(ang) * rr);
    }
    a.fill();
    a.fillStyle = contraste(a.fillStyle);
    a.textAlign = 'center';
    a.textBaseline = 'middle';
    condensada(a);
    textoAjustado(a, elegir(CORTOS), r, r * 1.04, r * 1.1, r * 0.55, 900);
  } else {
    // cinta rotuladora (tipo dymo)
    w = s * azar(1.3, 2);
    h = s * azar(0.24, 0.32);
    [c, a] = lienzo(w, h);
    a.fillStyle = elegir(['#0d0d0f', '#4b6a8f', '#b4584c', '#2f5f5f']);
    a.fillRect(0, 0, w, h);
    a.fillStyle = PAPEL;
    a.textAlign = 'center';
    a.textBaseline = 'middle';
    textoAjustado(a, elegir(STICKER_TEXTOS).join(' '), w / 2, h * 0.55, w * 0.9, h * 0.6, 700, 'Archivo');
  }
  gastar(a, w, h);
  return { c, w, h };
}

// ---------- Trazo gestual grande de aerosol (como el amarillo de la referencia) ----------
function trazoAerosol(ctx, region, color, grosor) {
  // caja con proporción de letra dentro de la región (si no, en regiones altas queda un zigzag estirado)
  const bw = Math.min(region.w, region.h * 1.5), bh = Math.min(region.h, bw * 0.75);
  const reg = { x: region.x + azar(0, region.w - bw), y: region.y + azar(0, region.h - bh), w: bw, h: bh };
  const n = 5 + ((rnd() * 3) | 0);
  const pts = [];
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    pts.push([reg.x + reg.w * (0.05 + t * 0.9) + azar(-reg.w * 0.06, reg.w * 0.06), reg.y + reg.h * (i % 2 ? azar(0.65, 0.95) : azar(0.05, 0.35))]);
  }
  // spline catmull-rom
  const curva = () => {
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
      ctx.bezierCurveTo(p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6, p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6, p2[0], p2[1]);
    }
  };
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = color;
  ctx.shadowColor = color;
  // halo de sobre-pulverizado + núcleo
  ctx.globalAlpha = 0.18;
  ctx.lineWidth = grosor * 1.9;
  ctx.shadowBlur = grosor;
  curva();
  ctx.stroke();
  ctx.globalAlpha = 0.42;
  ctx.lineWidth = grosor;
  ctx.shadowBlur = grosor * 0.3;
  curva();
  ctx.stroke();
  ctx.restore();
  // chorreados en los puntos bajos
  pts.forEach(([x, y], i) => {
    if (i % 2 && rnd() < 0.8) {
      ctx.globalAlpha = 0.45;
      chorreado(ctx, x + azar(-grosor, grosor), y + grosor * 0.3, color, azar(grosor, grosor * 4));
      ctx.globalAlpha = 1;
    }
  });
}

function logoGrafiti(ctx, logo, geo) {
  const { x, y, ancho, alto, cx, cy, w } = geo;
  // El logo es el mejor grafiti de la pared: va directo sobre la chapa pintada (sin manchas oscuras ni bordes blancos).
  // Resalta por tamaño, por estar al centro, por el color y por una sombra suave debajo (sin bordes).
  // Se pinta como aerosol: relleno plano, sobre-pulverizado leve, salpicaduras y chorreados (no la textura de piedra).
  const silueta = (color) => {
    const c = document.createElement('canvas');
    c.width = logo.width;
    c.height = logo.height;
    const b = c.getContext('2d');
    b.drawImage(logo, 0, 0);
    b.globalCompositeOperation = 'source-in';
    b.fillStyle = color;
    b.fillRect(0, 0, c.width, c.height);
    return c;
  };
  // sin borde ni extrusión: una sombra suave debajo lo despega del mural (es sombra, no contorno)
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.6)';
  ctx.shadowBlur = alto * 0.05;
  ctx.shadowOffsetY = alto * 0.015;
  ctx.drawImage(silueta('#000'), x, y, ancho, alto);
  ctx.restore();

  // nube de aerosol aqua apenas detrás (ilumina, no tapa)
  const halo = ctx.createRadialGradient(cx, cy, 0, cx, cy, alto * 0.75);
  halo.addColorStop(0, 'rgba(143,220,226,0.07)');
  halo.addColorStop(1, 'rgba(143,220,226,0)');
  ctx.fillStyle = halo;
  ctx.fillRect(0, 0, w, geo.h);

  // Pintura en aerosol (no piedra): relleno aqua PLANO con apenas un 15% de la textura del archivo,
  // un sobre-pulverizado suave en el borde y puntitos de pintura que saltaron afuera. Todo muy leve.
  const AQUA = '#8fdce2';
  const plano = silueta(AQUA);
  // sobre-pulverizado: la misma silueta, desenfocada y tenue, apenas más grande que el logo
  ctx.save();
  if ('filter' in ctx) ctx.filter = `blur(${Math.max(2, Math.round(alto * 0.012))}px)`;
  ctx.globalAlpha = 0.45;
  ctx.drawImage(plano, x, y, ancho, alto);
  ctx.restore();
  // relleno plano con un brillo chico (el aerosol fresco brilla un poco)
  ctx.save();
  ctx.shadowColor = 'rgba(143,220,226,0.18)';
  ctx.shadowBlur = alto * 0.025;
  ctx.drawImage(plano, x, y, ancho, alto);
  ctx.restore();
  // un 15% de la textura original para que no quede "de computadora"
  ctx.save();
  ctx.globalAlpha = 0.15;
  ctx.drawImage(logo, x, y, ancho, alto);
  ctx.restore();
  // salpicaduras: puntitos justo afuera del contorno (se buscan en un anillo alrededor de la silueta)
  const W = 220, H = Math.round(W * (logo.height / logo.width));
  const m = document.createElement('canvas');
  m.width = W;
  m.height = H;
  const mc = m.getContext('2d', { willReadFrequently: true });
  mc.drawImage(logo, 0, 0, W, H);
  const dentro = mc.getImageData(0, 0, W, H).data;
  if ('filter' in mc) mc.filter = 'blur(3px)';
  mc.clearRect(0, 0, W, H);
  mc.drawImage(logo, 0, 0, W, H);
  const cerca = mc.getImageData(0, 0, W, H).data;
  ctx.fillStyle = AQUA;
  for (let k = 0, puestos = 0; k < 4000 && puestos < 140; k++) {
    const px = (rnd() * W) | 0, py = (rnd() * H) | 0, i = (py * W + px) * 4 + 3;
    if (dentro[i] > 20 || cerca[i] < 25) continue; // solo en el anillo de afuera
    ctx.globalAlpha = azar(0.25, 0.7);
    ctx.beginPath();
    ctx.arc(x + (px / W) * ancho, y + (py / H) * alto, azar(0.6, 1.7), 0, 7);
    ctx.fill();
    puestos++;
  }
  ctx.globalAlpha = 1;

  // chorreados del logo
  for (let i = 0; i < 7; i++) chorreado(ctx, x + azar(ancho * 0.15, ancho * 0.85), y + alto * azar(0.62, 0.8), 'rgba(143,220,226,0.5)', azar(14, alto * 0.22));

}

// ---------- Chapa vieja: óxido, chorreados de las juntas, picaduras ----------
function oxido(ctx, w, h, paso, intensidad = 1) {
  const colores = ['92,44,20', '128,62,26', '150,84,40', '70,34,18', '110,50,22'];
  // manchas de corrosión (más abajo, donde se junta la humedad)
  const n = Math.round(((w * h) / 7000) * intensidad);
  for (let i = 0; i < n; i++) {
    const x = azar(0, w), y = h * (1 - Math.pow(rnd(), 1.7));
    const r = azar(4, 30);
    const c = elegir(colores);
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(${c},${azar(0.18, 0.45) * intensidad})`);
    g.addColorStop(1, `rgba(${c},0)`);
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
  // chorreados de óxido que bajan desde las juntas de las lamas
  ctx.lineCap = 'round';
  for (let y = paso; y < h; y += paso) {
    for (let k = 0; k < Math.round((w / 120) * intensidad); k++) {
      if (rnd() < 0.45) continue;
      const x = azar(0, w), largo = azar(6, paso * 2.8);
      const g = ctx.createLinearGradient(x, y, x, y + largo);
      g.addColorStop(0, `rgba(135,64,24,${azar(0.3, 0.6) * intensidad})`);
      g.addColorStop(1, 'rgba(135,64,24,0)');
      ctx.strokeStyle = g;
      ctx.lineWidth = azar(1, 3.5);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + azar(-1.5, 1.5), y + largo);
      ctx.stroke();
    }
  }
  // picaduras y rayones
  for (let i = 0; i < ((w * h) / 2200) * intensidad; i++) {
    ctx.fillStyle = `rgba(0,0,0,${azar(0.25, 0.6)})`;
    ctx.fillRect(azar(0, w), azar(0, h), azar(0.6, 2.2), azar(0.6, 2.2));
  }
  ctx.strokeStyle = `rgba(255,255,255,${0.05 * intensidad})`;
  for (let i = 0; i < 60 * intensidad; i++) {
    ctx.lineWidth = azar(0.4, 1);
    const x = azar(0, w), y = azar(0, h);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + azar(-90, 90), y + azar(-14, 14));
    ctx.stroke();
  }
}

// ---------- Grafiti streetwear ----------
const STREET = ['98', 'OESTE', 'HLGM', 'ZO', 'DRIP', 'RARE', 'KING', 'CREW', 'SALT', 'SURF', '1998', 'LOCALS', 'WAVY', 'FRESH', 'GANG'];
const ROJO = '#d8322a', BLANCO = '#f1ede4';
// rojo y blanco mandan; el cromo y los "diseños" (rellenos con rayas, lunares y partidos) le dan nivel
const RELLENOS = [BLANCO, BLANCO, ROJO, ROJO, ROJO, 'cromo', 'partido', 'rayas', 'lunares', 'rayas-r'];

// rellenos con diseño para las piezas (como los throw-ups con rayas/lunares de la calle)
function patronCanvas(dibujar, t) {
  const c = document.createElement('canvas');
  c.width = c.height = t;
  dibujar(c.getContext('2d'), t);
  return c;
}
function relleno(ctx, tipo, s) {
  if (tipo === 'cromo') {
    const g = ctx.createLinearGradient(0, -s * 0.8, 0, s * 0.1);
    g.addColorStop(0, '#f4f4f4');
    g.addColorStop(0.45, '#a6aab2');
    g.addColorStop(0.55, '#e9e9ea');
    g.addColorStop(1, '#70737b');
    return g;
  }
  if (tipo === 'partido') {
    // mitad blanca arriba, mitad roja abajo, corte con "gotas"
    const g = ctx.createLinearGradient(0, -s * 0.75, 0, 0);
    g.addColorStop(0, BLANCO);
    g.addColorStop(0.52, BLANCO);
    g.addColorStop(0.53, ROJO);
    g.addColorStop(1, '#a1221c');
    return g;
  }
  const t = Math.max(8, Math.round(s * 0.16));
  if (tipo === 'rayas' || tipo === 'rayas-r') {
    const [fondo, raya] = tipo === 'rayas' ? [ROJO, BLANCO] : [BLANCO, ROJO];
    return ctx.createPattern(patronCanvas((a, t) => {
      a.fillStyle = fondo; a.fillRect(0, 0, t, t);
      a.strokeStyle = raya; a.lineWidth = t * 0.28;
      a.beginPath();
      for (let k = -1; k <= 1; k++) { a.moveTo(k * t, t); a.lineTo(k * t + t, 0); }
      a.stroke();
    }, t), 'repeat');
  }
  if (tipo === 'lunares') {
    return ctx.createPattern(patronCanvas((a, t) => {
      a.fillStyle = ROJO; a.fillRect(0, 0, t, t);
      a.fillStyle = BLANCO;
      a.beginPath(); a.arc(t * 0.25, t * 0.25, t * 0.13, 0, 7); a.arc(t * 0.75, t * 0.75, t * 0.13, 0, 7); a.fill();
    }, t), 'repeat');
  }
  return tipo;
}

// throw-up de burbuja: relleno (cromo o color) + contorno negro grueso + 2º contorno + brillos + chorreados
function throwUp(ctx, x, y, s, { texto = elegir(STREET), color = elegir(RELLENOS), alfa = 0.85, rot = azar(-0.14, 0.08) } = {}) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.globalAlpha = alfa;
  ctx.font = `${s}px "Rubik Bubbles", "Rubik Wet Paint", sans-serif`;
  ctx.textAlign = 'center';
  ctx.lineJoin = 'round';
  const borde2 = color === BLANCO || color === 'rayas-r' ? ROJO : elegir([BLANCO, BLANCO, ROJO, '#0b0b0d']);
  ctx.lineWidth = s * 0.3;
  ctx.strokeStyle = borde2;
  ctx.strokeText(texto, 0, 0);
  // sombra 3D
  ctx.fillStyle = '#050506';
  for (let i = 1; i <= Math.round(s * 0.07); i++) ctx.fillText(texto, i, i);
  ctx.lineWidth = s * 0.16;
  ctx.strokeStyle = '#050506';
  ctx.strokeText(texto, 0, 0);
  ctx.fillStyle = relleno(ctx, color, s);
  ctx.fillText(texto, 0, 0);
  // brillos
  ctx.strokeStyle = 'rgba(255,255,255,0.85)';
  ctx.lineWidth = Math.max(1.5, s * 0.025);
  ctx.lineCap = 'round';
  const ancho = ctx.measureText(texto).width;
  for (let i = 0; i < 3; i++) {
    const bx = azar(-ancho * 0.4, ancho * 0.35), by = azar(-s * 0.62, -s * 0.4);
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.lineTo(bx + s * 0.08, by - s * 0.03);
    ctx.stroke();
  }
  ctx.restore();
  const goteo = color === 'cromo' ? 'rgba(180,182,188,0.8)' : color === BLANCO || color === 'rayas-r' ? BLANCO : ROJO;
  for (let i = 0; i < 4; i++) if (rnd() < 0.6) chorreado(ctx, x + azar(-s, s), y + s * 0.05, goteo, azar(10, s * 0.6));
}

// tag en aerosol (con sobre-pulverizado)
function tagSpray(ctx, x, y, s, color = elegir([BLANCO, BLANCO, BLANCO, ROJO, ROJO, '#c8ccd2']), alfa = azar(0.6, 0.9)) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(azar(-0.28, 0.1));
  ctx.globalAlpha = alfa;
  ctx.font = `${s}px "${elegir(['Rubik Spray Paint', 'Sedgwick Ave Display', 'Sedgwick Ave Display', 'Permanent Marker'])}"`;
  ctx.shadowColor = color;
  ctx.shadowBlur = s * 0.1;
  ctx.fillStyle = color;
  const t = elegir(STREET);
  ctx.fillText(rnd() < 0.5 ? t.toLowerCase() : t, 0, 0);
  ctx.shadowBlur = 0;
  // subrayado con floritura
  if (rnd() < 0.5) {
    const a = ctx.measureText(t).width;
    ctx.strokeStyle = color;
    ctx.lineWidth = Math.max(1.5, s * 0.05);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-s * 0.1, s * 0.18);
    ctx.quadraticCurveTo(a * 0.5, s * 0.42, a + s * 0.3, -s * 0.05);
    ctx.stroke();
  }
  ctx.restore();
  if (rnd() < 0.4) chorreado(ctx, x + azar(0, s), y + 2, color, azar(8, s * 0.7));
}

// íconos clásicos de la calle: corona, flecha, estrella, cruz
function icono(ctx, x, y, s, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(azar(-0.3, 0.3));
  ctx.globalAlpha = azar(0.6, 0.9);
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(2, s * 0.09);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  const tipo = (rnd() * 4) | 0;
  if (tipo === 0) { // corona
    ctx.moveTo(-s * 0.5, s * 0.2); ctx.lineTo(-s * 0.5, -s * 0.25); ctx.lineTo(-s * 0.25, 0); ctx.lineTo(0, -s * 0.4);
    ctx.lineTo(s * 0.25, 0); ctx.lineTo(s * 0.5, -s * 0.25); ctx.lineTo(s * 0.5, s * 0.2); ctx.closePath();
  } else if (tipo === 1) { // flecha
    ctx.moveTo(-s * 0.6, s * 0.2); ctx.quadraticCurveTo(0, -s * 0.5, s * 0.5, -s * 0.1);
    ctx.moveTo(s * 0.5, -s * 0.1); ctx.lineTo(s * 0.25, -s * 0.3); ctx.moveTo(s * 0.5, -s * 0.1); ctx.lineTo(s * 0.3, s * 0.12);
  } else if (tipo === 2) { // estrella
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2 - Math.PI / 2, r = i % 2 ? s * 0.2 : s * 0.5;
      i ? ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r) : ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    ctx.closePath();
  } else { // cruz
    ctx.moveTo(-s * 0.3, -s * 0.3); ctx.lineTo(s * 0.3, s * 0.3); ctx.moveTo(s * 0.3, -s * 0.3); ctx.lineTo(-s * 0.3, s * 0.3);
  }
  ctx.stroke();
  ctx.restore();
}

// ---------- Pósters streetwear pegados con engrudo (wheat-paste), en fila como en la calle ----------
function codigoBarras(a, x, y, w, h, color) {
  a.fillStyle = color;
  let cx = x;
  while (cx < x + w) {
    const g = rnd() < 0.3 ? 3 : rnd() < 0.5 ? 2 : 1;
    a.fillRect(cx, y, g, h);
    cx += g + 1 + ((rnd() * 3) | 0);
  }
}
function semitono(a, cx, cy, r, color, paso) {
  a.fillStyle = color;
  for (let yy = cy - r; yy < cy + r; yy += paso)
    for (let xx = cx - r; xx < cx + r; xx += paso) {
      const d = Math.hypot(xx - cx, yy - cy) / r;
      if (d > 1) continue;
      a.beginPath();
      a.arc(xx, yy, paso * 0.48 * (1 - d * 0.75), 0, 7);
      a.fill();
    }
}

function poster(tipo, w, h) {
  const [c, a] = lienzo(w, h);
  a.textBaseline = 'alphabetic';
  const m = w * 0.07;
  if (tipo === 0) {
    // rojo: "98" gigante en blanco + drop
    a.fillStyle = '#c92d25'; a.fillRect(0, 0, w, h);
    a.fillStyle = BLANCO;
    condensada(a, 'ultra-condensed');
    a.textAlign = 'left';
    textoAjustado(a, '98', m * 0.6, h * 0.62, w - m * 1.2, h * 0.62, 900);
    condensada(a, 'condensed');
    textoAjustado(a, 'MALLAS', m, h * 0.72, w - m * 2, h * 0.07, 800);
    a.fillRect(m, h * 0.755, w - m * 2, Math.max(1, h * 0.006));
    textoAjustado(a, 'SUMMER DROP — 2026', m, h * 0.81, w - m * 2, h * 0.045, 600);
    textoAjustado(a, 'HURLINGHAM · ZONA OESTE', m, h * 0.86, w - m * 2, h * 0.04, 500);
    codigoBarras(a, m, h * 0.89, w * 0.42, h * 0.07, BLANCO);
    a.textAlign = 'right';
    textoAjustado(a, 'Nº 098', w - m, h * 0.955, w * 0.3, h * 0.05, 800);
  } else if (tipo === 1) {
    // hueso: sol rojo en semitono + "NO WAVE NO FUN"
    a.fillStyle = '#e9e4d8'; a.fillRect(0, 0, w, h);
    semitono(a, w * 0.5, h * 0.36, w * 0.36, '#c92d25', Math.max(4, w * 0.035));
    a.fillStyle = '#121214';
    condensada(a, 'extra-condensed');
    a.textAlign = 'center';
    textoAjustado(a, 'NO WAVE', w / 2, h * 0.73, w - m * 2, h * 0.17, 900);
    textoAjustado(a, 'NO FUN', w / 2, h * 0.88, w - m * 2, h * 0.17, 900);
    condensada(a, 'normal');
    textoAjustado(a, 'EST. 1998', w / 2, h * 0.95, w - m * 2, h * 0.035, 700);
    a.fillRect(m, h * 0.075, w - m * 2, Math.max(1, h * 0.008));
    textoAjustado(a, 'SURF CLUB', w / 2, h * 0.06, w * 0.5, h * 0.035, 800);
  } else {
    // negro: "LOCALS ONLY" con franja roja y estrella
    a.fillStyle = '#0d0d0f'; a.fillRect(0, 0, w, h);
    a.fillStyle = '#c92d25'; a.fillRect(0, h * 0.42, w, h * 0.16);
    a.fillStyle = BLANCO;
    condensada(a, 'ultra-condensed');
    a.textAlign = 'left';
    textoAjustado(a, 'LOCALS', m, h * 0.36, w - m * 2, h * 0.3, 900);
    textoAjustado(a, 'ONLY', m, h * 0.86, w - m * 2, h * 0.28, 900);
    a.fillStyle = '#0d0d0f';
    condensada(a, 'condensed');
    textoAjustado(a, 'MALLAS · 1998 / 2026', m, h * 0.525, w - m * 2, h * 0.07, 800);
    a.fillStyle = BLANCO;
    a.beginPath();
    for (let i = 0; i < 10; i++) {
      const an = (i / 10) * Math.PI * 2 - Math.PI / 2, r = i % 2 ? w * 0.045 : w * 0.11;
      a.lineTo(w - m - w * 0.11 + Math.cos(an) * r, h * 0.12 + Math.sin(an) * r * 0.9);
    }
    a.fill();
  }
  // papel: arrugas del engrudo, brillo de cola, desgaste
  for (let k = 0; k < 6; k++) {
    const yy = azar(0, h), g = a.createLinearGradient(0, yy - 6, 0, yy + 6);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(0.5, `rgba(0,0,0,${azar(0.08, 0.18)})`);
    g.addColorStop(0.55, `rgba(255,255,255,${azar(0.05, 0.12)})`);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    a.fillStyle = g;
    a.fillRect(0, yy - 6, w, 12);
  }
  for (let k = 0; k < 3; k++) {
    const xx = azar(0, w), g = a.createLinearGradient(xx - 5, 0, xx + 5, 0);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(0.5, 'rgba(0,0,0,0.12)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    a.fillStyle = g;
    a.fillRect(xx - 5, 0, 10, h);
  }
  gastar(a, w, h);
  return c;
}

function filaPosters(ctx, w, h, y0, alto) {
  const ancho = alto * 0.7;
  const n = Math.ceil(w / (ancho * 0.97)) + 1;
  const x0 = -azar(0, ancho * 0.4);
  const tipos = [0, 1, 0, 2, 1, 0, 2];
  for (let i = 0; i < n; i++) {
    const x = x0 + i * ancho * 0.97;
    if (i > 0 && rnd() < 0.12) continue; // alguno arrancado del todo
    const c = poster(tipos[i % tipos.length], ancho, alto);
    ctx.save();
    ctx.translate(x + ancho / 2, y0 + alto / 2 + azar(-4, 4));
    ctx.rotate(azar(-0.018, 0.018));
    ctx.globalAlpha = azar(0.86, 0.96);
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 3;
    ctx.drawImage(c, -ancho / 2, -alto / 2, ancho, alto);
    ctx.restore();
  }
}

// ---------- Pie de la cortina: perfil de cierre de chapa gruesa, manijas, cerradura central, candado y burlete ----------
function pieCortina(ctx, w, h, H) {
  const y = h - H;
  // sombra que la última lama tira sobre el perfil
  const sb = ctx.createLinearGradient(0, y - 18, 0, y);
  sb.addColorStop(0, 'rgba(0,0,0,0)');
  sb.addColorStop(1, 'rgba(0,0,0,0.55)');
  ctx.fillStyle = sb;
  ctx.fillRect(0, y - 18, w, 18);

  const burlete = Math.max(5, H * 0.13);
  const cuerpo = H - burlete;
  // perfil de acero: labio superior con bisel, cara plana cepillada, canto inferior
  const g = ctx.createLinearGradient(0, y, 0, y + cuerpo);
  g.addColorStop(0, '#9a9da3');
  g.addColorStop(0.07, '#d0d2d6');
  g.addColorStop(0.13, '#5d6066');
  g.addColorStop(0.2, '#74777d');
  g.addColorStop(0.75, '#5a5d63');
  g.addColorStop(0.9, '#46494e');
  g.addColorStop(1, '#2c2e32');
  ctx.fillStyle = g;
  ctx.fillRect(0, y, w, cuerpo);
  // cepillado horizontal
  for (let i = 0; i < w * 0.6; i++) {
    ctx.fillStyle = `rgba(${rnd() < 0.5 ? '255,255,255' : '0,0,0'},${azar(0.03, 0.09)})`;
    ctx.fillRect(azar(-40, w), azar(y + cuerpo * 0.2, y + cuerpo * 0.95), azar(20, 120), azar(0.5, 1.2));
  }
  // mugre y óxido (más en las puntas y abajo), rayones
  for (let i = 0; i < w / 14; i++) {
    const xx = rnd() < 0.5 ? azar(0, w * 0.15) : rnd() < 0.5 ? azar(w * 0.85, w) : azar(0, w);
    const r = azar(3, 16), yy = y + cuerpo * azar(0.45, 1);
    const og = ctx.createRadialGradient(xx, yy, 0, xx, yy, r);
    og.addColorStop(0, `rgba(118,56,22,${azar(0.25, 0.55)})`);
    og.addColorStop(1, 'rgba(118,56,22,0)');
    ctx.fillStyle = og;
    ctx.fillRect(xx - r, yy - r, r * 2, r * 2);
  }
  ctx.strokeStyle = 'rgba(255,255,255,0.18)';
  for (let i = 0; i < w / 40; i++) {
    ctx.lineWidth = azar(0.4, 1);
    const xx = azar(0, w), yy = azar(y + cuerpo * 0.25, y + cuerpo * 0.9);
    ctx.beginPath();
    ctx.moveTo(xx, yy);
    ctx.lineTo(xx + azar(-50, 50), yy + azar(-3, 3));
    ctx.stroke();
  }
  // un tag de marcador en el perfil (siempre lo grafitean)
  ctx.save();
  ctx.globalAlpha = 0.5;
  tagMarcador(ctx, w * azar(0.58, 0.68), y + cuerpo * 0.8, cuerpo * 0.5, BLANCO);
  ctx.restore();
  // burlete de goma negra
  const gb = ctx.createLinearGradient(0, y + cuerpo, 0, h);
  gb.addColorStop(0, '#1b1b1d');
  gb.addColorStop(0.3, '#0b0b0c');
  gb.addColorStop(1, '#030303');
  ctx.fillStyle = gb;
  ctx.fillRect(0, y + cuerpo, w, burlete);
  ctx.fillStyle = 'rgba(255,255,255,0.06)';
  ctx.fillRect(0, y + cuerpo, w, 1);

  const tornillo = (x, yy, r) => {
    const t = ctx.createRadialGradient(x - r * 0.3, yy - r * 0.3, 0, x, yy, r);
    t.addColorStop(0, '#e5e6e8');
    t.addColorStop(0.6, '#86898f');
    t.addColorStop(1, '#2b2c30');
    ctx.fillStyle = t;
    ctx.beginPath();
    ctx.arc(x, yy, r, 0, 7);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.6)';
    ctx.lineWidth = Math.max(1, r * 0.25);
    ctx.beginPath();
    ctx.moveTo(x - r * 0.6, yy);
    ctx.lineTo(x + r * 0.6, yy);
    ctx.stroke();
  };

  // manijas en U para tirar (a los costados)
  const mh = cuerpo * 0.62, mw = Math.min(110, w * 0.12), yM = y + cuerpo * 0.3;
  for (const fx of [0.24, 0.76]) {
    const xm = w * fx - mw / 2;
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.7)';
    ctx.shadowBlur = 6;
    ctx.shadowOffsetY = 3;
    ctx.lineCap = 'round';
    ctx.lineWidth = Math.max(5, mh * 0.2);
    const mg = ctx.createLinearGradient(0, yM, 0, yM + mh);
    mg.addColorStop(0, '#f0f1f3');
    mg.addColorStop(0.5, '#9fa2a8');
    mg.addColorStop(1, '#55585e');
    ctx.strokeStyle = mg;
    ctx.beginPath();
    ctx.moveTo(xm, yM + mh * 0.15);
    ctx.lineTo(xm, yM + mh * 0.75);
    ctx.quadraticCurveTo(xm, yM + mh, xm + mh * 0.25, yM + mh);
    ctx.lineTo(xm + mw - mh * 0.25, yM + mh);
    ctx.quadraticCurveTo(xm + mw, yM + mh, xm + mw, yM + mh * 0.75);
    ctx.lineTo(xm + mw, yM + mh * 0.15);
    ctx.stroke();
    ctx.restore();
    for (const xx of [xm, xm + mw]) {
      ctx.fillStyle = '#2e3034';
      ctx.fillRect(xx - mh * 0.22, yM - mh * 0.02, mh * 0.44, mh * 0.3);
      tornillo(xx, yM + mh * 0.12, Math.max(2, mh * 0.09));
    }
  }

  // cerradura central: chapa con cilindro de bronce y bocallave
  const cw = Math.max(46, cuerpo * 1.3), ch = cuerpo * 0.82, cxL = w / 2 - cw / 2, cyL = y + cuerpo * 0.1;
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.6)';
  ctx.shadowBlur = 5;
  ctx.shadowOffsetY = 2;
  const pl = ctx.createLinearGradient(0, cyL, 0, cyL + ch);
  pl.addColorStop(0, '#c9cbcf');
  pl.addColorStop(0.5, '#8b8e94');
  pl.addColorStop(1, '#5c5f65');
  ctx.fillStyle = pl;
  ctx.beginPath();
  ctx.roundRect(cxL, cyL, cw, ch, 3);
  ctx.fill();
  ctx.restore();
  tornillo(cxL + cw * 0.12, cyL + ch * 0.5, Math.max(2, ch * 0.08));
  tornillo(cxL + cw * 0.88, cyL + ch * 0.5, Math.max(2, ch * 0.08));
  const rc = ch * 0.3, xc = w / 2, yc = cyL + ch * 0.5;
  const cil = ctx.createRadialGradient(xc - rc * 0.3, yc - rc * 0.3, 0, xc, yc, rc);
  cil.addColorStop(0, '#f4dc98');
  cil.addColorStop(0.6, '#b8913f');
  cil.addColorStop(1, '#5e4718');
  ctx.fillStyle = cil;
  ctx.beginPath();
  ctx.arc(xc, yc, rc, 0, 7);
  ctx.fill();
  ctx.fillStyle = '#141414';
  ctx.beginPath();
  ctx.arc(xc, yc - rc * 0.22, rc * 0.2, 0, 7);
  ctx.fill();
  ctx.fillRect(xc - rc * 0.08, yc - rc * 0.2, rc * 0.16, rc * 0.62);

  // orejas para trabar al piso en las dos puntas; en una cuelga un candado
  for (const lado of [0, 1]) {
    const xo = lado ? w - Math.max(34, w * 0.05) : Math.max(34, w * 0.05);
    const ow = Math.max(16, cuerpo * 0.42);
    ctx.fillStyle = '#3a3c41';
    ctx.fillRect(xo - ow / 2, y + cuerpo * 0.35, ow, cuerpo * 0.65 + burlete * 0.6);
    ctx.fillStyle = '#0c0c0d';
    ctx.beginPath();
    ctx.arc(xo, y + cuerpo * 0.6, ow * 0.2, 0, 7);
    ctx.fill();
    if (lado === 0) {
      const lw = ow * 1.25, lh = lw * 1.05, lx = xo - lw / 2, ly = y + cuerpo * 0.6 + ow * 0.12;
      ctx.save();
      ctx.lineWidth = lw * 0.16;
      ctx.strokeStyle = '#b9bcc2';
      ctx.beginPath();
      ctx.arc(xo, ly + lh * 0.12, lw * 0.28, Math.PI, 0);
      ctx.lineTo(xo + lw * 0.28, ly + lh * 0.3);
      ctx.moveTo(xo - lw * 0.28, ly + lh * 0.12);
      ctx.lineTo(xo - lw * 0.28, ly + lh * 0.3);
      ctx.stroke();
      ctx.shadowColor = 'rgba(0,0,0,0.7)';
      ctx.shadowBlur = 6;
      ctx.shadowOffsetY = 3;
      const cb = ctx.createLinearGradient(lx, 0, lx + lw, 0);
      cb.addColorStop(0, '#7a5a1e');
      cb.addColorStop(0.35, '#e2b95a');
      cb.addColorStop(0.6, '#b8893a');
      cb.addColorStop(1, '#5e4214');
      ctx.fillStyle = cb;
      ctx.beginPath();
      ctx.roundRect(lx, ly + lh * 0.28, lw, lh * 0.8, lw * 0.12);
      ctx.fill();
      ctx.restore();
      ctx.fillStyle = '#2a1d08';
      ctx.beginPath();
      ctx.arc(xo, ly + lh * 0.62, lw * 0.07, 0, 7);
      ctx.fill();
      ctx.fillRect(xo - lw * 0.025, ly + lh * 0.62, lw * 0.05, lh * 0.18);
    }
  }
  // brillo del canto superior (luz de la calle)
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.fillRect(0, y + cuerpo * 0.04, w, 1);
}

// ---------- Grafitis (versión 10): fotos reales de paredes + hollows plateados + firmas ----------
// Una "tesela": un pedazo de foto real de pared grafiteada, oscurecida y con los bordes desvanecidos,
// para que varias se fundan entre sí y con la chapa (sin cortes rectos).
function tesela(ctx, img, x, y, lado, alfa, voltear) {
  const r = img.width / img.height;
  const tw = Math.max(1, Math.round(r >= 1 ? lado : lado * r)), th = Math.max(1, Math.round(r >= 1 ? lado / r : lado));
  const c = document.createElement('canvas');
  c.width = tw;
  c.height = th;
  const a = c.getContext('2d');
  if ('filter' in a) a.filter = 'saturate(0.8) brightness(0.6) contrast(1.22)';
  if (voltear) { a.translate(tw, 0); a.scale(-1, 1); }
  a.drawImage(img, 0, 0, tw, th);
  a.setTransform(1, 0, 0, 1, 0, 0);
  a.filter = 'none';
  a.globalCompositeOperation = 'destination-in';
  const g = a.createRadialGradient(tw / 2, th / 2, Math.min(tw, th) * 0.26, tw / 2, th / 2, Math.max(tw, th) * 0.62);
  g.addColorStop(0, 'rgba(0,0,0,1)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  a.fillStyle = g;
  a.fillRect(0, 0, tw, th);
  ctx.save();
  ctx.globalAlpha = alfa;
  ctx.translate(x, y);
  ctx.rotate(azar(-0.03, 0.03));
  ctx.drawImage(c, -tw / 2, -th / 2);
  ctx.restore();
}

// "hollow": letras burbuja solo con contorno (plateado, blanco o aqua apagado), o relleno negro con borde plateado
function hollow(ctx, x, y, s, { texto = elegir(STREET), estilo = elegir(['plata', 'plata', 'blanco', 'negro', 'aqua']), rot = azar(-0.12, 0.08), alfa = 0.88 } = {}) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.globalAlpha = alfa;
  ctx.font = `${s}px "Rubik Bubbles", "Rubik Wet Paint", sans-serif`;
  ctx.textAlign = 'center';
  ctx.lineJoin = 'round';
  const plata = relleno(ctx, 'cromo', s);
  const linea = estilo === 'blanco' ? BLANCO : estilo === 'aqua' ? '#7fbfc4' : plata;
  // sombra de bloque corrida
  ctx.lineWidth = s * 0.1;
  ctx.strokeStyle = 'rgba(0,0,0,0.8)';
  ctx.strokeText(texto, s * 0.045, s * 0.045);
  if (estilo === 'negro') {
    ctx.fillStyle = '#0a0a0b';
    ctx.fillText(texto, 0, 0);
  }
  ctx.lineWidth = s * 0.07;
  ctx.strokeStyle = linea;
  ctx.strokeText(texto, 0, 0);
  // línea interna oscura: define la letra como hecha con aerosol
  ctx.lineWidth = Math.max(1, s * 0.016);
  ctx.strokeStyle = '#050506';
  ctx.strokeText(texto, 0, 0);
  ctx.restore();
  const goteo = estilo === 'blanco' ? BLANCO : estilo === 'aqua' ? '#7fbfc4' : 'rgba(190,192,198,0.85)';
  for (let i = 0; i < 3; i++) if (rnd() < 0.55) chorreado(ctx, x + azar(-s, s), y + s * 0.05, goteo, azar(8, s * 0.5));
}

// pie de la persiana: una franja finita de metal cepillado (no llama la atención, termina la persiana)
function baseMetal(ctx, w, h, H) {
  const y = h - H;
  const sb = ctx.createLinearGradient(0, y - 12, 0, y);
  sb.addColorStop(0, 'rgba(0,0,0,0)');
  sb.addColorStop(1, 'rgba(0,0,0,0.55)');
  ctx.fillStyle = sb;
  ctx.fillRect(0, y - 12, w, 12);
  const g = ctx.createLinearGradient(0, y, 0, h);
  g.addColorStop(0, '#5d6066');
  g.addColorStop(0.22, '#8b8e94');
  g.addColorStop(0.5, '#4a4d53');
  g.addColorStop(1, '#1e1f23');
  ctx.fillStyle = g;
  ctx.fillRect(0, y, w, H);
  for (let i = 0; i < w / 3; i++) {
    ctx.fillStyle = `rgba(255,255,255,${azar(0.015, 0.05)})`;
    ctx.fillRect(azar(0, w), y + azar(1, H - 1), azar(20, 140), 0.6);
  }
  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  ctx.fillRect(0, y, w, 1);
  ctx.fillStyle = 'rgba(0,0,0,0.65)';
  ctx.fillRect(0, h - 1.5, w, 1.5);
}

function pintar(ctx, w, h, logo, fotos, prendida = true) {
  semilla = 98;
  const esc = Math.max(0.55, Math.min(1.15, Math.min(w, h) / 820));
  const paso = Math.max(22, Math.round(h / 34));
  const pie = Math.max(9, Math.round(h * 0.014));

  // geometría del logo (es el protagonista: grande y al centro)
  const alto = Math.min(h * 0.5, w * 0.74);
  const ancho = alto * (logo.naturalWidth && logo.naturalHeight ? logo.naturalWidth / logo.naturalHeight : 886 / 749);
  const cx = w / 2, cy = h * 0.46;
  const geo = { x: cx - ancho / 2, y: cy - alto / 2, ancho, alto, cx, cy, w, h };
  const nucleo = { x0: geo.x + ancho * 0.1, x1: geo.x + ancho * 0.9, y0: geo.y + alto * 0.08, y1: geo.y + alto * 0.95 };
  const enNucleo = (x, y, m = 0) => x > nucleo.x0 - m && x < nucleo.x1 + m && y > nucleo.y0 - m && y < nucleo.y1 + m;

  // 1) chapa negra con óxido
  chapa(ctx, w, h);
  oxido(ctx, w, h, paso, 0.8);

  // 2) el mural (Referencias/persiana/grafitis/selfles.jpg, sin la marca de agua) pintado sobre toda la persiana:
  //    cubre la pantalla sin deformarse, un poco más oscuro para que el logo se lea
  const mural = fotos.find((f) => f.src.includes('selfles'));
  if (mural) {
    const e = Math.max(w / mural.width, h / mural.height);
    const mw = mural.width * e, mh = mural.height * e;
    ctx.save();
    // apagada = penumbra de la calle; prendida = lo que ven las luces (igual de oscura que antes, nunca más clara)
    if (FILTRO_OK) ctx.filter = prendida ? 'saturate(0.9) brightness(0.8) contrast(1.06)' : 'saturate(0.75) brightness(0.36) contrast(1.04)';
    ctx.drawImage(mural, (w - mw) / 2, (h - mh) * 0.45, mw, mh);
    ctx.restore();
    if (!FILTRO_OK) apagar(ctx, w, h, prendida ? 0.8 : 0.36, prendida ? 0.9 : 0.75);
  }

  // 7) un poco de óxido encima de la pintura (está pintado sobre chapa) + viñeta
  oxido(ctx, w, h, paso, 0.3);
  const vin = ctx.createRadialGradient(cx, cy, Math.min(w, h) * 0.3, cx, cy, Math.max(w, h) * 0.8);
  vin.addColorStop(0, 'rgba(0,0,0,0)');
  vin.addColorStop(1, 'rgba(0,0,0,0.45)');
  ctx.fillStyle = vin;
  ctx.fillRect(0, 0, w, h);

  // 8) sombras que tiran las luces, logo directo sobre la pared, lamas por encima de todo y la franja metálica abajo
  // las sombras las tiran las luces: solo existen donde hay luz
  if (prendida) sombrasLogo(ctx, logo, geo, spotsLED(w, h, geo), '#000', 0.7);
  // el logo es pintura: en penumbra también se apaga (no brilla solo como un neón)
  const [lc, lx] = lienzo(w, h);
  logoGrafiti(lx, logo, geo);
  ctx.save();
  if (!prendida && FILTRO_OK) ctx.filter = 'brightness(0.5) saturate(0.8)';
  else if (!prendida) apagar(lx, w, h, 0.5, 1); // (sin 'saturation': sobre lo transparente pintaría gris)
  ctx.drawImage(lc, 0, 0, w, h);
  ctx.restore();
  lamas(ctx, w, h - pie, paso);
  baseMetal(ctx, w, h, pie);
  return geo;
}

// ---------- Luces: dos bañadores de pared arriba (sin cajón) ----------
// Como en un local de verdad: dos luminarias chicas pegadas arriba, a un cuarto de cada punta, que bañan la chapa
// con conos ANCHOS y suaves (la "parábola" de luz sobre la pared que se abre hacia abajo y se pierde).
// La luz no SUMA brillo encima (eso se veía artificial): la capa de luz es la misma persiana pintada "prendida",
// recortada con la forma de los conos; abajo queda la versión en penumbra. Al titilar se ve cómo la luz
// prende y apaga los colores reales del mural, y en ningún lugar queda más clara que la pared prendida.
// Sombras del logo según las luces: cada luminaria proyecta la sombra del logo hacia el lado contrario.
function sombrasLogo(ctx, logo, geo, spots, color, alfa) {
  const sil = document.createElement('canvas');
  const red = FILTRO_OK ? 1 : 1 / 14;
  sil.width = Math.max(4, Math.round(logo.width * red));
  sil.height = Math.max(4, Math.round(logo.height * red));
  const b = sil.getContext('2d');
  b.drawImage(logo, 0, 0, sil.width, sil.height);
  b.globalCompositeOperation = 'source-in';
  b.fillStyle = color;
  b.fillRect(0, 0, sil.width, sil.height);
  const largo = geo.alto * 0.06;
  ctx.save();
  if (FILTRO_OK) ctx.filter = `blur(${Math.max(3, Math.round(geo.alto * 0.022))}px)`;
  ctx.globalAlpha = alfa;
  for (const s of spots) ctx.drawImage(sil, geo.x + s.dx * largo, geo.y + s.dy * largo, geo.ancho, geo.alto);
  ctx.restore();
}

function spotsLED(w, h, geo) {
  const esc = Math.max(0.6, Math.min(1.2, Math.min(w, h) / 800));
  // en celular (angosto) van más afuera para que los conos igual cubran el logo
  const frac = w < 700 ? 0.16 : 0.24;
  return [-1, 1].map((lado) => {
    const px = lado < 0 ? w * frac : w * (1 - frac), py = 12 * esc;
    let dx = geo.cx - px, dy = geo.cy - geo.alto * 0.1 - py;
    const d = Math.hypot(dx, dy);
    dx /= d; dy /= d;
    const largo = 38 * esc, radio = 10 * esc;
    return { lado, px, py, dx, dy, largo, radio, esc, bx: px + dx * largo * 0.55, by: py + dy * largo * 0.55, dist: d };
  });
}

// el cuerpo de la luminaria (se ve también apagada): base pegada arriba + cabezal negro mate girado hacia el logo
function cuerpoLED(ctx, s) {
  const { px, py, dx, dy, largo, radio } = s;
  ctx.save();
  ctx.fillStyle = '#141416';
  ctx.fillRect(px - radio * 1.4, 0, radio * 2.8, py * 0.6);
  ctx.translate(px, py);
  ctx.rotate(Math.atan2(dy, dx));
  ctx.shadowColor = 'rgba(0,0,0,0.7)';
  ctx.shadowBlur = radio * 1.4;
  ctx.shadowOffsetY = radio * 0.6;
  const g = ctx.createLinearGradient(0, -radio, 0, radio);
  g.addColorStop(0, '#2c2c30');
  g.addColorStop(0.35, '#18181b');
  g.addColorStop(1, '#08080a');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.roundRect(-largo * 0.3, -radio, largo * 0.9, radio * 2, radio * 0.45);
  ctx.fill();
  ctx.restore();
}

// forma de la luz sobre la chapa (alfa 0..1): por cada luminaria un cono muy abierto con el borde difuso,
// más intenso cerca de la luminaria y que se desvanece de a poco hacia abajo y hacia los costados
function mascaraLuz(w, h, spots) {
  if (!FILTRO_OK) {
    // sin filtro: los conos se dibujan en un canvas chico y al agrandarlo quedan con el borde suave
    const k = 1 / 16;
    const chico = document.createElement('canvas');
    chico.width = Math.ceil(w * k);
    chico.height = Math.ceil(h * k);
    const cx = chico.getContext('2d');
    cx.scale(k, k);
    conosLuz(cx, w, h, spots);
    const [c, x] = lienzo(w, h);
    x.imageSmoothingQuality = 'high';
    x.drawImage(chico, 0, 0, w, h);
    return c;
  }
  const [c, x] = lienzo(w, h);
  x.filter = `blur(${Math.round(Math.max(w, h) * 0.025)}px)`;
  conosLuz(x, w, h, spots);
  return c;
}
function conosLuz(x, w, h, spots) {
  const esc = spots[0].esc;
  x.globalCompositeOperation = 'lighter';
  for (const s of spots) {
    const ang = Math.atan2(s.dy, s.dx); // eje del cono: hacia el logo
    const abre = 0.82;                  // medio ángulo de apertura (~47°): luz amplia pero con forma
    const R = Math.max(h * 1.15, w * 0.62);
    const g = x.createRadialGradient(s.bx, s.by, 6 * esc, s.bx, s.by, R);
    g.addColorStop(0, 'rgba(0,0,0,1)');
    g.addColorStop(0.25, 'rgba(0,0,0,0.88)');
    g.addColorStop(0.5, 'rgba(0,0,0,0.55)');
    g.addColorStop(0.75, 'rgba(0,0,0,0.2)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = g;
    x.beginPath();
    x.moveTo(s.bx, s.by);
    x.arc(s.bx, s.by, R, ang - abre, ang + abre);
    x.closePath();
    x.fill();
  }
  // luz de rebote muy tenue en toda la chapa: el borde del cono no corta a negro
  x.filter = 'none';
  x.fillStyle = 'rgba(0,0,0,0.05)';
  x.fillRect(0, 0, w, h);
}

function pintarLuz(ctx, w, h, logo, fotos, spots) {
  // 1) la persiana prendida, con un tono apenas cálido (LED de 3000 K, no naranja)
  const [pc, px] = lienzo(w, h);
  pintar(px, w, h, logo, fotos, true);
  px.globalCompositeOperation = 'multiply';
  px.fillStyle = '#fff0dc';
  px.fillRect(0, 0, w, h);
  // 2) recortada con la forma de los conos
  px.globalCompositeOperation = 'destination-in';
  px.drawImage(mascaraLuz(w, h, spots), 0, 0, w, h);
  ctx.drawImage(pc, 0, 0, w, h);
  // 3) las luminarias encima, con el lente prendido: un punto cálido chico, sin destellos
  for (const s of spots) {
    cuerpoLED(ctx, s);
    ctx.save();
    ctx.translate(s.bx, s.by);
    ctx.rotate(Math.atan2(s.dy, s.dx));
    ctx.fillStyle = 'rgba(255,232,200,0.75)';
    ctx.beginPath();
    ctx.ellipse(0, 0, s.radio * 0.24, s.radio * 0.7, 0, 0, 7);
    ctx.fill();
    ctx.restore();
    const r = 16 * s.esc;
    const g = ctx.createRadialGradient(s.bx, s.by, 0, s.bx, s.by, r);
    g.addColorStop(0, 'rgba(255,226,186,0.35)');
    g.addColorStop(1, 'rgba(255,200,150,0)');
    ctx.fillStyle = g;
    ctx.fillRect(s.bx - r, s.by - r, r * 2, r * 2);
  }
}

// Apertura: un solo movimiento continuo, sin trabas ni pausas, y sola (no hace falta tocar nada).
// Se anima con Web Animations sobre transform → corre en el compositor: aunque el navegador esté ocupado
// cargando el perchero 3D, la persiana no se traba.
const PRENDIDA = 300;  // ms con los LED prendidos antes de titilar
const TITILA = 640;    // los LED titilan dos veces
const CERRADA = PRENDIDA + TITILA + 60; // ms que se ve cerrada antes de subir
// opacidad de la luz durante el titileo [ms, opacidad]: apagón corto y prende, dos veces
const PARPADEO = [[0, 1], [30, 0.05], [95, 0.15], [125, 0.04], [155, 1], [280, 1], [310, 0.05], [400, 0.05], [430, 1], [640, 1]];
const SUBIDA = 1500;  // ms que tarda en subir entera
// arranca suave (como un motor que toma fuerza), sube pareja y frena suave arriba
const CURVA = 'cubic-bezier(0.5, 0, 0.2, 1)';

export async function persiana({ alAbrir } = {}) {
  const raiz = document.getElementById('persiana');
  const hoja = raiz.querySelector('.persiana-hoja');
  const canvas = raiz.querySelector('.persiana-base');
  const luz = raiz.querySelector('.persiana-luces');
  const brillo = raiz.querySelector('.persiana-brillo');
  // pruebas: ?sinintro la saltea, ?persiana=0.4 la congela en ese punto de la apertura
  const params = new URLSearchParams(location.search);
  if (params.has('sinintro')) {
    raiz.remove();
    alAbrir?.();
    return;
  }
  const congelada = params.has('persiana') ? parseFloat(params.get('persiana')) || 0 : null;
  document.body.classList.add('bloqueado');

  const logo = new Image();
  logo.src = 'img/logo.png';
  const fotos = ['selfles'].map((n) => {
    const im = new Image();
    im.src = `img/grafitis/${n}.webp`;
    return im;
  });
  // espera la carga real (decode() puede fallar con la red cargada y dejar la imagen sin medidas)
  const cargada = (im) => (im.complete && im.naturalWidth ? Promise.resolve() : new Promise((ok) => { im.onload = im.onerror = () => ok(); }));
  await Promise.all([
    cargada(logo),
    ...fotos.map(cargada),
    ...FUENTES.map((f) => document.fonts.load(`40px "${f}"`).catch(() => {})),
    document.fonts.load('900 20px "Archivo"'),
    document.fonts.load('800 20px "Archivo"'),
    document.fonts.load('500 20px "Archivo"'),
    document.fonts.load('700 20px "Archivo"'),
  ]);

  DPR = Math.min(devicePixelRatio || 1, 2);
  const w = raiz.clientWidth, h = raiz.clientHeight;
  canvas.width = w * DPR;
  canvas.height = h * DPR;
  const ctx = canvas.getContext('2d');
  ctx.scale(DPR, DPR);
  const listas = fotos.filter((im) => im.naturalWidth > 0);
  const geo = pintar(ctx, w, h, logo, listas, false); // base: la persiana en penumbra
  const spots = spotsLED(w, h, geo);
  for (const s of spots) cuerpoLED(ctx, s);
  luz.width = w * DPR;
  luz.height = h * DPR;
  const lctx = luz.getContext('2d');
  lctx.scale(DPR, DPR);
  pintarLuz(lctx, w, h, logo, listas, spots); // encima: lo que iluminan las luces (mezcla normal)

  if (brillo) {
    const r = Math.max(geo.ancho, geo.alto) * 1.1;
    Object.assign(brillo.style, { left: `${geo.cx - r / 2}px`, top: `${geo.cy - r / 2}px`, width: `${r}px`, height: `${r}px` });
  }
  raiz.classList.add('lista');

  const arriba = 'translate3d(0, calc(-100% - 40px), 0)';
  if (congelada !== null) {
    if (params.has('apagada')) luz.style.opacity = '0'; // prueba: ?persiana=0&apagada muestra la persiana con las luces apagadas
    hoja.style.transform = `translate3d(0, ${-congelada * 100}%, 0)`;
    alAbrir?.();
    return;
  }

  // dos cuadros para que el canvas recién pintado ya esté en la GPU antes de moverlo
  await new Promise((ok) => requestAnimationFrame(() => requestAnimationFrame(ok)));
  luz.animate(PARPADEO.map(([t, o]) => ({ offset: t / TITILA, opacity: o })), { duration: TITILA, delay: PRENDIDA, fill: 'both' });
  await new Promise((ok) => setTimeout(ok, CERRADA));

  raiz.classList.add('subiendo');
  const anim = hoja.animate([{ transform: 'translate3d(0, 0, 0)' }, { transform: arriba }], { duration: SUBIDA, easing: CURVA, fill: 'forwards' });
  // la página se puede usar apenas la persiana dejó ver la mayor parte
  setTimeout(() => { document.body.classList.remove('bloqueado'); alAbrir?.(); }, SUBIDA * 0.45);
  await anim.finished.catch(() => {});
  raiz.classList.add('abierta');
  raiz.remove();
}
