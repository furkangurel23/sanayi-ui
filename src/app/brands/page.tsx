import {getBrands} from "@/lib/api";
import type {BrandDto, Page as PageType} from "@/lib/types";
import BrandCard from "@/components/BrandCard";
import Pagination from "@/components/Pagination";

export const metadata = {
    title: "Markalar | Sanayi",
};

// NOT: Next.js 15 → searchParams bir Promise
export default async function BrandsPage({
                                             searchParams,
                                         }: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const sp = await searchParams; // <- önemli

    const page = Number(sp.page ?? "1");
    const size = Number(sp.size ?? "20");
    const sort = String(sp.sort ?? "name");
    const dir = (sp.dir as "asc" | "desc") ?? "asc";

    const data: PageType<BrandDto> = await getBrands({page, size, sort, dir});

    return (
        <main className="mx-auto max-w-5xl p-4 space-y-4">
            <h1 className="text-2xl font-bold">Markalar</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {data.content.map((b) => (
                    <BrandCard key={b.id} brand={b}/>
                ))}
            </div>

            <div className="pt-4">
                <Pagination page={(data.number ?? 0) + 1} totalPages={data.totalPages ?? 1}/>
            </div>
        </main>
    );
}
