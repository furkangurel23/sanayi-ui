#!/usr/bin/env node
/*
 * KONTRAST DENETİMİ (002 / research D9) — bağımlılıksız Node betiği.
 *
 * Ne yapar?
 *  1) src/app/globals.css'ten iki temanın renk belirteçlerini okur:
 *       açık  = ilk `:root { ... }` bloğu
 *       koyu  = `:root[data-theme="dark"] { ... }` bloğu (açık değerlerin üstüne yazılır)
 *  2) OKLCH -> OKLab -> doğrusal sRGB -> sRGB (gama) dönüşümü yapar. Gamut dışı kanallar
 *     tarayıcının yaptığı gibi [0, 1] aralığına KIRPILIR.
 *  3) Alfa'lı belirteçleri (ör. --accent-soft `/ 0.16`) alttaki yüzeyle KARIŞTIRIR
 *     (tarayıcı gibi gama-kodlu sRGB'de "source-over" bileşimi).
 *  4) WCAG 2.x göreli parlaklık ve kontrast oranını tanımlı çiftler için ölçer;
 *     FR-002'nin sayısal maddelerini de denetler:
 *       - vurgu ailesi tek ton: --accent / --accent-text / --accent-soft / --ring hue'ları
 *         --accent'in hue'sundan en fazla ±5° sapar (renksiz olanlar — ör. beyaz --accent-fg — hariç);
 *       - katman kuralı: bg -> surface-1 -> surface-2 ardışık |ΔL| ∈ [0.02, 0.05]
 *         (--surface-glass bilerek HARİÇ: yarı saydam, altındaki içerikle değişir).
 *  5) --bg'nin HEX karşılığını yazdırır (src/app/theme.ts THEME_COLOR bununla eşleşmeli).
 *
 * Çıktı: tema başına tablo + eşik altı listesi. Eşik altı varsa çıkış kodu 1 (kapı olarak kullanılır).
 * Kullanım: node scripts/contrast-check.mjs
 */
import {readFileSync} from "node:fs";
import {fileURLToPath} from "node:url";
import {dirname, join} from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const cssPath = join(root, "src/app/globals.css");
const css = readFileSync(cssPath, "utf8").replace(/\/\*[\s\S]*?\*\//g, "");

/** Seçiciye ait İLK bloğun gövdesini döndürür (iç içe süslü parantez yok varsayımı: belirteç blokları düz). */
function blockBody(selectorRegex) {
    const m = css.match(selectorRegex);
    if (!m) throw new Error(`Blok bulunamadı: ${selectorRegex}`);
    return m[1];
}

/** "--ad: değer;" satırlarını sözlüğe çevirir. */
function parseVars(body) {
    const out = {};
    for (const m of body.matchAll(/(--[a-z0-9-]+)\s*:\s*([^;]+);/gi)) out[m[1]] = m[2].trim();
    return out;
}

const light = parseVars(blockBody(/(?:^|\})\s*:root\s*\{([^}]*)\}/));
const dark = {...light, ...parseVars(blockBody(/:root\[data-theme="dark"\]\s*\{([^}]*)\}/))};

/** var(--x) zincirini çözer (belirteç başka belirteci gösterebilir). */
function resolve(vars, name, depth = 0) {
    const v = vars[name];
    if (v === undefined) throw new Error(`Belirteç tanımsız: ${name}`);
    const ref = v.match(/^var\((--[a-z0-9-]+)\)$/i);
    if (ref && depth < 10) return resolve(vars, ref[1], depth + 1);
    return v;
}

/** "oklch(L C H / A)" -> {l, c, h, a}. L 0..1 ya da yüzde; A 0..1 ya da yüzde. */
function parseOklch(str) {
    const m = str.match(/^oklch\(\s*([\d.]+%?)\s+([\d.]+)\s+([\d.]+)(?:deg)?\s*(?:\/\s*([\d.]+%?))?\s*\)$/i);
    if (!m) throw new Error(`OKLCH çözümlenemedi: ${str}`);
    const pct = s => s.endsWith("%") ? parseFloat(s) / 100 : parseFloat(s);
    return {l: pct(m[1]), c: parseFloat(m[2]), h: parseFloat(m[3]), a: m[4] === undefined ? 1 : pct(m[4])};
}

/** OKLCH -> gama-kodlu sRGB [0..1] (kanal başına kırpılmış). Björn Ottosson'un OKLab matrisleri. */
function oklchToSrgb({l, c, h}) {
    const hr = (h * Math.PI) / 180;
    const A = c * Math.cos(hr), B = c * Math.sin(hr);
    const l_ = l + 0.3963377774 * A + 0.2158037573 * B;
    const m_ = l - 0.1055613458 * A - 0.0638541728 * B;
    const s_ = l - 0.0894841775 * A - 1.2914855480 * B;
    const L = l_ ** 3, M = m_ ** 3, S = s_ ** 3;
    const lin = [
        +4.0767416621 * L - 3.3077115913 * M + 0.2309699292 * S,
        -1.2684380046 * L + 2.6097574011 * M - 0.3413193965 * S,
        -0.0041960863 * L - 0.7034186147 * M + 1.7076147010 * S,
    ];
    const gamma = x => (x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055);
    return lin.map(x => Math.min(1, Math.max(0, gamma(Math.min(1, Math.max(0, x))))));
}

const luminance = rgb => {
    const lin = rgb.map(x => (x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4));
    return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
};
const ratio = (a, b) => {
    const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
    return (hi + 0.05) / (lo + 0.05);
};
/** Alfa'lı rengi alttaki opak rengin üstüne karıştırır (tarayıcı: gama-kodlu sRGB, source-over). */
const over = (top, alpha, under) => top.map((t, i) => t * alpha + under[i] * (1 - alpha));
const hex = rgb => "#" + rgb.map(x => Math.round(x * 255).toString(16).padStart(2, "0")).join("");

function themeReport(name, vars) {
    const raw = n => parseOklch(resolve(vars, n));
    /** Opak renk: alfa varsa verilen zeminle karıştırılır (varsayılan --bg). */
    const color = (n, under) => {
        const p = raw(n);
        const rgb = oklchToSrgb(p);
        if (p.a >= 1) return rgb;
        const base = under ?? color("--bg");
        return over(rgb, p.a, base);
    };

    const rows = [];
    /** Hata fırlatan hesaplamayı Error değerine çevirir (tanımsız belirteç raporlanabilsin). */
    const safe = fn => { try { return fn(); } catch (e) { return e; } };
    const check = (fg, bg, min, note = "", fgUnder) => {
        try {
            checkInner(fg, bg, min, note, fgUnder);
        } catch (e) {
            // Belirteç tanımsız (ör. eski CSS üzerinde "önce" koşusu) -> eşik altı say.
            rows.push({pair: `${fg} × ${Array.isArray(bg) ? bg[0] : bg}`, ratio: 0, min, ok: false, note: `${note} — ${e.message}`});
        }
    };
    const checkInner = (fg, bg, min, note, fgUnder) => {
        if (Array.isArray(bg) && bg[1] instanceof Error) throw bg[1];
        const bgRgb = Array.isArray(bg) ? bg[1] : color(bg);
        const bgName = Array.isArray(bg) ? bg[0] : bg;
        const fgRgb = color(fg, fgUnder ?? bgRgb);
        const r = ratio(fgRgb, bgRgb);
        rows.push({pair: `${fg} × ${bgName}`, ratio: r, min, ok: r >= min, note});
    };

    const surfaces = ["--bg", "--surface-1", "--surface-2"];
    // 1) Metin × yüzey ≥ 4.5
    for (const t of ["--fg", "--fg-muted", "--fg-faint", "--accent-text"])
        for (const s of surfaces) check(t, s, 4.5, "metin");
    // 2) fg × accent-soft (bg ve surface-1 üstünde karıştırılmış) ≥ 4.5 — seçili chip/seg metni
    for (const s of ["--bg", "--surface-1"]) {
        const soft = safe(() => color("--accent-soft", color(s)));
        check("--fg", [`--accent-soft@${s}`, soft], 4.5, "seçili zemin metni");
        // accent-text × accent-soft ≥ 4.5 — vurgu metni seçili zeminde
        check("--accent-text", [`--accent-soft@${s}`, soft], 4.5, "vurgu metni seçili zeminde");
    }
    // 3) pos/neg × bg/surface-1 ≥ 3 (grafik/ikon)
    for (const t of ["--pos", "--neg"]) for (const s of ["--bg", "--surface-1"]) check(t, s, 3, "anlam rengi (grafik)");
    // 4) Histogram çubukları (pos/neg/neutral) × surface-1 ≥ 3
    for (const t of ["--pos", "--neg", "--neutral"]) check(t, "--surface-1", 3, "histogram çubuğu");
    // 5) accent-fg × accent ≥ 4.5 (birincil buton metni)
    check("--accent-fg", "--accent", 4.5, "dolgu üstü metin");
    // 6) Kontrol kenarı ve odak halkası × yüzeyler ≥ 3 (WCAG 1.4.11)
    for (const t of ["--border-control", "--ring"]) for (const s of surfaces) check(t, s, 3, "arayüz bileşeni");
    // 7) pos/neg/neutral × kendi soft zemini (bg üstünde karıştırılmış) ≥ 4.5 — puan rozeti metni
    for (const t of ["--pos", "--neg", "--neutral"]) {
        const soft = safe(() => color(`${t}-soft`, color("--bg")));
        check(t, [`${t}-soft@--bg`, soft], 4.5, "rozet metni");
        // Rozet kart içinde de durur: surface-1 üstündeki karışım
        const soft1 = safe(() => color(`${t}-soft`, color("--surface-1")));
        check(t, [`${t}-soft@--surface-1`, soft1], 4.5, "rozet metni (kart)");
    }

    // FR-002: tek vurgu tonu (±5°)
    const accentHue = raw("--accent").h;
    const hueRows = ["--accent", "--accent-text", "--accent-soft", "--ring", "--accent-fg"].map(n => {
        const p = safe(() => raw(n));
        if (p instanceof Error) return {n, h: NaN, c: NaN, achromatic: false, ok: false, d: NaN};
        const achromatic = p.c < 0.02; // beyaz/gri: tonu anlamsız
        const d = Math.abs(((p.h - accentHue + 540) % 360) - 180);
        return {n, h: p.h, c: p.c, achromatic, ok: achromatic || d <= 5, d};
    });
    // FR-002: katman |ΔL|
    const layers = surfaces.map(n => ({n, l: safe(() => raw(n).l)}));
    const layerRows = [];
    for (let i = 1; i < layers.length; i++) {
        const d = Math.abs(Number(layers[i].l) - Number(layers[i - 1].l)); // tanımsızsa NaN -> eşik altı
        layerRows.push({pair: `${layers[i - 1].n} → ${layers[i].n}`, d, ok: d >= 0.02 - 1e-9 && d <= 0.05 + 1e-9});
    }

    console.log(`\n## Tema: ${name}  (--bg = ${hex(color("--bg"))} — src/app/theme.ts THEME_COLOR ile eşleşmeli)\n`);
    console.log("| Çift | Oran | Eşik | Durum | Not |");
    console.log("|---|---|---|---|---|");
    for (const r of rows) console.log(`| ${r.pair} | ${r.ratio.toFixed(2)} | ${r.min} | ${r.ok ? "✓" : "✗ EŞİK ALTI"} | ${r.note} |`);
    console.log("\nFR-002 vurgu tonu (±5°, accent hue = " + accentHue + "):");
    for (const h of hueRows) console.log(`  ${h.ok ? "✓" : "✗"} ${h.n} h=${h.h} c=${h.c}${h.achromatic ? " (renksiz, hariç)" : ` Δh=${h.d.toFixed(1)}°`}`);
    console.log("FR-002 katman |ΔL| ∈ [0.02, 0.05] (glass hariç):");
    for (const l of layerRows) console.log(`  ${l.ok ? "✓" : "✗"} ${l.pair} |ΔL|=${l.d.toFixed(3)}`);

    const fails = [
        ...rows.filter(r => !r.ok).map(r => `${name}: ${r.pair} = ${r.ratio.toFixed(2)} < ${r.min}`),
        ...hueRows.filter(h => !h.ok).map(h => `${name}: ${h.n} tonu ${h.d.toFixed(1)}° sapıyor (>5°)`),
        ...layerRows.filter(l => !l.ok).map(l => `${name}: katman ${l.pair} |ΔL|=${l.d.toFixed(3)} aralık dışı`),
    ];
    // En zayıf çift (kategori bazında özet için)
    const worst = {};
    for (const r of rows) if (!worst[r.note] || r.ratio < worst[r.note].ratio) worst[r.note] = r;
    console.log("\nKategori başına en zayıf çift:");
    for (const [k, r] of Object.entries(worst)) console.log(`  ${k}: ${r.pair} ${r.ratio.toFixed(2)} (eşik ${r.min})`);
    return fails;
}

const fails = [...themeReport("koyu", dark), ...themeReport("açık", light)];
console.log(`\nToplam eşik altı: ${fails.length}`);
for (const f of fails) console.log("  ✗ " + f);
process.exit(fails.length ? 1 : 0);
