"use client";

/*
 * "BU DÜKKAN BENİM" BAĞLANTISI (003 / T114) — dükkan detayındaki ikincil eylem.
 * Oturum yoksa doğrudan giriş sayfasına `next` ile gider (giriş sonrası talep formu açılır);
 * oturum varsa talep formuna. Küçük client adacığı: detay sayfası Server Component kalır.
 * Sunucu ve ilk client render'ı aynı (oturumsuz) bağlantıyı çizer -> hidrasyon uyumlu;
 * useAuth hidrasyondan sonra gerçek durumu verir.
 *
 * Dükkanın SAHİBİ kendi dükkanına "Bu dükkan benim" demesin: oturum varsa sahip olunan
 * dükkanlar (`GET /api/owner/providers`; kişiye özel veri -> tarayıcıdan, useAuthedData)
 * çekilir; bu dükkan listedeyse bağlantı "Dükkanı düzenle"ye (sahip düzenleme sayfası) dönüşür.
 * Liste gelene kadar mevcut bağlantı kalır; yanıt gecikse de en kötü ihtimalle talep formu
 * açılır — form da sahipliği AÇILIŞTA kontrol eder (ClaimForm).
 * `key` e-postayı taşır: hesap değişince (çıkış / başka kullanıcı) liste yeniden çekilir;
 * `null` = oturum yok -> istek hiç atılmaz.
 */
import Link from "next/link";
import {useAuth} from "@/lib/useAuth";
import {useAuthedData} from "@/lib/useAuthedData";
import {ownerProviders} from "@/lib/accountApi";
import {Shield} from "@/components/icons";

export default function ClaimLink({providerId}: { providerId: number }) {
    const user = useAuth();
    const owned = useAuthedData(user ? `owned-providers:${user.email}` : null, ownerProviders);
    const isOwner = user !== null && (owned.data?.some(o => o.providerId === providerId) ?? false);

    if (isOwner) {
        return (
            <Link href={`/account/providers/${providerId}/edit`} className="btn btn-ghost btn-sm claim-link">
                <Shield size="sm"/> Dükkanı düzenle
            </Link>
        );
    }

    const target = `/providers/${providerId}/claim`;
    return (
        <Link href={user ? target : `/login?next=${encodeURIComponent(target)}`} className="btn btn-ghost btn-sm claim-link">
            <Shield size="sm"/> Bu dükkan benim
        </Link>
    );
}
