/*
 * ÖZELLİK BAYRAKLARI — 006-production-deploy.
 *
 * `claimsEnabled()`: "Bu dükkan benim" (sahiplenme) açık mı? Canlıda KVKK aydınlatma metni hukuki onay
 * alana kadar KAPALI başlar (`NEXT_PUBLIC_CLAIMS_ENABLED=false`, backend `CLAIMS_ENABLED=false`). Yalnız tam
 * "false" kapatır → yerel geliştirme ve testlerde değişken yokken özellik AÇIK (davranış değişmez).
 * Derlemede gömülür: değiştirmek arayüzü yeniden derlemeyi gerektirir (deploy/deploy.sh yapar).
 */
export function claimsEnabled(): boolean {
    return process.env.NEXT_PUBLIC_CLAIMS_ENABLED !== "false";
}
