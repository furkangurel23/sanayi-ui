import {
    BrandDto,
    CategoryDto,
    IdName,
    NearItem,
    Page,
    ProviderDetailDto,
    ProviderListItem,
    RatingDto
} from "@/lib/types";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api";

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
*   Promise nedir?
* Asenkron islemi temsil eden JS nesnesi. 3 hali vardir: pending -> fulfilled / rejeced. await veya .then() ile sonucunu kullanirsin.
*
* */
export async function getBrands(opts: {
    page?: number; size?: number; sort?: string; dir?: "asc" | "desc";
} = {}): Promise<Page<BrandDto>> {
    const page0 = Math.max(0, (opts.page ?? 1) - 1);
    const size = opts.size ?? 20;
    const sort = opts.sort ?? "name";
    const dir = opts.dir ?? "asc";

    const params = toQuery({page: page0, size});
    params.append("sort", `${sort},${dir}`);

    const url = `${BASE}/brands?${params.toString()}`;
    const res = await fetch(url, {next: {revalidate: 300}});
    if (!res.ok) throw new Error(`GET /brands failed: ${res.status} ${res.statusText}`);
    return res.json();
}

export async function getCategoriesAllSorted(): Promise<IdName[]> {
    const params = toQuery({page: 0, size: 200});
    params.append("sort", "name,asc");
    const url = `${BASE}/categories?${params.toString()}`;
    const res = await fetch(url, {next: {revalidate: 300}});
    if (!res.ok) throw new Error(`GET /categories failed: ${res.status} ${res.statusText}`);
    const page: Page<CategoryDto> = await res.json();
    return page.content.map(c => ({id: c.id, name: c.name}));
}

export async function getBrandsAllSorted(): Promise<IdName[]> {
    const params = toQuery({page: 0, size: 200});
    params.append("sort", "name,asc");
    const url = `${BASE}/brands?${params.toString()}`;
    const res = await fetch(url, {next: {revalidate: 300}});
    if (!res.ok) throw new Error(`GET /brands failed: ${res.status} ${res.statusText}`);
    const page: Page<BrandDto> = await res.json();
    return page.content.map(b => ({id: b.id, name: b.name}));
}

// Backend: /api/providers (categoryId, city, district, brandId, minScore, maxScore)
// Pageable ile "sort=field,dir" çoklu gönderilebilir.
export async function getProviders(opts: {
    page?: number; size?: number;
    brandId?: number; categoryId?: number;
    city?: string; district?: string;
    minScore?: number; maxScore?: number;
    // Çoklu sıralama desteği
    sorts?: Array<{ field: string; dir: "asc" | "desc" }>;
} = {}): Promise<Page<ProviderListItem>> {
    const page0 = Math.max(0, (opts.page ?? 1) - 1);
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

    const url = `${BASE}/providers?${params.toString()}`;
    const res = await fetch(url, {next: {revalidate: 60}}); // liste daha sık güncellensin
    if (!res.ok) throw new Error(`GET /providers failed: ${res.status} ${res.statusText}`);
    return res.json();
}

export async function getProviderDetail(id: number): Promise<ProviderDetailDto> {
    const url = `${BASE}/providers/${id}`;
    const res = await fetch(url, {next: {revalidate: 300}});
    if (!res.ok) throw new Error(`GET /providers/${id} failed: ${res.status} ${res.statusText}`);
    return res.json();
}

export async function getProviderRatings(opts: {
    id: number; //provider id
    page?: number; //1-based (UI), 0-based backend
    size?: number;
    sortField?: string;
    sortDir?: "asc" | "desc";
}): Promise<Page<RatingDto>> {
    const page0 = Math.max(0, opts.page ?? 1) - 1;
    const size = opts.size ?? 10;
    const field = opts.sortField ?? "createdAt";
    const dir = opts.sortDir ?? "desc";

    const params = new URLSearchParams();
    params.set("page", String(page0));
    params.set("size", String(size));
    params.append("sort", `${field},${dir}`);

    const url = `${BASE}/providers/${opts.id}/ratings?` + params.toString();
    /*
    * Yorum listesi daha dinamiktir -> daha kisa revalidate ya da tamamen no-store dusunebilirdik.
    * Burada 60s seciyoruz: hizli guncelleme + cache avantaji.
    * */
    const res = await fetch(url, {next: {revalidate: 60}});
    if (!res.ok) throw new Error(`GET /providers/${opts.id}/ratings failed: ${res.status} ${res.statusText}`);
    return res.json();
}

export async function getProvidersNear(opts: {
    lat: number;
    lon: number;
    radiusKm?: number; // 0..100
    page?: number;
    size?: number;
}): Promise<Page<NearItem>> {
    const page0 = Math.max(0, opts.page ?? 1);
    const size = opts.size ?? 20;
    const radius = Math.max(100, Math.max(0, opts.radiusKm ?? 10));
    const params = new URLSearchParams();
    params.set("lat", String(opts.lat));
    params.set("lon", String(opts.lon));
    params.set("radiusKm", String(radius));
    params.set("page", String(page0));
    params.set("size", String(size));
    const res = await fetch(`${BASE}/providers/near?` + params.toString(), {next: {revalidate: 30}});
    console.log(`${BASE}/providers/near?` + params.toString());
    console.log(res);
    if (!res.ok) throw new Error(`GET /providers/near failed: ${res.status} ${res.statusText}`);
    return res.json();
}