# =====================================================================================================
# SANAYİ DEFTERİ ARAYÜZ İMAJI (006-production-deploy) — Next 16 "standalone" çıktısı, üç aşama.
#
#  deps   : yalnız package*.json → `npm ci` (kilit dosyasına birebir; kaynak değişince bu katman önbellekte).
#  build  : kaynak + derleme. Tarayıcıya gömülen ayarlar (NEXT_PUBLIC_*, SITE_*) DERLEME ARGÜMANI olarak
#           gelir (deploy/compose.prod.yml `build.args`); değişince imaj yeniden derlenmeli.
#           STRICT_ENV=true → next.config.ts eksik/yerel genel adreste derlemeyi durdurur.
#           Derleme backend'e ERİŞMEZ (sayfalar çalışma anında üretilir; CI ile aynı).
#           NODE_OPTIONS: 4 GB'lık sunucuda derleme belleği sınırı (Turbopack'in yerel belleği hariç).
#  runner : yalnız standalone sunucu + statik dosyalar; root olmayan `node` kullanıcısı.
#           HOSTNAME=0.0.0.0 ZORUNLU: Docker HOSTNAME'i konteyner kimliğine çevirir ve Next yalnız o
#           arayüzü dinlerdi (sağlık kontrolü ve Caddy bağlanamazdı).
#           API_INTERNAL_URL çalışma anında compose'tan gelir (gömülmez).
# Taban: bookworm-slim (glibc) — sharp ve Next SWC ikilileri alpine (musl) yerine glibc ister.
# =====================================================================================================
FROM node:24-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:24-bookworm-slim AS build
WORKDIR /app
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_WS_URL
ARG NEXT_PUBLIC_RECAPTCHA_SITE_KEY
ARG NEXT_PUBLIC_CLAIMS_ENABLED
ARG NEXT_PUBLIC_TILE_URL
ARG NEXT_PUBLIC_TILE_ATTRIBUTION
ARG SITE_URL
ARG SITE_INDEXABLE
ARG GOOGLE_SITE_VERIFICATION
ARG STRICT_ENV
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
    NEXT_PUBLIC_WS_URL=$NEXT_PUBLIC_WS_URL \
    NEXT_PUBLIC_RECAPTCHA_SITE_KEY=$NEXT_PUBLIC_RECAPTCHA_SITE_KEY \
    NEXT_PUBLIC_CLAIMS_ENABLED=$NEXT_PUBLIC_CLAIMS_ENABLED \
    NEXT_PUBLIC_TILE_URL=$NEXT_PUBLIC_TILE_URL \
    NEXT_PUBLIC_TILE_ATTRIBUTION=$NEXT_PUBLIC_TILE_ATTRIBUTION \
    SITE_URL=$SITE_URL \
    SITE_INDEXABLE=$SITE_INDEXABLE \
    GOOGLE_SITE_VERIFICATION=$GOOGLE_SITE_VERIFICATION \
    STRICT_ENV=$STRICT_ENV \
    NEXT_TELEMETRY_DISABLED=1 \
    NODE_OPTIONS=--max-old-space-size=1536
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:24-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    PORT=3000 \
    TZ=Europe/Istanbul
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/public ./public
USER node
EXPOSE 3000
CMD ["node", "server.js"]
