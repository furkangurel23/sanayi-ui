export type ProviderMiniDto = {
    id: number;
    name: string;
    address?: string | null;
    city?: string | null;
    district?: string | null;
    phone?: string | null;
    lat?: number | null;
    lng?: number | null;
};

export type ProviderListItem = {
    id: number;
    name: string;
    city?: string | null;
    district?: string | null;
    phone?: string | null;
    avgScore?: number | null;
    ratingCount?: number | null;
    lat?: number | null;
    lng?: number | null;
};

export type BrandDto = {
    id: number;
    name: string;
    providers: ProviderMiniDto[];
}

export type Page<T> = {
    content: T[];
    totalElements: number;
    totalPages: number;
    size: number; // sayfa boyutu
    number: number; // current page index (0 - based)
}

export type CategoryDto = {
    id: number;
    name: string;
    providers: ProviderMiniDto[];
}

export type IdName = {
    id: number;
    name: string;
}
