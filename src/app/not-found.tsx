/*
 * 404 SAYFASI — "bulunamadı" (Server Component).
 *
 * Öğrenme notları:
 *  - Kökteki not-found.tsx iki durumda gösterilir: (1) hiçbir rotayla eşleşmeyen
 *    adres (/rastgele), (2) herhangi bir yerde `notFound()` çağrıldığında
 *    (ör. providers/[id]/layout.tsx olmayan usta için). Her ikisinde de HTTP durum
 *    kodu 404'tür — arama motorları sayfayı "yok" olarak bilir.
 *  - Kök layout (Header + footer) bu sayfayı da sarar; burada yalnız içerik var.
 *  - metadata.title layout'taki "%s | Sanayi" şablonuna oturur -> "Bulunamadı | Sanayi".
 *  - 002: büyüteç emojisi yerine ortak EmptyState + Search ikonu; yeni stil yok.
 *  - T041: sayfanın h1'i doğrudan EmptyState başlığı (titleAs="h1") — eskiden ayrıca
 *    görünmez (sr-only) bir h1 kopyası vardı; tek başlık = tek doğruluk kaynağı.
 */
import type {Metadata} from "next";
import Link from "next/link";
import EmptyState from "@/components/EmptyState";
import {Search} from "@/components/icons";

export const metadata: Metadata = {title: "Bulunamadı"};

export default function NotFound() {
    return (
        <main className="container page">
            <EmptyState
                icon={<Search/>}
                titleAs="h1" // sayfanın ana başlığı (görünüm .empty-state-title'dan)
                title="Sayfa bulunamadı"
                description="Aradığın sayfa taşınmış, silinmiş ya da hiç var olmamış olabilir."
                action={<>
                    <Link href="/" className="btn btn-primary">Ana sayfa</Link>
                    <Link href="/providers" className="btn btn-outline">Ustaları keşfet</Link>
                </>}
            />
        </main>
    );
}
