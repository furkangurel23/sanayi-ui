/*
 * KAYIT SAYFASI — Server Component (yalnızca kabuk).
 *
 * Neden ayrı dosya? `metadata` (sekme başlığı: "Kayıt Ol | Sanayi Defteri") yalnızca SERVER
 * Component'ten export edilebilir; formun kendisi state/olay kullandığı için client.
 * Kalıp verify-email / reset-password ile aynı: server page -> client form bileşeni.
 */
import type {Metadata} from "next";
import RegisterForm from "./RegisterForm";
import {pageMetadata} from "@/lib/seo/site";

// 005 SEO: "noindex, follow" (rota tablosu) — openGraph/robots YALNIZ pageMetadata ile (sığ birleşme tuzağı).
export const metadata: Metadata = pageMetadata({title: "Kayıt Ol", description: "Sanayi Defteri'ne üye ol: sınırsız yorum, dükkan önerisi ve marka sohbetleri.", path: "/register", index: false});

export default function RegisterPage() {
    return <RegisterForm/>;
}
