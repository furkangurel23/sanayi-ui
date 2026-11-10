/*
 * "BU DÜKKAN BENİM" (003 / T114) — sunucu sayfası.
 *
 * 404 kalıbı: dükkan var mı kontrolü ÜST segmentin `providers/[id]/layout.tsx`'inde yapılır
 * (loading sınırının dışında -> gerçek 404; sentetik/olmayan dükkan backend'de 404). Bu sayfa
 * yalnız adı okur — `getProviderDetail` React cache() ile sarılı, layout ile aynı istekte TEK
 * backend çağrısı. Form ve oturum client'ta (AccountShell + ClaimForm).
 */
import type {Metadata} from "next";
import {notFound} from "next/navigation";
import {getProviderDetail} from "@/lib/api";
import {parsePositiveId} from "@/lib/params";
import ClaimPageClient from "./ClaimPageClient";

export async function generateMetadata({params}: { params: Promise<{ id: string }> }): Promise<Metadata> {
    const id = parsePositiveId((await params).id);
    const detail = id === undefined ? null : await getProviderDetail(id).catch(() => null);
    return {title: detail ? `${detail.name} · Bu dükkan benim` : "Bu dükkan benim", robots: {index: false}};
}

export default async function ClaimPage({params}: { params: Promise<{ id: string }> }) {
    const id = parsePositiveId((await params).id);
    if (id === undefined) notFound();
    const detail = await getProviderDetail(id);
    if (!detail) notFound();
    return <ClaimPageClient providerId={id} providerName={detail.name}/>;
}
