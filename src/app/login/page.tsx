/*
 * GİRİŞ SAYFASI — Server Component (yalnızca kabuk).
 *
 * Neden ayrı dosya? `metadata` (sekme başlığı: "Giriş | Sanayi") yalnızca SERVER
 * Component'ten export edilebilir; formun kendisi state/olay kullandığı için client.
 * Kalıp verify-email / reset-password ile aynı: server page -> client form bileşeni.
 */
import type {Metadata} from "next";
import LoginForm from "./LoginForm";

export const metadata: Metadata = {title: "Giriş"};

export default function LoginPage() {
    return <LoginForm/>;
}
