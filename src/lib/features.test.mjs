/*
 * features.ts birim testi (006). Çalıştırma: node --test src/lib/features.test.mjs
 */
import {test, afterEach} from "node:test";
import assert from "node:assert/strict";
import {claimsEnabled} from "./features.ts";

afterEach(() => { delete process.env.NEXT_PUBLIC_CLAIMS_ENABLED; });

test("değişken yokken açık", () => assert.equal(claimsEnabled(), true));

test("Spring'in false saydığı yazımlar kapatır", () => {
    for (const v of ["false", "FALSE", "0", "no", "off", " Off "]) {
        process.env.NEXT_PUBLIC_CLAIMS_ENABLED = v;
        assert.equal(claimsEnabled(), false, v);
    }
    process.env.NEXT_PUBLIC_CLAIMS_ENABLED = "true";
    assert.equal(claimsEnabled(), true);
});
