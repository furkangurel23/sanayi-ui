"use client";

/*
 * useRevealOnReady — açılan bir ayrıntı panelini GÖRÜNÜR yapıp odağı başlığına taşıyan hook (003).
 *
 * Neden? Yönetici kuyruklarında (öneriler, sahiplenme talepleri) "İncele" düğmesi ayrıntı
 * panelini listenin ÜSTÜNDE açar. Sayfa kaydırılmış durumdaysa panel ekran dışında kalır ve
 * klavye/ekran okuyucu kullanıcısı panelin açıldığını fark etmez. Bu hook, panelin verisi ilk kez
 * hazır olduğunda (veri ya da hata geldiğinde) paneli kaydırarak görünür yapar ve odağı başlığa
 * (tabIndex=-1) taşır; başlık henüz yoksa (ör. hata durumu) panelin kendisine.
 *
 * Öğrenme notları:
 *  - Neden `useEffect`? Odak ve kaydırma DOM'a dokunan "yan etki"lerdir; DOM ancak commit'ten
 *    sonra hazırdır -> effect içinde yapılır (render sırasında DOM'a dokunulmaz).
 *  - `done` ref'i: yalnız İLK hazır oluşta çalışsın (ör. karar sonrası `reload()` ikinci kez
 *    veri getirdiğinde kullanıcının odağını tekrar kaçırmayalım). Panel başka bir kayıt için
 *    açılınca çağıran taraf `key={id}` ile bileşeni yeniden kurar -> ref sıfırlanır.
 *  - `focus({preventScroll: true})`: kaydırmayı `scrollIntoView({block: "start"})` ile biz
 *    yapıyoruz (panelin üstü + "Ayrıntıyı kapat" düğmesi görünsün); odak ayrıca kaydırmasın.
 *    Sabit üst barın altında kalmaması için CSS'te `.review-panel { scroll-margin-top }` var.
 *  - Davranış AÇIKÇA "instant": `html { scroll-behavior: smooth }` varsayılanı burada işe yaramaz —
 *    panelin altındaki harita parçası yüklenip yükseklik değiştikçe tarayıcının kaydırma
 *    çapası (scroll anchoring) süren yumuşak kaydırmayı yarıda bırakabiliyor (ölçüldü: panel
 *    ekranın 1400 px üstünde kaldı). Anlık kaydırma bu yarışı yaşamaz ve `prefers-reduced-motion`
 *    ile de çakışmaz.
 */
import {type RefObject, useEffect, useRef} from "react";

export function useRevealOnReady(
    ready: boolean,
    headingRef: RefObject<HTMLElement | null>,
    containerRef: RefObject<HTMLElement | null>,
) {
    const done = useRef(false);
    useEffect(() => {
        if (!ready || done.current) return;
        done.current = true;
        containerRef.current?.scrollIntoView({block: "start", behavior: "instant"});
        (headingRef.current ?? containerRef.current)?.focus({preventScroll: true});
    }, [ready, headingRef, containerRef]);
}
