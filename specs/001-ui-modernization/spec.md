# Feature Specification: UI Bakım ve Performans Modernizasyonu

**Feature Branch**: `001-ui-modernization` (main üzerinde, ayrı commit)

**Created**: 2026-11-10

**Status**: Draft (rev 2 — frontend-reviewer spec incelemesi sonrası)

**Input**: User description: "Sanayi UI'ın bakım ve performans modernizasyonu: bağımlılıkları güncel kararlı sürümlere çek, kullanılmayan bağımlılık ve ölü kodu kaldır, kullanıcıya hissedilen performansı iyileştir, bulunan hataları (404 yerine 500, sayfa 0, popup enjeksiyonu, meta hatasında çöken liste, eksik kök hata/404 sayfaları) düzelt. Görsel yeniden tasarım kapsam dışı. Davranış ve URL'ler değişmemeli; lint ve prod build temiz geçmeli."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Sayfalar hızlı açılır (Priority: P1)

Bir ziyaretçi ana sayfayı, marka sohbet listesini, dükkan listesini ve dükkan detayını açar. Sayfalar gereksiz büyük görseller, kullanılmayan kod ve sırayla bekleyen veri istekleri yüzünden yavaşlamaz; mobil bağlantıda bile içerik kısa sürede görünür.

**Why this priority**: Kullanıcının doğrudan hissettiği kalem. Ölçüme göre marka logoları tek başına ~2.9 MB (`seat.png` 601 KB, `fiat.png` 338 KB); sohbet listesi 38 logo yüklüyor.

**Independent Test**: Değişiklikten önce ve sonra aynı ölçüm yöntemiyle (FR-025) sayfaların aktarılan boyutu, LCP/CLS/TBT ve ilk yüklenen JS boyutu kıyaslanır; görünüm aynı kalır.

**Acceptance Scenarios**:

1. **Given** ziyaretçi `/chat` sayfasını açıp sayfa sonuna kadar kaydırıyor, **When** 38 marka logosunun tamamı yüklendiğinde, **Then** logoların toplam aktarılan boyutu 300 KB'ın altındadır, tek bir logo 10 KB'ı geçmez ve logolar önceki boyut ve konumlarında görünür.
2. **Given** dükkan listesi sayfası açılıyor, **When** sayfa veri topluyor, **Then** marka, kategori ve dükkan verileri birbirini beklemeden aynı anda istenir.
3. **Given** dükkan detayı açılıyor, **When** sayfa veri topluyor, **Then** dükkan bilgisi ve yorumlar birbirini beklemeden aynı anda istenir.
4. **Given** harita içermeyen bir sayfa (ör. `/`, `/login`, `/chat`), **When** sayfa yükleniyor, **Then** harita stil ve kodu indirilmez.
5. **Given** giriş yapmış bir üye dükkan detayında puan veriyor, **When** form yükleniyor, **Then** robot doğrulama (reCAPTCHA) kodu indirilmez; yalnızca anonim kullanıcıya ve doğrulama açıkken yüklenir.
6. **Given** sayfada Türkçe karakter (ğ, ş, ı, İ, ç, ö, ü) içeren metin var, **When** sayfa görüntüleniyor, **Then** bu karakterler ana yazı tipiyle çizilir, yedek fonta düşmez.

---

### User Story 2 - Hatalı adres ve arıza durumunda doğru sayfa (Priority: P1)

Ziyaretçi olmayan bir dükkan adresini, bozuk bir sayfa numarasını ya da hatalı bir filtre değerini açar veya arka uç kısa süre yanıt vermez. Uygulama çökmek yerine anlamlı bir "bulunamadı" ya da Türkçe hata sayfası gösterir; sayfanın geri kalanı mümkün olduğunca çalışır.

**Why this priority**: Olmayan dükkan şu an 500 veriyor (arka uç 404 dönüyor ama UI bunu kaybediyor). Meta veri hatası tüm liste sayfasını düşürüyor; hata ekranları ham, İngilizce teknik mesaj gösteriyor.

**Independent Test**: Olmayan/bozuk dükkan kimliğiyle detay, `?page=0` ile yorum sayfalaması, `?brandId=abc` ile liste, marka/kategori servisi kapalıyken liste açılır; her birinde beklenen sayfa görülür.

**Acceptance Scenarios**:

1. **Given** var olmayan ya da sayısal olmayan bir dükkan kimliği, **When** detay adresi açılıyor, **Then** "bulunamadı" sayfası 404 durum koduyla gösterilir.
2. **Given** var olmayan herhangi bir adres, **When** açılıyor, **Then** mevcut görsel dile uygun Türkçe 404 sayfası 404 durum koduyla gösterilir.
3. **Given** dükkan detayı `/providers/{id}?page=0` (veya negatif sayfa) ile açılıyor, **When** yorumlar yükleniyor, **Then** ilk yorum sayfası gösterilir ve arka uca negatif sayfa numarası gönderilmez.
4. **Given** liste/detay adresinde sayısal olmayan veya aralık dışı parametreler (`?page=abc`, `?size=99999`, `?brandId=abc`), **When** sayfa açılıyor, **Then** geçersiz değerler yok sayılır ya da varsayılana düşer; arka uca `NaN`/geçersiz değer gitmez ve sayfa çalışır.
5. **Given** marka/kategori listesi alınamıyor, **When** dükkan listesi açılıyor, **Then** dükkanlar yine listelenir; yalnızca ilgili filtre seçenekleri boş kalır.
6. **Given** dükkan bilgisi alınabiliyor ama yorum isteği başarısız, **When** detay açılıyor, **Then** dükkan bilgisi görünür, yorum bölümünde Türkçe hata mesajı çıkar.
7. **Given** herhangi bir sayfada (kök düzen/üst bar dahil) beklenmeyen bir hata, **When** hata yakalanıyor, **Then** sabit Türkçe bir mesaj ve "Tekrar dene" düğmesi gösterilir; ham hata metni gösterilmez; "Tekrar dene" sunucu verisini yeniden çeker; beyaz ekran görünmez.

---

### User Story 3 - Güvenli harita popup'ı (Priority: P2)

Haritada bir dükkan işaretçisine tıklanınca dükkan adı ve konumu gösterilir. Bu metinler HTML/komut içerse bile düz metin olarak gösterilir, çalıştırılmaz.

**Why this priority**: Dükkan adları içe aktarma betikleri ve admin ile giriliyor; tek bir kötü kayıt tüm ziyaretçilerde komut çalıştırabilir (XSS). Ad, ilçe ve şehir şu an kaçışsız basılıyor.

**Independent Test**: Adı `<img src=x onerror=alert(1)>` olan bir dükkan haritada gösterilir; popup bu metni düz yazı olarak gösterir, uyarı penceresi açılmaz.

**Acceptance Scenarios**:

1. **Given** adı, ilçesi veya şehri HTML etiketleri içeren bir dükkan, **When** haritadaki işaretçisi tıklanıyor, **Then** popup metinleri harfiyen düz metin olarak gösterir ve hiçbir komut çalışmaz.

---

### User Story 4 - Güncel ve sade bağımlılıklar (Priority: P2)

Geliştirici projeyi kurduğunda desteklenen bir çalışma ortamında, yalnızca gerçekten kullanılan paketlerle, güncel kararlı sürümlerle çalışır; kullanılmayan dosya, fonksiyon, stil sınıfı ve yapılandırma kalmaz; dokümanlar gerçeği yansıtır.

**Why this priority**: Güvenlik yamaları (Node 20'nin desteği 2026-04-30'da bitti), kurulum süresi; ayrıca 002 yeniden tasarımı temiz bir zemine kurulacak.

**Independent Test**: Bağımlılık listesindeki her paketin kodda kullanıldığı gösterilebilir; güncel olmayan paket raporunda yalnızca "Kapsam Dışı"da adıyla listelenenler kalır; lint, üretim derlemesi ve CI yeşil.

**Acceptance Scenarios**:

1. **Given** güncelleme sonrası proje, **When** güncel olmayan paketler listeleniyor, **Then** yalnızca "Kapsam Dışı" bölümünde adı ve gerekçesiyle listelenen paketler görünür.
2. **Given** güncelleme sonrası proje, **When** lint çalıştırılıyor, **Then** 0 hata verir ve uyarı sayısı başlangıçtaki 7'yi geçmez; üretim derlemesi hatasız tamamlanır.
3. **Given** güncelleme sonrası depo, **When** CI çalışıyor, **Then** sabitlenmiş çalışma ortamı sürümüyle yeşil geçer; çalışma ortamı sürümü tek bir yerde tanımlıdır ve yerel geliştirme, CI ve tip paketleri bununla uyumludur.
4. **Given** kaldırılan paket/dosya/sınıf listesi, **When** kod tabanında aranıyor, **Then** hiçbirine referans kalmamıştır.
5. **Given** mevcut tüm rotalar, **When** güncelleme sonrası gezilerek kontrol ediliyor, **Then** her rota önceki URL'iyle ve önceki davranışıyla çalışır (filtreler, sayfalama, harita, sohbet, giriş akışları, admin).
6. **Given** proje dokümanları (CLAUDE.md, anayasa, README), **When** okunuyor, **Then** güncel sürümleri, kaldırılan paketleri ve çalışma ortamını doğru anlatır.

### Edge Cases

- Logo dosyası olmayan bir marka: mevcut yedek görünüm (baş harf) korunur.
- Konum aramasında (yakınımdakiler) koordinatlar her istekte farklı: sonuçlar her istekte güncel gelir (önbelleğe alınmaz); yarıçap 1–100 km aralığına sıkıştırılır ve ekranda sıkıştırılmış değer gösterilir.
- JavaScript kapalı tarayıcı: tema, JS açıkkenki varsayılanla aynıdır (koyu).
- Admin ekranları: güncelleme sonrası tablo, sayfalama ve onay butonları önceki gibi çalışır.
- Marka kartı aç/kapa: klavyeyle çalışır, açık/kapalı durumu ekran okuyucuya bildirilir.

## Requirements *(mandatory)*

### Functional Requirements

**Bağımlılıklar, çalışma ortamı ve temizlik**

- **FR-001**: `next` ve `eslint-config-next` aynı, en güncel kararlı sürüme; `react`/`react-dom`, `@types/react`/`@types/react-dom`, `@types/leaflet`, `@stomp/stompjs` ve `eslint` (9.x hattı) en güncel uyumlu kararlı sürüme yükseltilmelidir.
- **FR-002**: Uyumluluk engeli olan yükseltmeler (`typescript` 7, `eslint` 10, `leaflet` 2) yapılmamalı; gerekçeleri plan belgesinde kayıt altına alınmalıdır.
- **FR-003**: Kodda hiç kullanılmayan `zod` ve `react-leaflet` paketleri bağımlılıklardan kaldırılmalıdır.
- **FR-004**: Proje şablonundan kalan ve referans verilmeyen statik dosyalar (`public/file.svg`, `globe.svg`, `next.svg`, `vercel.svg`, `window.svg`), kullanılmayan dışa aktarılan fonksiyonlar, kullanılmayan stil sınıfları, kullanılmayan ikinci yazı tipi (mono), içi boş yapılandırma dosyası ve depoya girmiş `.DS_Store` dosyaları kaldırılmalıdır.
- **FR-005**: Artık etkisi olmayan eski yardımcı sınıf adları yalnızca silinmelidir; yerine yeni sınıf konmamalı, görsel fark sıfır olmalıdır.
- **FR-006**: Çalışma ortamı desteklenen bir LTS sürümüne (Node 24) yükseltilmeli; sürüm tek bir yerde sabitlenmeli (`.nvmrc` + `engines`), CI aynı sürümü kullanmalı, `@types/node` bu sürümle hizalanmalıdır.
- **FR-007**: Proje dokümanları (CLAUDE.md, anayasa, README) güncel sürümleri, kaldırılan paketleri ve çalışma ortamını yansıtacak şekilde güncellenmelidir; README şablon içeriği proje bilgisiyle değiştirilmelidir.

**Performans**

- **FR-008**: Marka logoları görüntülendikleri boyuta (2x piksel yoğunluğu dahil) uygun çözünürlükte ve modern sıkıştırılmış biçimde sunulmalı; logo başına ≤10 KB olmalıdır.
- **FR-009**: Bir sayfanın birbirinden bağımsız veri istekleri paralel yapılmalıdır (dükkan listesi: marka + kategori + dükkanlar; detay: dükkan + yorumlar).
- **FR-010**: Harita bileşeni ve stilleri anayasa I'e uygun biçimde yalnızca istemcide, ayrı yüklenen bir parça olarak ve sadece harita gösteren rotalarda (`/providers`, `/providers/[id]`, `/providers/near`) yüklenmelidir.
- **FR-011**: Robot doğrulama bileşeni yalnızca gerçekten gösterileceği durumda (anonim kullanıcı ve doğrulama açık) yüklenmelidir.
- **FR-012**: Marka kartının aç/kapa etkileşimi, sayfa verisinin tamamını istemciye taşımadan sağlanmalı; klavyeyle çalışmalı ve açık/kapalı durumu yardımcı teknolojilere bildirilmelidir.
- **FR-013**: Giriş, kayıt ve şifremi unuttum sayfaları sırasıyla "Giriş", "Kayıt Ol", "Şifremi Unuttum" sayfa başlıklarını (tarayıcı sekmesi) taşımalıdır; etkileşimli form kısmı ayrı tutulmalıdır.
- **FR-014**: Ana yazı tipi Türkçe karakterleri kapsayan karakter setiyle yüklenmelidir.
- **FR-015**: Konuma göre arama sonuçları önbelleğe alınmadan her istekte güncel alınmalı (konuma özel sorgu istisnası planda gerekçelendirilir); yarıçap 1–100 km aralığına sıkıştırılmalı ve ekranda sıkıştırılmış değer gösterilmelidir.

**Hata düzeltmeleri**

- **FR-016**: Var olmayan ya da geçersiz kimlikli dükkan detayı 404 durum koduyla "bulunamadı" sayfası döndürmelidir.
- **FR-017**: Uygulama genelinde Türkçe bir 404 sayfası ve hem rota seviyesinde hem kök düzen seviyesinde hata sınırı bulunmalıdır. Hata ekranları sabit Türkçe mesaj göstermeli, ham hata metnini göstermemeli; "Tekrar dene" sunucu verisini yeniden çekmelidir. Aynı içerikli rota hata ekranları tek bir ortak tanıma indirgenmelidir.
- **FR-018**: Sayfa numarası 0, negatif veya sayısal olmayan geldiğinde ilk sayfa istenmeli; sayısal olmayan filtre kimlikleri yok sayılmalı; sayfa boyutu makul üst sınırla sınırlanmalı; arka uca hiçbir zaman negatif/`NaN` değer gönderilmemelidir (liste ve detay yorum sayfalaması dahil).
- **FR-019**: Dükkan listesi marka/kategori verisi alınamadığında da dükkanları göstermeli; dükkan detayı yorumlar alınamadığında da dükkan bilgisini göstermelidir.
- **FR-020**: Harita popup'ında gösterilen tüm kullanıcı kaynaklı metinler (ad, ilçe, şehir) HTML olarak yorumlanmadan düz metin olarak gösterilmelidir.
- **FR-021**: JavaScript çalışmadığında da varsayılan tema koyu olmalıdır (JS açıkkenki varsayılanla aynı); tarayıcı arayüz rengi (tema rengi) etkin temayı izlemeli, elle tema değiştirildiğinde de güncellenmelidir.

**Koruma ve ölçüm**

- **FR-022**: Tüm mevcut URL'ler, sorgu parametreleri ve kullanıcı akışları (filtre, sayfalama, harita, yakınımdakiler, puanlama, sohbet, kayıt/giriş/doğrulama/şifre sıfırlama, admin) değişmeden çalışmalıdır.
- **FR-023**: Değiştirilen dosyalardaki Türkçe eğitici yorumlar korunmalı; yeni/değişen mantık için yorum eklenmelidir.
- **FR-024**: Görsel görünüm (renkler, düzen, yazı boyutları) bu özellikte değiştirilmemelidir; yeniden tasarım 002 özelliğidir.
- **FR-025**: Değişiklikten önce ve sonra, üretim derlemesi üzerinde `/`, `/providers`, `/providers/[id]`, `/chat` için mobil laboratuvar ölçümü (LCP, CLS, TBT) ile rota başına ilk yüklenen JS boyutları ve `/chat` logo transferi kaydedilmeli; sonuçlar `specs/001-ui-modernization/baseline.md` dosyasında (önce/sonra, ölçüm koşullarıyla birlikte) saklanmalıdır; 002 performans bütçeleri bu dosyadaki "sonra" değerlerine dayanır.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: `/chat` sayfasında sona kadar kaydırıldıktan sonra 38 logonun toplam aktarılan boyutu ≈2.9 MB'tan <300 KB'a iner (≥%90 azalma); tek logo ≤10 KB.
- **SC-002**: Dükkan listesi ve detay sayfalarında sunucu tarafı veri toplama süresi ≤ en yavaş tek istek + 50 ms olur.
- **SC-003**: `/`, `/login` ve `/chat` ilk yüklemesinde harita, robot doğrulama ve sohbet bağlantı kodu bulunmaz; üye kullanıcıya robot doğrulama dosyası indirilmez; rota başına ilk yüklenen JS başlangıç ölçümünü aşmaz.
- **SC-004**: Ölçülen dört rotada mobil laboratuvar ölçümünde LCP ≤2.5 sn ve CLS <0.1; TBT başlangıç ölçümüne göre artmaz.
- **SC-005**: Olmayan dükkan adresi ve rastgele bir adres 404 durum kodu döndürür; US2 senaryolarının %100'ünde beyaz ekran/500/ham hata metni görülmez.
- **SC-006**: Kullanılmayan paket sayısı 0; güncel olmayan paket raporunda yalnızca Kapsam Dışı'ndaki paketler kalır.
- **SC-007**: Lint 0 hata ve ≤7 uyarı; üretim derlemesi hatasız; CI Node 24 ile yeşil; mevcut tüm rotalar elle gezildiğinde önceki gibi çalışır.

## Assumptions

- "En güncel kararlı sürüm" = 2026-11-10 itibarıyla yayımlanmış, ön sürüm (beta/canary/rc) olmayan sürüm. Denetime göre `next` 16.2.10→16.4.6 (17 yok), `react` 19.2.7→19.3.1.
- Node 24 Active LTS'tir; yerel geliştirme makinesine kurulabilir (sürüm yöneticisi mevcut).
- Lint uyarılarının (7 adet `react-hooks/set-state-in-effect`) giderilmesi bu özelliğin kapsamında değildir; yalnızca artmaması güvence altındadır.
- Sayfalamanın istemci tarafı bileşeni mevcut URL-state kalıbına göre çalıştığı için bu özellikte bağlantı tabanlı yapıya çevrilmez (anayasa II).
- Arka uç sözleşmesi değişmez; bu özellik yalnızca sanayi-ui reposunu etkiler.

## Out of Scope

- Görsel yeniden tasarım: renkler, düzen, tipografi, ikonlar, koyu harita, satır içi stil temizliği ve **sohbet görsel eklerinde düzen kaymasının önlenmesi** (görünüm değişikliği gerektirir) → 002.
- `typescript` 7.x (typescript-eslint peer `<6.1.0`), `eslint` 10.x (eslint-plugin-react/import/jsx-a11y peer `^9`), `leaflet` 2.x (beta; react-leaflet olmasa da API kırıcı) yükseltmeleri. Bu paketler `npm outdated` raporunda kalacaktır.
- `leaflet-defaulticon-compatibility` ve `react-google-recaptcha` bakımsız ama güncel; değiştirilmez.
- Sayfalamanın bağlantı tabanlı (JS'siz) hale getirilmesi.
- Mevcut 7 lint uyarısının giderilmesi.
