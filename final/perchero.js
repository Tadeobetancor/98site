// Perchero 3D como el de las referencias (Referencias/perchero/*.mp4):
// un tubo de aluminio RECTO que cruza toda la pantalla y nunca se mueve; lo único que se mueve son las perchas.
// Como en un perchero real, las mallas NO aparecen de la nada: están todas colgadas en el barral. La elegida gira
// de frente y las demás se corren y se APILAN hacia las puntas (cada vez más juntas y más de costado), y al recorrer
// se van "pasando" de una pila a la otra. Todo se mueve rígido y suave (resortes): la prenda no se deforma,
// solo gira sobre el gancho y se balancea un poquito cuando la corrés.
// Compu: pasar el mouse elige la malla, clic la abre. Celular: deslizar recorre, tocar la del frente la abre.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const ALTO_MAX = 2.45, ANCHO_MAX = 1.95;
const BARRAL_Y = 1.95;
const TUBO = 0.03;                               // radio del tubo
const PASO = 0.46;                               // separación entre mallas de costado
const GIRO = THREE.MathUtils.degToRad(70);       // cuánto giran las de costado
const GIRO_PILA = THREE.MathUtils.degToRad(86);  // apiladas en las puntas quedan casi de canto
const ADELANTE = 0.16;                           // la elegida se adelanta un poco del barral
const MORDIDA = -0.205;                          // altura (bajo el tubo) donde las pinzas muerden la cintura

const suave = (t) => t * t * (3 - 2 * t);
const limitar = THREE.MathUtils.clamp;

// ---------- volumen: que dos mallas nunca se atraviesen ----------
// Vista desde arriba cada malla es una "cápsula": un segmento del ancho de la prenda (girado como esté) con el grosor
// de la tela alrededor (la cara de adelante se infla hasta ~0,2 y el dorso ~0,07 hacia atrás). Si dos vecinas tienen
// ángulos distintos (una girando de frente y la otra de costado) se cruzaban en el espacio y se veían "entrelazadas".
function capsula(it, z) {
  const c = Math.cos(it.giro), s = Math.sin(it.giro);
  const k = it.ancho / ANCHO_MAX;
  const lz = (0.11 + 0.017 * k) / 2;            // centro del grosor (la tela se infla más hacia adelante)
  const r = (0.11 + 0.153 * k) / 2 + 0.02;      // medio grosor + un poquito de aire
  const l0 = -it.ancho / 2 - it.centro, l1 = it.ancho / 2 - it.centro;
  return { ax: l0 * c + lz * s, az: z - l0 * s + lz * c, bx: l1 * c + lz * s, bz: z - l1 * s + lz * c, r };
}
// distancia entre dos segmentos en el plano (el de B corrido dx en x)
function distSegmentos(A, B, dx) {
  const px = A.ax, pz = A.az, ux = A.bx - A.ax, uz = A.bz - A.az;
  const qx = B.ax + dx, qz = B.az, vx = B.bx - B.ax, vz = B.bz - B.az;
  const wx = px - qx, wz = pz - qz;
  const a = ux * ux + uz * uz, b = ux * vx + uz * vz, c = vx * vx + vz * vz, d = ux * wx + uz * wz, e = vx * wx + vz * wz;
  const den = a * c - b * b;
  let sN, sD = den, tN, tD = den;
  if (den < 1e-9) { sN = 0; sD = 1; tN = e; tD = c; } else {
    sN = b * e - c * d; tN = a * e - b * d;
    if (sN < 0) { sN = 0; tN = e; tD = c; } else if (sN > sD) { sN = sD; tN = e + b; tD = c; }
  }
  if (tN < 0) { tN = 0; sN = limitar(-d, 0, a); sD = a; } else if (tN > tD) { tN = tD; sN = limitar(b - d, 0, a); sD = a; }
  const sc = Math.abs(sN) < 1e-9 ? 0 : sN / sD, tc = Math.abs(tN) < 1e-9 ? 0 : tN / tD;
  return Math.hypot(wx + sc * ux - tc * vx, wz + sc * uz - tc * vz);
}
// la menor distancia entre ganchos (en x) para que A (a la izquierda) y B no se toquen
function separacion(A, B) {
  const min = A.r + B.r;
  const hi = Math.max(A.ax, A.bx) - Math.min(B.ax, B.bx) + min;
  if (hi <= 0) return 0;
  let dx = hi;
  while (dx > 0 && distSegmentos(A, B, dx) >= min) dx -= 0.03; // de lejos hacia cerca, hasta que se tocan
  if (dx <= 0) return 0;
  let lo = dx, alto = dx + 0.03;                                  // y se afina para que no "salte" de a 3 cm
  for (let k = 0; k < 7; k++) { const m = (lo + alto) / 2; if (distSegmentos(A, B, m) >= min) alto = m; else lo = m; }
  return alto;
}

// resorte crítico: llega sin rebotar y sin cortes
function resorte(r, objetivo, dt, rigidez) {
  const amort = 2 * Math.sqrt(rigidez);
  r.v += ((objetivo - r.x) * rigidez - r.v * amort) * dt;
  r.x += r.v * dt;
}

// veta de madera oscura (para las perchas)
function texturaMadera() {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 128;
  const x = c.getContext('2d');
  const g = x.createLinearGradient(0, 0, 0, 128);
  g.addColorStop(0, '#5a361d');
  g.addColorStop(0.5, '#43280f');
  g.addColorStop(1, '#2f1b0b');
  x.fillStyle = g;
  x.fillRect(0, 0, 512, 128);
  for (let i = 0; i < 70; i++) {
    const y0 = Math.random() * 128, a = 2 + Math.random() * 5, f = 0.004 + Math.random() * 0.012, fase = Math.random() * 7;
    x.strokeStyle = `rgba(${Math.random() < 0.5 ? '20,10,4' : '120,74,38'},${0.15 + Math.random() * 0.3})`;
    x.lineWidth = 0.6 + Math.random() * 1.6;
    x.beginPath();
    for (let px = 0; px <= 512; px += 8) x.lineTo(px, y0 + Math.sin(px * f + fase) * a);
    x.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(0.9, 3);
  return t;
}

// Percha de mallas, chica y real: gancho de metal plateado apoyado sobre el tubo + barrita de madera oscura
// del ancho de la cintura + dos pinzas que MUERDEN el elástico (sus posiciones salen de la foto de cada malla).
// pinzas = [{ x, z }] en coordenadas de la percha (z = superficie de la tela en ese punto).
function crearPercha(cintura, pinzas, mats) {
  const g = new THREE.Group();
  // gancho: arco abierto que abraza el tubo (el interior del arco toca la parte de arriba del tubo)
  const gancho = new THREE.Mesh(new THREE.TorusGeometry(0.044, 0.0075, 10, 30, Math.PI * 1.55), mats.metal);
  gancho.rotation.z = -Math.PI / 2;
  gancho.position.y = TUBO + 0.0075 - 0.044;
  g.add(gancho);
  const yGancho = gancho.position.y - 0.044;
  // cuerpo de madera: abajo recto, arriba con una panza suave al centro
  const W = cintura + 0.05, d = 0.026, abajo = -0.15;
  const forma = new THREE.Shape();
  forma.moveTo(-W / 2, 0);
  forma.lineTo(W / 2, 0);
  forma.quadraticCurveTo(W / 2 + 0.012, 0.012, W / 2, 0.024);
  forma.quadraticCurveTo(W * 0.2, 0.03, 0, 0.042);
  forma.quadraticCurveTo(-W * 0.2, 0.03, -W / 2, 0.024);
  forma.quadraticCurveTo(-W / 2 - 0.012, 0.012, -W / 2, 0);
  const geo = new THREE.ExtrudeGeometry(forma, { depth: d, bevelEnabled: true, bevelThickness: 0.004, bevelSize: 0.004, bevelSegments: 2, curveSegments: 16 });
  geo.translate(0, abajo, -d / 2);
  g.add(new THREE.Mesh(geo, mats.madera));
  // cuello del gancho hasta la madera, con su casquillo
  const arriba = abajo + 0.042;
  const largo = yGancho - arriba;
  const cuello = new THREE.Mesh(new THREE.CylinderGeometry(0.0075, 0.0075, largo, 10), mats.metal);
  cuello.position.y = arriba + largo / 2;
  g.add(cuello);
  const casquillo = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.015, 0.018, 14), mats.metal);
  casquillo.position.y = arriba + 0.006;
  g.add(casquillo);
  // pinzas: eslabón bajo la madera, cuerpo de la pinza y el labio que aprieta la tela (adelante de la tela)
  for (const { x, z } of pinzas) {
    const eslabon = new THREE.Mesh(new THREE.TorusGeometry(0.01, 0.003, 6, 14), mats.metal);
    eslabon.position.set(x, abajo - 0.008, z * 0.5);
    g.add(eslabon);
    const cuerpo = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.01), mats.metal);
    cuerpo.position.set(x, MORDIDA + 0.012, z + 0.01);
    g.add(cuerpo);
    const labio = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.01, 0.022), mats.metal);
    labio.position.set(x, MORDIDA - 0.016, z + 0.004);
    g.add(labio);
    const atras = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.045, 0.006), mats.metal);
    atras.position.set(x, MORDIDA + 0.008, z - 0.012);
    g.add(atras);
  }
  return g;
}

// sombra suave de la prenda sobre la pared (silueta desenfocada)
// ¿el navegador aplica ctx.filter? (Safari no)
const FILTRO_OK = (() => {
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
function texturaSombra(img) {
  const w = 220, h = Math.round(220 * (img.height / img.width)), pad = 30;
  const a = document.createElement('canvas');
  a.width = w; a.height = h;
  const ax = a.getContext('2d');
  ax.drawImage(img, 0, 0, w, h);
  ax.globalCompositeOperation = 'source-in';
  ax.fillStyle = '#000';
  ax.fillRect(0, 0, w, h);
  const c = document.createElement('canvas');
  c.width = w + pad * 2; c.height = h + pad * 2;
  const cx = c.getContext('2d');
  if (FILTRO_OK) {
    cx.filter = 'blur(12px)';
    cx.drawImage(a, pad, pad);
  } else {
    // Safari no aplica ctx.filter: se achica la silueta y se agranda (queda igual de difuminada)
    const k = 0.09, ch = document.createElement('canvas');
    ch.width = Math.ceil(c.width * k); ch.height = Math.ceil(c.height * k);
    ch.getContext('2d').drawImage(a, pad * k, pad * k, w * k, h * k);
    cx.imageSmoothingQuality = 'high';
    cx.drawImage(ch, 0, 0, c.width, c.height);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return { t, escala: (w + pad * 2) / w };
}

// dónde está la cintura en la foto recortada: primera franja de arriba con tela, y sus bordes izquierdo/derecho
// ---------- volumen de la tela ----------
const DORSO = 0.72;
const TONO = 1;     // multiplicador de la tela (las luces ya están calibradas para que de frente se vea ~0,78 de la foto)

// Campo de "profundidad" 0..1 a partir del alfa: 0 en el borde de la prenda, sube redondeado hacia adentro
// (distancia al borde con chamfer de dos pasadas, rampa con forma de seno y un suavizado para que no se vean escalones).
function campoProfundidad(data, w, h) {
  const d = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) d[i] = data[i * 4 + 3] > 127 ? 1e9 : 0;
  const en = (x, y) => (x < 0 || y < 0 || x >= w || y >= h ? 0 : d[y * w + x]); // fuera de la imagen = borde
  const D = Math.SQRT2;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      if (!d[i]) continue;
      d[i] = Math.min(d[i], en(x - 1, y) + 1, en(x, y - 1) + 1, en(x - 1, y - 1) + D, en(x + 1, y - 1) + D);
    }
  for (let y = h - 1; y >= 0; y--)
    for (let x = w - 1; x >= 0; x--) {
      const i = y * w + x;
      if (!d[i]) continue;
      d[i] = Math.min(d[i], en(x + 1, y) + 1, en(x, y + 1) + 1, en(x + 1, y + 1) + D, en(x - 1, y + 1) + D);
    }
  const rampa = Math.max(4, w * 0.16);
  let p = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) p[i] = Math.sin((Math.min(1, Math.max(0, d[i] - 0.5) / rampa) * Math.PI) / 2);
  for (let pasada = 0; pasada < 2; pasada++) {
    const q = new Float32Array(w * h);
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        let s = 0, n = 0;
        for (let dy = -1; dy <= 1; dy++)
          for (let dx = -1; dx <= 1; dx++) {
            const xx = x + dx, yy = y + dy;
            if (xx < 0 || yy < 0 || xx >= w || yy >= h) { n++; continue; }
            s += p[yy * w + xx];
            n++;
          }
        q[y * w + x] = d[y * w + x] ? s / n : 0; // el borde se queda en 0: las dos caras se juntan
      }
    p = q;
  }
  return { p, w, h };
}
// lectura bilineal del campo (u, v de 0 a 1, v desde arriba)
function muestrear(campo, u, v) {
  const { p, w, h } = campo;
  const x = Math.min(w - 1, Math.max(0, u * (w - 1))), y = Math.min(h - 1, Math.max(0, v * (h - 1)));
  const x0 = Math.floor(x), y0 = Math.floor(y), x1 = Math.min(w - 1, x0 + 1), y1 = Math.min(h - 1, y0 + 1);
  const fx = x - x0, fy = y - y0;
  const a = p[y0 * w + x0] * (1 - fx) + p[y0 * w + x1] * fx;
  const b = p[y1 * w + x0] * (1 - fx) + p[y1 * w + x1] * fx;
  return a * (1 - fy) + b * fy;
}

function medirCintura(data, w, h) {
  const opaco = (x, y) => data[(y * w + x) * 4 + 3] > 128;
  let y0 = 0;
  for (; y0 < h; y0++) {
    let c = 0;
    for (let x = 0; x < w; x++) if (opaco(x, y0)) c++;
    if (c > w * 0.25) break;
  }
  let izq = w, der = 0;
  for (let y = y0; y < Math.min(h, y0 + 4); y++) {
    for (let x = 0; x < w; x++) if (opaco(x, y)) { izq = Math.min(izq, x); der = Math.max(der, x); }
  }
  if (der <= izq) { izq = w * 0.1; der = w * 0.9; }
  return { arriba: y0 / h, izq: izq / w, der: (der + 1) / w };
}

// celular/tablet (dedo): sin antialias por hardware (MSAA es lo que más le cuesta a la GPU del celular y con pantallas
// de alta densidad casi no se nota), mallas con menos vértices y 20 cuadros por segundo en reposo
const TACTIL = matchMedia('(pointer: coarse)').matches;

export function crearPerchero(contenedor, productos, { alAbrir, alCentrar }) {
  const renderer = new THREE.WebGLRenderer({ antialias: !TACTIL, alpha: true, powerPreference: 'high-performance' });
  // compu: 1,5 alcanza. Celular: las pantallas son de densidad 2-3 y con 1,5 la imagen se agrandaba al doble y las
  // mallas se veían borrosas → arranca en 2 y, si el teléfono no llega a dibujar fluido al moverse, baja solo a 1,5
  let resolucion = TACTIL ? Math.min(devicePixelRatio, 2) : Math.min(devicePixelRatio, 1.5);
  renderer.setPixelRatio(resolucion);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  // Neutral (Khronos PBR Neutral): respeta el color de la foto. El ACES de antes corría los tonos (el azul marino
  // se iba a violeta/celeste) y desaturaba; con este, lo que se ve es el color real de la malla.
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1;
  contenedor.appendChild(renderer.domElement);

  const escena = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  // el entorno (sala blanca) es SOLO para los reflejos del metal y la madera de las perchas. Antes iba en
  // escena.environment y en three r170 eso ignora el envMapIntensity del material: la sala iluminaba las mallas
  // con fuerza 1 y las lavaba (el azul marino se veía celeste). Ahora las mallas las iluminan solo las luces.
  const entorno = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  const camara = new THREE.PerspectiveCamera(16, 1, 0.1, 200);

  // luz de local, casi neutra (la cálida teñía las mallas). Sin la sala blanca de entorno sobre la tela, la luz la
  // ponen solo estas cuatro: hemisferio parejo + principal arriba a la izquierda + relleno a la derecha (para que las
  // de la izquierda, que la principal agarra de espaldas, no queden negras) + una suave de frente, desde la cámara.
  // LUZ escala todo junto (?luz=1.2 para probar más o menos luz sin tocar el código).
  const LUZ = parseFloat(new URLSearchParams(location.search).get('luz')) || 1;
  escena.add(new THREE.HemisphereLight(0xffffff, 0x3a3c3e, 1.5 * LUZ));
  const sol = new THREE.DirectionalLight(0xfff6ec, 2.6 * LUZ);
  sol.position.set(-3, 4, 5);
  escena.add(sol);
  const relleno = new THREE.DirectionalLight(0xeef6f7, 1.4 * LUZ);
  relleno.position.set(4, 1, 3);
  escena.add(relleno);
  const frente = new THREE.DirectionalLight(0xffffff, 1.0 * LUZ);
  frente.position.set(0, 1.5, 8);
  escena.add(frente);

  // barral: tubo de aluminio recto que cruza TODA la pantalla (sale por los dos bordes) y no se mueve nunca
  const aluminio = new THREE.MeshStandardMaterial({ color: 0xc9ccd1, metalness: 1, roughness: 0.3, envMap: entorno });
  const mats = {
    metal: new THREE.MeshStandardMaterial({ color: 0xdadbde, metalness: 1, roughness: 0.18, envMap: entorno }),
    madera: new THREE.MeshPhysicalMaterial({ map: texturaMadera(), roughness: 0.42, metalness: 0, clearcoat: 0.45, clearcoatRoughness: 0.35, envMap: entorno }),
  };
  const PARED_Z = -0.7;
  const barral = new THREE.Mesh(new THREE.CylinderGeometry(TUBO, TUBO, 1, 28), aluminio);
  barral.rotation.z = Math.PI / 2;
  barral.position.y = BARRAL_Y;
  escena.add(barral);

  const n = productos.length;
  const cargador = new THREE.TextureLoader();
  const items = productos.map((prod, idx) => {
    const pivote = new THREE.Group(); // gira sobre el gancho
    escena.add(pivote);
    const item = {
      prod, idx, pivote, malla: null, sombra: null, alfa: null, ancho: ANCHO_MAX * 0.9, alto: ANCHO_MAX * 0.75, centro: 0,
      vaiven: { x: 0, v: 0 }, fase: Math.random() * 10, abierto: 0, giro: 0, x: 0, xAnt: null, vel: 0,
    };
    cargador.load(`img/prendas/${prod.id}.webp`, (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
      const img = tex.image;
      const asp = img.width / img.height;
      let alto = ALTO_MAX, ancho = alto * asp;
      if (ancho > ANCHO_MAX) { ancho = ANCHO_MAX; alto = ancho / asp; }

      // alfa en chiquito: para tocar solo la tela y para encontrar la cintura
      const c = document.createElement('canvas');
      c.width = 128; c.height = Math.round(128 / asp);
      const cx = c.getContext('2d', { willReadFrequently: true });
      cx.drawImage(img, 0, 0, c.width, c.height);
      item.alfa = { data: cx.getImageData(0, 0, c.width, c.height).data, w: c.width, h: c.height };
      const cin = medirCintura(item.alfa.data, c.width, c.height);

      // un poco de curva general: la tela no cuelga como una hoja plana (el centro un poco más adelante que los costados)
      const bulto = (u, v) => 0.11 * (1 - u * u) * (0.55 + 0.45 * (1 - v));
      // VOLUMEN: la malla es un "almohadón" de tela, no una hoja. Con el alfa se calcula qué tan lejos está cada punto
      // del borde de la prenda; la cara de adelante se infla hacia adelante y la de atrás hacia atrás. En el borde las
      // dos se juntan (como la costura), así de costado se ve el grosor y las luces lo sombrean como algo con cuerpo.
      const campo = campoProfundidad(item.alfa.data, c.width, c.height);
      const GROSOR = 0.085 * (ancho / ANCHO_MAX); // por cara
      const segX = TACTIL ? 40 : 64, segY = Math.max(24, Math.round(segX / asp));
      const superficie = (signo, factor) => {
        const geo = new THREE.PlaneGeometry(ancho, alto, segX, segY);
        const pos = geo.attributes.position, uv = geo.attributes.uv;
        for (let k = 0; k < pos.count; k++) {
          const z = bulto(pos.getX(k) / (ancho / 2), (pos.getY(k) + alto / 2) / alto);
          pos.setZ(k, z + signo * GROSOR * factor * muestrear(campo, uv.getX(k), 1 - uv.getY(k)));
        }
        geo.translate(0, -alto / 2, 0);
        geo.computeVertexNormals();
        return geo;
      };
      const mat = new THREE.MeshStandardMaterial({ map: tex, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 1, metalness: 0 });
      const malla = new THREE.Mesh(superficie(1, 1), mat);
      // el dorso: un poco más chato y más oscuro (es la parte de atrás de la tela, no la estampa)
      const matDorso = new THREE.MeshStandardMaterial({ map: tex, alphaTest: 0.5, side: THREE.BackSide, roughness: 1, metalness: 0 });
      matDorso.color.setScalar(DORSO * TONO);
      mat.color.setScalar(TONO);
      const dorso = new THREE.Mesh(superficie(-1, 0.8), matDorso);
      // la cintura queda centrada bajo el gancho y su borde de arriba justo donde muerden las pinzas
      const centro = ((cin.izq + cin.der) / 2 - 0.5) * ancho;
      const cintura = (cin.der - cin.izq) * ancho;
      malla.position.set(-centro, BARRAL_Y + MORDIDA + 0.025 + cin.arriba * alto, 0);
      pivote.add(malla);
      dorso.position.copy(malla.position);
      pivote.add(dorso); // hermano (no hijo) de la malla: así el toque/hover solo mira la cara de adelante
      const pinzas = [-1, 1].map((s) => {
        const x = s * (cintura / 2 - 0.05);
        return { x, z: bulto((x + centro) / (ancho / 2), 1 - cin.arriba) };
      });
      const percha = crearPercha(cintura, pinzas, mats);
      percha.position.y = BARRAL_Y;
      pivote.add(percha);

      const { t, escala } = texturaSombra(img);
      const sombra = new THREE.Mesh(
        new THREE.PlaneGeometry(ancho * escala, alto * escala).translate(0, -alto / 2, 0),
        // en la lista opaca (para dibujarse antes que todas las mallas) pero mezclando como transparente
        new THREE.MeshBasicMaterial({ map: t, transparent: false, opacity: 0.2, depthWrite: false, blending: THREE.CustomBlending,
          blendSrc: THREE.SrcAlphaFactor, blendDst: THREE.OneMinusSrcAlphaFactor }),
      );
      sombra.position.set(0, malla.position.y - 0.06, PARED_Z);
      sombra.renderOrder = -1;
      escena.add(sombra);
      // orden de dibujo: dentro de cada malla primero el dorso (que limpia la profundidad), después la cara y la percha
      dorso.renderOrder = -2;
      malla.renderOrder = -1;
      dorso.onBeforeRender = (r) => { r.state.buffers.depth.setMask(true); r.clearDepth(); };
      Object.assign(item, { malla, dorso, sombra, percha, alto, ancho, centro });
    });
    return item;
  });

  // ---------- estado: foco (qué malla está de frente) con resorte ----------
  // ?malla=p03 (prueba): arranca con esa malla de frente
  const pedida = productos.findIndex((p) => p.id === new URLSearchParams(location.search).get('malla'));
  // ?foco=3.5 (prueba): congela el perchero a mitad de camino entre dos mallas
  const focoPrueba = parseFloat(new URLSearchParams(location.search).get('foco'));
  let focoObj = !isNaN(focoPrueba) ? limitar(focoPrueba, 0, n - 1) : pedida >= 0 ? pedida : Math.floor((n - 1) / 2); // a dónde va el foco (entero salvo mientras se arrastra)
  const foco = { x: focoObj, v: 0 };
  let seleccion = null;       // malla que se está "presentando" antes de abrir la ficha
  let selT = 0;
  let ultimoCentro = -1;
  const hayHover = matchMedia('(hover: hover) and (pointer: fine)').matches;

  // ---------- tamaño ----------
  let visibleAlto = 5;
  const visibleAncho = () => visibleAlto * camara.aspect;
  function medir() {
    const w = contenedor.clientWidth, h = contenedor.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camara.aspect = w / h;
    const altoMalla = Math.min(ALTO_MAX, ANCHO_MAX / 1.2);
    const contenido = 0.3 + 0.24 + altoMalla;
    // celular: la de frente ocupa ~60% del ancho y a los costados se ven las pilas; compu: entra todo el perchero
    const largoTotal = (n - 1) * PASO + ANCHO_MAX * 1.96;
    visibleAlto = camara.aspect < 1
      ? Math.max(contenido + 0.3, (ANCHO_MAX * 1.65) / camara.aspect)
      : limitar(largoTotal / 0.92 / camara.aspect, contenido + 0.75, contenido * 1.85);
    const dist = visibleAlto / 2 / Math.tan(THREE.MathUtils.degToRad(camara.fov / 2));
    const camY = BARRAL_Y + 0.3 - contenido / 2;
    camara.position.set(0, camY, dist + ADELANTE);
    camara.lookAt(0, camY, 0);
    camara.updateProjectionMatrix();
    barral.scale.y = visibleAncho() + 1; // de borde a borde, y un poco más
    // se redibuja YA con el tamaño nuevo: si no, por un cuadro se ve la imagen vieja estirada (mallas "más verticales")
    renderer.render(escena, camara);
  }
  medir();
  new ResizeObserver(medir).observe(contenedor);

  // ---------- disposición ----------
  // 1) separación "natural": cuánto está de frente cada malla y a qué distancia queda de la anterior
  const xs = new Float32Array(n);
  function disponer() {
    for (const it of items) {
      const d = it.idx - foco.x;
      const a = suave(limitar(Math.abs(d), 0, 1));
      it.abierto = 1 - a;
      it.lado = Math.sign(d);
      it.cerrado = a;
      it.giro = -it.lado * (GIRO + (GIRO_PILA - GIRO) * (it.pila || 0)) * it.cerrado;
      it.caps = capsula(it, it.abierto * ADELANTE);
    }
    xs[0] = 0;
    for (let i = 1; i < n; i++) {
      const a = items[i - 1], b = items[i];
      const natural = PASO + ((a.abierto * a.ancho + b.abierto * b.ancho) / 2) * 0.96;
      // nunca más cerca de lo que permite el volumen de las dos (según cómo esté girada cada una)
      xs[i] = xs[i - 1] + Math.max(natural, separacion(a.caps, b.caps));
    }
  }
  function xFoco() {
    const i = limitar(Math.floor(foco.x), 0, n - 1), j = Math.min(n - 1, i + 1), t = limitar(foco.x - i, 0, 1);
    return xs[i] + (xs[j] - xs[i]) * t;
  }
  // 2) en el barral: si entra todo, centrado; si no, la de frente se ubica según su lugar en el perchero y las demás
  //    se comprimen hacia las puntas (cerca de la elegida van sueltas, al final quedan apiladas): nada sale de la pantalla
  function ubicar() {
    const lim = visibleAncho() / 2 - 0.13;
    const sobra = 0.36; // media malla de costado
    if (xs[n - 1] - xs[0] + sobra * 2 <= lim * 2) {
      const medio = (xs[0] + xs[n - 1]) / 2;
      for (const it of items) { it.x = xs[it.idx] - medio; it.pila = 0; }
      return;
    }
    const f = limitar(Math.round(foco.x), 0, n - 1);
    const media = (items[f].ancho * 0.96) / 2;
    const xf = -lim + media + (lim * 2 - media * 2) * (n > 1 ? limitar(foco.x / (n - 1), 0, 1) : 0.5);
    const x0 = xFoco();
    for (const it of items) {
      const d = xs[it.idx] - x0, s = Math.sign(d) || 1;
      const L = Math.max(0.05, s > 0 ? lim - xf : xf + lim);
      const d0 = Math.min(L * 0.72, media + PASO * 0.5);
      const ad = Math.abs(d);
      if (ad <= d0) { it.x = xf + d; it.pila = 0; continue; }
      const R = Math.max(0.04, L - d0);
      const e = Math.exp(-(ad - d0) / R);
      it.x = xf + s * (d0 + R * (1 - e));
      it.pila = 1 - e; // 0 suelta · 1 apilada en la punta
    }
  }

  // ---------- puntero ----------
  const raycaster = new THREE.Raycaster();
  const puntero = new THREE.Vector2();
  function elegir(ev) {
    const r = renderer.domElement.getBoundingClientRect();
    puntero.set(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
    raycaster.setFromCamera(puntero, camara);
    const golpes = raycaster.intersectObjects(items.filter((i) => i.malla).map((i) => i.malla));
    for (const g of golpes) {
      const it = items.find((i) => i.malla === g.object);
      const { data, w, h } = it.alfa;
      const px = Math.floor(limitar(g.uv.x, 0, 1) * (w - 1)), py = Math.floor((1 - limitar(g.uv.y, 0, 1)) * (h - 1));
      if (data[(py * w + px) * 4 + 3] > 100) return it;
    }
    return null;
  }

  // rectángulo de la prenda en pantalla (para que la ficha se despliegue desde ahí)
  function rectPantalla(it) {
    const r = renderer.domElement.getBoundingClientRect();
    const caja = new THREE.Box3().setFromObject(it.malla);
    const a = new THREE.Vector3(caja.min.x, caja.max.y, caja.max.z).project(camara);
    const b = new THREE.Vector3(caja.max.x, caja.min.y, caja.max.z).project(camara);
    const x1 = r.left + (a.x * 0.5 + 0.5) * r.width, y1 = r.top + (-a.y * 0.5 + 0.5) * r.height;
    const x2 = r.left + (b.x * 0.5 + 0.5) * r.width, y2 = r.top + (-b.y * 0.5 + 0.5) * r.height;
    return { left: x1, top: y1, width: x2 - x1, height: y2 - y1 };
  }

  const irA = (i) => { focoObj = limitar(Math.round(i), 0, n - 1); };
  const mover = (dir) => irA(Math.round(focoObj) + dir);

  // tocar la malla de frente: se adelanta, las demás se apagan, y se abre la ficha desde ahí
  function presentar(it) {
    if (seleccion) return;
    seleccion = it;
    selT = 0;
    it.vaiven.v += 0.5;
    setTimeout(() => {
      alAbrir(it.prod, rectPantalla(it));
      setTimeout(() => (seleccion = null), 700); // cuando la ficha ya tapa todo, el perchero vuelve a su lugar
    }, 360);
  }

  const lienzo = renderer.domElement;
  const arr = { abajo: false, x0: 0, y0: 0, foco0: 0, arrastre: false, xAnt: 0, tAnt: 0, vel: 0, it: null };
  lienzo.addEventListener('contextmenu', (e) => e.preventDefault());
  lienzo.addEventListener('pointerdown', (ev) => {
    Object.assign(arr, { abajo: true, x0: ev.clientX, y0: ev.clientY, xAnt: ev.clientX, tAnt: performance.now(), foco0: focoObj, arrastre: false, vel: 0, it: elegir(ev) });
  });
  addEventListener('pointermove', (ev) => {
    if (seleccion) return;
    if (arr.abajo) {
      const dx = ev.clientX - arr.x0;
      if (!arr.arrastre && Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(ev.clientY - arr.y0)) arr.arrastre = true;
      if (arr.arrastre) {
        // cuántos píxeles corren una malla
        const pxPorMalla = ((PASO + ANCHO_MAX * 0.35) / visibleAncho()) * lienzo.clientWidth;
        let f = arr.foco0 - dx / pxPorMalla;
        if (f < 0) f *= 0.35; // resistencia en las puntas
        if (f > n - 1) f = n - 1 + (f - (n - 1)) * 0.35;
        focoObj = f;
        const ahora = performance.now();
        arr.vel = (ev.clientX - arr.xAnt) / Math.max(1, ahora - arr.tAnt) / pxPorMalla * 1000; // mallas/s
        arr.xAnt = ev.clientX;
        arr.tAnt = ahora;
        lienzo.style.cursor = 'grabbing';
      }
      return;
    }
    if (!hayHover) return;
    const r = lienzo.getBoundingClientRect();
    if (ev.clientY < r.top || ev.clientY > r.bottom || ev.clientX < r.left || ev.clientX > r.right) return;
    hoverPendiente = ev; // se resuelve en el próximo cuadro (un raycast por cuadro como mucho)
  });
  let hoverPendiente = null;
  function resolverHover() {
    const ev = hoverPendiente;
    hoverPendiente = null;
    if (!ev || seleccion || arr.abajo) return;
    const it = elegir(ev);
    lienzo.style.cursor = it ? 'pointer' : 'default';
    // compu: pasar el mouse por una malla la pone de frente (solo cuando el mouse se mueve: no "persigue" al cursor)
    if (it && it.idx !== Math.round(focoObj)) { irA(it.idx); it.vaiven.v += 0.25; }
  }
  addEventListener('pointerup', () => {
    if (!arr.abajo) return;
    arr.abajo = false;
    lienzo.style.cursor = '';
    if (arr.arrastre) {
      // se acomoda en la malla más cercana, con un poco de inercia según la velocidad al soltar
      irA(focoObj - limitar(arr.vel * 0.18, -2.5, 2.5));
      return;
    }
    const it = arr.it;
    if (!it) return;
    if (it.idx === Math.round(focoObj)) presentar(it);
    else irA(it.idx); // tocar una de costado la trae al frente
  });
  addEventListener('pointercancel', () => { arr.abajo = false; if (arr.arrastre) irA(focoObj); });

  // rueda horizontal / trackpad recorre; la vertical sigue bajando la página
  let ruedaEspera;
  lienzo.addEventListener('wheel', (ev) => {
    if (Math.abs(ev.deltaX) <= Math.abs(ev.deltaY)) return;
    ev.preventDefault();
    focoObj = limitar(focoObj + ev.deltaX * 0.006, 0, n - 1);
    clearTimeout(ruedaEspera);
    ruedaEspera = setTimeout(() => irA(focoObj), 140);
  }, { passive: false });

  // ---------- bucle ----------
  let activo = true, tiempo = 0, ultimo = performance.now();
  new IntersectionObserver(([e]) => (activo = e.isIntersecting)).observe(contenedor);

  let pausado = false, cuadro = 0, lento = 0;
  function bucle(t) {
    requestAnimationFrame(bucle);
    // no se dibuja si no se ve: fuera de pantalla, pestaña oculta o tapado por la persiana / la ficha
    if (!activo || pausado || document.hidden) { ultimo = t; return; }
    if (hoverPendiente) resolverHover();
    // en reposo (solo la brisa, que es lentísima) alcanza con 30 cuadros por segundo; al moverse, 60
    cuadro++;
    const quieto = !seleccion && !arr.abajo && Math.abs(foco.v) < 0.02 && Math.abs(foco.x - focoObj) < 0.002 && items.every((it) => Math.abs(it.vaiven.v) < 0.004 && Math.abs(it.vaiven.x) < 0.002);
    if (quieto && cuadro % (TACTIL ? 3 : 2)) return;
    const dtReal = (t - ultimo) / 1000;
    const dt = Math.max(1e-3, Math.min(0.04, dtReal));
    ultimo = t;
    // celular lento: si al moverse tarda más de ~28 ms por cuadro de forma sostenida, se baja la resolución una vez
    if (TACTIL && !quieto && resolucion > 1.5 && dtReal < 0.2) {
      lento = lento * 0.92 + (dtReal > 0.028 ? 0.08 : 0);
      if (lento > 0.6) { resolucion = 1.5; renderer.setPixelRatio(resolucion); medir(); }
    }
    tiempo += dt;

    // el foco sigue al dedo de cerca y se acomoda solo con un resorte firme
    resorte(foco, focoObj, dt, arr.arrastre ? 260 : 70);
    disponer();
    ubicar();

    // Donde no hay lugar (apiladas en las puntas) igual se superponen: cada malla se dibuja ENTERA por delante de las
    // que están más lejos de la elegida, como prendas apiladas (nunca cruzadas). La elegida va última, adelante de todo.
    items.slice().sort((p, q) => Math.abs(q.idx - foco.x) - Math.abs(p.idx - foco.x)).forEach((it, k) => {
      it.pivote.renderOrder = k + 1;
      if (it.percha) it.percha.renderOrder = k + 1; // la percha es un grupo propio: lleva el mismo turno
    });

    if (seleccion) selT = Math.min(1, selT + dt / 0.36);
    const sel = suave(selT);

    for (const it of items) {
      const x = it.x;
      // vaivén de percha: cada una se balancea según cómo la corrieron (acelerón propio)
      if (it.xAnt === null) it.xAnt = x;
      const vel = (x - it.xAnt) / dt;
      const acel = limitar((vel - it.vel) / dt, -60, 60);
      it.xAnt = x;
      it.vel = vel;
      const vv = it.vaiven;
      vv.v += (-acel * 0.03 - vv.x * 38 - vv.v * 3.2) * dt;
      vv.x = limitar(vv.x + vv.v * dt, -0.09, 0.09);
      // giro: de frente la elegida, de costado las demás y casi de canto las apiladas en las puntas
      it.giro = -it.lado * (GIRO + (GIRO_PILA - GIRO) * (it.pila || 0)) * it.cerrado;
      const brisa = Math.sin(tiempo * 0.9 + it.fase) * 0.006 + Math.sin(tiempo * 1.7 + it.fase * 2) * 0.003;
      const elegida = seleccion === it;
      it.pivote.position.x = x;
      it.pivote.rotation.set(0, it.giro + brisa * 2 + vv.x * 0.6, vv.x * 0.35 + brisa * 0.4);
      it.pivote.position.z = it.abierto * ADELANTE + (elegida ? sel * 0.55 : 0);
      it.pivote.scale.setScalar(1 + (elegida ? sel * 0.04 : 0));
      if (!it.malla) continue;
      // al elegir una, las demás se apagan un poco (como en la referencia)
      const apagar = seleccion && !elegida ? sel * 0.55 : 0;
      it.malla.material.color.setScalar(TONO * (1 - apagar));
      it.dorso.material.color.setScalar(DORSO * TONO * (1 - apagar));
      // la sombra acompaña el giro (más angosta de costado)
      it.sombra.position.x = x - it.centro * Math.cos(it.giro) + 0.14 + it.abierto * 0.06;
      it.sombra.scale.x = Math.max(0.12, Math.cos(it.giro));
      it.sombra.material.opacity = (0.14 + it.abierto * 0.16) * (1 - apagar);
    }
    renderer.render(escena, camara);

    const c = limitar(Math.round(focoObj), 0, n - 1);
    if (c !== ultimoCentro) { ultimoCentro = c; alCentrar?.(productos[c], c); }
  }
  requestAnimationFrame(bucle);

  return { mover, irA, hayHover, pausar: (p) => { pausado = p; } };
}
