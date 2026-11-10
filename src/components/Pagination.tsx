"use client";

/*
 * SAYFALAMA — ortak GÖRSEL bileşen, iki kullanım modu (research D5, FR-009).
 *
 *  1) mode="url" (VARSAYILAN — genel sayfalar: ustalar, detay yorumları, yakınımdakiler,
 *     markalar). URL tabanlı state deseni (useSearchParams'SIZ, Next 16 için en temiz yol):
 *     sayfa numarası React state'inde DEĞİL, URL query'sinde (?page=2) tutulur. Neden?
 *      - Paylaşılabilir/yer imlenebilir link (URL = tek doğruluk kaynağı).
 *      - Geri/ileri tarayıcı tuşları bedavaya çalışır.
 *      - Server Component sayfa, URL'deki parametreyle veriyi yeniden çeker.
 *     Mevcut çağıranlar `<Pagination page totalPages/>` DEĞİŞMEDEN derlenir (anayasa II).
 *
 *  2) mode="callback" (admin ekranları): sayfa numarası çağıranın YEREL state'inde;
 *     bileşen yalnızca onPage(n) çağırır, URL'e DOKUNMAZ (admin URL'leri değişmez).
 *
 * NEDEN useSearchParams KULLANMIYORUZ? (öğrenme notu)
 *  Next 16'da useSearchParams kullanan client bileşeni <Suspense> sınırı ister;
 *  sarılmazsa sayfanın TÜM hydration'ı sessizce takılır. Oysa bizim ihtiyacımız
 *  "render sırasında" params okumak değil, yalnızca TIKLAMA ANINDA mevcut query'yi
 *  korumak. Event handler zaten sadece tarayıcıda çalışır -> window.location.search
 *  oradan güvenle okunur. Hook yok = Suspense zorunluluğu yok = daha basit bileşen.
 *
 * Görünüm (002):
 *  - Dar ekranda: [‹ Önceki] 2 / 9 [Sonraki ›]; ≥ 640 px'te numaralı sayfalar
 *    (1 … 4 5 6 … 20). Seçili sayfa (D10): zemin + kenar + kalınlık + aria-current="page".
 *  - Oklar metin karakteri değil, ikon (ChevronLeft/Right — FR-006).
 *
 * TypeScript notu — "ayrık birleşim" (discriminated union): Props iki şekilden biridir;
 * `mode` alanına bakınca TS hangisi olduğunu bilir ve onPage'in varlığını garanti eder.
 */

import {useRouter} from "next/navigation";
import {ChevronLeft, ChevronRight} from "@/components/icons";

type UrlProps = { mode?: "url"; page: number; totalPages: number };
type CallbackProps = { mode: "callback"; page: number; totalPages: number; onPage: (n: number) => void };
type Props = UrlProps | CallbackProps;

/** Gösterilecek sayfa numaraları: 7'den azsa hepsi; değilse 1, …, p-1, p, p+1, …, son. */
function pageWindow(page: number, total: number): Array<number | "gap"> {
    if (total <= 7) return Array.from({length: total}, (_, i) => i + 1);
    const out: Array<number | "gap"> = [1];
    const start = Math.max(2, page - 1);
    const end = Math.min(total - 1, page + 1);
    if (start > 2) out.push("gap");
    for (let n = start; n <= end; n++) out.push(n);
    if (end < total - 1) out.push("gap");
    out.push(total);
    return out;
}

export default function Pagination(props: Props) {
    const router = useRouter();
    const {page} = props;
    const total = props.totalPages || 1;
    if (total <= 1) return null; // tek sayfa varsa hiç çizme (gereksiz UI kalabalığı olmasın)

    const go = (p: number) => {
        if (p === page) return;
        if (props.mode === "callback") {
            props.onPage(p); // yerel state — URL değişmez
            return;
        }
        // Tıklama ANINDA oku: diğer filtre parametreleri (brandId, sort...) korunur,
        // sadece page değişir. render-time hook'a gerek kalmaz.
        const params = new URLSearchParams(window.location.search);
        params.set("page", String(p));
        router.push(`?${params.toString()}`);
    };

    return (
        <nav className="pagination" aria-label="Sayfalama">
            <button type="button" className="btn btn-outline btn-sm" onClick={() => go(Math.max(1, page - 1))}
                    disabled={page <= 1} aria-label="Önceki sayfa">
                <ChevronLeft size="sm"/> Önceki
            </button>

            {/* Dar ekran özeti (CSS ≥ 640 px'te gizler) */}
            <span className="pagination-status">Sayfa {page} / {total}</span>

            {/* Numaralı sayfalar (CSS < 640 px'te gizler) */}
            <div className="pagination-pages">
                {pageWindow(page, total).map((n, i) =>
                    n === "gap" ? (
                        <span key={`gap-${i}`} className="pagination-gap" aria-hidden>…</span>
                    ) : (
                        <button
                            key={n}
                            type="button"
                            className="pagination-page"
                            aria-current={n === page ? "page" : undefined}
                            aria-label={`Sayfa ${n}`}
                            onClick={() => go(n)}
                        >
                            {n}
                        </button>
                    )
                )}
            </div>

            <button type="button" className="btn btn-outline btn-sm" onClick={() => go(Math.min(total, page + 1))}
                    disabled={page >= total} aria-label="Sonraki sayfa">
                Sonraki <ChevronRight size="sm"/>
            </button>
        </nav>
    );
}
