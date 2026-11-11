/*
 * DÜKKAN LİSTESİ SEGMENT LAYOUT'U — yalnızca harita karo sunucusu için bağlantı ön ısıtması.
 *
 * Öğrenme notları:
 *  - preconnect() (react-dom): tarayıcıya "bu sunucuya şimdiden DNS + TCP + TLS bağlantısı aç"
 *    der; dosya İNDİRMEZ. Harita açılınca ilk karolar bağlantı kurulumunu beklemez -> LCP kısalır.
 *  - Neden MapSection'da değil de burada? Liste sayfası `loading.tsx` (Suspense) içinde akar;
 *    sayfa verisi gelmeden önce kabuk (shell) gönderilirse, sayfanın derinindeki bir bileşende
 *    çağrılan preconnect bazen <head>'e yetişmiyordu (kod incelemesi: 3 denemenin 2-3'ünde yok).
 *    Layout ise loading sınırının ÜSTÜNDE, kabukla birlikte render edilir -> ipucu her zaman
 *    ilk baytlarda <head>'dedir.
 *  - Mobilde harita kapalı başlasa da ipucu zararsızdır (karo indirilmez); kullanıcı haritayı
 *    açarsa bağlantı hazırdır.
 */
import React from "react";
import {preconnect} from "react-dom";
import {tileOrigin} from "@/lib/mapTiles";

export default function ProvidersListLayout({children}: { children: React.ReactNode }) {
    const tiles = tileOrigin(); // 006: karo kaynağı ayarlanabilir (lib/mapTiles.ts)
    if (tiles) preconnect(tiles);
    return children;
}
