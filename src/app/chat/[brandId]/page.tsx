/*
 * SOHBET ODASI SAYFASI — dinamik segment ([brandId] klasör adı URL parametresi olur).
 *
 * Görev dağılımı:
 *  - BU dosya (Server Component): brandId'yi doğrular, marka adını bulur,
 *    generateMetadata ile sekme başlığını kurar; bulunamazsa notFound() -> 404 sayfası.
 *  - ChatRoom (Client Component): WebSocket, mesaj listesi, composer — tüm etkileşim.
 * Next 15+ notu: params da Promise'tir -> await edilir.
 * 002: kabuk boşluğu satır içi stil yerine .chat-page sınıfıyla.
 */
import {notFound} from "next/navigation";
import {getBrandsAllSorted} from "@/lib/api";
import ChatRoom from "@/components/ChatRoom";
import {pageMetadata} from "@/lib/seo/site";

export async function generateMetadata({params}: { params: Promise<{ brandId: string }> }) {
    const {brandId} = await params;
    const brands = await getBrandsAllSorted().catch(() => []);
    const brand = brands.find(b => b.id === Number(brandId));
    // 005 SEO: "noindex, follow" (rota tablosu) — openGraph/robots YALNIZ pageMetadata ile (sığ birleşme tuzağı).
    const title = brand ? `${brand.name} Odası` : "Sohbet";
    return pageMetadata({title, description: `${brand?.name ?? "Marka"} sohbet odası — Sanayi Defteri.`, path: `/chat/${brandId}`, index: false});
}

export default async function ChatRoomPage({params}: { params: Promise<{ brandId: string }> }) {
    const {brandId} = await params;
    const id = Number(brandId);
    if (!Number.isInteger(id) || id <= 0) notFound();

    const brands = await getBrandsAllSorted().catch(() => []);
    const brand = brands.find(b => b.id === id);
    if (!brand) notFound();

    return (
        <main className="container chat-page">
            <ChatRoom brandId={brand.id} brandName={brand.name}/>
        </main>
    );
}
