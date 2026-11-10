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
 *  - theme opsiyonel; verilmezse Google'ın varsayılanı (açık) — mevcut görünüm budur.
 */
import ReCAPTCHA from "react-google-recaptcha";

type Props = {
    siteKey: string;
    theme?: "light" | "dark";
    onToken: (token: string | null) => void;
    resetKey: number;
};

export default function RecaptchaField({siteKey, theme, onToken, resetKey}: Props) {
    return <ReCAPTCHA key={resetKey} sitekey={siteKey} theme={theme} onChange={onToken}/>;
}
