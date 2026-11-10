/*
 * SOHBET ODALARI LİSTESİ — Server Component.
 * Her marka bir odadır; kartlar /chat/[brandId] dinamik rotasına götürür.
 * Liste ISR cache'inden gelir (markalar sık değişmez), odanın kendisi client'ta canlanır.
 */
import Link from "next/link";
import BrandLogo from "@/components/BrandLogo";
import {getBrandsAllSorted} from "@/lib/api";

export const metadata = {
    title: "Sohbet Odaları",
};

export default async function ChatRoomsPage() {
    const brands = await getBrandsAllSorted().catch(() => []);

    return (
        <main className="container page">
            <div className="stack-sm">
                <span className="eyebrow">Topluluk</span>
                <h1 className="section-title" style={{fontSize: "var(--text-2xl)"}}>Marka sohbet odaları</h1>
                <p className="muted text-sm" style={{maxWidth: "38rem"}}>
                    Aynı markayı kullananlarla konuş: usta tavsiyesi al, deneyim paylaş, fotoğraf ve video gönder.
                    Odalara katılmak için üye girişi gerekir.
                </p>
            </div>

            {brands.length === 0 ? (
                <div className="empty-state">Henüz oda yok.</div>
            ) : (
                <div className="grid-3">
                    {brands.map(b => (
                        <Link key={b.id} href={`/chat/${b.id}`} className="card card-hover room-card">
                            <BrandLogo name={b.name} size={46}/>
                            <div style={{minWidth: 0}}>
                                <div className="card-title truncate">{b.name}</div>
                                <div className="card-sub">{b.name} kullananların odası</div>
                            </div>
                            <span className="faint" style={{marginLeft: "auto"}} aria-hidden>→</span>
                        </Link>
                    ))}
                </div>
            )}
        </main>
    );
}
