export type ProviderMiniDto = {
    id: number;
    name: string;
    address?: string | null;
    city?: string | null;
    district?: string | null;
    phone?: string | null;
    lat?: number | null;
    lon?: number | null;
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
    lon?: number | null;
};

export type BrandDto = {
    id: number;
    name: string;
    providers: ProviderMiniDto[];
    // 002: görünür (sentetik olmayan) dükkan sayısı. Opsiyonel: eski backend'le de çalışsın.
    // `withProviders=false` çağrılarında `providers` boş gelir, sayı buradadır.
    providerCount?: number;
};

export type Page<T> = {
    content: T[];
    totalElements: number;
    totalPages: number;
    size: number; // sayfa boyutu
    number: number; // current page index (0 - based)
};

export type SpringPage<T> = {
    content?: T[];
    totalElements?: number;
    totalPages?: number;
    size?: number;
    number?: number;
    page?: {
        size?: number;
        number?: number;
        totalElements?: number;
        totalPages?: number;
    };
};

export type CategoryDto = {
    id: number;
    name: string;
    providers: ProviderMiniDto[];
    providerCount?: number;
};

export type IdName = {
    id: number;
    name: string;
};

export type LocationDto = {
    lon: number;
    lat: number;
};

export type ProviderDetailDto = {
    id: number;
    name: string;
    address?: string | null;
    city?: string | null;
    district?: string | null;
    phone?: string | null;
    location?: LocationDto | null;   // harita için lon/lat burada
    avgScore?: number | null;
    ratingCount: number;
    brands: IdName[];
    categories: IdName[];
    recentRatings?: RatingDto[];
    scoreHistogram?: Record<string, number>;
    // 002: verinin kaynak kodları ("openstreetmap" | "overture" | "foursquare"), benzersiz ve alfabetik.
    // Opsiyonel: eski backend alanı göndermez.
    sources?: string[];
};

export type RatingDto = {
    id: number;
    score: number;
    comment?: string | null;
    createdAt: string;
    userDisplayName?: string | null;
    anonymous?: boolean;
    isAnonymous?: boolean;
};

export type NearItem = {
    id: number;
    name: string;
    city?: string | null;
    district?: string | null;
    avgScore?: number | null;
    ratingCount?: number | null;
    distanceKm: number;
    lat?: number | null;
    lon?: number | null;
};

// 002: GET /api/admin/providers satırı — sentetik dükkanlar da gelir (`synthetic: true`).
export type ProviderSourceItem = {
    source: string;
    sourceId?: string | null;
    sourceVersion?: string | null;
    importedAt: string;
};

export type AdminProviderItem = {
    id: number;
    name: string;
    address?: string | null;
    city?: string | null;
    district?: string | null;
    phone?: string | null;
    lat?: number | null;
    lon?: number | null;
    avgScore?: number | null;
    ratingCount: number;
    synthetic: boolean;
    createdAt?: string | null;
    sources: ProviderSourceItem[];
};

export type AdminRatingItem = {
    id: number;
    providerId: number;
    providerName: string;
    score: number;
    comment?: string | null;
    createdAt: string;
    userDisplayName?: string | null;
    anonymousId?: string | null;
    ip?: string | null;
    deletedAt?: string | null;
};

export type ChatMessage = {
    id: number;
    brandId: number;
    brandName: string;
    userId: number;
    displayName: string;
    content?: string | null;
    attachmentUrl?: string | null;
    attachmentType?: "IMAGE" | "VIDEO" | null;
    createdAt: string;
};

export type AdminUserItem = {
    id: number;
    email: string;
    displayName?: string | null;
    role: string;
    enabled: boolean;
    emailVerified: boolean;
    createdAt?: string | null;
    lastLoginAt?: string | null;
};

export type ModerationLogItem = {
    id: number;
    action: string;
    entityType: string;
    entityId: number;
    providerId?: number | null;
    actorUserId?: number | null;
    actorEmail?: string | null;
    reason?: string | null;
    ipAddress?: string | null;
    details?: Record<string, unknown> | null;
    createdAt: string;
};
