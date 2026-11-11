/*
 * YENİ ŞİFRE BELİRLEME — maildeki linkin indiği yer (/reset-password?token=...).
 * Next 16 kalıbı: token'ı server oku, client'a prop indir (useSearchParams/Suspense'e
 * gerek kalmaz — bkz. verify-email/page.tsx'teki açıklama).
 */
import ResetPasswordClient from "./ResetPasswordClient";
import {pageMetadata} from "@/lib/seo/site";

// 005 SEO: "noindex, follow" (rota tablosu) — openGraph/robots YALNIZ pageMetadata ile (sığ birleşme tuzağı).
export const metadata = pageMetadata({title: "Şifre Sıfırlama", description: "Yeni şifreni belirle.", path: "/reset-password", index: false});

export default async function ResetPasswordPage({
                                                    searchParams,
                                                }: {
    searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
    const sp = await searchParams;
    const token = typeof sp.token === "string" ? sp.token : "";
    return <ResetPasswordClient token={token}/>;
}
