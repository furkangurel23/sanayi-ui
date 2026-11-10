/*
 * ANKARA İLÇELERİ (003 / T090) — backend `AnkaraGeography.DISTRICTS` ile BİREBİR yazım
 * (Kahramankazan, Şereflikoçhisar dahil). Backend ilçeyi harf duyarsız kabul eder ama
 * kanonik yazımla saklar; UI listeyi buradan alır, URL'deki `district` parametresini de
 * bu listeye göre doğrular (listede yoksa yok sayılır — backend'e gönderilmez).
 *
 * `center`: konum seçicide (LocationPicker) ilçe seçilince haritanın uçtuğu YAKLAŞIK ilçe
 * merkezi (ilçe belediyesi civarı). Yalnız başlangıç görünümüdür — kullanıcı haritayı
 * kaydırıp dükkanın gerçek yerini seçer; bu koordinat hiçbir zaman sessizce GÖNDERİLMEZ.
 *
 * Ankara il kutusu (backend AnkaraGeography ile aynı sınırlar): istemci ön kontrolü —
 * kesin karar backend'in (`fieldErrors.location`).
 */
export type District = { name: string; center: { lat: number; lon: number } };

export const DISTRICTS: readonly District[] = [
    {name: "Akyurt", center: {lat: 40.1336, lon: 33.0867}},
    {name: "Altındağ", center: {lat: 39.9440, lon: 32.8790}},
    {name: "Ayaş", center: {lat: 40.0190, lon: 32.3450}},
    {name: "Bala", center: {lat: 39.5540, lon: 33.1240}},
    {name: "Beypazarı", center: {lat: 40.1675, lon: 31.9210}},
    {name: "Çamlıdere", center: {lat: 40.4900, lon: 32.4750}},
    {name: "Çankaya", center: {lat: 39.9030, lon: 32.8600}},
    {name: "Çubuk", center: {lat: 40.2390, lon: 33.0320}},
    {name: "Elmadağ", center: {lat: 39.9210, lon: 33.2310}},
    {name: "Etimesgut", center: {lat: 39.9570, lon: 32.6600}},
    {name: "Evren", center: {lat: 39.0230, lon: 33.8070}},
    {name: "Gölbaşı", center: {lat: 39.7900, lon: 32.8070}},
    {name: "Güdül", center: {lat: 40.2110, lon: 32.2460}},
    {name: "Haymana", center: {lat: 39.4320, lon: 32.4960}},
    {name: "Kahramankazan", center: {lat: 40.2060, lon: 32.6830}},
    {name: "Kalecik", center: {lat: 40.0980, lon: 33.4080}},
    {name: "Keçiören", center: {lat: 39.9970, lon: 32.8640}},
    {name: "Kızılcahamam", center: {lat: 40.4700, lon: 32.6500}},
    {name: "Mamak", center: {lat: 39.9330, lon: 32.9140}},
    {name: "Nallıhan", center: {lat: 40.1860, lon: 31.3520}},
    {name: "Polatlı", center: {lat: 39.5840, lon: 32.1470}},
    {name: "Pursaklar", center: {lat: 40.0390, lon: 32.9010}},
    {name: "Sincan", center: {lat: 39.9690, lon: 32.5800}},
    {name: "Şereflikoçhisar", center: {lat: 38.9390, lon: 33.5390}},
    {name: "Yenimahalle", center: {lat: 39.9700, lon: 32.8100}},
];

export const DISTRICT_NAMES: readonly string[] = DISTRICTS.map(d => d.name);

/** Ankara merkezi (ilçe seçilmemişken konum seçicinin başlangıç görünümü). */
export const ANKARA_CENTER = {lat: 39.925533, lon: 32.866287};

export const ANKARA_BOX = {minLat: 38.60, maxLat: 40.75, minLon: 30.80, maxLon: 34.20} as const;

/** Konum Ankara il kutusunun içinde mi? (sınırlar dahil — backend ile aynı) */
export function inAnkara(lat: number, lon: number): boolean {
    return Number.isFinite(lat) && Number.isFinite(lon)
        && lat >= ANKARA_BOX.minLat && lat <= ANKARA_BOX.maxLat
        && lon >= ANKARA_BOX.minLon && lon <= ANKARA_BOX.maxLon;
}

/** Türkçe harf duyarsız anahtar ("ÇANKAYA" ~ "çankaya"). `tr-TR`: "I".toLocaleLowerCase -> "ı". */
const BY_KEY = new Map(DISTRICTS.map(d => [d.name.toLocaleLowerCase("tr-TR"), d]));

export function findDistrict(name: string | null | undefined): District | undefined {
    return name ? BY_KEY.get(name.trim().toLocaleLowerCase("tr-TR")) : undefined;
}

/** URL parametresinden ilçe: listede varsa KANONİK yazım, yoksa `undefined` (filtre yok). */
export function parseDistrict(v: unknown): string | undefined {
    const s = Array.isArray(v) ? v[0] : v;
    return typeof s === "string" ? findDistrict(s)?.name : undefined;
}
