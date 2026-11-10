/*
 * YÜKLENİYOR İSKELETLERİ — rota loading.tsx dosyalarının ortak parçaları (D5, FR-009).
 * Server Component (yalnızca görüntü).
 *
 * Öğrenme notları:
 *  - loading.tsx, Next'in sayfayı saran <Suspense> sınırının "fallback"idir: sunucu veriyi
 *    beklerken bu iskelet ANINDA gösterilir, veri gelince gerçek sayfa yerine geçer.
 *  - İskeletler gerçek düzenin ölçülerine yakın tutulur -> içerik gelince sayfa zıplamaz
 *    (CLS düşük kalır). Ölçüler globals.css'te belirteçlerle (.skeleton-card vb.).
 *  - aria-hidden: iskelet bloklar ekran okuyucuya anlamsız kutular olarak okunmasın;
 *    yerine görünmez "Yükleniyor…" durumu (role="status") duyurulur.
 *  - Array.from({length: n}) -> n elemanlı dizi; map ile n adet blok üretir.
 */

/** Tek kart boyutunda iskelet (usta/marka kartı). */
export function SkeletonCard() {
    return <div className="skeleton skeleton-card" aria-hidden/>;
}

/** Başlık + (isteğe bağlı büyük blok) + kart ızgarası: liste sayfaları için. */
export function SkeletonList({count = 6, withBlock = true, columns = 2}: {
    count?: number;
    withBlock?: boolean;
    columns?: 2 | 3;
}) {
    return (
        <div className="skeleton-list">
            <span className="sr-only" role="status">Yükleniyor…</span>
            <div className="skeleton skeleton-title" aria-hidden/>
            {withBlock && <div className="skeleton skeleton-block" aria-hidden/>}
            <div className={columns === 3 ? "grid-3" : "grid-2"}>
                {Array.from({length: count}).map((_, i) => <SkeletonCard key={i}/>)}
            </div>
        </div>
    );
}

/** Detay sayfası: başlık kartı + harita/istatistik bloğu + yorum kartları. */
export function SkeletonDetail() {
    return (
        <div className="skeleton-detail">
            <span className="sr-only" role="status">Yükleniyor…</span>
            <div className="skeleton skeleton-block" aria-hidden/>
            <div className="skeleton skeleton-map" aria-hidden/>
            <div className="stack">
                {Array.from({length: 3}).map((_, i) => <SkeletonCard key={i}/>)}
            </div>
        </div>
    );
}
