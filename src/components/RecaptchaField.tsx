"use client";

/*
 * reCAPTCHA KUTUSU — RateForm tarafından yalnızca gerektiğinde, DİNAMİK yüklenir.
 *
 * Öğrenme notları:
 *  - react-google-recaptcha bir sınıf bileşeni ve Google'ın script'ini yükler (~ağır).
 *    Üye kullanıcıya hiç gerekmez. Bu yüzden RateForm onu doğrudan import etmez;
 *    bu küçük sarmalayıcıyı `next/dynamic` ile yükler -> kod ayrı bir parçaya (chunk)
 *    ayrılır ve yalnızca anonim kullanıcıda, site key tanımlıyken indirilir.
 *  - Eskiden RateForm `ref` ile kutunun `reset()` metodunu çağırıyordu. `dynamic`
 *    ile yüklenen bileşenlere ref iletmek güvenilir değil; bu yüzden sözleşmeyi
 *    PROP'larla kurduk:
 *      onToken(token | null)  -> kullanıcı kutuyu işaretleyince/süre dolunca haber verir
 *      resetKey               -> değişince kutu `key` sayesinde SIFIRDAN kurulur
 *                                (React'te key değişimi = eski örneği at, yenisini mount et;
 *                                 yani "reset" imperatif çağrı olmadan, bildirimsel yapılır).
 *
 * TEMA (002 / D7): kutu aktif temayı KENDİ İÇİNDE okur (RateForm theme prop'u vermez):
 *  - useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot): React'in "dış bir
 *    kaynağa abone ol" hook'u. Kaynak burada <html data-theme="..."> özniteliği.
 *  - subscribe: MutationObserver yalnızca data-theme özniteliğini izler; ThemeToggle
 *    değiştirince callback çağrılır, React getSnapshot ile yeni değeri okur ve yeniden çizer.
 *  - getServerSnapshot = "dark": sunucuda DOM yok; varsayılan tema koyu (001 FR-021).
 *  - Widget'ın teması yalnızca KURULURKEN verilebilir; bu yüzden key'e tema da eklendi:
 *    tema değişince kutu yeniden kurulur ve çözülmüş token KAYBOLUR — kullanıcı tekrar
 *    işaretler (bilinçli karar). Üst bileşene onToken(null) bildirilir; gönder düğmesi
 *    token'a bağlı DEĞİL (yalnız puan/yorum geçerliliğine bağlı) — token yokken
 *    gönderilirse backend `error.recaptcha.missing` döner, RateForm bunu Türkçe uyarıya çevirir.
 *  - onToken "latest ref" kalıbıyla ref'te tutulur (Dialog.tsx'teki onCloseRef gibi):
 *    üst bileşen her render'da yeni bir fonksiyon verse bile effect yalnız TEMA değişince
 *    çalışır -> bağımlılık dizisi [theme].
 */
import {useEffect, useRef, useSyncExternalStore} from "react";
import ReCAPTCHA from "react-google-recaptcha";

type Props = {
    siteKey: string;
    onToken: (token: string | null) => void;
    resetKey: number;
};

function subscribeTheme(onChange: () => void) {
    const mo = new MutationObserver(onChange);
    mo.observe(document.documentElement, {attributes: true, attributeFilter: ["data-theme"]});
    return () => mo.disconnect();
}
const getTheme = (): "light" | "dark" => (document.documentElement.dataset.theme === "light" ? "light" : "dark");
const getServerTheme = (): "light" | "dark" => "dark";

export default function RecaptchaField({siteKey, onToken, resetKey}: Props) {
    const theme = useSyncExternalStore(subscribeTheme, getTheme, getServerTheme);

    // "latest ref": en güncel onToken; render sırasında değil, commit sonrası güncellenir.
    const onTokenRef = useRef(onToken);
    useEffect(() => {
        onTokenRef.current = onToken;
    }, [onToken]);

    // Tema değişince kutu yeniden kurulur ve eski token geçersizleşir -> üst bileşene
    // "token yok" bildir (eski token'la gönderim denenmesin). İlk render atlanır.
    const firstRender = useRef(true);
    useEffect(() => {
        if (firstRender.current) {
            firstRender.current = false;
            return;
        }
        onTokenRef.current(null);
    }, [theme]);
    return <ReCAPTCHA key={`${resetKey}-${theme}`} sitekey={siteKey} theme={theme} onChange={onToken}/>;
}
