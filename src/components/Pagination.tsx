"use client";

/*
*
*       "use client" nedir?
*
*   App Router'da (src/app/...) dosyalar varsayilan olarak Server Component'tir.
* Bir dosyanin ilk satirina "use client" koyarsan o bilesen Client Component olur ve:
*   - useState, useEffect, useRef gibi hook'laro kullanabilir.
*   - tarayici olaylarini (onclock vs.) ele alabilir,
*   - ama server'a gore biraz daha buyuk bir bundle'a bgirer.
*
* BrandCard'a "use client" eklememizin nedeni: toogle (ac/kapa) icin useState kullanmamiz.
*
*       Next.js "server-side render' tam olarak nedir?
*
*   Nexxt.js tarafinda React bilesinlerinin HTML'ini Node.js uzerinde uretilmesi (SSR) demektir.
* Arka tarafta calisan spring boot ayri bir backend API. Next SSR asamasinda bu api'dan fetch ile veri ceker, HTML'i server'da kurar, sonra tarayiciya gonderir.
*   - Spring: is kuralllarini, DB erisimini, REST JSON -> Ver kaynagin
*   - Next SSR (Node): Bu veriyi alip UI HTML'ini server'da uretir. -> hizli ilk yukleme, SEO
*
*
* */

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
