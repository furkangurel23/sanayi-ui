/*
 * ADMIN · DİKKAT KUYRUĞU (003 / T100) — URL-state kalıbı (anayasa II):
 *  - Sunucu `await searchParams` okur ve doğrular: `attention` (open|resolved — parseEnum),
 *    `district` (25 ilçe listesinde değilse yok sayılır), `q` (<2 karakterse yok sayılır),
 *    `page` (parsePage). Geçersiz değer backend'e GİTMEZ.
 *  - Değerler client bileşene PROP iner; bileşen URL'den türetilen `key` ile kurulur ->
 *    geri/ileri tuşunda URL değişince bileşen yeniden kurulur (state URL'den yeniden başlar).
 *  - Kuyruk verisi yönetici belirteci ister -> tarayıcıdan (Bearer, no-store) çekilir.
 */
import type {Metadata} from "next";
import {parseEnum, parsePage, parseQuery} from "@/lib/params";
import {parseDistrict} from "@/lib/districts";
import {getBrandsAllSorted, getCategoriesAllSorted} from "@/lib/api";
import AdminShell from "@/app/admin/AdminShell";
import AttentionClient from "./AttentionClient";

export const metadata: Metadata = {title: "Dikkat kuyruğu · Admin", robots: {index: false}};

export default async function AttentionPage({searchParams}: {
    searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
    const sp = await searchParams;
    const attention = parseEnum(sp.attention, ["open", "resolved"] as const, "open");
    const district = parseDistrict(sp.district);
    const q = parseQuery(sp.q);
    const page = parsePage(sp.page);
    const [categories, brands] = await Promise.all([getCategoriesAllSorted(), getBrandsAllSorted()]);
    return (
        <AdminShell>
            <AttentionClient key={`${attention}|${district ?? ""}|${q ?? ""}|${page}`}
                             attention={attention} district={district} q={q} page={page}
                             categories={categories} brands={brands}/>
        </AdminShell>
    );
}
