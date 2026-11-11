"use server";

/*
 * SERVER ACTION — dükkan değişikliğinden sonra ISR önbelleğini tazele (003 / T102, Next 16.4).
 *
 * Sorun: /providers listesi ve /brands ISR ile 60–300 sn önbellekte. Sahip/yönetici bir dükkanı
 * düzenleyince (ya da öneri onaylanınca) liste en geç 5 dk sonra güncellenirdi.
 * Çözüm: liste fetch'leri `next.tags` ile etiketli (lib/api.ts: "providers", "brands",
 * "categories"); bu eylem etiketleri `revalidateTag(tag, "max")` ile BAYAT işaretler ->
 * sonraki ziyaret eski sayfayı hemen alır, arka planda yenisi üretilir (stale-while-revalidate;
 * kimse bloklanmaz). Tek argümanlı `revalidateTag` Next 16'da kullanımdan kalktı.
 *
 * Güvenlik: Server Action herkesin çağırabileceği bir POST ucudur. Önbelleği keyfi biri
 * boşaltamasın diye önce çağıranın belirteciyle `GET /api/owner/providers/{id}` sorulur:
 * yalnız o dükkanın aktif sahibi veya yönetici 200 alır. Aksi (401/403/404) sessizce çıkılır.
 * Tüm hatalar YUTULUR: çağıranın kaydı zaten başarılıydı; önbellek tazelenemezse en geç
 * 5 dk sonra kendiliğinden tazelenir — kullanıcıya hata göstermeye değmez.
 *
 * Not: sunucu tarafında çalışır → `apiBase()` (006: canlıda iç ağ adresi API_INTERNAL_URL).
 */
import {revalidateTag} from "next/cache";
import {apiBase} from "@/lib/apiBase";


export async function revalidateProviderViews(providerId: number, token: string | null): Promise<void> {
    try {
        if (!token || !Number.isInteger(providerId) || providerId < 1) return;
        const res = await fetch(`${apiBase()}/owner/providers/${providerId}`, {
            headers: {Authorization: `Bearer ${token}`},
            cache: "no-store",
        });
        if (!res.ok) return;
        revalidateTag("providers", "max");
        revalidateTag("brands", "max");
        revalidateTag("categories", "max");
    } catch {
        // bilinçli olarak yutulur (bkz. dosya başı)
    }
}
