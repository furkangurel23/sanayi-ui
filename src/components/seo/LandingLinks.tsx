/*
 * AÇILIŞ SAYFASI BAĞLANTI BÖLÜMÜ (005-seo-foundation, spec FR-010/FR-014) — sunucu bileşeni.
 *
 * "Honda ustaları – ilçelere göre: Etimesgut 6 · Çankaya 2 …" gibi sayılı bağlantı listeleri. İç
 * bağlantılar hem kullanıcıyı ilgili sayfaya götürür hem arama motorunun açılış sayfalarını keşfetmesini
 * sağlar. Yalnız VAR OLAN hedefler verilir (çağıran sayıya göre süzer); boş liste -> bölüm çizilmez.
 */
import Link from "next/link";

export type LandingLink = { href: string; label: string; count: number };

export default function LandingLinks({title, links, id}: { title: string; links: readonly LandingLink[]; id: string }) {
    if (links.length === 0) return null;
    return (
        <section className="stack-sm" aria-labelledby={id}>
            <h2 id={id} className="headline">{title}</h2>
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
