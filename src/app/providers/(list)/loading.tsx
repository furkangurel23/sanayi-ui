/*
 * USTALAR LİSTESİ — yükleniyor iskeleti (Suspense fallback'i).
 * Ortak SkeletonList: başlık + harita bloğu + 2 sütun kart (gerçek düzene yakın -> CLS düşük).
 */
import {SkeletonList} from "@/components/SkeletonBlocks";

export default function Loading() {
    return (
        <main className="container page">
            <SkeletonList count={6}/>
        </main>
    );
}
