/*
 * DURUM ROZETİ (003 / T097) — öneri ve sahiplenme talebi durumları. Server-safe (hook yok).
 *
 * Anlam yalnız renkle verilmez: rozetin METNİ durumu söyler ("İncelemede", "Reddedildi"…);
 * ton (chip-pos/neg/accent) ek ipucudur. Ton çiftleri globals.css'te ≥4.5:1 (kontrast betiği).
 */
const STATUS: Record<string, { label: string; className: string }> = {
    PENDING: {label: "İncelemede", className: "chip chip-accent"},
    APPROVED: {label: "Onaylandı", className: "chip chip-pos"},
    REJECTED: {label: "Reddedildi", className: "chip chip-neg"},
    WITHDRAWN: {label: "Geri çekildi", className: "chip"},
    EXPIRED: {label: "Süresi doldu", className: "chip"},
};

export const STATUS_LABELS: Record<string, string> =
    Object.fromEntries(Object.entries(STATUS).map(([k, v]) => [k, v.label]));

export default function StatusChip({status}: { status: string }) {
    const s = STATUS[status] ?? {label: status, className: "chip"};
    return <span className={s.className}>{s.label}</span>;
}
