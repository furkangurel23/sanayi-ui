/*
 * İSTEMCİ SINIRLARI (003 / T090) — backend yapılandırmasının AYNASI (tek kaynak backend'dir;
 * istemci yalnızca gereksiz yüklemeyi baştan engeller, kesin kontrol sunucuda):
 *   app.private-docs.max-file-size: 10MB   -> MAX_CLAIM_FILE_BYTES
 *   app.private-docs.max-files: 3          -> MAX_CLAIM_FILES
 * (sanayi/src/main/resources/application.yml). Backend değişirse burası da değişmeli.
 */
export const MAX_CLAIM_FILE_BYTES = 10 * 1024 * 1024;
export const MAX_CLAIM_FILES = 3;

/** Kabul edilen belge uzantıları (`<input accept>` ile aynı) — içerik imzası backend'de denetlenir. */
export const CLAIM_FILE_ACCEPT = ".jpg,.jpeg,.png,.pdf";

/** Serbest metin alanları (öneri notu, talep açıklaması, gerekçe) — backend @Size(max = 500). */
export const MAX_NOTE_LENGTH = 500;
