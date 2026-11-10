/*
 * ÇALIŞMA SAATLERİ — saf yardımcılar (003 / T089, research R2 + R18). Bağımlılıksız: hem
 * sunucu (detay sayfası ilk değeri) hem tarayıcı (OpenNowStatus dakikalık yenileme) hem de
 * `node --test` aynı kodu çalıştırır. Bu yüzden `@/…` importu YOK (test .ts'i doğrudan yükler).
 *
 * Veri modeli (backend WeeklyHours ile aynı):
 *  - `null` = "çalışma saati bilgisi yok"; 7 anahtarlı nesne = bilgi var. Boş liste = o gün Kapalı.
 *    Bu ikisi ASLA birbirine dönüşmez (bilgi yok != her gün kapalı).
 *  - Aralık {open, close} "HH:mm"; kapanış "24:00" olabilir (= gece yarısına kadar).
 *  - kapanış <= açılış (ve "24:00" değil) = GECE aralığı; BAŞLADIĞI güne aittir:
 *    Cuma 20:00–02:00 -> Cumartesi 01:00'de dükkan "açık".
 *  - 00:00–24:00 = 24 saat açık.
 *
 * "Şu an açık mı?" — SAAT DİLİMİ TUZAĞI (öğrenme notu):
 *  `date.getDay()` / `getHours()` CİHAZIN saat dilimini kullanır. New York'taki bir
 *  ziyaretçi için Ankara'daki dükkanın durumu yanlış çıkardı. Bunun yerine
 *  `Intl.DateTimeFormat` ile anı DOĞRUDAN "Europe/Istanbul" diliminde parçalarına ayırıyoruz
 *  (`formatToParts` -> [{type:"weekday"}, {type:"hour"}, …]). `hourCycle: "h23"` saati 0–23
 *  verir (bazı yerel ayarlar "24" ya da "12 ÖS" üretebilir). Cihaz saat diliminden ve 12/24
 *  saat tercihinden bağımsızdır — test `TZ=America/New_York` ile bunu kanıtlar.
 */

/** Gün anahtarları — backend sırası (Pazartesi ilk). types.ts DayKey ile aynı değerler. */
export const DAYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"] as const;
export type Day = (typeof DAYS)[number];

export type Range = { open: string; close: string };
export type Hours = Record<Day, Range[]>;

export const DAY_LABELS: Record<Day, string> = {
    MONDAY: "Pazartesi",
    TUESDAY: "Salı",
    WEDNESDAY: "Çarşamba",
    THURSDAY: "Perşembe",
    FRIDAY: "Cuma",
    SATURDAY: "Cumartesi",
    SUNDAY: "Pazar",
};

export const MIDNIGHT_END = "24:00";
const HHMM = /^([01][0-9]|2[0-3]):([0-5][0-9])$/;

/** "08:30" -> 510 dakika; "24:00" -> 1440 (yalnız kapanışta anlamlı); biçim dışı -> null. */
export function toMinutes(hhmm: string): number | null {
    if (hhmm === MIDNIGHT_END) return 1440;
    const m = HHMM.exec(hhmm);
    return m ? Number(m[1]) * 60 + Number(m[2]) : null;
}

/** Gece yarısını geçen aralık mı? (kapanış <= açılış ve kapanış "24:00" değil) */
export function isOvernight(r: Range): boolean {
    const o = toMinutes(r.open);
    const c = toMinutes(r.close);
    return o !== null && c !== null && r.close !== MIDNIGHT_END && c <= o;
}

/*
 * Europe/Istanbul gün + dakika. Biçimleyici modül düzeyinde TEK kez kurulur (her çağrıda
 * yeniden kurmak pahalıdır). Haftanın günü METNİNİ ("Pazartesi") koda çevirmek için tablo,
 * bilinen tarihler aynı biçimleyiciyle biçimlenerek ÜRETİLİR: ICU sürümü gün adını farklı
 * yazsa bile (ör. kısaltma) tablo ile biçimleyici hep uyumlu kalır.
 */
const FORMATTER = new Intl.DateTimeFormat("tr-TR", {
    timeZone: "Europe/Istanbul",
    hourCycle: "h23",
    weekday: "long",
    hour: "2-digit",
    minute: "2-digit",
});

const WEEKDAY_TO_DAY: Map<string, Day> = (() => {
    const map = new Map<string, Day>();
    // 2024-01-01 Pazartesi; UTC 09:00 = İstanbul 12:00 (gün kayması olmaz).
    DAYS.forEach((d, i) => {
        const parts = FORMATTER.formatToParts(new Date(Date.UTC(2024, 0, 1 + i, 9, 0)));
        const wd = parts.find(p => p.type === "weekday")?.value;
        if (wd) map.set(wd, d);
    });
    return map;
})();

/** Verilen anın İstanbul'daki günü ve gece yarısından bu yana dakikası. */
export function istanbulDayMinute(date: Date): { day: Day; minute: number } {
    const parts = FORMATTER.formatToParts(date);
    const get = (t: string) => parts.find(p => p.type === t)?.value ?? "";
    const day = WEEKDAY_TO_DAY.get(get("weekday")) ?? "MONDAY";
    return {day, minute: Number(get("hour")) * 60 + Number(get("minute"))};
}

function prevDay(d: Day): Day {
    return DAYS[(DAYS.indexOf(d) + 6) % 7];
}

/**
 * Dükkan verilen anda açık mı? Bilgi yoksa `null` (UI "bilgi yok" der — "kapalı" DEMEZ).
 *  1) Bugünün aralıkları: normal aralıkta open <= dk < close; gece aralığında dk >= open.
 *  2) DÜNÜN gece aralıkları: dk < close (Cuma 20:00–02:00 -> Cumartesi 01:00 açık).
 */
export function isOpenAt(hours: Hours | null | undefined, date: Date): boolean | null {
    if (!hours) return null;
    const {day, minute} = istanbulDayMinute(date);
    for (const r of hours[day] ?? []) {
        const o = toMinutes(r.open);
        const c = toMinutes(r.close);
        if (o === null || c === null) continue;
        if (isOvernight(r) ? minute >= o : minute >= o && minute < c) return true;
    }
    for (const r of hours[prevDay(day)] ?? []) {
        const c = toMinutes(r.close);
        if (c !== null && isOvernight(r) && minute < c) return true;
    }
    return false;
}

/** Tek aralığın okunur metni: "08:30–18:00", "20:00–02:00 (ertesi gün)", "24 saat açık". */
export function formatRange(r: Range): string {
    if (r.open === "00:00" && r.close === MIDNIGHT_END) return "24 saat açık";
    return `${r.open}–${r.close}${isOvernight(r) ? " (ertesi gün)" : ""}`;
}

/** Bir günün metni: aralık yoksa "Kapalı", varsa virgülle ayrılmış aralıklar. */
export function formatDay(ranges: Range[] | undefined): string {
    if (!ranges || ranges.length === 0) return "Kapalı";
    return ranges.map(formatRange).join(", ");
}

/** Yeni, BOŞ saat taslağı (editörde "Çalışma saatlerini belirt" açılınca): her gün tek boş
 *  aralık — kullanıcı doldurur ya da günü Kapalı yapar. Bilerek "her gün kapalı" DEĞİL
 *  (null'ın sessizce tümü-Kapalı'ya dönmemesi kuralı). */
export function emptyHoursDraft(): Hours {
    return Object.fromEntries(DAYS.map(d => [d, [{open: "", close: ""}]])) as Hours;
}

/**
 * İstemci ön doğrulaması (backend WeeklyHours kurallarının özeti; asıl karar backend'in).
 * Anahtarlar backend fieldErrors yollarıyla AYNI: `openingHours.MONDAY[0]`, `openingHours.MONDAY`.
 */
export function validateHours(hours: Hours | null): Record<string, string> {
    const errors: Record<string, string> = {};
    if (!hours) return errors;
    for (const d of DAYS) {
        const ranges = hours[d] ?? [];
        if (ranges.length > 2) errors[`openingHours.${d}`] = "Bir günde en fazla 2 aralık olabilir.";
        ranges.forEach((r, i) => {
            const path = `openingHours.${d}[${i}]`;
            const o = r.open === MIDNIGHT_END ? null : toMinutes(r.open);
            const c = toMinutes(r.close);
            if (!r.open || !r.close) errors[path] = "Açılış ve kapanış saatini girin ya da günü Kapalı yapın.";
            else if (o === null || c === null) errors[path] = "Saat SS:DD biçiminde olmalı.";
            else if (r.open === r.close) errors[path] = "Açılış ve kapanış aynı olamaz.";
        });
        // Aynı gün çakışma: gece aralığı o gün için [open, 24:00) sayılır (backend ile aynı).
        if (ranges.length === 2 && !errors[`openingHours.${d}[0]`] && !errors[`openingHours.${d}[1]`]) {
            const span = (r: Range): [number, number] => {
                const o = toMinutes(r.open)!;
                return [o, isOvernight(r) ? 1440 : toMinutes(r.close)!];
            };
            const [a, b] = [span(ranges[0]), span(ranges[1])];
            if (a[0] < b[1] && b[0] < a[1]) errors[`openingHours.${d}[1]`] = "Aralıklar çakışıyor.";
        }
    }
    return errors;
}
