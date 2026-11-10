"use client";

/*
 * "BU DÜKKAN BENİM" BAĞLANTISI (003 / T114) — dükkan detayındaki ikincil eylem.
 * Oturum yoksa doğrudan giriş sayfasına `next` ile gider (giriş sonrası talep formu açılır);
 * oturum varsa talep formuna. Küçük client adacığı: detay sayfası Server Component kalır.
 * Sunucu ve ilk client render'ı aynı (oturumsuz) bağlantıyı çizer -> hidrasyon uyumlu;
 * useAuth hidrasyondan sonra gerçek durumu verir.
 */
import Link from "next/link";
import {useAuth} from "@/lib/useAuth";
import {Shield} from "@/components/icons";

export default function ClaimLink({providerId}: { providerId: number }) {
    const user = useAuth();
    const target = `/providers/${providerId}/claim`;
    return (
        <Link href={user ? target : `/login?next=${encodeURIComponent(target)}`} className="btn btn-ghost btn-sm claim-link">
            <Shield size="sm"/> Bu dükkan benim
        </Link>
    );
}
