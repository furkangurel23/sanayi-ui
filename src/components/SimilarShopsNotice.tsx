/*
 * "BU DÜKKAN ZATEN OLABİLİR" (003 / T105) — öneri formunda olası tekrar uyarısı.
 *
 * Backend (`/api/suggestions/similar`) önerilen konumun 75 m çevresinde adı benzeyen GERÇEK
 * dükkanları döner. Uyarı gönderimi ENGELLEMEZ (US1-AS3): kullanıcı bağlantıya bakıp aynı
 * dükkansa vazgeçer, değilse "Yine de gönder". Bağlantılar yeni sekmede açılır (form taslağı
 * kaybolmasın) — ekran okuyucu için ".sr-only (yeni sekmede açılır)".
 * `aria-live="polite"`: liste değişince (ad/konum değişti) ekran okuyucu sırası gelince okur.
 */
import Link from "next/link";
import type {SimilarProvider} from "@/lib/types";
import {Alert} from "@/components/icons";

export function distanceText(m: number): string {
    return m < 1000 ? `${Math.round(m)} m uzaklıkta` : `${(m / 1000).toFixed(1)} km uzaklıkta`;
}

export default function SimilarShopsNotice({items}: { items: SimilarProvider[] }) {
    return (
        <div aria-live="polite">
            {items.length > 0 && (
                <div className="alert alert-info stack-sm similar-notice">
                    <p className="similar-title"><Alert size="sm"/> Bu dükkan zaten olabilir</p>
                    <ul className="stack-sm similar-list">
                        {items.map(s => (
                            <li key={s.id}>
                                <Link href={`/providers/${s.id}`} target="_blank" rel="noopener" className="link-accent">
                                    {s.name}<span className="sr-only"> (yeni sekmede açılır)</span>
                                </Link>
                                <span className="caption muted">
                                    {" "}&middot; {[s.district, s.address].filter(Boolean).join(", ")}
                                    {(s.district || s.address) ? " · " : ""}{distanceText(s.distanceMeters)}
                                </span>
                            </li>
                        ))}
                    </ul>
                    <p className="caption">Aynı dükkansa öneri göndermenize gerek yok. Farklıysa &ldquo;Yine de gönder&rdquo; ile devam edin; yönetici kontrol eder.</p>
                </div>
            )}
        </div>
    );
}
