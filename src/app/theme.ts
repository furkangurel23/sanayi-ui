/*
 * TEMA SABİTLERİ — kök layout ve global-error AYNI tema başlatma kodunu paylaşır.
 *
 * Öğrenme notları:
 *  - Neden ayrı dosya? global-error.tsx kök layout'un YERİNE geçer (kendi <html>'ini
 *    çizer). İkisi de aynı tema script'ine ve aynı renk sabitlerine ihtiyaç duyar;
 *    kopyala-yapıştır yerine tek kaynak (DRY).
 *  - THEME_COLOR: tarayıcının arayüz rengi (<meta name="theme-color">; mobilde adres
 *    çubuğu, PWA başlığı). Değerler globals.css'teki --bg token'larının HEX karşılığı:
 *      koyu  --bg: oklch(0.17 0.01 75)    -> #120f0b
 *      açık  --bg: oklch(0.985 0.004 85)  -> #fbfaf7
 *    Meta etiketinde OKLCH her tarayıcıda desteklenmediği için HEX kullanıyoruz.
 *    globals.css'te --bg değişirse burası da güncellenmeli.
 *  - React 19 tuzağı (doğrulanarak öğrenildi): <meta> React 19'da "hoistable" bir
 *    öğedir; hidrasyonda React mevcut etiketi `content` değeriyle eşleştirir. Açık
 *    temalı kullanıcıda script content'i #fbfaf7 yaptığı için React, prop'taki
 *    #120f0b ile eşleşen etiket bulamaz ve head'e İKİNCİ bir meta ekler. Tarayıcı
 *    İLK meta'yı kullandığı için görünür bir sorun yok; yine de bütün güncellemeler
 *    (script, applyStoredTheme, ThemeToggle) TEK meta değil TÜM theme-color
 *    etiketlerini (querySelectorAll) günceller -> hepsi her zaman aynı rengi taşır.
 *  - Next'in `viewport.themeColor` ayarını BİLEREK kullanmıyoruz: o, işletim sistemi
 *    tercihine (prefers-color-scheme) göre medya sorgulu meta üretir; kullanıcının
 *    ThemeToggle ile ELLE seçtiği temayı izleyemez. Tek meta etiketini layout'ta
 *    kendimiz basıyor, script ve ThemeToggle ile güncelliyoruz.
 */

export const THEME_COLOR = {dark: "#120f0b", light: "#fbfaf7"} as const;

/**
 * İlk boyamadan ÖNCE çalışan inline script metni (FOUC önleme).
 * 1) localStorage'daki tercihi (yoksa "dark") <html data-theme>'e yazar.
 * 2) <meta name="theme-color">'ın content'ini o temanın rengine çeker.
 *    (Meta etiketi layout'ta script'ten ÖNCE yer alır; bu yüzden script çalıştığında
 *    DOM'da hazırdır.)
 * localStorage erişimi hata verirse (gizli mod, engellenmiş site verisi) koyu kalır.
 * Not: Bu bir STRING — tarayıcıda React'ten bağımsız, ham JS olarak koşar; bu yüzden
 * eski tarayıcı uyumlu düz ES5 yazılmıştır ve renkler JSON.stringify ile gömülür.
 */
export const themeInit = `(function(){var d=document.documentElement,c=${JSON.stringify(THEME_COLOR)},t="dark";try{t=localStorage.getItem("sanayiTheme")||"dark"}catch(e){}d.dataset.theme=t;var m=document.querySelectorAll('meta[name="theme-color"]');for(var i=0;i<m.length;i++)m[i].setAttribute("content",t==="light"?c.light:c.dark)})()`;

/**
 * themeInit'in AYNISI, ama normal bir TS fonksiyonu olarak (istemci bileşenlerinde çağrılır).
 * Neden gerekli? global-error.tsx üretimde çoğunlukla TARAYICIDA çizilir (sunucu yalnızca
 * boş bir hata kabuğu gönderir) ve React'in istemcide DOM'a eklediği <script> etiketleri
 * ÇALIŞTIRILMAZ (tarayıcı kuralı: innerHTML ile eklenen script koşmaz). Bu yüzden
 * global-error kayıtlı temayı bu fonksiyonla, useLayoutEffect içinde (boyamadan önce) uygular.
 */
export function applyStoredTheme(): void {
    let t = "dark";
    try {
        t = localStorage.getItem("sanayiTheme") || "dark";
    } catch {
        // localStorage erişilemez (gizli mod vb.) -> koyu kalır
    }
    document.documentElement.dataset.theme = t;
    setThemeColorMeta(t === "light" ? "light" : "dark");
}

/** Sayfadaki TÜM <meta name="theme-color"> etiketlerine verilen temanın rengini yazar (neden "tümü": yukarıdaki React 19 notu). */
export function setThemeColorMeta(theme: "light" | "dark"): void {
    document.querySelectorAll('meta[name="theme-color"]')
        .forEach(m => m.setAttribute("content", THEME_COLOR[theme]));
}
