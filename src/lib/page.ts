import type {Page, SpringPage} from "@/lib/types";

export function normalizePage<T>(raw: SpringPage<T>): Page<T> {
    const content = raw.content ?? [];
    const totalElements = raw.totalElements ?? raw.page?.totalElements ?? content.length;
    const size = raw.size ?? raw.page?.size ?? content.length;

    return {
        content,
        totalElements,
        totalPages: raw.totalPages ?? raw.page?.totalPages ?? (size > 0 ? Math.ceil(totalElements / size) : 0),
        size,
        number: raw.number ?? raw.page?.number ?? 0,
    };
}
