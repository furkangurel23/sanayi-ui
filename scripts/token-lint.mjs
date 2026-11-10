#!/usr/bin/env node
/*
 * BELİRTEÇ DIŞI DEĞER TARAMASI (002 / research D9, contracts/design-tokens.md) — bağımlılıksız.
 *
 * Kapsam: src/** altındaki .css ve .tsx dosyaları.
 * Yakalar:
 *   - ham renk: #hex, rgb()/rgba(), hsl()/hsla(), oklch(), color-mix(), adlandırılmış renkler
 *     (white, black, red...), data-URI içindeki %23hex, SVG fill/stroke="#…"
 *   - ham uzunluk: px / rem / em (istisna: 0, 1px)
 *   - ham süre: ms / s (istisna: 0.01ms — reduced-motion kuralı)
 *   - ham box-shadow ve ham filtre fonksiyonları (blur(), saturate()...) — gölge/efekt belirteçle yazılır
 * İstisnalar (sözleşme):
 *   - belirteç TANIM blokları: seçicisi yalnızca `:root` / `:root[data-theme=…]` / `[data-theme=…]`
 *     olan kurallardaki `--ad: değer` bildirimleri
 *   - @media / @container sorgu koşulları (yalnızca bildirimler taranır, koşullar taranmaz)
 *   - 0, 1px, 100%, 0.01ms, currentColor, transparent, href="#…"
 *   - TSX'te "çalışma anı değeri": style içinde CSS değişkenine (ör. {"--h": `${h}px`}) verilen
 *     hesaplanmış değerler — ham sabit değil, veriden türetilmiş.
 * Çıktı: dosya:satır: kural: parça. Bulgu varsa çıkış kodu 1.
 * Kullanım: node scripts/token-lint.mjs [--summary]
 */
import {readFileSync, readdirSync, statSync} from "node:fs";
import {fileURLToPath} from "node:url";
import {dirname, join, relative} from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const summaryOnly = process.argv.includes("--summary");

function walk(dir, out = []) {
    for (const name of readdirSync(dir)) {
        const p = join(dir, name);
        if (statSync(p).isDirectory()) walk(p, out);
        else if (/\.(css|tsx)$/.test(name)) out.push(p);
    }
    return out;
}

const NAMED = "white|black|red|green|blue|gray|grey|orange|yellow|purple|pink|silver|navy|teal|maroon|olive|lime|aqua|fuchsia|brown|gold";
const RE = {
    hex: /(?<![\w&])#[0-9a-fA-F]{3,8}\b/g,
    pctHex: /%23[0-9a-fA-F]{3,8}\b/g,
    fn: /\b(rgba?|hsla?|oklch|oklab|lab|lch|color-mix|hwb)\(/g,
    named: new RegExp(`(?<![\\w-])(${NAMED})(?![\\w-])`, "g"),
    len: /(?<![\w.-])-?(\d*\.?\d+)(px|rem|em)\b/g,
    dur: /(?<![\w.-])(\d*\.?\d+)(ms|s)\b/g,
    filt: /\b(blur|saturate|brightness|contrast|hue-rotate|invert|grayscale|sepia|drop-shadow)\(/g,
};

const findings = [];
const add = (file, line, rule, snippet) =>
    findings.push({file: relative(root, file), line, rule, snippet: snippet.trim().slice(0, 110)});

/** Satır numarası: offset'e kadarki \n sayısı + 1. */
const lineAt = (text, idx) => text.slice(0, idx).split("\n").length;

/** Değer içindeki ihlalleri listeler (CSS bildirimi ya da TSX style değeri). */
function scanValue(value, {prop = ""} = {}) {
    const hits = [];
    const v = value.replace(/var\(--[a-z0-9-]+\)/gi, "VAR"); // belirteç referansları temiz sayılır
    for (const m of v.matchAll(RE.hex)) hits.push(["ham renk", m[0]]);
    for (const m of v.matchAll(RE.pctHex)) hits.push(["ham renk (data-URI)", m[0]]);
    for (const m of v.matchAll(RE.fn)) hits.push(["ham renk fonksiyonu", m[0]]);
    for (const m of v.matchAll(RE.named)) hits.push(["adlandırılmış renk", m[0]]);
    for (const m of v.matchAll(RE.len)) {
        const n = parseFloat(m[1]);
        if (n === 0) continue;
        if (m[0] === "1px") continue;
        hits.push(["ham uzunluk", m[0]]);
    }
    for (const m of v.matchAll(RE.dur)) {
        if (m[0] === "0.01ms" || parseFloat(m[1]) === 0) continue;
        hits.push(["ham süre", m[0]]);
    }
    for (const m of v.matchAll(RE.filt)) hits.push(["ham filtre", m[0]]);
    if (/^box-shadow$/i.test(prop)) {
        const rest = v.replace(/VAR|inset|none|\b0\b|1px|,/g, "").trim();
        if (rest) hits.push(["ham box-shadow", value]);
    }
    return hits;
}

/* ---------------- CSS ---------------- */
function lintCss(file) {
    const src = readFileSync(file, "utf8");
    // Yorumları aynı uzunlukta boşlukla değiştir (satır numaraları korunur).
    const text = src.replace(/\/\*[\s\S]*?\*\//g, m => m.replace(/[^\n]/g, " "));
    // Basit ayrıştırıcı: her "{ … }" gövdesi için en yakın seçiciyi bul.
    const stack = [];
    let selStart = 0;
    for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        if (ch === "{") {
            stack.push({selector: text.slice(selStart, i).trim(), bodyStart: i + 1});
            selStart = i + 1;
        } else if (ch === "}") {
            const blk = stack.pop();
            if (blk) lintCssBody(file, text, blk.selector, blk.bodyStart, i);
            selStart = i + 1;
        } else if (ch === ";" && stack.length) {
            selStart = i + 1;
        }
    }
}

function isTokenBlock(selector) {
    return selector.split(",").every(s => /^(:root|:root\[data-theme=["']?\w+["']?\]|\[data-theme=["']?\w+["']?\]|html\[data-theme=["']?\w+["']?\])$/.test(s.trim()));
}

function lintCssBody(file, text, selector, start, end) {
    if (selector.startsWith("@")) return; // @media/@supports gövdesi: iç kurallar ayrıca taranır
    if (/^(from|to|\d+%)/.test(selector)) { /* keyframe adımı: normal bildirim gibi tara */ }
    // Yalnızca bu bloğun DOĞRUDAN bildirimleri (iç bloklar kendi turunda taranır).
    let body = text.slice(start, end);
    body = body.replace(/\{[^{}]*\}/g, m => m.replace(/[^\n]/g, " "));
    const tokenBlock = isTokenBlock(selector);
    for (const m of body.matchAll(/([a-z-][a-z0-9-]*)\s*:\s*([^;{}]+)(;|$)/gi)) {
        const prop = m[1];
        if (prop.startsWith("--") && tokenBlock) continue; // belirteç tanımı
        // Seçici parçası gibi görünen (ör. "a:hover") yanlış eşleşmeleri ele: bildirim satır başında olmalı
        const before = body.slice(0, m.index);
        if (before.trim() && !/[;{]\s*$/.test(before) && !/^\s*$/.test(before.split("\n").pop())) continue;
        for (const [rule, snip] of scanValue(m[2], {prop}))
            add(file, lineAt(text, start + m.index), rule, `${prop}: ${snip}`);
    }
}

/* ---------------- TSX ---------------- */
/** Yorumları boşlukla değiştirir; string/template içindeki // ve /* korunur. */
function stripTsComments(src) {
    let out = "", i = 0, q = null;
    while (i < src.length) {
        const c = src[i], n = src[i + 1];
        if (q) {
            out += c;
            if (c === "\\") { out += n ?? ""; i += 2; continue; }
            if (c === q) q = null;
            i++;
            continue;
        }
        if (c === '"' || c === "'" || c === "`") { q = c; out += c; i++; continue; }
        if (c === "/" && n === "/") { while (i < src.length && src[i] !== "\n") { out += " "; i++; } continue; }
        if (c === "/" && n === "*") {
            const endIdx = src.indexOf("*/", i + 2);
            const stop = endIdx === -1 ? src.length : endIdx + 2;
            out += src.slice(i, stop).replace(/[^\n]/g, " ");
            i = stop;
            continue;
        }
        out += c; i++;
    }
    return out;
}

/** "style={" sonrası dengeli süslü parantez içeriğini döndürür. */
function balanced(text, openIdx) {
    let depth = 0;
    for (let i = openIdx; i < text.length; i++) {
        if (text[i] === "{") depth++;
        else if (text[i] === "}") { depth--; if (depth === 0) return text.slice(openIdx + 1, i); }
    }
    return "";
}

const UNITLESS = /^(opacity|flex|flexGrow|flexShrink|zIndex|fontWeight|lineHeight|order|zoom|aspectRatio|gridRow|gridColumn|WebkitLineClamp|scale)$/;

function lintTsx(file) {
    const text = stripTsComments(readFileSync(file, "utf8"));
    // 1) style={…} nesneleri
    for (const m of text.matchAll(/style=\{/g)) {
        const inner = balanced(text, m.index + 6);
        const objStart = m.index + 6;
        for (const p of inner.matchAll(/["']?([\w-]+)["']?\s*:\s*([^,}\n]+)/g)) {
            const prop = p[1], val = p[2].trim();
            const line = lineAt(text, objStart + p.index);
            if (prop.startsWith("--")) continue; // çalışma anı değeri CSS değişkenine veriliyor
            if (/^-?\d*\.?\d+$/.test(val) && Number(val) !== 0 && !UNITLESS.test(prop))
                add(file, line, "ham uzunluk (React sayı = px)", `${prop}: ${val}`);
            const lit = val.match(/^["'`](.*)["'`]$/);
            if (lit) {
                const cssProp = prop.replace(/[A-Z]/g, c => "-" + c.toLowerCase());
                for (const [rule, snip] of scanValue(lit[1], {prop: cssProp})) add(file, line, rule, `${prop}: ${snip}`);
            }
        }
    }
    // 2) SVG fill/stroke/color öznitelikleri
    for (const m of text.matchAll(/\b(fill|stroke|color|stopColor|stop-color)=["']([^"']+)["']/g)) {
        const v = m[2];
        if (/^(currentColor|none|transparent|inherit)$/i.test(v) || v.startsWith("url(")) continue;
        add(file, lineAt(text, m.index), "ham renk (SVG özniteliği)", m[0]);
    }
    // 3) Herhangi bir string içindeki ham renk (href="#…" hariç)
    for (const m of text.matchAll(/(["'`])((?:\\.|(?!\1)[^\\])*)\1/g)) {
        const s = m[2];
        const prefix = text.slice(Math.max(0, m.index - 6), m.index);
        if (/href=$/.test(prefix)) continue;
        if (/^#[\w-]*$/.test(s) && /href|id/.test(prefix)) continue;
        for (const h of s.matchAll(RE.hex)) add(file, lineAt(text, m.index), "ham renk (string)", h[0]);
        for (const h of s.matchAll(RE.fn)) add(file, lineAt(text, m.index), "ham renk fonksiyonu (string)", h[0]);
    }
}

const files = walk(join(root, "src"));
for (const f of files) (f.endsWith(".css") ? lintCss : lintTsx)(f);

// Aynı satırdaki aynı bulguyu tekilleştir
const seen = new Set();
const uniq = findings.filter(f => {
    const k = `${f.file}:${f.line}:${f.rule}:${f.snippet}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
});

const byFile = {};
for (const f of uniq) byFile[f.file] = (byFile[f.file] ?? 0) + 1;
if (!summaryOnly) for (const f of uniq) console.log(`${f.file}:${f.line}: ${f.rule}: ${f.snippet}`);
console.log(`\nDosya başına bulgu:`);
for (const [k, v] of Object.entries(byFile).sort((a, b) => b[1] - a[1])) console.log(`  ${String(v).padStart(4)}  ${k}`);
console.log(`Toplam bulgu: ${uniq.length} (${files.length} dosya tarandı)`);
process.exit(uniq.length ? 1 : 0);
