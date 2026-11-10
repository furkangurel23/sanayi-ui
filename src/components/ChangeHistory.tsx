"use client";

/*
 * DEĞİŞİKLİK GEÇMİŞİ (003 / T097) — bir dükkanın (ya da dikkat kuyruğunun) değişiklik kayıtları.
 *
 * - Her kayıt: tarih, kim (rol + e-posta), tür (düzenleme / geri alma), dikkat nedenleri,
 *   ve ÖNCE/SONRA tablosu (`.table-wrap` — dar ekranda tablo kendi kabında kayar, sayfa kaymaz).
 * - Alan adları Türkçe; kategori/marka id'leri ADLA, saatler gün gün, konum "enlem, boylam".
 * - Sahip yolunda (`viewer="owner"`) backend, sahibin KENDİ kayıtları dışındaki TÜM kayıtlarda
 *   e-postayı null döner: yönetici kimliği (research R6) ve devirden önceki sahibin e-postası (KVKK)
 *   sızmaz. Bu yüzden sahip görünümünde "OWNER + e-posta yok" her zaman BAŞKA (önceki) bir sahiptir
 *   -> "Önceki sahip"; "ADMIN + e-posta yok" -> "Yönetici". Yönetici görünümü (`viewer="admin"`,
 *   varsayılan) maskesizdir; orada e-postası kayıtlı olmayan kayıt yalnız rol adıyla yazılır.
 * - `onRevert` verilirse (yalnız yönetici) "Geri al" düğmesi; 409 (alan sonradan değişti /
 *   zaten geri alınmış) mesajı kaydın altında gösterilir. `onAcknowledge` = dikkat "İncelendi".
 */
import {useState} from "react";
import Link from "next/link";
import type {ChangeSet, IdName} from "@/lib/types";
import {errorMessage} from "@/lib/apiError";
import {ATTENTION_LABELS, fieldLabel, formatFieldValue} from "@/lib/providerFields";
import ConfirmButton from "@/components/ConfirmButton";
import {Flag} from "@/components/icons";

type Props = {
    items: ChangeSet[];
    categories: IdName[];
    brands: IdName[];
    onRevert?: (id: number) => Promise<void>;
    onAcknowledge?: (id: number) => Promise<void>;
    /** Dikkat kuyruğunda dükkan adını bağlantı olarak göster. */
    showProvider?: boolean;
    /**
     * Başarı mesajı kaydın İÇİNDE mi gösterilsin (varsayılan evet)? Dikkat kuyruğunun "Açık"
     * görünümünde işlem gören kayıt listeden çıkar -> mesajı liste düzeyinde AttentionClient
     * gösterir; kayıt içi mesaj hem kaybolur hem çift duyurulurdu. Hatalar her zaman kayıtta.
     */
    itemNotices?: boolean;
    /**
     * Kim bakıyor? Etiket kuralı buna göre değişir (bkz. `actorText`). Varsayılan "admin": yönetici
     * ekranları değişmeden çalışır; yalnız sahip düzenleme sayfası `viewer="owner"` verir.
     */
    viewer?: "admin" | "owner";
    emptyText?: string;
};

export function formatDateTime(iso: string | null | undefined): string {
    if (!iso) return "";
    return new Date(iso).toLocaleString("tr-TR", {timeZone: "Europe/Istanbul", dateStyle: "medium", timeStyle: "short"});
}

/**
 * Kaydı yapanın etiketi. E-posta varsa her zaman parantez içinde gösterilir (sahip görünümünde bu
 * yalnız sahibin KENDİ kayıtlarında olur). E-posta yoksa: yönetici -> "Yönetici"; sahip rolü ->
 * sahip görünümünde "Önceki sahip" (backend başka sahiplerin e-postasını maskeler), yönetici
 * görünümünde "Sahip" (yönetici görünümü maskesiz; null yalnız e-postası kayıtlı olmayan kayıtta olur).
 */
function actorText(c: Pick<ChangeSet, "actorRole" | "actorEmail">, viewer: "admin" | "owner" = "admin"): string {
    if (c.actorRole === "ADMIN") return c.actorEmail ? `Yönetici (${c.actorEmail})` : "Yönetici";
    if (c.actorEmail) return `Sahip (${c.actorEmail})`;
    return viewer === "owner" ? "Önceki sahip" : "Sahip";
}

function ChangeItem({c, categories, brands, onRevert, onAcknowledge, showProvider, itemNotices = true, viewer = "admin"}: Omit<Props, "items" | "emptyText"> & {
    c: ChangeSet
}) {
    const [error, setError] = useState<string | null>(null);
    const [info, setInfo] = useState<string | null>(null);
    const ctx = {categories, brands};
    const fields = Object.entries(c.changes ?? {});
    const openAttention = c.attention && !c.attentionResolvedAt;
    // Satır düğmelerinin ekran okuyucu devamı: "Geri al: kayıt #12, Usta Oto" (hepsi aynı adlı olmasın)
    const itemName = `kayıt #${c.id}${c.providerName ? `, ${c.providerName}` : ""}`;

    async function run(fn: () => Promise<void>, ok: string) {
        setError(null);
        setInfo(null);
        try {
            await fn();
            if (itemNotices) setInfo(ok);
        } catch (e) {
            setError(errorMessage(e, "İşlem başarısız."));
        }
    }

    return (
        <li className="card change-item">
            <div className="change-head">
                <div className="stack-sm">
                    {showProvider && (
                        <Link href={`/admin/providers/${c.providerId}`} className="link-accent change-provider">
                            {c.providerName ?? `Dükkan #${c.providerId}`}
                        </Link>
                    )}
                    <span className="callout">
                        {c.kind === "REVERT" ? "Geri alma" : "Düzenleme"} &middot; {actorText(c, viewer)}
                    </span>
                    <span className="caption muted">
                        <time dateTime={c.createdAt}>{formatDateTime(c.createdAt)}</time> &middot; Kayıt #{c.id}
                        {c.revertsChangeSetId ? ` (#${c.revertsChangeSetId} kaydını geri aldı)` : ""}
                    </span>
                </div>
                <div className="cluster">
                    {c.attention && (
                        <span className={openAttention ? "chip chip-neg" : "chip"}>
                            <Flag size="sm"/> {openAttention ? "Dikkat" : "İncelendi"}
                        </span>
                    )}
                    {c.revertedById && <span className="chip">Geri alındı (#{c.revertedById})</span>}
                </div>
            </div>

            {c.attention && c.attentionReasons.length > 0 && (
                <p className="caption muted">
                    Neden: {c.attentionReasons.map(r => ATTENTION_LABELS[r] ?? r).join(", ")}
                </p>
            )}

            <div className="table-wrap" tabIndex={0} role="region" aria-label={`Kayıt #${c.id} değişiklikleri`}>
                <table className="data change-table">
                    <thead>
                    <tr>
                        <th scope="col">Alan</th>
                        <th scope="col">Önce</th>
                        <th scope="col">Sonra</th>
                    </tr>
                    </thead>
                    <tbody>
                    {fields.map(([key, v]) => (
                        <tr key={key}>
                            <th scope="row">{fieldLabel(key)}</th>
                            <td className="change-before">{formatFieldValue(key, v?.before, ctx)}</td>
                            <td className="change-after">{formatFieldValue(key, v?.after, ctx)}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>

            {(onRevert || (onAcknowledge && openAttention)) && (
                <div className="row-actions change-actions">
                    {onAcknowledge && openAttention && (
                        <button type="button" className="btn btn-outline btn-sm"
                                onClick={() => run(() => onAcknowledge(c.id), "İncelendi olarak işaretlendi.")}>
                            İncelendi<span className="sr-only">: {itemName}</span>
                        </button>
                    )}
                    {onRevert && !c.revertedById && (
                        <ConfirmButton label="Geri al" confirmLabel="Bu değişiklik geri alınsın mı?"
                                       className="btn btn-outline btn-sm" srLabel={itemName}
                                       onConfirm={() => run(() => onRevert(c.id), "Değişiklik geri alındı.")}/>
                    )}
                </div>
            )}
            {error && <div className="alert alert-error" role="alert">{error}</div>}
            {info && <div className="alert alert-success" role="status">{info}</div>}
        </li>
    );
}

export default function ChangeHistory({items, emptyText = "Henüz değişiklik kaydı yok.", ...rest}: Props) {
    if (items.length === 0) return <p className="muted">{emptyText}</p>;
    return (
        <ul className="stack change-list">
            {items.map(c => <ChangeItem key={c.id} c={c} {...rest}/>)}
        </ul>
    );
}
