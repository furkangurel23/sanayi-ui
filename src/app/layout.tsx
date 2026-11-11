/*
 * KÖK LAYOUT — her sayfayı saran iskelet (App Router zorunlu dosyası).
 *
 * Öğrenme notları:
 *  - next/font/google: Geist fontunu BUILD sırasında indirir ve self-host eder
 *    (Google'a runtime istek gitmez -> hız + gizlilik). variable ile CSS değişkeni
 *    olarak (--font-geist-sans) globals.css'e bağlanır. Yükleyici src/app/fonts.ts'te
 *    (global-error.tsx ile ortak); latin + latin-ext alt kümesi -> Türkçe ğ/ş/ı/İ
 *    harfleri de Geist ile çizilir (yalnız "latin"de bu harfler yoktu, yedek fonta düşüyordu).
 *  - metadata.title.template: alt sayfalar sadece kendi adını verir,
 *    "%s | Sanayi Defteri" şablonuna otomatik oturur (SEO).
 *  - Marka (2026-11-11): ad "Sanayi Defteri", logo S1 (spiralli defter + piston): LogoMark bileşeni +
 *    src/app/icon.svg / favicon.ico / apple-icon.png / manifest.ts (Next dosya kuralları, otomatik <link>).
 *  - <html data-theme="dark"> SUNUCUDA yazılır: JavaScript kapalı olsa bile sayfa
 *    varsayılan (koyu) temayla gelir.
 *  - themeInit inline script'i (src/app/theme.ts): React yüklenmeden ÖNCE çalışır;
 *    localStorage'daki tema tercihini <html data-theme> olarak yazar -> yanlış temayla
 *    flaş (FOUC) olmaz. Aynı script <meta name="theme-color">'ı (tarayıcı arayüz rengi)
 *    seçili temaya çeker; meta bu yüzden script'ten ÖNCE yer alır.
 *  - viewport.themeColor KULLANMIYORUZ: işletim sistemi temasına göre medya sorgulu
 *    meta üretir, kullanıcının elle seçtiği temayı izleyemez (ayrıntı theme.ts'te).
 *  - suppressHydrationWarning: data-theme'i ve meta content'ini script değiştirdiği için
 *    server/client HTML'i farklı olabilir; React'e "bu bilinçli" deriz.
 *  - Header client component'tır ama layout server kalır — client sınırı
 *    olabildiğince aşağıda tutulur (bundle küçük kalır).
 */
import type {Metadata} from "next";
import "./globals.css";
import React from "react";
import {DATA_ATTRIBUTIONS} from "@/lib/sources";
import Header from "@/components/Header";
import LogoMark from "@/components/LogoMark";
import {THEME_COLOR, themeInit} from "./theme";
import {googleVerification, indexable, OG_IMAGE, SITE_NAME, siteUrl} from "@/lib/seo/site";
import {geist} from "./fonts";

// Tek font: Geist (sans, fonts.ts). Eskiden ikinci bir mono font (Geist_Mono) da yükleniyordu
// ama onu kullanan .mono sınıfı hiçbir yerde kullanılmıyordu -> boşuna indirilen font dosyası.

/*
 * 005-seo-foundation — KÖK METADATA:
 *  - metadataBase: sayfaların göreli kanonik/OG adresleri ("/providers/12") buna göre MUTLAK olur
 *    (SITE_URL; yerelde http://localhost:3000).
 *  - Varsayılan openGraph/twitter: kendi metadata'sı olmayan sayfalar da paylaşımda başlık + görsel taşır.
 *    DİKKAT: Next metadata'yı SIĞ birleştirir — bir sayfa kendi `openGraph`'ını verirse bu varsayılanın
 *    TAMAMI kaybolur. Bu yüzden sayfalar openGraph/robots'u YALNIZ `pageMetadata` (lib/seo/site.ts) ile verir.
 *  - verification.google: Search Console doğrulama kodu (GOOGLE_SITE_VERIFICATION; boşsa etiket yok).
 *  - Dizine KAPALI ortamda (SITE_INDEXABLE ≠ "true") varsayılan robots "noindex, nofollow"; ayrıca her
 *    yanıta X-Robots-Tag başlığı eklenir (next.config.ts). pageMetadata'lı sayfalar da index:false üretir.
 */
const DEFAULT_TITLE = "Sanayi Defteri — Ankara usta & servis platformu";
const DEFAULT_DESCRIPTION = "Ankara'daki sanayi ustalarını marka ve kategoriye göre keşfet, yorumları oku, puanla, marka sohbet odalarına katıl.";

export const metadata: Metadata = {
    metadataBase: new URL(siteUrl()),
    title: {default: DEFAULT_TITLE, template: "%s | Sanayi Defteri"},
    description: DEFAULT_DESCRIPTION,
    openGraph: {
        siteName: SITE_NAME, locale: "tr_TR", type: "website",
        title: DEFAULT_TITLE, description: DEFAULT_DESCRIPTION, images: [OG_IMAGE],
    },
    twitter: {card: "summary_large_image", title: DEFAULT_TITLE, description: DEFAULT_DESCRIPTION, images: [OG_IMAGE.url]},
    ...(googleVerification() ? {verification: {google: googleVerification()}} : {}),
    ...(indexable() ? {} : {robots: {index: false, follow: false}}),
};

// Tema tercihi ilk boyamadan önce uygulanır (FOUC önleme) — script metni theme.ts'te.
// Varsayılan KOYU tema (002: neredeyse siyah, katmanlı nötr yüzeyler + tek MAVİ vurgu);
// kullanıcı toggle'la değiştirirse tercihi localStorage'da kalıcıdır.
//
// Alt bilgi (footer): metinler aynı; görünüm .site-footer/.footer-inner sınıflarıyla
// (hairline üst çizgi, caption boyutu, dar ekranda alt alta sarar).

export default function RootLayout({children}: { children: React.ReactNode }) {
    return (
        <html lang="tr" data-theme="dark" suppressHydrationWarning>
        <head>
            {/* Sıra önemli: önce meta, sonra onu güncelleyen script. */}
            <meta name="theme-color" content={THEME_COLOR.dark} suppressHydrationWarning/>
            <script dangerouslySetInnerHTML={{__html: themeInit}}/>
        </head>
        <body className={geist.variable}>
        <Header/>
        {children}
        <footer className="site-footer">
            <div className="container footer-inner">
                <span className="footer-brand">
                    <LogoMark size={20}/>
                    <span>Sanayi Defteri — Ankara usta &amp; servis platformu</span>
                </span>
                <span>Puanla · Yorumla · Sohbet et</span>
                {/* 002 / SC-007: açık veri lisanslarının istediği atıf (OSM ODbL, Overture CDLA,
                    Foursquare Apache 2.0 — Overture kayıtlarının bir kısmı Foursquare üst kaynaklı). */}
                <p className="footer-attribution">
                    İşletme verisi:{" "}
                    {DATA_ATTRIBUTIONS.map((a, i) => (
                        <span key={a.holder}>
                            {a.holderHref ? <a href={a.holderHref} rel="noopener noreferrer">{a.holder}</a> : a.holder}
                            {" "}(<a href={a.licenseHref} rel="noopener noreferrer license">{a.license}</a>)
                            {i < DATA_ATTRIBUTIONS.length - 1 ? ", " : ""}
                        </span>
                    ))}
                </p>
            </div>
        </footer>
        </body>
        </html>
    );
}
