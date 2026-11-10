/*
 * KUYRUK ROZETİ OLAYI (003) — bir karar/işlem sonrası AdminShell'deki sayı rozetlerinin
 * yeniden çekilmesi için hafif "olay yayını". Sekme kabuğu ile içerik bileşeni birbirini
 * import etmez; tarayıcının yerleşik `window` olay sistemi üzerinden haberleşir.
 */
export const QUEUE_COUNTS_EVENT = "sanayi:queue-counts";

export function notifyQueueCountsChanged(): void {
    if (typeof window !== "undefined") window.dispatchEvent(new Event(QUEUE_COUNTS_EVENT));
}
