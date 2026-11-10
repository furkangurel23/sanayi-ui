"use client";

/*
 * DÜKKAN ÖNER — client kabuğu (003 / T106): AccountShell oturum ve e-posta doğrulamasını
 * denetler (oturumsuz -> "/login?next=/providers/suggest"); başarıda Önerilerim'e gidilir.
 */
import {useRouter} from "next/navigation";
import type {IdName} from "@/lib/types";
import AccountShell from "@/components/AccountShell";
import SuggestForm from "@/components/SuggestForm";

export default function SuggestPageClient({categories, brands}: { categories: IdName[]; brands: IdName[] }) {
    const router = useRouter();
    return (
        <AccountShell title="Dükkan öner" eyebrow="Katkı" nextPath="/providers/suggest"
                      subtitle="Listede olmayan bir dükkanı önerin. Yönetici inceledikten sonra yayına alınır.">
            {() => (
                <SuggestForm categories={categories} brands={brands}
                             onSubmitted={() => router.push("/account/suggestions?sent=1")}/>
            )}
        </AccountShell>
    );
}
