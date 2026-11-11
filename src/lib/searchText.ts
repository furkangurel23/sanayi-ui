/*
 * DÜKKAN ADIYLA ARAMA — arama metni kuralı (004-name-search).
 *
 * Eşleşmeyi BACKEND yapar (GET /api/providers?q=): dükkan adının normal hâli veritabanında
 * (V17 `sanayi_search_fold`), aranan metninki Kotlin'de (`SearchText`) üretilir ve her kelime adın
 * içinde aranır. Bu dosya aynı kuralın TS kopyasıdır ve yalnız şu kararı verir: "bu metin bir arama
 * mı?" (en az bir ≥2 harfli kelime var mı). Geçersiz arama backend'e hiç gönderilmez (UI anayasası
 * III: geçersiz URL değeri yok sayılır) ve arama kutusu kullanıcıya ipucu gösterir.
 *
 * SÖZLEŞME: backend `SearchText.kt` + SQL `sanayi_search_fold` ile BİREBİR. Biri değişirse üçü
 * + testler (searchText.test.mjs, SearchTextTest, SearchFoldEquivalenceIntegrationTest) birlikte.
 *
 * Kural (foldSearch):
 *  1. NFD: aksanlı harf -> taban harf + birleşik işaret (ş -> s + U+0327, İ -> I + U+0307).
 *  2. Birleşik işaretler (U+0300–U+036F) silinir — gerçek veride ayrışık yazılmış adlar da
 *     bölünmeden katlanır.
 *  3. Yalnız ASCII A–Z küçültülür, noktasız ı -> i, kesme işaretleri silinir ("Baran's" -> "barans").
 *     `toLowerCase()` BİLEREK kullanılmaz: JS'de "İ".toLowerCase() = "i" + U+0307 (iki karakter) ve Unicode
 *     küçültmesi SQL/Kotlin ile ayrışabilir; elle ASCII eşleme her yerde aynı sonucu verir.
 *  4. [a-z0-9] dışındaki her şey (noktalama, %, _, ß, emoji...) ayırıcı -> tek boşluk; kırp.
 *
 * NOT: Bu dosya Node'un kendi test koşucusunca (`node --test`) doğrudan yüklenir -> `@/` ya da
 * uzantısız göreli import YOK (Node ESM çözemez). Birleşik işaret aralığı kod noktasıyla kurulur:
 * görünmez işaret karakterleri kaynakta literal yazılırsa editör/kopyalama sırasında kaybolabilir.
 */

/** Ham metin önce bu uzunlukta kesilir (fold'dan önce; JS UTF-16 birimi — Kotlin `take` ile aynı). */
export const MAX_CHARS = 100;
/** Daha kısa kelimeler atılır ("kadir u" -> ["kadir"]). */
export const MIN_TERM = 2;
/** Tekilleştirmeden sonra en fazla bu kadar kelime (backend sorgusu 6 sabit parametre taşır). */
export const MAX_TERMS = 6;

const APOSTROPHES = new Set(["'", "’", "‘", "`", "´"]);
const NON_ALNUM = /[^a-z0-9]+/g;

function isCombiningMark(code: number): boolean {
    return code >= 0x0300 && code <= 0x036f;
}

/** Backend `SearchText.fold` / SQL `sanayi_search_fold` ile aynı normal hâl. */
export function foldSearch(raw: string): string {
    const decomposed = raw.normalize("NFD");
    let out = "";
    // UTF-16 birimleri üzerinde dolaşılır (Kotlin `for (c in String)` ile aynı); vekil çiftler
    // (emoji) zaten [a-z0-9] dışında kalır ve ayırıcıya dönüşür.
    for (let i = 0; i < decomposed.length; i++) {
        const ch = decomposed[i];
        const code = decomposed.charCodeAt(i);
        if (isCombiningMark(code)) continue;                                   // 2. işaretleri sil
        if (code >= 0x41 && code <= 0x5a) out += String.fromCharCode(code + 32); // 3. A–Z -> a–z
        else if (ch === "ı") out += "i";                                       //    noktasız ı -> i
        else if (APOSTROPHES.has(ch)) continue;                                //    kesme işareti sil
        else out += ch;
    }
    return out.replace(NON_ALNUM, " ").trim();                                 // 4.
}

/** Arama metni -> kelimeler: 100 karaktere kes, katla, böl, ≥2 harf, tekilleştir, ilk 6. */
export function searchTerms(raw: string | null | undefined): string[] {
    if (!raw || raw.trim() === "") return [];
    const words = foldSearch(raw.slice(0, MAX_CHARS)).split(" ").filter(w => w.length >= MIN_TERM);
    return [...new Set(words)].slice(0, MAX_TERMS);
}

/**
 * URL'deki `q` parametresini doğrular (server sayfa kullanır).
 * Geçerliyse kırpılmış HAM metin (en çok 100 karakter) döner — kullanıcı kutuda kendi yazdığını
 * görür, backend normalleştirmeyi kendisi yapar. Kelimesizse (`?q=a`, `?q=%`) `undefined`:
 * backend'e gönderilmez ve kutu boş görünür.
 */
export function parseSearch(v: unknown): string | undefined {
    const raw = Array.isArray(v) ? v[0] : v;
    if (typeof raw !== "string") return undefined;
    const trimmed = raw.trim().slice(0, MAX_CHARS);
    return searchTerms(trimmed).length > 0 ? trimmed : undefined;
}
