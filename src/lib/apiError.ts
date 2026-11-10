/**
 * Backend'in standart hata sözleşmesinin (ErrorResponse) TypeScript karşılığı.
 *
 * Backend her hatada şu JSON'u döner (GlobalExceptionHandler):
 * {
 *   "status": 404,
 *   "code": "error.provider.not-found",   // messages.properties anahtarı
 *   "message": "Usta bulunamadı: 42",      // kullanıcıya gösterilebilir Türkçe metin
 *   "fieldErrors": { "email": ["Geçerli bir e-posta girin."] } | null,
 *   "timestamp": "...", "path": "/api/..."
 * }
 *
 * Öğrenme notları:
 *  - `class ApiError extends Error`: JS'te kendi hata sınıfını türetmek,
 *    catch tarafında `instanceof ApiError` ile ayrım yapmayı sağlar.
 *  - `code` alanı sayesinde UI, metne değil KODA göre davranır
 *    (metin değişse bile kod sabit kalır — kırılgan string karşılaştırması yok).
 */

export type ApiFieldErrors = Record<string, string[]>;

export class ApiError extends Error {
    /** HTTP durum kodu (400, 401, 403, 404, 409, 413, 415, 500...) */
    readonly status: number;
    /** messages.properties anahtarı — programatik ayrım için */
    readonly code: string;
    /** Alan bazlı doğrulama hataları (yalnızca 400 validation'da dolu) */
    readonly fieldErrors?: ApiFieldErrors;

    constructor(status: number, code: string, message: string, fieldErrors?: ApiFieldErrors) {
        super(message); // Error.message -> kullanıcıya gösterilecek Türkçe metin
        this.name = "ApiError";
        this.status = status;
        this.code = code;
        this.fieldErrors = fieldErrors;
    }

    /** fieldErrors'ı "alan: mesaj" satırlarına çevirir (form altında topluca göstermek için). */
    fieldErrorLines(): string[] {
        if (!this.fieldErrors) return [];
        return Object.entries(this.fieldErrors).flatMap(([field, msgs]) =>
            msgs.map(m => `${field}: ${m}`)
        );
    }
}

/**
 * Başarısız bir fetch Response'unu ApiError'a çevirir.
 *
 * `async` fonksiyon her zaman Promise döner; `await res.json()` gövdeyi parse eder.
 * Gövde JSON değilse (ör. proxy hatası) generic bir ApiError üretilir — UI asla
 * "undefined" mesajla kalmaz.
 */
export async function toApiError(res: Response): Promise<ApiError> {
    try {
        const body = await res.json();
        return new ApiError(
            typeof body.status === "number" ? body.status : res.status,
            typeof body.code === "string" ? body.code : "error.unknown",
            typeof body.message === "string" ? body.message : `İstek başarısız (${res.status})`,
            body.fieldErrors ?? undefined,
        );
    } catch {
        // Gövde yok/parse edilemedi: durum koduna göre makul bir mesaj üret.
        const fallback =
            res.status === 401 ? "Bu işlem için giriş yapmalısınız." :
                res.status === 403 ? "Bu işlem için yetkiniz yok." :
                    res.status >= 500 ? "Sunucu hatası. Lütfen daha sonra tekrar deneyin." :
                        `İstek başarısız (${res.status})`;
        return new ApiError(res.status, "error.unknown", fallback);
    }
}

/** try/catch bloklarında her tür hatadan güvenle mesaj çıkarır. */
export function errorMessage(err: unknown, fallback = "Bir şeyler ters gitti."): string {
    if (err instanceof ApiError) return err.message;
    if (err instanceof Error && err.message) return err.message;
    return fallback;
}

/**
 * Alan hatalarını { alan: "ilk mesaj" } sözlüğüne çevirir (002 — alan hataları ALANIN
 * ALTINDA gösterilir). ApiError değilse ya da fieldErrors yoksa boş nesne döner;
 * böylece formda `fe.email && <span …>` gibi güvenle kullanılır.
 * Object.entries/fromEntries: nesne <-> [anahtar, değer] dizisi dönüşümü.
 */
export function fieldErrorMap(err: unknown): Record<string, string> {
    if (!(err instanceof ApiError) || !err.fieldErrors) return {};
    return Object.fromEntries(
        Object.entries(err.fieldErrors)
            .filter(([, msgs]) => msgs.length > 0)
            .map(([field, msgs]) => [field, msgs[0]])
    );
}
