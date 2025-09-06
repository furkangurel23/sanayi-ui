import {BrandDto, Page} from "@/lib/types"

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api";

/*
*
* Next'in yerleşik fetch'i ile server-side veri çekme.
* ISR (Incremental Static Regeneration) için revalidate kullanıyoruz.
*
* Bu fetch, Server Component@larda otomatik server@da calisir. Network anahtarlari (cookie vs.),
* cache ve ISR ile uyumlu.
*
* revalidate: 300 -> ilk istek cache'lenir, 5 dk'da bir arka planda yenilenir (kullanici beklemez).
*
* */
//TODO URLSearchParams nedir? ne ise yarar?
function toQuery(params: Record<string, string | number | undefined>) {
    const u = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined) u.set(k, String(v));
    });
    return u.toString();
}

//TODO Promise nedir? ne ise yarar?
export async function getBrands(opts: {
    page?: number;
    size?: number;
    sort?: string;
    dir?: "asc" | "desc";
} = {}): Promise<Page<BrandDto>> {
    const page1 = Math.max(0, (opts.page ?? 1) - 1); // Spring 0-based ister
    const size1 = opts.size ?? 20;
    const sort1 = opts.sort ?? "name";
    const dir1 = opts.dir ?? "asc";

    const qs = toQuery({
        page: page1,
        size: size1,
        sort: `${sort1},${dir1}`
    });

    const url = `${BASE}/brands?${qs}`;
    console.log('url = ' + url);
    // next: { revalidate } = ISR (cache + arkaplanda yenile)
    const res = await fetch(url, {next: {revalidate: 300}}); // 5 dk
    if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`GET /brands failed: ${res.status} ${res.statusText} ${text}`);
    }
    return res.json()
}

