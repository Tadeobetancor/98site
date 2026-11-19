import { PRODUCTOS, WHATSAPP, INSTAGRAM, INFO_TIENDA, GUIA_TALLES, PAGOS, precio, foto, galeria, marca, conTransferencia, cuota, descuento, OFERTA, ahorroOferta } from './datos.js';
import { iniciarPared } from './pared.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const wa = (texto) => `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(texto)}`;
const prod = (id) => PRODUCTOS.find((p) => p.id === id);
const tallesDisponibles = (p) => Object.entries(p.talles).filter(([, s]) => s > 0).map(([t]) => t);
// precio con el anterior tachado y el % de descuento, si tiene
const precioHTML = (p) => (p.antes ? `<s>${precio(p.antes)}</s> ` : '') + `<b>${precio(p.precio)}</b>` + (p.antes ? ` <em class="off">-${descuento(p)}%</em>` : '');

// ---------- animaciones (Web Animations API: entrada Y salida de cada panel) ----------
const SALE = 'cubic-bezier(0.16, 1, 0.3, 1)';   // arranca rápido y frena suave
const ENTRA = 'cubic-bezier(0.7, 0, 0.84, 0)';  // acelera al irse (solo para cosas chicas, ej. quitar del carrito)
// para cerrar paneles: se van DESLIZANDO enteros, arrancan suave y frenan suave (nada se desvanece de golpe)
const CIERRA = 'cubic-bezier(0.45, 0, 0.2, 1)';
const MS_CIERRE = 560;
// ---------- RÁFAGA: viento con espuma de mar que barre la pantalla al abrir y al cerrar un producto ----------
// (referencia: Animaciones estetica y fuente.mp4, ~0:04: el cambio de producto con una niebla que cruza la tarjeta).
// Una banda de espuma aqua + salpicaduras cruza de un lado al otro; lo que queda debajo se desenfoca con el viento,
// y la ficha se recorta justo DETRÁS del frente de la ráfaga: aparece (o se va) "barrida por el viento".
const rafaga = Object.assign(document.createElement('div'), {
  className: 'rafaga', hidden: true,
  innerHTML: '<div class="rafaga-velo"></div><div class="rafaga-niebla"></div><div class="rafaga-espuma e1"></div><div class="rafaga-espuma e2"></div><div class="rafaga-gotas"></div>',
});
document.body.append(rafaga);
const ANCHO_RAFAGA = 1.5;  // la banda mide 1,5 pantallas
const FRENTE = 0.7;        // dónde está lo más denso de la espuma (0 = cola, 1 = punta)
const curvaViento = (t) => 1 - Math.pow(1 - t, 2.1); // entra con todo y se va frenando
// modo: 'mostrar' (la ficha aparece detrás de la ráfaga) · 'ocultar' (se la lleva) · 'pasar' (solo pasa por encima)
let rafagaGen = 0;
function soplar({ ms, haciaDerecha = true, el = null, modo = 'pasar' }) {
  const W = innerWidth, ancho = W * ANCHO_RAFAGA;
  // una ráfaga nueva corta la anterior (si no, al terminar la vieja escondía la capa en medio de la nueva)
  const gen = ++rafagaGen;
  rafaga.getAnimations().forEach((a) => a.cancel());
  rafaga.hidden = false;
  rafaga.style.width = `${ancho}px`;
  const N = 18, cuadros = [], recortes = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N, e = curvaViento(t);
    const tx0 = -ancho + (W + ancho) * e;              // de izquierda a derecha
    const tx = haciaDerecha ? tx0 : W - ancho - tx0;   // espejado si va para el otro lado
    const frente = haciaDerecha ? tx + ancho * FRENTE : tx + ancho * (1 - FRENTE);
    const f = Math.max(0, Math.min(W, frente));
    cuadros.push({
      offset: t,
      transform: `translateX(${tx}px)${haciaDerecha ? '' : ' scaleX(-1)'}`,
      opacity: t < 0.08 ? t / 0.08 : t > 0.8 ? (1 - t) / 0.2 : 1,
    });
    // qué parte de la ficha se ve: detrás del frente (mostrar) o delante (ocultar)
    let izq = 0, der = 0;
    if (modo === 'mostrar') haciaDerecha ? (der = W - f) : (izq = f);
    if (modo === 'ocultar') haciaDerecha ? (izq = f) : (der = W - f);
    recortes.push({ offset: t, clipPath: `inset(0px ${der}px 0px ${izq}px)` });
  }
  const anim = rafaga.animate(cuadros, { duration: ms, easing: 'linear', fill: 'forwards' });
  if (el && modo !== 'pasar') animar(el, recortes, ms, { easing: 'linear' });
  return anim.finished.catch(() => {}).then(() => { if (gen === rafagaGen) rafaga.hidden = true; });
}
let vientoHaciaDerecha = true; // hacia dónde sopló al abrir (al cerrar vuelve para el otro lado)
function animar(el, cuadros, ms, opciones = {}) {
  el.getAnimations().forEach((a) => a.cancel());
  return el.animate(cuadros, { duration: ms, easing: SALE, fill: 'both', ...opciones });
}
// los hijos aparecen en cascada
function cascada(els, { desde = 'translateY(16px)', espera = 120, paso = 45, ms = 600 } = {}) {
  els.forEach((el, i) => animar(el, [{ opacity: 0, transform: desde }, { opacity: 1, transform: 'none' }], ms, { delay: espera + i * paso }));
}
const terminar = (anim) => anim.finished.catch(() => {});

// fondo del perchero: la pared blanca con grafitis gastados (pared.js). La de madera quedó guardada: ?fondo=madera
const FONDO = new URLSearchParams(location.search).get('fondo') === 'madera' ? 'madera' : 'pared';
$('.perchero').classList.add('fondo-' + FONDO);
const pared = FONDO === 'pared' ? iniciarPared($('.perchero')) : { glitch() {} };

// ---------- links de redes ----------
$$('[data-whatsapp]').forEach((a) => (a.href = wa('¡Hola! Tengo una consulta')));
$$('[data-instagram]').forEach((a) => (a.href = INSTAGRAM));

// ---------- glitch corto: al tocar el logo / las flechas, y en el logo cada 5 segundos ----------
function glitch(el) {
  el.classList.remove('glitcheando');
  void el.offsetWidth;
  el.classList.add('glitcheando');
  setTimeout(() => el.classList.remove('glitcheando'), 420);
}
document.addEventListener('pointerdown', (e) => {
  const el = e.target.closest('.barra-logo img');
  if (el) glitch(el);
});
setInterval(() => { if (!document.hidden) glitch($('.barra-logo img')); }, 5000);

// ---------- header: al bajar queda blanco con un poco de transparencia y difuminado ----------
const barra = $('.barra');
const alBajar = () => barra.classList.toggle('flotando', scrollY > 8);
addEventListener('scroll', alBajar, { passive: true });
alBajar();

function desbloquear() {
  if ($('.ficha').hidden && $('.carrito').hidden && $('.menu').hidden && $('.visor').hidden) document.body.classList.remove('bloqueado');
}

// ---------- menú del celular: secciones con foto, recién colgadas y el logo al final ----------
const menu = $('.menu');
const panelMenu = $('.menu-panel');
const SECCIONES = [
  { nombre: 'Perchero', href: '#inicio', img: PRODUCTOS[0] },
  { nombre: 'Shop', href: '#coleccion', filtro: 'todo', n: PRODUCTOS.length, img: PRODUCTOS[1] },
  ...[...new Set(PRODUCTOS.map(marca))].map((m) => {
    const de = PRODUCTOS.filter((p) => marca(p) === m);
    return { nombre: m, href: '#coleccion', filtro: m, n: de.length, img: de[0] };
  }),
];
$('.menu-links').innerHTML = SECCIONES.map((s) =>
  `<a href="${s.href}" ${s.filtro ? `data-filtro="${s.filtro}"` : ''}><b>${s.nombre}</b><small>${s.n ? s.n : ''}</small><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg></a>`).join('');
$('.menu-nuevas-lista').innerHTML = PRODUCTOS.slice(0, 6).map((p) =>
  `<button type="button" data-nueva="${p.id}"><img src="${foto(p)}" alt="" loading="lazy"><b>${p.nombre}</b><small>${precio(p.precio)}</small></button>`).join('');

function abrirMenu() {
  menu.hidden = false;
  $('.barra-menu').setAttribute('aria-expanded', 'true');
  document.body.classList.add('bloqueado');
  animar(menu, [{ opacity: 0 }, { opacity: 1 }], 350);
  animar(panelMenu, [{ transform: 'translateX(-100%)' }, { transform: 'none' }], 650);
  cascada([$('.menu-cabeza'), ...$$('.menu-links a'), $('.menu-nuevas'), $('.menu-pie')], { desde: 'translateX(-24px)', espera: 140, paso: 50 });
}
async function cerrarMenu() {
  if (menu.hidden) return;
  $('.barra-menu').setAttribute('aria-expanded', 'false');
  animar(menu, [{ opacity: 1 }, { opacity: 0 }], MS_CIERRE, { easing: CIERRA });
  await terminar(animar(panelMenu, [{ transform: 'none' }, { transform: 'translateX(-100%)' }], MS_CIERRE, { easing: CIERRA }));
  menu.hidden = true;
  desbloquear();
}
$('.barra-menu').addEventListener('click', abrirMenu);
menu.addEventListener('click', async (e) => {
  const nueva = e.target.closest('[data-nueva]');
  if (nueva) { const r = nueva.querySelector('img').getBoundingClientRect(); await cerrarMenu(); abrirFicha(prod(nueva.dataset.nueva), r); return; }
  const link = e.target.closest('a[href^="#"]');
  if (link) {
    // cierra con animación y recién después baja a la sección
    e.preventDefault();
    if (link.dataset.filtro) filtrar(link.dataset.filtro);
    await cerrarMenu();
    $(link.getAttribute('href'))?.scrollIntoView({ behavior: 'smooth' });
    return;
  }
  if (e.target === menu || e.target.closest('.cerrar')) cerrarMenu();
});

// ---------- carrito ----------
const carrito = (() => {
  try { return JSON.parse(localStorage.getItem('98v-carrito')) || []; } catch { return []; }
})().filter((it) => prod(it.id));
const guardar = () => { try { localStorage.setItem('98v-carrito', JSON.stringify(carrito)); } catch {} };
const cuenta = $('.barra-cuenta');
const capaCarrito = $('.carrito');
const panelCarrito = $('.carrito-panel');

function pintarCarrito() {
  $('.carrito-lista').innerHTML = carrito
    .map((it, i) => {
      const p = prod(it.id);
      return `<li><img src="${foto(p)}" alt=""><div><b>${p.nombre}</b><small>Talle ${it.talle} · ${precio(p.precio)}</small></div><button type="button" data-quitar="${i}">Quitar</button></li>`;
    })
    .join('');
  const subtotal = carrito.reduce((s, it) => s + prod(it.id).precio, 0);
  const ahorro = ahorroOferta(subtotal, carrito.length);
  const total = subtotal - ahorro;
  const pct = Math.round(OFERTA.descuento * 100);
  const faltan = OFERTA.cantidad - carrito.length;
  // banda de la oferta: cuánto falta para el combo o cuánto se ahorra
  const oferta = $('.carrito-oferta');
  oferta.classList.toggle('activa', ahorro > 0);
  oferta.style.setProperty('--avance', Math.min(1, carrito.length / OFERTA.cantidad));
  $('.carrito-oferta-texto').innerHTML = ahorro > 0
    ? `<b>Combo activado</b> · ahorrás ${precio(ahorro)}`
    : carrito.length === 0
      ? `Llevate ${OFERTA.cantidad} mallas y tenés <b>${pct}% OFF</b>`
      : `Sumá ${faltan === 1 ? 'otra malla' : faltan + ' mallas más'} y tenés <b>${pct}% OFF</b> en todo`;
  $('.carrito-subtotal').hidden = $('.carrito-ahorro').hidden = ahorro === 0;
  $('.carrito-subtotal b').textContent = precio(subtotal);
  $('.carrito-ahorro span').textContent = `Combo ${OFERTA.cantidad}+ mallas · ${pct}% OFF`;
  $('.carrito-ahorro b').textContent = '−' + precio(ahorro);
  $('.carrito-total b').textContent = precio(total);
  $('.carrito-n').textContent = carrito.length ? `(${carrito.length})` : '';
  $('.carrito-vacio').hidden = carrito.length > 0;
  $('.carrito-panel > footer').hidden = carrito.length === 0;
  cuenta.hidden = carrito.length === 0;
  cuenta.textContent = carrito.length;
  const texto = '¡Hola! Quiero comprar:\n' +
    carrito.map((it) => { const p = prod(it.id); return `• ${p.nombre} (talle ${it.talle}) ${precio(p.precio)}`; }).join('\n') +
    (ahorro ? `\nSubtotal: ${precio(subtotal)}\nCombo ${pct}% OFF: −${precio(ahorro)}` : '') +
    `\nTotal: ${precio(total)}`;
  $('.carrito-enviar').href = wa(texto);
  const sugeridas = PRODUCTOS.filter((p) => !carrito.some((it) => it.id === p.id)).slice(0, 2);
  $('.carrito-combina').hidden = carrito.length === 0 || sugeridas.length === 0;
  $('.carrito-combina-lista').innerHTML = sugeridas
    .map((p) => `<button type="button" data-sugerida="${p.id}"><img src="${foto(p)}" alt=""><span><b>${p.nombre}</b><small>${precio(p.precio)}</small>${faltan === 1 ? `<em>Activa el ${pct}% OFF</em>` : ''}</span></button>`)
    .join('');
}

function abrirCarrito() {
  capaCarrito.hidden = false;
  document.body.classList.add('bloqueado');
  animar(capaCarrito, [{ opacity: 0 }, { opacity: 1 }], 350);
  animar(panelCarrito, [{ transform: 'translateX(100%)' }, { transform: 'none' }], 650);
  cascada([...$$('.carrito-panel > header, .carrito-oferta, .carrito-lista li, .carrito-vacio, .carrito-combina, .carrito-panel > footer')].filter((x) => !x.hidden), { desde: 'translateX(28px)', espera: 160, paso: 60 });
}
async function cerrarCarrito() {
  if (capaCarrito.hidden) return;
  animar(capaCarrito, [{ opacity: 1 }, { opacity: 0 }], MS_CIERRE, { easing: CIERRA });
  await terminar(animar(panelCarrito, [{ transform: 'none' }, { transform: 'translateX(100%)' }], MS_CIERRE, { easing: CIERRA }));
  capaCarrito.hidden = true;
  desbloquear();
}
$('.barra-carrito').addEventListener('click', abrirCarrito);
$$('[data-abrir-carrito]').forEach((b) => b.addEventListener('click', abrirCarrito));
$('.carrito .cerrar').addEventListener('click', cerrarCarrito);
capaCarrito.addEventListener('click', async (e) => {
  if (e.target === e.currentTarget) return cerrarCarrito();
  const sug = e.target.closest('[data-sugerida]');
  if (sug) { const r = sug.querySelector('img').getBoundingClientRect(); await cerrarCarrito(); abrirFicha(prod(sug.dataset.sugerida), r); return; }
  const q = e.target.closest('[data-quitar]');
  if (q) {
    const li = q.closest('li');
    await terminar(animar(li, [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateX(40px)' }], 300, { easing: ENTRA }));
    carrito.splice(+q.dataset.quitar, 1);
    guardar();
    pintarCarrito();
  }
});

// la foto vuela hasta el carrito
function volarAlCarrito(src, desde, alTerminar) {
  const hasta = $('.barra-carrito svg').getBoundingClientRect();
  const clon = new Image();
  clon.src = src;
  clon.className = 'vuela';
  Object.assign(clon.style, { left: desde.left + 'px', top: desde.top + 'px', width: desde.width + 'px', height: desde.height + 'px' });
  document.body.appendChild(clon);
  const dx = hasta.left + hasta.width / 2 - (desde.left + desde.width / 2);
  const dy = hasta.top + hasta.height / 2 - (desde.top + desde.height / 2);
  clon.animate(
    [
      { transform: 'translate(0,0) scale(1) rotate(0)', opacity: 1 },
      { transform: `translate(${dx * 0.35}px, ${dy * 0.2 - 90}px) scale(0.55) rotate(-8deg)`, opacity: 1, offset: 0.45 },
      { transform: `translate(${dx}px, ${dy}px) scale(0.05) rotate(14deg)`, opacity: 0.5 },
    ],
    { duration: 800, easing: 'cubic-bezier(.5,0,.3,1)' }
  ).onfinish = () => {
    clon.remove();
    cuenta.classList.remove('salta');
    void cuenta.offsetWidth;
    cuenta.classList.add('salta');
    alTerminar?.();
  };
}

function agregar(p, talle, desde, alTerminar) {
  carrito.push({ id: p.id, talle });
  guardar();
  pintarCarrito();
  if (desde) volarAlCarrito(foto(p), desde, alTerminar);
  else alTerminar?.();
}

// ---------- tarjetas de producto ----------
function tarjeta(p, i = 0) {
  const talles = tallesDisponibles(p);
  // todas las fotos de la malla (sin el video): se pasan deslizando con el dedo o con las flechas en compu
  const fotos = galeria(p).filter((src) => !src.endsWith('.mp4'));
  const varias = fotos.length > 1;
  return `
  <article class="tarjeta revelar" data-id="${p.id}" style="transition-delay:${(i % 3) * 70}ms">
    <div class="tarjeta-foto">
      <div class="tarjeta-pista">${fotos.map((src, k) => `<figure class="tarjeta-lamina"><img src="${src}" alt="${k ? '' : p.nombre}" class="${k ? '' : 'recorte'}" loading="lazy" decoding="async"></figure>`).join('')}</div>
      ${varias ? `<button class="tarjeta-nav ant" type="button" aria-label="Foto anterior" disabled><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M15 5l-7 7 7 7"/></svg></button><button class="tarjeta-nav sig" type="button" aria-label="Foto siguiente"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 5l7 7-7 7"/></svg></button>
      <div class="tarjeta-puntos" aria-hidden="true">${fotos.map((_, k) => `<i${k ? '' : ' class="on"'}></i>`).join('')}</div>` : ''}
      <div class="tarjeta-rapido"><small>Añadir</small><div>${talles.map((t) => `<button type="button" data-rapido="${t}">${t}</button>`).join('')}</div></div>
    </div>
    <div class="tarjeta-texto">
      <h3>${p.nombre}</h3>
      <p class="tarjeta-precio">${precioHTML(p)}</p>
      <p class="tarjeta-talles">Talle ${talles.join(' · ')}</p>
    </div>
  </article>`;
}
// flechas de la tarjeta: pasan de foto sin abrir la ficha
function navTarjeta(e) {
  const b = e.target.closest('.tarjeta-nav');
  if (!b) return false;
  const pista = b.closest('.tarjeta-foto').querySelector('.tarjeta-pista');
  const i = Math.round(pista.scrollLeft / pista.clientWidth) + (b.classList.contains('sig') ? 1 : -1);
  pista.scrollTo({ left: i * pista.clientWidth, behavior: 'smooth' });
  return true;
}
// al deslizar (dedo o flecha) se actualizan los puntitos y qué flecha se puede usar
document.addEventListener('scroll', (e) => {
  const pista = e.target;
  if (!pista.classList?.contains('tarjeta-pista')) return;
  const foto = pista.parentElement;
  const n = pista.children.length;
  const i = Math.min(n - 1, Math.round(pista.scrollLeft / Math.max(1, pista.clientWidth)));
  foto.querySelectorAll('.tarjeta-puntos i').forEach((p, k) => p.classList.toggle('on', k === i));
  const ant = foto.querySelector('.tarjeta-nav.ant'), sig = foto.querySelector('.tarjeta-nav.sig');
  if (ant) ant.disabled = i === 0;
  if (sig) sig.disabled = i === n - 1;
}, { capture: true, passive: true });
function clicTarjeta(e) {
  if (navTarjeta(e)) return;
  const t = e.target.closest('.tarjeta');
  if (!t) return;
  const p = prod(t.dataset.id);
  const rapido = e.target.closest('[data-rapido]');
  if (rapido) { agregar(p, rapido.dataset.rapido, t.querySelector('img').getBoundingClientRect()); return; }
  abrirFicha(p, t.querySelector('.tarjeta-foto').getBoundingClientRect());
}

// ---------- colección con filtros por marca ----------
const grilla = $('.coleccion .grilla');
grilla.innerHTML = PRODUCTOS.map(tarjeta).join('');
grilla.addEventListener('click', clicTarjeta);
const MARCAS = ['todo', ...new Set(PRODUCTOS.map(marca))];
$('.filtros').innerHTML = MARCAS.map((m) => {
  const n = m === 'todo' ? PRODUCTOS.length : PRODUCTOS.filter((p) => marca(p) === m).length;
  return `<button type="button" role="tab" data-filtro="${m}" aria-selected="${m === 'todo'}">${m === 'todo' ? 'Todo' : m}<small>${n}</small></button>`;
}).join('');
function filtrar(m) {
  $$('.filtros button').forEach((b) => b.setAttribute('aria-selected', b.dataset.filtro === m));
  const visibles = [];
  $$('.tarjeta', grilla).forEach((t) => {
    t.hidden = m !== 'todo' && marca(prod(t.dataset.id)) !== m;
    if (!t.hidden) { t.classList.add('visto'); visibles.push(t); }
  });
  cascada(visibles, { desde: 'translateY(22px) scale(0.98)', espera: 0, paso: 55, ms: 650 });
}
document.addEventListener('click', (e) => {
  const f = e.target.closest('[data-filtro]');
  if (f && !f.closest('.menu')) filtrar(f.dataset.filtro);
});

// ---------- ficha de producto ----------
const ficha = $('.ficha');
const pista = $('.ficha-pista');
let actual = null, talleElegido = null, indice = 0, laminas = [], origenFicha = null;

// ---------- info de la tienda: visual (íconos, pasos, tabla) dentro de acordeones animados ----------
const ICONOS = {
  pin: '<path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
  moto: '<circle cx="6" cy="17" r="3"/><circle cx="18" cy="17" r="3"/><path d="M6 17h4l3-6h3l2 6M13 11l-2-4H8M16 11l-1-3h3"/>',
  caja: '<path d="M3 7l9-4 9 4v10l-9 4-9-4z"/><path d="M3 7l9 4 9-4M12 11v10"/>',
  banco: '<path d="M3 10l9-6 9 6M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 20h18"/>',
  mp: '<path d="M3 12c3-4 6-4 9 0s6 4 9 0"/><path d="M3 12c3 4 6 4 9 0s6-4 9 0"/>',
  efectivo: '<rect x="3" y="6" width="18" height="12" rx="1.5"/><circle cx="12" cy="12" r="3"/><path d="M6 9v.01M18 15v.01"/>',
  lavar: '<path d="M3 8l2 11h14l2-11"/><path d="M3 8c2 1.5 4 1.5 6 0s4-1.5 6 0 4 1.5 6 0"/><path d="M10 14h4"/>',
  secarropas: '<rect x="4" y="4" width="16" height="16" rx="1"/><circle cx="12" cy="12" r="5"/><path d="M3 3l18 18"/>',
  plancha: '<path d="M4 17h16l-1.5-6.5A3 3 0 0 0 15.6 8H8"/><path d="M3 4l18 15"/>',
  sombra: '<rect x="4" y="4" width="16" height="16" rx="1"/><path d="M4 9l5-5M4 14l10-10M4 19L19 4M9 19L19 9"/>',
};
const icono = (n) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONOS[n] || ''}</svg>`;

// dibujo de una malla con las medidas A (cintura) y B (largo)
const DIBUJO_MALLA = `<svg class="guia-dibujo" viewBox="0 0 220 180" aria-hidden="true">
  <path class="guia-malla" d="M46 30h120v14H46zM46 44l-12 104 68 9 4-60 4 60 68-9-12-104z"/>
  <path class="guia-malla-detalle" d="M106 44v18M96 31l-2 22M116 31l2 22M60 118l30 4"/>
  <g class="guia-medida"><path d="M46 16h120M46 11v10M166 11v10"/><text x="106" y="10">A</text></g>
  <g class="guia-medida"><path d="M192 30v120M187 30h10M187 150h10"/><text x="204" y="94">B</text></g>
</svg>`;

function bloqueInfo(x) {
  if (x.tipo === 'descripcion') return '<ul class="ficha-detalles"></ul>';
  if (x.tipo === 'guia') return `<div class="guia">${DIBUJO_MALLA}
    <table class="guia-tabla"><thead><tr><th>Talle</th><th>A · Cintura</th><th>B · Largo</th></tr></thead>
    <tbody>${GUIA_TALLES.map((g) => `<tr data-talle="${g.talle}"><td><b>${g.talle}</b></td><td>${g.a} cm</td><td>${g.b} cm</td></tr>`).join('')}</tbody></table>
    <p class="guia-tip"><b>¿Cómo medir?</b> Apoyá una malla que te quede bien sobre una mesa, sin estirarla. <b>A:</b> la cintura de punta a punta. <b>B:</b> de la cintura a la botamanga.</p></div>`;
  if (x.tipo === 'tarjetas') return `<div class="info-tarjetas">${x.items.map((i) =>
    `<div class="info-tarjeta">${icono(i.icono)}<b>${i.titulo}</b><span>${i.texto}</span>${i.destaque ? `<em>${i.destaque}</em>` : ''}</div>`).join('')}</div>`;
  if (x.tipo === 'chips') return `<div class="info-chips">${x.items.map((i) => `<span>${icono(i.icono)}${i.titulo}</span>`).join('')}</div>${x.nota ? `<p class="info-nota">${x.nota}</p>` : ''}`;
  if (x.tipo === 'pasos') return `<ol class="info-pasos">${x.items.map((i) => `<li><b>${i.titulo}</b><span>${i.texto}</span></li>`).join('')}</ol>`;
  if (x.tipo === 'cuidados') return `<div class="info-cuidados">${x.items.map((i) => `<div>${icono(i.icono)}<span>${i.texto}</span></div>`).join('')}</div>`;
  return `<p>${x.texto || ''}</p>`;
}
$('.acordeon').innerHTML = INFO_TIENDA.map((x) =>
  `<details id="acordeon-${x.id}"><summary>${x.titulo}</summary><div class="acordeon-cuerpo"><div class="acordeon-contenido">${bloqueInfo(x)}</div></div></details>`).join('');

// la tabla de talles marca el talle elegido y los que hay de esta malla
function marcarGuia() {
  const hay = actual ? tallesDisponibles(actual) : [];
  $$('.guia-tabla tr[data-talle]').forEach((tr) => {
    tr.classList.toggle('elegido', tr.dataset.talle === talleElegido);
    tr.classList.toggle('sin-stock', !hay.includes(tr.dataset.talle));
  });
}
function acordeon(d, abrir = !d.open) {
  const cuerpo = d.querySelector('.acordeon-cuerpo');
  d.classList.toggle('abierto', abrir);
  if (abrir) {
    d.open = true;
    const h = cuerpo.scrollHeight;
    animar(cuerpo, [{ height: '0px', opacity: 0 }, { height: h + 'px', opacity: 1 }], 500).onfinish = () => cuerpo.getAnimations().forEach((a) => a.cancel());
    cascada([...cuerpo.querySelectorAll('.guia-dibujo, .guia-tabla tr, .guia-tip, .info-tarjeta, .info-chips > span, .info-nota, .info-pasos li, .info-cuidados > div, .ficha-detalles li')], { espera: 80, paso: 50, ms: 500 });
  } else {
    const h = cuerpo.offsetHeight;
    animar(cuerpo, [{ height: h + 'px', opacity: 1 }, { height: '0px', opacity: 0 }], 350).onfinish = () => { d.open = false; cuerpo.getAnimations().forEach((a) => a.cancel()); };
  }
}
$('.acordeon').addEventListener('click', (e) => {
  const sum = e.target.closest('summary');
  if (!sum) return;
  e.preventDefault();
  acordeon(sum.parentElement);
});

function notaTalle(alerta = false) {
  marcarGuia();
  const nota = $('.ficha-talle-nota');
  const unico = tallesDisponibles(actual).length === 1;
  nota.textContent = alerta ? 'Elegí un talle para añadirla al carrito' : talleElegido && unico ? 'Único talle disponible' : '';
  nota.classList.toggle('alerta', alerta);
}

// galería: en celular las fotos asoman (84% de ancho), así que se calcula por la posición de cada foto
const posLamina = (i) => { const l = $$('.lamina')[i]; return l ? l.offsetLeft - parseFloat(getComputedStyle(pista).paddingLeft) : 0; };
function irA(i, suave = true) {
  i = Math.max(0, Math.min(laminas.length - 1, i));
  pista.scrollTo({ left: posLamina(i), behavior: suave ? 'smooth' : 'instant' });
  marcar(i);
}
function marcar(i) {
  indice = i;
  $$('.ficha-miniaturas button').forEach((b, k) => b.setAttribute('aria-selected', k === i));
  $$('.ficha-barras i').forEach((p, k) => p.classList.toggle('on', k === i));
  $('.ficha-contador').textContent = laminas.length > 1 ? `${i + 1} / ${laminas.length}` : '';
  $('.ficha-nav.ant').disabled = i === 0;
  $('.ficha-nav.sig').disabled = i === laminas.length - 1;
  $$('.lamina').forEach((l, k) => {
    const v = l.querySelector('video');
    if (v) k === i ? v.play().catch(() => {}) : v.pause();
  });
}

// rectángulo → recorte (clip-path) para que la ficha se despliegue desde ahí
const recorte = (r) => `inset(${Math.max(0, r.top)}px ${Math.max(0, innerWidth - r.left - r.width)}px ${Math.max(0, innerHeight - r.top - r.height)}px ${Math.max(0, r.left)}px)`;

// fichaGen: cada apertura invalida un cierre que esté en curso. BUG que arregla: cerrar un producto y tocar otro antes
// de que termine la ráfaga de cierre → la ficha nueva empezaba a abrirse y el cierre viejo, al terminar, la escondía
// ("se ve la animación pero no abre").
let fichaGen = 0, cerrandoFicha = false;
export function abrirFicha(p, origen = null) {
  fichaGen++;
  const interrumpeCierre = cerrandoFicha;
  cerrandoFicha = false;
  actual = p;
  talleElegido = null;
  origenFicha = origen;
  const talles = Object.entries(p.talles);
  const disponibles = tallesDisponibles(p);
  if (disponibles.length === 1) talleElegido = disponibles[0];
  $('.migas-actual').textContent = p.nombre;
  $('.ficha-nombre').textContent = p.nombre;
  $('.ficha-precio').textContent = precio(p.precio);
  $('.ficha-antes').textContent = p.antes ? precio(p.antes) : '';
  $('.ficha-descuento').textContent = p.antes ? `-${descuento(p)}%` : '';
  $('.ficha-descuento').hidden = !p.antes;
  $('.pago-cuotas').innerHTML = `<b>${PAGOS.cuotas} cuotas sin interés</b> de ${precio(cuota(p.precio))}`;
  $('.pago-transferencia').innerHTML = `<b>${precio(conTransferencia(p.precio))}</b> con transferencia`;
  $('.pago-combo').innerHTML = `<b>Llevate ${OFERTA.cantidad} y tenés ${Math.round(OFERTA.descuento * 100)}% OFF</b> en el carrito`;
  $('.ficha-detalles').innerHTML = p.info.map((t) => `<li>${t}</li>`).join('');
  $('.ficha-talles').innerHTML = talles
    .map(([t, s]) => `<button type="button" data-talle="${t}" ${s ? '' : 'disabled'} aria-pressed="${t === talleElegido}">${t}</button>`)
    .join('');
  notaTalle();

  laminas = galeria(p);
  pista.innerHTML = laminas.map((src, i) => {
    const media = src.endsWith('.mp4')
      ? `<video src="${src}" muted loop playsinline preload="metadata"></video>`
      : `<img src="${src}" alt="${p.nombre}" class="${src.includes('/prendas/') ? 'recorte' : ''}" ${i > 1 ? 'loading="lazy"' : i === 0 ? 'fetchpriority="high"' : ''}>`; // la 1ª y la que asoma, sin esperar
    return `<figure class="lamina" data-i="${i}">${media}</figure>`;
  }).join('');
  $('.ficha-miniaturas').innerHTML = laminas
    .map((src, i) => src.endsWith('.mp4')
      ? `<button type="button" role="tab" class="es-video" data-i="${i}" aria-label="Ver video"><img src="${foto(p)}" alt="" class="recorte"></button>`
      : `<button type="button" role="tab" data-i="${i}" aria-label="Ver foto ${i + 1}"><img src="${src}" alt="" class="${src.includes('/prendas/') ? 'recorte' : ''}" loading="lazy"></button>`)
    .join('');
  $('.ficha-barras').innerHTML = laminas.length > 1 ? laminas.map(() => '<i></i>').join('') : '';
  $('.ficha-wa').href = wa(`¡Hola! Quiero consultar por la malla ${p.nombre} (${precio(p.precio)})`);
  $$('.acordeon details').forEach((d) => { d.open = false; d.classList.remove('abierto'); });
  const otras = PRODUCTOS.filter((x) => x.id !== p.id).sort((a, b) => (marca(b) === marca(p)) - (marca(a) === marca(p))).slice(0, 4);
  $('.grilla-relacionados').innerHTML = otras.map(tarjeta).join('');
  $$('.grilla-relacionados .revelar').forEach((el) => el.classList.add('visto'));

  const yaAbierta = !ficha.hidden && !interrumpeCierre;
  ficha.hidden = false;
  clearTimeout(pausaPerchero);
  pausaPerchero = setTimeout(() => percheroRef?.pausar(true), 2200);
  $('.ficha-pagina').scrollTop = 0;
  irA(0, false);
  document.body.classList.add('bloqueado');
  // entra con una ráfaga de viento (estilo surfer): sopla desde el lado de la malla / tarjeta tocada
  // y la ficha aparece detrás del frente de espuma; después el nombre se revela letra por letra
  if (!yaAbierta) {
    vientoHaciaDerecha = origen ? origen.left + origen.width / 2 < innerWidth / 2 : true;
    soplar({ ms: 950, haciaDerecha: vientoHaciaDerecha, el: ficha, modo: 'mostrar' });
  } else {
    soplar({ ms: 850, haciaDerecha: vientoHaciaDerecha });
    animar(ficha, [{ opacity: 0.4 }, { opacity: 1 }], 500, { delay: 150 });
  }
  // Nada más se mueve adentro: la ficha aparece COMPLETA y quieta justo detrás del frente de la ráfaga (antes la foto,
  // el nombre letra por letra y el texto entraban después de que pasaba el viento y se veía la página "armándose").
  [$('.ficha-escenario'), $('.ficha-top'), ...$$('.ficha-info > *')].forEach((x) => x.getAnimations().forEach((a) => a.cancel()));
}

// rendimiento: con la ficha tapando toda la pantalla, el perchero 3D deja de dibujarse (vuelve antes de cerrarla)
let percheroRef = null, pausaPerchero = null;
async function cerrarFicha(rapido = false) {
  if (ficha.hidden || cerrandoFicha) return;
  const gen = fichaGen;
  cerrandoFicha = true;
  clearTimeout(pausaPerchero);
  percheroRef?.pausar(false);
  $$('.ficha video').forEach((v) => v.pause());
  // se cierra con la misma ráfaga, soplando para el otro lado: el viento "se lleva" la ficha
  await soplar({ ms: rapido ? 750 : 900, haciaDerecha: !vientoHaciaDerecha, el: ficha, modo: 'ocultar' });
  if (gen !== fichaGen) return; // mientras se cerraba se abrió otra malla: esa queda abierta
  cerrandoFicha = false;
  ficha.hidden = true;
  ficha.getAnimations().forEach((a) => a.cancel());
  desbloquear();
}

let pistaEspera;
pista.addEventListener('scroll', () => {
  clearTimeout(pistaEspera);
  pistaEspera = setTimeout(() => {
    let mejor = 0;
    laminas.forEach((_, i) => { if (Math.abs(posLamina(i) - pista.scrollLeft) < Math.abs(posLamina(mejor) - pista.scrollLeft)) mejor = i; });
    if (mejor !== indice) marcar(mejor);
  }, 60);
}, { passive: true });
$('.ficha-nav.ant').addEventListener('click', () => irA(indice - 1));
$('.ficha-nav.sig').addEventListener('click', () => irA(indice + 1));
$('.ficha-miniaturas').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) irA(+b.dataset.i); });
pista.addEventListener('click', (e) => { const l = e.target.closest('.lamina'); if (l) abrirVisor(+l.dataset.i, l.getBoundingClientRect()); });
$('.ficha-talles').addEventListener('click', (e) => {
  const b = e.target.closest('button:not(:disabled)');
  if (!b) return;
  talleElegido = b.dataset.talle;
  $$('.ficha-talles button').forEach((x) => x.setAttribute('aria-pressed', x === b));
  notaTalle();
});
$('.ficha-guia').addEventListener('click', () => {
  const d = $('#acordeon-guia');
  if (!d.open) acordeon(d, true);
  setTimeout(() => d.scrollIntoView({ behavior: 'smooth', block: 'center' }), 80);
});
$('.ficha-agregar').addEventListener('click', () => {
  if (!talleElegido) {
    notaTalle(true);
    const t = $('.ficha-talles');
    t.classList.remove('falta');
    void t.offsetWidth;
    t.classList.add('falta');
    return;
  }
  const r = $$('.lamina')[indice].getBoundingClientRect();
  const lado = Math.min(r.width, r.height) * 0.7;
  const desde = { left: r.left + (r.width - lado) / 2, top: r.top + (r.height - lado) / 2, width: lado, height: lado };
  agregar(actual, talleElegido, desde, async () => { await cerrarFicha(true); abrirCarrito(); });
});
$('.grilla-relacionados').addEventListener('click', (e) => {
  if (e.target.closest('[data-rapido]')) return clicTarjeta(e);
  if (navTarjeta(e)) return;
  const t = e.target.closest('.tarjeta');
  if (t) abrirFicha(prod(t.dataset.id)); // ya está abierta: cambia de malla con un fundido
});
$('.ficha .cerrar').addEventListener('click', () => cerrarFicha());
$('.ficha-volver').addEventListener('click', () => cerrarFicha());

// ---------- visor de fotos a pantalla completa (tocar = zoom) ----------
const visor = $('.visor');
const visorPista = $('.visor-pista');
function contadorVisor() {
  const i = Math.round(visorPista.scrollLeft / visorPista.clientWidth);
  $('.visor-contador').textContent = `${i + 1} / ${laminas.length}`;
  $('.visor-nav.ant').disabled = i === 0;
  $('.visor-nav.sig').disabled = i === laminas.length - 1;
}
function abrirVisor(i, desde) {
  visorPista.innerHTML = laminas.map((src) => `<div class="visor-lamina">${src.endsWith('.mp4')
    ? `<video src="${src}" muted loop playsinline autoplay controls></video>`
    : `<img src="${src}" alt="${actual.nombre}">`}</div>`).join('');
  visor.hidden = false;
  visorPista.scrollLeft = i * visorPista.clientWidth;
  contadorVisor();
  if (desde) animar(visor, [{ clipPath: recorte(desde) }, { clipPath: 'inset(0px 0px 0px 0px)' }], 600);
  else animar(visor, [{ opacity: 0 }, { opacity: 1 }], 400);
  animar($('.visor-ayuda'), [{ opacity: 0 }, { opacity: 1 }], 500, { delay: 500 });
}
async function cerrarVisor() {
  if (visor.hidden) return;
  // la ficha queda en la misma foto que se estaba viendo
  const i = Math.round(visorPista.scrollLeft / Math.max(1, visorPista.clientWidth));
  await terminar(animar(visor, [{ transform: 'none' }, { transform: 'translateY(100%)' }], 520, { easing: CIERRA }));
  visor.hidden = true;
  visor.getAnimations().forEach((a) => a.cancel());
  visorPista.innerHTML = '';
  irA(i, false);
}
visorPista.addEventListener('scroll', () => requestAnimationFrame(contadorVisor), { passive: true });
visorPista.addEventListener('click', (e) => {
  const img = e.target.closest('.visor-lamina img');
  if (!img) return;
  const lam = img.parentElement;
  const r = img.getBoundingClientRect();
  img.style.transformOrigin = `${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`;
  lam.classList.toggle('zoom');
});
// con zoom, la foto sigue al dedo / mouse
visorPista.addEventListener('pointermove', (e) => {
  const lam = e.target.closest('.visor-lamina.zoom');
  if (!lam) return;
  const r = lam.getBoundingClientRect();
  lam.querySelector('img').style.transformOrigin = `${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`;
});
$('.visor .cerrar').addEventListener('click', cerrarVisor);
function pasarVisor(d) {
  const i = Math.round(visorPista.scrollLeft / Math.max(1, visorPista.clientWidth)) + d;
  visorPista.querySelectorAll('.visor-lamina.zoom').forEach((l) => l.classList.remove('zoom'));
  visorPista.scrollTo({ left: Math.max(0, Math.min(laminas.length - 1, i)) * visorPista.clientWidth, behavior: 'smooth' });
}
$('.visor-nav.ant').addEventListener('click', () => pasarVisor(-1));
$('.visor-nav.sig').addEventListener('click', () => pasarVisor(1));

addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (!visor.hidden) return cerrarVisor();
    cerrarFicha(); cerrarCarrito(); cerrarMenu();
  }
  if (!ficha.hidden && visor.hidden && e.key === 'ArrowRight') irA(indice + 1);
  if (!ficha.hidden && visor.hidden && e.key === 'ArrowLeft') irA(indice - 1);
  if (!visor.hidden && e.key === 'ArrowRight') pasarVisor(1);
  if (!visor.hidden && e.key === 'ArrowLeft') pasarVisor(-1);
});
addEventListener('resize', () => { if (!ficha.hidden) irA(indice, false); });

// ---------- avisos: una frase por vez (quieta para leerla), las letras entran rodando y cambia sola ----------
const AVISOS = [
  ['🔥', `Llevate ${OFERTA.cantidad} mallas y tenés ${Math.round(OFERTA.descuento * 100)}% OFF`],
  ['🌊', 'Nuevo drop · Verano 2026'],
  ['✨', 'Vintage original, elegido a mano'],
  ['📦', 'Envíos a todo el país'],
  ['💳', '3 cuotas sin interés'],
  ['📍', 'Retiro sin cargo en Hurlingham'],
  ['🔄', 'Cambios dentro de los 30 días'],
];
(() => {
  const caja = document.querySelector('.avisos-caja');
  if (!caja) return;
  const frase = caja.querySelector('.avisos-frase'), icono = caja.querySelector('.avisos-icono');
  const cuenta = caja.querySelector('.avisos-cuenta b');
  const MS = 3800;
  let i = 0, timer = null, pausado = false, visible = true;
  const letras = (t) => [...t].map((ch) => `<span class="avisos-letra">${ch === ' ' ? '&nbsp;' : ch}</span>`).join('');
  frase.innerHTML = letras(AVISOS[0][1]);
  async function mostrar(n) {
    i = (n + AVISOS.length) % AVISOS.length;
    const viejas = [...frase.children];
    // las letras de la frase anterior se van rodando para arriba
    viejas.forEach((l, k) => l.animate([{ transform: 'none', opacity: 1 }, { transform: 'translateY(-110%)', opacity: 0 }],
      { duration: 260, delay: k * 6, easing: 'cubic-bezier(0.7, 0, 0.84, 0)', fill: 'forwards' }));
    // se espera con un temporizador (no con .finished, que en algunos casos no llega y dejaba la barrita vacía)
    await new Promise((ok) => setTimeout(ok, 270 + viejas.length * 6));
    frase.innerHTML = letras(AVISOS[i][1]);
    icono.textContent = AVISOS[i][0];
    cuenta.textContent = i + 1;
    icono.animate([{ transform: 'scale(0.4) rotate(-20deg)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 500, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)' });
    // y las nuevas entran rodando desde abajo, una detrás de otra
    [...frase.children].forEach((l, k) => l.animate([{ transform: 'translateY(110%)', opacity: 0 }, { transform: 'none', opacity: 1 }],
      { duration: 480, delay: k * 14, easing: 'cubic-bezier(0.16, 1, 0.3, 1)', fill: 'backwards' }));
    arrancar();
  }
  function arrancar() {
    clearTimeout(timer);
    if (pausado || !visible) return;
    timer = setTimeout(() => mostrar(i + 1), MS);
  }
  caja.addEventListener('click', () => mostrar(i + 1));
  caja.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') { pausado = true; clearTimeout(timer); } });
  caja.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') { pausado = false; arrancar(); } });
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; visible ? arrancar() : clearTimeout(timer); }).observe(caja);
})();

// ---------- aparición suave al bajar ----------
const io = new IntersectionObserver((entradas) => entradas.forEach((e) => {
  if (e.isIntersecting) { e.target.classList.add('visto'); io.unobserve(e.target); }
}), { rootMargin: '0px 0px -6% 0px' });
$$('.coleccion .revelar').forEach((el) => io.observe(el));

// ---------- WhatsApp: la pastilla se estira con "¿Dudas? Escribinos" al entrar y al mantener apretado ----------
const fab = $('.wa-fab');
function mostrarTip(ms = 4500) {
  fab.classList.add('tip');
  clearTimeout(mostrarTip.t);
  mostrarTip.t = setTimeout(() => fab.classList.remove('tip'), ms);
}
let holdWa;
fab.addEventListener('pointerdown', () => (holdWa = setTimeout(() => mostrarTip(3000), 380)));
fab.addEventListener('pointerup', () => clearTimeout(holdWa));
fab.addEventListener('contextmenu', (e) => e.preventDefault());

// ---------- perchero: etiqueta flotante + info de la malla del centro ----------
let enCentro = PRODUCTOS[Math.floor((PRODUCTOS.length - 1) / 2)];
const dos = (n) => String(n).padStart(2, '0');
$('.perchero-contador span').textContent = dos(PRODUCTOS.length);
$('.perchero-barras').innerHTML = PRODUCTOS.map((p, i) => `<button type="button" role="tab" aria-label="${p.nombre}" data-i="${i}"></button>`).join('');
function mostrarCentro(p, i) {
  enCentro = p;
  const dato = $('.perchero-dato');
  $('.perchero-nombre').textContent = p.nombre;
  $('.perchero-precio').innerHTML = precioHTML(p);
  $('.perchero-talles').textContent = `Talle ${tallesDisponibles(p).join(' · ')}`;
  $('.perchero-contador b').textContent = dos(i + 1);
  $$('.perchero-barras button').forEach((b, k) => b.setAttribute('aria-selected', k === i));
  dato.classList.remove('perchero-cambia');
  void dato.offsetWidth;
  dato.classList.add('perchero-cambia');
}
mostrarCentro(enCentro, PRODUCTOS.indexOf(enCentro));
$('.perchero-ver').addEventListener('click', (e) => abrirFicha(enCentro, $('.perchero-escena').getBoundingClientRect()));

// ---------- arranque ----------
pintarCarrito();
async function iniciarPerchero() {
  try {
    const { crearPerchero } = await import('./perchero.js');
    const perchero = crearPerchero($('.perchero-lienzo'), PRODUCTOS, { alAbrir: abrirFicha, alCentrar: mostrarCentro });
    percheroRef = perchero;
    $('.perchero-ayuda').textContent = perchero.hayHover ? 'Pasá el mouse por el perchero · Clic para verla' : 'Deslizá para recorrer · Tocá la malla para verla';
    $('.perchero-flecha.izq').addEventListener('click', () => perchero.mover(-1));
    $('.perchero-flecha.der').addEventListener('click', () => perchero.mover(1));
    $('.perchero-barras').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) perchero.irA(+b.dataset.i); });
  } catch (err) {
    console.error('No se pudo iniciar el perchero 3D', err);
  }
}
iniciarPerchero();
// pruebas: ?ver=coleccion · ?ficha=p03 · ?carrito (?carrito=2 con el combo) · ?menu · ?tip (WhatsApp estirado) · ?acordeones (ficha con todo abierto) · ?ver=pie (solo el footer)
const params = new URLSearchParams(location.search);
const verParam = params.get('ver');
if (verParam) {
  for (const sec of $$('main > section')) { if (sec.id === verParam) break; sec.style.display = 'none'; }
  if (verParam === 'pie') $('.barra').style.display = 'none'; // solo el footer, sin el header encima
}
if (params.get('ficha')) abrirFicha(prod(params.get('ficha')) || PRODUCTOS[0]);
if (params.has('carrito')) { if (!carrito.length) { carrito.push({ id: 'p03', talle: '32' }); if (params.get('carrito') === '2') carrito.push({ id: 'p02', talle: '30' }); pintarCarrito(); } abrirCarrito(); }
if (params.has('menu')) abrirMenu();
if (params.has('tip')) mostrarTip(600000);
if (params.has('abajo')) setTimeout(() => scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }), 600); // ?abajo: va al footer
// ?rafaga=0.5 abre una ficha y congela la ráfaga de viento en ese punto (para revisar cómo se ve)
if (params.has('rafaga')) {
  const f = Math.min(0.98, Math.max(0, parseFloat(params.get('rafaga')) || 0.5));
  abrirFicha(PRODUCTOS[0], { left: 60, top: 200, width: 200, height: 260 });
  [rafaga, ficha].forEach((el) => el.getAnimations().forEach((a) => { a.pause(); a.currentTime = a.effect.getTiming().duration * f; }));
}
if (params.has('acordeones')) { $$('.acordeon details').forEach((d) => acordeon(d, true)); setTimeout(() => $('.acordeon').scrollIntoView(), 900); }
// intro: la persiana con grafitis y los LED cálidos. Guardadas: ?intro=lisa (lisa) · ?intro=roja (grafitis rojos/blancos anteriores)
const INTROS = {};
import(INTROS[params.get('intro')] || './persiana.js')
  .then(({ persiana }) => persiana({ alAbrir: () => setTimeout(() => mostrarTip(), 2600) }));
