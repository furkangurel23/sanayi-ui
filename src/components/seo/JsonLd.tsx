/*
 * YAPILANDIRILMIŞ VERİ etiketi (005-seo-foundation) — sunucu bileşeni.
 *
 * `<script type="application/ld+json">` arama motorları içindir; tarayıcı çalıştırmaz. İçerik
 * `jsonLdScript` ile "<" kaçışlı yazılır: dükkan adında "</script>" geçse bile etiket erken kapanmaz
 * (dangerouslySetInnerHTML burada güvenli — kaçış lib/seo/jsonLd.ts'te, testli).
 */
import {jsonLdScript} from "@/lib/seo/jsonLd";

export default function JsonLd({data}: { data: unknown }) {
    return <script type="application/ld+json" dangerouslySetInnerHTML={{__html: jsonLdScript(data)}}/>;
}
