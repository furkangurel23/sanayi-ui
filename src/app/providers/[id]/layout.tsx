/*
 * USTA DETAY LAYOUT'U — Server Component; tek işi "bu usta var mı?" kontrolü.
 *
 * Öğrenme notları:
 *  - Neden 404 kontrolü SAYFADA değil de LAYOUT'ta?
 *    Aynı klasördeki loading.tsx, Next tarafından sayfanın etrafına bir <Suspense>
 *    sınırı olarak sarılır. Suspense varsa Next yanıtı AKIŞ (streaming) ile gönderir:
 *    önce iskelet (loading) HTML'i 200 durum koduyla yola çıkar, sayfa sonra gelir.
 *    Sayfanın içinde notFound() çağrıldığında durum kodu çoktan "200" olarak
 *    gönderilmiştir -> ekranda "bulunamadı" görünür ama HTTP kodu 200 kalır
 *    (arama motorları için "soft 404"). Layout ise aynı segmentin loading sınırının
 *    ÜSTÜNDE çalışır: akış başlamadan önce beklenir, notFound() gerçek 404 üretir.
 *  - Neden `providers/(list)` route group'u gerekti?
 *    Liste sayfasının loading.tsx'i eskiden `providers/` kökündeydi. Bir loading
 *    dosyası kendi segmentinin altındaki TÜM iç içe layout'ları da sarar; yani bu
 *    layout da o Suspense'in içinde kalıyor ve aynı 200 sorunu yaşanıyordu.
 *    Parantezli klasör adı `(list)` URL'e eklenmez (/providers aynı kalır) ama liste
 *    dosyalarını [id]'nin "kardeşi" yapar -> bu layout artık hiçbir loading'in içinde değil.
 *  - getProviderDetail React cache() ile sarılı: burada, generateMetadata'da ve
 *    sayfada çağrılması TEK backend isteğine iner (istek içi tekilleştirme).
 *  - Next 15+: params bir Promise'tir -> await ile açılır.
 */
import type {ReactNode} from "react";
import {notFound} from "next/navigation";
import {getProviderDetail} from "@/lib/api";
import {parsePositiveId} from "@/lib/params";

export default async function ProviderLayout({
                                                 children,
                                                 params,
                                             }: {
    children: ReactNode;
    params: Promise<{ id: string }>;
}) {
    const {id: raw} = await params;

    // "abc", "0", "-1", "1.5" gibi id'ler hiç backend'e sorulmadan 404.
    const id = parsePositiveId(raw);
    if (id === undefined) notFound();

    // Backend 404 -> getProviderDetail null döner -> biz de 404 veririz.
    // (500/ağ hatası fırlatılır; providers/[id]/error.tsx değil, bir üst hata sınırı
    // — burada kök src/app/error.tsx — yakalar: error.tsx aynı segmentin layout'unu
    // SARMAZ, layout onun DIŞINDADIR.)
    const detail = await getProviderDetail(id);
    if (!detail) notFound();

    return children;
}
