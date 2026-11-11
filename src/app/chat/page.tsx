/*
 * SOHBET ODALARI LİSTESİ — Server Component.
 * Her marka bir odadır; kartlar /chat/[brandId] dinamik rotasına götürür.
 * Liste ISR cache'inden gelir (markalar sık değişmez), odanın kendisi client'ta canlanır.
 *
 * 002: başlık ortak PageHeader; oda yoksa EmptyState (Chat ikonu); kartın sağındaki metin
 * oku yerine ChevronRight ikonu (FR-006). Satır içi stil kalmadı (.room-card-body,
 * .room-card-arrow). Kartın tamamı tek <Link>: büyük tıklama alanı, tek sekme durağı.
 */
import Link from "next/link";
import BrandLogo from "@/components/BrandLogo";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import {Chat, ChevronRight} from "@/components/icons";
import {getBrandsAllSorted} from "@/lib/api";
import {pageMetadata} from "@/lib/seo/site";

// 005 SEO: "noindex, follow" (rota tablosu) — openGraph/robots YALNIZ pageMetadata ile (sığ birleşme tuzağı).
export const metadata = pageMetadata({title: "Sohbet Odaları", description: "Her araba markası için bir sohbet odası: ustalar ve araç sahipleri konuşuyor.", path: "/chat", index: false});

export default async function ChatRoomsPage() {
    const brands = await getBrandsAllSorted().catch(() => []);

    return (
        <main className="container page">
            <PageHeader
                eyebrow="Topluluk"
                title="Marka sohbet odaları"
                subtitle={<>
                    Aynı markayı kullananlarla konuş: usta tavsiyesi al, deneyim paylaş, fotoğraf ve video gönder.
                    Odalara katılmak için üye girişi gerekir.
                </>}
            />

            {brands.length === 0 ? (
                <EmptyState icon={<Chat/>} title="Henüz oda yok."/>
            ) : (
                <div className="grid-3">
                    {brands.map(b => (
                        <Link key={b.id} href={`/chat/${b.id}`} className="card card-hover room-card">
                            <BrandLogo name={b.name} size={46}/>
                            <div className="room-card-body">
                                <div className="card-title truncate">{b.name}</div>
                                <div className="card-sub truncate">{b.name} kullananların odası</div>
                            </div>
                            <ChevronRight size="sm" className="room-card-arrow"/>
                        </Link>
                    ))}
                </div>
            )}
        </main>
    );
}
