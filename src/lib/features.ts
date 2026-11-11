/*
 * ÖZELLİK BAYRAKLARI — 006-production-deploy.
 *
 * `claimsEnabled()`: "Bu dükkan benim" (sahiplenme) açık mı? Canlıda KVKK aydınlatma metni hukuki onay
 * alana kadar KAPALI başlar (`NEXT_PUBLIC_CLAIMS_ENABLED=false`, backend `CLAIMS_ENABLED=false`). Spring'in
 * "false" saydığı yazımlar (false/0/no/off, büyük-küçük harf duyarsız) burada da kapatır — iki taraf ayrışmasın
 * (backend 404 verirken arayüz bağlantıyı göstermesin). Değişken yokken özellik AÇIK (yerel/test değişmez).
 * Derlemede gömülür: değiştirmek arayüzü yeniden derlemeyi gerektirir (deploy/deploy.sh yapar).
 */
const OFF = new Set(["false", "0", "no", "off"]);

export function claimsEnabled(): boolean {
    return !OFF.has((process.env.NEXT_PUBLIC_CLAIMS_ENABLED ?? "").trim().toLowerCase());
}
