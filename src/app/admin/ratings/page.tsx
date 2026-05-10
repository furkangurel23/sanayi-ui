"use client";

import {adminDeleteRating, adminListLogs, adminListRatings, adminRestoreRating} from "@/lib/adminApi";

import {Suspense, useEffect, useMemo, useState} from "react";
import {useRouter, useSearchParams} from "next/navigation";
import type {AdminRatingItem, ModerationLogItem, Page} from "@/lib/types";


function useAdminToken() {
    const [token, setToken] = useState<string>(() => {
        if (typeof window === "undefined") return "";
        return localStorage.getItem("adminToken") || "";
        /*
        *       LocalStorage nedir, ne işe yarar, niye kullanıyoruz?
        * Nedir: Tarayıcnın, domain başına küçük bir anahtar/değer deposu. Senkron çalışır. Her şey string olarak saklanır.
        *
        * Özellikler:
        *   - Kalıcıdır. Sekme kapansın, makine kapanıp açılsın; kullanıcı manuel silmezse durur.
        *   - Alan limiti: genelde 5 - 10 MB arası. Ben JSON dump atarım diyenler için sınırı var.
        *   - Ayrıcalık. Değerler sunuyuya otomatik göndeirlmez. Bu cookie değilir. Her isteğe yapışmaz.
        *   - Erişim kapsamı. Aynı orogin'de çalışan her JS tarafında erişilebilir. Bu da demek oluyor ki XSS varsa token'ini DJ seti gib çalarlar.
        *
        * Niye kullanıyoruz. Admin ekranı Client Component.Bearer token'i kullanıcı bir kere girsin, biz de her seferinde tekrar istemeylim. kısacası küçük, pratik, kısa ömürlü
        *  bir ayar gibi tututoyurz.
        *
        * Güvenlik uyarısı: localStorage gizli bilgi için ideal bir yer değildilr. XSS olursa token'ı çalarlar. uzun vadede:
        *   - HttpOnly cookie ile token bırakmak,
        *   - veya Next tarafında Route Handler / server action ile API'yi proxy'leyip client'a token göstermek daha güvenli.
        * Alternatiflar: sessionSTorage(sekme bazlı, kapanınca silinir), IndexedDB (daha büük ve asenkron), cookie (HttpOnly olabilir, ama CORSF/SCRF konuları var)
        *
        * */
    });

    useEffect(() => {
        if (typeof window !== "undefined") { //SSR güvenliği: ilk değer atamasında typeof window ile SSR'da patlamıyoruz. Sonucua localStorage yok.
            localStorage.setItem("adminToken", token || "");
        }
    }, [token]); // Persist: token değişince useEffect yazıyor. Yani input'a token yapıştırınca bir daha sormuyoruz.
    // bu işlev sadece admin ekranı için; prod'da gerçek dünyada bunu HttpOnly cookie ile değiştirmen daha doğru.

    return {token, setToken};
}

function formatDate(iso: string) {
    try {
        return new Date(iso).toLocaleString("tr-TR");
    } catch {
        return iso;
    }
}

function errorMessage(error: unknown, fallback: string) {
    return error instanceof Error && error.message ? error.message : fallback;
}

function AdminRatingsContent() {
    const {token, setToken} = useAdminToken();
    const router = useRouter();
    const sp = useSearchParams();

    // URL -> state

    const initial = useMemo(() => ({
        providerId: sp.get("providerId") ?? "",
        q: sp.get("q") ?? "",
        status: (sp.get("status") as "ACTIVE" | "DELETED" | "ALL") ?? "ACTIVE",
        from: sp.get("from") ?? "",
        to: sp.get("to") ?? "",
        page: Number(sp.get("page") ?? "1"),
        size: Number(sp.get("size") ?? "20")
    }), [sp]);

    const [providerId, setProviderId] = useState(initial.providerId);
    const [q, setQ] = useState(initial.q);
    const [status, setStatus] = useState<"ACTIVE" | "DELETED" | "ALL">(initial.status);
    const [from, setFrom] = useState(initial.from);
    const [to, setTo] = useState(initial.to);
    const [page, setPage] = useState<number>(initial.page);
    const [size, setSize] = useState<number>(initial.size);

    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState<string | null>(null);
    const [data, setData] = useState<Page<AdminRatingItem> | null>(null);


    const [logForId, setLogForId] = useState<number | null>(null);
    const [logs, setLogs] = useState<Page<ModerationLogItem> | null>(null);
    const [logsLoading, setLogsLoading] = useState(false);

    //URL değişirse form state'lerini tekrar senkronla
    useEffect(() => {
        setProviderId(initial.providerId);
        setQ(initial.q);
        setStatus(initial.status);
        setFrom(initial.from);
        setTo(initial.to);
        setPage(initial.page);
        setSize(initial.size);
    }, [initial]);

    async function fetchList(nextPage = page) {
        if (!token) {
            setErr("Token boş. Üstteki alana admin token’ı gir.");
            return;
        }
        setLoading(true);
        setErr(null);
        try {
            const res = await adminListRatings(token, {
                providerId: providerId || undefined,
                q: q || undefined,
                status,
                from: from || undefined,
                to: to || undefined,
                page: nextPage,
                size,
            });
            setData(res);
        } catch (error: unknown) {
            setErr(errorMessage(error, "Liste alınamadı."));
        } finally {
            setLoading(false);
        }
    }

    // İlk yüklemede token gelince listeyi çek; filtrelerde Uygula butonu belirleyici kalsın.
    useEffect(() => {
        fetchList(1);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token]);


    function applyFilters() {
        const params = new URLSearchParams(sp.toString());
        const set = (k: string, v?: string) => (v ? params.set(k, v) : params.delete(k));

        set("providerId", providerId || undefined);
        set("q", q || undefined);
        set("status", status);
        set("from", from || undefined);
        set("to", to || undefined);
        set("size", String(size));
        params.set("page", "1");

        router.push(`?${params.toString()}`);
        setPage(1);
        fetchList(1);
    }

    function goPage(p: number) {
        const params = new URLSearchParams(sp.toString());
        params.set("page", String(p));
        router.push(`?${params.toString()}`);
        setPage(p);
        fetchList(p);
    }

    async function doDelete(id: number) {
        const reason = window.prompt("Silme sebebi (opsiyonel):") || "";
        try {
            await adminDeleteRating(token, id, reason || undefined);
            // optimistik güncelle
            setData(d =>
                d ? {
                        ...d,
                        content: d.content.map(it =>
                            it.id === id ? {...it, deletedAt: new Date().toISOString()} : it
                        ),
                    }
                    : d
            );
        } catch (error: unknown) {
            alert(errorMessage(error, "Silme başarısız."));
        }
    }

    async function doRestore(id: number) {
        const reason = window.prompt("Geri alma sebebi (opsiyonel):") || "";
        try {
            await adminRestoreRating(token, id, reason || undefined);
            setData(d =>
                d
                    ? {
                        ...d,
                        content: d.content.map(it =>
                            it.id === id ? {...it, deletedAt: null} : it
                        ),
                    }
                    : d
            );
        } catch (error: unknown) {
            alert(errorMessage(error, "Geri alma başarısız."));
        }
    }

    async function openLogs(ratingId: number) {
        setLogForId(ratingId);
        setLogs(null);
        setLogsLoading(true);
        try {
            const res = await adminListLogs(token, ratingId, 0, 20);
            setLogs(res);
        } catch (error: unknown) {
            alert(errorMessage(error, "Loglar alınamadı."));
        } finally {
            setLogsLoading(false);
        }
    }

    return (
        <main className="mx-auto max-w-6xl p-4 space-y-4">
            <h1 className="text-2xl font-bold">Admin · Yorum Moderasyonu</h1>

            {/* Token alanı */}
            <div className="rounded-2xl border border-yellow-500/30 p-3 flex items-center gap-2">
                <label className="text-sm w-28">Admin Token</label>
                <input
                    type="password"
                    value={token}
                    onChange={e => setToken(e.target.value)}
                    className="flex-1 rounded-lg border border-white/20 bg-transparent px-3 py-2"
                    placeholder="Bearer JWT"
                />
                <button
                    onClick={() => fetchList(1)}
                    className="rounded-lg border border-white/30 px-3 py-2 text-sm"
                    disabled={loading}
                >
                    Yenile
                </button>
            </div>

            {/* Filtreler */}
            <div className="rounded-2xl border border-white/10 p-3 grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="flex gap-2">
                    <input
                        value={providerId}
                        onChange={e => setProviderId(e.target.value)}
                        placeholder="Provider ID"
                        className="flex-1 rounded-lg border border-white/20 bg-transparent px-3 py-2"
                    />
                    <select
                        value={status}
                        onChange={e => setStatus(e.target.value as "ACTIVE" | "DELETED" | "ALL")}
                        className="w-36 rounded-lg border border-white/20 bg-transparent px-3 py-2"
                    >
                        <option value="ACTIVE">ACTIVE</option>
                        <option value="DELETED">DELETED</option>
                        <option value="ALL">ALL</option>
                    </select>
                </div>

                <input
                    value={q}
                    onChange={e => setQ(e.target.value)}
                    placeholder="Yorum prefix (q)"
                    className="rounded-lg border border-white/20 bg-transparent px-3 py-2"
                />

                <div className="flex gap-2">
                    <input
                        type="datetime-local"
                        value={from}
                        onChange={e => setFrom(e.target.value)}
                        className="flex-1 rounded-lg border border-white/20 bg-transparent px-3 py-2"
                    />
                    <input
                        type="datetime-local"
                        value={to}
                        onChange={e => setTo(e.target.value)}
                        className="flex-1 rounded-lg border border-white/20 bg-transparent px-3 py-2"
                    />
                </div>

                <div className="md:col-span-3 flex gap-2">
                    <button onClick={applyFilters} className="rounded-lg border border-white/30 px-3 py-2"
                            disabled={loading}>
                        Uygula
                    </button>
                    <button
                        onClick={() => {
                            setProviderId("");
                            setQ("");
                            setFrom("");
                            setTo("");
                            setStatus("ACTIVE");
                            setPage(1);
                            router.push("?");
                            fetchList(1);
                        }}
                        className="rounded-lg border border-white/10 px-3 py-2"
                    >
                        Temizle
                    </button>
                </div>
            </div>

            {/* Hata */}
            {err && <div className="text-sm text-red-400">{err}</div>}

            {/* Liste */}
            <div className="rounded-2xl border border-white/10 overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="text-left opacity-80">
                    <tr className="[&>th]:px-3 [&>th]:py-2 border-b border-white/10">
                        <th>Provider</th>
                        <th>Skor</th>
                        <th>Yorum</th>
                        <th>Kullanıcı</th>
                        <th>IP</th>
                        <th>Tarih</th>
                        <th>Durum</th>
                        <th></th>
                    </tr>
                    </thead>
                    <tbody>
                    {!data?.content?.length && !loading && (
                        <tr>
                            <td colSpan={8} className="px-3 py-4 opacity-70">
                                Kayıt yok.
                            </td>
                        </tr>
                    )}
                    {data?.content.map(it => {
                        const who = it.anonymousId
                            ? `Anon (${it.anonymousId})`
                            : it.userDisplayName || "User";
                        const statusTxt = it.deletedAt ? "DELETED" : "ACTIVE";
                        return (
                            <tr
                                key={it.id}
                                className="[&>td]:px-3 [&>td]:py-2 border-t border-white/5 align-top"
                            >
                                <td>
                                    <div className="font-medium">
                                        <a
                                            className="underline underline-offset-2"
                                            href={`/providers/${it.providerId}`}
                                            target="_blank"
                                            rel="noreferrer noopener"
                                        >
                                            {/* target=_blank -> tek başına yeni sekme aç demekle kalmıyor; açtığın sayfaya seni kontrol edecek bir uzaktan kumanda da veriyor.
                                                rel="norefferrer noopener" ise bunu elinden alıyor.
                                                noopener:
                                                    açılan sayfanın window.opener referansını kapatır.
                                                    böylece karşı sayfa window.opener.location = "phishing.com" yapıp reverse-tabnabbing saldırısını gerçkeleştiremez.
                                                    aynı zamanda küçük bir performans/izolasyon kazanımı: iki sekmenin JS bağını keser.

                                                norefferer
                                                    Hedef sayfaya Referer HTTP başlığı göndermemeyi söyler. yani karşı tarafa beni şu URL'den tıkladılar bilgisini vermezsin.
                                                    Yan etki: bazı analytics/affiliate takibini veya cress-site ölçümler görmez.
                                                    pek çok tarayıcı norefferer ekleyince noopener etkisi de otomatik gelir, ama günvenmek yerine ikisni de yazman en neti.
                                             */}
                                            {it.providerName}
                                        </a>
                                    </div>
                                    <div className="text-xs opacity-70">#{it.id}</div>
                                </td>
                                <td className="font-semibold">{it.score}</td>
                                <td className="max-w-[360px]">
                                    <div className="line-clamp-3">
                                        {it.comment || <span className="opacity-60">—</span>}
                                    </div>
                                </td>
                                <td>{who}</td>
                                <td className="text-xs opacity-80">{it.ip || "—"}</td>
                                <td className="text-xs opacity-80">{formatDate(it.createdAt)}</td>
                                <td className={it.deletedAt ? "text-rose-400" : "text-emerald-400"}>
                                    {statusTxt}
                                </td>
                                <td className="space-x-2 text-right whitespace-nowrap">
                                    <button
                                        onClick={() => openLogs(it.id)}
                                        className="rounded border border-white/20 px-2 py-1 text-xs"
                                    >
                                        Log
                                    </button>
                                    {!it.deletedAt ? (
                                        <button
                                            onClick={() => doDelete(it.id)}
                                            className="rounded border border-rose-500/40 px-2 py-1 text-xs"
                                        >
                                            Sil
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => doRestore(it.id)}
                                            className="rounded border border-emerald-500/40 px-2 py-1 text-xs"
                                        >
                                            Geri al
                                        </button>
                                    )}
                                </td>
                            </tr>
                        );
                    })}
                    </tbody>
                </table>
            </div>

            {/* Sayfalama */}
            <div className="flex items-center justify-center gap-2">
                <button
                    onClick={() => goPage(Math.max(1, page - 1))}
                    disabled={page <= 1}
                    className="px-3 py-1 rounded-lg border border-white/20 disabled:opacity-40"
                >
                    ←
                </button>
                <span className="text-sm opacity-80">
          Sayfa {page} / {data?.totalPages ? Math.max(1, data.totalPages) : 1}
        </span>
                <button
                    onClick={() => goPage(Math.min(data?.totalPages || 1, page + 1))}
                    disabled={page >= (data?.totalPages || 1)}
                    className="px-3 py-1 rounded-lg border border-white/20 disabled:opacity-40"
                >
                    →
                </button>
            </div>

            {/* Log Drawer */}
            {logForId !== null && (
                <div role="dialog" aria-modal="true" className="fixed inset-0 bg-black/40 backdrop-blur-sm flex">
                    <div
                        className="ml-auto h-full w-full max-w-xl bg-neutral-950 border-l border-white/10 p-4 overflow-auto">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold">Loglar · #{logForId}</h2>
                            <button
                                onClick={() => setLogForId(null)}
                                className="rounded border border-white/20 px-2 py-1 text-xs"
                            >
                                Kapat
                            </button>
                        </div>

                        {logsLoading && <div className="opacity-70 text-sm mt-3">Yükleniyor…</div>}

                        {!logsLoading && !logs?.content?.length && (
                            <div className="opacity-70 text-sm mt-3">Log bulunamadı.</div>
                        )}

                        <ul className="mt-3 space-y-2">
                            {logs?.content.map(l => (
                                <li key={l.id} className="rounded border border-white/10 p-2 text-xs">
                                    <div className="flex items-center justify-between">
                                        <div className="font-semibold">{l.action}</div>
                                        <div className="opacity-70">{formatDate(l.createdAt)}</div>
                                    </div>
                                    <div className="opacity-80 mt-1">
                                        {l.actorEmail || l.actorUserId ? (
                                            <span>actor: {l.actorEmail || `#${l.actorUserId}`}</span>
                                        ) : (
                                            <span>actor: ?</span>
                                        )}
                                        {l.ipAddress ? <span> · ip: {l.ipAddress}</span> : null}
                                    </div>
                                    {l.reason && <div className="mt-1">reason: {l.reason}</div>}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}
        </main>
    );
}

export default function AdminRatingsPage() {
    return (
        <Suspense fallback={<main className="mx-auto max-w-6xl p-4 text-sm opacity-70">Yükleniyor...</main>}>
            <AdminRatingsContent/>
        </Suspense>
    );
}
