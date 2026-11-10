"use client";

/*
 * Sahiplenme sayfası client kabuğu (003 / T114): AccountShell oturum + e-posta doğrulamasını
 * denetler (oturumsuz -> "/login?next=/providers/{id}/claim").
 */
import Link from "next/link";
import AccountShell from "@/components/AccountShell";
import ClaimForm from "@/components/ClaimForm";

export default function ClaimPageClient({providerId, providerName}: { providerId: number; providerName: string }) {
    return (
        <AccountShell title="Bu dükkan benim" nextPath={`/providers/${providerId}/claim`}
                      eyebrow={<Link href={`/providers/${providerId}`}>{providerName}</Link>}
                      subtitle="Dükkanın sahibi olduğunuzu gösteren belgeleri yükleyin. Yönetici onaylayınca dükkan bilgilerini ve çalışma saatlerini siz güncelleyebilirsiniz.">
            {() => <ClaimForm providerId={providerId} providerName={providerName}/>}
        </AccountShell>
    );
}
