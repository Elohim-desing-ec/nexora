#!/usr/bin/env bash
# Publica NEXORA en GitHub Pages (rama gh-pages) → https://elohim-desing-ec.github.io/nexora/
#   1) Corre las pruebas: si algún cálculo financiero falla, NO se publica.
#   2) Compila la app.
#   3) Copia dist/ a la rama gh-pages en una carpeta temporal y la sube (commit normal, sin forzar).
set -euo pipefail
cd "$(dirname "$0")/.."
DESTINO="$(mktemp -d)/gh-pages"

echo "▶ Pruebas…";    npm test --silent
echo "▶ Compilando…"; npm run build --silent
touch dist/.nojekyll   # GitHub Pages sirve los archivos tal cual (sin Jekyll)

if git fetch -q origin gh-pages 2>/dev/null; then
  git worktree add -q -B gh-pages "$DESTINO" origin/gh-pages
  git -C "$DESTINO" rm -rq --ignore-unmatch -- .   # quita la versión anterior
else
  git worktree add -q --orphan -b gh-pages "$DESTINO"
fi
cp -R dist/. "$DESTINO"/
git -C "$DESTINO" add -A
git -C "$DESTINO" commit -q -m "Publicación $(date '+%Y-%m-%d %H:%M')" || echo "Sin cambios que publicar"
git -C "$DESTINO" push -q origin gh-pages
git worktree remove "$DESTINO"
echo "✔ Publicado en https://elohim-desing-ec.github.io/nexora/ (tarda 1-2 minutos en actualizarse)"
