"use client";

/*
 * ÇALIŞMA SAATİ EDİTÖRÜ (003 / T094) — kontrollü bileşen: değer ve değişiklik ÇAĞIRANDA
 * (ProviderEditForm). `value === null` "bilgi yok" demektir.
 *
 * Kurallar (research R18):
 *  - Değer null iken yalnız "Çalışma saatlerini belirt" onay kutusu görünür. Kutu işaretsiz
 *    kaldıkça değer null kalır ve form onu DEĞİŞMEDEN gönderir.
 *  - Kutu işaretlenince BOŞ taslak açılır (her gün tek boş aralık): kullanıcı doldurur ya da
 *    günü Kapalı yapar. "null" hiçbir zaman sessizce "tüm günler kapalı"ya çevrilmez.
 *  - Değer doluyken "Saat bilgisini kaldır" -> açıkça null (son taslak bellekte tutulur, kutu
 *    yeniden işaretlenirse geri gelir).
 *  - Gün başına <fieldset><legend>: Açık/Kapalı, 1–2 aralık (`type="time" step=300` = 5 dk),
 *    aralık başına "Gece yarısına kadar" (kapanış "24:00" — time girdisi 24:00 gösteremez),
 *    gün başına "24 saat" kısayolu; üstte "Pazartesiyi hafta içine kopyala".
 *  - Hatalar SATIRIN altında; anahtarlar backend fieldErrors yollarıyla aynı
 *    (`openingHours.MONDAY[0]`, `openingHours.MONDAY`, `openingHours`).
 *  - 375 px'te aralık alanları alt alta (CSS `.hours-range`).
 */
import {useId, useRef} from "react";
import {DAY_LABELS, DAYS, emptyHoursDraft, MIDNIGHT_END, type Day, type Hours, type Range} from "@/lib/openingHours";

type Props = {
    value: Hours | null;
    onChange: (v: Hours | null) => void;
    errors?: Record<string, string>;
};

const WEEKDAYS: Day[] = ["TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"];

export default function OpeningHoursEditor({value, onChange, errors = {}}: Props) {
    const id = useId();
    // Kaldırılan son taslak — kutu tekrar işaretlenince geri yüklenir (render'ı etkilemez -> ref).
    const lastDraft = useRef<Hours | null>(null);
    const topError = errors["openingHours"];

    if (value === null) {
        return (
            <div className="stack-sm">
                <label className="checkbox">
                    <input type="checkbox" checked={false}
                           onChange={() => onChange(lastDraft.current ?? emptyHoursDraft())}/>
                    <span>Çalışma saatlerini belirt</span>
                </label>
                <p className="field-hint">İşaretlemezseniz dükkan sayfasında &ldquo;Çalışma saati bilgisi yok&rdquo; yazar.</p>
                {topError && <span className="field-error">{topError}</span>}
            </div>
        );
    }

    const setDay = (d: Day, ranges: Range[]) => onChange({...value, [d]: ranges});
    const setRange = (d: Day, i: number, patch: Partial<Range>) =>
        setDay(d, value[d].map((r, j) => (j === i ? {...r, ...patch} : r)));

    return (
        <div className="stack">
            <div className="hours-toolbar">
                <button type="button" className="btn btn-outline btn-sm"
                        onClick={() => onChange({...value, ...Object.fromEntries(WEEKDAYS.map(d => [d, value.MONDAY.map(r => ({...r}))]))})}>
                    Pazartesiyi hafta içine kopyala
                </button>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => {
                    lastDraft.current = value;
                    onChange(null);
                }}>
                    Saat bilgisini kaldır
                </button>
            </div>
            {topError && <span className="field-error">{topError}</span>}

            {DAYS.map(d => {
                const ranges = value[d] ?? [];
                const open = ranges.length > 0;
                const dayErr = errors[`openingHours.${d}`];
                return (
                    <fieldset key={d} className="hours-day">
                        <legend className="hours-day-name">{DAY_LABELS[d]}</legend>
                        <div className="hours-day-controls">
                            <label className="checkbox">
                                <input type="checkbox" checked={open}
                                       onChange={e => setDay(d, e.target.checked ? [{open: "", close: ""}] : [])}/>
                                <span>Açık</span>
                            </label>
                            {/* Etiket SABİT ("Açık" onay kutusu); durum ayrıca metinle görünür */}
                            {!open && <span className="caption muted">Kapalı</span>}
                            <button type="button" className="btn btn-ghost btn-sm"
                                    aria-label={`${DAY_LABELS[d]}: 24 saat açık`}
                                    onClick={() => setDay(d, [{open: "00:00", close: MIDNIGHT_END}])}>
                                24 saat
                            </button>
                        </div>

                        {ranges.map((r, i) => {
                            const errKey = `openingHours.${d}[${i}]`;
                            const err = errors[errKey];
                            const errId = `${id}-${d}-${i}-err`;
                            const midnight = r.close === MIDNIGHT_END;
                            const labelSuffix = ranges.length > 1 ? ` (${i + 1}. aralık)` : "";
                            return (
                                <div key={i} className="hours-range-block">
                                    <div className="hours-range">
                                        <label className="field">
                                            <span className="field-label">Açılış{labelSuffix}</span>
                                            <input className="input" type="time" step={300} value={r.open}
                                                   aria-invalid={err ? true : undefined}
                                                   aria-describedby={err ? errId : undefined}
                                                   onChange={e => setRange(d, i, {open: e.target.value})}/>
                                        </label>
                                        <label className="field">
                                            <span className="field-label">Kapanış{labelSuffix}</span>
                                            {midnight ? (
                                                <span className="input hours-midnight">24:00</span>
                                            ) : (
                                                <input className="input" type="time" step={300} value={r.close}
                                                       aria-invalid={err ? true : undefined}
                                                       aria-describedby={err ? errId : undefined}
                                                       onChange={e => setRange(d, i, {close: e.target.value})}/>
                                            )}
                                        </label>
                                        <label className="checkbox hours-midnight-toggle">
                                            <input type="checkbox" checked={midnight}
                                                   onChange={e => setRange(d, i, {close: e.target.checked ? MIDNIGHT_END : ""})}/>
                                            <span>Gece yarısına kadar</span>
                                        </label>
                                        {ranges.length > 1 && (
                                            <button type="button" className="btn btn-ghost btn-sm"
                                                    onClick={() => setDay(d, ranges.filter((_, j) => j !== i))}>
                                                Aralığı kaldır<span className="sr-only">: {DAY_LABELS[d]} {i + 1}. aralık</span>
                                            </button>
                                        )}
                                    </div>
                                    {err && <span id={errId} className="field-error">{err}</span>}
                                </div>
                            );
                        })}

                        {open && ranges.length < 2 && (
                            <button type="button" className="btn btn-ghost btn-sm hours-add"
                                    onClick={() => setDay(d, [...ranges, {open: "", close: ""}])}>
                                İkinci aralık ekle<span className="sr-only">: {DAY_LABELS[d]}</span>
                            </button>
                        )}
                        {dayErr && <span className="field-error">{dayErr}</span>}
                    </fieldset>
                );
            })}
            <p className="field-hint">
                Kapanış açılıştan önceyse (ör. 20:00–02:00) aralık ertesi güne taşar ve başladığı güne sayılır.
            </p>
        </div>
    );
}
