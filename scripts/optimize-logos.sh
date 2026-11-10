#!/usr/bin/env bash
#
# MARKA LOGOLARINI WEBP'YE ÇEVİR (tek seferlik bakım betiği)
#
# Neden? public/brands/*.png dosyaları 640x426 ile 3840x2160 arası boyutlarda ve toplam
# ~3 MB'tı; ekranda ise ~46 px gösteriliyorlar. 2x (retina) yoğunlukta 92 px yeter.
# Bu betik her PNG'yi en-boy oranını koruyarak EN UZUN KENARI 96 px olacak şekilde
# WebP'ye çevirir (şeffaflık korunur) ve hedefleri denetler: logo başına <=10 KB,
# toplam <300 KB. Kalite 80 ile 10 KB'ı aşan dosya olursa 70 ile tekrar dener.
#
# Gereksinim: cwebp (Homebrew: `brew install webp`) ve macOS `sips` (boyut ölçümü).
# npm bağımlılığı EKLEMİYORUZ (sharp vb.) — bu yalnızca geliştiricinin bir kez
# çalıştırdığı bir araç, uygulamanın çalışma zamanı parçası değil.
#
# Kullanım:  bash scripts/optimize-logos.sh            (WebP üretir, PNG'lere dokunmaz)
#            bash scripts/optimize-logos.sh --delete-png  (başarılıysa PNG'leri siler)
set -euo pipefail

DIR="$(cd "$(dirname "$0")/.." && pwd)/public/brands"
MAX=96              # en uzun kenar (px)
LIMIT=$((10 * 1024)) # logo başına üst sınır (bayt)

command -v cwebp >/dev/null || { echo "cwebp yok: brew install webp" >&2; exit 1; }

shopt -s nullglob
pngs=("$DIR"/*.png)
[ ${#pngs[@]} -gt 0 ] || { echo "Çevrilecek PNG yok: $DIR"; exit 0; }

for png in "${pngs[@]}"; do
  slug="$(basename "$png" .png)"
  out="$DIR/$slug.webp"
  # sips çıktısından genişlik/yükseklik oku
  w=$(sips -g pixelWidth "$png" | awk '/pixelWidth/ {print $2}')
  h=$(sips -g pixelHeight "$png" | awk '/pixelHeight/ {print $2}')
  # Oranı koru: uzun kenar MAX, kısa kenar orantılı (0 verilirse cwebp oranı kendisi korur)
  if [ "$w" -ge "$h" ]; then rw=$MAX; rh=0; else rw=0; rh=$MAX; fi

  for q in 80 70; do
    cwebp -quiet -q "$q" -m 6 -alpha_q 100 -resize "$rw" "$rh" "$png" -o "$out"
    size=$(stat -f%z "$out")
    [ "$size" -le "$LIMIT" ] && break
  done
  printf "%-16s %5sx%-5s -> q%s %6d B\n" "$slug" "$w" "$h" "$q" "$size"
  [ "$size" -le "$LIMIT" ] || { echo "UYARI: $slug.webp 10 KB'ı aşıyor" >&2; }
done

total=$(du -ck "$DIR"/*.webp | awk '/total/ {print $1}')
echo "Toplam WebP: ${total} KB (hedef < 300 KB)"
[ "$total" -lt 300 ] || { echo "HATA: toplam hedef aşıldı" >&2; exit 1; }

if [ "${1:-}" = "--delete-png" ]; then
  rm -f "${pngs[@]}"
  echo "PNG'ler silindi."
fi
