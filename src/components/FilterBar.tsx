"use client";

/*
 * FİLTRE ÇUBUĞU v2 — "URL'e yaz, server yeniden çeksin" deseni, 2026 görünümü.
 *
 * VERİ AKIŞI (Next 16'ya en uygun kalıp — useSearchParams YOK):
 *  - Başlangıç değerleri SERVER sayfadan prop olarak gelir (server zaten
 *    searchParams'ı okuyor; client'ta hook ile tekrar okumak hem gereksiz
 *    hem de Suspense zorunluluğu doğuruyor).
 *  - Değişiklikler TIKLAMA/SEÇİM ANINDA window.location.search'ten mevcut
 *    query kopyalanarak URL'e yazılır -> router.push -> server yeni veriyle render.
 *  - Geri/ileri senkronu: sayfa bileşene URL'den türetilmiş bir `key` verir;
 *    URL değişince bileşen REMOUNT olur, state yeni initial'lardan başlar
 *    (React'in resmî "key ile state resetleme" kalıbı — useEffect senkronundan temiz).
 *
 * UX kararları (modern filtre deseni):
 *  - Select/segment değişince filtre ANINDA uygulanır ("Uygula" butonu yok —
 *    tıklama sayısı azalır). Metin alanları Enter veya odak kaybında uygulanır.
 *  - Puan filtresi min/max sayı kutusu yerine SEGMENTED hızlı seçimler:
 *    Tümü / 3+ / 1+ / Eksili — kullanıcıların %95'inin gerçek ihtiyacı bu.
 *  - Aktif filtre varsa "Temizle" görünür; yokken UI sade kalır.
 */

import {useRouter} from "next/navigation";
import type {IdName} from "@/lib/types";
import {useState} from "react";

export type FilterInitial = {
    brandId: string;
    categoryId: string;
    city: string;
    district: string;
    minScore: string;
    maxScore: string;
    sortField: string;
    sortDir: "asc" | "desc";
};

type Props = {
    brands: IdName[];
    categories: IdName[];
    initial: FilterInitial;
};

/** Puan hızlı seçimleri: id -> URL'e yazılacak min/max değerleri. */
const SCORE_PRESETS = [
    {id: "all", label: "Tümü", min: "", max: ""},
    {id: "3plus", label: "3+", min: "3", max: ""},
    {id: "1plus", label: "1+", min: "1", max: ""},
    {id: "neg", label: "Eksili", min: "", max: "0"},
] as const;

const SORT_FIELDS = [
    {value: "avgScore", label: "Puan"},
    {value: "ratingCount", label: "Oy"},
    {value: "name", label: "İsim"},
] as const;

export default function FilterBar({brands, categories, initial}: Props) {
    const router = useRouter();

    // Metin alanları "controlled" kalır (yazarken URL'i bombalamamak için);
    // select/segment'ler ise değişir değişmez URL'e gider.
    const [city, setCity] = useState(initial.city);
    const [district, setDistrict] = useState(initial.district);

    /** Mevcut query'yi koruyarak verilen anahtarları günceller ve yönlendirir. */
    const applyPatch = (patch: Record<string, string>) => {
        const params = new URLSearchParams(window.location.search);
        for (const [k, v] of Object.entries(patch)) {
            if (v && v.trim() !== "") params.set(k, v);
            else params.delete(k);
        }
        params.set("page", "1"); // filtre değişince ilk sayfaya dön
        router.push(`/providers?${params.toString()}`);
    };

    const applySort = (field: string, dir: "asc" | "desc") => {
        const params = new URLSearchParams(window.location.search);
        // Spring formatı: sort=alan,yon (+ stabil ikincil sıralamalar)
        params.delete("sort");
        params.append("sort", `${field},${dir}`);
        if (field !== "ratingCount") params.append("sort", "ratingCount,desc");
        if (field !== "id") params.append("sort", "id,asc");
        params.set("page", "1");
        router.push(`/providers?${params.toString()}`);
    };

    // Aktif puan preset'i initial'daki min/max'ten türetilir (state tutmaya gerek yok).
    const activePreset = SCORE_PRESETS.find(p => p.min === initial.minScore && p.max === initial.maxScore)?.id ?? null;

    const hasActiveFilter = Boolean(
        initial.brandId || initial.categoryId || initial.city || initial.district ||
        initial.minScore || initial.maxScore
    );

    return (
        <div className="toolbar">
            <div className="toolbar-row">
                {/* Marka */}
                <label className="toolbar-field">
                    <span className="toolbar-label">Marka</span>
                    <select
                        className="select"
                        defaultValue={initial.brandId}
                        onChange={e => applyPatch({brandId: e.target.value})}
                    >
                        <option value="">Tümü</option>
                        {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                </label>

                {/* Kategori */}
                <label className="toolbar-field">
                    <span className="toolbar-label">Kategori</span>
                    <select
                        className="select"
                        defaultValue={initial.categoryId}
                        onChange={e => applyPatch({categoryId: e.target.value})}
                    >
                        <option value="">Tümü</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </label>

                {/* Konum: Enter veya odak kaybında uygulanır */}
                <div className="toolbar-field">
                    <span className="toolbar-label">Konum</span>
                    <div className="row" style={{gap: "0.4rem"}}>
                        <input
                            className="input" placeholder="Şehir" value={city}
                            onChange={e => setCity(e.target.value)}
                            onBlur={() => city !== initial.city && applyPatch({city})}
                            onKeyDown={e => e.key === "Enter" && applyPatch({city})}
                        />
                        <input
                            className="input" placeholder="İlçe" value={district}
                            onChange={e => setDistrict(e.target.value)}
                            onBlur={() => district !== initial.district && applyPatch({district})}
                            onKeyDown={e => e.key === "Enter" && applyPatch({district})}
                        />
                    </div>
                </div>
            </div>

            <div className="toolbar-row toolbar-row-bottom">
                {/* Puan: segmented hızlı seçim */}
                <div className="toolbar-field">
                    <span className="toolbar-label">Puan</span>
                    <div className="seg" role="radiogroup" aria-label="Puan filtresi">
                        {SCORE_PRESETS.map(p => (
                            <button
                                key={p.id}
                                type="button"
                                role="radio"
                                aria-checked={activePreset === p.id}
                                data-active={activePreset === p.id}
                                onClick={() => applyPatch({minScore: p.min, maxScore: p.max})}
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Sıralama: segmented alan + yön düğmesi */}
                <div className="toolbar-field">
                    <span className="toolbar-label">Sıralama</span>
                    <div className="row" style={{gap: "0.4rem"}}>
                        <div className="seg" role="radiogroup" aria-label="Sıralama alanı">
                            {SORT_FIELDS.map(s => (
                                <button
                                    key={s.value}
                                    type="button"
                                    role="radio"
                                    aria-checked={initial.sortField === s.value}
                                    data-active={initial.sortField === s.value}
                                    onClick={() => applySort(s.value, initial.sortDir)}
                                >
                                    {s.label}
                                </button>
                            ))}
                        </div>
                        <button
                            type="button"
                            className="btn btn-outline btn-icon"
                            title={initial.sortDir === "desc" ? "Azalan (tıkla: artan)" : "Artan (tıkla: azalan)"}
                            aria-label="Sıralama yönünü değiştir"
                            onClick={() => applySort(initial.sortField, initial.sortDir === "desc" ? "asc" : "desc")}
                        >
                            {initial.sortDir === "desc" ? "↓" : "↑"}
                        </button>
                    </div>
                </div>

                {/* Temizle: yalnızca aktif filtre varken görünür */}
                {hasActiveFilter && (
                    <button
                        type="button"
                        className="btn btn-ghost btn-sm toolbar-clear"
                        onClick={() => router.push("/providers")}
                    >
                        ✕ Temizle
                    </button>
                )}
            </div>
        </div>
    );
}
