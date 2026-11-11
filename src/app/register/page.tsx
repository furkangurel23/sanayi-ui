/*
 * KAYIT SAYFASI — Server Component (yalnızca kabuk).
 *
 * Neden ayrı dosya? `metadata` (sekme başlığı: "Kayıt Ol | Sanayi Defteri") yalnızca SERVER
 * Component'ten export edilebilir; formun kendisi state/olay kullandığı için client.
 * Kalıp verify-email / reset-password ile aynı: server page -> client form bileşeni.
 */
import type {Metadata} from "next";
import RegisterForm from "./RegisterForm";

export const metadata: Metadata = {title: "Kayıt Ol"};

export default function RegisterPage() {
    return <RegisterForm/>;
}
