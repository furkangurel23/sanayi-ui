/*
 * ŞİFREMİ UNUTTUM SAYFASI — Server Component (yalnızca kabuk).
 *
 * Neden ayrı dosya? `metadata` (sekme başlığı: "Şifremi Unuttum | Sanayi") yalnızca SERVER
 * Component'ten export edilebilir; formun kendisi state/olay kullandığı için client.
 * Kalıp verify-email / reset-password ile aynı: server page -> client form bileşeni.
 */
import type {Metadata} from "next";
import ForgotPasswordForm from "./ForgotPasswordForm";

export const metadata: Metadata = {title: "Şifremi Unuttum"};

export default function ForgotPasswordPage() {
    return <ForgotPasswordForm/>;
}
