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
 *    tıklama sayısı azalır). Tek metin alanı ad araması: Enter / "Ara" ile uygulanır.
 *  - 2026-11-11 düzeni: arama -> Kategori -> Marka -> İlçe (seçim listesi) -> Puan/Sıralama.
 *    Şehir kutusu kalktı (platform yalnız Ankara); eski `?city=` bağlantıları yine çalışır ve
 *    "Temizle"yi görünür kılar.
 *  - Puan filtresi min/max sayı kutusu yerine SEGMENTED hızlı seçimler:
 *    Tümü / 3+ / 1+ / Eksili — kullanıcıların %95'inin gerçek ihtiyacı bu.
 *  - Aktif filtre varsa "Temizle" görünür; yokken UI sade kalır.
 *
 * 002 görünümü: seçili segment (D10) yalnız zemin tonuyla değil, --accent KENAR ve
 * kalın yazıyla da belli olur (globals.css .seg [data-active]). Sıralama yönü ve
 * "Temizle" metin karakterleri yerine ikon (ArrowUp/ArrowDown, Close — FR-006).
 * Davranış ve URL'ler aynı (FR-017).
 *
 * Klavye (T041 inceleme düzeltmesi): puan ve sıralama segmentleri role="radiogroup"
 * olduğu için WAI-ARIA radyo grubu gibi davranır — ortak `useRovingRadio` hook'u:
 *  - Grup başına TEK sekme durağı (seçili segment); ok tuşları/Home/End segmentler
 *    arasında odağı gezdirir, Space/Enter seçer (= eskisi gibi URL'e yazar).
 *  - followFocus: false — ok tuşu SEÇMEZ, yalnızca odağı taşır. Neden: seçim burada
 *    bir sayfa gezintisi (router.push + `key` ile remount); her ok basışında gezinti
 *    hem pahalı olur hem de remount odağı kaybettirir. Ayrıntı hook'un yorumunda.
 *
 * 004 — AD ARAMASI (kartın ilk satırı, <form role="search">):
 *  - Neden <form>? Enter ve "Ara" düğmesi tarayıcının yerel gönderimini kullanır (mobilde klavyenin
 *    "Ara" tuşu da) — onKeyDown ile Enter yakalamaya gerek kalmaz. preventDefault ile sayfa yenilenmez,
 *    değer applyPatch ile URL'e yazılır (q + page=1).
 *  - Kural lib/searchText.ts'ten (backend ile birebir): tamamen boş gönderim aramayı kaldırır;
 *    kelimesiz metin ("a", "%") gezinti YAPMAZ, yalnız ipucu gösterir — gezinti FilterBar'ı remount
 *    edip ipucunu silerdi. Aynı arama tekrar gönderilirse de gezinti yok.
 *  - ODAK: `q` key'e girdiği için her arama gönderimi FilterBar'ı REMOUNT eder; odaktaki input DOM'dan
 *    kalkar ve odak <body>'ye düşerdi. Çözüm: arama gezintisi başlarken modül düzeyi değişkene HEDEF
 *    sorgu dizgisi yazılır; YENİ bileşenin mount effect'i adres çubuğu tam o hedefteyse arama kutusuna
 *    odaklanır ve değişkeni her durumda siler. Hedef karşılaştırması şunu önler: arama gezintisi yanıt
 *    gelmeden başka bir filtreyle geçilirse ya da iptal olursa, SONRAKİ ilgisiz bir mount odağı (mobilde
 *    klavyeyi) çalmaz. Diğer filtre/sıralama/Temizle yolları değişkeni zaten sıfırlar; geri/ileri hiç
 *    kurmaz. (autoFocus kullanılmaz: her ziyarette klavyeyi açar/odağı çalardı.)
 *  - İpucunun canlı bölgesi (aria-live="polite", sr-only) HER ZAMAN DOM'dadır, yalnız metni değişir:
 *    canlı bölge sonradan eklenirse ekran okuyucular ilk mesajı kaçırabilir. Görünür ipucu ayrıca çizilir.
 */

import {useRouter} from "next/navigation";
import type {IdName} from "@/lib/types";
import {type FormEvent, useEffect, useId, useRef, useState} from "react";
import {MAX_CHARS, searchTerms} from "@/lib/searchText";
import {DISTRICT_NAMES} from "@/lib/districts";
import {ArrowDown, ArrowUp, Close} from "@/components/icons";
import {useRovingRadio} from "@/lib/useRovingRadio";

export type FilterInitial = {
    /** Ad araması (004): server'da parseSearch'ten geçmiş kırpılmış metin; geçersiz/yoksa "". */
    q: string;
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

/*
 * Arama gönderimi sonrası remount'ta odağı arama kutusuna geri vermek için HEDEF sorgu dizgisi
 * (dosya başı "ODAK"); null = odaklanma. Modül düzeyi değişken: eski bileşen kaldırılıp yenisi kurulurken
 * ikisi arasında yaşayan tek yer (state/ref bileşenle birlikte ölür). Yalnız tarayıcıda (olay işleyicileri
 * ve effect'ler) okunur/yazılır; sunucuda modül yüklense de hiç dokunulmaz.
 */
let focusSearchFor: string | null = null;

/** Odak hedefini kur/sıfırla. Bileşen gövdesi modül değişkenine doğrudan atama YAPMAZ (React derleyicisinin
 *  "render saflığı" kuralı) — yalnız olay işleyicilerinden çağrılan bu küçük fonksiyonlar dokunur. */
function setFocusTarget(target: string | null) {
    focusSearchFor = target;
}

/** Hedefi okuyup TÜKETİR (her durumda null'a çeker); mount effect'inde bir kez kullanılır. */
function takeFocusTarget(): string | null {
    const target = focusSearchFor;
    focusSearchFor = null;
    return target;
}

const SORT_FIELDS = [
    {value: "avgScore", label: "Puan"},
    {value: "ratingCount", label: "Oy"},
    {value: "name", label: "İsim"},
] as const;

export default function FilterBar({brands, categories, initial}: Props) {
    const router = useRouter();

    // Kategori / marka / ilçe seçimleri ve segment'ler değişir değişmez URL'e gider (state yok).
    // 2026-11-11: serbest metin "Şehir" ve "İlçe" kutuları kalktı — platform yalnız Ankara (backend şehir
    // varsayılanı "ankara"), ilçe artık 25 ilçelik seçim listesi (yazım hatası/eşleşmeyen ilçe olmaz).

    // Ad araması (004): kutu "uncontrolled" (defaultValue) — değer yalnız gönderimde okunur.
    const searchId = useId();
    const searchRef = useRef<HTMLInputElement>(null);
    const [searchHint, setSearchHint] = useState("");

    // Remount sonrası odak (dosya başı "ODAK"): yalnız adres çubuğu arama gezintisinin hedefindeyse.
    // (StrictMode'un geliştirmedeki çift effect'i zararsız: ilki değişkeni tüketir, DOM düğümü aynıdır.)
    useEffect(() => {
        const target = takeFocusTarget();
        if (target !== null && window.location.search.slice(1) === target) searchRef.current?.focus();
    }, []);

    /**
     * Mevcut query'yi koruyarak verilen anahtarları günceller ve yönlendirir. Gidilen sorgu dizgisini
     * döndürür (arama yolu odak hedefi olarak kullanır). Her çağrı bekleyen odak hedefini SIFIRLAR:
     * araya giren her filtre gezintisi eski arama odağını geçersiz kılar (arama yolu sonra yeniden kurar).
     */
    const applyPatch = (patch: Record<string, string>): string => {
        setFocusTarget(null);
        const params = new URLSearchParams(window.location.search);
        for (const [k, v] of Object.entries(patch)) {
            if (v && v.trim() !== "") params.set(k, v);
            else params.delete(k);
        }
        params.set("page", "1"); // filtre değişince ilk sayfaya dön
        const qs = params.toString();
        router.push(`/providers?${qs}`);
        return qs;
    };

    /** Kelimesiz girdi ipucu. Önce boşaltılıp bir sonraki karede yeniden yazılır: aynı metin tekrar
     *  gönderildiğinde de canlı bölge değişir ve ekran okuyucu ipucunu yeniden okur. */
    const announceHint = (text: string) => {
        setSearchHint("");
        requestAnimationFrame(() => setSearchHint(text));
    };

    const submitSearch = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const value = (searchRef.current?.value ?? "").trim().slice(0, MAX_CHARS);
        if (value === "") {
            // Tamamen boş: aramayı kaldır (zaten yoksa gezinme).
            setSearchHint("");
            if (initial.q) setFocusTarget(applyPatch({q: ""}));
            return;
        }
        if (searchTerms(value).length === 0) {
            // Kelimesiz ("a", "%"): URL'e dokunma, yalnız ipucu (uygulanmış arama aynen kalır).
            announceHint("En az 2 harfli bir kelime yazın.");
            return;
        }
        setSearchHint("");
        if (value === initial.q) return; // aynı arama: gezinti yok
        setFocusTarget(applyPatch({q: value}));
    };

    const clearSearch = () => {
        setSearchHint("");
        setFocusTarget(applyPatch({q: ""})); // diğer filtreler korunur, sayfa 1
    };

    const applySort = (field: string, dir: "asc" | "desc") => {
        setFocusTarget(null); // araya giren gezinti bekleyen arama odağını geçersiz kılar
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

    // Radyo grubu klavye kalıbı (bkz. dosya başı "Klavye"). onSelect verilmez: ok tuşu
    // seçmediği için seçim (URL'e yazma) eskisi gibi düğmenin onClick'inde kalır.
    const scoreRadio = useRovingRadio({
        count: SCORE_PRESETS.length,
        selectedIndex: SCORE_PRESETS.findIndex(p => p.id === activePreset),
        followFocus: false,
    });
    const sortRadio = useRovingRadio({
        count: SORT_FIELDS.length,
        selectedIndex: SORT_FIELDS.findIndex(s => s.value === initial.sortField),
        followFocus: false,
    });

    const hasActiveFilter = Boolean(
        initial.q || initial.brandId || initial.categoryId || initial.city || initial.district ||
        initial.minScore || initial.maxScore
    );

    return (
        <div className="toolbar">
            <p className="toolbar-note">
                Tüm alanlar isteğe bağlı — boş bıraktıkların filtrelenmez, hepsi boşsa bütün ustalar listelenir.
            </p>

            {/* Ad araması (004): Enter / "Ara" ile uygulanır; kendi temizleme düğmesi diğer filtreleri korur */}
            <form className="toolbar-field" role="search" aria-label="Dükkan ara" onSubmit={submitSearch}>
                <label className="toolbar-label" htmlFor={searchId}>Dükkan adı</label>
                <div className="toolbar-search-row">
                    <input
                        ref={searchRef}
                        id={searchId}
                        type="search"
                        name="q"
                        className="input"
                        placeholder="Ör. Hondacı Kadir Usta"
                        defaultValue={initial.q}
                        maxLength={MAX_CHARS}
                        autoComplete="off"
                        enterKeyHint="search"
                        aria-describedby={searchHint ? `${searchId}-hint` : undefined}
                        aria-invalid={searchHint ? true : undefined}
                        onChange={() => searchHint && setSearchHint("")}
                    />
                    {initial.q && (
                        <button type="button" className="btn btn-ghost" aria-label="Aramayı temizle" onClick={clearSearch}>
                            <Close size="sm"/>
                        </button>
                    )}
                    <button type="submit" className="btn btn-primary">Ara</button>
                </div>
                {/* Canlı bölge HER ZAMAN DOM'da (sr-only): sonradan eklenen bölgeyi ekran okuyucu kaçırabilir.
                    Görünür ipucu ayrı ve yalnız mesaj varken çizilir (boş satır boşluğu bırakmasın). */}
                <span className="sr-only" aria-live="polite">{searchHint}</span>
                {searchHint && <p id={`${searchId}-hint`} className="field-hint" aria-hidden="true">{searchHint}</p>}
            </form>

            {/*
              * Sıra (kullanıcı kararı 2026-11-11): önce NE iş (kategori), sonra HANGİ araç (marka), sonra NEREDE
              * (ilçe). Hiçbiri zorunlu değil — bunu ilk bakışta anlatan iki ipucu: kartın başındaki not ve her
              * seçimin boş seçeneğinin "Tüm …" diye yazılması ("Tümü" tek başına alanın ne olduğunu söylemiyordu).
              */}
            <div className="toolbar-row">
                <label className="toolbar-field">
                    <span className="toolbar-label">Kategori</span>
                    <select
                        className="select"
                        defaultValue={initial.categoryId}
                        onChange={e => applyPatch({categoryId: e.target.value})}
                    >
                        <option value="">Tüm kategoriler</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </label>

                <label className="toolbar-field">
                    <span className="toolbar-label">Marka</span>
                    <select
                        className="select"
                        defaultValue={initial.brandId}
                        onChange={e => applyPatch({brandId: e.target.value})}
                    >
                        <option value="">Tüm markalar</option>
                        {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                </label>

                <label className="toolbar-field">
                    <span className="toolbar-label">İlçe</span>
                    <select
                        className="select"
                        defaultValue={initial.district}
                        onChange={e => applyPatch({district: e.target.value})}
                    >
                        <option value="">Tüm ilçeler</option>
                        {DISTRICT_NAMES.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                </label>
            </div>

            <div className="toolbar-row toolbar-row-bottom">
                {/* Puan: segmented hızlı seçim */}
                <div className="toolbar-field">
                    <span className="toolbar-label">Puan</span>
                    <div className="seg" role="radiogroup" aria-label="Puan filtresi" {...scoreRadio.groupProps}>
                        {SCORE_PRESETS.map((p, i) => (
                            <button
                                key={p.id}
                                {...scoreRadio.getItemProps(i)}
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
                    <div className="cluster">
                        <div className="seg" role="radiogroup" aria-label="Sıralama alanı" {...sortRadio.groupProps}>
                            {SORT_FIELDS.map((s, i) => (
                                <button
                                    key={s.value}
                                    {...sortRadio.getItemProps(i)}
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
                            {initial.sortDir === "desc" ? <ArrowDown/> : <ArrowUp/>}
                        </button>
                    </div>
                </div>

                {/* Temizle: yalnızca aktif filtre varken görünür */}
                {hasActiveFilter && (
                    <button
                        type="button"
                        className="btn btn-ghost btn-sm toolbar-clear"
                        onClick={() => {
                            setFocusTarget(null);
                            router.push("/providers");
                        }}
                    >
                        <Close size="sm"/> Temizle
                    </button>
                )}
            </div>
        </div>
    );
}
