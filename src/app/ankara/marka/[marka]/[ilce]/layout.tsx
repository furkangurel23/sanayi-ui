/*
 * 404 KARARI (005-seo-foundation): sayfada DEĞİL layout'ta — Suspense/akış başlamadan önce gerçek HTTP
 * 404 (UI anayasası I; ayrıntı providers/[id]/layout.tsx). Sayım özeti hatası fırlatılır -> 5xx.
 */
import type {ReactNode} from "react";
import {notFound} from "next/navigation";
import {breakdownCount, findBrand, findDistrict} from "@/lib/seo/landing";
import {landingIndex} from "../../../_lib/landing";

export default async function Layout({children, params}: { children: ReactNode; params: Promise<{ marka: string; ilce: string }> }) {
    const p = await params;
    const ix = await landingIndex();
    const f = findBrand(ix, p.marka);
    const d = findDistrict(ix, p.ilce);
    // Dükkanı olmayan kombinasyon da 404 (spec FR-009); üst segmentin layout'u markayı zaten denetledi.
    if (!f || !d || breakdownCount(ix, "marka", f.id, d.name) === 0) notFound();
    return children;
}
