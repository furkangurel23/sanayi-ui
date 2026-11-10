/*
 * HUKUKİ METİN SÜRÜMLERİ (003 / T111).
 *
 * `CLAIM_PRIVACY_VERSION`: sahiplenme talebi KVKK aydınlatma metninin sürümü. Talep formu bu
 * değeri `kvkkVersion` olarak gönderir; backend `app.claims.kvkk-version` ile karşılaştırır
 * (farklıysa 400 `error.claim.kvkk-version-mismatch` -> "Metin güncellendi, sayfayı yenileyin").
 * Metin değişince ÜÇ yer birlikte değişir: yeni `src/content/claim-privacy-<sürüm>.ts`, bu sabit
 * ve backend `app.claims.kvkk-version` (application.yml).
 */
export const CLAIM_PRIVACY_VERSION = "2026-11-10";
