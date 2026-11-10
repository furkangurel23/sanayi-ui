/*
 * directions.ts için bağımlılıksız birim testi (002 / T046).
 * Çalıştırma: node --test src/lib/directions.test.mjs
 * Node 24, .ts dosyasındaki tip açıklamalarını kendisi siler ("type stripping") -> derleyici
 * veya test kütüphanesi gerekmez; yerleşik `node:test` + `node:assert` yeterli.
 */
import {test} from "node:test";
import assert from "node:assert/strict";
import {directionsUrls} from "./directions.ts";

test("koordinat varsa hedef koordinattır (adres yok sayılır)", () => {
    const u = directionsUrls({name: "Usta", lat: 39.97, lon: 32.75, address: "1. Cadde", city: "Ankara"});
    assert.equal(u.google, "https://www.google.com/maps/dir/?api=1&destination=39.97%2C32.75&travelmode=driving");
    assert.equal(u.apple, "https://maps.apple.com/?daddr=39.97%2C32.75&dirflg=d");
});

test("koordinat yok, adres var -> adres + ilçe + şehir (kodlanmış)", () => {
    const u = directionsUrls({name: "Usta", lat: null, lon: undefined, address: "Ostim 1. Cd. No:5 & 7", district: "Yenimahalle", city: "Ankara"});
    const dest = encodeURIComponent("Ostim 1. Cd. No:5 & 7, Yenimahalle, Ankara");
    assert.equal(u.google, `https://www.google.com/maps/dir/?api=1&destination=${dest}&travelmode=driving`);
    assert.equal(u.apple, `https://maps.apple.com/?daddr=${dest}&dirflg=d`);
    assert.ok(!u.apple.includes("&q="), "Apple bağlantısında q olmamalı");
});

test("adres ilçeyi zaten içeriyorsa ilçe tekrar eklenmez (Türkçe küçük harf)", () => {
    const u = directionsUrls({name: "Usta", address: "100. Yıl Bulvarı No:14, ETİMESGUT", district: "Etimesgut", city: "Ankara"});
    assert.equal(u.google, `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent("100. Yıl Bulvarı No:14, ETİMESGUT, Ankara")}&travelmode=driving`);
});

test("ne koordinat ne adres (yalnız ilçe/şehir) -> null; NaN koordinat geçersiz", () => {
    assert.equal(directionsUrls({name: "Usta", district: "Çankaya", city: "Ankara"}), null);
    assert.equal(directionsUrls({name: "Usta", lat: Number.NaN, lon: 32.8, address: "  "}), null);
});
