/*
 * MARKALAR — yükleniyor iskeleti (Suspense fallback'i).
 * Ortak SkeletonList: başlık + 2 sütun kart; markalar sayfasında harita/büyük blok
 * olmadığı için withBlock={false} (gerçek düzene yakın -> içerik gelince zıplama yok).
 */
import {SkeletonList} from "@/components/SkeletonBlocks";

export default function Loading() {
    return (
        <main className="container page">
            <SkeletonList count={6} withBlock={false}/>
        </main>
    );
}
