#!/bin/bash
# Usage: measure.sh <label> <providerId>
# Runs Lighthouse (mobile, simulated throttling) 3x per route against http://localhost:3000,
# prints median LCP/CLS/TBT, script bytes and total bytes per route as a markdown table.
set -u
LABEL=$1; PID=$2
OUT=${MEASURE_OUT:-/tmp/sanayi-lh}/lh-$LABEL
mkdir -p "$OUT"
ROUTES="${ROUTES:-/ /providers /providers/$PID /chat /login}"
for u in $ROUTES; do
  n=$(echo "$u" | tr '/' '_')
  for i in 1 2 3; do
    npx -y lighthouse@12 "http://localhost:3000$u" --only-categories=performance \
      --form-factor=mobile --throttling-method=simulate --output=json --quiet \
      --chrome-flags="--headless=new" --output-path="$OUT/$n-$i.json" >/dev/null 2>&1
  done
done
python3 - "$OUT" $ROUTES <<'EOF'
import json, sys, glob, statistics, os
out = sys.argv[1]; routes = sys.argv[2:]
print("| Rota | Perf | LCP (ms) | CLS | TBT (ms) | JS transfer (KB) | Toplam transfer (KB) | leaflet/recaptcha/stomp |")
print("|---|---|---|---|---|---|---|---|")
for u in routes:
    n = u.replace("/", "_")
    rows = []
    for f in sorted(glob.glob(f"{out}/{n}-*.json")):
        d = json.load(open(f)); a = d["audits"]
        items = a["network-requests"]["details"]["items"]
        js = sum(i.get("transferSize", 0) for i in items if i.get("resourceType") == "Script")
        tot = sum(i.get("transferSize", 0) for i in items)
        heavy = sorted({k for i in items for k in ("leaflet", "recaptcha", "stomp") if k in i["url"].lower()})
        rows.append((d["categories"]["performance"]["score"] * 100, a["largest-contentful-paint"]["numericValue"],
                     a["cumulative-layout-shift"]["numericValue"], a["total-blocking-time"]["numericValue"], js, tot, heavy))
    if not rows:
        print(f"| {u} | ölçülemedi |"); continue
    med = lambda k: statistics.median(r[k] for r in rows)
    print(f"| {u} | {med(0):.0f} | {med(1):.0f} | {med(2):.3f} | {med(3):.0f} | {med(4)/1024:.1f} | {med(5)/1024:.1f} | {', '.join(rows[0][6]) or '-'} |")
EOF
echo
echo "Logo dosyaları (38 marka, /chat sona kaydırılınca hepsi iner):"
du -ck "$(dirname "$0")/../public/brands/"* | tail -1
ls -S -l "$(dirname "$0")/../public/brands" | sed -n 2p
