"use client";

import {useRouter, useSearchParams} from "next/navigation";

export default function Pagination({
                                       page,
                                       totalPages,
                                   }: {
    page: number;
    totalPages: number;
}) {
    const router = useRouter();
    const sp = useSearchParams();

    const go = (p: number) => {
        const params = new URLSearchParams(sp.toString());
        params.set("page", String(p));
        router.push(`?${params.toString()}`);
    };

    return (
        <div className="flex items-center justify-center gap-2">
            <button
                onClick={() => go(Math.max(1, page - 1))}
                disabled={page <= 1}
                className="px-3 py-1 rounded-lg border border-white/20 disabled:opacity-40"
            >
                ←
            </button>
            <span className="text-sm opacity-80">
        Sayfa {page} / {totalPages || 1}
      </span>
            <button
                onClick={() => go(Math.min(totalPages || 1, page + 1))}
                disabled={page >= (totalPages || 1)}
                className="px-3 py-1 rounded-lg border border-white/20 disabled:opacity-40"
            >
                →
            </button>
        </div>
    );
}
