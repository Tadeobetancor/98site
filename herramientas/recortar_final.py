"""Recorte FINAL de las mallas (calidad máxima).

- Foto original a resolución completa (EXIF + rotación de la tabla de CLAUDE.md).
- Balance de blancos y exposición usando la alfombra gris como carta de gris (como en la demo).
- Recorte con BiRefNet (rembg, modelo 'birefnet-general'): bordes finos y suaves.
- Se queda con la prenda (componente más grande), saca el "halo" gris de la alfombra en los bordes
  (decontaminación de color: los píxeles del borde toman el color de la tela de al lado).
- Realce suave: contraste local (CLAHE) + nitidez (unsharp) + un toque de saturación.
- Salida: WebP con transparencia, lado mayor 1600 px, recortada al contorno.

Uso:  C:/Users/tadeo/.venv-98site/Scripts/python herramientas/recortar_final.py [p01 p02 ...] [--destino carpeta]
"""
import argparse
import pathlib

import cv2
import numpy as np
from PIL import Image, ImageOps
from rembg import new_session, remove

BASE = pathlib.Path(__file__).resolve().parent.parent
FOTOS = BASE / 'Fotos de la ropa'

# id: (archivo dentro de "Fotos de la ropa", rotación en grados antihoraria)
PRINCIPALES = {
    'p01': ('1/WhatsApp Image 2026-11-15 at 01.51.38 (1).jpeg', 0),
    'p02': ('2/WhatsApp Image 2026-11-15 at 01.51.54 (1).jpeg', 0),
    'p03': ('3/WhatsApp Image 2026-11-15 at 01.51.55 (1).jpeg', 0),
    'p04': ('4/WhatsApp Image 2026-11-15 at 01.52.18 (1).jpeg', 0),
    'p05': ('5/WhatsApp Image 2026-11-15 at 01.52.09 (2).jpeg', 0),
    'p06': ('6/WhatsApp Image 2026-11-15 at 01.52.15 (5).jpeg', 180),
    'p07': ('7/WhatsApp Image 2026-11-15 at 01.52.12 (1).jpeg', 180),
    'p08': ('8/WhatsApp Image 2026-11-15 at 01.52.10 (1).jpeg', 0),
    'p09': ('9/WhatsApp Image 2026-11-15 at 01.52.15 (1).jpeg', 0),
}
LADO = 1600
MODELO = 'birefnet-general-lite'  # el completo ('birefnet-general') no entra en la memoria de esta PC

_sesion = None


def sesion():
    global _sesion
    if _sesion is None:
        _sesion = new_session(MODELO)
    return _sesion


def abrir(rel, rot):
    im = ImageOps.exif_transpose(Image.open(FOTOS / rel)).convert('RGB')
    if rot:
        im = im.rotate(rot, expand=True)
    return im


def balance_alfombra(bgr):
    """Balance de blancos + exposición midiendo la alfombra gris del borde (carta de gris)."""
    h, w = bgr.shape[:2]
    lab = cv2.cvtColor(bgr, cv2.COLOR_BGR2LAB).astype(np.float32)
    croma = np.hypot(lab[..., 1] - 128, lab[..., 2] - 128)
    borde = np.zeros((h, w), bool)
    t = int(min(h, w) * 0.05)
    borde[:t] = borde[-t:] = True
    borde[:, :t] = borde[:, -t:] = True
    ref = borde & (croma < 14)
    if ref.sum() < 500:
        return bgr
    f = bgr.astype(np.float32)
    g = f[ref].mean(0)
    f *= g.mean() / np.maximum(g, 1)
    f *= 120 / max(g.mean(), 1)
    return np.clip(f, 0, 255).astype(np.uint8)


def limpiar_mascara(alfa):
    """Se queda con la prenda (componente más grande) y rellena agujeros chicos."""
    duro = (alfa > 128).astype(np.uint8)
    n, lb, st, _ = cv2.connectedComponentsWithStats(duro)
    if n > 1:
        grande = 1 + np.argmax(st[1:, cv2.CC_STAT_AREA])
        cuerpo = (lb == grande).astype(np.uint8)
        # conserva el borde suave solo alrededor del cuerpo principal
        zona = cv2.dilate(cuerpo, np.ones((9, 9), np.uint8))
        alfa = np.where(zona > 0, alfa, 0).astype(np.uint8)
    # agujeros chicos adentro (reflejos que el modelo dejó transparentes)
    cnts, _ = cv2.findContours((alfa > 128).astype(np.uint8), cv2.RETR_CCOMP, cv2.CHAIN_APPROX_SIMPLE)
    relleno = np.zeros_like(alfa)
    cv2.drawContours(relleno, cnts, -1, 255, -1)
    huecos = (relleno > 0) & (alfa < 128)
    n, lb, st, _ = cv2.connectedComponentsWithStats(huecos.astype(np.uint8))
    area_max = alfa.size * 0.0015
    for i in range(1, n):
        if st[i, cv2.CC_STAT_AREA] < area_max:
            alfa[lb == i] = 255
    return alfa


def descontaminar(bgr, alfa):
    """Los píxeles semitransparentes del borde toman el color de la tela de al lado (sin halo gris)."""
    a = alfa.astype(np.float32) / 255
    solido = (a > 0.97).astype(np.float32)
    col = bgr.astype(np.float32) * solido[..., None]
    peso = solido.copy()
    acum_c, acum_p = col.copy(), peso.copy()
    for k in (3, 7, 15, 31):
        acum_c += cv2.blur(col, (k, k)) * k
        acum_p += cv2.blur(peso, (k, k)) * k
    relleno = acum_c / np.maximum(acum_p[..., None], 1e-4)
    mezcla = np.clip((a - 0.5) / 0.47, 0, 1)[..., None]  # borde → color de la tela, adentro → original
    out = relleno * (1 - mezcla) + bgr.astype(np.float32) * mezcla
    out = np.where(solido[..., None] > 0, bgr.astype(np.float32), out)
    return np.clip(out, 0, 255).astype(np.uint8)


def realzar(bgr):
    lab = cv2.cvtColor(bgr, cv2.COLOR_BGR2LAB)
    lab[..., 0] = cv2.createCLAHE(1.5, (8, 8)).apply(lab[..., 0])
    out = cv2.cvtColor(lab, cv2.COLOR_LAB2BGR)
    suave = cv2.GaussianBlur(out, (0, 0), 1.4)
    out = cv2.addWeighted(out, 1.45, suave, -0.45, 0)  # nitidez
    hsv = cv2.cvtColor(out, cv2.COLOR_BGR2HSV).astype(np.float32)
    hsv[..., 1] = np.clip(hsv[..., 1] * 1.06, 0, 255)
    return cv2.cvtColor(hsv.astype(np.uint8), cv2.COLOR_HSV2BGR)


def procesar(im_rgb):
    """Imagen PIL RGB → RGBA (np, BGRA) recortada al contorno de la prenda."""
    bgr = cv2.cvtColor(np.array(im_rgb), cv2.COLOR_RGB2BGR)
    bgr = balance_alfombra(bgr)
    rgba = np.array(remove(Image.fromarray(cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB)), session=sesion(), post_process_mask=False))
    alfa = limpiar_mascara(rgba[..., 3].copy())
    color = realzar(descontaminar(bgr, alfa))
    x, y, w, h = cv2.boundingRect((alfa > 10).astype(np.uint8))
    m = 6
    x0, y0 = max(0, x - m), max(0, y - m)
    x1, y1 = min(alfa.shape[1], x + w + m), min(alfa.shape[0], y + h + m)
    salida = np.dstack([color, alfa])[y0:y1, x0:x1]
    s = LADO / max(salida.shape[:2])
    if s < 1:
        salida = cv2.resize(salida, None, fx=s, fy=s, interpolation=cv2.INTER_AREA)
    return salida


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('ids', nargs='*')
    ap.add_argument('--destino', default=str(BASE / 'final' / 'img' / 'prendas'))
    args = ap.parse_args()
    destino = pathlib.Path(args.destino)
    destino.mkdir(parents=True, exist_ok=True)
    for pid in args.ids or PRINCIPALES:
        rel, rot = PRINCIPALES[pid]
        out = procesar(abrir(rel, rot))
        rgba = cv2.cvtColor(out, cv2.COLOR_BGRA2RGBA)
        Image.fromarray(rgba).save(destino / f'{pid}.webp', 'WEBP', quality=92, method=6)
        print(pid, out.shape[1], 'x', out.shape[0], flush=True)


if __name__ == '__main__':
    main()
