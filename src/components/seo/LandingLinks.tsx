/*
 * AÇILIŞ SAYFASI BAĞLANTI BÖLÜMÜ (005-seo-foundation, spec FR-010/FR-014) — sunucu bileşeni.
 *
 * "Honda ustaları – ilçelere göre: Etimesgut 6 · Çankaya 2 …" gibi sayılı bağlantı listeleri. İç
 * bağlantılar hem kullanıcıyı ilgili sayfaya götürür hem arama motorunun açılış sayfalarını keşfetmesini
 * sağlar. Yalnız VAR OLAN hedefler verilir (çağıran sayıya göre süzer); boş liste -> bölüm çizilmez.
 */
import Link from "next/link";

export type LandingLink = { href: string; label: string; count: number };

/** `level`: başlık kademesi — tek başına bölümse h2, bir h2 bölümünün içindeyse h3 (ExploreLinks). */
export default function LandingLinks({title, links, id, level = 2}: {
    title: string; links: readonly LandingLink[]; id: string; level?: 2 | 3;
}) {
    if (links.length === 0) return null;
    const Heading = level === 3 ? "h3" : "h2";
    return (
        <section className="stack-sm" aria-labelledby={id}>
            <Heading id={id} className={level === 3 ? "card-title" : "headline"}>{title}</Heading>
            <ul className="cluster landing-links">
                {links.map((l) => (
                    <li key={l.href}>
                        <Link href={l.href} className="chip">
                            {l.label} <span className="muted">{l.count}</span>
                        </Link>
                    </li>
                ))}
            </ul>
        </section>
    );
}
