/*
 * UYGULAMA SİMGELERİNİ ÜRET (tek seferlik bakım betiği) — "Sanayi Defteri" logosu (S1: defter + piston).
 *
 * Tek kaynak: src/app/icon.svg. Next.js App Router dosya kuralları:
 *  - src/app/icon.svg        -> <link rel="icon" type="image/svg+xml"> (modern tarayıcılar, her boyutta keskin)
 *  - src/app/favicon.ico     -> /favicon.ico (eski tarayıcılar, yer imleri; ICO içinde 16/32/48 px PNG)
 *  - src/app/apple-icon.png  -> <link rel="apple-touch-icon"> (iPhone "Ana Ekrana Ekle", 180 px)
 *  - public/icon-192.png, public/icon-512.png -> src/app/manifest.ts (Android ana ekran / PWA)
 * Logo değişirse: icon.svg'yi düzenle, sonra `node scripts/make-icons.mjs`.
 *
 * sharp NEXT.JS'İN KENDİ bağımlılığıdır (görsel optimizasyonu için zaten kurulu) — projeye yeni paket
 * eklenmez; bu betik uygulamanın çalışma zamanı parçası değildir.
 * ICO biçimi: modern tarayıcılar ICO içinde PNG görüntüyü kabul eder; başlık + dizin + PNG baytları elle
 * yazılır (ayrı bir ICO kütüphanesine gerek yok).
 */
import sharp from "sharp";
import {readFile, writeFile} from "node:fs/promises";

const svg = await readFile(new URL("../src/app/icon.svg", import.meta.url));
const png = size => sharp(svg, {density: 72 * size / 100 * 4}).resize(size, size).png().toBuffer();

async function ico(sizes) {
    const images = await Promise.all(sizes.map(png));
    const header = Buffer.alloc(6);
    header.writeUInt16LE(0, 0);            // ayrılmış
    header.writeUInt16LE(1, 2);            // tür: simge
    header.writeUInt16LE(sizes.length, 4); // görüntü sayısı
    const dir = Buffer.alloc(16 * sizes.length);
    let offset = 6 + dir.length;
    sizes.forEach((s, i) => {
        const e = i * 16;
        dir.writeUInt8(s >= 256 ? 0 : s, e);      // genişlik (256 = 0)
        dir.writeUInt8(s >= 256 ? 0 : s, e + 1);  // yükseklik
        dir.writeUInt16LE(1, e + 4);               // renk düzlemi
        dir.writeUInt16LE(32, e + 6);              // bit derinliği
        dir.writeUInt32LE(images[i].length, e + 8);
        dir.writeUInt32LE(offset, e + 12);
        offset += images[i].length;
    });
    return Buffer.concat([header, dir, ...images]);
}

await writeFile(new URL("../src/app/favicon.ico", import.meta.url), await ico([16, 32, 48]));
await writeFile(new URL("../src/app/apple-icon.png", import.meta.url), await png(180));
await writeFile(new URL("../public/icon-192.png", import.meta.url), await png(192));
await writeFile(new URL("../public/icon-512.png", import.meta.url), await png(512));
console.log("simgeler üretildi: favicon.ico (16/32/48), apple-icon.png (180), icon-192.png, icon-512.png");
