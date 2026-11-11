/*
 * USTA DETAY SAYFASI — Server Component (SSR).
 *
 * generateMetadata: sekme başlığını usta adıyla dinamik kurar (SEO).
 * İki bağımsız veri çekimi PARALEL (Promise.all): detay + yorum sayfası (ikisi de
 * no-store, her zaman taze). Seri await'te toplam süre = detay + yorumlar olurdu;
 * paralelde = en yavaşı kadar.
 * 404 kontrolü bu sayfada DEĞİL, aynı klasördeki layout.tsx'te (neden: orada
 * açıklandı — loading.tsx'in Suspense'i yüzünden sayfadaki notFound() 404 veremez).
 * getProviderDetail React cache() ile sarılı: layout + generateMetadata + sayfa
 * aynı istekte TEK backend çağrısı yapar.
 * Yorum isteği hata verirse sayfa çökmez: .catch(() => null) -> yorum bölümünde
 * Türkçe hata kutusu, dükkan bilgisi yine görünür ("graceful degradation").
 * URL parametreleri (page, size) params.ts ile temizlenir: ?page=0/abc -> 1.
 * scoreHistogram Record<string, number> gelir; -5..+5 dizisine map'lenerek
 * eksik skorlar 0 ile doldurulur (histogram her zaman 11 çubuk).
 *
 * 002 görünümü: başlık alanı geniş köşeli kart (.detail-head) — ad .title kademesinde,
 * adres Pin ikonuyla, telefon --accent-text bağlantısı (44 px dokunma alanı), büyük
 * ScoreBadge (renk + işaret). Yorum yoksa ortak EmptyState; satır içi stiller sınıflara
 * taşındı.
 *
 * 002 rev 3 (US5 — "arabadaki kullanıcı"):
 *  - Telefonun altında "Yol tarifi" bağlantıları (DirectionsLinks): Google Haritalar önce,
 *    Apple Haritalar sonra. Konum varsa hedef koordinat; yoksa adres + ilçe + şehir
 *    (detay ucu `address` taşıyan tek yer -> adres yedeği burada çalışır); ikisi de yoksa
 *    bağlantı çizilmez.
 *  - Konum haritası artık liste sayfasıyla AYNI MapSection (title="Konum"): URL'de showMap
 *    yoksa "auto" mod -> telefonda kapalı başlar, Leaflet ve karolar inmez (FR-022). Eski
 *    ProviderMapClient sarmalayıcısı kaldırıldı (tek harita kalıbı). Harita kabının
 *    yüksekliği (--map-h) MapSection'da çalışma anı değeri olarak verilir.
 *
 * 003 (T095): "Çalışma saatleri" bölümü (OpeningHoursView — sunucu; "şu an açık" küçük client
 * adacığı). Bilgi yoksa "Çalışma saati bilgisi yok" yazar.
 * 003 (T114): başlık kartının altında "Bu dükkan benim" ikincil bağlantısı (ClaimLink).
 *
 * 005 (SEO): generateMetadata artık `pageMetadata` ile başlık ("{ad} – {ilçe|sanayi sitesi} – {marka}"),
 * açıklama, kanonik (`/providers/{id}` — sorgulu yazımlar da sorgusuzu gösterir), paylaşım bilgisi ve
 * robots üretir (lib/seo). Sayfa işletme + gezinti yolu yapılandırılmış verisi (JSON-LD) basar ve
 * görünür gezinti yolunu gösterir. Yorum metinleri/kullanıcı adları bu metinlere GİRMEZ.
 */
import {formatPhoneTR} from "@/lib/phone";
import {sourceLabel} from "@/lib/sources";
import type {Page as PageType, ProviderDetailDto, ProviderListItem, RatingDto} from "@/lib/types";
import {getFacets, getProviderDetail, getProviderRatings} from "@/lib/api";
import Link from "next/link";
import {notFound} from "next/navigation";
import {parsePage, parsePositiveId, parseSize} from "@/lib/params";
import RatingItem from "@/components/RatingItem";
import Pagination from "@/components/Pagination";
// Harita: MapSection bir CLIENT bileşen; içinde ProvidersMap'i dynamic(ssr:false) ile yükler
// (server component'ta ssr:false kullanılamaz — anayasa I).
import MapSection from "@/components/MapSection";
import DirectionsLinks from "@/components/DirectionsLinks";
import MiniHistogram from "@/components/MiniHistogram";
import RateForm from "@/components/RateForm";
import ScoreBadge, {formatScore} from "@/components/ScoreBadge";
import EmptyState from "@/components/EmptyState";
import OpeningHoursView from "@/components/OpeningHoursView";
import ClaimLink from "@/components/ClaimLink";
import {Chat, Pin} from "@/components/icons";
import Breadcrumbs from "@/components/seo/Breadcrumbs";
import JsonLd from "@/components/seo/JsonLd";
import {pageMetadata} from "@/lib/seo/site";
import {shopDescription, shopTitle} from "@/lib/seo/text";
import {breadcrumbJsonLd, businessJsonLd, type Crumb} from "@/lib/seo/jsonLd";
import {buildLandingIndex, districtHref, districtOf, isIndexable, landingPath, shopChipHref} from "@/lib/seo/landing";
import {landingTitle} from "@/lib/seo/text";

/** Detay haritasının yüksekliği (px) — iskelet ve harita aynı değeri --map-h ile okur. */
const MAP_HEIGHT = 220;

export async function generateMetadata({params}: { params: Promise<{ id: string }> }) {
    const {id: raw} = await params;
    const id = parsePositiveId(raw);
    // Geçersiz id'de layout zaten notFound() çağırır; burada backend'e hiç sormuyoruz.
    if (id === undefined) return {title: "Usta Detayı"};
    try {
        // cache()'li çağrı: layout ile aynı isteği paylaşır (ikinci backend çağrısı yok).
        const detail = await getProviderDetail(id);
        if (!detail) return {title: "Usta Detayı"};
        return pageMetadata({title: shopTitle(detail), description: shopDescription(detail), path: `/providers/${id}`});
    } catch {
        return {title: "Usta Detayı"};
    }
}

export default async function ProviderDetailPage({
                                                     params,
                                                     searchParams,
                                                 }: {
    params: Promise<{ id: string }>;
    searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
    const p = await params;
    const sp = await searchParams;

    // layout.tsx id'yi zaten doğruladı; yine de TypeScript için daraltıyoruz.
    const id = parsePositiveId(p.id);
    if (id === undefined) notFound();

    const rPage = parsePage(sp.page);
    const rSize = parseSize(sp.size, 10, 50);
    // Harita tercihi — liste/yakınımdakiler ile AYNI ayrıştırma: "1"/"0" açık tercih,
    // yoksa undefined = "auto" (dar ekranda kapalı). URL tercihi ekran genişliğinden önceliklidir.
    const showMapParam = typeof sp.showMap === "string" ? sp.showMap : undefined;
    const mapInitialOpen = showMapParam === "1" ? true : showMapParam === "0" ? false : undefined;

    const [found, ratingsPage, facets] = await Promise.all([
        getProviderDetail(id),
        getProviderRatings({
            id, page: rPage, size: rSize, sortField: "createdAt", sortDir: "desc",
        }).catch((): PageType<RatingDto> | null => null), // yorumlar gelmezse sayfa yine açılır
        // 005: etiket/ilçe bağlantıları açılış sayfalarına; sayım özeti alınamazsa ESKİ liste filtreleri.
        getFacets().catch(() => null),
    ]);
    const landing = facets ? buildLandingIndex(facets) : null;
    // Layout null'ı zaten 404'e çevirdi (aynı cache()'li sonuç) — bu satır yalnızca
    // TypeScript'e "buradan sonra detail kesin var" demek için (narrowing).
    if (!found) notFound();
    const detail: ProviderDetailDto = found;

    const addressLine = [detail.address, detail.district, detail.city].filter(Boolean).join(", ");

    const mapItems: ProviderListItem[] = detail.location
        ? [{
            id: detail.id,
            name: detail.name,
            city: detail.city ?? undefined,
            district: detail.district ?? undefined,
            phone: detail.phone ?? undefined,
            avgScore: typeof detail.avgScore === "number" ? detail.avgScore : undefined,
            ratingCount: detail.ratingCount,
            lat: detail.location.lat,
            lon: detail.location.lon,
        }]
        : [];

    // Gezinti yolu (görünür + JSON-LD aynı öğeler; spec US1-8): ara adım dükkanın ilçe sayfası — ilçe
    // yoksa ya da ilçe sayfası dizinde değilse (sayım özeti yok/ilçe tanınmıyor) "Ustalar".
    const districtEntry = landing ? districtOf(landing, detail.district) : undefined;
    const middle: Crumb = districtEntry && isIndexable(false, districtEntry.count)
        ? {name: landingTitle("ilce", districtEntry.name), path: landingPath("ilce", districtEntry.slug)}
        : {name: "Ustalar", path: "/providers"};
    const crumbs: Crumb[] = [
        {name: "Ana sayfa", path: "/"},
        middle,
        {name: detail.name, path: `/providers/${detail.id}`},
    ];
    const districtLink = districtHref(landing, detail.district);

    const range = [-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5];
    const buckets = range.map(s => ({
        score: s,
        count: Number(detail.scoreHistogram?.[String(s)] ?? 0),
    }));
    const histogramTotal = buckets.reduce((sum, b) => sum + b.count, 0);

    // Ortalama metni: işaretli, 2 ondalık ("+3.00"); puan yoksa uzun tire.
    const avg = typeof detail.avgScore === "number" ? formatScore(detail.avgScore, 2) : null;
    const avgText = avg ? `${avg.sign}${avg.value}` : "—";

    return (
        <main className="container container-narrow page">
            <JsonLd data={[businessJsonLd(detail, `/providers/${detail.id}`), breadcrumbJsonLd(crumbs)]}/>
            <Breadcrumbs items={crumbs}/>
            {/* Başlık alanı */}
            <section className="card detail-head" aria-labelledby="provider-title">
                <div className="detail-head-top">
                    <div className="detail-head-info">
                        <h1 id="provider-title" className="title">{detail.name}</h1>
                        <div className="detail-meta">
                            <Pin size="sm"/>
                            <span>{addressLine || "Adres bilgisi yok"}</span>
                        </div>
                        {/* 005: ilçenin açılış sayfasına iç bağlantı (sayım özeti yoksa filtreli liste). */}
                        {districtLink && detail.district && (
                            <Link href={districtLink} className="link-accent caption">
                                {detail.district} oto sanayi ustaları
                            </Link>
                        )}
                        {/* tel: bağlantısı E.164 kalır (aranabilir biçim); görünen metin gruplanmış (002). */}
                        {detail.phone && (
                            <a className="link-accent" href={`tel:${detail.phone}`}>
                                {formatPhoneTR(detail.phone)}
                            </a>
                        )}
                        {/* 002 / US3-AS2: verinin kaynağı (birleşmişse hepsi). Kaynaksız (elle eklenmiş)
                            dükkanda ya da alanı göndermeyen eski backend'de satır hiç çizilmez. */}
                        {detail.sources && detail.sources.length > 0 && (
                            <p className="caption muted detail-source">
                                Kaynak: {detail.sources.map(sourceLabel).join(", ")}
                            </p>
                        )}
                    </div>
                    <ScoreBadge score={detail.avgScore} count={detail.ratingCount} size="lg"/>
                </div>

                {/* Yol tarifi (FR-023): bilgi sütununun DIŞINDA, kartın tam genişliğinde — mobilde
                    puan rozeti yanındaki dar sütun düğmeleri sıkıştırıyordu; arabadaki kullanıcı
                    için büyük, tam genişlik dokunma hedefi. Hedef yoksa bileşen hiçbir şey çizmez. */}
                <DirectionsLinks variant="buttons" name={detail.name}
                                 lat={detail.location?.lat} lon={detail.location?.lon}
                                 address={detail.address} district={detail.district} city={detail.city}/>

                <div className="detail-secondary">
                    <ClaimLink providerId={detail.id}/>
                </div>

                {(detail.brands.length > 0 || detail.categories.length > 0) && (
                    <div className="cluster">
                        {/* 005: etiketler açılış sayfalarına — dükkanın ilçesindeki kırılım dizindeyse (≥3) oraya,
                            değilse "Ankara {Marka} ustaları"na; hedef yoksa eski filtreli liste (lib/seo/landing). */}
                        {detail.brands.map(b => (
                            <Link key={`b${b.id}`} href={shopChipHref(landing, "marka", b.id, detail.district)}
                                  className="chip chip-accent">{b.name}</Link>
                        ))}
                        {detail.categories.map(c => (
                            <Link key={`c${c.id}`} href={shopChipHref(landing, "kategori", c.id, detail.district)}
                                  className="chip">{c.name}</Link>
                        ))}
                    </div>
                )}
            </section>

            {/* Çalışma saatleri (003) */}
            <section className="stack" aria-labelledby="hours-title">
                <h2 id="hours-title" className="headline">Çalışma saatleri</h2>
                <div className="card hours-card">
                    <OpeningHoursView hours={detail.openingHours}/>
                </div>
            </section>

            {/* Konum */}
            {/* Konumu olmayan dükkanda harita bölümü hiç çizilmez (yol tarifi adresle çalışır).
                key: showMap değişince (geri/ileri) remount -> durum URL'den yeniden başlar. */}
            {mapItems.length > 0 && (
                <MapSection key={`map-${mapInitialOpen ?? "auto"}`} title="Konum" items={mapItems}
                            height={MAP_HEIGHT} initialOpen={mapInitialOpen}/>
            )}

            {/* Puan dağılımı */}
            {detail.ratingCount > 0 && (
                <section className="stack" aria-labelledby="dist-title">
                    <h2 id="dist-title" className="headline">Puan dağılımı</h2>
                    <div className="stat-grid">
                        <div className="card stat-card">
                            {/* Ortalama da işaretli yazılır (+3.00 / −1.50) — rozetle tutarlı (FR-014) */}
                            <div className="stat-value">
                                {avgText}
                            </div>
                            <div className="caption muted">{detail.ratingCount} oy ortalaması</div>
                        </div>
                        <MiniHistogram buckets={buckets} total={histogramTotal || detail.ratingCount}/>
                    </div>
                </section>
            )}

            {/* Puan/yorum formu */}
            <RateForm providerId={id}/>

            {/* Yorumlar */}
            <section className="stack" aria-labelledby="reviews-title">
                <div className="section-head">
                    <h2 id="reviews-title" className="headline">Yorumlar</h2>
                    <span className="chip">{detail.ratingCount} değerlendirme</span>
                </div>

                {ratingsPage === null ? (
                    // Yorum isteği başarısız oldu (backend hatası) — sayfanın geri kalanı çalışır.
                    <div className="alert alert-error" role="alert">Yorumlar şu anda yüklenemedi.</div>
                ) : ratingsPage.content.length === 0 ? (
                    <EmptyState
                        icon={<Chat/>}
                        title="Henüz yorum yok."
                        description="İlk değerlendirmeyi sen yap!"
                    />
                ) : (
                    <ul className="stack">
                        {ratingsPage.content.map((r) => <RatingItem key={r.id} r={r}/>)}
                    </ul>
                )}

                {ratingsPage && (
                    <Pagination mode="url" page={(ratingsPage.number ?? 0) + 1} totalPages={ratingsPage.totalPages ?? 1}/>
                )}
            </section>
        </main>
    );
}
