"use client";

import {useRouter, useSearchParams} from "next/navigation";
import type {IdName} from "@/lib/types";
import {useEffect, useMemo, useState} from "react";

type Props = {
    brands: IdName[];
    categories: IdName[];
};

/*
*
* TODO sayfayi genel anlattir. useMemo nedir vs kod mantigini ogren
*
*       Neden client? Form state'i onChange/onClick gibi tarayici etkilesimleri var.
*       URLSearchParams kullanimi: filtereler URL'ye yazilir -> SSR sayfa bu parametrelerle yeniden veriyi ceker.
*
* */

const SORT_FIELDS = [
    {value: "avgScore", label: "Puan"},
    {value: "ratingCount", label: "Oy sayısı"},
    {value: "name", label: "İsim"},
    {value: "city", label: "Şehir"},
    {value: "district", label: "İlçe"},
    // Not: Kategori adına göre sort backend'de join gerektirir; şu an root alanlarla sınırlı
];

export default function FilterBar({brands, categories}: Props) {
    const router = useRouter();
    const sp = useSearchParams();

    const initial = useMemo(() => ({
        brandId: sp.get("brandId") ?? "",
        categoryId: sp.get("categoryId") ?? "",
        city: sp.get("city") ?? "",
        district: sp.get("district") ?? "",
        minScore: sp.get("minScore") ?? "",
        maxScore: sp.get("maxScore") ?? "",
        sortField: sp.getAll("sort")[0]?.split(",")[0] || sp.get("sortField") || "avgScore",
        sortDir: sp.getAll("sort")[0]?.split(",")[1] || sp.get("sortDir") || "desc",
    }), [sp]);

    const [brandId, setBrandId] = useState(initial.brandId);
    const [categoryId, setCategoryId] = useState(initial.categoryId);
    const [city, setCity] = useState(initial.city);
    const [district, setDistrict] = useState(initial.district);
    const [minScore, setMinScore] = useState(initial.minScore);
    const [maxScore, setMaxScore] = useState(initial.maxScore);
    const [sortField, setSortField] = useState(initial.sortField);
    const [sortDir, setSortDir] = useState<"asc" | "desc">(
        initial.sortDir === "asc" ? "asc" : "desc"
    );

    useEffect(() => {
        setBrandId(initial.brandId);
        setCategoryId(initial.categoryId);
        setCity(initial.city);
        setDistrict(initial.district);
        setMinScore(initial.minScore);
        setMaxScore(initial.maxScore);
        setSortField(initial.sortField);
        setSortDir(initial.sortDir === "asc" ? "asc" : "desc");
    }, [initial]);

    const apply = () => {
        const params = new URLSearchParams(sp.toString());

        const set = (k: string, v: string) => {
            if (v && v.trim() !== "") params.set(k, v);
            else params.delete(k);
        };

        set("brandId", brandId);
        set("categoryId", categoryId);
        set("city", city);
        set("district", district);
        set("minScore", minScore);
        set("maxScore", maxScore);

        // Çoklu sort gönder: seçilen + ikincil sıralamalar (stabil sonuç için)
        params.delete("sort");
        params.append("sort", `${sortField},${sortDir}`);

        // Aynı alan değilse ikincil olarak ratingCount ve id ekleyelim
        if (sortField !== "ratingCount") params.append("sort", "ratingCount,desc");
        if (sortField !== "id") params.append("sort", "id,asc");

        params.set("page", "1"); // filtre değişince başa dön
        router.push(`/providers?${params.toString()}`);
    };

    const clearAll = () => {
        router.push("/providers");
    };

    return (
        <div className="rounded-2xl border border-white/10 p-3 flex flex-col gap-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <select
                    value={brandId}
                    onChange={(e) => setBrandId(e.target.value)}
                    className="rounded-lg border border-white/20 bg-transparent px-3 py-2"
                >
                    <option value="">Marka (tümü)</option>
                    {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>

                <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="rounded-lg border border-white/20 bg-transparent px-3 py-2"
                >
                    <option value="">Kategori (tümü)</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>

                <div className="flex gap-2">
                    <input
                        placeholder="Şehir"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="flex-1 rounded-lg border border-white/20 bg-transparent px-3 py-2"
                    />
                    <input
                        placeholder="İlçe"
                        value={district}
                        onChange={(e) => setDistrict(e.target.value)}
                        className="flex-1 rounded-lg border border-white/20 bg-transparent px-3 py-2"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="flex gap-2">
                    <input
                        type="number" step="0.1" min={0} max={5}
                        placeholder="Min puan"
                        value={minScore}
                        onChange={(e) => setMinScore(e.target.value)}
                        className="flex-1 rounded-lg border border-white/20 bg-transparent px-3 py-2"
                    />
                    <input
                        type="number" step="0.1" min={0} max={5}
                        placeholder="Maks puan"
                        value={maxScore}
                        onChange={(e) => setMaxScore(e.target.value)}
                        className="flex-1 rounded-lg border border-white/20 bg-transparent px-3 py-2"
                    />
                </div>

                <div className="flex gap-2">
                    <select
                        value={sortField}
                        onChange={(e) => setSortField(e.target.value)}
                        className="flex-1 rounded-lg border border-white/20 bg-transparent px-3 py-2"
                    >
                        {SORT_FIELDS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                    <select
                        value={sortDir}
                        onChange={(e) => setSortDir(e.target.value as "asc" | "desc")}
                        className="w-28 rounded-lg border border-white/20 bg-transparent px-3 py-2"
                    >
                        <option value="desc">Desc</option>
                        <option value="asc">Asc</option>
                    </select>
                </div>

                <div className="flex gap-2">
                    <button onClick={apply} className="rounded-lg border border-white/30 px-3 py-2">
                        Uygula
                    </button>
                    <button onClick={clearAll} className="rounded-lg border border-white/10 px-3 py-2">
                        Temizle
                    </button>
                </div>
            </div>
        </div>
    );
}