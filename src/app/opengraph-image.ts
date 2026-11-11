/*
 * VARSAYILAN PAYLAŞIM GÖRSELİ — 005-seo-foundation (spec FR-015, US3).
 *
 * WhatsApp/Facebook/X'te bağlantı paylaşılınca önizlemede görünen 1200×630 görsel. Next dosya kuralı:
 * `app/opengraph-image.*` -> `/opengraph-image` adresinde sunulur; sayfalar `pageMetadata` (lib/seo/site.ts)
 * ile bu adresi `og:image` olarak bildirir. Dinamik veri kullanmadığı için DERLEMEDE bir kez üretilir.
 *
 * NEDEN .ts + createElement (JSX değil)? `next/og` (Satori) yalnız SATIR İÇİ stil kabul eder; .tsx'te bu
 * stiller ve hex renkler `scripts/token-lint.mjs` (yalnız .css/.tsx tarar) ile UI kuralı "satır içi stil
 * ≤10"u ihlal ederdi. Görsel bir sayfa değil, piksel üretir — tasarım token'ları (CSS değişkenleri)
 * Satori'de zaten çalışmaz. Bu yüzden renkler aşağıda adlandırılmış sabitler.
 *
 * LOGO tek kaynaktan: `src/app/icon.svg` dosyası okunur ve <img> olarak gömülür (LogoMark CSS sınıflarıyla
 * boyandığı için Satori'de kullanılamaz; yolları kopyalamak iki kaynak yaratırdı).
 * Yazı tipi: next/og kendi Geist'ini taşır — Türkçe ğ/ş/ı/İ harfleri dahil.
 */
import {ImageResponse} from "next/og";
import {createElement as h} from "react";
import {readFile} from "node:fs/promises";
import {join} from "node:path";
import {THEME_COLOR} from "./theme";
import {SITE_NAME, SITE_TAGLINE} from "@/lib/seo/site";

export const alt = `${SITE_NAME} — ${SITE_TAGLINE}`;
export const size = {width: 1200, height: 630};
export const contentType = "image/png";

/** globals.css karşılıkları: koyu tema --bg (THEME_COLOR), metin, ikincil metin ve --logo-ring. */
const COLORS = {
    bg: THEME_COLOR.dark,
    text: "#F5F6F8",
    muted: "#B9BEC8",
    accent: "#93C5FD", // --logo-ring
};

export default async function Image() {
    const svg = await readFile(join(process.cwd(), "src/app/icon.svg"));
    const logo = `data:image/svg+xml;base64,${svg.toString("base64")}`;

    return new ImageResponse(
        h("div", {
            style: {
                width: "100%", height: "100%", display: "flex", alignItems: "center", gap: 64,
                padding: "0 96px", background: COLORS.bg,
            },
        },
        h("img", {src: logo, width: 260, height: 260, alt: ""}),
        h("div", {style: {display: "flex", flexDirection: "column"}},
            h("div", {style: {fontSize: 92, color: COLORS.text, letterSpacing: -2}}, SITE_NAME),
            h("div", {style: {fontSize: 46, color: COLORS.muted, marginTop: 12}}, SITE_TAGLINE),
            h("div", {style: {fontSize: 32, color: COLORS.accent, marginTop: 40}}, "Ankara · usta ve servis rehberi"),
        )),
        size,
    );
}
