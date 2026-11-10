"use client";

/*
 * useRovingRadio — WAI-ARIA "Radio Group" klavye kalıbı için küçük, ortak hook.
 * Kullananlar: RateForm (puan seçici) ve FilterBar (puan / sıralama segmentleri).
 *
 * Kalıbın kuralları (https://www.w3.org/WAI/ARIA/apg/patterns/radio/):
 *  - TEK sekme durağı ("roving tabindex"): grupta yalnızca BİR öğe tabIndex=0 taşır,
 *    diğerleri -1. Tab grubun içine bir kez girer, bir kez çıkar.
 *    Sekme durağı = seçili öğe; hiç seçim yoksa İLK öğe.
 *  - Sağ/Aşağı ok sonraki, Sol/Yukarı ok önceki öğe (uçlarda başa/sona sarar);
 *    Home ilk, End son öğe. Odak o öğeye TAŞINIR (.focus()).
 *
 * İki kip (followFocus):
 *  - true (varsayılan, RateForm): "seçim odağı izler" — ok tuşu odağı taşır VE değeri seçer.
 *    Seçim ucuz (yalnızca yerel state) olduğunda APG'nin önerdiği klasik davranış.
 *  - false (FilterBar): ok tuşu yalnızca odağı taşır; seçim Space/Enter (veya tıklama)
 *    ile yapılır — düğmenin doğal "click"i. Neden? FilterBar'da seçim = URL'e yaz +
 *    sunucuda yeniden render + bileşenin `key` ile REMOUNT olması. Her ok basışında
 *    bir sayfa gezintisi hem pahalı olur hem de remount odağı kaybettirir (klavye
 *    kullanıcısı ikinci oka basamaz). Bu kipte sekme durağı odaklanan öğeyi izler;
 *    odak gruptan çıkınca yeniden seçili öğeye döner.
 *
 * Öğrenme notları:
 *  - useRef<Array<HTMLElement | null>>([]): düğmelerin DOM referansları dizisi. Ref
 *    callback'i (`ref={el => ...}`) her öğeyi kendi indeksine yazar; klavyeyle seçilen
 *    öğeye .focus() çağırmak için gerekir (React'te DOM'a imperatif erişim = ref).
 *  - Hook bir "props üreticisi" döndürür (getItemProps(i)): bileşen bunları düğmeye
 *    {...spread} ile verir. Böylece klavye mantığı tek yerde, iki bileşen aynı davranır.
 *  - Seçimin KENDİSİ (state'e yazmak mı, URL'e yazmak mı) hook'un işi değil;
 *    çağıran onSelect(index) ile karar verir.
 */
import type React from "react";
import {useRef, useState} from "react";

type Options = {
    /** Gruptaki öğe sayısı. */
    count: number;
    /** Seçili öğenin indeksi; seçim yoksa -1 (veya null). */
    selectedIndex: number | null;
    /** Ok tuşu bir öğeyi seçince çağrılır (yalnız followFocus kipinde gerekir). */
    onSelect?: (index: number) => void;
    /** true: ok tuşu seçer de (varsayılan). false: ok yalnızca odağı taşır. */
    followFocus?: boolean;
};

export function useRovingRadio({count, selectedIndex, onSelect, followFocus = true}: Options) {
    const refs = useRef<Array<HTMLElement | null>>([]);
    // Yalnız followFocus=false kipinde kullanılır: odağın şu an grupta durduğu öğe.
    const [focusIndex, setFocusIndex] = useState<number | null>(null);

    const selected = selectedIndex !== null && selectedIndex >= 0 ? selectedIndex : null;
    // Sekme durağı: (manuel kipte) odaklanan öğe ?? seçili öğe ?? ilk öğe.
    const tabStop = (followFocus ? null : focusIndex) ?? selected ?? 0;

    const onKeyDown = (e: React.KeyboardEvent, index: number) => {
        let next: number | null = null;
        if (e.key === "ArrowRight" || e.key === "ArrowDown") next = (index + 1) % count;
        else if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = (index - 1 + count) % count;
        else if (e.key === "Home") next = 0;
        else if (e.key === "End") next = count - 1;
        if (next === null) return;
        e.preventDefault(); // ok/Home/End sayfayı kaydırmasın
        if (followFocus) onSelect?.(next); // ?. -> verilmediyse hiçbir şey yapma
        else setFocusIndex(next);
        refs.current[next]?.focus();
    };

    /** Grubu saran öğeye (role="radiogroup") verilir: odak gruptan çıkınca durak seçiliye döner. */
    const groupProps = {
        onBlur: (e: React.FocusEvent<HTMLElement>) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocusIndex(null);
        },
    };

    /** Her radyo düğmesine {...getItemProps(i)} ile verilir. */
    const getItemProps = (index: number) => ({
        ref: (el: HTMLElement | null) => {
            refs.current[index] = el;
        },
        tabIndex: index === tabStop ? 0 : -1,
        onKeyDown: (e: React.KeyboardEvent) => onKeyDown(e, index),
    });

    return {groupProps, getItemProps};
}
