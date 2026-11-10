"use client";

/*
 * ORTAK HATA EKRANI — tüm error.tsx dosyaları ve global-error bunu kullanır.
 *
 * Öğrenme notları:
 *  - error.tsx, Next'te bir React Error Boundary'dir: segmentteki (sayfa, iç içe
 *    layout'lar, loading) beklenmeyen hatayı yakalayıp bu yedek arayüzü gösterir.
 *    Error Boundary'ler tarayıcıda çalışmak zorunda -> "use client".
 *  - Eskiden 4 ayrı error.tsx aynı kodu kopyalıyordu; artık her biri yalnızca
 *    `export { default } from "@/components/RouteError"` satırıdır (tek tanım, DRY).
 *  - HAM HATA METNİNİ GÖSTERMİYORUZ: `error.message` geliştirmede sunucu hatasının
 *    gerçek metnini (ör. "GET /providers/5 failed: 500") içerebilir; kullanıcıya
 *    anlamsız, saldırgana bilgi verici. Sabit Türkçe mesaj gösterip ayrıntıyı
 *    console.error ile geliştiriciye bırakıyoruz.
 *  - `error.digest`: Next'in sunucu hatası için ürettiği kısa özet kimlik; sunucu
 *    loglarındaki kayıtla eşleştirmeye yarar. Gizli bilgi taşımaz, küçük yazıyla
 *    gösteriyoruz (destek talebinde işe yarar).
 *  - `error` tipi `unknown`: istemci bileşeninde `throw "metin"` gibi Error OLMAYAN
 *    bir değer fırlatılabilir. `digest` okumadan önce `instanceof Error` ile daraltıyoruz.
 *  - "Tekrar dene" -> `retry()` (Next 16.3+ kararlı API). İçeride
 *    `startTransition(() => { router.refresh(); reset(); })` yapar: önce SUNUCU
 *    verisini yeniden çeker, sonra hata durumunu temizleyip segmenti yeniden çizer.
 *    Sadece `reset()` sunucudan yeni veri istemez; geçici backend arızasından sonra
 *    aynı hatalı sonucu tekrar gösterirdi.
 *  - 002: uyarı emojisi yerine ortak EmptyState + Alert ikonu; role="alert" -> ekran okuyucu
 *    hata ekranını hemen duyurur. EmptyState bir Server Component dosyası ama hook/olay
 *    içermediği için client bileşenin içinden de import edilebilir (client pakete girer).
 */
import {useEffect} from "react";
import EmptyState from "@/components/EmptyState";
import {Alert} from "@/components/icons";

export default function RouteError({error, retry}: { error: unknown; retry: () => void }) {
    // Ayrıntıyı yalnız geliştirici konsoluna yaz (yan etki -> useEffect).
    useEffect(() => {
        console.error(error);
    }, [error]);

    // Error olmayan değerlerde digest yok; varsa (sunucu hatası) gösteririz.
    const digest = error instanceof Error ? (error as Error & { digest?: string }).digest : undefined;

    return (
        <main className="container page">
            <EmptyState
                role="alert"
                icon={<Alert/>}
                title="Bir şeyler ters gitti"
                description={<>
                    Sayfa yüklenirken bir sorun oluştu. Lütfen tekrar deneyin.
                    {digest && <span className="caption faint"><br/>Hata kodu: {digest}</span>}
                </>}
                action={<button type="button" onClick={() => retry()} className="btn btn-outline">Tekrar dene</button>}
            />
        </main>
    );
}
