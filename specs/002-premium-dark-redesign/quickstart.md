# Quickstart / Doğrulama: 002-premium-dark-redesign

## Ön koşullar
- 001 tamamlandı; Node 24; backend :8080 seed verisiyle; seed admin + e-postası doğrulanmış test üyesi; doğrulama/sıfırlama belirteci backend konsol logundan.

## Otomatik kontroller
```bash
node scripts/token-lint.mjs          # 0 bulgu
node scripts/contrast-check.mjs      # iki tema, 0 eşik altı çift
grep -rn "style={{" src | wc -l      # ≤10, hepsi çalışma anı değeri
npm run lint && npm run build        # 0 hata, ≤7 uyarı
```

## Ölçüm
- 001 `measure.sh` (aynı koşullar) → FR-018 bütçeleri, `baseline.md` "sonra" ile kıyas.
- Lighthouse a11y: `/`, `/providers`, `/providers/<id>`, `/login`, `/chat/<brandId>` × koyu/açık (`localStorage.sanayiTheme` önceden ayarlanır) ≥95; axe 0 serious/critical.

## Ekran görüntüleri (SC-001)
Yerleşik tarayıcı, 375×812 ve 1440×900, iki tema → `screenshots/<rota>-<tema>-<genişlik>.png`; spec Edge Cases "kapsanan durumlar" listesindeki her durum için ayrıca.

## Elle senaryolar
| # | Senaryo | Beklenen |
|---|---|---|
| 1 | İlk ziyaret (localStorage boş), sistem açık tema | Koyu; vitrin başlığı+açıklama+CTA ilk ekranda (375×667, 1440×900) |
| 2 | Tema değiştir, haritalı sayfada | Karolar ≤1 sn koyu/açık; konum/zoom/popup korunur; theme-color güncellenir |
| 3 | Puan seçici klavye | Tek sekme durağı, oklar/Home/End |
| 4 | Admin log paneli | Escape kapatır, odak içeride, kapanınca butona döner; URL değişmez |
| 5 | Admin sayfalama | URL'e `?page` eklenmez |
| 6 | 320 px tüm rotalar | Yatay kaydırma yok |
| 7 | Hareket azalt açık | Animasyon yok |
| 8 | Tüm akış (kayıt→doğrulama→giriş→puan→sohbet→admin) | Davranış 001 ile aynı |
