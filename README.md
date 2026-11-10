# Sanayi UI

Ankara'daki sanayi ustalarını (usta/servis) marka ve kategoriye göre keşfetme, **-5..+5** puanlama, yorum ve marka sohbet odaları platformunun web arayüzü. Backend: [`../sanayi`](../sanayi) (Spring Boot + Kotlin, `:8080`).

## Gereksinimler

- **Node 24 LTS** — sürüm `.nvmrc`'de (`nvm use`); `package.json` `engines` alanı da bunu ister.
- Çalışan backend API (yerelde `http://localhost:8080/api`).

## Kurulum ve çalıştırma

```bash
nvm use
npm ci
npm run dev     # http://localhost:3000 (Turbopack)
npm run build   # üretim derlemesi
npm run start   # üretim sunucusu
npm run lint
```

## Ortam değişkenleri (`.env.local`)

| Değişken | Varsayılan | Açıklama |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8080/api` | Backend REST adresi |
| `NEXT_PUBLIC_WS_URL` | API origin + `/ws` | Sohbet WebSocket (STOMP) adresi |
| `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` | — | Anonim oylarda reCAPTCHA (prod) |

## Teknoloji

Next.js 16 (App Router) · React 19 · TypeScript 6 · el yazımı CSS tasarım sistemi (UI kütüphanesi yok) · Leaflet (harita) · @stomp/stompjs (canlı sohbet).

## Geliştirme akışı

Yeni özellikler Spec Kit ile geliştirilir: `docs/CALISMA_REHBERI.md`, kurallar `.specify/memory/constitution.md`, mimari ve konvansiyonlar `CLAUDE.md`.
