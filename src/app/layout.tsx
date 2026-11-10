/*
 * KÖK LAYOUT — her sayfayı saran iskelet (App Router zorunlu dosyası).
 *
 * Öğrenme notları:
 *  - next/font/google: Geist fontunu BUILD sırasında indirir ve self-host eder
 *    (Google'a runtime istek gitmez -> hız + gizlilik). variable ile CSS değişkeni
 *    olarak (--font-geist-sans) globals.css'e bağlanır.
 *  - metadata.title.template: alt sayfalar sadece kendi adını verir,
 *    "%s | Sanayi" şablonuna otomatik oturur (SEO).
 *  - themeInit inline script'i: React yüklenmeden ÖNCE çalışır; localStorage'daki
 *    tema tercihini <html data-theme> olarak yazar -> yanlış temayla flaş (FOUC) olmaz.
 *  - suppressHydrationWarning: data-theme'i script değiştirdiği için server/client
 *    HTML'i farklı olabilir; React'e "bu bilinçli" deriz.
 *  - Header client component'tır ama layout server kalır — client sınırı
 *    olabildiğince aşağıda tutulur (bundle küçük kalır).
 */
import type {Metadata} from "next";
import {Geist} from "next/font/google";
import "./globals.css";
import React from "react";
import Header from "@/components/Header";

// Tek font: Geist (sans). Eskiden ikinci bir mono font (Geist_Mono) da yükleniyordu ama
// onu kullanan .mono sınıfı hiçbir yerde kullanılmıyordu -> boşuna indirilen font dosyası.
const geistSans = Geist({variable: "--font-geist-sans", subsets: ["latin"]});

export const metadata: Metadata = {
    title: {default: "Sanayi — Ankara usta & servis platformu", template: "%s | Sanayi"},
    description: "Ankara'daki sanayi ustalarını marka ve kategoriye göre keşfet, yorumları oku, puanla, marka sohbet odalarına katıl.",
};

// Tema tercihini ilk boyamadan önce uygula (FOUC önleme).
// Varsayılan KOYU tema: koyu zemin + nötr (grafit) vurgu rengi; kullanıcı toggle'la
// değiştirirse tercihi localStorage'da kalıcıdır.
const themeInit = `(function(){try{var t=localStorage.getItem("sanayiTheme")||"dark";document.documentElement.dataset.theme=t}catch(e){document.documentElement.dataset.theme="dark"}})()`;

export default function RootLayout({children}: { children: React.ReactNode }) {
    return (
        <html lang="tr" suppressHydrationWarning>
        <head>
            <script dangerouslySetInnerHTML={{__html: themeInit}}/>
        </head>
        <body className={geistSans.variable}>
        <Header/>
        {children}
        <footer className="site-footer">
            <div className="container row-between">
                <span>Sanayi — Ankara usta &amp; servis platformu</span>
                <span>Puanla · Yorumla · Sohbet et</span>
            </div>
        </footer>
        </body>
        </html>
    );
}
