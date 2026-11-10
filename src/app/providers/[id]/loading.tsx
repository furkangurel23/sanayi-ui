/*
 * USTA DETAYI — yükleniyor iskeleti (Suspense fallback'i).
 * Ortak SkeletonDetail: başlık kartı + harita + yorum kartları; sayfayla aynı dar sütun.
 */
import {SkeletonDetail} from "@/components/SkeletonBlocks";

export default function Loading() {
    return (
        <main className="container container-narrow page">
            <SkeletonDetail/>
        </main>
    );
}
