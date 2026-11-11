/*
 * 404 KARARI (005-seo-foundation): sayfada DEĞİL layout'ta — Suspense/akış başlamadan önce gerçek HTTP
 * 404 (UI anayasası I; ayrıntı providers/[id]/layout.tsx). Sayım özeti hatası fırlatılır -> 5xx.
 */
import type {ReactNode} from "react";
import {notFound} from "next/navigation";
import {findCategory} from "@/lib/seo/landing";
import {landingIndex} from "../../_lib/landing";

export default async function Layout({children, params}: { children: ReactNode; params: Promise<{ kategori: string }> }) {
    const p = await params;
    const ix = await landingIndex();
    if (!findCategory(ix, p.kategori)) notFound();
    return children;
}
