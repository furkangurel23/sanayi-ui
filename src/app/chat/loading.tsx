/*
 * SOHBET ODALARI — yükleniyor iskeleti (Suspense fallback'i).
 * Ortak SkeletonList: başlık + 3 sütun oda kartı (harita/büyük blok yok -> withBlock={false}).
 */
import {SkeletonList} from "@/components/SkeletonBlocks";

export default function Loading() {
    return (
        <main className="container page">
            <SkeletonList count={6} withBlock={false} columns={3}/>
        </main>
    );
}
