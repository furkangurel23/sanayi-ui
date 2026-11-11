import {
    BrandDto,
    CategoryDto,
    IdName,
    NearItem,
    Page,
    ProviderDetailDto,
    ProviderFacets,
    ProviderListItem,
    RatingDto,
    SitemapEntry,
    SpringPage
} from "@/lib/types";
import {normalizePage} from "@/lib/page";
import {toApiError} from "@/lib/apiError";
import {clampRadiusKm} from "@/lib/params";
import {cache} from "react";
import {apiBase} from "@/lib/apiBase";

// 006: sunucuda iç adres (API_INTERNAL_URL, çalışma anı), tarayıcıda genel adres — lib/apiBase.ts.
// Her çağrıda okunur (getter): sunucu ortam değişkeni modül yüklenirken dondurulmasın.
const BASE_URL = () => apiBase();

/*
*
* Next'in yerleşik fetch'i ile server-side veri çekme.
* ISR (Incremental Static Regeneration) için revalidate kullanıyoruz.
*
* Bu fetch, Server Component'larda otomatik server'da calisir. Network anahtarlari (cookie vs.),
* cache ve ISR ile uyumlu.
*
* revalidate: 300 -> ilk istek cache'lenir, 5 dk'da bir arka planda yenilenir (kullanici beklemez).
*
* 003 — ETİKETLER (`next.tags`): liste fetch'leri "providers", marka/kategori fetch'leri "brands" /
* "categories" etiketini taşır. Dükkan düzenlenince (ya da öneri onaylanınca) Server Action
* (app/actions/revalidateProvider.ts) bu etiketleri bayat işaretler -> süre dolmadan tazelenir.
* Süreler DEĞİŞMEDİ (etiket yalnız "erken tazeleme kolu"dur).
*
* */


/*
*
*   URLSearchParams nedir?
* Tarayici (ve Node) yerlesik Web API'si. URL'in query string kismini okumayi/olusuturmayi kulaylastirir.
*
* */
function toQuery(params: Record<string, string | number | boolean | undefined>) {
    const u = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== false && v !== null) u.set(k, String(v));
    });
    return u;
}

/*
*
*   Sayfa numarası dönüşümü — TEK YER.
* UI 1-based (kullanıcı "1. sayfa" görür), Spring Pageable 0-based bekler.
* page - 1 yapıp en az 0'a sıkıştırıyoruz: page 0/negatif gelse bile backend'e
* ASLA negatif sayfa gitmez. (Eskiden getProviderRatings `Math.max(0, page) - 1`
* yazıyordu: önce sıkıştırıp sonra 1 çıkardığı için page=0 -> -1 gidiyordu.)
* Sayfalar URL'i zaten params.ts parsePage ile temizliyor; bu ikinci emniyet kemeri.
*
* */
function toPage0(page: number | undefined): number {
    return Math.max(0, (page ?? 1) - 1);
}


/*
*
*   Promise nedir?
* Asenkron islemi temsil eden JS nesnesi. 3 hali vardir: pending -> fulfilled / rejeced. await veya .then() ile sonucunu kullanirsin.
*
* */
export async function getBrands(opts: {
    page?: number; size?: number; sort?: string; dir?: "asc" | "desc";
} = {}): Promise<Page<BrandDto>> {
    const page0 = toPage0(opts.page);
    const size = opts.size ?? 20;
    const sort = opts.sort ?? "name";
    const dir = opts.dir ?? "asc";

    const params = toQuery({page: page0, size});
    params.append("sort", `${sort},${dir}`);

    const url = `${BASE_URL()}/brands?${params.toString()}`;
    const res = await fetch(url, {next: {revalidate: 300, tags: ["brands", "providers"]}});
    if (!res.ok) {
        throw new Error(`GET /brands failed: ${res.status} ${res.statusText}`);
    }
    return normalizePage(await res.json() as SpringPage<BrandDto>);
}

// 002 (R6b): yalnız AD listesi isteyen çağrılar (ana sayfa, sohbet, filtreler) `withProviders=false`
// gönderir — her kategorinin tüm dükkan özetleri artık ~2.900 kayıtla yüzlerce KB tutuyor.
export async function getCategoriesAllSorted(): Promise<IdName[]> {
    const params = toQuery({page: 0, size: 200});
    params.append("sort", "name,asc");
    params.append("withProviders", "false");
    const url = `${BASE_URL()}/categories?${params.toString()}`;
    const res = await fetch(url, {next: {revalidate: 300, tags: ["categories"]}});
    if (!res.ok) {
        throw new Error(`GET /categories failed: ${res.status} ${res.statusText}`);
    }
    const page = normalizePage(await res.json() as SpringPage<CategoryDto>);
    return page.content.map(c => ({id: c.id, name: c.name}));
}

export async function getBrandsAllSorted(): Promise<IdName[]> {
    const params = toQuery({page: 0, size: 200});
    params.append("sort", "name,asc");
    params.append("withProviders", "false");
    const url = `${BASE_URL()}/brands?${params.toString()}`;
    const res = await fetch(url, {next: {revalidate: 300, tags: ["brands"]}});
    if (!res.ok) {
        throw new Error(`GET /brands failed: ${res.status} ${res.statusText}`);
    }
    const page = normalizePage(await res.json() as SpringPage<BrandDto>);
    return page.content.map(b => ({id: b.id, name: b.name}));
}

// Backend: /api/providers (categoryId, city, district, brandId, minScore, maxScore, q)
// Pageable ile "sort=field,dir" çoklu gönderilebilir.
// q (004): dükkan ADINDA kelime bazlı arama; çağıran yalnız parseSearch'ten geçmiş değeri verir.
export async function getProviders(opts: {
    page?: number; size?: number;
    brandId?: number; categoryId?: number;
    city?: string; district?: string;
    minScore?: number; maxScore?: number;
    q?: string;
    // Çoklu sıralama desteği
    sorts?: Array<{ field: string; dir: "asc" | "desc" }>;
} = {}): Promise<Page<ProviderListItem>> {
    const page0 = toPage0(opts.page);
    const size = opts.size ?? 20;

    const params = toQuery({
        page: page0,
        size,
        brandId: opts.brandId,
        categoryId: opts.categoryId,
        city: opts.city,
        district: opts.district,
        minScore: opts.minScore,
        maxScore: opts.maxScore,
        q: opts.q,
    });

    const sorts = opts.sorts?.length
        ? opts.sorts
        : [
            {field: "avgScore", dir: "desc" as const},
            {field: "ratingCount", dir: "desc" as const},
            {field: "id", dir: "asc" as const},
    ];

    for (const s of sorts) {
        params.append("sort", `${s.field},${s.dir}`);
    }

    const url = `${BASE_URL()}/providers?${params.toString()}`;
    // Önbellek (UI anayasası I):
    //  - Aramasız liste: ISR 60 sn + "providers" etiketi (düzenleme/onay Server Action'ları etiketi tazeler).
    //  - ARAMALI liste (004): `no-store`. Neden? Serbest metin SINIRSIZ önbellek anahtarı üretir (her farklı
    //    arama ayrı ISR kaydı) ve ad değişikliği aramaya hemen yansımalı (spec FR-010). Backend sorgusu
    //    ucuz (20 bin dükkanda ~5-15 ms). Anayasadaki "kullanıcıya/konuma özel sorgu" istisnasına BENZER
    //    gerekçe — plan.md Complexity Tracking.
    const res = await fetch(url, opts.q
        ? {cache: "no-store"}
        : {next: {revalidate: 60, tags: ["providers"]}}); // liste daha sık güncellensin
    if (!res.ok) {
        throw new Error(`GET /providers failed: ${res.status} ${res.statusText}`);
    }
    return normalizePage(await res.json() as SpringPage<ProviderListItem>);
}

/*
*
*   SAYIM ÖZETİ (005-seo-foundation) — açılış sayfalarının (/ankara/marka/honda...) var olup olmadığı,
* dizine açık olup olmadığı ve iç bağlantılar bu tek yanıttan hesaplanır (lib/seo/landing.ts).
*
*   Önbellek 3600 sn (+ "providers"/"brands"/"categories" etiketleri: dükkan düzenleme/onay Server
* Action'ları erken tazeler). UI anayasası I'deki 60–300 sn liste aralığının DIŞINDA — bilinçli
* (plan.md Complexity Tracking): sayılar saatlik değişir, açılış sayfasının 404 kararı için ≤1 saat
* gecikme kabul (spec Assumptions); sayfada GÖSTERİLEN sayı ise 60 sn'lik liste yanıtından gelir.
*   Site haritası da bunu kullanır; haritanın kendi verisi 86400 sn olsa da etkin pencere en kısa olan
* (3600) olur — zararsız.
*   Hata FIRLATILIR: açılış layout'u bunu 5xx'e çevirir (404 değil — geçici backend hatası sayfayı
* "yok" ilan etmemeli). Ana sayfa/listeler `.catch(() => null)` ile bölümü gizler.
*   cache(): layout + generateMetadata + sayfa aynı istekte tek çağrı (fetch önbelleğinin üstüne emniyet).
*
* */
export const getFacets = cache(async (): Promise<ProviderFacets> => {
    const res = await fetch(`${BASE_URL()}/providers/facets`, {
        next: {revalidate: 3600, tags: ["providers", "brands", "categories"]},
    });
    if (!res.ok) {
        throw new Error(`GET /providers/facets failed: ${res.status} ${res.statusText}`);
    }
    return res.json();
});

/*
*
*   SİTE HARİTASI dükkan listesi (005): sayfası açılan her gerçek dükkan + son değişiklik zamanı.
* 86400 sn (spec FR-001: harita en geç 24 saatte yenilenir; ~2,8 bin satır tek istekte).
*
* */
export async function getSitemapEntries(): Promise<SitemapEntry[]> {
    const res = await fetch(`${BASE_URL()}/providers/sitemap`, {
        next: {revalidate: 86400, tags: ["providers"]},
    });
    if (!res.ok) {
        throw new Error(`GET /providers/sitemap failed: ${res.status} ${res.statusText}`);
    }
    return res.json();
}

/*
*
*   Usta detayı — React cache() ile İSTEK İÇİ tekilleştirme.
* Aynı istekte üç yer bu veriyi ister: providers/[id]/layout.tsx (404 kontrolü),
* generateMetadata (sekme başlığı) ve sayfanın kendisi. fetch `no-store` olduğu için
* Next'in fetch önbelleği devrede değil; cache() sarmalayıcısı ise aynı server
* render'ı (tek HTTP isteği) boyunca aynı argümanla yapılan çağrıları TEK backend
* isteğine indirir ve sonucu (Promise'i) paylaştırır. İstekler arası önbellek DEĞİLDİR —
* her yeni sayfa isteği yine taze veri çeker.
*
*   404 -> null: "Bu usta yok" bir HATA değil, beklenen bir durum; çağıran taraf
* `null` görünce notFound() çağırır (gerçek 404 durum kodu). Diğer hatalar
* (500, ağ) fırlatılır ve error.tsx (RouteError) tarafından yakalanır.
*
* */
export const getProviderDetail = cache(async (id: number): Promise<ProviderDetailDto | null> => {
    const url = `${BASE_URL()}/providers/${id}`;
    const res = await fetch(url, {cache: "no-store"});
    if (res.status === 404) return null;
    if (!res.ok) {
        throw new Error(`GET /providers/${id} failed: ${res.status} ${res.statusText}`);
    }
    return res.json();
});

export async function getProviderRatings(opts: {
    id: number; //provider id
    page?: number; //1-based (UI), 0-based backend
    size?: number;
    sortField?: string;
    sortDir?: "asc" | "desc";
}): Promise<Page<RatingDto>> {
    const page0 = toPage0(opts.page);
    const size = opts.size ?? 10;
    const field = opts.sortField ?? "createdAt";
    const dir = opts.sortDir ?? "desc";

    const params = new URLSearchParams();
    params.set("page", String(page0));
    params.set("size", String(size));
    params.append("sort", `${field},${dir}`);

    const url = `${BASE_URL()}/providers/${opts.id}/ratings?` + params.toString();
    const res = await fetch(url, {cache: "no-store"});
    if (!res.ok) {
        throw new Error(`GET /providers/${opts.id}/ratings failed: ${res.status} ${res.statusText}`);
    }
    return normalizePage(await res.json() as SpringPage<RatingDto>);
}

export async function getProvidersNear(opts: {
    lat: number;
    lon: number;
    radiusKm?: number; // 1..100 (clampRadiusKm ile sıkıştırılır)
    page?: number;
    size?: number;
}): Promise<Page<NearItem>> {
    const page0 = toPage0(opts.page);
    const size = opts.size ?? 20;
    // Yarıçap kuralı tek yerde (params.ts): 1..100 km. Sayfa da aynı fonksiyonla
    // gösterdiği değeri hesaplar -> ekrandaki "Yarıçap" ile backend'e giden aynı olur.
    const radius = clampRadiusKm(opts.radiusKm ?? 10);
    const params = new URLSearchParams();
    params.set("lat", String(opts.lat));
    params.set("lon", String(opts.lon));
    params.set("radiusKm", String(radius));
    params.set("page", String(page0));
    params.set("size", String(size));
    // no-store: sorgu kullanıcının KONUMUNA özel. ISR (revalidate) her farklı lat/lon için
    // ayrı bir önbellek kaydı üretirdi (sınırsız büyür, neredeyse hiç tekrar kullanılmaz).
    // Bu yüzden anayasa I'deki "liste = ISR" kuralına bilinçli istisna (plan: Complexity Tracking).
    const res = await fetch(`${BASE_URL()}/providers/near?` + params.toString(), {cache: "no-store"});
    if (!res.ok) {
        throw new Error(`GET /providers/near failed: ${res.status} ${res.statusText}`);
    }
    return normalizePage(await res.json() as SpringPage<NearItem>);
}

export async function postRating(opts: {
    providerId: number;
    score: number;
    comment?: string;
    anonymousId?: string | null;
    recaptchaToken?: string | null;
    /** Üye kullanıcı JWT'si; verilirse backend userId'yi token'dan alır */
    token?: string | null;
}){
    const res = await fetch(`${BASE_URL()}/ratings/rate`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...(opts.token ? {Authorization: `Bearer ${opts.token}`} : {}),
        },
        //rate limit ve anlik guncellemeler yuzunden cache istemiyoruz
        cache: "no-store",
        body: JSON.stringify({
            providerId: opts.providerId,
            score: Math.trunc(opts.score),
            comment: opts.comment?.trim() || null,
            anonymousId: opts.anonymousId || null,
            recaptchaToken: opts.recaptchaToken || null
        }),
    });
    if (!res.ok) {
        // Backend'in standart ErrorResponse gövdesi ApiError'a çevrilir;
        // RateForm err.code'a bakarak kullanıcıya doğru mesajı gösterir.
        throw await toApiError(res);
    }
    /*
    * Backend'te XOR kuralı SecurityFacade ile düzenleniyor: login isen userId set edilir,
    * anonim isen anonymousId kalır. Bu yüzden client her zaman anonymousId gönderebilir.
    * 429 gelirse (rate limit) kullanıcıya "çok sık denedin" mesajı gösteririz.
    */
    return await res.json() as Promise<{id: number}>;
}
