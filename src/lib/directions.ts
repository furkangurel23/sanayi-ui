/*
 * YOL TARİFİ BAĞLANTILARI (002 rev 3 / US5, FR-023) — saf (pure) fonksiyonlar.
 *
 * Senaryo: kullanıcı arabada, telefondan siteye girdi, ustayı buldu -> tek dokunuşla
 * telefonundaki harita uygulamasında yol tarifini başlatmak istiyor. Bunun için harita
 * sağlayıcılarının herkese açık "URL şemaları" yeterli: API anahtarı, SDK veya paket YOK
 * (anayasa IV). Bağlantı mobilde ilgili uygulamayı (Google Maps / Apple Maps) açar,
 * masaüstünde aynı adres web sitesinde açılır.
 *
 * Öğrenme notları:
 *  - "Saf fonksiyon": aynı girdiye hep aynı çıktıyı verir, dışarıya dokunmaz (DOM, ağ,
 *    window yok). Bu yüzden hem SERVER component'ta (DirectionsLinks) hem CLIENT'ta
 *    (ProvidersMap popup'ı) aynı dosya kullanılabilir; `node --test` ile tarayıcısız da
 *    denenebilir (directions.test.mjs).
 *  - Hedef seçimi:
 *      1) Koordinat varsa ("39.92,32.85") -> en kesin hedef. `Number.isFinite` hem
 *         undefined/null'ı hem NaN/Infinity'yi eler (`typeof x === "number"` NaN'ı geçirirdi).
 *      2) Koordinat yoksa AMA sokak adresi varsa -> "adres, ilçe, şehir" metni; harita
 *         uygulaması bunu kendisi konuma çevirir (geocoding).
 *      3) Yalnız ilçe/şehir varsa -> null (bağlantı GÖSTERİLMEZ): kullanıcıyı ilçe
 *         merkezine götürmek, hiç bağlantı olmamasından daha kötü (yanlış yere sürer).
 *  - `encodeURIComponent`: virgül, boşluk, Türkçe harf (ş, ğ, İ), "&" gibi karakterleri
 *    URL'de güvenle taşınacak biçime çevirir ("Ostim, Yenimahalle" -> "Ostim%2C%20Yenimahalle").
 *    Kodlamasaydık adresteki bir "&" sorgu dizesini bölerdi.
 *  - NEDEN GOOGLE ÖNCE? Apple Haritalar bağlantısı yalnız Apple cihazlarda uygulamayı
 *    açar; Android'de ve Windows'ta sadece web sayfası açılır. Google Haritalar bağlantısı
 *    ise Android'de uygulamayı, iPhone'da (yüklüyse) uygulamayı, yoksa web'i açar —
 *    çoğu kullanıcıya uyan seçenek önce gelir. (Platform tespiti YAPMIYORUZ: user-agent
 *    koklamak kırılgan ve sunucu render'ında bilinmez; iki bağlantıyı da gösteriyoruz.)
 *  - Apple'da `q` parametresi KULLANILMAZ: `daddr` ile birlikte `q` verilirse Apple onu
 *    bir "arama" sanıp yol tarifi yerine arama sonucu gösterebiliyor. `dirflg=d` = araçla.
 *    Google'da `travelmode=driving` aynı işi görür; `api=1` evrensel URL sürümüdür.
 */

export type DirectionsTarget = {
    name: string;
    lat?: number | null;
    lon?: number | null;
    address?: string | null;
    district?: string | null;
    city?: string | null;
};

export type DirectionsUrls = { google: string; apple: string };

/** Hedef metni (kodlanmamış) — koordinat > adres; ikisi de yoksa null. */
export function directionsDestination(t: DirectionsTarget): string | null {
    if (Number.isFinite(t.lat) && Number.isFinite(t.lon)) {
        // Number.isFinite tip daraltmaz (parametresi `unknown`) -> `as number` güvenli:
        // bir üst satırda sonlu sayı olduklarını kanıtladık.
        return `${t.lat as number},${t.lon as number}`;
    }
    const address = t.address?.trim();
    if (!address) return null; // yalnız ilçe/şehir -> bağlantı yok (bkz. üstteki not)
    // Adres metni ilçeyi zaten içeriyorsa ("100. Yıl Bulvarı No:14, Etimesgut") tekrar
    // eklemeyiz -> "…, Etimesgut, Etimesgut, Ankara" yerine "…, Etimesgut, Ankara".
    // toLocaleLowerCase("tr"): Türkçe kurala göre küçült ("İ" -> "i", "I" -> "ı").
    const lower = address.toLocaleLowerCase("tr");
    const extra = [t.district?.trim(), t.city?.trim()]
        // filter: boş/null parçaları ve adreste zaten geçenleri at -> "Adres, , Ankara" olmaz.
        .filter((part): part is string => !!part && !lower.includes(part.toLocaleLowerCase("tr")));
    return [address, ...extra].join(", ");
}

/** Google + Apple yol tarifi URL'leri; hedef yoksa null (çağıran hiçbir şey çizmez). */
export function directionsUrls(t: DirectionsTarget): DirectionsUrls | null {
    const dest = directionsDestination(t);
    if (dest === null) return null;
    const d = encodeURIComponent(dest);
    return {
        google: `https://www.google.com/maps/dir/?api=1&destination=${d}&travelmode=driving`,
        apple: `https://maps.apple.com/?daddr=${d}&dirflg=d`,
    };
}
