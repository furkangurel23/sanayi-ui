"use client";

/*
 * TEMA DEĞİŞTİRİCİ (açık/koyu).
 *
 * Sistem üç parçadan oluşur:
 *  1) layout.tsx'teki inline <script>: İLK BOYAMADAN ÖNCE localStorage'a bakıp
 *     <html data-theme="..."> yazar -> yanlış temayla "flaş" (FOUC) olmaz.
 *  2) globals.css: tüm renkler CSS değişkeni; :root[data-theme="dark"] bloğu
 *     değişkenleri override eder. Tema değişimi = tek attribute değişimi.
 *  3) Bu bileşen: attribute'u değiştirir ve tercihi localStorage'a yazar.
 *  4) Tarayıcı arayüz rengi: <meta name="theme-color"> (mobilde adres çubuğu rengi)
 *     da yeni temanın zemin rengine çekilir. Renkler tek kaynaktan: src/app/theme.ts
 *     THEME_COLOR. (Next'in viewport.themeColor'ı yalnızca sistem temasını izler;
 *     elle seçilen temayı bilemediği için meta'yı kendimiz güncelliyoruz.)
 *
 * Hydration notu: sunucu localStorage'ı bilemez; bu yüzden ilk render'da theme=null
 * (boş ikon) basılır, useEffect (yalnız client'ta koşar) gerçek temayı okur.
 * Böylece server HTML'i ile client HTML'i çelişmez (hydration mismatch önlenir).
 */

import {useEffect, useState} from "react";
import {setThemeColorMeta} from "@/app/theme";

/** data-theme'i html'e yazar; tercih localStorage'da saklanır. İlk boyama layout'taki inline script ile FOUC'suz yapılır. */
export default function ThemeToggle() {
    const [theme, setTheme] = useState<"light" | "dark" | null>(null);

    useEffect(() => {
        const current = document.documentElement.dataset.theme === "dark" ? "dark" : "light";
        setTheme(current);
        // Hidrasyondan sonra React head'e ikinci bir theme-color meta'sı eklemiş olabilir
        // (açık temada; neden: theme.ts "React 19 tuzağı"). Hepsini mevcut temaya eşitle.
        setThemeColorMeta(current);
    }, []);

    const toggle = () => {
        const next = theme === "dark" ? "light" : "dark";
        document.documentElement.dataset.theme = next;
        localStorage.setItem("sanayiTheme", next);
        // Tarayıcı arayüz rengini de yeni temaya çek (tüm theme-color etiketleri — neden: theme.ts).
        setThemeColorMeta(next);
        setTheme(next);
    };

    return (
        <button
            type="button"
            className="btn btn-ghost btn-icon"
            onClick={toggle}
            aria-label={theme === "dark" ? "Açık temaya geç" : "Koyu temaya geç"}
            title={theme === "dark" ? "Açık tema" : "Koyu tema"}
        >
            {theme === null ? (
                <span style={{width: 18, height: 18, display: "inline-block"}}/>
            ) : theme === "dark" ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                     strokeLinecap="round" aria-hidden>
                    <circle cx="12" cy="12" r="4"/>
                    <path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>
                </svg>
            ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                     strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"/>
                </svg>
            )}
        </button>
    );
}
