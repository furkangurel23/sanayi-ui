/*
 * searchText.ts için bağımlılıksız birim testi (004-name-search).
 * Çalıştırma: node --test src/lib/searchText.test.mjs   (Node 24: .ts tiplerini kendisi siler)
 *
 * Beklenen değerler backend `SearchTextTest` ile AYNIDIR — üç gerçekleme (SQL, Kotlin, TS) tek kural.
 * Ayrışık (decomposed) girdiler kod noktasıyla kurulur (cp): görünmez birleşik işaretler kaynakta
 * literal yazılırsa kopyalama sırasında kaybolabilir.
 */
import {test} from "node:test";
import assert from "node:assert/strict";
import {foldSearch, parseSearch, searchTerms, MAX_CHARS} from "./searchText.ts";

const cp = (...codes) => String.fromCodePoint(...codes);
const I_DOT = cp(0x69, 0x307);   // i + birleşik nokta (gerçek veride görülen yazım)
const O_UML = cp(0x6f, 0x308);   // NFD ö
const U_UML = cp(0x75, 0x308);   // NFD ü

test("foldSearch backend ile aynı normal hâli üretir", () => {
    const cases = [
        ["İNCİ OTO ŞANZIMAN", "inci oto sanziman"],
        ["IŞIK OTO", "isik oto"],
        ["ışık oto", "isik oto"],
        ["Baran's Oto", "barans oto"],
        ["Baran’s ‘Oto´ `x`", "barans oto x"],
        ["Oto-Ekspres", "oto ekspres"],
        ["Hondacı Kadir Usta", "hondaci kadir usta"],
        ["HONdacı Kadir", "hondaci kadir"],
        [`Değ${I_DOT}rmenc${I_DOT} Oto Last${I_DOT}k`, "degirmenci oto lastik"],
        [`Pn${O_UML}matik S${U_UML}spansiyon`, "pnomatik suspansiyon"],
        ["Âlâ Îmâ Ûmut Ñandú", "ala ima umut nandu"],
        ["Çağrı Göğüş Ölçü Üzüm", "cagri gogus olcu uzum"],
        [cp(0x212a), "k"],                   // KELVIN SIGN
        ["ＯＴＯ ß ø", ""],
        [cp(0x1f697) + " Oto 7/24", "oto 7 24"],
        [" %oto%_x ", "oto x"],
        ["A.Ş. & Ltd/Şti", "a s ltd sti"],
        ["   ", ""],
        ["", ""],
    ];
    for (const [raw, expected] of cases) {
        assert.equal(foldSearch(raw), expected, `girdi: ${JSON.stringify(raw)}`);
    }
});

test("searchTerms kelime kurallarını uygular", () => {
    assert.deepEqual(searchTerms("ab"), ["ab"]);
    assert.deepEqual(searchTerms("a"), []);
    assert.deepEqual(searchTerms(undefined), []);
    assert.deepEqual(searchTerms("   "), []);
    assert.deepEqual(searchTerms("kadir u"), ["kadir"]);
    assert.deepEqual(searchTerms("%"), []);
    assert.deepEqual(searchTerms("..."), []);
    assert.deepEqual(searchTerms("%oto%"), ["oto"]);
    assert.deepEqual(searchTerms("kadir kad"), ["kadir", "kad"]);
    assert.deepEqual(searchTerms("Kadir KADIR kadır"), ["kadir"]);
    assert.deepEqual(searchTerms("HONdacı Kadir"), ["hondaci", "kadir"]);
    assert.deepEqual(searchTerms("ondacı kad ust"), ["ondaci", "kad", "ust"]);
    assert.deepEqual(searchTerms("usta kadir"), ["usta", "kadir"]);
});

test("searchTerms en fazla 6 kelime ve 100 karakter", () => {
    assert.deepEqual(searchTerms("k1 k2 k3 k4 k5 k6 k7"), ["k1", "k2", "k3", "k4", "k5", "k6"]);
    const long = "a".repeat(98) + " b" + "c".repeat(10) + " zzz";
    assert.equal(long.slice(0, MAX_CHARS).length, 100);
    assert.deepEqual(searchTerms(long), ["a".repeat(98)]);
});

test("terimler yalnız [a-z0-9] — LIKE jokeri taşıyamaz", () => {
    for (const s of ["%_%", "a%b_c", "100% oto_x", "Baran's", "İŞÇİ%ĞÜÖ_ı"]) {
        for (const t of searchTerms(s)) assert.match(t, /^[a-z0-9]+$/, `terim: ${t}`);
    }
});

test("parseSearch: geçerliyse kırpılmış ham metin, değilse undefined", () => {
    for (const bad of [undefined, null, "", "a", "%", "...", "  ", 42]) {
        assert.equal(parseSearch(bad), undefined, `reddedilmeliydi: ${JSON.stringify(bad)}`);
    }
    assert.equal(parseSearch("  kadir  "), "kadir");
    assert.equal(parseSearch("HONdacı Kadir"), "HONdacı Kadir"); // ham metin korunur (kutuda aynen)
    assert.equal(parseSearch(["honda", "x"]), "honda");          // dizi -> ilki
    assert.equal(parseSearch("x".repeat(150)).length, 100);
});
