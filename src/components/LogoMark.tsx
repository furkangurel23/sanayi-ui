/*
 * SANAYİ DEFTERİ LOGOSU (S1: spiralli defter + kapakta piston) — üst menü ve alt bilgideki küçük simge.
 *
 * Tek kaynak src/app/icon.svg (favicon/uygulama simgeleri oradan üretilir: scripts/make-icons.mjs).
 * Burada AYNI çizim satır içi SVG olarak durur: ek ağ isteği yok, her ekran yoğunluğunda keskin.
 * Logo değişirse iki yer birlikte değişir (icon.svg + bu dosya).
 *
 * Renkler bilinçli olarak SABİT marka renkleri — globals.css `:root`'taki --logo-bg/--logo-paper/--logo-ring
 * belirteçleri (temadan bağımsız); boyama SINIFLA (.lm-bg/.lm-paper/.lm-ring, globals.css) — token-lint SVG
 * `fill=` özniteliği kabul etmez, renk her zaman stil katmanından gelir: logo açık ve koyu temada aynı görünmeli; mavi zemin iki temanın
 * yüzeyinden de ayrışıyor. Server Component (etkileşim yok) — Header (client) içinden de
 * kullanılabilir, çünkü içinde hook yok.
 * Erişilebilirlik: süs simgesidir (yanında metin olarak marka adı yazar) -> aria-hidden.
 */
export default function LogoMark({size = 28}: { size?: number }) {
    return (
        <svg className="logo-mark" width={size} height={size} viewBox="0 0 100 100" aria-hidden focusable="false">
            <rect width="100" height="100" rx="23" className="lm-bg"/>
            <rect x="26" y="12" width="56" height="76" rx="8" className="lm-paper"/>
            <g className="lm-bg">
                <circle cx="31" cy="24" r="2.6"/><circle cx="31" cy="37" r="2.6"/><circle cx="31" cy="50" r="2.6"/>
                <circle cx="31" cy="63" r="2.6"/><circle cx="31" cy="76" r="2.6"/>
            </g>
            <g className="lm-ring">
                <rect x="18" y="22" width="14" height="4.5" rx="2.25"/><rect x="18" y="35" width="14" height="4.5" rx="2.25"/>
                <rect x="18" y="48" width="14" height="4.5" rx="2.25"/><rect x="18" y="61" width="14" height="4.5" rx="2.25"/>
                <rect x="18" y="74" width="14" height="4.5" rx="2.25"/>
            </g>
            <svg x="34" y="26" width="44" height="44" viewBox="0 0 100 100">
                <rect x="28" y="12" width="44" height="32" rx="7" className="lm-bg"/>
                <rect x="28" y="20" width="44" height="3.5" className="lm-paper"/>
                <rect x="28" y="27" width="44" height="3.5" className="lm-paper"/>
                <circle cx="50" cy="38" r="3.5" className="lm-paper"/>
                <path d="M44,43 L56,43 L54,71 L46,71 Z" className="lm-bg"/>
                <circle cx="50" cy="79" r="12" className="lm-bg"/>
                <circle cx="50" cy="79" r="5" className="lm-paper"/>
            </svg>
        </svg>
    );
}
