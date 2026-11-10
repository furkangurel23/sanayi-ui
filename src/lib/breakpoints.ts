/*
 * KIRILMA NOKTALARI (breakpoints) — JS tarafının tek kaynağı (002 rev 3 / US5, FR-022).
 *
 * Harita "auto" modunda karar İKİ yerde verilir ve ikisi AYNI eşiği kullanmalıdır:
 *  - CSS: globals.css `.map-auto` kuralları `@media (min-width: 768px)` (ilk boyama, JS'siz)
 *  - JS : MapSection `matchMedia("(min-width: 768px)")` (hidrasyondan sonra)
 * Eşikler farklı olsaydı (ör. CSS 760, JS 768) 760–767 px arasında CSS haritayı açık
 * çizer, JS kapatırdı -> düzen zıplardı (CLS). CSS medya sorgusu değişken okuyamadığı için
 * sayı globals.css'te elle yazılıdır; değiştirirsen İKİSİNİ birlikte değiştir.
 */
export const MAP_OPEN_MIN_WIDTH = 768;

/** matchMedia'ya verilecek sorgu — CSS'teki ile birebir aynı metin. */
export const MAP_OPEN_QUERY = `(min-width: ${MAP_OPEN_MIN_WIDTH}px)`;
