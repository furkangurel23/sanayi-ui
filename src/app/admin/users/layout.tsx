/*
 * ADMIN · KULLANICILAR — yalnız sekme başlığı için ince SERVER layout.
 *
 * Neden ayrı dosya? Bu segmentin page.tsx'i tamamen "use client" (eski SPA ekranı) ve client
 * bileşen `metadata` export EDEMEZ (Next.js metadata'yı yalnız sunucuda okur). Layout bir Server
 * Component'tir: başlığı burada verir, çocuğu (client sayfayı) olduğu gibi sarar. Alt
 * segmentlerin kendi metadata'sı (ör. /admin/providers/[id] "Dükkan düzenle · Admin") bunu ezer.
 *
 * DİKKAT (Next metadata kuralı): layout'ta DÜZ string `title` verilirse kök layout'un
 * `template`'i ("%s | Sanayi") bu segmentin ALTINDAKİ sayfalara artık uygulanmaz — zincir
 * burada kopar (ör. /admin/providers/[id] başlığı "| Sanayi"siz kalıyordu). Bu yüzden nesne
 * biçimi: `default` bu sayfanın başlığı (kökün şablonuyla birleşir), `template` alt
 * segmentlere aynı soneki yeniden verir.
 */
import type {Metadata} from "next";
import type {ReactNode} from "react";

export const metadata: Metadata = {
    title: {default: "Kullanıcılar · Admin", template: "%s | Sanayi"},
    robots: {index: false},
};

export default function Layout({children}: { children: ReactNode }) {
    return children;
}
