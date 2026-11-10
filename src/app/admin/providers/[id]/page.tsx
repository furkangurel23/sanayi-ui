/*
 * ADMIN · DÜKKAN DÜZENLE (003 / T099) — sunucu sayfası: metadata (robots kapalı), id
 * doğrulaması (`notFound()` — bu segmentte loading.tsx yok, gerçek 404), kategori/marka
 * adları ISR. Yetki kontrolü ve veri client'ta (AdminShell + Bearer) — admin ekranları
 * tarayıcıdan JWT ile çalışır.
 */
import type {Metadata} from "next";
import {notFound} from "next/navigation";
import {parsePositiveId} from "@/lib/params";
import {getBrandsAllSorted, getCategoriesAllSorted} from "@/lib/api";
import AdminShell from "@/app/admin/AdminShell";
import AdminProviderEditClient from "./AdminProviderEditClient";

export const metadata: Metadata = {title: "Dükkan düzenle · Admin", robots: {index: false}};

export default async function AdminProviderEditPage({params}: { params: Promise<{ id: string }> }) {
    const {id: raw} = await params;
    const id = parsePositiveId(raw);
    if (id === undefined) notFound();
    const [categories, brands] = await Promise.all([getCategoriesAllSorted(), getBrandsAllSorted()]);
    return (
        <AdminShell>
            <AdminProviderEditClient id={id} categories={categories} brands={brands}/>
        </AdminShell>
    );
}
