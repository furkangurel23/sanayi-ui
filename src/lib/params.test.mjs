/*
 * params.ts için bağımlılıksız birim testi (003 / T087).
 * Çalıştırma: node --test src/lib/params.test.mjs
 * Node 24 .ts dosyasındaki tipleri kendisi siler (type stripping) -> derleyici gerekmez.
 */
import {test} from "node:test";
import assert from "node:assert/strict";
import {parseEnum, parsePage, parsePositiveId, parseQuery, safeNext} from "./params.ts";

test("safeNext: site içi göreli yollar kabul edilir (sorgu korunur)", () => {
    assert.equal(safeNext("/account"), "/account");
    assert.equal(safeNext("/providers/suggest"), "/providers/suggest");
    assert.equal(safeNext("/providers/12/claim?x=1#a"), "/providers/12/claim?x=1#a");
    assert.equal(safeNext(["/account", "/evil"]), "/account"); // dizi -> ilki
});

test("safeNext: başka siteye çıkan ya da bozuk değerler reddedilir", () => {
    for (const bad of ["//evil.example", "https://evil.example", "http://x", "/\\evil.example",
        "\\\\evil.example", "account", "", "javascript:alert(1)", "/\t/evil.example", "/\n/evil.example",
        "/a\\b", undefined, null, 42]) {
        assert.equal(safeNext(bad), undefined, `reddedilmeliydi: ${JSON.stringify(bad)}`);
    }
});

test("parsePage / parsePositiveId / parseEnum mevcut davranış", () => {
    assert.equal(parsePage("abc"), 1);
    assert.equal(parsePage("0"), 1);
    assert.equal(parsePage("3"), 3);
    assert.equal(parsePositiveId("-1"), undefined);
    assert.equal(parsePositiveId("12"), 12);
    assert.equal(parseEnum("resolved", ["open", "resolved"], "open"), "resolved");
    assert.equal(parseEnum("x", ["open", "resolved"], "open"), "open");
});

test("parseQuery: 2 karakterden kısa sorgu yok sayılır", () => {
    assert.equal(parseQuery("a"), undefined);
    assert.equal(parseQuery("  os "), "os");
    assert.equal(parseQuery(undefined), undefined);
});
