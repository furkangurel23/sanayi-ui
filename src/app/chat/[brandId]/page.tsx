/*
 * SOHBET ODASI SAYFASI — dinamik segment ([brandId] klasör adı URL parametresi olur).
 *
 * Görev dağılımı:
 *  - BU dosya (Server Component): brandId'yi doğrular, marka adını bulur,
 *    generateMetadata ile sekme başlığını kurar; bulunamazsa notFound() -> 404 sayfası.
 *  - ChatRoom (Client Component): WebSocket, mesaj listesi, composer — tüm etkileşim.
 * Next 15+ notu: params da Promise'tir -> await edilir.
 */
import {notFound} from "next/navigation";
import {getBrandsAllSorted} from "@/lib/api";
import ChatRoom from "@/components/ChatRoom";

export async function generateMetadata({params}: { params: Promise<{ brandId: string }> }) {
    const {brandId} = await params;
    const brands = await getBrandsAllSorted().catch(() => []);
    const brand = brands.find(b => b.id === Number(brandId));
    return {title: brand ? `${brand.name} Odası` : "Sohbet"};
}

export default async function ChatRoomPage({params}: { params: Promise<{ brandId: string }> }) {
    const {brandId} = await params;
    const id = Number(brandId);
    if (!Number.isInteger(id) || id <= 0) notFound();

    const brands = await getBrandsAllSorted().catch(() => []);
    const brand = brands.find(b => b.id === id);
    if (!brand) notFound();

    return (
        <main className="container" style={{paddingBlock: "1rem", flex: 1}}>
            <ChatRoom brandId={brand.id} brandName={brand.name}/>
        </main>
    );
}
