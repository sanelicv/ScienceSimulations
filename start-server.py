#!/usr/bin/env python3
"""
Servidor local para las simulaciones / Local server for the simulations.

Algunas simulaciones no funcionan al abrir el archivo HTML con doble clic
(file://), porque el navegador bloquea los módulos JavaScript y la carga de
archivos (fuentes, modelos 3D, texturas, datos). Este script sirve la carpeta
por HTTP en http://localhost y abre el navegador.

Uso / Usage:
    python start-server.py                         # abre el menú (index.html)
    python start-server.py astronomy/sky-calendar  # abre una simulación concreta
    python start-server.py --port 9000             # usa otro puerto
    python start-server.py --no-browser            # no abre el navegador

También puedes copiar este archivo dentro de la carpeta de una sola simulación
y ejecutarlo allí: servirá esa carpeta y abrirá su index.html.

Solo usa la librería estándar de Python (3.7 o superior). Pulsa Ctrl+C para detenerlo.
"""

import argparse
import functools
import http.server
import mimetypes
import os
import socket
import sys
import threading
import webbrowser

ROOT = os.path.dirname(os.path.abspath(__file__))
HOST = "127.0.0.1"

# En Windows, Python lee los tipos MIME del registro y a veces sirve .js como
# text/plain, lo que impide cargar módulos ES. Se fijan aquí explícitamente.
MIME_TYPES = {
    ".html": "text/html",
    ".js": "text/javascript",
    ".mjs": "text/javascript",
    ".css": "text/css",
    ".json": "application/json",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
    ".woff": "font/woff",
    ".woff2": "font/woff2",
    ".ttf": "font/ttf",
    ".otf": "font/otf",
    ".obj": "text/plain",
    ".csv": "text/csv",
    ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ".pdf": "application/pdf",
    ".wasm": "application/wasm",
}
for ext, mime in MIME_TYPES.items():
    mimetypes.add_type(mime, ext)


class Handler(http.server.SimpleHTTPRequestHandler):
    extensions_map = {**http.server.SimpleHTTPRequestHandler.extensions_map, **MIME_TYPES}

    def end_headers(self):
        # Sin caché: los cambios en los archivos se ven al recargar.
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def log_message(self, format, *args):
        # Solo se muestran los errores (404, 500…), no cada petición.
        if len(args) > 1 and str(args[1]).startswith(("4", "5")):
            sys.stderr.write("  [%s] %s\n" % (args[1], args[0]))


def find_free_port(preferred):
    for port in range(preferred, preferred + 50):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            try:
                s.bind((HOST, port))
                return port
            except OSError:
                continue
    raise SystemExit("No se encontró un puerto libre entre %d y %d." % (preferred, preferred + 49))


def main():
    parser = argparse.ArgumentParser(description="Servidor local para las simulaciones.")
    parser.add_argument("page", nargs="?", default="",
                        help="carpeta o archivo a abrir, relativo a esta carpeta (por defecto: index.html)")
    parser.add_argument("--port", type=int, default=8000, help="puerto preferido (por defecto: 8000)")
    parser.add_argument("--no-browser", action="store_true", help="no abrir el navegador")
    args = parser.parse_args()

    page = args.page.replace("\\", "/").strip("/")
    target = os.path.join(ROOT, page)
    if page and not os.path.exists(target):
        raise SystemExit("No existe: %s" % page)
    if os.path.isdir(target):
        page = (page + "/" if page else "")

    port = find_free_port(args.port)
    handler = functools.partial(Handler, directory=ROOT)
    server = http.server.ThreadingHTTPServer((HOST, port), handler)
    url = "http://localhost:%d/%s" % (port, page)

    print()
    print("  Servidor local en marcha / Local server running")
    print("  Carpeta / Folder : %s" % ROOT)
    print("  Dirección / URL  : %s" % url)
    print()
    print("  Deja esta ventana abierta mientras usas las simulaciones.")
    print("  Keep this window open while using the simulations.")
    print("  Pulsa Ctrl+C para detenerlo / Press Ctrl+C to stop.")
    print()

    if not args.no_browser:
        threading.Timer(0.6, webbrowser.open, args=(url,)).start()

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n  Servidor detenido / Server stopped.")
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
