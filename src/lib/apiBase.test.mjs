/*
 * apiBase.ts birim testi (006). Çalıştırma: node --test src/lib/apiBase.test.mjs
 * Node'da `window` yok → "sunucu" dalı; tarayıcı dalı `globalThis.window` ile taklit edilir.
 */
import {test, beforeEach, afterEach} from "node:test";
import assert from "node:assert/strict";
import {apiBase, publicApiBase} from "./apiBase.ts";

beforeEach(() => {
    delete process.env.API_INTERNAL_URL;
    delete process.env.NEXT_PUBLIC_API_URL;
});
afterEach(() => { delete globalThis.window; });

test("hiçbiri yoksa yerel geliştirme adresi", () => {
    assert.equal(apiBase(), "http://localhost:8080/api");
    assert.equal(publicApiBase(), "http://localhost:8080/api");
});

test("sunucuda iç adres önce gelir, genel adres değişmez", () => {
    process.env.NEXT_PUBLIC_API_URL = "https://sanayidefteri.com/api/";
    process.env.API_INTERNAL_URL = "http://api:8080/api";
    assert.equal(apiBase(), "http://api:8080/api");
    assert.equal(publicApiBase(), "https://sanayidefteri.com/api");
});

test("iç adres yoksa sunucu da genel adresi kullanır", () => {
    process.env.NEXT_PUBLIC_API_URL = "https://sanayidefteri.com/api";
    assert.equal(apiBase(), "https://sanayidefteri.com/api");
});

test("tarayıcıda iç adres ASLA kullanılmaz", () => {
    globalThis.window = {};
    process.env.NEXT_PUBLIC_API_URL = "https://sanayidefteri.com/api";
    process.env.API_INTERNAL_URL = "http://api:8080/api";
    assert.equal(apiBase(), "https://sanayidefteri.com/api");
});
