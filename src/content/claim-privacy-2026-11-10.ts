/*
 * SAHİPLENME TALEBİ — KVKK AYDINLATMA METNİ (ŞABLON) — sürüm 2026-11-10 (003 / T111).
 *
 * TASLAKTIR: hukuki onay gerekir. Metin yapılandırılmış veri olarak tutulur; sayfa
 * (/legal/claim-privacy) ve talep formundaki kısa özet aynı kaynaktan okur. Saklama süreleri
 * backend yaşam döngüsü işiyle (ClaimMaintenanceService) aynıdır: bekleyen talep 30 günde süresi
 * dolar; karar/geri çekme/süre dolumu sonrası belgeler 30 gün içinde silinir; ad-soyad, telefon ve
 * açıklama 180 gün sonra anonimleştirilir.
 */
export type PrivacySection = { heading: string; paragraphs: string[]; items?: string[] };

export const CLAIM_PRIVACY_DRAFT_NOTICE = "TASLAK — hukuki onay gerekir. Bu metin şablondur; yayına alınmadan önce bir hukukçu tarafından gözden geçirilmelidir.";

export const CLAIM_PRIVACY_TITLE = "Dükkan sahiplenme talebi aydınlatma metni";

/** Talep formundaki kısa özet (<details> içinde). */
export const CLAIM_PRIVACY_SUMMARY: string[] = [
    "Ad-soyad, telefon, açıklama ve yüklediğiniz belgeler yalnız dükkan sahipliğinizi doğrulamak için işlenir.",
    "Belgeleri yalnız yöneticiler görür; herkese açık değildir ve üçüncü kişilere aktarılmaz.",
    "Belgeler karar verildikten (ya da talep kapandıktan) en geç 30 gün sonra silinir; kişisel bilgileriniz 180 gün sonra anonimleştirilir.",
    "KVKK madde 11 kapsamındaki haklarınızı kullanmak için bize başvurabilirsiniz.",
];

export const CLAIM_PRIVACY_SECTIONS: PrivacySection[] = [
    {
        heading: "1. Veri sorumlusu",
        paragraphs: [
            "Bu aydınlatma metni, 6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK) madde 10 uyarınca, Sanayi platformunun işletmecisi sıfatıyla veri sorumlusu tarafından hazırlanmıştır. Veri sorumlusunun unvanı ve iletişim adresi yayın öncesinde bu bölüme eklenecektir.",
        ],
    },
    {
        heading: "2. İşlenen kişisel veriler",
        paragraphs: ["Dükkan sahiplenme talebi gönderdiğinizde aşağıdaki veriler işlenir:"],
        items: [
            "Kimlik: ad-soyad.",
            "İletişim: telefon numarası ve hesabınıza kayıtlı e-posta adresi.",
            "Talep bilgisi: açıklama metni, talep tarihi, onay kutusunu işaretlediğiniz an ve metin sürümü.",
            "Belgeler: sahipliği gösteren vergi levhası, oda kaydı, kira sözleşmesi gibi JPG, PNG veya PDF dosyaları (en fazla 3 adet, her biri en çok 10 MB). Görsellerdeki konum ve cihaz bilgileri (EXIF) kayıt sırasında silinir.",
        ],
    },
    {
        heading: "3. İşleme amacı ve hukuki sebep",
        paragraphs: [
            "Veriler, talebinizi değerlendirmek, dükkanın gerçek sahibi olduğunuzu doğrulamak, aynı dükkana gelen itirazları sonuçlandırmak ve karar hakkında size bilgi vermek amacıyla işlenir.",
            "Hukuki sebep: talebinizle kurulan ilişkinin ifası için gerekli olması (KVKK m.5/2-c) ve veri sorumlusunun meşru menfaati (KVKK m.5/2-f). Belgeler bu amaç dışında kullanılmaz.",
        ],
    },
    {
        heading: "4. Saklama süreleri",
        paragraphs: ["Veriler amaç için gerekli süre kadar saklanır ve süre sonunda otomatik olarak silinir veya anonimleştirilir:"],
        items: [
            "İncelemede kalan talep 30 gün içinde sonuçlanmazsa süresi dolar ve kapatılır.",
            "Belgeler; talep onaylandıktan, reddedildikten, geri çekildikten ya da süresi dolduktan sonra en geç 30 gün içinde kalıcı olarak silinir.",
            "Ad-soyad, telefon ve açıklama, talebin kapanmasından 180 gün sonra anonimleştirilir; talebin varlığı ve kararı kayıt bütünlüğü için anonim olarak saklanır.",
        ],
    },
    {
        heading: "5. Aktarım",
        paragraphs: [
            "Kişisel verileriniz ve belgeleriniz üçüncü kişilere aktarılmaz ve yurt dışına gönderilmez. Belgeler yalnız platform yöneticilerine açıktır; her görüntüleme kayıt altına alınır. Belgeler herkese açık bir adresten sunulmaz.",
        ],
    },
    {
        heading: "6. Haklarınız (KVKK m.11)",
        paragraphs: ["Veri sorumlusuna başvurarak:"],
        items: [
            "kişisel verilerinizin işlenip işlenmediğini öğrenme ve işlenmişse bilgi talep etme,",
            "işleme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme,",
            "aktarıldığı üçüncü kişileri bilme,",
            "eksik veya yanlış işlenmişse düzeltilmesini, şartları oluşmuşsa silinmesini veya yok edilmesini isteme ve bu işlemlerin aktarıldığı kişilere bildirilmesini isteme,",
            "otomatik sistemlerle analiz sonucu aleyhinize bir sonuca itiraz etme ve kanuna aykırı işleme nedeniyle zarara uğramanız hâlinde zararın giderilmesini talep etme haklarına sahipsiniz.",
        ],
    },
    {
        heading: "7. Başvuru",
        paragraphs: [
            "Haklarınıza ilişkin taleplerinizi, hesabınıza kayıtlı e-posta adresinden veri sorumlusunun iletişim adresine yazılı olarak iletebilirsiniz. Başvurunuz en geç 30 gün içinde ücretsiz olarak sonuçlandırılır. Talebinizi incelemedeyken “Taleplerim” sayfasından geri çekebilirsiniz; geri çekilen talebin belgeleri hemen silinir.",
        ],
    },
];
