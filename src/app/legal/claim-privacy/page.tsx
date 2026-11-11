/*
 * KVKK AYDINLATMA METNİ — sahiplenme talebi (003 / T111). Statik Server Component:
 * veri çekmez; metin `src/content/claim-privacy-<sürüm>.ts`'ten, sürüm `lib/legal.ts`'ten.
 * Talep formu bu sayfaya YENİ SEKMEDE bağlanır (form taslağı kaybolmasın). Sürüm ve "TASLAK"
 * uyarısı görünür — hukuki onay verilene kadar metin şablondur.
 */
import type {Metadata} from "next";
import PageHeader from "@/components/PageHeader";
import {CLAIM_PRIVACY_DRAFT_NOTICE, CLAIM_PRIVACY_SECTIONS, CLAIM_PRIVACY_TITLE} from "@/content/claim-privacy-2026-11-10";
import {CLAIM_PRIVACY_VERSION} from "@/lib/legal";
import {pageMetadata} from "@/lib/seo/site";

// 005 SEO: "noindex, follow" (rota tablosu) — openGraph/robots YALNIZ pageMetadata ile (sığ birleşme tuzağı).
export const metadata: Metadata = pageMetadata({title: "Sahiplenme aydınlatma metni", description: "Dükkan sahiplenme başvurusunda işlenen kişisel veriler hakkında aydınlatma metni.", path: "/legal/claim-privacy", index: false});

export default function ClaimPrivacyPage() {
    return (
        <main className="container container-narrow page">
            <PageHeader eyebrow="KVKK" title={CLAIM_PRIVACY_TITLE} subtitle={`Sürüm: ${CLAIM_PRIVACY_VERSION}`}/>
            <div className="alert alert-info" role="note">{CLAIM_PRIVACY_DRAFT_NOTICE}</div>
            <article className="stack legal-text">
                {CLAIM_PRIVACY_SECTIONS.map(s => (
                    <section key={s.heading} className="stack-sm">
                        <h2 className="headline">{s.heading}</h2>
                        {s.paragraphs.map((p, i) => <p key={i} className="prose">{p}</p>)}
                        {s.items && (
                            <ul className="legal-list prose">
                                {s.items.map((it, i) => <li key={i}>{it}</li>)}
                            </ul>
                        )}
                    </section>
                ))}
            </article>
        </main>
    );
}
