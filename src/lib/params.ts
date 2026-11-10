/*
 * URL PARAMETRE AYRIŞTIRMA YARDIMCILARI (server sayfaları için)
 *
 * Öğrenme notları:
 *  - Next 15+'te server sayfa `searchParams`'ı `await` ile okur; her değer
 *    `string | string[] | undefined` gelir. Yani `?page=abc`, `?page=1&page=2`
 *    (dizi!) ya da hiç olmayan parametre — hepsi mümkündür. URL kullanıcının
 *    elindedir: elle yazılabilir, bozuk link paylaşılabilir.
 *  - Bu yüzden URL'den gelen HER değer "güvenilmez girdi"dir. `Number("abc")`
 *    `NaN` verir; `NaN` backend'e `page=NaN` olarak gider ve 400/500'e yol açar.
 *    Bu dosya her parametreyi tek yerde, tek kuralla temizler: geçersiz değer
 *    ya VARSAYILANA düşer ya da `undefined` (= "filtre yok") olur.
 *  - Parametre tipi `unknown`: çağıran taraf `sp.page` ne gelirse versin
 *    doğrudan verebilir; daraltmayı (narrowing) fonksiyonun içi yapar.
 *    TypeScript'te `unknown`, `any`'nin güvenli kardeşidir: kontrol etmeden
 *    kullanmana izin vermez.
 */

/**
 * Tek bir değer çıkarır: dizi geldiyse (`?page=1&page=2`) ilkini alır,
 * string değilse `undefined` döner. Diğer yardımcıların ortak ilk adımı.
 */
function first(v: unknown): string | undefined {
    const x = Array.isArray(v) ? v[0] : v;
    return typeof x === "string" ? x : undefined;
}

/**
 * Metni TAM SAYIYA çevirir; tam sayı değilse `undefined`.
 * `Number()` kullanıyoruz (parseInt değil): parseInt("12abc") 12 döndürür ve
 * bozuk girdiyi sessizce kabul eder; Number("12abc") ise NaN verir -> reddedilir.
 * Boş string (`?page=`) Number("") = 0 verdiği için ayrıca eleniyor.
 */
function toInt(v: unknown): number | undefined {
    const s = first(v)?.trim();
    if (!s) return undefined;
    const n = Number(s);
    return Number.isInteger(n) ? n : undefined;
}

/**
 * Sayfa numarası (UI'da 1-based): 1 ve üstü tam sayı; `0`, negatif, `abc`,
 * dizi vb. -> 1. Backend'e gönderirken api.ts `toPage0` ile 0-based'e çevirir.
 */
export function parsePage(v: unknown): number {
    const n = toInt(v);
    return n !== undefined && n >= 1 ? n : 1;
}

/**
 * Pozitif kimlik (brandId, categoryId, provider id...): 1 ve üstü tam sayı,
 * değilse `undefined` -> çağıran taraf filtreyi hiç göndermez (yok sayar).
 */
export function parsePositiveId(v: unknown): number | undefined {
    const n = toInt(v);
    return n !== undefined && n >= 1 ? n : undefined;
}

/**
 * Sayfa boyutu: 1..max aralığında tam sayı; geçersiz/aralık dışı -> `def`.
 * Üst sınır, `?size=99999` ile backend'den dev bir sayfa istenmesini engeller.
 */
export function parseSize(v: unknown, def: number, max: number): number {
    const n = toInt(v);
    return n !== undefined && n >= 1 && n <= max ? n : def;
}

/**
 * Puan filtresi (minScore/maxScore): -5..5 tam sayı, değilse `undefined`
 * (filtre uygulanmaz). Aralık backend'deki CHECK kısıtıyla aynıdır.
 */
export function parseScore(v: unknown): number | undefined {
    const n = toInt(v);
    return n !== undefined && n >= -5 && n <= 5 ? n : undefined;
}

/** Yarıçapı (km) 1..100 aralığına sıkıştırır (clamp). Tek kaynak: api.ts de bunu kullanır. */
export function clampRadiusKm(n: number): number {
    return Math.min(100, Math.max(1, n));
}

/**
 * URL'den yarıçap: sayı değilse 10 km (varsayılan), sayıysa 1..100'e sıkıştırılır.
 * Burada ondalık kabul edilir (`?radiusKm=2.5` geçerli) — bu yüzden toInt değil Number.
 */
export function parseRadiusKm(v: unknown): number {
    const s = first(v)?.trim();
    const n = s ? Number(s) : NaN;
    return clampRadiusKm(Number.isFinite(n) ? n : 10);
}

/**
 * Beyaz liste (whitelist) ile seçim: değer `allowed` içindeyse onu, değilse
 * `fallback`'i döner. Sort alanı/yönü gibi backend'e AYNEN giden metinler için.
 *
 * Generic notu: `<T extends string>` — T, çağırırken verilen literal birliği olur
 * (ör. `"asc" | "desc"`). `as const` ile verilen dizi `readonly ["asc","desc"]`
 * tipindedir; dönüş tipi de `"asc" | "desc"` olur, sıradan `string` değil.
 * `includes` için `as readonly string[]` genişletmesi gerekir: TS, `string`'in
 * `T` dizisinde aranmasına doğrudan izin vermez.
 */
export function parseEnum<T extends string>(v: unknown, allowed: readonly T[], fallback: T): T {
    const s = first(v);
    return s !== undefined && (allowed as readonly string[]).includes(s) ? (s as T) : fallback;
}

/*
 * GİRİŞ DÖNÜŞ ADRESİ (003) — `/login?next=/providers/suggest` güvenli mi?
 *
 * "Açık yönlendirme" (open redirect) açığı: saldırgan `/login?next=https://kotu.site` linki
 * paylaşır; kullanıcı BİZİM sitemizde giriş yapar ve sonra fark etmeden başka siteye gider
 * (oltalama). Bu yüzden `next` yalnız SİTE İÇİ göreli yol olabilir:
 *  - `/` ile başlamalı (`account` ya da `https://…` reddedilir),
 *  - `//evil.example` reddedilir: tarayıcı bunu "şemasız mutlak adres" (protocol-relative)
 *    sayar ve başka alan adına gider,
 *  - `/\evil.example` reddedilir: bazı tarayıcılar `\`'i `/` gibi okur (= `//evil.example`),
 *  - kontrol karakterleri (sekme, satır sonu) reddedilir: tarayıcı URL'den onları SİLER,
 *    `/<sekme>/evil.example` -> `//evil.example` olurdu.
 * Son emniyet: `new URL(v, sahte-köken)` ile çözülür; köken değişmişse (yani başka siteye
 * çıkıyorsa) reddedilir. Geçerliyse yalnız yol + sorgu + çapa döner; aksi `undefined`
 * (çağıran `?? "/"` ile ana sayfaya düşer).
 */
export function safeNext(v: unknown): string | undefined {
    const s = first(v);
    if (!s || !s.startsWith("/") || s.startsWith("//") || s.startsWith("/\\")) return undefined;
    // \u0000-\u001F + \u007F: kontrol karakterleri; ters bölü hiçbir yerde kabul edilmez.
    if (/[\u0000-\u001F\u007F\\]/.test(s)) return undefined;
    try {
        const base = "http://sanayi.invalid";
        const u = new URL(s, base);
        if (u.origin !== base) return undefined;
        return `${u.pathname}${u.search}${u.hash}`;
    } catch {
        return undefined;
    }
}

/**
 * Serbest metin araması (`q`): kırpılır; en az `min` karakter değilse `undefined`
 * (backend kısa sorguyu 400 ile reddeder — hiç göndermeyiz).
 */
export function parseQuery(v: unknown, min = 2): string | undefined {
    const s = first(v)?.trim();
    return s && s.length >= min ? s.slice(0, 100) : undefined;
}
