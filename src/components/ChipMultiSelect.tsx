"use client";

/*
 * ÇOKLU SEÇİM CHIP KÜMESİ (003) — kategori / marka seçimi (ProviderEditForm).
 *
 * - Her seçenek bir <button aria-pressed>: ekran okuyucu "basılı/basılı değil" der; seçili
 *   chip D10 kuralıyla gösterilir (zemin + --accent kenar + kalın yazı — yalnız renk değil).
 * - Üstte arama kutusu: yazdıkça liste süzülür (Türkçe harf duyarsız: `tr-TR`). Seçili olanlar
 *   süzgeçten bağımsız HEP görünür (seçimi kaybetmiş gibi görünmesin).
 * - Grup `role="group"` + `aria-labelledby` (alan başlığı); hata alanın ALTINDA, gruba
 *   `aria-describedby` ile bağlı.
 */
import {useId, useState} from "react";
import type {IdName} from "@/lib/types";
import {Check} from "@/components/icons";

type Props = {
    label: string;
    hint?: string;
    options: IdName[];
    selected: number[];
    onChange: (ids: number[]) => void;
    error?: string;
    errorId?: string;
    required?: boolean;
};

export default function ChipMultiSelect({label, hint, options, selected, onChange, error, errorId, required}: Props) {
    const id = useId();
    const [query, setQuery] = useState("");
    const q = query.trim().toLocaleLowerCase("tr-TR");
    const chosen = new Set(selected);
    const visible = options.filter(o => chosen.has(o.id) || !q || o.name.toLocaleLowerCase("tr-TR").includes(q));
    const errId = errorId ?? `${id}-err`;

    const toggle = (oid: number) =>
        onChange(chosen.has(oid) ? selected.filter(x => x !== oid) : [...selected, oid]);

    return (
        <div className="field">
            <span id={`${id}-label`} className="field-label">
                {label}{required && <span className="sr-only"> (zorunlu)</span>}
            </span>
            {hint && <span className="field-hint">{hint}</span>}
            <input className="input" type="search" placeholder={`${label} içinde ara`}
                   aria-label={`${label} içinde ara`} value={query}
                   onChange={e => setQuery(e.target.value)}/>
            <div className="chip-cluster chip-select" role="group" aria-labelledby={`${id}-label`}
                 aria-describedby={error ? errId : undefined}>
                {visible.map(o => {
                    const on = chosen.has(o.id);
                    return (
                        <button key={o.id} type="button" className="chip" aria-pressed={on} onClick={() => toggle(o.id)}>
                            {on && <Check size="sm"/>}{o.name}
                        </button>
                    );
                })}
                {visible.length === 0 && <span className="caption muted">Eşleşen yok.</span>}
            </div>
            <span className="caption muted" aria-live="polite">{selected.length} seçili</span>
            {error && <span id={errId} className="field-error">{error}</span>}
        </div>
    );
}
