/*
 * BAŞLIK ve AÇIKLAMA METİNLERİ — 005-seo-foundation (spec FR-004, FR-007, FR-010; research R9).
 *
 * Arama sonucunda görünen iki satır: başlık (<title>) ve açıklama (meta description). Google başlığı
 * ~60, açıklamayı ~160 karakterde keser; metinler bu bütçeye göre kurulur.
 *
 * Dükkan başlığı: "{ad} – {sanayi sitesi | ilçe} – {ilk marka}". Ad ASLA kısaltılmaz (aynı adlı
 * dükkanları ayıran ilçe/site eki); ekler 60 karakterlik bütçeye sığmıyorsa SONDAN düşer (önce marka,
 * sonra yer). Kök şablon sona " | Sanayi Defteri" ekler (layout.tsx) — bütçeye dahil değil.
 * Kullanıcı yorum metni/adı hiçbir metne girmez.
 */
import type {ProviderDetailDto} from "../types.ts";
import {industrialSiteOf} from "./industrialSites.ts";

export const TITLE_BUDGET = 60;
export const DESCRIPTION_MAX = 160;
const SEP = " – ";

type ShopText = Pick<ProviderDetailDto, "name" | "address" | "district" | "brands" | "categories" | "avgScore" | "ratingCount">;

/** Dükkan yeri: sanayi sitesi adı (varsa) yoksa ilçe. */
function placeOf(d: ShopText): string | null {
    return industrialSiteOf(d.address, d.district) ?? d.district ?? null;
}

export function shopTitle(d: ShopText): string {
    let title = d.name.trim();
    for (const extra of [placeOf(d), d.brands[0]?.name ?? null]) {
        if (!extra) continue;
        const next = title + SEP + extra;
        if (next.length > TITLE_BUDGET) break; // sığmayan ek ve ondan sonrakiler düşer
        title = next;
    }
    return title;
}

/** "Honda, Toyota, BMW +8" — en fazla `max` ad, kalan sayı "+N". */
function listWithMore(names: readonly string[], max: number): string {
    const shown = names.slice(0, max).join(", ");
    return names.length > max ? `${shown} +${names.length - max}` : shown;
}

/** Puanı Türkçe ondalıkla: 4.5 -> "4,5". */
function score(v: number): string {
    return (Math.round(v * 10) / 10).toLocaleString("tr-TR");
}

function clamp(text: string, max: number): string {
    if (text.length <= max) return text;
    return text.slice(0, max - 1).trimEnd() + "…";
}

export function shopDescription(d: ShopText): string {
    const site = industrialSiteOf(d.address, d.district);
    const where = [site, d.district, "Ankara"].filter(Boolean).join(", ");
    const parts: string[] = [where];
    if (d.categories.length) parts.push(listWithMore(d.categories.map((c) => c.name), 4));
    if (d.brands.length) parts.push(`Markalar: ${listWithMore(d.brands.map((b) => b.name), 3)}`);
    parts.push(d.ratingCount >= 1 && d.avgScore != null
        ? `Puan ${score(d.avgScore)} (${d.ratingCount} değerlendirme)`
        : "Henüz puanlanmadı");
    const core = parts.join(" · ") + ".";
    const tail = " Adres, telefon ve yorumlar.";
    return core.length + tail.length <= DESCRIPTION_MAX ? core + tail : clamp(core, DESCRIPTION_MAX);
}

export type LandingKind = "marka" | "kategori" | "ilce";

/** Açılış sayfası başlığı = H1 (contracts/ui-seo-routes.md). */
export function landingTitle(kind: LandingKind, subject: string, district?: string): string {
    if (kind === "ilce") return `${subject} oto sanayi ustaları`;
    return district ? `${subject} ustaları${SEP}${district}` : `Ankara ${subject} ustaları`;
}

/**
 * Açılış sayfası açıklaması (dükkan sayısını içerir). Türkçe bulunma eki (-'da/-'te) ünlü uyumu
 * istediği için yer adları ek almadan yazılır ("Ankara · Etimesgut"). Açıklama sayfada da GÖRÜNÜR
 * (alt başlık) -> kelime ortasında kesilmez: cümleler sırayla eklenir, 160'a sığmayan cümle düşer.
 */
export function landingDescription(kind: LandingKind, subject: string, count: number, district?: string, sites: readonly string[] = []): string {
    const where = district ? `Ankara · ${district}` : "Ankara";
    const cta = "Puanları, yorumları, adres ve telefonlarıyla karşılaştırın.";
    let sentences: string[];
    if (kind === "marka") {
        sentences = [`${where}: ${subject} araçlara bakan ${count} servis ve yedek parça dükkanı.`, cta];
    } else if (kind === "kategori") {
        sentences = [`${where}: ${subject} hizmeti veren ${count} usta ve dükkan.`, cta];
    } else {
        sentences = [`${subject} (Ankara) oto sanayisinde ${count} usta ve servis.`];
        if (sites.length) sentences.push(`Sanayi siteleri: ${sites.join(", ")}.`);
        sentences.push("Kategori ve markaya göre göz atın, puan ve yorumları karşılaştırın.");
    }
    let text = sentences[0];
    for (const next of sentences.slice(1)) {
        if (text.length + 1 + next.length > DESCRIPTION_MAX) break;
        text += " " + next;
    }
    return clamp(text, DESCRIPTION_MAX); // ilk cümle tek başına sığmazsa son çare
}
