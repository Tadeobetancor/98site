# 98 Vintage: tienda online de mallas (boardshorts) vintage

Base de conocimientos del proyecto. Todo esto ya está analizado: no hace falta volver a abrir las referencias salvo para un detalle puntual.

## Estado
- WhatsApp del negocio: 11 3163-5898 → `5491131635898` (ya cargado en `demo/datos.js`). Falta: Instagram de 98 Vintage, precios/talles/nombres reales, foto de frente de p10.
- `demo/`: demo de estructura funcionando (HTML + CSS + JS sin build, three.js por CDN). Servir con `python herramientas/servidor.py` (desde `98site/`, SIN caché: con `python -m http.server` el navegador se quedaba con módulos viejos, p. ej. la persiana) y abrir http://127.0.0.1:5198
- Parámetros de prueba: `?sinintro` saltea la persiana · `?persiana=0.5` congela la persiana a mitad · `?ficha=p03` abre una ficha · `?ver=coleccion` muestra desde esa sección.
- Próximo paso: el dueño revisa la demo, se ajusta la estructura y después se construye la versión final (subir el esfuerzo a high/max).
- Parámetros extra: `?carrito` abre el carrito (con un producto de prueba si está vacío).

## Decisiones tras la 1ª revisión del dueño (2026-11-15)
- Fuera: eslogan del perchero, sección de oferta (código + cuenta regresiva), badge "pieza única", sol naranja / fondo azul, glows y botones con sombra dura, flash de glitch a pantalla completa, "98 vintage" en el header, footer largo con marca gigante.
- Estética única en toda la página: fondo oscuro continuo (`fondo.js`: pared con tags apagados, manchas de aerosol, grano y glitch espontáneo cada 5-10 s), las FOTOS de producto sobre blanco (eso le gusta). Nada de secciones que salten negro→blanco→negro.
- UNA tipografía en la interfaz: Archivo (títulos 800 con `font-stretch:72%`, etiquetas 500 en mayúsculas con tracking .16em). Las de grafiti solo dentro de canvas (persiana y fondo).
- Botones "premium" (estilo Aimé Leon Dore / Our Legacy / Kith): rectos (radio 3px), borde 1px, mayúsculas espaciadas, sin sombras ni brillo. Primario hueso lleno, secundario de línea.
- Header siempre sólido (vidrio oscuro), logo centrado más grande, nav a la izquierda en compu, carrito a la derecha.
- Ficha: todo a la vista sin bajar. Galería deslizable (frente con características pinchadas, detalles, video) con miniaturas en compu y puntos en celular; talle + "Agregar · $precio" fijo abajo en celular. Al agregar: vuela al carrito y se abre el carrito.
- Footer corto: logo, secciones, redes, "© 98 Vintage · Argentina" y crédito chico "Sitio por [desdecero]".
- Persiana: grafitis FIJOS (semilla), entrelazados como `Referencias/persiana/grafitis/images (1).jpg`: recortes de las fotos de referencia (`demo/img/grafitis/*.webp`, el dueño autorizó usarlas en la prueba) + tags + stickers en capas alternadas. Dura ~12 s: 3,8 s cerrada, destrabe, subida de 7,2 s (pidió más lenta dos veces).

## Decisiones tras la 2ª revisión (2026-11-15): PASO A BLANCO, referencia principal = Cross Clothing
- Referencia nueva y principal: `Referencias/formato de pagina/Zip Carcosa - Black - CROSS CLOTHING.pdf` (página de producto de crossclothing, impresa en celular). Rasgos copiados: página blanca, barra negra de avisos, header blanco con logo centrado, fotos 4:5 de borde a borde sobre gris muy claro, nombres en negrita MAYÚSCULA chica, botón negro lleno "AÑADIR AL CARRITO" + botón cuadrado al lado, talles en cuadraditos, acordeones con "+" (guía de talles, cuidados, cambios, envíos, medios de pago), "También te puede interesar" en grilla, footer gris claro con columnas y "WEBSITE: AMNEWELL" (para nosotros: "Website: desdecero").
- Lo de la revisión anterior que se REEMPLAZA: el fondo oscuro continuo (`fondo.js` se borró). La persiana sigue siendo oscura (intro); al abrirse aparece la tienda blanca.
- Logo sobre blanco: `demo/img/logo-tinta.png` (aqua profundo #267077 con la textura original). El aqua claro queda para la persiana.
- Header más grande (76 px celular / 100 px compu, logo casi de ese alto). Menú lateral en celular; nav con filtros por marca en compu.
- Perchero compacto y "con información": pared blanca encalada (`pared.js`, basada en `images (1).jpg`, fotos en gris con bordes difuminados + tags tenues + glitch suave); cámara ajustada al tamaño real de las mallas (más grandes, sin aire de sobra); debajo, la malla del centro: nombre, precio, talles, barritas de posición (clicables), "Ver malla". Tocar una malla la trae al centro.
- Colección: filtros por marca (Todo / Billabong / Metallica × Billabong / Otras), al pasar el mouse muestra la foto de detalle y una barra para añadir por talle.
- Sección de beneficios (envíos, compra simple, elegidas una por una). Textos de envíos/cambios/pagos/cuidados en `datos.js` (`INFO_TIENDA`) son PROVISORIOS: confirmar con el dueño (ej. "cambios dentro de 30 días").
- Pruebas visuales: el Edge headless sin GPU no dibuja WebGL; con `--use-angle=d3d11 --enable-gpu --ignore-gpu-blocklist --timeout=25000` sí se ve el perchero.

## Decisiones tras la 3ª revisión (2026-11-15)
- OJO: la PC del dueño tiene los "efectos de animación" de Windows APAGADOS → el navegador manda `prefers-reduced-motion: reduce`. Antes eso apagaba todo (persiana <1 s, paneles que aparecían de golpe). Ahora: los tiempos de la persiana no dependen de eso (solo se sacan los temblores) y no hay regla global que mate animaciones.
- Persiana: ~6,6 s (1,9 s cerrada + destrabe 0,8 + pausa 0,3 + subida 3,6). Fácil de ajustar en `persiana.js` (CERRADA/DESTRABE/PAUSA/SUBIDA).
- Perchero: UN TOQUE abre la ficha (se sacó el "mantener apretado" y el anillo). Arrastrar sigue deslizando.
- Todo se abre y cierra animado (Web Animations API en `app.js`): la ficha se despliega desde la malla/tarjeta tocada (clip-path) y vuelve ahí al cerrar; carrito y menú entran deslizando con el contenido en cascada; acordeones con altura animada; tarjetas en cascada al filtrar.
- WhatsApp: pastilla negra que se estira desde el círculo con "¿Dudas? Escribinos" (sin cuadro blanco).
- Menú del celular: "Menú" + cerrar arriba, secciones grandes con foto y cantidad, "Recién colgadas" deslizable y el logo AL FINAL con WhatsApp/Instagram.
- Ficha en celular: fotos al 84% con la siguiente asomando (se entiende que se deslizan), contador 1/4, orden pensado para comprar (nombre, precio, talle, botón; la descripción después) y visor a pantalla completa con zoom al tocar la foto. Las fotos de detalle siguen siendo de celular sobre alfombra: la mejora real es re-fotografiar.
- Parámetro de prueba extra: `?tip` deja el WhatsApp estirado · `?menu` abre el menú.

## Decisiones tras la 4ª revisión (2026-11-15)
- Persiana: NO se abre sola. Espera un toque (destrabe + subida de 3,6 s), o se arrastra hacia arriba con el dedo/mouse (si se suelta antes del 20% rebota y baja); también rueda del mouse o Enter. Sale entera de la pantalla: se SACÓ la caja gris de arriba. Mientras espera "amaga" subir cada ~4,5 s y muestra "Tocá o deslizá hacia arriba".
- Chapa: negra, oxidada y vieja (manchas de corrosión más abajo, chorreados de óxido desde las juntas, picaduras, viñeta). Grafitis streetwear y más visibles, también en el centro: throw-ups de burbuja (Rubik Bubbles) cromados/rojos/amarillos con doble contorno, tags en aerosol (Rubik Spray Paint / Sedgwick), coronas, flechas, estrellas, palabras locales (OESTE, HLGM, ZO). Solo el núcleo del logo queda sin stickers; el logo se despega con una sombra chica + su contorno negro y brillo aqua.
- Somos de HURLINGHAM (zona oeste): aparece en la barra de avisos, beneficios, footer y envíos ("Retiro sin cargo en Hurlingham" es PROVISORIO).
- Ficha: guía de talles visual (dibujo de la malla con medidas A/B + tabla que marca el talle elegido y los que hay) y envíos/pagos/cambios/cuidados como tarjetas, fichas con ícono, 3 pasos y símbolos de lavado (`INFO_TIENDA` + `GUIA_TALLES` en `datos.js`, medidas PROVISORIAS).
- Footer: lo último es "© 2026 98 Vintage · Argentina"; justo arriba, crédito con presencia: "Diseño y desarrollo" + logo desdecero (`img/desdecero-negro.png`) + @desdecero.labs.
- Logo del header: glitch cada 5 s (regular) además de al tocarlo.
- Parámetros de prueba: `?acordeones` (ficha con todo abierto) · `?ver=pie` (solo footer).

## Decisiones tras la 5ª revisión (2026-11-15)
- Persiana: VUELVE a abrirse sola (1,9 s cerrada → destrabe → subida). Tocar/arrastrar la adelanta; si se suelta un arrastre corto, rebota y se abre sola 1,2 s después.
- Logo de la persiana más protagonista: más grande (47% del alto), "tapado" negro irregular detrás, contorno blanco SOLO por afuera (silueta exterior cerrada con blur + umbral, para no tapar los huecos internos) + contorno negro fino + brillo aqua en dos pasadas.
- Barra de avisos: 40 px, negra, letras blancas 12,5-13 px en negrita, separadores ✦ aqua.
- Menú: secciones SIN fotos (nombre grande + cantidad + flecha). WhatsApp e Instagram como botones con su ícono que se pintan con su color al tocarlos (verde WA / degradé IG).
- Footer: el crédito es SOLO el logo de desdecero (sin "Diseño y desarrollo" ni @), arriba del "© 2026 98 Vintage · Argentina".
- Pruebas visuales: si una captura no se genera, el PNG viejo queda con el mismo nombre (no se pueden borrar desde acá) → usar nombres nuevos. La persiana con WebGL/sombras pesadas sale mejor con la variante de GPU.

## Decisiones tras la 6ª revisión (2026-11-15)
- Persiana: se abre SOLA en UN movimiento continuo (1,3 s cerrada → subida de 3,4 s, `cubic-bezier(0.55,0.05,0.3,1)`), con Web Animations sobre transform para que no se trabe aunque cargue el 3D. Se sacaron el destrabe, la pausa, el "Tocá para abrir" y toda interacción (constantes CERRADA/SUBIDA en `persiana.js`).
- Logo de la persiana: SIN borde blanco y SIN mancha oscura detrás. Va directo sobre los grafitis, con extrusión 3D verde-agua oscura, contorno negro fino y brillo aqua. Grafitis rojos y blancos con "diseños" (rellenos de rayas, lunares y partidos, más cromo), fila de pósters streetwear pegados arriba (98 rojo / NO WAVE NO FUN / LOCALS ONLY) y pie realista dibujado en canvas (perfil de acero cepillado, manijas, cerradura central, candado y burlete). La foto del pie real que mencionó el dueño NO estaba en `Referencias/`: pedírsela.
- Perchero REHECHO según `Referencias/perchero/*.mp4`: mallas apretadas y giradas de costado; la del foco gira de frente y las vecinas se corren. Movimiento rígido con resortes (sin física de tela), un leve vaivén de percha y sombra suave en la pared. Compu: pasar el mouse elige (el barral queda quieto), clic abre. Celular: deslizar recorre, tocar la del centro abre. Al abrir, la malla se adelanta y las demás se apagan antes de la ficha. Arranca con la del medio de frente. Barral con puntas (ya no es circular).
- Ficha según `Referencias/formato de pagina/Producto modelado de seccio.mp4`: precio GRANDE pegado a la foto, precio anterior tachado + "-%", "3 cuotas sin interés de $X" y "$X con transferencia", botón "Agregar al carrito" en aqua profundo (el único bloque de color) FIJO abajo en celular, descripción dentro del acordeón "Descripción", migas solo en compu. `PAGOS` y los `antes:` de `datos.js` son PROVISORIOS.
- Barra de avisos: negra, letras blancas, 44 px y con aire. Había un selector CSS cortado que la dejaba sin estilo. Frases de marca (la de cuotas es provisoria).
- Header: blanco sólido arriba y, al bajar, blanco al 72% con desenfoque (`.barra.flotando`).
- Pruebas: el Edge headless tiene un mínimo de ~500 px de ancho, así que para ver el celular hay que cargar la página dentro de un iframe de 390 px. Con `--timeout` los timers casi no corren después de cargar, así que las animaciones quedan en su estado inicial.

## Decisiones tras la 7ª revisión (2026-11-15)
- Persiana NUEVA según `Referencias/persiana/persiana.jpg`: lisa, negra mate, cajón arriba, guías a los costados y zócalo; SIN grafitis ni pósters, solo el logo al centro. Dos reflectores cálidos (uno en cada punta, colgados del cajón) apuntan en diagonal al logo, como `luces chapa.jpg`. Secuencia: aparece prendida → luces + logo titilan DOS veces → sube (constantes PRENDIDA/TITILA/SUBIDA y PARPADEO en `persiana.js`). Dos canvas: `.persiana-base` (apagada) y `.persiana-luces` (lo que suma la luz); el titileo es la opacidad del de luz.
- RESPALDO: la persiana con grafitis quedó en `persiana-grafitis.js` → se ve con `?intro=grafitis`.
- Perchero según `Movimiento de perchero.mp4`: barral de aluminio FIJO de borde a borde de la pantalla con un aplique a la pared en cada punta (roseta + brazo + copa); lo único que se desliza son las perchas. Perchas: gancho de metal plateado apoyado sobre el tubo + cuerpo de madera marrón oscura con hombros + dos pinzas de metal. Las que pasan los apliques se desvanecen. En compu medianas se achica un poco para que entre todo.
- Fondo del perchero: `img/madera.webp` (= `Referencias/perchero/madera.jpg` girada 90°, tablones horizontales) con viñeta; la info de la malla queda en franja blanca. RESPALDO: la pared blanca anterior (`pared.js`) se ve con `?fondo=pared`.
- Cierres: ficha, carrito, menú y visor se van DESLIZANDO enteros (ficha → derecha como "volver", visor → abajo) con `CIERRA` = cubic-bezier(0.45,0,0.2,1), 560-620 ms. Ya no se desvanecen ni la ficha vuelve "encogiéndose" a la malla. Las aperturas no se tocaron (al dueño le gustan).
- `Referencias/perchero/images.jpg` e `images (1).jpg` son fotos de plantas: no se pidió nada con ellas todavía.
- Pruebas: para que el 3D llegue a dibujarse en la captura usar `--virtual-time-budget=20000` (con `--timeout` a veces sale vacío porque three.js no terminó de cargar).

## Decisiones tras la 8ª revisión (2026-11-15) — reemplaza parte de la 7ª
- LA MARCA AHORA SE LLAMA **98 District** (antes 98 Vintage). Cambiado en títulos, alt, WhatsApp, footer, firma y pósters de la persiana ('VNTG' → 'DSTRCT'). "vintage" quedó solo donde describe la ropa ("Boardshorts vintage"). FALTA: el Instagram nuevo (`datos.js` sigue con 98.vintage) y saber si el logo cambia. La carpeta del proyecto sigue llamándose 98.vintage.
- Perchero: VUELVE la pared blanca (`pared.js`) como fondo por defecto. La madera quedó guardada: `?fondo=madera`. El barral fijo y las perchas de madera de la 7ª se mantienen.
- Persiana: VUELVE la de grafitis (`persiana.js`) + dos LED cálidos chiquitos pegados ARRIBA DEL TODO (sin cajón), uno en cada punta, apuntando al logo. La luz va en `.persiana-luces` con `mix-blend-mode: screen`, recortada con la silueta del logo (no lo tiñe ni lo tapa: solo baña alrededor y suma halo aqua). Los LED titilan dos veces y sube. La persiana lisa (no gustó) quedó en `persiana-lisa.js` → `?intro=lisa`.
- Cierre de la ficha: con GLITCH (`GLITCH_CIERRE` en `app.js`: franjas con clip-path, corrimientos, separación RGB con drop-shadow, y al final se aplasta en una línea y se apaga como tele vieja; además glitch de la pared y del logo del header). Carrito/menú/visor siguen cerrando deslizándose.

## Decisiones tras la 9ª revisión (2026-11-15) — reemplaza lo del barral de la 7ª
- Perchero: SIN apliques de pared. Barral recto que cruza toda la pantalla (sale por los bordes) y no se mueve. Las mallas NUNCA salen de la pantalla ni aparecen de la nada: si no entran, la de frente se ubica según su lugar en el perchero y las demás se comprimen hacia las puntas (sueltas cerca de la elegida, APILADAS y casi de canto en los extremos; `ubicar()` en `perchero.js`). Cada percha se balancea según cómo la corrieron.
- Percha más chica y real: del ancho de la CINTURA de cada malla (se mide en el alfa de la foto: `medirCintura`), la cintura queda centrada bajo el gancho y las dos pinzas muerden el elástico (antes agarraban aire). Gancho apoyado sobre el tubo.
- Persiana más rápida (daba ansiedad): LED prendidos 0,3 s → titilan dos veces (0,64 s) → sube en 1,5 s.
- Barra de avisos con emojis (🌊 📦 ✨ 💳 📍 🔄).

## Decisiones tras la 10ª revisión (2026-11-16)
- LOGO NUEVO (mejor calidad): el dueño dejó `98site/logo.png` (1254×1254, aqua sobre NEGRO, sin transparencia). Se le sacó el fondo (alfa por brillo + des-premultiplicado), se recortó → `demo/img/logo.png` (886×749) y `demo/img/logo-tinta.png` (aqua profundo). Los anteriores quedaron como `logo-anterior.png` / `logo-tinta-anterior.png`.
- Persiana (`persiana.js`): sin "98 district"/DSTRCT (ni firma bajo el logo, ni throw-up, ni pósters). Grafitis NUEVOS: la base son las fotos reales de paredes de las referencias (teselas oscurecidas con bordes desvanecidos que cubren toda la chapa) + pocos "hollows" (burbuja solo contorno plata/blanco/aqua o negro con borde plata) + firmas y tags blancos/plata. Sin rojo, rayas, lunares, pósters ni íconos. RESPALDO de la anterior (roja/blanca con pósters y pie con candados): `persiana-roja.js` → `?intro=roja`.
- Persiana: SIN pie con manijas/cerradura/candado: lamas hasta abajo + una franja finita de metal cepillado (`baseMetal`). Luces LED y brillos del logo mucho más tenues. Mini zoom out (scale 1.07 → 1) mientras titilan las luces, y recién ahí sube.
- Cierre de la ficha: glitch MÁS LLAMATIVO (950 ms): pantalla negra con barrido y ruido detrás (`.glitch-capa`, así los cortes no muestran la tienda "rota"), franjas de píxeles que saltan adelante (`.glitch-frente`), separación RGB fuerte, dos destellos invertidos y apagado de tele; después la pantalla negra se desvanece.

- Mallas del perchero con VOLUMEN: ya no son una lámina. `campoProfundidad()` calcula la distancia al borde sobre el alfa; la cara de adelante se infla hacia adelante y un `dorso` (BackSide, más oscuro: `DORSO`) hacia atrás, juntándose en el borde (GROSOR 0,085 por cara). El dorso es hermano de la malla para que el toque/hover siga mirando solo la cara de adelante.

## Decisiones tras la 11ª revisión (2026-11-16)
- Persiana: SIN zoom out. Grafitis menos cargados y más grandes: teselas de pared real más grandes (0,85 de la pantalla), muy pocas firmas, 2-3 hollows grandes que NO se acercan al logo, pocos tags grandes.
- Abrir/cerrar producto: RÁFAGA de viento con espuma de mar (estilo surfer, según `Referencias/animaciones/Animaciones estetica y fuente.mp4` ~0:04, cambio de producto con niebla). `soplar()` en `app.js`: banda de espuma aqua (ruido SVG estirado) + salpicaduras + desenfoque de lo de abajo (backdrop-filter) + pared de niebla densa en el frente; la ficha se recorta (clip-path muestreado en sincronía) justo detrás del frente. Abre soplando desde el lado de la malla tocada; cierra soplando al revés ("se la lleva"). El nombre aparece letra por letra. Se SACÓ el glitch de cierre. Prueba: `?rafaga=0.15` congela la ráfaga.
- Se SACÓ la barra de frases de arriba. Las frases ahora están en `.frases` (después del perchero): dos filas de tipografía gigante condensada (una llena, otra con contorno aqua) que se deslizan con el scroll en sentidos opuestos y se inclinan con la velocidad. `?ver=frases`.
- Header: más bajo (62 px celular / 74 px compu) y SIEMPRE translúcido con desenfoque (como al bajar), flotando sobre el perchero (el perchero tiene padding-top = alto del header).
- Footer: el logo de desdecero lleva debajo "Instagram ↗" con ícono, para que se entienda que lleva al Instagram.

## Decisiones tras la 12ª revisión (2026-11-16)
- Footer NUEVO, oscuro (#0b0b0d) y compacto (~170 px en compu): arriba, logo aqua + "Boardshorts vintage · Hurlingham" | links en una línea (Perchero, Colección, Carrito, Envíos, Cambios, Contacto; subrayado aqua al pasar) | botones redondos WhatsApp / Instagram (se pintan con su color). Abajo, centrado: logo blanco de desdecero + "Instagram ↗" y, como ÚLTIMA línea, "© 2026 98 District · Argentina". En celular todo centrado.
- BUG corregido: al sacar la barra de avisos (11ª) quedó un `@media (min-width: 900px) {` sin cerrar en `estilos.css` → en celular casi toda la página quedaba sin estilos. Después de editar CSS con scripts, verificar que las llaves `{ }` estén balanceadas.
- Pruebas: `?ver=pie` muestra solo el footer (oculta también el header) · `?abajo` intenta ir al final (en el Edge headless sale en blanco).

## Decisiones tras la 13ª revisión (2026-11-16)
- Footer: sigue NEGRO pero alineado a la IZQUIERDA (no centrado): marca (logo + "Boardshorts vintage · Hurlingham") + columnas cortas Tienda / Ayuda / Seguinos (texto, SIN botones-ícono de WhatsApp/Instagram). Abajo CENTRADOS: desdecero + "Instagram ↗" (texto) y el © como última línea.
- Ráfaga (abrir/cerrar producto) más BLANCA: espuma casi blanca, capa aqua suave, niebla del frente blanca, gotas blancas.
- BUG "las mallas/productos cambian de tamaño al abrir la página o cerrar un producto": al bloquear el scroll (persiana, ficha, carrito, menú) desaparecía la barra de scroll en compu → el ancho cambiaba ~17 px → todo se reacomodaba y el 3D mostraba un cuadro estirado. Arreglo: `scrollbar-gutter: stable` en `html` + el perchero se redibuja en el mismo instante en que cambia de tamaño (`medir()`).
- Frases: se SACARON las filas gigantes que se movían con el scroll (daban ansiedad, no se leían). Ahora `.avisos` (después del perchero): barrita negra con UNA frase por vez (emoji + texto), quieta ~3,8 s, las letras entran rodando desde abajo, cambia sola (SIN línea de tiempo), contador 1/6, tocar = siguiente, pausa al pasar el mouse. Las frases están en `AVISOS` (`app.js`).

## Decisiones tras la 14ª revisión (2026-11-16)
- Persiana: los grafitis se REEMPLAZARON por el mural `Referencias/persiana/grafitis/selfles.jpg` (estilo Basquiat: turquesa, amarillo, rojo, negro). Tenía marca de agua de TikTok (@kogasoundsx) → se borró con inpainting de OpenCV → `demo/img/grafitis/selfles.webp`. Se pinta cubriendo toda la persiana (sin deformar, un poco oscurecido) + óxido suave + lamas + franja metálica. RESPALDO de la anterior (fotos de pared + hollows): `persiana-pared.js` → `?intro=pared`. (`grafiti.jpg`, pared de afiches arrancados, también está en Referencias pero no se usó.)
- Logo de la persiana: SIN borde negro ni extrusión; solo una sombra suave debajo (no contorno) + brillo aqua.
- Sombras del logo según las luces (`sombrasLogo()` en `persiana.js`): cada LED de arriba proyecta la silueta del logo hacia el lado contrario (la de la izquierda abajo-derecha y viceversa), oscura (0,82) en la chapa; además en la capa de luz se recorta esa sombra, así cuando las luces prenden/titilan el contraste sube y baja con ellas.

## VERSIÓN FINAL (2026-11-16) — `98site/final/`
- `final/` = copia de `demo/` sin respaldos (persianas roja/lisa/pared, logos anteriores). La demo queda intacta. Servir: `python herramientas/servidor.py final` → http://127.0.0.1:5199 (la demo sigue en 5198). De acá en más los cambios van en `final/`.
- Fotos de las mallas: `herramientas/recortar_final.py` con rembg modelo 'birefnet-general-lite' (el completo no entra en memoria en esta PC). venv FUERA de OneDrive: `C:/Users/tadeo/.venv-98site` (dentro de OneDrive pip falla por archivos bloqueados). Original a resolución completa → balance con la alfombra → recorte IA → descontaminación del borde → CLAHE + nitidez → `final/img/prendas/pNN.webp` (600-900 px, las fotos de WhatsApp no dan más). En `final/` `foto()` y el perchero usan `.webp`; las fotos recortadas se detectan con `includes('/prendas/')`.
- Logo de la persiana como aerosol (relleno plano + 15% de textura + sobre-pulverizado + salpicaduras), en demo y final.
- Rendimiento (solo en `final/`, sin cambios visuales): el perchero 3D dibuja a 30 cps en reposo (solo brisa) y 60 al moverse; se pausa con la ficha abierta (`pausar()`, 2,2 s después de abrir; vuelve al cerrar); pixel ratio máx. 1,5 (antes 2); el raycast del hover corre una vez por cuadro. Si sigue lento, los siguientes sospechosos son los `backdrop-filter` (header y ráfaga) — tocarlos cambia la estética, consultar antes.
- Mallas del perchero menos brillosas: `TONO = 0.8` en `final/perchero.js`, roughness 1 y casi sin reflejo de ambiente.
- PENDIENTE: fotos de detalle (`img/detalles/*.jpg` siguen siendo de celular sobre alfombra; lo ideal es re-fotografiar), videos sin tratar, datos reales (precios, talles, nombres, Instagram), publicar (hosting/dominio), los parámetros de prueba (?sinintro, etc.) siguen activos.

## Pedido del cliente (resumen)
- Prioridad: que comprar sea simple y que la ROPA sea lo más llamativo. El usuario tiene que pensar lo menos posible.
- Estética: elegante + vintage + streetwear. Base negra, grafitis apagados, azul del logo solo en lo importante. Toques de playa (sol, agua, brisa).
- Orden de la página: persiana (intro) → perchero 3D (lo primero que se ve) → sección de oferta/urgencia → colección en grilla → footer.
- Header: logo centrado + carrito a la derecha con contador. Logo con animaciones.
- Persiana: chapa negra grafiteada (grafitis "under" modernos, menos protagonistas que el logo), el logo en el centro como un grafiti más, sube suave a velocidad moderada y deja ver la página. Sin fondo/pared: solo la persiana.
- Perchero: barral RECTO (no curvo como la referencia), prendas que se sienten reales: movimiento, textura, reaccionan al tocarlas/pasar el mouse, deslizar izquierda/derecha. Mantener apretado abre la ficha (foto grande, talles, precio, detalles).
- Ficha: foto grande + fotos de detalle + videos, talles, precio, agregar al carrito.
- Grilla: como West Coast, 2 productos por fila (en celular), fotos limpias sobre blanco (referencia del video "Productos").
- Oferta tras el perchero: razón para comprar HOY (código + cuenta regresiva), referencia `Oferta marketing.jpeg`.
- Efectos pedidos: glitches al hacer clic, producto que vuela al carrito, productos que aparecen "fluidos" al bajar, logo de fondo, contraste.
- Botones estilo repzone (sombra dura que se hunde, bordes, paneles que se despliegan como cortina).
- WhatsApp abajo a la derecha como vapesoon: cartel "¿Dudas? Escribinos" unos segundos al entrar y al mantener apretado.
- Footer como vapesoon con crédito "Página hecha por" + logo desdecero + @desdecero.labs.

## Identidad
- Logo: `logo.jpeg` (surfista corriendo con tabla, "98" dentro de la tabla). Versión transparente: `demo/img/logo.png`.
- Colores: negro `#0a0a0b`, negro-2 `#141417`, hueso `#f3f0e9` (sección blanca), aqua del logo `#8fdce2` (medido), aqua profundo `#3c8c93` (sombra de botones), sol `#ffb547` (acento playa, poco), WhatsApp `#25d366`.
- Tipografías (Google Fonts): Archivo variable (display condensado `font-stretch:70%`, botones itálicos 900 expandidos como repzone), Instrument Serif itálica (toque elegante en `<em>`), Space Mono (etiquetas/precios), Sedgwick Ave Display + Rubik Wet Paint + Permanent Marker + Rock Salt (solo grafitis).

## Referencias analizadas (`Referencias/`)
- `persiana/*.jpg|webp`: persiana de lamas horizontales negra mate con caja arriba.
- `persiana/grafitis/`: paredes con stickers, tags blancos/negros, throw-ups; los 3 .avif son la MISMA foto (pared negra con stickers + tag amarillo). Estilo a seguir: tags + stickers + chorreados, apagados.
- `formato de pagina/Carrusel de prendas.mp4`: perchero con prendas colgadas en perchas sobre fondo blanco, título "Layers that hang right", al tocar la prenda se abre grande con talles, precio y "Add to cart"; carrito lateral. Es 2D: el cliente quiere 3D real.
- `formato de pagina/Productos.mp4`: tienda blanca minimalista, grilla de productos que aparecen al entrar, ficha con foto de modelo + selector.
- `formato de pagina/Tienda Online de WEST COAST.html`: Tiendanube, grilla 2 por fila.
- `Fotos de productos.jpeg`: foto en piso de madera vs foto con fondo neutro, "nadie paga por algo que parece de Wallapop". Lección: fondo limpio y parejo.
- `Oferta marketing.jpeg`: "No hay ninguna razón para comprar hoy": banner con código de descuento + cuenta regresiva.
- `animaciones/`, `colores/`, `fuentes/`: vacías. El video está suelto: `Referencias/Animaciones estetica y fuente.mp4`.
- **`Animaciones estetica y fuente.mp4` (LA referencia principal de estética, tienda "KRYOTH", ropa de nieve):**
  - Paleta MONOCROMÁTICA: todo en tonos de un solo color (azul pizarra sobre fondo hielo). Para 98: negro + familia aqua del logo (#8fdce2 → #3c8c93 → #16282a) + hueso; el naranja sol solo como acento mínimo.
  - Tipografía: titulares grotesk condensada muy pesada en MAYÚSCULAS + frase chica arriba en sans fina ("Scroll this store. / CLIMB 8,848 M."). Equivalente: Archivo 800-900 con `font-stretch` 62-70%.
  - Grafiti gigante de la marca DETRÁS del producto en el hero (hecho: `.tag-fondo`).
  - Hero: producto grande al centro, nombre gigante a la izquierda, talles, botón pastilla "Add to cart $899 →" (flecha en círculo negro), variantes a la derecha. Cambio de variante con transición de niebla/humo.
  - "It flies to the bag": la prenda vuela al carrito (hecho). Carrito lateral blanco con "Pairs with" (hecho: "Combiná con").
  - "Every card sells on hover": al pasar el mouse la tarjeta muestra "Add to cart · choose size" con talles (hecho: `.tarjeta-rapido`; en celular con el "+").
  - "Proof that counts itself": números que cuentan solos. "Type that moves like weather": texto grande que se revela/mueve con el scroll.
  - "The jacket flies in, specs pin on": la prenda entra volando y aparecen etiquetas pinchadas con punto (hecho en la ficha: `.pin`).
  - "Gear you can grab and throw": accesorios arrastrables con física. "Every review plants a flag": reseñas sobre un gráfico de montaña.
  - Footer: cuenta regresiva del próximo drop + lista de espera por email; marca GIGANTE con productos sentados sobre las letras (hecho: `.pie-gigante`).
  - "Cart to checkout in two clicks".
  - Pendiente de llevar a la versión final: transición de niebla entre prendas (para 98: espuma de ola / agua), contadores animados, texto que se mueve con el scroll, reseñas, lista de espera.
- Proyectos propios reutilizables: `../../proyectos/repzone/src/` (tokens.css, .btn en base.css, ui/despliegue.js con GSAP persiana/cortina/acordeón, whatsapp.css) y `../../vapesoon/página/vapesoon-site/index.html` (.fab-wpp + .fab-tip + showWppTip, footer .footer-made, img/desdecero.webp).

## Productos (`Fotos de la ropa/`): todas fotos de celular sobre alfombra gris
| id | carpeta | prenda | foto principal elegida | notas |
|---|---|---|---|---|
| p01 | 1 | Patchwork gris/negro/escocés | 01.51.38 (1) | detalles 01.51.38 (3), 01.51.39 (1); video |
| p02 | 2 | Billabong pinstripe rojo | 01.51.54 (1) | espalda 01.51.54 (2); video |
| p03 | 3 | Billabong pinstripe navy | 01.51.55 (1) | MUCHOS detalles. Ojo: carpeta 3 mezcla fotos del Metallica gris (01.52.17 (1)…(4), 01.52.18 (5)) que son de p04 |
| p04 | 4 | Metallica × Billabong gris "ojos" | 01.52.18 (1) | |
| p05 | 5 | Rojo "Authentic & Original" | 01.52.09 (2) | recorte por color; video |
| p06 | 6 | Metallica × Billabong dorado | 01.52.15 (5) | foto al revés: rotar 180° |
| p07 | 7 | Metallica × Billabong turquesa | 01.52.12 (1) | rotar 180° |
| p08 | 8 | Split anime / camuflaje | 01.52.10 (1) | 2 videos |
| p09 | 9 | Metallica × Billabong blanco | 01.52.15 (1) | video |
| p10 | 10 | Metallica × Billabong azul | (pendiente) | fotos torcidas, falta una de frente derecha |
| — | sueltas | grupales, cama, varias juntas | no usar como principal | |

Precios, talles y nombres de la demo son INVENTADOS: pedirle los reales al cliente.

## Tratamiento de fotos (decidido)
- La alfombra gris sirve como CARTA DE GRIS: balance de blancos + exposición se igualan midiendo la alfombra (pixeles de bajo croma), así todas las fotos quedan con la misma luz.
- Recorte: OpenCV GrabCut iniciado con máscara (alfombra = textura alta + bajo croma). Script: `herramientas/recortar.py`; para la versión final usar un modelo de segmentación (rembg / BiRefNet) para bordes finos, y retocar arrugas/pelusas.
- Ideal a futuro: re-fotografiar colgadas o planas sobre fondo liso con luz pareja, frente + espalda + 2-3 detalles por prenda.

## Perchero 3D: técnica (decidida y probada en la demo)
- three.js r170. Cada prenda = PlaneGeometry (15 × ~18) con la foto recortada como textura (alphaTest) y física de tela Verlet/PBD propia en CPU (`demo/perchero.js`, clase `Tela`): restricciones estructurales + corte + flexión, 10 iteraciones, 2 pinzas por esquina de la cintura.
- Realismo: normales recalculadas por frame (los pliegues sombrean), luz de sol cálida + contraluz aqua, RoomEnvironment para el metal, brisa con ruido, inercia cuando el perchero acelera, empuje local al pasar el puntero, presión al mantener apretado.
- Interacción: arrastrar horizontal = deslizar (se acomoda en una percha), rueda horizontal/trackpad, flechas, hover/tap = etiqueta con nombre y precio, mantener 650 ms (anillo de carga) = abre la ficha. Se testea el alfa de la textura para no abrir tocando lo transparente.
- Mejoras pendientes para la versión final: textura de espalda distinta (hoy la cara trasera espeja el frente), normal map de tela generado desde la foto, sombras suaves sobre la pared, recorte más fino de bordes, perchas con más detalle, LOD/pausa en celulares lentos, posible paso a GPU (shader) si se suman muchas prendas.
- Alternativas descartadas por ahora: modelos 3D por fotogrametría/IA (caros y pesados), motores de soft-body (Ammo/Rapier) (más pesados que un Verlet propio).
