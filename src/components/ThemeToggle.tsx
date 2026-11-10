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
 * (boş ikon yeri) basılır, useEffect (yalnız client'ta koşar) gerçek temayı okur.
 * Böylece server HTML'i ile client HTML'i çelişmez (hydration mismatch önlenir).
 * Boş yer tutucu da ikonla AYNI boyuttadır (.icon) -> ikon gelince buton zıplamaz.
 * İkonlar ortak setten: Sun (koyudayken "açığa geç"), Moon (açıktayken "koyuya geç").
 */

import {useEffect, useState} from "react";
import {applyStoredTheme, setThemeColorMeta} from "@/app/theme";
import {Moon, Sun} from "@/components/icons";

/** data-theme'i html'e yazar; tercih localStorage'da saklanır. İlk boyama layout'taki inline script ile FOUC'suz yapılır. */
export default function ThemeToggle() {
    const [theme, setTheme] = useState<"light" | "dark" | null>(null);

    useEffect(() => {
        // Önce kayıtlı tercihi yeniden uygula: kök layout bir hatadan (global-error ->
        // retry) kurtarıldığında React <html>'i yeniden bağlar ve prop'taki
        // data-theme="dark"ı yazar; inline script tekrar koşmaz. Bu çağrı olmadan açık
        // temayı seçmiş kullanıcı yenilemeye kadar koyu temada kalırdı.
        // (applyStoredTheme theme-color meta'larını da günceller.)
        applyStoredTheme();
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
                <span className="icon" aria-hidden/>
            ) : theme === "dark" ? <Sun/> : <Moon/>}
        </button>
    );
}
