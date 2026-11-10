# Çalışma Rehberi — Spec Kit + Token Savior

> Bu dosya iki repoda da aynıdır: `sanayi/docs/CALISMA_REHBERI.md` ve `sanayi-ui/docs/CALISMA_REHBERI.md`.
> Kısa özet her repodaki `CLAUDE.md`'nin "Çalışma Akışı" bölümünde.

---

## 1. Büyük resim

Amaç: bir fikri **brief → plan → görevler → kod** akışıyla yapmak ve her adımın çıktısını dosyaya yazmak. Böylece session kapansa da iş kaybolmaz; yeni session dosyaları okuyup kaldığı yerden devam eder.

```
fikir ──► /speckit-specify ──► spec.md      (NE ve NEDEN — teknoloji yok)
             │
             ├─► /speckit-clarify (opsiyonel) ──► spec.md'deki belirsizlikleri soru-cevapla kapatır
             ▼
          /speckit-plan ──────► plan.md, research.md, data-model.md, contracts/, quickstart.md   (NASIL)
             ▼
          /speckit-tasks ─────► tasks.md     (checkbox'lı, sıralı görev listesi)
             │
             ├─► /speckit-analyze (opsiyonel) ──► spec/plan/tasks tutarlı mı? (dosyaları değiştirmez)
             ▼
          /speckit-implement ─► kod + tasks.md'de [x] işaretleri
             ▼
          /speckit-converge ──► spec'e göre eksik kalanı bulur, tasks.md'ye yeni görev ekler
             └──► eksik varsa tekrar /speckit-implement (converge "Converged" diyene kadar)
```

Tüm çıktılar şuraya yazılır:

```
specs/
└── 001-favoriler/
    ├── spec.md          # brief: kullanıcı hikâyeleri, kabul kriterleri
    ├── plan.md          # teknik plan + "Constitution Check"
    ├── research.md      # alınan teknik kararlar ve gerekçeleri
    ├── data-model.md    # tablolar / tipler
    ├── contracts/       # API sözleşmeleri (uç, istek, cevap)
    ├── quickstart.md    # elle doğrulama adımları
    └── tasks.md         # T001, T002 ... görevler, - [ ] / - [x]
```

**Constitution** (`.specify/memory/constitution.md`) projenin değişmez kurallarıdır (hexagonal mimari, migration kuralı, URL-state kalıbı vb.). Her `/speckit-plan` planı bu kurallara göre kontrol eder. Bir kural değişirse `/speckit-constitution` ile güncellenir.

---

## 2. Komutlar tek tek

Komutlar **terminalde değil, Claude chat'inde** yazılır. Her adımdan sonra çıkan dosyayı oku; beğenmediğin yeri söyle, düzeltsin, sonra diğer adıma geç. Adımları tek mesajda art arda yapıştırma — her biri bir öncekinin çıktısına bakar.

### `/speckit-specify <ne istiyorsun>`
- Ne yapar: Yeni bir `specs/NNN-isim/` klasörü açar ve `spec.md` yazar (kullanıcı hikâyeleri, kabul kriterleri, kapsam dışı).
- **Teknoloji yazma**, ihtiyacı yaz. "PostgreSQL tablosu" değil, "kullanıcı favorilerini sonradan görebilmeli".
- İyi brief = kim, ne yapabilmeli, neden, sınırlar. Örnek:
  ```
  /speckit-specify Giriş yapmış kullanıcılar dükkan kartında ve detay sayfasında bir kalp ikonuyla dükkanı favorilerine ekleyip çıkarabilsin. "Favorilerim" sayfasında kendi favori dükkanlarını sayfalı görebilsin. Anonim kullanıcı kalbe basınca girişe yönlendirilsin. Bir dükkan silinirse favorilerden de düşsün.
  ```
- En fazla 3 tane `[NEEDS CLARIFICATION]` işareti bırakabilir; bunları `/speckit-clarify` ile kapat.

### `/speckit-clarify` (opsiyonel ama önerilir)
- En fazla 5 hedefli soru sorar, cevaplarını `spec.md`'ye işler. Plan'dan **önce** çalıştır.

### `/speckit-plan <teknik tercihler>`
- Ne yapar: `plan.md` + `research.md` + `data-model.md` + `contracts/` + `quickstart.md`.
- Burada teknolojiyi söylersin. Örnek (backend):
  ```
  /speckit-plan Yeni Flyway migration ile favorites tablosu (user_id, provider_id, created_at, unique(user_id, provider_id), provider silinince cascade). POST/DELETE /api/favorites/{providerId} (201/204), GET /api/favorites sayfalı. Hexagonal: FavoriteUseCases inbound port, servis, controller. Testcontainers ile integration test.
  ```
- Planın "Constitution Check" bölümüne bak: kural ihlali varsa orada yazar.

### `/speckit-checklist <odak>` (opsiyonel)
- Spec için kalite kontrol listesi üretir (ör. `/speckit-checklist güvenlik ve yetkilendirme`).

### `/speckit-tasks`
- Ne yapar: `tasks.md` yazar. Görevler fazlara bölünür: Setup → Foundational → her kullanıcı hikâyesi (P1 = MVP) → Polish.
- `[P]` = paralel yapılabilir (farklı dosya, bağımlılık yok). `[US1]` = hangi kullanıcı hikâyesine ait.
- Görevler dosya yolu içerir; çok büyük görülen görevi bölmesini isteyebilirsin.

### `/speckit-analyze` (opsiyonel)
- spec ↔ plan ↔ tasks tutarlılığını raporlar, hiçbir dosyayı değiştirmez. Implement'ten önce son kontrol.

### `/speckit-implement`
- `tasks.md`'yi sırayla uygular, biten görevi `- [x]` yapar.
- Sadece bir kısmını istersen söyle: `/speckit-implement sadece Phase 1 ve 2` veya `T001-T008 arası`. Uzun özelliklerde bu, session başına makul bir iş parçası bırakır.

### `/speckit-converge`
- Kodu spec'le karşılaştırır, eksik kalanları `tasks.md`'ye yeni görev olarak ekler. "Converged" diyene kadar implement ↔ converge döngüsü.

---

## 2.5 Review kapıları ve agent'lar

Her adımdan sonra ayrı bir agent bağımsız inceleme yapar; BLOCKER/MAJOR bulgu düzeltilmeden ilerlenmez:

| Adım | İnceleme |
|---|---|
| `/speckit-specify` (+clarify) | reviewer `spec` modu |
| `/speckit-plan` | reviewer `plan` modu |
| `/speckit-tasks` + `/speckit-analyze` | reviewer `tasks` modu |
| `/speckit-implement` | reviewer `code` modu (diff + lint/build/test) |

Agent'lar (`.claude/agents/`):

| Repo | Agent | Görev |
|---|---|---|
| sanayi | `senior-backend-engineer` | backend görevlerini uygular |
| sanayi | `backend-reviewer` | backend spec/plan/tasks/kod incelemesi (salt okunur) |
| sanayi-ui | `senior-frontend-engineer` | UI görevlerini uygular |
| sanayi-ui | `ui-designer` | görsel dil, token'lar, sayfa düzenleri |
| sanayi-ui | `frontend-reviewer` | UI spec/plan/tasks/kod incelemesi (salt okunur) |

Chat'te istemek için: "`backend-reviewer` ile plan.md'yi incele" demen yeterli.

## 3. İki repoya dokunan özellikler (backend + UI)

Spec Kit her repoda ayrı çalışır (`sanayi/specs/` ve `sanayi-ui/specs/`). İki tarafı ilgilendiren bir özellikte (favoriler gibi) önerilen sıra:

1. **Backend önce** — `sanayi` klasöründe session aç:
   `/speckit-specify` → `/speckit-clarify` → `/speckit-plan` → `/speckit-tasks` → `/speckit-implement`.
   API sözleşmesi `sanayi/specs/001-favoriler/contracts/` altında oluşur.
2. **Sonra UI** — `sanayi-ui` klasöründe session aç, brief'te backend spec'ini göster:
   ```
   /speckit-specify ../sanayi/specs/001-favoriler/spec.md ve contracts/ altındaki sözleşmeye göre favoriler özelliğinin arayüzü: kartta ve detayda kalp butonu, /favoriler sayfası, anonim kullanıcıyı girişe yönlendirme.
   ```
   ```
   /speckit-plan types.ts'e Favorite tipi, api.ts'e fonksiyonlar, kalp butonu client component (optimistic toggle), /favoriler server sayfası, globals.css token'larıyla stil.
   ```
3. Spec klasör numaraları iki repoda farklı olabilir; önemli değil, brief'te yolu açıkça vermen yeterli.

---

## 4. Yeni session'da kaldığın yerden devam

Yeni session açtığında ilk mesaj olarak şunu yazman yeterli:

```
specs/ altındaki aktif özelliğin tasks.md'sini oku, işaretlenmemiş ilk görevden /speckit-implement ile devam et.
```

Belirli bir özellik için:

```
specs/001-favoriler/tasks.md'den devam et. Önce plan.md ve spec.md'yi oku.
```

İpuçları:
- Session'ı bitirmeden önce "tasks.md güncel mi, bitenler [x] mi?" diye kontrol ettir. Devamlılığın tek kaynağı bu dosya.
- `specs/` klasörünü **commit'le**. Spec + plan + tasks kodla birlikte yaşar; PR'da da ne yapıldığını anlatır.
- `.specify/feature.json` (aktif özellik işaretçisi) makineye özeldir, git'e girmez — sorun değil.

---

## 5. Ne zaman Spec Kit KULLANMA

- Tek dosyalık düzeltme, yazım hatası, stil ayarı, bağımlılık güncellemesi → doğrudan iste.
- Hata ayıklama → doğrudan iste ("şu sayfa 500 veriyor, bak").
- Kural: birden fazla dosya + yeni davranış + birden fazla session sürebilir → Spec Kit.

---

## 6. Token tasarrufu: Serena (backend) ve Token Savior (UI)

İkisi de aynı işi yapar: Claude bir fonksiyonu görmek için tüm dosyayı `Read` etmek yerine sembolü (fonksiyon/sınıf) adıyla getirir; çağıranları ve referansları indeksten bulur. Daha az token, daha hızlı. Her repoda **dile uygun olan** kurulu:

| Repo | Araç | Neden |
|---|---|---|
| `sanayi` (Kotlin) | **Serena** ([oraios/serena](https://github.com/oraios/serena)) | Resmi Kotlin language server'ı kullanır; Token Savior Kotlin'i indeksleyemiyor |
| `sanayi-ui` (TypeScript) | **Token Savior** ([Mibayy/token-savior](https://github.com/Mibayy/token-savior)) | TS'i tam indeksliyor, araç listesi küçük (~1.5K token) |

İkisi aynı repoda birlikte açık değil — aynı işi yapan iki araç seti, araç listesine boşuna token harcatır.

**Senin yapman gereken: sadece yeni bir session açmak.** Açık session'lar yeni MCP araçlarını görmez. Gerisi hazır:

- İkisi de `~/.claude.json`'da proje bazlı (local scope) kayıtlı ve `alwaysLoad: true` — araçlar her session'da hazır, ToolSearch arkasına saklanmaz.
- **Serena (sanayi):** proje ayarı `sanayi/.serena/project.yml`, Kotlin indeksi önceden oluşturuldu. `.claude/settings.local.json`'da iki hook var: session başında Serena'yı projeye aktive eder, sonda temizler. İlk açılışta Kotlin language server'ın kalkması birkaç saniye sürebilir; "MCP timeout" görürsen shell profiline `export MCP_TIMEOUT=60000` ekle.
- **Token Savior (sanayi-ui):** profil `optimized`. İlk kullanımda kökte `.token-savior-cache.json` oluşturur (`.gitignore`'da).

Opsiyonel komutlar (terminalde):

```bash
ts gain                                  # Token Savior: ne kadar token tasarruf edildi
token-savior-dashboard                   # Token Savior istatistik paneli (127.0.0.1:8921)
serena project index                     # Serena: büyük değişiklikten sonra Kotlin indeksini yenile (sanayi klasöründe)
serena project health-check              # Serena: kurulum/language server kontrolü
```

Claude araçları kullanmıyor gibiyse: "sembol bazlı araçları kullan (Serena / token-savior)" demen yeterli. Bash çıktısı kısaltma gibi ileri hook'lar şu an kapalı; ihtiyaç olursa açılabilir.

---

## 7. Hızlı kopya kartı

```
# yeni özellik
/speckit-specify <kim, ne, neden, sınırlar>
/speckit-clarify
/speckit-plan <teknoloji / mimari tercihler>
/speckit-tasks
/speckit-analyze
/speckit-implement            (veya: sadece Phase 1-2)
/speckit-converge             (Converged diyene kadar implement ↔ converge)

# yeni session
specs/NNN-isim/tasks.md'den devam et

# kural değişikliği
/speckit-constitution <yeni/değişen kural>
```
