"use client";

/*
 * HESAP KABUĞU (003 / T098) — oturum gerektiren üye sayfalarının ortak çerçevesi
 * (AdminShell'in üye karşılığı): başlık + "giriş gerekli" / "e-postanı doğrula" durumları.
 *
 * Akış:
 *  1) Hidrasyon bitene kadar iskelet: sunucu localStorage'ı (JWT) göremez; ilk client render'ı
 *     sunucu HTML'iyle aynı olmalı. "Hidrasyon bitti mi?" bilgisini `useSyncExternalStore`
 *     (sunucuda false, client'ta true) verir — effect + setState gerekmez.
 *  2) Belirteç yoksa: "Giriş yapın" boş durumu; bağlantı `/login?next=<bu sayfa>` (giriş sonrası
 *     buraya dönülür; next sunucuda safeNext ile doğrulanır).
 *  3) Belirteç varsa `GET /api/user/me`: JWT `emailVerified` taşımadığı için doğrulama durumu
 *     buradan okunur. 401 (süresi dolmuş/iptal) -> yine giriş ekranı.
 *  4) `requireVerified` ve e-posta doğrulanmamışsa doğrulama boş durumu.
 *  5) Hazırsa `children(me)` — render prop: sayfa, kullanıcı bilgisini (rol, e-posta) alır.
 */
import {type ReactNode, useSyncExternalStore} from "react";
import Link from "next/link";
import {usePathname} from "next/navigation";
import {useAuth} from "@/lib/useAuth";
import {useAuthedData} from "@/lib/useAuthedData";
import {getMe} from "@/lib/authApi";
import {ApiError, errorMessage} from "@/lib/apiError";
import type {CurrentUser} from "@/lib/types";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import {SkeletonList} from "@/components/SkeletonBlocks";
import {Lock, Mail} from "@/components/icons";

const noop = () => () => {
};

type Props = {
    title: string;
    eyebrow?: ReactNode;
    subtitle?: ReactNode;
    actions?: ReactNode;
    /** Giriş sonrası dönülecek yol (varsayılan: geçerli yol). */
    nextPath?: string;
    /** E-postası doğrulanmamış üyeye içerik gösterilmesin (form sayfaları). */
    requireVerified?: boolean;
    children: (me: CurrentUser) => ReactNode;
};

export default function AccountShell({
                                         title, eyebrow = <Link href="/account">Hesabım</Link>, subtitle, actions, nextPath,
                                         requireVerified = true, children,
                                     }: Props) {
    const pathname = usePathname();
    const hydrated = useSyncExternalStore(noop, () => true, () => false);
    const user = useAuth();
    const me = useAuthedData(user ? `me:${user.email}` : null, () => getMe());
    const loginHref = `/login?next=${encodeURIComponent(nextPath ?? pathname)}`;

    const header = <PageHeader eyebrow={eyebrow} title={title} subtitle={subtitle} actions={actions}/>;
    const unauthorized = !user || (me.error instanceof ApiError && me.error.status === 401);

    let body: ReactNode;
    if (!hydrated || (user && me.loading && !me.data)) {
        body = <SkeletonList count={2} withBlock={false}/>;
    } else if (unauthorized) {
        body = (
            <EmptyState icon={<Lock/>} title="Bu sayfa için giriş yapın"
                        description="Giriş yaptıktan sonra bu sayfaya geri döneceksiniz."
                        action={<>
                            <Link href={loginHref} className="btn btn-primary">Giriş yap</Link>
                            <Link href="/register" className="btn btn-outline">Üye ol</Link>
                        </>}/>
        );
    } else if (me.error) {
        body = <div className="alert alert-error" role="alert">{errorMessage(me.error, "Hesap bilgisi alınamadı.")}</div>;
    } else if (me.data && requireVerified && !me.data.emailVerified) {
        body = (
            <EmptyState icon={<Mail/>} title="Önce e-posta adresinizi doğrulayın"
                        description="Kayıt olurken gönderdiğimiz e-postadaki bağlantıya tıklayın. E-posta gelmediyse giriş ekranından yeniden gönderebilirsiniz."/>
        );
    } else if (me.data) {
        body = children(me.data);
    }

    return (
        <main className="container page">
            {header}
            {body}
        </main>
    );
}
