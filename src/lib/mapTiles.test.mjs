/*
 * mapTiles.ts birim testi (006). Çalıştırma: node --test src/lib/mapTiles.test.mjs
 */
import {test, beforeEach} from "node:test";
import assert from "node:assert/strict";
import {DEFAULT_TILE_ATTRIBUTION, DEFAULT_TILE_URL, tileAttribution, tileOrigin, tileUrl} from "./mapTiles.ts";

beforeEach(() => {
    delete process.env.NEXT_PUBLIC_TILE_URL;
    delete process.env.NEXT_PUBLIC_TILE_ATTRIBUTION;
});

test("varsayılan OSM", () => {
    assert.equal(tileUrl(), DEFAULT_TILE_URL);
    assert.equal(tileAttribution(), DEFAULT_TILE_ATTRIBUTION);
    assert.equal(tileOrigin(), "https://tile.openstreetmap.org");
});

test("ortamdan değiştirilebilir", () => {
    process.env.NEXT_PUBLIC_TILE_URL = "https://tiles.example.org/{z}/{x}/{y}.png?key=x";
    process.env.NEXT_PUBLIC_TILE_ATTRIBUTION = "© Örnek";
    assert.equal(tileOrigin(), "https://tiles.example.org");
    assert.equal(tileAttribution(), "© Örnek");
});

test("bozuk şablonda köken null", () => {
    process.env.NEXT_PUBLIC_TILE_URL = "bozuk";
    assert.equal(tileOrigin(), null);
});
