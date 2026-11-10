"use client";

/*
 * DÜKKAN ÖNER FORMU (003 / T105) — ProviderEditForm'un "suggest" modu + olası tekrar kontrolü.
 *
 * Olası tekrar (debounce): ad (≥2 harf) VE onaylı konum varken, kullanıcı yazmayı bıraktıktan
 * 600 ms sonra `/api/suggestions/similar` sorulur. Her tuşta istek atılmaz (debounce = son
 * değişiklikten sonra bekle); eski zamanlayıcı iptal edilir. Sırasız yanıt koruması: her istek
 * bir sıra numarası alır, yalnız EN SON isteğin yanıtı yazılır. Hata sessizce yutulur (uyarı
 * yardımcı bilgidir; asıl gönderim etkilenmez).
 *
 * Hatalar: 403 (e-posta doğrulanmamış) ve 429 ("24 saatte en fazla 5 öneri") backend'in Türkçe
 * mesajıyla formun üstünde gösterilir (ProviderEditForm). Başarıda çağıran yönlendirir.
 */
import {useRef, useState} from "react";
import type {IdName, SimilarProvider, Suggestion} from "@/lib/types";
import {ensureFreshToken} from "@/lib/auth";
import {ApiError} from "@/lib/apiError";
import {similarProviders, submitSuggestion} from "@/lib/accountApi";
import {emptyForm, formToSuggestionRequest, type ProviderFormValues} from "@/lib/providerFields";
import ProviderEditForm from "@/components/ProviderEditForm";
import SimilarShopsNotice from "@/components/SimilarShopsNotice";

type Props = {
    categories: IdName[];
    brands: IdName[];
    onSubmitted: (s: Suggestion) => void;
};

export default function SuggestForm({categories, brands, onSubmitted}: Props) {
    const [similar, setSimilar] = useState<SimilarProvider[]>([]);
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const seq = useRef(0);

    function checkSimilar(name: string, location: ProviderFormValues["location"]) {
        if (timer.current) clearTimeout(timer.current);
        const n = name.trim();
        if (n.length < 2 || !location) {
            seq.current++; // bekleyen yanıtı geçersiz kıl
            setSimilar([]);
            return;
        }
        timer.current = setTimeout(async () => {
            const mine = ++seq.current;
            try {
                const token = await ensureFreshToken();
                if (!token) return;
                const list = await similarProviders(token, n, location.lat, location.lon);
                if (mine === seq.current) setSimilar(list);
            } catch {
                if (mine === seq.current) setSimilar([]);
            }
        }, 600);
    }

    return (
        <ProviderEditForm
            mode="suggest" categories={categories} brands={brands} initial={emptyForm()}
            submitLabel={similar.length > 0 ? "Yine de gönder" : "Öneriyi gönder"}
            submittingLabel="Gönderiliyor…"
            onIdentityChange={checkSimilar}
            beforeSubmit={<SimilarShopsNotice items={similar}/>}
            onSubmit={async values => {
                const token = await ensureFreshToken();
                if (!token) throw new ApiError(401, "error.auth.unauthorized", "Oturumunuzun süresi doldu. Yeniden giriş yapın.");
                const created = await submitSuggestion(token, formToSuggestionRequest(values));
                onSubmitted(created);
            }}
        />
    );
}
