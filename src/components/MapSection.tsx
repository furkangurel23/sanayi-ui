"use client";

/*
 * HARİTA BÖLÜMÜ — aç/kapa durumu URL ile senkron (?showMap=1/0).
 *
 * Neden URL'de? Kullanıcı filtre değiştirip sayfa yeniden çekildiğinde veya linki
 * paylaştığında harita tercihi korunsun.
 *
 * Next 16 deseni (useSearchParams'SIZ):
 *  - Başlangıç değeri (initialOpen) SERVER sayfadan prop olarak gelir — server
 *    zaten searchParams'ı okuyor, client'ta tekrar okumaya gerek yok.
 *  - URL'e yazma işi TIKLAMA ANINDA window.location.search'ten yapılır
 *    (event handler yalnızca tarayıcıda çalışır, güvenlidir).
 *  - Geri/ileri senkronu: URL değişince server sayfa yeni initialOpen ile render
 *    eder; sayfa bileşene `key={`map-${initialOpen ?? "auto"}`}` verdiği için bileşen
 *    REMOUNT olur ve state yeni değerden başlar (React'in "key ile resetleme" kalıbı).
 *
 * 002 rev 3 / US5 — "AUTO" MOD (FR-022): kullanıcı arabada, telefondan giriyor; sayfa hızlı
 * açılsın, harita kodu (Leaflet) ve karolar boşuna inmesin.
 *  - URL'de `showMap` YOKSA (initialOpen === undefined) mod "auto": 768 px'ten dar ekranda
 *    harita KAPALI, geniş ekranda AÇIK başlar. URL'de `showMap=1/0` varsa o kazanır
 *    (paylaşılan bağlantı her ekranda aynı görünür — anayasa II).
 *  - SORUN: sunucu ekran genişliğini BİLMEZ. Sunucu "açık" çizip telefon sonra kapatsaydı
 *    sayfa zıplardı (CLS); "kapalı" çizip masaüstü sonra açsaydı yine zıplardı.
 *  - ÇÖZÜM (iki adım):
 *      1) İlk boyamada kararı CSS verir: sunucu İKİ durumu da çizer (harita kabı + iskelet
 *         VE "Harita kapalı" kutusu; başlıkta "gizle" VE "göster" düğmeleri). Bölüm
 *         `.map-auto` sınıfı taşır; globals.css'teki medya sorgusu (768 px) birini gizler.
 *         CSS, JS'ten önce ve JS olmadan çalıştığı için ilk boyama zaten doğrudur.
 *         İskelet harita DEĞİLDİR: Leaflet parçası henüz istenmez -> telefonda hiç inmez.
 *      2) Hidrasyondan sonra JS aynı sorguyu (`matchMedia`) okur ve fazla durumu DOM'dan
 *         kaldırır. Sonuç CSS'in gösterdiğiyle aynı olduğu için görünür hiçbir şey kaymaz.
 *         Ancak etkin durum "açık" çözülünce gerçek harita (dinamik parça) mount edilir.
 *  - useSyncExternalStore NEDEN? Tarayıcıdaki bir "dış kaynağa" (burada medya sorgusu)
 *    React'i güvenle abone etmenin resmi yolu. Üç fonksiyon alır:
 *      subscribe         -> kaynak değişince React'e haber ver (matchMedia "change" olayı)
 *      getSnapshot       -> tarayıcıdaki güncel değer (true/false)
 *      getServerSnapshot -> SUNUCUDA ve HİDRASYON sırasında kullanılacak değer (null =
 *                           "bilinmiyor"). Hidrasyonda istemci de null kullanır -> sunucu
 *                           HTML'iyle birebir aynı ağaç -> hydration uyarısı OLMAZ; hemen
 *                           ardından React gerçek değerle bir kez daha render eder.
 *    (Alternatif useEffect + useState olurdu: "effect içinde setState" uyarısı + pencere
 *    değişimi için elle dinleyici/temizlik yazmak gerekirdi.)
 *  - Auto mod, kullanıcı seçim yapana kadar ekranı İZLER: telefon yatay çevrilip 768 px'i
 *    geçerse harita açılır (CSS'in vereceği kararla aynı). Kullanıcı düğmeye bastığı an
 *    tercih URL'e yazılır ve mod "açık tercih"e döner (artık genişlik önemsiz).
 *
 * Performans: harita SADECE etkin durum "açık" iken render edilir (kapalıyken unmount) —
 * leaflet gibi ağır bir kütüphane boşuna çalışmaz.
 *
 * next/dynamic + ssr:false (anayasa I): ProvidersMap'i statik import etmek yerine
 * dinamik yüklüyoruz. Böylece harita kodu + Leaflet CSS'i AYRI bir parça (chunk) olur;
 * yalnızca bu bileşen ekranda harita çizdiğinde indirilir. `ssr: false` sunucuda hiç
 * render etmez (Leaflet `window` ister). Not: `ssr: false` yalnızca CLIENT bileşen
 * içinde kullanılabilir — bu dosya zaten "use client". Yüklenirken aynı yükseklikte
 * bir .skeleton gösterilir -> düzen kayması (CLS) olmaz.
 * Kullanan rotalar: /providers, /providers/near ve /providers/[id] (title="Konum";
 * rev 3'te eski ProviderMapClient sarmalayıcısının yerini aldı — tek harita kalıbı).
 */

import {type CSSProperties, useId, useState, useSyncExternalStore} from "react";
import dynamic from "next/dynamic";
import {preconnect} from "react-dom";
import {useRouter} from "next/navigation";
import type {ProviderListItem} from "@/lib/types";
import {MAP_OPEN_QUERY} from "@/lib/breakpoints";
import EmptyState from "@/components/EmptyState";
import {Pin} from "@/components/icons";

const ProvidersMap = dynamic(() => import("@/components/ProvidersMap"), {
    ssr: false,
    // `loading` fonksiyonu bileşenin prop'larını (height) GÖREMEZ. Bu yüzden yükseklik
    // .map-frame kabına `--map-h` CSS değişkeni olarak verilir; iskelet (.skeleton-map)
    // onu okur -> sabit sayı kopyalanmaz, harita gelince sayfa zıplamaz (CLS yok).
    loading: () => <div className="skeleton skeleton-map" aria-hidden/>,
});

/*
 * useSyncExternalStore'un üç fonksiyonu MODÜL düzeyinde: her render'da yeni fonksiyon
 * üretilseydi React her seferinde aboneliği söküp yeniden kurardı.
 */
function subscribeWide(onChange: () => void) {
    const mql = window.matchMedia(MAP_OPEN_QUERY);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange); // temizlik (unmount)
}
const getWide = () => window.matchMedia(MAP_OPEN_QUERY).matches;
const getWideOnServer = () => null; // sunucu + hidrasyon: "bilinmiyor"

type Props = {
    items: ProviderListItem[];
    height?: number;
    /** URL'deki showMap: true/false = açık tercih; undefined = "auto" mod (ekran genişliği). */
    initialOpen?: boolean;
    /** Bölüm başlığı (liste: "Harita", detay: "Konum"). */
    title?: string;
};

export default function MapSection({items, height = 280, initialOpen, title = "Harita"}: Props) {
    const router = useRouter();
    // useId: sunucu ve istemcide AYNI kimliği üretir (hydration güvenli) -> aria-labelledby.
    const headingId = useId();

    const anyWithCoords = items.some(p => typeof p.lat === "number" && typeof p.lon === "number");

    // Kullanıcının tercihi: URL'den gelen (initialOpen) ya da tıklamayla verilen.
    // null = tercih yok -> etkin durumu ekran genişliği belirler (auto).
    const [choice, setChoice] = useState<boolean | null>(initialOpen ?? null);
    const wide = useSyncExternalStore(subscribeWide, getWide, getWideOnServer);

    // ETKİN DURUM: true (açık) | false (kapalı) | null (auto, henüz bilinmiyor -> CSS karar verir).
    // Tercih yoksa ve koordinatlı kayıt da yoksa her genişlikte kapalı (mevcut kural).
    const open: boolean | null = choice !== null ? choice : !anyWithCoords ? false : wide;
    const pending = open === null;

    // 002 / T038 — harita rotalarında LCP öğesi OSM karosu. Karo sunucusuna bağlantıyı
    // (DNS + TCP + TLS) ERKEN açmak için React 19'un kaynak ipucu API'si: render sırasında
    // preconnect() çağrılır; sunucu render'ında React <head>'e <link rel="preconnect"> ekler.
    // Kapalıyken çağrılmaz; auto modda (open === null) SUNUCUDA çağrılır — masaüstünde LCP
    // kazancı korunur, telefonda yalnız bir bağlantı ipucu kalır (karo İNDİRMEZ). Yeni
    // üçüncü taraf YOK: aynı karo sunucusu (FR-018), sadece bağlantı daha önce kurulur.
    if (open !== false) preconnect("https://tile.openstreetmap.org");

    const toggle = () => {
        // Etkin durumu tersle. (Hidrasyon ile gerçek değerin gelmesi arasındaki çok kısa anda
        // tıklanırsa open null olabilir -> o an tarayıcıya sorarız.)
        const current = open ?? getWide();
        const next = !current;
        setChoice(next); // anında görsel tepki (optimistic)
        // Tıklama anında mevcut query korunarak sadece showMap güncellenir.
        // scroll:false -> Next varsayılan olarak sayfanın başına kaydırır; harita düğmesi
        // sayfanın ortasında olabilir, kullanıcının yeri değişmesin.
        const params = new URLSearchParams(window.location.search);
        params.set("showMap", next ? "1" : "0");
        router.push(`?${params.toString()}`, {scroll: false});
    };

    // Başlık düğmesi. aria-pressed: "harita açık mı" bilgisini yardımcı teknolojiye verir.
    // map-when-open/closed sınıfları yalnız .map-auto altında (bilinmiyorken) etkilidir.
    const toggleButton = (isOpen: boolean) => (
        <button type="button" onClick={toggle} aria-pressed={isOpen}
                className={`btn btn-outline btn-sm ${isOpen ? "map-when-open" : "map-when-closed"}`}>
            {isOpen ? "Haritayı gizle" : "Haritayı göster"}
        </button>
    );

    // Kapalı kutunun açıklaması: auto modda NEDEN kapalı olduğunu söyler (yalnız dar ekranda
    // görünür); açık tercih ya da konumsuz sonuçlarda kısa bilgi.
    const closedDescription = !anyWithCoords
        ? "Bu sonuçlarda konum bilgisi olan usta yok."
        : choice === null
            ? "Sayfa hızlı açılsın diye küçük ekranda harita kapalı başlar."
            : <>&ldquo;Haritayı göster&rdquo; ile açabilirsiniz.</>;

    return (
        // .map-auto yalnız "henüz bilinmiyor" iken: medya sorgusu iki durumdan birini gizler.
        <section className={`stack${pending ? " map-auto" : ""}`} aria-labelledby={headingId}>
            <div className="section-head">
                <h2 id={headingId} className="headline">{title}</h2>
                {/* Bilinmiyorken İKİ düğme de çizilir (CSS birini gizler); sonra yalnız biri. */}
                {pending ? <>{toggleButton(true)}{toggleButton(false)}</> : toggleButton(open)}
            </div>

            {open !== false && (
                // çalışma anı değeri: harita yüksekliği (prop) -> iskelet ve harita aynı boyda
                <div className="map-frame map-when-open" style={{"--map-h": `${height}px`} as CSSProperties}>
                    {open
                        ? <ProvidersMap items={items} height={height}/>
                        // auto + bilinmiyor: yalnız iskelet (harita parçası henüz İSTENMEZ)
                        : <div className="skeleton skeleton-map" aria-hidden/>}
                </div>
            )}
            {open !== true && (
                <div className="map-when-closed">
                    <EmptyState compact icon={<Pin/>} title="Harita kapalı." description={closedDescription}/>
                </div>
            )}
        </section>
    );
}
