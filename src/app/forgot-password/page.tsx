/*
 * ŞİFREMİ UNUTTUM SAYFASI — Server Component (yalnızca kabuk).
 *
 * Neden ayrı dosya? `metadata` (sekme başlığı: "Şifremi Unuttum | Sanayi Defteri") yalnızca SERVER
 * Component'ten export edilebilir; formun kendisi state/olay kullandığı için client.
 * Kalıp verify-email / reset-password ile aynı: server page -> client form bileşeni.
 */
import type {Metadata} from "next";
import ForgotPasswordForm from "./ForgotPasswordForm";
import {pageMetadata} from "@/lib/seo/site";

// 005 SEO: "noindex, follow" (rota tablosu) — openGraph/robots YALNIZ pageMetadata ile (sığ birleşme tuzağı).
export const metadata: Metadata = pageMetadata({title: "Şifremi Unuttum", description: "Şifre sıfırlama bağlantısı iste.", path: "/forgot-password", index: false});

export default function ForgotPasswordPage() {
    return <ForgotPasswordForm/>;
}
