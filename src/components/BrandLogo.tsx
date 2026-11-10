/*
 * MARKA LOGOSU — ORİJİNAL RENKLİ LOGO (WebP), yoksa ilk-harf monogram'a düşer.
 *
 * KAYNAK: public/brands/<slug>.webp (car-logos-dataset'ten self-host, 38 marka).
 * Orijinaller 640–6000 px genişlikte PNG'lerdi (toplam ~3 MB) ama ekranda ~46 px
 * gösteriliyorlar. scripts/optimize-logos.sh hepsini en uzun kenarı 96 px (2x retina
 * için yeterli) olacak şekilde, şeffaflığı koruyarak WebP'ye çevirdi: logo başına
 * ~1–3 KB, toplam ~64 KB. Kutu ve stil aynı kaldığı için görünüm değişmedi.
 * Bunlar markaların GERÇEK RENKLİ logolarıdır (BMW mavi-beyaz, Toyota kırmızı...) —
 * tek renk siluet DEĞİL. Bu yüzden hiçbir renk filtresi UYGULANMAZ; olduğu gibi gösterilir.
 *
 * NEDEN Server Component + <img>? Sadece görüntüler (etkileşim yok) -> "use client" gerekmez.
 * next/image yerine düz <img>: logolar önceden küçültülmüş statik dosyalar; çalışma
 * zamanında yeniden boyutlandırmaya (/_next/image) gerek yok, sade kalır.
 *
 * Fallback: logosu olmayan markada (DS Automobiles, Togg) markanın baş harf(ler)i.
 */

// Logosu MEVCUT markaların slug'ları (public/brands/*.webp ile senkron).
const HAS_LOGO = new Set([
    "alfa-romeo", "audi", "bmw", "byd", "chery", "chevrolet", "citroen", "cupra",
    "dacia", "fiat", "ford", "honda", "hyundai", "jaguar", "jeep", "kia", "lada",
    "land-rover", "lexus", "mazda", "mercedes-benz", "mg", "mini", "mitsubishi",
    "nissan", "opel", "peugeot", "porsche", "renault", "seat", "skoda", "ssangyong",
    "subaru", "suzuki", "tesla", "toyota", "volkswagen", "volvo",
]);

/** Marka adını dosya slug'ına çevirir: "Mercedes-Benz" -> "mercedes-benz". */
function toSlug(name: string): string {
    return name
        .toLowerCase()
        .replace(/ç/g, "c").replace(/ğ/g, "g").replace(/ı/g, "i")
        .replace(/ö/g, "o").replace(/ş/g, "s").replace(/ü/g, "u").replace(/ë/g, "e")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
}

export default function BrandLogo({name, size = 46}: { name: string; size?: number }) {
    const slug = toSlug(name);
    const dim = {width: size, height: size};

    if (HAS_LOGO.has(slug)) {
        return (
            <span className="brand-logo brand-logo-img" style={dim} title={name}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/brands/${slug}.webp`} alt={`${name} logosu`} loading="lazy"
                     style={{maxWidth: "78%", maxHeight: "78%", objectFit: "contain"}}/>
            </span>
        );
    }

    // Fallback monogram: ilk harf (çok kelimeliyse ilk iki kelimenin baş harfleri).
    const initials = name.split(/\s+/).slice(0, 2).map(w => w[0]).join("").toUpperCase();
    return (
        <span className="brand-logo brand-logo-mono" style={dim} title={name} aria-label={name}>
            {initials}
        </span>
    );
}
