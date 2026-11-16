// Pared del perchero: pared blanca encalada con grafitis gastados (referencia: Referencias/persiana/grafitis/images (1).jpg).
// Muy suave para que las mallas sean lo que resalta. Siempre igual (semilla fija) y con un glitch corto cada tanto.

const FUENTES = ['Sedgwick Ave Display', 'Permanent Marker', 'Rock Salt'];
const PALABRAS = ['98', 'dstrct', 'salt', 'ola', 'swell', 'marea', 'locals', 'reef', 'brisa', 'drop', 'surf', 'wax', 'tide', 'love', 'crew'];

let semilla = 1998;
function rnd() {
  semilla = (semilla + 0x6d2b79f5) | 0;
  let t = Math.imul(semilla ^ (semilla >>> 15), 1 | semilla);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const azar = (a, b) => a + rnd() * (b - a);
const elegir = (arr) => arr[(rnd() * arr.length) | 0];

function cargar(src) {
  const im = new Image();
  im.src = src;
  return im.decode().then(() => im).catch(() => null);
}

function mancha(ctx, x, y, r, alfa) {
  for (let i = 0; i < 4; i++) {
    const cx = x + azar(-r * 0.4, r * 0.4), cy = y + azar(-r * 0.3, r * 0.3), rr = r * azar(0.4, 0.9);
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, rr);
    g.addColorStop(0, `rgba(60,58,54,${alfa})`);
    g.addColorStop(1, 'rgba(60,58,54,0)');
    ctx.fillStyle = g;
    ctx.fillRect(cx - rr, cy - rr, rr * 2, rr * 2);
  }
}

function firma(ctx, x, y, s, alfa) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(azar(-0.25, 0.08));
  ctx.font = `${s}px "${elegir(FUENTES)}"`;
  ctx.fillStyle = ctx.strokeStyle = `rgba(28,28,30,${alfa})`;
  ctx.lineWidth = Math.max(1, s * 0.035);
  const t = elegir(PALABRAS);
  rnd() < 0.55 ? ctx.strokeText(t, 0, 0) : ctx.fillText(t, 0, 0);
  // chorreado
  if (rnd() < 0.3) {
    ctx.lineWidth = Math.max(1, s * 0.03);
    ctx.beginPath();
    const dx = azar(0, s);
    ctx.moveTo(dx, 2);
    ctx.lineTo(dx, azar(s * 0.3, s * 0.9));
    ctx.stroke();
  }
  ctx.restore();
}

// foto en gris con los bordes desvanecidos (sin cortes rectos que delaten el "pegado")
const cacheDifuminada = new Map();
function difuminada(img, ancho) {
  const clave = img.src + ancho;
  if (cacheDifuminada.has(clave)) return cacheDifuminada.get(clave);
  const w = Math.round(ancho), h = Math.round(ancho * (img.height / img.width));
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const x = c.getContext('2d');
  if ('filter' in x) x.filter = 'grayscale(1) contrast(1.1)';
  x.drawImage(img, 0, 0, w, h);
  x.filter = 'none';
  x.globalCompositeOperation = 'destination-in';
  const g = x.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.2, w / 2, h / 2, Math.max(w, h) * 0.55);
  g.addColorStop(0, 'rgba(0,0,0,1)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  x.fillStyle = g;
  x.fillRect(0, 0, w, h);
  cacheDifuminada.set(clave, c);
  return c;
}

async function pintar(c, w, h, fotos) {
  semilla = 1998;
  const dpr = Math.min(devicePixelRatio || 1, 1.5);
  c.width = Math.round(w * dpr);
  c.height = Math.round(h * dpr);
  const ctx = c.getContext('2d');
  ctx.scale(dpr, dpr);
  const esc = Math.max(0.6, Math.min(1.2, w / 1200));

  // revoque blanco cálido
  ctx.fillStyle = '#f3f2ee';
  ctx.fillRect(0, 0, w, h);
  // fotos reales de la pared encalada, desaturadas y muy tenues (multiplican sobre el blanco)
  ctx.save();
  ctx.globalCompositeOperation = 'multiply';
  const ancho = Math.max(300, w * 0.4);
  let k = 0;
  for (let x = -ancho * 0.3; x < w; x += ancho * 0.55) {
    for (let y = -ancho * 0.3; y < h; y += ancho * 0.55) {
      const img = fotos[k++ % Math.max(1, fotos.length)];
      if (!img) continue;
      ctx.globalAlpha = azar(0.07, 0.11);
      ctx.drawImage(difuminada(img, ancho), x + azar(-30, 30), y + azar(-20, 20));
    }
  }
  ctx.restore();
  // manchas de pintura y tags gastados
  for (let i = 0; i < 7; i++) mancha(ctx, azar(0, w), azar(0, h), azar(120, 300) * esc, azar(0.03, 0.06));
  for (let i = 0; i < Math.round((w * h) / 60000) + 4; i++) firma(ctx, azar(-60, w), azar(40, h), azar(50, 150) * esc, azar(0.05, 0.1));
  for (let i = 0; i < Math.round((w * h) / 20000); i++) firma(ctx, azar(-40, w), azar(20, h), azar(14, 36) * esc, azar(0.06, 0.13));
  // claridad al centro, detrás de las mallas (las prendas tienen que resaltar)
  const g = ctx.createRadialGradient(w / 2, h * 0.45, 0, w / 2, h * 0.45, Math.max(w, h) * 0.55);
  g.addColorStop(0, 'rgba(250,250,248,0.75)');
  g.addColorStop(0.6, 'rgba(250,250,248,0.35)');
  g.addColorStop(1, 'rgba(250,250,248,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

export function iniciarPared(contenedor) {
  const base = document.createElement('canvas');
  const glitch = document.createElement('canvas');
  base.className = 'pared';
  glitch.className = 'pared pared-glitch';
  base.setAttribute('aria-hidden', 'true');
  glitch.setAttribute('aria-hidden', 'true');
  contenedor.prepend(glitch);
  contenedor.prepend(base);

  const listo = Promise.all([
    ...FUENTES.map((f) => document.fonts.load(`40px "${f}"`).catch(() => {})),
    ...['blanca-a', 'blanca-b', 'stickers'].map((n) => cargar(`img/grafitis/${n}.webp`)),
  ]).then((r) => r.filter((x) => x instanceof HTMLImageElement));

  let ancho = 0, alto = 0;
  const medir = async () => {
    const w = contenedor.clientWidth, h = contenedor.clientHeight;
    if (!w || !h || (Math.abs(w - ancho) < 2 && Math.abs(h - alto) < 60)) return;
    ancho = w;
    alto = h;
    await pintar(base, w, h, await listo);
    glitch.width = base.width;
    glitch.height = base.height;
  };
  medir();
  new ResizeObserver(() => medir()).observe(contenedor);

  const reducido = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const g = glitch.getContext('2d');
  function disparar(fuerte = false) {
    if (reducido || !glitch.width) return;
    let cuadros = fuerte ? 5 : 3;
    const W = glitch.width, H = glitch.height;
    const cuadro = () => {
      g.clearRect(0, 0, W, H);
      if (cuadros-- <= 0) return;
      for (let i = 0; i < (fuerte ? 7 : 4); i++) {
        const y = Math.random() * H, a = Math.random() * H * 0.05 + 4;
        const dx = (Math.random() - 0.5) * W * (fuerte ? 0.06 : 0.03);
        g.drawImage(base, 0, y, W, a, dx, y, W, a);
        if (Math.random() < 0.5) {
          g.fillStyle = Math.random() < 0.6 ? 'rgba(60,140,147,0.12)' : 'rgba(220,40,70,0.08)';
          g.fillRect(0, y, W, Math.max(1, a * 0.25));
        }
      }
      setTimeout(cuadro, 55 + Math.random() * 40);
    };
    cuadro();
  }
  const programar = () => setTimeout(() => { if (!document.hidden) disparar(); programar(); }, 6000 + Math.random() * 6000);
  programar();
  return { glitch: disparar };
}
