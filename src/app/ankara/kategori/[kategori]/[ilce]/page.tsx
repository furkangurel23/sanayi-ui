/*
 * AÇILIŞ SAYFASI (005-seo-foundation). ISR: boş generateStaticParams = derlemede hiçbir sayfa üretilmez,
 * ilk istekte üretilip önbelleklenir; revalidate 3600 üst sınır (liste fetch'i 60 sn olduğundan etkin
 * tazelik ~60 sn). Görünüm ve kurallar: ../_lib/views.tsx.
 */
import type {Metadata} from "next";
import {notFound} from "next/navigation";
import {facetBreakdownView} from "../../../_lib/views";

export const revalidate = 3600;

export function generateStaticParams() {
    return [];
}

export async function generateMetadata({params}: { params: Promise<{ kategori: string; ilce: string }> }): Promise<Metadata> {
    const p = await params;
    return (await facetBreakdownView("kategori", p.kategori, p.ilce))?.meta ?? {};
}

export default async function Page({params}: { params: Promise<{ kategori: string; ilce: string }> }) {
    const p = await params;
    const view = await facetBreakdownView("kategori", p.kategori, p.ilce);
    if (!view) notFound(); // layout zaten 404 verdi; bu satır TypeScript daraltması
    return view.page;
}
