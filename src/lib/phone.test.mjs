// formatPhoneTR birim testi (002): `node --test src/lib/phone.test.mjs` (Node 24 TS tiplerini soyar).
import {test} from "node:test";
import assert from "node:assert/strict";
import {formatPhoneTR} from "./phone.ts";

test("E.164 sabit hat ve mobil 3-3-2-2 gruplanır", () => {
    assert.equal(formatPhoneTR("+903123545166"), "+90 312 354 51 66");
    assert.equal(formatPhoneTR("+905321112233"), "+90 532 111 22 33");
});

test("E.164 olmayan değer olduğu gibi döner, boş değer boş metin", () => {
    assert.equal(formatPhoneTR("0312 354 51 66"), "0312 354 51 66");
    assert.equal(formatPhoneTR("444 0 444"), "444 0 444");
    assert.equal(formatPhoneTR(null), "");
    assert.equal(formatPhoneTR(undefined), "");
});
