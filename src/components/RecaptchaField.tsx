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
 *    işaretler (bilinçli karar; gönder düğmesi zaten token yokken pasif).
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

    // Tema değişince kutu yeniden kurulur ve eski token geçersizleşir -> üst bileşene
    // "token yok" bildir (gönder düğmesi eski token'la denemesin). İlk render atlanır.
    const firstRender = useRef(true);
    useEffect(() => {
        if (firstRender.current) {
            firstRender.current = false;
            return;
        }
        onToken(null);
    }, [theme, onToken]);
    return <ReCAPTCHA key={`${resetKey}-${theme}`} sitekey={siteKey} theme={theme} onChange={onToken}/>;
}
