/*
 * İSTEMCİ SINIRLARI (003 / T090) — backend yapılandırmasının AYNASI (tek kaynak backend'dir;
 * istemci yalnızca gereksiz yüklemeyi baştan engeller, kesin kontrol sunucuda):
 *   app.private-docs.max-file-size: 10MB     -> MAX_CLAIM_FILE_MB / MAX_CLAIM_FILE_BYTES
 *   app.private-docs.max-files: 3            -> MAX_CLAIM_FILES
 *   app.private-docs.max-request-size: 31MB  -> MAX_CLAIM_REQUEST_MB (isteğin tamamı; aşılırsa 413,
 *                                               backend metni "Üst sınır: 31 MB" der)
 *   DocumentSniffer.MAX_PIXELS: 24 MP        -> MAX_CLAIM_IMAGE_MEGAPIXELS (görsel çözülmeden başlıktan
 *                                               okunur; aşılırsa 400 error.claim.image-too-large)
 * (sanayi/src/main/resources/application.yml). Backend değişirse burası da değişmeli.
 * 3 x 10 MB = 30 MB < 31 MB: istemci kontrolünden geçen form istek sınırına takılmaz.
 */
export const MAX_CLAIM_FILE_MB = 10;
export const MAX_CLAIM_FILE_BYTES = MAX_CLAIM_FILE_MB * 1024 * 1024;
export const MAX_CLAIM_FILES = 3;
export const MAX_CLAIM_REQUEST_MB = 31;
export const MAX_CLAIM_IMAGE_MEGAPIXELS = 24;

/** Kabul edilen belge uzantıları (`<input accept>` ile aynı) — içerik imzası backend'de denetlenir. */
export const CLAIM_FILE_ACCEPT = ".jpg,.jpeg,.png,.pdf";

/** Serbest metin alanları (öneri notu, talep açıklaması, gerekçe) — backend @Size(max = 500). */
export const MAX_NOTE_LENGTH = 500;
