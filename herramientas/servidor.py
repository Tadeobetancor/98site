"""Servidor local de la demo SIN caché: el navegador pide siempre la última versión de cada archivo.

Uso (desde 98site/):  python herramientas/servidor.py          → demo  en http://127.0.0.1:5198
                      python herramientas/servidor.py final    → final en http://127.0.0.1:5199
"""
import functools
import http.server
import pathlib
import sys

CARPETA = 'final' if 'final' in sys.argv[1:] else 'demo'
DEMO = pathlib.Path(__file__).resolve().parent.parent / CARPETA
PUERTO = 5199 if CARPETA == 'final' else 5198


class SinCache(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, must-revalidate')
        self.send_header('Expires', '0')
        super().end_headers()


if __name__ == '__main__':
    manejador = functools.partial(SinCache, directory=str(DEMO))
    with http.server.ThreadingHTTPServer(('127.0.0.1', PUERTO), manejador) as srv:
        print(f'{CARPETA} en http://127.0.0.1:{PUERTO} (sin caché)', flush=True)
        srv.serve_forever()
