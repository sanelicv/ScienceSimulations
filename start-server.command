#!/bin/sh
# Abre las simulaciones en un servidor local (macOS / Linux). Requiere Python 3.
# Opens the simulations on a local server (macOS / Linux). Requires Python 3.
cd "$(dirname "$0")" || exit 1

if command -v python3 >/dev/null 2>&1; then
  exec python3 start-server.py "$@"
elif command -v python >/dev/null 2>&1; then
  exec python start-server.py "$@"
else
  echo ""
  echo "  No se encontró Python 3. Instálalo desde https://www.python.org/downloads/"
  echo "  Python 3 was not found. Install it from https://www.python.org/downloads/"
  echo ""
  read -r _
fi
