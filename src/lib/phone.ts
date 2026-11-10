/*
 * TELEFON GÖSTERİMİ (002, sahip kararı): veritabanı telefonları E.164 biçiminde tutar
 * ("+903123545166") — tek biçim, `tel:` bağlantısı için doğru. İnsan için okunur biçim
 * ("+90 312 354 51 66") yalnız GÖSTERİMDE üretilir; veri değişmez.
 *
 * Kural: +90 ve 10 hane ise 3-3-2-2 gruplanır (sabit hat 312…, mobil 5xx… aynı düzen).
 * E.164 olmayan eski/serbest değer olduğu gibi döner (bozmaktan iyidir).
 */
const E164_TR = /^\+90(\d{3})(\d{3})(\d{2})(\d{2})$/;

export function formatPhoneTR(phone: string | null | undefined): string {
    if (!phone) return "";
    const m = E164_TR.exec(phone.trim());
    return m ? `+90 ${m[1]} ${m[2]} ${m[3]} ${m[4]}` : phone;
}
