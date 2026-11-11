/*
 * industrialSites.ts birim testi (005). Çalıştırma: node --test src/lib/seo/industrialSites.test.mjs
 */
import {test} from "node:test";
import assert from "node:assert/strict";
import {industrialSiteOf, sitesInDistrict} from "./industrialSites.ts";

test("bütün kelime + ilçe koruması + ilk geçen", () => {
    assert.equal(industrialSiteOf("İvedik Organize Sanayi Siteleri 1354. Cad.", "Yenimahalle"), "İvedik");
    assert.equal(industrialSiteOf("OSTİM OSB 1234. Sk.", "Yenimahalle"), "Ostim");
    assert.equal(industrialSiteOf("Ostim OSB, İvedik yolu", "Yenimahalle"), "Ostim");
    assert.equal(industrialSiteOf("İvedik Cad. No:5", "Mamak"), null);            // başka ilçede sokak adı
    assert.equal(industrialSiteOf("Siteleri Mah.", "Altındağ"), null);             // "Siteleri" ≠ "Siteler"
    assert.equal(industrialSiteOf("Siteler, Karacakaya Cd.", "Altındağ"), "Siteler");
    assert.equal(industrialSiteOf("Şaşmaz Bulvarı", "etimesgut"), "Şaşmaz");      // ilçe yazımı katlanır
    assert.equal(industrialSiteOf("Gimat Toptancılar", "Yenimahalle"), "Gimat");
    assert.equal(industrialSiteOf(null, "Yenimahalle"), null);
    assert.equal(industrialSiteOf("Ostim", null), null);
});

test("ilçedeki siteler", () => {
    assert.deepEqual(sitesInDistrict("Yenimahalle"), ["Ostim", "İvedik", "Gimat"]);
    assert.deepEqual(sitesInDistrict("Çankaya"), []);
});
