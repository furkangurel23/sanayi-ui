import {getBrandsAllSorted, getCategoriesAllSorted, getProviders,} from "@/lib/api";
import ProviderCard from "@/components/ProviderCard";
import FilterBar from "@/components/FilterBar";
import Pagination from "@/components/Pagination";

export const metadata = {
    title: "Ustalar | Sanayi",
};

// Next 15: searchParams bir Promise -> await et
export default async function ProvidersPage({
                                                searchParams,
                                            }: {
    searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
    const sp = await searchParams;

    const page = Number(sp.page ?? "1");
    const size = Number(sp.size ?? "20");
    const brandId = sp.brandId ? Number(sp.brandId) : undefined;
    const categoryId = sp.categoryId ? Number(sp.categoryId) : undefined;
    const city = typeof sp.city === "string" ? sp.city : undefined;
    const district = typeof sp.district === "string" ? sp.district : undefined;
    const minScore = sp.minScore ? Number(sp.minScore) : undefined;
    const maxScore = sp.maxScore ? Number(sp.maxScore) : undefined;

    // URL'den birincil sort'u oku; yoksa varsayılanı kullan
    let sortField = "avgScore";
    let sortDir: "asc" | "desc" = "desc";

    const sortsInUrl = Array.isArray(sp.sort) ? sp.sort : sp.sort ? [sp.sort] : [];
    if (sortsInUrl.length > 0 && typeof sortsInUrl[0] === "string" && sortsInUrl[0].includes(",")) {
        const [f, d] = (sortsInUrl[0] as string).split(",");
        sortField = f;
        sortDir = (d === "asc" ? "asc" : "desc");
    } else {
        if (typeof sp.sortField === "string") sortField = sp.sortField;
        if (sp.sortDir === "asc" || sp.sortDir === "desc") sortDir = sp.sortDir;
    }

    const sorts: Array<{ field: string; dir: "asc" | "desc" }> = [
        {field: sortField, dir: sortDir},
    ];
    if (sortField !== "ratingCount") sorts.push({field: "ratingCount", dir: "desc"});
    if (sortField !== "id") sorts.push({field: "id", dir: "asc"});

    // ---- FİX: iki aşamalı çekim ----
    // 1) Meta listeler paralel (ikisi de IdName[] olduğu için Promise.all problemsiz)
    const [brands, categories] = await Promise.all([
        getBrandsAllSorted(),
        getCategoriesAllSorted(),
    ]);

    // 2) Providers tek başına (Page<ProviderListItem>)
    const data = await getProviders({
        page,
        size,
        brandId,
        categoryId,
        city,
        district,
        minScore,
        maxScore,
        sorts,
    });

    return (
        <main className="mx-auto max-w-5xl p-4 space-y-4">
            <h1 className="text-2xl font-bold">Ustalar</h1>

            <FilterBar brands={brands} categories={categories}/>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {data.content.map((p) => (
                    <ProviderCard key={p.id} p={p}/>
                ))}
            </div>

            <div className="pt-4">
                <Pagination page={(data.number ?? 0) + 1} totalPages={data.totalPages ?? 1}/>
            </div>
        </main>
    );
}