/*
 * WEB UYGULAMA BİLDİRİMİ (manifest) — Next.js dosya kuralı: /manifest.webmanifest olarak sunulur ve
 * <link rel="manifest"> otomatik eklenir.
 *
 * Ne işe yarar? Telefonda "Ana ekrana ekle" denince uygulamanın ADI, SİMGESİ ve açılış rengi buradan gelir
 * (Android Chrome; iPhone apple-icon.png'yi kullanır). Simgeler scripts/make-icons.mjs ile src/app/icon.svg'den
 * üretilir. Renkler koyu temanın zemini ve marka mavisiyle aynı (globals.css / theme.ts).
 */
import type {MetadataRoute} from "next";
import {THEME_COLOR} from "./theme";

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: "Sanayi Defteri — Ankara usta & servis platformu",
        short_name: "Sanayi Defteri",
        description: "Ankara'daki sanayi ustalarını marka ve kategoriye göre bul, yorumları oku, puanla.",
        start_url: "/",
        display: "standalone",
        background_color: THEME_COLOR.dark,
        theme_color: THEME_COLOR.dark,
        lang: "tr",
        icons: [
            {src: "/icon-192.png", sizes: "192x192", type: "image/png"},
            {src: "/icon-512.png", sizes: "512x512", type: "image/png"},
        ],
    };
}
