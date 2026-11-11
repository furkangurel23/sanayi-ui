/*
 * E-POSTA DOĞRULAMA SAYFASI — maildeki linkin indiği yer (/verify-email?token=...).
 *
 * Next 16 kalıbı: token'ı SERVER Component (bu dosya) searchParams'tan okur ve
 * client bileşene PROP olarak verir. Böylece client tarafta useSearchParams'a
 * (ve onun zorunlu kıldığı Suspense sınırına) hiç gerek kalmaz — daha az kod,
 * daha az tuzak. Kural: "URL'i server oku, client'a prop indir."
 */
import VerifyEmailClient from "./VerifyEmailClient";
import {pageMetadata} from "@/lib/seo/site";

// 005 SEO: "noindex, follow" (rota tablosu) — openGraph/robots YALNIZ pageMetadata ile (sığ birleşme tuzağı).
export const metadata = pageMetadata({title: "E-posta Doğrulama", description: "E-posta adresini doğrula.", path: "/verify-email", index: false});

export default async function VerifyEmailPage({
                                                  searchParams,
                                              }: {
    searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
    const sp = await searchParams;
    const token = typeof sp.token === "string" ? sp.token : "";
    return <VerifyEmailClient token={token}/>;
}
