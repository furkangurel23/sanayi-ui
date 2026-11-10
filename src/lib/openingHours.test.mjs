/*
 * openingHours.ts birim testi (003 / T089). Çalıştırma:
 *   node --test src/lib/openingHours.test.mjs
 *   TZ=America/New_York node --test src/lib/openingHours.test.mjs   # cihaz saat diliminden bağımsız
 * Anlar UTC olarak verilir; İstanbul UTC+3 (2016'dan beri yaz saati yok) -> İstanbul saati = UTC + 3.
 */
import {test} from "node:test";
import assert from "node:assert/strict";
import {formatDay, formatRange, isOpenAt, istanbulDayMinute, validateHours} from "./openingHours.ts";

const closed = () => ({MONDAY: [], TUESDAY: [], WEDNESDAY: [], THURSDAY: [], FRIDAY: [], SATURDAY: [], SUNDAY: []});
// 2026-11-13 Cuma. İstanbul saati verip UTC ana çeviren yardımcı.
const ist = (y, mo, d, h, mi = 0) => new Date(Date.UTC(y, mo - 1, d, h - 3, mi));

test("İstanbul günü ve dakikası cihaz TZ'sinden bağımsız", () => {
    assert.deepEqual(istanbulDayMinute(ist(2026, 11, 13, 20, 15)), {day: "FRIDAY", minute: 20 * 60 + 15});
    // UTC 22:30 Pazar = İstanbul Pazartesi 01:30
    assert.deepEqual(istanbulDayMinute(new Date(Date.UTC(2026, 10, 15, 22, 30))), {day: "MONDAY", minute: 90});
});

test("bilgi yoksa null (kapalı DEĞİL)", () => {
    assert.equal(isOpenAt(null, new Date()), null);
});

test("Cuma 20:00–02:00 gece aralığı: Cumartesi 01:00 açık, 02:00 kapalı, Cuma 19:59 kapalı", () => {
    const h = {...closed(), FRIDAY: [{open: "20:00", close: "02:00"}]};
    assert.equal(isOpenAt(h, ist(2026, 11, 13, 20, 0)), true);
    assert.equal(isOpenAt(h, ist(2026, 11, 13, 23, 59)), true);
    assert.equal(isOpenAt(h, ist(2026, 11, 14, 1, 0)), true);
    assert.equal(isOpenAt(h, ist(2026, 11, 14, 2, 0)), false);
    assert.equal(isOpenAt(h, ist(2026, 11, 13, 19, 59)), false);
});

test("Pazar gece aralığı Pazartesi sabahına taşar (hafta sınırı)", () => {
    const h = {...closed(), SUNDAY: [{open: "22:00", close: "03:00"}]};
    assert.equal(isOpenAt(h, ist(2026, 11, 16, 2, 30)), true); // Pazartesi 02:30
    assert.equal(isOpenAt(h, ist(2026, 11, 16, 3, 0)), false);
});

test("24 saat (00:00–24:00) ve '24:00' kapanış", () => {
    const h = {...closed(), SATURDAY: [{open: "00:00", close: "24:00"}], MONDAY: [{open: "18:00", close: "24:00"}]};
    assert.equal(isOpenAt(h, ist(2026, 11, 14, 0, 0)), true);
    assert.equal(isOpenAt(h, ist(2026, 11, 14, 23, 59)), true);
    assert.equal(isOpenAt(h, ist(2026, 11, 15, 0, 0)), false); // Pazar kapalı; Cumartesi 24:00 taşmaz
    assert.equal(isOpenAt(h, ist(2026, 11, 16, 23, 59)), true);
    assert.equal(isOpenAt(h, ist(2026, 11, 17, 0, 1)), false);
    assert.equal(formatRange({open: "00:00", close: "24:00"}), "24 saat açık");
});

test("iki aralıklı gün (öğle arası) ve metinler", () => {
    const h = {...closed(), FRIDAY: [{open: "08:30", close: "12:30"}, {open: "13:30", close: "19:00"}]};
    assert.equal(isOpenAt(h, ist(2026, 11, 13, 13, 0)), false);
    assert.equal(isOpenAt(h, ist(2026, 11, 13, 13, 30)), true);
    assert.equal(formatDay(h.FRIDAY), "08:30–12:30, 13:30–19:00");
    assert.equal(formatDay([]), "Kapalı");
    assert.equal(formatRange({open: "20:00", close: "02:00"}), "20:00–02:00 (ertesi gün)");
});

test("istemci doğrulaması backend alan yollarıyla", () => {
    const h = {...closed(), MONDAY: [{open: "", close: ""}], TUESDAY: [{open: "09:00", close: "09:00"}],
        WEDNESDAY: [{open: "08:00", close: "12:00"}, {open: "11:00", close: "18:00"}]};
    const e = validateHours(h);
    assert.ok(e["openingHours.MONDAY[0]"]);
    assert.ok(e["openingHours.TUESDAY[0]"]);
    assert.ok(e["openingHours.WEDNESDAY[1]"]);
    assert.deepEqual(validateHours(null), {});
});
