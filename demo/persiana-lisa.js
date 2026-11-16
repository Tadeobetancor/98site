// RESPALDO: persiana lisa de la 7ª revisión (no gustó). Se ve con ?intro=lisa (la actual es persiana.js).
// Intro: persiana de local LISA, negra mate (referencia: Referencias/persiana/persiana.jpg), con el logo solo en el centro.
// Arriba, en cada punta, una luz cálida que apunta al logo (referencia de la luz: Referencias/persiana/luces chapa.jpg).
// Secuencia: aparece con las luces prendidas → el logo y las luces titilan DOS veces → la persiana sube en un solo movimiento.
// Se dibuja en dos canvas: la chapa "apagada" (base) y la luz (luces). El titileo es la opacidad del canvas de luz
// y la subida es un transform: las dos cosas corren en el compositor y no se traban aunque cargue el perchero 3D.
// La versión anterior con grafitis quedó en persiana-grafitis.js (se ve con ?intro=grafitis).

let DPR = 1;
function lienzo(w, h) {
  const c = document.createElement('canvas');
  c.width = Math.ceil(w * DPR);
  c.height = Math.ceil(h * DPR);
  const x = c.getContext('2d');
  x.scale(DPR, DPR);
  return [c, x];
}
let semilla = 98;
function rnd() {
  semilla = (semilla + 0x6d2b79f5) | 0;
  let t = Math.imul(semilla ^ (semilla >>> 15), 1 | semilla);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const azar = (a, b) => a + rnd() * (b - a);
const limitar = (v, a, b) => Math.max(a, Math.min(b, v));

// perfil de cada lama (de arriba a abajo): filo que toma luz, panza, sombra y la ranura entre lamas
const LAMA_APAGADA = [[0, '#2e2e32'], [0.06, '#202024'], [0.3, '#161618'], [0.74, '#0d0d0e'], [0.88, '#060607'], [0.93, '#010101'], [0.97, '#141416'], [1, '#232326']];
const LAMA_LUZ = [[0, '#ffd9a0'], [0.06, '#d8954c'], [0.3, '#8a5a2c'], [0.74, '#4a2e15'], [0.88, '#1e1208'], [0.93, '#040201'], [0.97, '#6b4521'], [1, '#a8723a']];

function lamas(ctx, x0, y0, x1, y1, paso, perfil) {
  for (let y = y0; y < y1; y += paso) {
    const g = ctx.createLinearGradient(0, y, 0, y + paso);
    for (const [o, c] of perfil) g.addColorStop(o, c);
    ctx.fillStyle = g;
    ctx.fillRect(x0, y, x1 - x0, Math.min(paso, y1 - y));
  }
}

// textura mate: rayitas horizontales muy suaves (chapa pintada al horno)
function grano(ctx, x0, y0, x1, y1, alfa) {
  semilla = 7;
  for (let i = 0; i < (x1 - x0) * (y1 - y0) * 0.0016; i++) {
    const y = azar(y0, y1), x = azar(x0, x1), l = azar(8, 70);
    ctx.fillStyle = rnd() < 0.5 ? `rgba(255,255,255,${azar(0.01, alfa)})` : `rgba(0,0,0,${azar(0.02, alfa * 2)})`;
    ctx.fillRect(x, y, l, 1);
  }
}

// geometría de toda la persiana (se usa en los dos canvas)
function medidas(w, h, logo) {
  const esc = limitar(Math.min(w, h) / 800, 0.6, 1.25);
  const caja = Math.round(limitar(h * 0.085, 54, 92));       // cajón de arriba (donde se enrolla)
  const guia = Math.round(limitar(w * 0.016, 9, 20));         // guías laterales
  const pie = Math.round(limitar(h * 0.05, 34, 54));          // zócalo de abajo
  const paso = Math.round(limitar(h / 30, 22, 34));           // alto de cada lama
  const alto = Math.min((h - caja - pie) * 0.5, w * 0.66);
  const asp = logo.naturalWidth && logo.naturalHeight ? logo.naturalWidth / logo.naturalHeight : 886 / 749;
  const ancho = alto * asp;
  const cx = w / 2, cy = caja + (h - caja - pie) * 0.5;
  // luces: una en cada punta, colgadas debajo del cajón, giradas hacia el logo
  const margen = Math.max(guia + 26 * esc, w * 0.07);
  const luces = [-1, 1].map((lado) => {
    const mx = lado < 0 ? margen : w - margen, my = caja;
    const px = mx, py = my + 16 * esc; // articulación
    let dx = cx - px, dy = cy - alto * 0.12 - py;
    const d = Math.hypot(dx, dy);
    dx /= d; dy /= d;
    const largo = 60 * esc;
    return { lado, mx, my, px, py, dx, dy, largo, radio: 15 * esc, bx: px + dx * largo * 0.62, by: py + dy * largo * 0.62 };
  });
  return { w, h, esc, caja, guia, pie, paso, alto, ancho, cx, cy, x: cx - ancho / 2, y: cy - alto / 2, luces };
}

function cajon(ctx, m) {
  const { w, caja, esc } = m;
  const g = ctx.createLinearGradient(0, 0, 0, caja);
  g.addColorStop(0, '#26262a');
  g.addColorStop(0.08, '#1b1b1e');
  g.addColorStop(0.7, '#121214');
  g.addColorStop(0.74, '#0a0a0b'); // quiebre: la cara de abajo inclinada
  g.addColorStop(1, '#060607');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, caja);
  ctx.fillStyle = 'rgba(255,255,255,0.07)';
  ctx.fillRect(0, Math.round(caja * 0.72), w, 1);
  grano(ctx, 0, 0, w, caja * 0.7, 0.03);
  // sombra del cajón sobre la primera lama
  const s = ctx.createLinearGradient(0, caja, 0, caja + 22 * esc);
  s.addColorStop(0, 'rgba(0,0,0,0.85)');
  s.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = s;
  ctx.fillRect(0, caja, w, 22 * esc);
}

function guias(ctx, m) {
  const { w, h, caja, guia, pie } = m;
  for (const lado of [-1, 1]) {
    const x0 = lado < 0 ? 0 : w - guia;
    const g = ctx.createLinearGradient(x0, 0, x0 + guia, 0);
    const borde = ['#070708', '#1e1e21', '#2a2a2e', '#111113', '#050506'];
    (lado < 0 ? borde : [...borde].reverse()).forEach((c, i) => g.addColorStop(i / 4, c));
    ctx.fillStyle = g;
    ctx.fillRect(x0, caja, guia, h - caja);
    // la lama entra en la guía: sombra hacia adentro
    const xi = lado < 0 ? guia : w - guia;
    const s = ctx.createLinearGradient(xi, 0, xi - lado * 14, 0);
    s.addColorStop(0, 'rgba(0,0,0,0.7)');
    s.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = s;
    ctx.fillRect(lado < 0 ? xi : xi - 14, caja, 14, h - caja - pie);
  }
}

// zócalo: perfil de aluminio negro con el filo de arriba que toma luz y el burlete de goma contra el piso
function zocalo(ctx, m) {
  const { w, h, pie, guia } = m;
  const y = h - pie;
  const g = ctx.createLinearGradient(0, y, 0, h);
  g.addColorStop(0, '#3a3a3f');
  g.addColorStop(0.07, '#232327');
  g.addColorStop(0.45, '#151518');
  g.addColorStop(0.8, '#0c0c0e');
  g.addColorStop(0.86, '#030303');
  g.addColorStop(1, '#000');
  ctx.fillStyle = g;
  ctx.fillRect(guia, y, w - guia * 2, pie);
  ctx.fillStyle = 'rgba(255,255,255,0.14)';
  ctx.fillRect(guia, y + 1, w - guia * 2, 1);
  grano(ctx, guia, y + 3, w - guia, h - pie * 0.2, 0.025);
  // sombra de la última lama sobre el zócalo
  const s = ctx.createLinearGradient(0, y - 8, 0, y);
  s.addColorStop(0, 'rgba(0,0,0,0)');
  s.addColorStop(1, 'rgba(0,0,0,0.6)');
  ctx.fillStyle = s;
  ctx.fillRect(guia, y - 8, w - guia * 2, 8);
}

// cuerpo del reflector (apagado): chapita al cajón, brazo y un tubo negro apuntando al logo
function reflector(ctx, l) {
  const { mx, my, px, py, dx, dy, largo, radio } = l;
  ctx.save();
  ctx.fillStyle = '#1f1f22';
  ctx.fillRect(mx - radio * 0.9, my - 2, radio * 1.8, 4);
  ctx.strokeStyle = '#18181b';
  ctx.lineWidth = radio * 0.36;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(mx, my);
  ctx.lineTo(px, py);
  ctx.stroke();
  ctx.translate(px, py);
  ctx.rotate(Math.atan2(dy, dx));
  ctx.shadowColor = 'rgba(0,0,0,0.7)';
  ctx.shadowBlur = radio;
  ctx.shadowOffsetY = radio * 0.4;
  const g = ctx.createLinearGradient(0, -radio, 0, radio);
  g.addColorStop(0, '#3b3b40');
  g.addColorStop(0.25, '#1d1d20');
  g.addColorStop(0.7, '#0b0b0c');
  g.addColorStop(1, '#151517');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.roundRect(-largo * 0.38, -radio, largo, radio * 2, radio * 0.45);
  ctx.fill();
  ctx.shadowColor = 'transparent';
  // aro de la boca
  ctx.fillStyle = '#2a2a2e';
  ctx.fillRect(largo * 0.55, -radio * 1.08, largo * 0.08, radio * 2.16);
  // tornillo de la articulación
  ctx.fillStyle = '#2f2f33';
  ctx.beginPath();
  ctx.arc(0, 0, radio * 0.32, 0, 7);
  ctx.fill();
  ctx.restore();
}

// boca del reflector prendida (va en el canvas de luz)
function boca(ctx, l, esc) {
  const { bx, by, dx, dy, radio } = l;
  ctx.save();
  ctx.translate(bx, by);
  ctx.rotate(Math.atan2(dy, dx));
  ctx.fillStyle = '#fff3d6';
  ctx.beginPath();
  ctx.ellipse(0, 0, radio * 0.32, radio * 0.95, 0, 0, 7);
  ctx.fill();
  ctx.restore();
  ctx.globalCompositeOperation = 'lighter';
  const r = 46 * esc;
  const g = ctx.createRadialGradient(bx, by, 0, bx, by, r);
  g.addColorStop(0, 'rgba(255,236,190,0.95)');
  g.addColorStop(0.25, 'rgba(255,170,80,0.45)');
  g.addColorStop(1, 'rgba(255,140,50,0)');
  ctx.fillStyle = g;
  ctx.fillRect(bx - r, by - r, r * 2, r * 2);
  ctx.globalCompositeOperation = 'source-over';
}

// haz de luz: cono desde la boca del reflector hacia el logo (en diagonal, no vertical)
function cono(ctx, l, alcance, apertura, paradas) {
  const { bx, by, dx, dy } = l;
  const nx = -dy, ny = dx;
  const ex = bx + dx * alcance, ey = by + dy * alcance;
  const r0 = l.radio * 0.8, r1 = alcance * Math.tan(apertura);
  const g = ctx.createLinearGradient(bx, by, ex, ey);
  for (const [o, c] of paradas) g.addColorStop(o, c);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(bx + nx * r0, by + ny * r0);
  ctx.lineTo(ex + nx * r1, ey + ny * r1);
  ctx.quadraticCurveTo(ex + dx * r1 * 0.5, ey + dy * r1 * 0.5, ex - nx * r1, ey - ny * r1);
  ctx.lineTo(bx - nx * r0, by - ny * r0);
  ctx.closePath();
  ctx.fill();
}

function silueta(logo, color) {
  const c = document.createElement('canvas');
  c.width = logo.naturalWidth || logo.width;
  c.height = logo.naturalHeight || logo.height;
  const b = c.getContext('2d');
  b.drawImage(logo, 0, 0);
  b.globalCompositeOperation = 'source-in';
  b.fillStyle = color;
  b.fillRect(0, 0, c.width, c.height);
  return c;
}

// ---------- canvas base: la persiana con las luces APAGADAS ----------
function pintarBase(ctx, m, logo) {
  const { w, h, caja, guia, pie, paso } = m;
  ctx.fillStyle = '#0b0b0c';
  ctx.fillRect(0, 0, w, h);
  lamas(ctx, guia, caja, w - guia, h - pie, paso, LAMA_APAGADA);
  grano(ctx, guia, caja, w - guia, h - pie, 0.025);
  // más oscura en los bordes
  const v = ctx.createRadialGradient(m.cx, m.cy, Math.min(w, h) * 0.2, m.cx, m.cy, Math.max(w, h) * 0.75);
  v.addColorStop(0, 'rgba(0,0,0,0)');
  v.addColorStop(1, 'rgba(0,0,0,0.55)');
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, w, h);
  // el logo apagado: pintado sobre la chapa, se adivina en la penumbra
  ctx.save();
  if ('filter' in ctx) ctx.filter = 'brightness(0.3) saturate(0.5)';
  ctx.globalAlpha = 0.9;
  ctx.drawImage(logo, m.x, m.y, m.ancho, m.alto);
  ctx.restore();
  guias(ctx, m);
  zocalo(ctx, m);
  cajon(ctx, m);
  for (const l of m.luces) reflector(ctx, l);
}

// las ranuras de las lamas pasan por encima del logo (está pintado sobre la chapa)
function ranurasSobreLogo(ctx, m, fuerza) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(m.x, m.y, m.ancho, m.alto);
  ctx.clip();
  for (let y = m.caja; y < m.h - m.pie; y += m.paso) {
    ctx.fillStyle = `rgba(0,0,0,${0.7 * fuerza})`;
    ctx.fillRect(m.x, y + m.paso * 0.86, m.ancho, m.paso * 0.1);
    ctx.fillStyle = `rgba(0,0,0,${0.25 * fuerza})`;
    ctx.fillRect(m.x, y + m.paso * 0.62, m.ancho, m.paso * 0.24);
  }
  ctx.restore();
}

// ---------- canvas de luz: lo que agregan los reflectores prendidos ----------
function pintarLuz(ctx, m, logo) {
  const { w, h, caja, guia, pie, paso, esc } = m;
  const dist = Math.hypot(m.cx - m.luces[0].bx, m.cy - m.luces[0].by);
  const alcance = dist * 1.35, apertura = 0.3;

  // 1) máscara: dónde pega la luz (dos conos que se cruzan en el logo + una pileta de luz sobre él)
  const [mc, mx] = lienzo(w, h);
  if ('filter' in mx) mx.filter = `blur(${Math.round(22 * esc)}px)`;
  for (const l of m.luces) {
    cono(mx, l, alcance, apertura, [[0, 'rgba(0,0,0,1)'], [0.18, 'rgba(0,0,0,0.75)'], [0.7, 'rgba(0,0,0,0.5)'], [1, 'rgba(0,0,0,0)']]);
  }
  mx.filter = 'none';
  const pileta = mx.createRadialGradient(m.cx, m.cy, 0, m.cx, m.cy, m.alto * 0.95);
  pileta.addColorStop(0, 'rgba(0,0,0,0.8)');
  pileta.addColorStop(1, 'rgba(0,0,0,0)');
  mx.fillStyle = pileta;
  mx.fillRect(0, 0, w, h);

  // 2) las lamas iluminadas en cálido, recortadas por la máscara (el filo de cada lama brilla, las ranuras no)
  const [lc, lx] = lienzo(w, h);
  lamas(lx, guia, caja, w - guia, h - pie, paso, LAMA_LUZ);
  grano(lx, guia, caja, w - guia, h - pie, 0.04);
  lx.globalCompositeOperation = 'destination-in';
  lx.drawImage(mc, 0, 0, w, h);
  ctx.drawImage(lc, 0, 0, w, h);

  // 3) el logo encendido: sombra hacia abajo (la luz viene de arriba), brillo aqua y el reflejo cálido de los reflectores
  ctx.save();
  if ('filter' in ctx) ctx.filter = `blur(${Math.max(3, Math.round(m.alto * 0.02))}px)`;
  ctx.globalAlpha = 0.75;
  ctx.drawImage(silueta(logo, '#000'), m.x, m.y + m.alto * 0.035, m.ancho, m.alto);
  ctx.restore();
  ctx.save();
  ctx.shadowColor = 'rgba(143,220,226,0.75)';
  ctx.shadowBlur = m.alto * 0.12;
  ctx.drawImage(logo, m.x, m.y, m.ancho, m.alto);
  ctx.shadowColor = 'rgba(255,190,110,0.5)';
  ctx.shadowBlur = m.alto * 0.025;
  ctx.drawImage(logo, m.x, m.y, m.ancho, m.alto);
  ctx.restore();
  // brillo cálido sobre el logo, más fuerte arriba (de donde viene la luz)
  const [bc, bx] = lienzo(w, h);
  bx.drawImage(logo, m.x, m.y, m.ancho, m.alto);
  bx.globalCompositeOperation = 'source-in';
  const tinte = bx.createLinearGradient(0, m.y, 0, m.y + m.alto);
  tinte.addColorStop(0, 'rgba(255,214,150,0.38)');
  tinte.addColorStop(0.6, 'rgba(255,190,120,0.1)');
  tinte.addColorStop(1, 'rgba(255,190,120,0)');
  bx.fillStyle = tinte;
  bx.fillRect(0, 0, w, h);
  ctx.globalCompositeOperation = 'lighter';
  ctx.drawImage(bc, 0, 0, w, h);
  ctx.globalCompositeOperation = 'source-over';
  ranurasSobreLogo(ctx, m, 0.45);

  // 4) el haz en el aire (polvo iluminado), suave
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  if ('filter' in ctx) ctx.filter = `blur(${Math.round(16 * esc)}px)`;
  for (const l of m.luces) {
    cono(ctx, l, alcance * 0.92, apertura * 0.8, [[0, 'rgba(255,200,130,0.34)'], [0.4, 'rgba(255,170,90,0.12)'], [1, 'rgba(255,150,70,0)']]);
  }
  ctx.restore();

  // 5) las bocas de los reflectores
  for (const l of m.luces) boca(ctx, l, esc);
}

// ---------- tiempos ----------
const PRENDIDA = 800;  // ms con las luces prendidas antes de titilar
const TITILA = 900;    // los dos titileos
const CERRADA = PRENDIDA + TITILA + 150;
const SUBIDA = 3400;   // ms que tarda en subir entera
// arranca suave (como un motor que toma fuerza), sube pareja y frena suave arriba
const CURVA = 'cubic-bezier(0.55, 0.05, 0.3, 1)';
// opacidad de la luz durante el titileo [ms, opacidad]: se apaga, chispea, prende · se apaga, prende y queda
const PARPADEO = [[0, 1], [40, 0.05], [130, 0.12], [170, 0.04], [210, 1], [380, 1], [420, 0.05], [540, 0.05], [580, 1], [900, 1]];

export async function persiana({ alAbrir } = {}) {
  const raiz = document.getElementById('persiana');
  const hoja = raiz.querySelector('.persiana-hoja');
  const base = raiz.querySelector('.persiana-base');
  const luz = raiz.querySelector('.persiana-luces');
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
  await (logo.complete && logo.naturalWidth ? Promise.resolve() : new Promise((ok) => { logo.onload = logo.onerror = () => ok(); }));

  DPR = Math.min(devicePixelRatio || 1, 2);
  const w = raiz.clientWidth, h = raiz.clientHeight;
  const m = medidas(w, h, logo);
  for (const [c, pintar] of [[base, pintarBase], [luz, pintarLuz]]) {
    c.width = Math.ceil(w * DPR);
    c.height = Math.ceil(h * DPR);
    const ctx = c.getContext('2d');
    ctx.scale(DPR, DPR);
    pintar(ctx, m, logo);
  }
  ranurasSobreLogo(base.getContext('2d'), m, 0.5);
  raiz.classList.add('lista');

  const arriba = 'translate3d(0, calc(-100% - 40px), 0)';
  if (congelada !== null) {
    hoja.style.transform = `translate3d(0, ${-congelada * 100}%, 0)`;
    alAbrir?.();
    return;
  }

  // dos cuadros para que los canvas recién pintados ya estén en la GPU antes de animarlos
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
