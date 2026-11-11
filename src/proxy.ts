/*
 * AÇILIŞ SAYFASI ADRES KANONİKLEŞTİRME — 005-seo-foundation (spec FR-008). Next 16'da "middleware"in
 * yeni adı `proxy`: istek sayfaya ulaşmadan ÖNCE çalışır.
 *
 * `/ankara/marka/HONDA`, `/ankara/ilce/%C3%87ankaya` (Çankaya), `/ankara/kategori/Oto%20Elektrik` gibi
 * yazımlar kanonik adrese (`/ankara/marka/honda`, `/ankara/ilce/cankaya`, …) KALICI (308) yönlendirilir:
 * arama motoru tek adres görür, sıralama sinyali bölünmez. Kural `slugify` (lib/seo/slug.ts) — bağlantı
 * üretimiyle AYNI fonksiyon; eşgüçlü olduğu için kanonik adres asla tekrar yönlendirilmez (döngü yok).
 *
 *  - Segment HAM (yüzde-kodlu) hâliyle alınır, güvenli çözülür (bozuk kodlama -> olduğu gibi), katlanır;
 *    sonuç ham segmentten farklıysa yönlendirilir. Sorgu dizesi korunur.
 *  - Katlanınca BOŞ kalan segment (`-`, `%20`) yönlendirilmez: sayfa zaten bulunamaz -> doğal 404.
 *  - Sondaki "/" Next'in kendi 308'iyle düşer (trailingSlash varsayılanı); ara segmentlerin
 *    (`/ankara`, `/ankara/marka` …) sayfası yok -> 404.
 *
 * NEDEN layout'ta değil? Yönlendirme sayfa işlenmeden önce, tek yerde ve tüm segmentler için yapılmalı;
 * layout'ta `redirect()` her dinamik segment için ayrı ayrı yazılır ve akış başladıktan sonra 308 veremez.
 */
import {NextResponse, type NextRequest} from "next/server";
import {slugify} from "@/lib/seo/slug";

function safeDecode(segment: string): string {
    try {
        return decodeURIComponent(segment);
    } catch {
        return segment;
    }
}

export function proxy(request: NextRequest) {
    const {pathname} = request.nextUrl;
    // Matcher büyük/küçük harfe duyarlı olduğu için geniş tutulur; "/Ankara/…", "/ANKARA/…" da yakalansın
    // diye ilk segment burada harf duyarsız denetlenir. Diğer tüm yollar dokunulmadan geçer.
    if (!/^\/ankara(\/|$)/i.test(pathname)) return NextResponse.next();
    const segments = pathname.split("/"); // ["", "ankara", "marka", "HONDA"]
    let changed = false;
    // 0: boş (baştaki "/"), 1: "ankara", 2: tür, 3+: ad/ilçe — hepsi katlanır (tür de: /ankara/MARKA/...).
    const next = segments.map((raw, i) => {
        if (i === 0 || raw === "") return raw;
        const slug = slugify(safeDecode(raw));
        if (slug === "") return raw;          // katlanınca boş: dokunma, 404 olsun
        if (slug !== raw) changed = true;
        return slug;
    });
    if (!changed) return NextResponse.next();
    const url = request.nextUrl.clone();
    url.pathname = next.join("/");
    return NextResponse.redirect(url, 308);
}

// Statik dosyalar (_next, uzantılı yollar) ve API hariç tüm sayfa istekleri; asıl süzme fonksiyonun başında.
export const config = {matcher: ["/((?!_next/|api/|.*\\.[A-Za-z0-9]+$).*)"]};
