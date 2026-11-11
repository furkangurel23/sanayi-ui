/*
 * AÇILIŞ SAYFASI ADRES KELİMESİ (slug) — 005-seo-foundation, spec FR-008.
 *
 * "Ankara Honda ustaları" sayfası `/ankara/marka/honda`, "Hibrit ve Elektrikli Araç" kategorisi
 * `/ankara/kategori/hibrit-ve-elektrikli-arac`, Çankaya `/ankara/ilce/cankaya` adresinde yaşar. Kural TEK
 * yerde: burada. Hem bağlantı üretimi (landing.ts) hem `proxy.ts`'teki kanonik yönlendirme (308) bu
 * fonksiyonu kullanır — iki ayrı kural olsaydı bağlantı ile yönlendirme birbirini kovalardı.
 *
 * Kural: "&" -> " ve " (A & B -> a-ve-b), sonra ad aramasıyla AYNI Türkçe katlama (`foldSearch`:
 * ç->c, ğ->g, ı/İ->i, ö->o, ş->s, ü->u, aksanlar silinir, harf/rakam dışı -> boşluk), boşluklar -> "-".
 * foldSearch zaten ardışık ayırıcıları teke indirip baştan/sondan kırptığı için tire tekrarı olmaz.
 *
 * EŞGÜÇLÜLÜK: slugify(slugify(x)) === slugify(x) — kanonik bir adres tekrar katlandığında değişmez,
 * yani proxy kanonik adresi ASLA yeniden yönlendirmez (döngü yok). Test ile kilitli.
 *
 * Node test koşucusu bu dosyayı doğrudan yükler -> import'lar `.ts` uzantılı ve göreli.
 */
import {foldSearch} from "../searchText.ts";

export function slugify(name: string): string {
    return foldSearch(name.replace(/&/g, " ve ")).replace(/ /g, "-");
}
