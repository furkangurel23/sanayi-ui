/*
 * slug.ts birim testi (005). Çalıştırma: node --test src/lib/seo/slug.test.mjs
 */
import {test} from "node:test";
import assert from "node:assert/strict";
import {slugify} from "./slug.ts";

// Dev DB'deki 40 marka + 26 kategori + 25 ilçe (2026-11-11). Yeni ad eklendiğinde buraya da eklenir:
// test, iki adın aynı adres kelimesine düşmediğini (spec FR-008 "çakışma = hata") kilitler.
const BRANDS = "Honda|Toyota|Hyundai|Renault|Fiat|BMW|Mercedes-Benz|Volkswagen|Alfa Romeo|Audi|BYD|Chery|Chevrolet|Citroën|Cupra|Dacia|DS Automobiles|Ford|Jaguar|Jeep|Kia|Lada|Land Rover|Lexus|Mazda|MG|Mini|Mitsubishi|Nissan|Opel|Peugeot|Porsche|Seat|Skoda|SsangYong|Subaru|Suzuki|Tesla|Togg|Volvo".split("|");
const CATEGORIES = "Mekanik|Oto Elektrik|Kaporta|Boya|Lastik|Motor Revizyon|Şanzıman|Diagnostik|Rot Balans|Ön Düzen|Fren|Egzoz|Oto Klima|Oto Cam|Oto Döşeme|Oto Kuaför|Oto Yıkama|Oto Ekspertiz|Oto Anahtar|Radyatör|Turbo|LPG Dönüşüm|Hibrit ve Elektrikli Araç|Amortisör|Oto Multimedya|Yedek Parça".split("|");
const DISTRICTS = "Akyurt|Altındağ|Ayaş|Bala|Beypazarı|Çamlıdere|Çankaya|Çubuk|Elmadağ|Etimesgut|Evren|Gölbaşı|Güdül|Haymana|Kahramankazan|Kalecik|Keçiören|Kızılcahamam|Mamak|Nallıhan|Polatlı|Pursaklar|Sincan|Şereflikoçhisar|Yenimahalle".split("|");

test("spec örnekleri", () => {
    const cases = [
        ["Citroën", "citroen"],
        ["Mercedes-Benz", "mercedes-benz"],
        ["Alfa Romeo", "alfa-romeo"],
        ["DS Automobiles", "ds-automobiles"],
        ["Hibrit ve Elektrikli Araç", "hibrit-ve-elektrikli-arac"],
        ["Şanzıman", "sanziman"],
        ["Çankaya", "cankaya"],
        ["Kızılcahamam", "kizilcahamam"],
        ["Şereflikoçhisar", "sereflikochisar"],
        ["İ", "i"],
        ["A & B", "a-ve-b"],
        ["A&B", "a-ve-b"],
        ["HONDA", "honda"],
        ["  Oto -- Cam  ", "oto-cam"],
        ["-", ""],
        [" ", ""],
        ["", ""],
    ];
    for (const [raw, expected] of cases) assert.equal(slugify(raw), expected, raw);
});

test("eşgüçlülük: kanonik adres yeniden katlanınca değişmez (yönlendirme döngüsü yok)", () => {
    for (const name of [...BRANDS, ...CATEGORIES, ...DISTRICTS, "A & B", "Citroën"]) {
        const s = slugify(name);
        assert.equal(slugify(s), s, name);
        assert.match(s, /^[a-z0-9]+(-[a-z0-9]+)*$/, name);
    }
});

test("marka, kategori ve ilçe adları kendi türleri içinde çakışmaz", () => {
    for (const [kind, names] of [["marka", BRANDS], ["kategori", CATEGORIES], ["ilçe", DISTRICTS]]) {
        const seen = new Map();
        for (const n of names) {
            const s = slugify(n);
            assert.ok(!seen.has(s), `${kind}: "${n}" ile "${seen.get(s)}" aynı adrese düşüyor (${s})`);
            seen.set(s, n);
        }
    }
});
