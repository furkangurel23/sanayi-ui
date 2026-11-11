/*
 * text.ts birim testi (005). Çalıştırma: node --test src/lib/seo/text.test.mjs
 */
import {test} from "node:test";
import assert from "node:assert/strict";
import {DESCRIPTION_MAX, landingDescription, landingTitle, shopDescription, shopTitle} from "./text.ts";

const shop = (o = {}) => ({
    name: "HKU Hondacı Kadir Usta", address: "Ahi Mesut Blv.", district: "Etimesgut",
    brands: [{id: 1, name: "Honda"}], categories: [{id: 1, name: "Mekanik"}], avgScore: null, ratingCount: 0, ...o,
});
const BRANDS11 = "Honda Toyota BMW Audi Fiat Ford Kia Opel Seat Skoda Volvo".split(" ").map((name, id) => ({id, name}));

test("dükkan başlığı: ad – ilçe – marka (spec US1-3)", () => {
    assert.equal(shopTitle(shop()), "HKU Hondacı Kadir Usta – Etimesgut – Honda");
});

test("sanayi sitesi ilçenin yerini alır (spec US1-6)", () => {
    const t = shopTitle(shop({name: "Yıldız Oto", address: "Ostim OSB 1234. Sk.", district: "Yenimahalle", brands: []}));
    assert.equal(t, "Yıldız Oto – Ostim");
    assert.match(shopDescription(shop({address: "Ostim OSB", district: "Yenimahalle"})), /^Ostim, Yenimahalle, Ankara/);
});

test("uzun ad kısaltılmaz, ekler sondan düşer; çok markada başlıkta tek marka", () => {
    const long = "A".repeat(120);
    assert.equal(shopTitle(shop({name: long})), long);
    const mid = "B".repeat(45); // + " – Etimesgut" = 57 sığar, + " – Honda" sığmaz
    assert.equal(shopTitle(shop({name: mid})), `${mid} – Etimesgut`);
    assert.equal(shopTitle(shop({brands: BRANDS11})), "HKU Hondacı Kadir Usta – Etimesgut – Honda");
});

test("ilçesiz dükkan", () => {
    assert.equal(shopTitle(shop({district: null})), "HKU Hondacı Kadir Usta – Honda");
    assert.match(shopDescription(shop({district: null})), /^Ankara · /);
});

test("açıklama: kategoriler, ≤3 marka +N, puan; ≤160", () => {
    const d = shopDescription(shop({brands: BRANDS11, avgScore: 4.5, ratingCount: 12}));
    assert.match(d, /Markalar: Honda, Toyota, BMW \+8/);
    assert.match(d, /Puan 4,5 \(12 değerlendirme\)/);
    assert.ok(d.length <= DESCRIPTION_MAX, d);
    assert.match(shopDescription(shop()), /Henüz puanlanmadı/);
    const many = shopDescription(shop({name: "X".repeat(120), categories: BRANDS11, brands: BRANDS11}));
    assert.ok(many.length <= DESCRIPTION_MAX);
});

test("açılış başlık ve açıklamaları", () => {
    assert.equal(landingTitle("marka", "Honda"), "Ankara Honda ustaları");
    assert.equal(landingTitle("marka", "Honda", "Etimesgut"), "Honda ustaları – Etimesgut");
    assert.equal(landingTitle("kategori", "Oto Elektrik"), "Ankara Oto Elektrik ustaları");
    assert.equal(landingTitle("ilce", "Etimesgut"), "Etimesgut oto sanayi ustaları");
    assert.match(landingDescription("marka", "Honda", 12), /12 servis ve yedek parça dükkanı/);
    assert.match(landingDescription("ilce", "Yenimahalle", 300, undefined, ["Ostim", "İvedik"]), /Sanayi siteleri: Ostim, İvedik/);
    const y = landingDescription("ilce", "Yenimahalle", 1052, undefined, ["Ostim", "İvedik", "Gimat"]);
    assert.ok(!y.includes("…") && y.endsWith("."), y); // sığmayan cümle düşer, kelime ortasında kesilmez
    for (const k of ["marka", "kategori", "ilce"]) {
        assert.ok(landingDescription(k, "Hibrit ve Elektrikli Araç", 99999, "Şereflikoçhisar", ["Ostim", "İvedik", "Gimat"]).length <= DESCRIPTION_MAX);
    }
});
