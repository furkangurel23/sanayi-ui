/*
 * ÇALIŞMA SAATLERİ GÖRÜNÜMÜ (003 / T095) — Server Component (hook yok, olay yok).
 *
 * - Bilgi yoksa (null) "Çalışma saati bilgisi yok" — "kapalı" DENMEZ.
 * - 7 gün tanım listesi (<dl>): "Kapalı", "24 saat açık", "20:00–02:00 (ertesi gün)".
 * - Bugün (Europe/Istanbul) satırı vurgulanır: kalın + "Bugün" etiketi (yalnız renk değil).
 * - "Şu an açık/kapalı" küçük client adacığında (OpenNowStatus); ilk değeri BURADA, sunucuda
 *   hesaplanıp prop olarak iner (hidrasyon uyumlu).
 */
import {DAY_LABELS, DAYS, formatDay, isOpenAt, istanbulDayMinute, type Hours} from "@/lib/openingHours";
import OpenNowStatus from "@/components/OpenNowStatus";

export default function OpeningHoursView({hours}: { hours: Hours | null | undefined }) {
    if (!hours) {
        return <p className="muted">Çalışma saati bilgisi yok.</p>;
    }
    const now = new Date();
    const today = istanbulDayMinute(now).day;
    return (
        <div className="stack-sm">
            <OpenNowStatus hours={hours} initial={isOpenAt(hours, now)}/>
            <dl className="hours-list">
                {DAYS.map(d => (
                    <div key={d} className="hours-row" data-today={d === today}>
                        <dt>
                            {DAY_LABELS[d]}
                            {d === today && <span className="sr-only"> (bugün)</span>}
                            {d === today && <span className="chip hours-today" aria-hidden>Bugün</span>}
                        </dt>
                        <dd>{formatDay(hours[d])}</dd>
                    </div>
                ))}
            </dl>
        </div>
    );
}
