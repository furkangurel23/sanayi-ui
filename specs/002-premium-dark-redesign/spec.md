# Feature Specification: Premium Koyu Tema Yeniden Tasarım (Tüm Sayfalar)

**Feature Branch**: `002-premium-dark-redesign` (main üzerinde, ayrı commit; 001-ui-modernization tamamlandıktan sonra)

**Created**: 2026-11-10

**Status**: Draft (rev 2 — frontend-reviewer spec incelemesi sonrası)

**Input**: User description: "UI için Apple sitesi gibi (örnek bu sadece) güzel gözüken bir UI hazırlamamız gerekiyor." Kullanıcı kararları (2026-11-10): ton = **koyu öncelikli, premium** (Apple Pro ürün sayfaları hissi); kapsam = **tüm sayfalar**; açık tema desteklenmeye devam eder.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - İlk izlenim: premium ve güven veren bir vitrin (Priority: P1)

Bir ziyaretçi siteye ilk kez gelir. Koyu, sakin, yüksek kontrastlı; büyük başlıkları, geniş boşlukları ve tek bir ölçülü vurgu rengi olan bir ana sayfa görür. Ne yapabileceğini (usta bul, puanla, marka sohbetine katıl) hızla anlar ve aramaya/listeye geçer.

**Why this priority**: Ana sayfa ve dükkan keşif akışı en çok ziyaret edilen yüzey; tasarımın kalitesi güven algısını doğrudan belirler.

**Independent Test**: Tasarım onay kapısı (FR-021): belirteçler ve 3 referans ekran (ana sayfa, dükkan listesi, dükkan detayı; iki tema; 375 ve 1440 px) üretilir, FR-002 değişmezleri ölçülür ve kullanıcıya onaya sunulur.

**Acceptance Scenarios**:

1. **Given** ilk kez gelen ziyaretçi (kayıtlı tema tercihi yok; sistem tercihi açık olsa bile), **When** ana sayfa açılıyor, **Then** koyu tema gösterilir; vitrin başlığı, kısa açıklama ve birincil eylem (usta bul) 375×667 ve 1440×900 görünümlerinde ilk ekranda yer alır.
2. **Given** ana sayfa, **When** aşağı kaydırılıyor, **Then** bölümler (kategoriler, markalar/sohbet odaları, nasıl çalışır) boşluk ölçeğinden gelen tutarlı aralıklarla ayrılır; gövde satır uzunluğu ≤75 karakterdir.
3. **Given** kullanıcı hareket azaltma tercihi açık, **When** sayfalar arası geziliyor ve öğeler beliriyor, **Then** hiçbir kayma/parallax/giriş animasyonu oynatılmaz.

---

### User Story 2 - Dükkan bulma ve değerlendirme akışı yeni tasarımda kusursuz (Priority: P1)

Ziyaretçi dükkanları filtreler, haritada görür, bir dükkanın detayına girer, puan dağılımını ve yorumları okur, puan verir. Tüm bu ekranlar aynı görsel dili kullanır; harita koyu temayla uyumludur; puan rozetleri olumlu/olumsuzu renk dışında da anlatır.

**Why this priority**: Platformun asıl değeri bu akışta; yeniden tasarımın burada bir şeyi bozmaması ve güzelleştirmesi gerekir.

**Independent Test**: Filtre → liste → harita → detay → puan verme akışı koyu ve açık temada, 375 px ve 1440 px genişlikte baştan sona tamamlanır.

**Acceptance Scenarios**:

1. **Given** dükkan listesi, **When** filtreler uygulanıyor, **Then** filtre çubuğu, sonuç kartları ve sayfalama aynı görsel dilde, anında güncellenir; davranış ve URL'ler öncekiyle aynıdır.
2. **Given** koyu tema, **When** harita görüntüleniyor, **Then** harita karoları, yakınlaştırma/atıf kontrolleri, popup'lar ve işaretçiler koyu temaya uyumludur ve ≥3:1 kontrast sağlar; açık temada açık karolar kullanılır.
3. **Given** harita açıkken, **When** tema değiştiriliyor, **Then** karolar ≤1 sn içinde değişir; konum, yakınlaştırma, işaretçiler ve açık popup korunur.
4. **Given** dükkan detayı, **When** puan rozetleri ve histogram görüntüleniyor, **Then** olumlu/olumsuz/nötr puan renge ek olarak işaret (+/−) veya metinle ayırt edilebilir.
5. **Given** puan verme formu, **When** klavyeyle kullanılıyor, **Then** puan seçimi ARIA radyo grubu kalıbıyla çalışır (tek sekme durağı, ok tuşlarıyla seçim), odak halkası görünür ve form gönderilebilir.

---

### User Story 3 - Tüm sayfalar ve durumlar tek bir sistemden (Priority: P2)

Sohbet odaları, kimlik akışları, markalar, yakınımdakiler ve admin ekranları ile bunların boş/yükleniyor/hata/kilitli durumları aynı tasarım sistemini kullanır.

**Why this priority**: Kullanıcı sayfalar arasında geçerken "başka siteye geçmiş" hissi yaşamamalı; tutarlılık premium algının parçası.

**Independent Test**: FR-008'deki rotalar ve Edge Cases'teki "kapsanan durumlar" sırayla gezilir; her biri ortak bileşenlerle ve aynı görsel dille görünür.

**Acceptance Scenarios**:

1. **Given** herhangi bir liste sayfası (markalar, dükkanlar, yakınımdakiler, sohbet odaları, admin tabloları), **When** açılıyor, **Then** başlık alanı ortak sayfa başlığı kalıbıyla (başlık + kısa açıklama + isteğe bağlı eylem) gösterilir.
2. **Given** sohbet odası, **When** mesajlar akıyor, **Then** mesaj balonları, gönderme alanı ve ekler yeni sistemde; marka avatarı logo ile gösterilir; görsel ekler yüklenirken düzen kaymaz (yer ayrılır, en-boy korunur).
3. **Given** giriş/kayıt sayfaları, **When** açılıyor, **Then** ortalanmış, tek odaklı bir kart; alan hataları alanın altında gösterilir.
4. **Given** admin ekranları, **When** açılıyor, **Then** sekmeler, tablolar, sayfalama, satır içi onay ve log paneli ortak bileşenlerle gösterilir; admin URL'leri değişmez.
5. **Given** herhangi bir sayfa, **When** ikon gerekiyor (uyarı, kilit, posta, kalkan, konum, bekliyor/başarılı, tema, menü, oklar, kapat), **Then** emoji ve metin okları yerine tek tip çizgi ikon seti kullanılır.

---

### User Story 4 - Açık tema da birinci sınıf (Priority: P2)

Açık temayı seçen kullanıcı, aynı kalite ve aynı değişmezlerle tasarlanmış bir arayüz görür. Tercih hatırlanır.

**Why this priority**: Gündüz/dış mekânda (sanayide telefondan) açık tema okunabilirlik için kritik.

**Independent Test**: Tüm rotalar açık temada gezilir; FR-002 değişmezleri ve FR-012 kontrastı açık temada da ölçülür; sayfa yenilendiğinde tema korunur ve ilk boyamada yanıp sönmez.

**Acceptance Scenarios**:

1. **Given** açık tema seçili, **When** herhangi bir sayfa açılıyor ya da yenileniyor, **Then** sayfa doğrudan açık temada boyanır (yanıp sönme yok).
2. **Given** her iki tema, **When** kontrast ölçülüyor, **Then** FR-012 eşikleri sağlanır.

### Edge Cases

- Çok uzun dükkan/marka adları ve adresler: kart ve başlıklarda taşma olmadan kısaltılır/satır kırılır.
- Logosu olmayan marka: tutarlı baş harf avatarı.
- 320 px dar ekran: yatay kaydırma olmaz.
- Tarayıcı bulanıklık desteklemiyorsa üst bar opak yedek arka planla okunabilir kalır.
- Zorlanmış renk (forced-colors) modu: odak halkaları ve kenarlıklar görünür kalır.
- Admin tablosu mobilde: yatay kaydırma tablo kabı içinde kalır, sayfa kaymaz.

**Kapsanan durumlar** (tümü yeni tasarımı kullanır ve SC-001 ekran görüntüsü setine girer):

- Üst bar: masaüstü, mobil menü açık, giriş yapmış kullanıcı çipi; alt bilgi (footer).
- Formlar: gönderiliyor/devre dışı, alan hatası, `.alert` başarı/hata/bilgi.
- Boş durumlar: sonuç yok (filtre), yorum yok, boş sohbet odası.
- Yükleniyor iskeletleri ve 001'in ortak hata/404 ekranları (yeniden stillenir).
- Sohbet: kilitli (giriş yok / e-posta doğrulanmamış), dosya yükleniyor, görsel ve video eki, bağlantı koptu/yeniden bağlanıyor.
- Yakınımdakiler: konum izni bekleniyor, reddedildi, desteklenmiyor, konum alınıyor.
- Kimlik: kayıt sonrası "postanı kontrol et", e-posta doğrulama bekliyor/başarılı/hata, şifre sıfırlama başarılı/hata.
- Admin: yetkisiz ekran, log paneli açık.
- Robot doğrulama kutusu temaya uygun (koyu temada koyu).

## Requirements *(mandatory)*

### Functional Requirements

**Görsel dil ve ölçülebilir değişmezler**

- **FR-001**: Varsayılan tema koyu olmalıdır: katmanlı koyu yüzeyler, yüksek kontrastlı metin, tek vurgu tonu, ince kenarlıklar ve yumuşak derinlik.
- **FR-002**: Tasarım aşağıdaki **ölçülebilir değişmezleri** sağlamalıdır; somut değerler plan.md'deki belirteç tablosunda tanımlanır ve SC'ler bunlara göre ölçülür:
  - Vurgu tonu sayısı = 1 (olumlu/olumsuz/nötr anlam renkleri bu sayıya dahil değildir).
  - Belirteç dışı renk, boşluk, köşe yarıçapı, gölge ve süre değeri = 0 (istisnalar: `0`, `1px` ince çizgi, çalışma anında hesaplanan değerler).
  - Yüzey katman sayısı ≥3 (zemin, yükseltilmiş, en üst/üst bar); katmanlar arası açıklık farkı plan.md'de sayısal tanımlıdır ve her iki temada aynı oranı izler.
  - Vitrin başlığı 375 px'te ≥40 px, 1440 px'te ≥72 px; büyük başlıklarda negatif harf aralığı.
  - Gövde satır uzunluğu ≤75 karakter, gövde satır yüksekliği ≥1.5.
  - Boşluk ölçeği tek bir modüler diziden gelir (ör. 4'ün katları); bölüm arası boşluk masaüstünde ≥96 px, mobilde ≥56 px.
- **FR-003**: Yazı ölçeği en az şu kademeleri içermelidir: vitrin başlığı, sayfa başlığı, bölüm başlığı, gövde, yardımcı metin; ekran genişliğine göre akışkan ölçeklenir. Yazı tipi 001'de kurulan ana yazı tipi (Türkçe karakter setiyle) olarak korunur; yeni web fontu eklenmez.
- **FR-004**: Üst bar yapışkan ve yarı saydam/bulanık arka planlı olmalı; desteklenmeyen tarayıcıda opak yedek kullanılmalıdır.
- **FR-005**: Hareketler 150–300 ms, amaçlı (durum değişimi, beliriş, üzerine gelme) olmalı ve hareket azaltma tercihinde tamamen kapanmalıdır.
- **FR-006**: Emoji ikonlar (⚠️ 🛡️ 🔒 📬 ⏳ ✅ 📍) ve metin okları (→ ← ↑ ↓ ✕) kaldırılmalı; tüm arayüz ikonları projede elle yazılmış tek tip çizgi SVG ikon bileşenlerinden gelmeli (paket eklenmez — anayasa IV); dekoratif ikonlar yardımcı teknolojilerden gizlenmeli; ikon bileşenleri sunucu bileşenlerinde istemci kodu gerektirmemelidir.
- **FR-007**: Harita karoları ve harita arayüzü (kontroller, popup, işaretçiler) aktif temaya uyumlu olmalı; tema değişiminde US2-AS3 kuralı geçerlidir. Karo kaynağı plan aşamasında kullanım şartları kontrol edilerek seçilir; atıf metni korunur.

**Kapsam: tüm sayfalar**

- **FR-008**: Şu rotalar yeni tasarımı kullanmalıdır: `/`, `/brands`, `/providers`, `/providers/[id]`, `/providers/near`, `/chat`, `/chat/[brandId]`, `/login`, `/register`, `/forgot-password`, `/verify-email`, `/reset-password`, `/admin/ratings`, `/admin/providers`, `/admin/users`, 404 ve hata ekranları, yükleniyor iskeletleri; ayrıca Edge Cases'teki tüm "kapsanan durumlar".
- **FR-009**: Tekrarlanan kalıplar ortak bileşenlere taşınmalıdır: sayfa başlığı, boş durum, yükleniyor iskeleti, puan rozeti (yorum öğesi dahil), dükkan kartı (yakınımdakiler dahil), marka avatarı (sohbet dahil), ortak dialog/çekmece kalıbı (admin log paneli). Sayfalama ortak **görsel** bileşen olmalı ve iki kullanımı desteklemelidir: URL'e yazan (genel sayfalar, anayasa II) ve geri çağrı alan (admin, yerel durum); admin URL'leri değişmez. 001'in ortak hata ekranı yeniden stillenir.
- **FR-010**: Dialog/çekmece kalıbı Escape ile kapanmalı, odağı içeride tutmalı, kapanınca odağı tetikleyen öğeye döndürmeli ve başlığıyla etiketlenmelidir.
- **FR-011**: Satır içi stiller kaldırılmalı; yalnızca çalışma anında hesaplanan değerler (ör. histogram çubuk yüksekliği, logo boyutu) satır içi kalabilir. Tek seferlik renk değerleri ve eski "turuncu" vurgu atıfları temizlenmelidir.

**Erişilebilirlik ve duyarlılık**

- **FR-012**: Her iki temada gövde metni, soluk/ikincil metin ve placeholder ≥4.5:1; büyük metin ve arayüz bileşenleri (kenarlık, odak halkası, ikon) ≥3:1 kontrast sağlamalıdır.
- **FR-013**: Tüm etkileşimli öğeler klavyeyle erişilebilir olmalı ve görünür odak halkası taşımalıdır; dokunma hedefleri ≥44×44 px olmalıdır (metin içi bağlantılar hariç — WCAG 2.5.5 istisnası).
- **FR-014**: Puan olumlu/olumsuz bilgisi yalnızca renkle değil, işaret veya metinle de iletilmelidir.
- **FR-015**: Tasarım 320 px'ten geniş masaüstüne kadar yatay kaydırma olmadan çalışmalı; 375 px öncelikli tasarlanmalıdır.
- **FR-016**: 001 FR-021'in tema davranışı korunur (ilk ziyaret sistem tercihinden bağımsız koyu; JS'siz de koyu; ilk boyamada yanıp sönme yok; tercih hatırlanır); tarayıcı arayüz rengi tema değişiminde güncellenir.

**Koruma ve süreç**

- **FR-017**: Tüm URL'ler, sorgu parametreleri, veri akışı ve kullanıcı davranışları değişmemelidir; sunum katmanı değişir. İstisna: erişilebilirlik için gereken klavye ve odak davranışları (FR-010, US2-AS5) eklenebilir.
- **FR-018**: Performans bütçeleri (001'in `specs/001-ui-modernization/baseline.md` sonuç ölçümlerine göre, aynı ölçüm koşullarıyla): rota başına ilk yüklenen JS artışı ≤5 KB (gzip); genel stil dosyası boyutu ≤ 001 sonucunun 1.5 katı (gzip); LCP ≤2.5 sn ve CLS <0.1 (mobil laboratuvar); harita stilleri yalnızca harita rotalarında; yeni üçüncü taraf kaynak yalnızca harita karo sağlayıcısı.
- **FR-019**: Arayüz metinleri Türkçe ve kısa kalmalı; mevcut Türkçe eğitici kod yorumları korunmalı, yeni yapılar için yorum eklenmelidir.
- **FR-020**: Harici arayüz kütüphanesi, ikon paketi veya yardımcı sınıf çerçevesi eklenmemelidir (anayasa IV).
- **FR-021**: **Tasarım onay kapısı**: kalan rotalara yayılmadan önce belirteçler ve 3 referans ekran (ana sayfa, dükkan listesi, dükkan detayı; iki tema; 375 ve 1440 px) ekran görüntüleriyle kullanıcıya sunulmalı; kullanıcı onayı alınmadan yayılım başlamamalıdır.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: FR-008'deki rotaların ve kapsanan durumların %100'ü yeni tasarımı kullanır; her biri iki temada, 375 px ve 1440 px'te ekran görüntüsüyle `specs/002-premium-dark-redesign/screenshots/` altında belgelenir.
- **SC-002**: Ana sayfa, dükkan listesi, detay, giriş ve sohbet odası her iki temada (tema yerel depolama ile ayarlanarak) Lighthouse erişilebilirlik ≥95 alır ve axe ile 0 ciddi/kritik ihlal verir.
- **SC-003**: Toplam satır içi stil sayısı 125'ten ≤10'a iner ve kalanların tamamı çalışma anı değeridir; FR-002'nin "belirteç dışı değer = 0" kuralı otomatik taramayla doğrulanır.
- **SC-004**: FR-018 bütçeleri sağlanır.
- **SC-005**: FR-021 onay kapısı kullanıcı onayıyla geçilmiştir (onay tarihi plan/tasks'ta kayıtlı); FR-002 değişmezlerinin tamamı referans ekranlarda ölçülerek sağlanmıştır.
- **SC-006**: 320 px genişlikte hiçbir rotada yatay kaydırma oluşmaz; FR-013 dokunma hedefi kuralı sağlanır.

## Assumptions

- "Apple sitesi gibi" bir referans; hedef görsel dili (boşluk, tipografi, sadelik, katmanlı koyu yüzeyler) yakalamak, marka öğelerini, ikonlarını veya görsellerini kopyalamak değildir.
- Test ön koşulları: yerel arka uç + seed admin hesabı, e-postası doğrulanmış test üyesi; doğrulama/şifre sıfırlama ekranları için belirteç, geliştirme ortamında konsola loglanan bağlantıdan alınır.
- Mevcut vurgu (gümüş/krom, "sanayi = metal") korunabilir veya tek ölçülü bir vurguya evrilebilir; karar plan belgesinde belirteç tablosuyla gerekçelendirilir ve onay kapısında kullanıcıya sunulur.
- Bu özellik 001-ui-modernization tamamlandıktan sonra uygulanır; 001'in yazı tipi, ortak hata/404 ekranları, tema davranışı ve baz ölçümleri üzerine kurulur.
- Arka uç değişmez.

## Out of Scope

- Yeni özellik/sayfa ekleme, bilgi mimarisi değişikliği, metin içeriğinin baştan yazılması.
- Logo/marka kimliği tasarımı.
- Sayfalamanın bağlantı tabanlı (JS'siz) yapıya çevrilmesi.
- Animasyon kütüphanesi, UI kütüphanesi, ikon paketi veya CSS çerçevesi eklenmesi.
- Geniş kullanıcı testi (isteğe bağlı; yapılırsa protokolü ayrıca yazılır).
