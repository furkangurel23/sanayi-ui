/*
 * landing.ts birim testi (005). Çalıştırma: node --test src/lib/seo/landing.test.mjs
 */
import {test} from "node:test";
import assert from "node:assert/strict";
import {
    buildLandingIndex, districtHref, districtsOf, facetsInDistrict, findBrand, findDistrict,
    isIndexable, shopChipHref, sitemapLandingPaths,
} from "./landing.ts";

const facets = {
    brands: [{id: 1, name: "Honda", count: 10}, {id: 2, name: "Citroën", count: 2}],
    categories: [{id: 7, name: "Oto Elektrik", count: 5}],
    districts: [{name: "Etimesgut", count: 8}, {name: "Çankaya", count: 4}],
    brandDistricts: [
        {brandId: 1, district: "Etimesgut", count: 6},
        {brandId: 1, district: "Çankaya", count: 2},
        {brandId: 2, district: "Çankaya", count: 2},
    ],
    categoryDistricts: [{categoryId: 7, district: "Etimesgut", count: 3}],
};
const ix = buildLandingIndex(facets);

test("slug ile bulma", () => {
    assert.equal(findBrand(ix, "citroen").name, "Citroën");
    assert.equal(findDistrict(ix, "cankaya").name, "Çankaya");
    assert.equal(findBrand(ix, "toyota"), undefined);
});

test("dizin eşiği: ana ≥1, kırılım ≥3", () => {
    assert.equal(isIndexable(false, 1), true);
    assert.equal(isIndexable(false, 0), false);
    assert.equal(isIndexable(true, 2), false);
    assert.equal(isIndexable(true, 3), true);
});

test("dükkan etiketleri: kırılım ≥3 -> kırılım, değilse ana, hedef yoksa eski bağlantı", () => {
    assert.equal(shopChipHref(ix, "marka", 1, "Etimesgut"), "/ankara/marka/honda/etimesgut");
    assert.equal(shopChipHref(ix, "marka", 1, "etimesgut"), "/ankara/marka/honda/etimesgut"); // küçük harf kayıt
    assert.equal(shopChipHref(ix, "marka", 1, "Çankaya"), "/ankara/marka/honda");             // 2 dükkan
    assert.equal(shopChipHref(ix, "marka", 1, null), "/ankara/marka/honda");
    assert.equal(shopChipHref(ix, "kategori", 7, "Etimesgut"), "/ankara/kategori/oto-elektrik/etimesgut");
    assert.equal(shopChipHref(ix, "marka", 99, "Etimesgut"), "/providers?brandId=99");        // index'te yok
    assert.equal(shopChipHref(null, "kategori", 7, "Etimesgut"), "/providers?categoryId=7");  // facets hatası
});

test("ilçe bağlantısı", () => {
    assert.equal(districtHref(ix, "çankaya"), "/ankara/ilce/cankaya");
    assert.equal(districtHref(ix, "Mamak"), "/providers?district=Mamak");
    assert.equal(districtHref(null, "Çankaya"), "/providers?district=%C3%87ankaya");
    assert.equal(districtHref(ix, null), null);
});

test("kırılım listeleri sayıya göre azalan", () => {
    assert.deepEqual(districtsOf(ix, "marka", 1).map((d) => [d.name, d.cellCount]), [["Etimesgut", 6], ["Çankaya", 2]]);
    assert.deepEqual(facetsInDistrict(ix, "marka", "Çankaya").map((b) => b.name), ["Citroën", "Honda"]);
});

test("site haritası yalnız dizine açık açılış adreslerini içerir", () => {
    assert.deepEqual(sitemapLandingPaths(ix).sort(), [
        "/ankara/ilce/cankaya", "/ankara/ilce/etimesgut",
        "/ankara/kategori/oto-elektrik", "/ankara/kategori/oto-elektrik/etimesgut",
        "/ankara/marka/citroen", "/ankara/marka/honda", "/ankara/marka/honda/etimesgut",
    ]);
});

test("çakışan ad: ikincisi atlanır", () => {
    const orig = console.error;
    const logs = [];
    console.error = (m) => logs.push(m);
    try {
        const x = buildLandingIndex({...facets, brands: [{id: 1, name: "Citroën", count: 1}, {id: 2, name: "CITROEN", count: 1}]});
        assert.equal(findBrand(x, "citroen").id, 1);
        assert.equal(logs.length, 1);
    } finally {
        console.error = orig;
    }
});
