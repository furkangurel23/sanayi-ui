import React from "react";

type Bucket = { score: number, count: number };

export default function MiniHistogram({
                                          buckets,
                                          total,
                                          height = 72,
                                      }: {
    buckets: Bucket[];
    total: Number,
    height?: number;
}) {
    const max = Math.max(1, ...buckets.map(b => b.count));
    const labels = buckets.map(b => String(b.score));

    return (
        <div className="rounded-2xl border border-white/10 p-3">
            <div className="flex items-end gap-1" style={{height}}>
                {buckets.map((b, i) => {
                    const h = Math.round((b.count / max) * (height - 18)); // 18px alt etiket boşluğu
                    const isPos = b.score >= 1;
                    const isNeg = b.score <= -1;
                    const tone =
                        b.score === 0
                            ? "bg-white/40"
                            : isPos
                                ? "bg-emerald-500/70"
                                : "bg-rose-500/70";
                    return (
                        <div key={i} className="flex-1 flex flex-col items-center">
                            <div
                                className={`w-full rounded-t ${tone}`}
                                style={{height: Math.max(4, h)}}
                                aria-label={`${b.score}: ${b.count}`}
                            />
                            <div className="text-[10px] opacity-70 mt-1">{labels[i]}</div>
                        </div>
                    );
                })}
            </div>
            <div className="text-[11px] opacity-70 mt-2">
                Toplam örnek: {total} · Aralık: −5 … 5
            </div>
        </div>
    );

}