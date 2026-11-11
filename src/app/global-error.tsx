"use client";

/*
 * KÖK HATA SINIRI — kök layout'un (layout.tsx: Header, footer...) KENDİSİ hata
 * verdiğinde gösterilir. Normal error.tsx'ler layout'un İÇİNDE çizildiği için bu
 * durumu yakalayamaz; global-error ise kök layout'un YERİNE geçer.
 *
 * Öğrenme notları:
 *  - Layout'un yerine geçtiği için <html> ve <body>'yi KENDİMİZ çizmek zorundayız;
 *    globals.css, font ve tema da otomatik gelmez -> burada tekrar bağlıyoruz.
 *    Tema script'i ve renkler theme.ts'ten, font fonts.ts'ten gelir (layout ile ortak,
 *    kopya yok).
 *  - data-theme="dark" sunucu HTML'inde yazılı (JS çalışmasa da koyu); themeInit
 *    ise açık temayı seçmiş kullanıcının tercihini uygular. Script, html'in
 *    attribute'unu değiştirdiği için suppressHydrationWarning gerekir.
 *  - DİKKAT (doğrulanarak öğrenildi): üretimde kök layout hata verdiğinde sunucu
 *    yalnızca boş bir hata kabuğu gönderir; bu bileşen TARAYICIDA çizilir. React'in
 *    istemcide eklediği <script> çalışmaz -> themeInit burada koşmaz. Bu yüzden
 *    aynı mantığı (applyStoredTheme) useLayoutEffect ile de uyguluyoruz:
 *    useLayoutEffect, DOM güncellendikten sonra ama tarayıcı BOYAMADAN önce koşar
 *    -> yanlış temayla flaş görünmez. Sunucuda çizildiği durumda script zaten çalışır;
 *    ikisi aynı sonucu yazar, çakışma olmaz.
 *  - <meta name="theme-color"> script'ten ÖNCE gelir ki script onu bulup güncelleyebilsin.
 *  - Error Boundary -> "use client". `metadata` export'u burada DESTEKLENMEZ;
 *    sekme başlığını React 19'un <title> etiketiyle veriyoruz.
 *  - İçerik RouteError ile aynıdır (sabit Türkçe mesaj + "Tekrar dene" -> retry()).
 */
import "./globals.css";
import {useLayoutEffect} from "react";
import RouteError from "@/components/RouteError";
import {geist} from "./fonts";
import {applyStoredTheme, THEME_COLOR, themeInit} from "./theme";

export default function GlobalError({error, retry}: { error: unknown; retry: () => void }) {
    // Kayıtlı tema tercihini uygula (DOM'a doğrudan yazar; state yok -> ek render yok).
    useLayoutEffect(() => {
        applyStoredTheme();
    }, []);

    return (
        <html lang="tr" data-theme="dark" suppressHydrationWarning>
        <head>
            <title>Bir şeyler ters gitti | Sanayi Defteri</title>
            <meta name="theme-color" content={THEME_COLOR.dark} suppressHydrationWarning/>
            <script dangerouslySetInnerHTML={{__html: themeInit}}/>
        </head>
        <body className={geist.variable}>
        <RouteError error={error} retry={retry}/>
        </body>
        </html>
    );
}
