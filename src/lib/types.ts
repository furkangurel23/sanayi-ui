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
    // 003: haftalık çalışma saatleri; null/yok = "çalışma saati bilgisi yok" (boş liste = o gün Kapalı).
    openingHours?: OpeningHours | null;
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
    // 003: sahip/yönetici düzenledi ya da öneriden oluştu (boru hattı dokunmaz) / aktif sahibi var.
    // Opsiyonel: eski backend göndermez.
    manuallyEdited?: boolean;
    hasOwner?: boolean;
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

/* ============================================================
 * 003 — Dükkan öner / sahiplenme / düzenleme (backend application/dto ile birebir)
 * ============================================================ */

/** java.time.DayOfWeek adları — backend haftalık saatleri bu 7 anahtarla taşır (MONDAY…SUNDAY). */
export type DayKey = "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY" | "SATURDAY" | "SUNDAY";

/** Tek açık aralık (TimeRangeDto): "HH:mm"; kapanış "24:00" olabilir; kapanış <= açılış = gece aralığı. */
export type TimeRange = { open: string; close: string };

/** Haftalık saatler: 7 anahtar; boş liste = Kapalı. Alanın kendisi null = bilgi yok. */
export type OpeningHours = Record<DayKey, TimeRange[]>;

/** GET /api/user/me (CurrentUserDto) — JWT `emailVerified` taşımaz, bu uç taşır. */
export type CurrentUser = {
    id: number;
    email: string;
    displayName?: string | null;
    role: string;
    emailVerified: boolean;
};

/** ProviderEditView.owner — aktif sahip (yalnız yönetici görür). */
export type OwnerRef = { userId: number; email: string };

/** GET/PUT /api/owner|admin/providers/{id} — düzenleme formu görünümü (PUT yanıtı da budur). */
export type ProviderEditView = {
    id: number;
    name: string;
    address?: string | null;
    district?: string | null;
    phone?: string | null;
    lat?: number | null;
    lon?: number | null;
    categories: IdName[];
    brands: IdName[];
    openingHours: OpeningHours | null;
    version: number;
    manuallyEdited: boolean;
    viewerRole: "OWNER" | "ADMIN";
    owner: OwnerRef | null;
};

/** PUT gövdesi — TAM yerine koyma + iyimser kilit sürümü (ProviderEditRequest). */
export type ProviderEditRequest = {
    version: number;
    name: string;
    address: string | null;
    district: string;
    phone: string | null;
    lat: number;
    lon: number;
    categoryIds: number[];
    brandIds: number[];
    openingHours: OpeningHours | null;
};

/** Değişiklik kaydındaki bir alanın önce/sonra değeri (değer tipi alana göre değişir). */
export type FieldChange = { before: unknown; after: unknown };

/** ChangeSetDto — `changes` yalnız değişen alanları taşır (kategori/marka tam küme). */
export type ChangeSet = {
    id: number;
    providerId: number;
    providerName?: string | null;
    /** Sahip yolunda yönetici kayıtlarında null (UI "Yönetici" yazar). */
    actorEmail?: string | null;
    actorRole: "OWNER" | "ADMIN";
    kind: "EDIT" | "REVERT";
    changes: Record<string, FieldChange>;
    attention: boolean;
    attentionReasons: Array<"NAME_CHANGED" | "MOVED_FAR" | string>;
    attentionResolvedAt?: string | null;
    revertsChangeSetId?: number | null;
    revertedById?: number | null;
    createdAt: string;
};

/** GET /api/admin/queues/counts — panel sekme rozetleri. */
export type QueueCounts = {
    pendingSuggestions: number;
    pendingClaims: number;
    pendingDisputes: number;
    openAttention: number;
};

/** GET /api/owner/providers satırı (OwnedProviderItem). */
export type OwnedProvider = {
    providerId: number;
    name: string;
    district?: string | null;
    since: string;
    avgScore?: number | null;
    ratingCount: number;
};

/** GET /api/suggestions/similar satırı (SimilarProviderDto) — 75 m içinde adı benzeyen gerçek dükkan. */
export type SimilarProvider = {
    id: number;
    name: string;
    district?: string | null;
    address?: string | null;
    distanceMeters: number;
};

export type SuggestionStatus = "PENDING" | "APPROVED" | "REJECTED" | "WITHDRAWN";

/** Üye görünümü (SuggestionDto). `possibleDuplicates` yalnız gönderim yanıtında dolu. */
export type Suggestion = {
    id: number;
    name: string;
    address?: string | null;
    district: string;
    phone?: string | null;
    lat: number;
    lon: number;
    categories: IdName[];
    brands: IdName[];
    note?: string | null;
    status: SuggestionStatus;
    decisionReason?: string | null;
    decidedAt?: string | null;
    createdProviderId?: number | null;
    createdAt: string;
    possibleDuplicates: SimilarProvider[];
};

/** UserRef — öneren / talep eden. */
export type UserRef = { userId: number; email: string };

/** Yönetici kuyruğu/ayrıntısı (AdminSuggestionItem): üye görünümü + öneren + tekrar sayısı. */
export type AdminSuggestionItem = Suggestion & {
    suggestedBy: UserRef;
    duplicateCandidateCount: number;
};

/** POST /api/admin/suggestions/{id}/approve yanıtı (SuggestionDecisionResponse). */
export type SuggestionDecision = { suggestion: AdminSuggestionItem; providerId?: number | null };

/** Öneri gövdesi (SuggestionCreateRequest) ve onaydaki düzeltmeler (ProviderFieldsRequest). */
export type ProviderFieldsRequest = {
    name: string;
    address: string | null;
    district: string;
    phone: string | null;
    lat: number;
    lon: number;
    categoryIds: number[];
    brandIds: number[];
    openingHours?: OpeningHours | null;
};
export type SuggestionCreateRequest = ProviderFieldsRequest & { note: string | null };

/** Talep belgesi üst verisi (ClaimDocumentMeta) — üyede indirme bağlantısı YOK. */
export type ClaimDocumentMeta = {
    id: number;
    originalName?: string | null;
    contentType: string;
    sizeBytes: number;
    deleted: boolean;
};

export type ClaimKind = "NORMAL" | "DISPUTE";
export type ClaimStatus = "PENDING" | "APPROVED" | "REJECTED" | "WITHDRAWN" | "EXPIRED";

/** Üye görünümü (ClaimDto). */
export type Claim = {
    id: number;
    provider: IdName;
    kind: ClaimKind;
    status: ClaimStatus;
    decisionReason?: string | null;
    createdAt: string;
    decidedAt?: string | null;
    documents: ClaimDocumentMeta[];
};

/** CurrentOwnerRef — talebin dükkanının aktif sahibi. */
export type CurrentOwnerRef = { ownershipId: number; userId: number; email: string; since: string };

/** Yönetici kuyruğu/ayrıntısı (AdminClaimItem); anonimleştirilmişse kişisel alanlar null. */
export type AdminClaimItem = {
    id: number;
    provider: IdName;
    providerDistrict?: string | null;
    kind: ClaimKind;
    status: ClaimStatus;
    decisionReason?: string | null;
    createdAt: string;
    decidedAt?: string | null;
    documents: ClaimDocumentMeta[];
    claimant: UserRef;
    fullName?: string | null;
    phone?: string | null;
    description?: string | null;
    kvkkVersion: string;
    kvkkAcceptedAt: string;
    anonymized: boolean;
    currentOwner?: CurrentOwnerRef | null;
    otherPendingClaims: number;
};

/** OwnershipDto — onay (201) ve geri alma yanıtı; `GET …/ownership` 200 gövdesi. */
export type Ownership = {
    id: number;
    providerId: number;
    providerName: string;
    userId: number;
    userEmail: string;
    startedAt: string;
    revokedAt?: string | null;
    revokeReason?: string | null;
    claimId?: number | null;
};

/** Talep formunun JSON parçası (ClaimSubmitRequest — multipart `data`). */
export type ClaimSubmitRequest = {
    fullName: string;
    phone: string;
    description: string;
    kvkkVersion: string;
    kvkkAccepted: boolean;
};
