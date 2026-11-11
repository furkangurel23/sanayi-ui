/*
 * "ANKARA'DA KEŞFET" BÖLÜMÜ (005-seo-foundation, spec FR-014) — ana sayfa ve Ustalar listesi.
 *
 * İlçe, marka ve kategori açılış sayfalarına sayılı bağlantılar: kullanıcı için kısa yol, arama
 * motoru için açılış sayfalarının keşif kapısı. Sayım özeti alınamadıysa (index null) bölüm HİÇ
 * çizilmez — sayfanın geri kalanı etkilenmez (research R11).
 * `limit`: marka/kategori başına en çok dükkanlı N hedef (ilçeler hep tam liste: ≤25).
 */
import {landingPath, type LandingIndex} from "@/lib/seo/landing";
import {landingTitle} from "@/lib/seo/text";
import LandingLinks from "@/components/seo/LandingLinks";

const byCount = <T extends { count: number; name: string }>(a: T, b: T) =>
    b.count - a.count || a.name.localeCompare(b.name, "tr");

export default function ExploreLinks({index, limit = 8}: { index: LandingIndex | null; limit?: number }) {
    if (!index) return null;
    const districts = [...index.districts.values()].sort(byCount);
    const brands = [...index.brands.values()].sort(byCount).slice(0, limit);
    const categories = [...index.categories.values()].sort(byCount).slice(0, limit);
    return (
        <section className="section stack" aria-labelledby="explore-title">
            <h2 id="explore-title" className="headline">Ankara&apos;da keşfet</h2>
            <LandingLinks id="explore-districts" title="İlçelere göre oto sanayi ustaları"
                          links={districts.map((d) => ({href: landingPath("ilce", d.slug), label: landingTitle("ilce", d.name), count: d.count}))}/>
            <LandingLinks id="explore-categories" title="Kategoriler"
                          links={categories.map((c) => ({href: landingPath("kategori", c.slug), label: landingTitle("kategori", c.name), count: c.count}))}/>
            <LandingLinks id="explore-brands" title="Markalar"
                          links={brands.map((b) => ({href: landingPath("marka", b.slug), label: landingTitle("marka", b.name), count: b.count}))}/>
        </section>
    );
}
