/*
 * FONT YÜKLEYİCİ — kök layout ve global-error aynı Geist örneğini paylaşır.
 *
 * Öğrenme notları:
 *  - next/font/google fontu BUILD sırasında indirir ve kendi sunucumuzdan servis eder
 *    (çalışma anında Google'a istek gitmez -> hız + gizlilik).
 *  - `variable`: font, body'ye eklenen bir CSS değişkeni (--font-geist-sans) olarak
 *    gelir; globals.css `body { font-family: var(--font-geist-sans), ... }` ile kullanır.
 *  - `subsets: ["latin", "latin-ext"]`: Türkçe'deki ğ, ş, ı, İ gibi harfler temel
 *    "latin" alt kümesinde YOK, "latin-ext"tedir. Yalnız "latin" yüklenirse bu harfler
 *    yedek (sistem) fontuyla çizilir — kelimenin ortasında font değişir.
 *  - next/font yükleyicileri modül seviyesinde (sabit olarak) çağrılmalıdır; bu yüzden
 *    burada bir kez tanımlayıp export ediyoruz.
 */
import {Geist} from "next/font/google";

export const geist = Geist({variable: "--font-geist-sans", subsets: ["latin", "latin-ext"]});
