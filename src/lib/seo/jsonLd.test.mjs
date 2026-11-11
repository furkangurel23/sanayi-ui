/*
 * jsonLd.ts birim testi (005). Çalıştırma: node --test src/lib/seo/jsonLd.test.mjs
 */
import {test, beforeEach} from "node:test";
import assert from "node:assert/strict";
import {breadcrumbJsonLd, businessJsonLd, jsonLdScript, openingHoursSpec, schemaTypeFor, siteJsonLd} from "./jsonLd.ts";

beforeEach(() => { process.env.SITE_URL = "https://ornek.com"; });

const base = {
    id: 2710, name: "HKU Hondacı Kadir Usta", address: "Ahi Mesut Blv. No:1", city: "Ankara",
    district: "Etimesgut", phone: "+903120000000", location: {lat: 39.95, lon: 32.68},
    avgScore: null, ratingCount: 0, brands: [{id: 1, name: "Honda"}], categories: [{id: 1, name: "Mekanik"}],
    recentRatings: [{id: 1, score: 5, comment: "GİZLİ YORUM", createdAt: "x", userDisplayName: "Ayşe K."}],
    openingHours: null,
};

test("tür eşlemesi (tamir önceliği, sonra kaporta/lastik/parça/yıkama, varsayılan AutoRepair)", () => {
    assert.equal(schemaTypeFor(["Yedek Parça", "Lastik"]), "TireShop");
    assert.equal(schemaTypeFor(["Mekanik", "Yedek Parça"]), "AutoRepair");
    assert.equal(schemaTypeFor(["Oto Cam"]), "AutoRepair");
    assert.equal(schemaTypeFor(["Boya", "Lastik"]), "AutoBodyShop");
    assert.equal(schemaTypeFor(["Yedek Parça"]), "AutoPartsStore");
    assert.equal(schemaTypeFor(["Oto Yıkama"]), "AutoWash");
    assert.equal(schemaTypeFor(["Kaporta", "Fren"]), "AutoRepair");
    assert.equal(schemaTypeFor([]), "AutoRepair");
});

test("çalışma saatleri: gece aralığı tek giriş, 24:00 -> 23:59, kapalı gün yok (spec US1-5)", () => {
    const spec = openingHoursSpec({
        MONDAY: [{open: "08:30", close: "18:30"}], TUESDAY: [], WEDNESDAY: [], THURSDAY: [],
        FRIDAY: [{open: "20:00", close: "02:00"}], SATURDAY: [{open: "09:00", close: "24:00"}], SUNDAY: [],
    });
    assert.deepEqual(spec.map((s) => [s.dayOfWeek.replace("https://schema.org/", ""), s.opens, s.closes]), [
        ["Monday", "08:30", "18:30"], ["Friday", "20:00", "02:00"], ["Saturday", "09:00", "23:59"],
    ]);
    assert.equal(openingHoursSpec(null), undefined);
    assert.equal(openingHoursSpec({MONDAY: [], TUESDAY: [], WEDNESDAY: [], THURSDAY: [], FRIDAY: [], SATURDAY: [], SUNDAY: []}), undefined);
});

test("puansız dükkanda puan özeti yok; yorum metni ve kullanıcı adı hiç yok", () => {
    const j = businessJsonLd(base, "/providers/2710");
    assert.equal(j["@type"], "AutoRepair");
    assert.equal(j.url, "https://ornek.com/providers/2710");
    assert.deepEqual(j.address, {
        "@type": "PostalAddress", streetAddress: "Ahi Mesut Blv. No:1", addressLocality: "Etimesgut",
        addressRegion: "Ankara", addressCountry: "TR",
    });
    assert.deepEqual(j.geo, {"@type": "GeoCoordinates", latitude: 39.95, longitude: 32.68});
    assert.equal(j.telephone, "+903120000000");
    assert.equal(j.aggregateRating, undefined);
    assert.equal(j.openingHoursSpecification, undefined);
    const text = JSON.stringify(j);
    assert.ok(!text.includes("GİZLİ YORUM") && !text.includes("Ayşe"));
});

test("puanlı dükkanda −5…+5 ölçekli puan özeti", () => {
    const j = businessJsonLd({...base, avgScore: 3.456, ratingCount: 7}, "/providers/2710");
    assert.deepEqual(j.aggregateRating, {"@type": "AggregateRating", ratingValue: 3.46, ratingCount: 7, bestRating: 5, worstRating: -5});
});

test("ilçesiz/konumsuz/telefonsuz/adressiz dükkanda ilgili alanlar yazılmaz", () => {
    const j = businessJsonLd({...base, district: null, location: null, phone: null, address: null}, "/providers/1");
    assert.deepEqual(j.address, {"@type": "PostalAddress", addressRegion: "Ankara", addressCountry: "TR"});
    assert.equal(j.geo, undefined);
    assert.equal(j.telephone, undefined);
});

test("gezinti yolu ve site verisi mutlak adresli", () => {
    const b = breadcrumbJsonLd([{name: "Ana sayfa", path: "/"}, {name: "X", path: "/providers/1"}]);
    assert.equal(b.itemListElement[1].position, 2);
    assert.equal(b.itemListElement[1].item, "https://ornek.com/providers/1");
    const [site, org] = siteJsonLd();
    assert.equal(site["@type"], "WebSite");
    assert.equal(org.logo, "https://ornek.com/apple-icon.png");
    assert.equal(org.name, "Sanayi Defteri");
});

test("</script> kaçışı", () => {
    const s = jsonLdScript({name: "</script><script>alert(1)</script>"});
    assert.ok(!s.includes("<"));
    assert.equal(JSON.parse(s).name, "</script><script>alert(1)</script>");
});
