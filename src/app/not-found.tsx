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
 *  - Yeni stil yok: mevcut .empty-state ve .btn sınıfları (tasarım sistemi).
 */
import type {Metadata} from "next";
import Link from "next/link";

export const metadata: Metadata = {title: "Bulunamadı"};

export default function NotFound() {
    return (
        <main className="container page">
            <div className="empty-state">
                <div style={{fontSize: "2rem"}} aria-hidden>🔍</div>
                <b>Sayfa bulunamadı</b>
                <span>Aradığın sayfa taşınmış, silinmiş ya da hiç var olmamış olabilir.</span>
                <div className="row" style={{justifyContent: "center", flexWrap: "wrap"}}>
                    <Link href="/" className="btn btn-primary">Ana sayfa</Link>
                    <Link href="/providers" className="btn btn-outline">Ustaları keşfet</Link>
                </div>
            </div>
        </main>
    );
}
