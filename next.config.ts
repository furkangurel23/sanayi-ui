import type {NextConfig} from "next";

/*
 * GÜVENLİK HEADER'LARI — her yanıta eklenir (savunma katmanı).
 *  - X-Content-Type-Options: nosniff -> tarayıcı MIME türünü "tahmin etmesin";
 *    yanlışlıkla script olarak yorumlanan içerik saldırılarını (MIME sniffing) keser.
 *  - X-Frame-Options: DENY -> site iframe'e gömülemez (clickjacking koruması).
 *  - Referrer-Policy -> dış sitelere tam URL sızdırma (query'deki token vb. riskine karşı).
 *  - Permissions-Policy -> kullanmadığımız tarayıcı yeteneklerini kapat
 *    (geolocation'ı KENDİ origin'imize açık bırakıyoruz: "Yakınımdakiler" özelliği kullanıyor).
 */
const securityHeaders = [
    {key: "X-Content-Type-Options", value: "nosniff"},
    {key: "X-Frame-Options", value: "DENY"},
    {key: "Referrer-Policy", value: "strict-origin-when-cross-origin"},
    {key: "Permissions-Policy", value: "geolocation=(self), camera=(), microphone=()"},
];

const nextConfig: NextConfig = {
    async headers() {
        return [{source: "/(.*)", headers: securityHeaders}];
    },
};

export default nextConfig;
