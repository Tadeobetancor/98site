// Catálogo provisorio de la demo. Nombres, precios y talles son de ejemplo: se reemplazan por los reales.
export const WHATSAPP = '5491151244554'; // Francisco: +54 9 11 5124-4554 (antes 11 3163-5898)
export const INSTAGRAM = 'https://instagram.com/98.vintage'; // ← usuario real

export const PRODUCTOS = [
  { id: 'p03', nombre: 'Billabong Azul', precio: 28000, talles: { 30: 2, 36: 1 }, detalles: 3, video: false,
    info: ['Malla Billabong original, años 2000', 'Rayado fino azul marino con paneles blancos', 'Cordón y bolsillo trasero con logo bordado'] },
  { id: 'p06', nombre: 'Metallica × Billabong Gold', precio: 25000, talles: { 36: 1 }, detalles: 1, video: false,
    info: ['Colaboración oficial Metallica × Billabong', 'Estampa dorada, base negra', 'Bolsillo cargo con velcro'] },
  { id: 'p02', nombre: 'Billabong Rojo', precio: 30000, talles: { 34: 1 }, detalles: 1, video: true,
    info: ['Malla Billabong vintage', 'Rojo con rayado fino y franjas negras', 'Logo script bordado en la pierna'] },
  { id: 'p04', nombre: 'Metallica × Billabong Eyes', precio: 30000, talles: { 30: 1, 36: 1, 38: 1, 40: 1 }, detalles: 2, video: false,
    info: ['Colaboración Metallica × Billabong', 'Estampa fotográfica en grises', 'Pieza difícil de conseguir'] },
  { id: 'p08', nombre: 'Split Streetwear', precio: 26000, talles: { 30: 1, 32: 1 }, detalles: 2, video: true,
    info: ['Diseño partido: anime y camuflaje desgastado', 'Bolsillo con ojales metálicos', 'Tela de secado rápido'] },
  { id: 'p07', nombre: 'Metallica × Billabong Aqua', precio: 25000, talles: { 36: 1 }, detalles: 1, video: false,
    info: ['Colaboración Metallica × Billabong', 'Estampa turquesa sobre negro', 'Cintura con cordón'] },
  { id: 'p05', nombre: 'Hang Loose', precio: 28000, talles: { 30: 1, 32: 1, 36: 1 }, detalles: 2, video: true,
    info: ['Malla roja con franjas blancas', 'Tipografía manuscrita en toda la pieza', 'Cierre con botones a presión'] },
  { id: 'p09', nombre: 'Metallica × Billabong Camuflada', precio: 27500, talles: { 34: 1 }, detalles: 2, video: true,
    info: ['Colaboración Metallica × Billabong', 'Estampa blanca tipo tiza', 'Bolsillo lateral'] },
  { id: 'p01', nombre: 'Taverniti', precio: 25000, talles: { S: 1 }, detalles: 2, video: true,
    info: ['Malla de paneles: gris, negro y escocés', 'Bordado script en la pierna', 'Talle S (equivale a 32/33)'] },
];

// marca para los filtros de la colección
export const marca = (p) => (/metallica/i.test(p.nombre) ? 'Metallica × Billabong' : /billabong/i.test(p.nombre) ? 'Billabong' : 'Otras');

// Información de la ficha, pensada para verse (íconos, pasos, tabla), no para leer párrafos.
// PROVISORIO: medidas, costos y plazos son de ejemplo → confirmar con el dueño. La tienda es de Hurlingham (zona oeste).
export const ZONA = 'Hurlingham · Buenos Aires';

// A = cintura apoyada de punta a punta (cm, sin estirar) · B = largo desde la cintura hasta la botamanga (cm)
export const GUIA_TALLES = [
  { talle: '30', a: 38, b: 49 },
  { talle: '32', a: 40.5, b: 50 },
  { talle: '34', a: 43, b: 51 },
  { talle: '36', a: 45.5, b: 52 },
  { talle: '38', a: 48, b: 53 },
  { talle: '40', a: 50.5, b: 54 },
];

export const INFO_TIENDA = [
  { id: 'descripcion', titulo: 'Descripción', tipo: 'descripcion' },
  { id: 'guia', titulo: 'Guía de talles', tipo: 'guia' },
  { id: 'envios', titulo: 'Envíos', tipo: 'tarjetas', items: [
    { icono: 'pin', titulo: 'Retiro en Hurlingham', texto: 'Coordinamos día y horario por WhatsApp.', destaque: 'Sin cargo' },
    { icono: 'moto', titulo: 'Moto · zona oeste y CABA', texto: 'Te llega en 24 a 48 h hábiles.' },
    { icono: 'caja', titulo: 'Todo el país', texto: 'Por correo, con número de seguimiento.' },
  ] },
  { id: 'pagos', titulo: 'Medios de pago', tipo: 'chips', items: [
    { icono: 'banco', titulo: 'Transferencia' },
    { icono: 'mp', titulo: 'Mercado Pago' },
    { icono: 'efectivo', titulo: 'Efectivo al retirar' },
  ], nota: 'Al finalizar la compra te pasamos los datos por WhatsApp.' },
  { id: 'cambios', titulo: 'Cambios y devoluciones', tipo: 'pasos', items: [
    { titulo: '30 días', texto: 'para cambiarla desde que la recibís' },
    { titulo: 'Sin uso', texto: 'en el mismo estado en que llegó' },
    { titulo: 'Escribinos', texto: 'y coordinamos el cambio por WhatsApp' },
  ] },
  { id: 'cuidados', titulo: 'Cuidados', tipo: 'cuidados', items: [
    { icono: 'lavar', texto: 'A mano, agua fría' },
    { icono: 'secarropas', texto: 'Sin secarropas' },
    { icono: 'plancha', texto: 'No planchar estampas' },
    { icono: 'sombra', texto: 'Secar a la sombra' },
  ] },
];

export const precio = (n) => '$' + n.toLocaleString('es-AR');

// Cómo pagar (se muestra pegado al precio: es lo que decide la compra).
// PROVISORIO: confirmar con el dueño cuántas cuotas sin interés y cuánto descuento por transferencia.
// `antes` en un producto = precio anterior tachado (también de ejemplo).
export const PAGOS = { cuotas: 3, transferencia: 0.1 };
export const conTransferencia = (n) => Math.round((n * (1 - PAGOS.transferencia)) / 100) * 100;
export const cuota = (n) => Math.round(n / PAGOS.cuotas);
// Oferta del carrito: llevando OFERTA.cantidad mallas o más, OFERTA.descuento sobre el total.
export const OFERTA = { cantidad: 2, descuento: 0.1 };
export const ahorroOferta = (subtotal, n) => (n >= OFERTA.cantidad ? Math.round((subtotal * OFERTA.descuento) / 100) * 100 : 0);
export const descuento = (p) => (p.antes ? Math.round((1 - p.precio / p.antes) * 100) : 0);
export const foto = (p) => `img/prendas/${p.id}.webp`;
export const galeria = (p) => [
  foto(p),
  ...Array.from({ length: p.detalles }, (_, i) => `img/detalles/${p.id}-${i + 1}.jpg`),
  ...(p.video ? [`video/${p.id}.mp4`] : []),
];
