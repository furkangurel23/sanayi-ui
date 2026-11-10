/*
 * ADMIN · ÖNERİ KUYRUĞU (003 / T108) — URL-state (anayasa II): sunucu `status` (PENDING
 * varsayılan | APPROVED | REJECTED | WITHDRAWN | ALL), `district` (25 ilçe), `q` (≥2), `page`
 * ve seçili öneri `id`'sini doğrular, client'a prop indirir; client URL'den türetilen `key`
 * ile kurulur (geri/ileri senkronu). Kategori/marka adları ISR (düzeltme formu için).
 * `key` YALNIZ filtreler + sayfadan türetilir; seçili `id` prop olarak iner ama key'e girmez:
 * "İncele"/"Ayrıntıyı kapat" kuyruğu yeniden kurmamalı (liste yeniden çekilip "Yükleniyor…"
 * yanıp sönüyor, odak gövdeye düşüyordu). Geri/ileri ile `id` değişimi yine prop'la yansır.
 */
import type {Metadata} from "next";
import {parseEnum, parsePage, parsePositiveId, parseQuery} from "@/lib/params";
import {parseDistrict} from "@/lib/districts";
import {getBrandsAllSorted, getCategoriesAllSorted} from "@/lib/api";
import AdminShell from "@/app/admin/AdminShell";
import AdminSuggestionsClient from "./AdminSuggestionsClient";

export const metadata: Metadata = {title: "Öneriler · Admin", robots: {index: false}};

const STATUSES = ["PENDING", "APPROVED", "REJECTED", "WITHDRAWN", "ALL"] as const;

export default async function AdminSuggestionsPage({searchParams}: {
    searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
    const sp = await searchParams;
    const status = parseEnum(sp.status, STATUSES, "PENDING");
    const district = parseDistrict(sp.district);
    const q = parseQuery(sp.q);
    const page = parsePage(sp.page);
    const selected = parsePositiveId(sp.id);
    const [categories, brands] = await Promise.all([getCategoriesAllSorted(), getBrandsAllSorted()]);
    return (
        <AdminShell>
            <AdminSuggestionsClient key={`${status}|${district ?? ""}|${q ?? ""}|${page}`}
                                    status={status} district={district} q={q} page={page} selected={selected}
                                    categories={categories} brands={brands}/>
        </AdminShell>
    );
}
