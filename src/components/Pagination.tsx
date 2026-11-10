"use client";

/*
 * SAYFALAMA — URL tabanlı state deseni (useSearchParams'SIZ, Next 16 için en temiz yol).
 *
 * Sayfa numarası React state'inde DEĞİL, URL query'sinde (?page=2) tutulur. Neden?
 *  - Paylaşılabilir/yer imlenebilir link (URL = tek doğruluk kaynağı).
 *  - Geri/ileri tarayıcı tuşları bedavaya çalışır.
 *  - Server Component sayfa, URL'deki parametreyle veriyi yeniden çeker.
 *
 * NEDEN useSearchParams KULLANMIYORUZ? (öğrenme notu)
 *  Next 16'da useSearchParams kullanan client bileşeni <Suspense> sınırı ister;
 *  sarılmazsa sayfanın TÜM hydration'ı sessizce takılır. Oysa bizim ihtiyacımız
 *  "render sırasında" params okumak değil, yalnızca TIKLAMA ANINDA mevcut query'yi
 *  korumak. Event handler zaten sadece tarayıcıda çalışır -> window.location.search
 *  oradan güvenle okunur. Hook yok = Suspense zorunluluğu yok = daha basit bileşen.
 */

import {useRouter} from "next/navigation";

export default function Pagination({page, totalPages}: { page: number; totalPages: number }) {
    const router = useRouter();
    const total = totalPages || 1;
    if (total <= 1) return null; // tek sayfa varsa hiç çizme (gereksiz UI kalabalığı olmasın)

    const go = (p: number) => {
        // Tıklama ANINDA oku: diğer filtre parametreleri (brandId, sort...) korunur,
        // sadece page değişir. render-time hook'a gerek kalmaz.
        const params = new URLSearchParams(window.location.search);
        params.set("page", String(p));
        router.push(`?${params.toString()}`);
    };

    return (
        <nav className="row" style={{justifyContent: "center"}} aria-label="Sayfalama">
            <button className="btn btn-outline btn-sm" onClick={() => go(Math.max(1, page - 1))}
                    disabled={page <= 1} aria-label="Önceki sayfa">
                ← Önceki
            </button>
            <span className="text-sm muted">Sayfa {page} / {total}</span>
            <button className="btn btn-outline btn-sm" onClick={() => go(Math.min(total, page + 1))}
                    disabled={page >= total} aria-label="Sonraki sayfa">
                Sonraki →
            </button>
        </nav>
    );
}
