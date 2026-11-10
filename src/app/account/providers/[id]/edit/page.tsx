/*
 * DÜKKAN DÜZENLE — SAHİP (003 / T098). Sunucu sayfası:
 *  - `metadata` + `robots: {index: false}` (kişiye özel form, aramada çıkmasın),
 *  - `params.id` -> `parsePositiveId`; geçersizse `notFound()` (gerçek 404 — bu segmentte
 *    loading.tsx yok, akış başlamadan çağrılır; CLAUDE.md 404 kalıbı),
 *  - kategori/marka ADLARI ISR ile sunucuda çekilir ve prop iner (chip kümeleri + geçmişte
 *    id -> ad). Dükkanın kendisi kişiye özel (sahip yetkisi) -> client, Bearer ile çeker.
 */
import type {Metadata} from "next";
import {notFound} from "next/navigation";
import {parsePositiveId} from "@/lib/params";
import {getBrandsAllSorted, getCategoriesAllSorted} from "@/lib/api";
import EditOwnedProviderClient from "./EditOwnedProviderClient";

export const metadata: Metadata = {title: "Dükkanı düzenle", robots: {index: false}};

export default async function EditOwnedProviderPage({params}: { params: Promise<{ id: string }> }) {
    const {id: raw} = await params;
    const id = parsePositiveId(raw);
    if (id === undefined) notFound();
    const [categories, brands] = await Promise.all([getCategoriesAllSorted(), getBrandsAllSorted()]);
    return <EditOwnedProviderClient id={id} categories={categories} brands={brands}/>;
}
