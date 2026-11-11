/*
 * site.ts birim testi (005). Çalıştırma: node --test src/lib/seo/site.test.mjs
 * Ortam değişkenleri her testte açıkça kurulur (derlemede gömülen değerlerin çalışma anı karşılığı).
 */
import {test, beforeEach} from "node:test";
import assert from "node:assert/strict";
import {absoluteUrl, googleVerification, indexable, pageMetadata, siteUrl} from "./site.ts";

beforeEach(() => {
    delete process.env.SITE_URL;
    delete process.env.SITE_INDEXABLE;
    delete process.env.GOOGLE_SITE_VERIFICATION;
});

test("site adresi: varsayılan yerel, sondaki / kırpılır", () => {
    assert.equal(siteUrl(), "http://localhost:3000");
    process.env.SITE_URL = "https://ornek.com/";
    assert.equal(siteUrl(), "https://ornek.com");
    assert.equal(absoluteUrl("/providers/1"), "https://ornek.com/providers/1");
    assert.equal(absoluteUrl("sitemap.xml"), "https://ornek.com/sitemap.xml");
});

test("dizine açıklık yalnız tam 'true' ile", () => {
    assert.equal(indexable(), false);
    process.env.SITE_INDEXABLE = "TRUE";
    assert.equal(indexable(), false);
    process.env.SITE_INDEXABLE = "true";
    assert.equal(indexable(), true);
});

test("doğrulama kodu boşsa yok", () => {
    assert.equal(googleVerification(), undefined);
    process.env.GOOGLE_SITE_VERIFICATION = "  ";
    assert.equal(googleVerification(), undefined);
    process.env.GOOGLE_SITE_VERIFICATION = "abc";
    assert.equal(googleVerification(), "abc");
});

test("pageMetadata: kapalı ortamda index her zaman false; açıkta istenen değer", () => {
    const input = {title: "T", description: "D", path: "/x"};
    assert.deepEqual(pageMetadata(input).robots, {index: false, follow: true});
    process.env.SITE_INDEXABLE = "true";
    assert.deepEqual(pageMetadata(input).robots, {index: true, follow: true});
    assert.deepEqual(pageMetadata({...input, index: false}).robots, {index: false, follow: true});
});

test("pageMetadata: tam openGraph nesnesi, kanonik ve başlık biçimi", () => {
    const m = pageMetadata({title: "Ankara Honda ustaları", description: "D", path: "/ankara/marka/honda"});
    assert.equal(m.title, "Ankara Honda ustaları");
    assert.deepEqual(m.alternates, {canonical: "/ankara/marka/honda"});
    assert.equal(m.openGraph.siteName, "Sanayi Defteri");
    assert.equal(m.openGraph.locale, "tr_TR");
    assert.equal(m.openGraph.url, "/ankara/marka/honda");
    assert.equal(m.openGraph.images[0].url, "/opengraph-image");
    assert.equal(m.openGraph.images[0].width, 1200);
    assert.equal(m.twitter.card, "summary_large_image");
    assert.deepEqual(pageMetadata({title: "X", absoluteTitle: true, description: "D", path: "/"}).title, {absolute: "X"});
});
