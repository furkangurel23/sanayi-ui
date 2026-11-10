/*
 * YENİ ŞİFRE BELİRLEME — maildeki linkin indiği yer (/reset-password?token=...).
 * Next 16 kalıbı: token'ı server oku, client'a prop indir (useSearchParams/Suspense'e
 * gerek kalmaz — bkz. verify-email/page.tsx'teki açıklama).
 */
import ResetPasswordClient from "./ResetPasswordClient";

export const metadata = {
    title: "Şifre Sıfırlama",
};

export default async function ResetPasswordPage({
                                                    searchParams,
                                                }: {
    searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
    const sp = await searchParams;
    const token = typeof sp.token === "string" ? sp.token : "";
    return <ResetPasswordClient token={token}/>;
}
