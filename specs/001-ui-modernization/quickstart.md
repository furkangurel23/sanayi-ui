# Quickstart / Doğrulama: 001-ui-modernization

## Ön koşullar

```bash
nvm install 24 && nvm use            # .nvmrc → 24
cd ../sanayi && docker compose -f docker-db.yml up -d && ./mvnw spring-boot:run   # backend :8080 (seed verisiyle)
cd ../sanayi-ui && npm ci
```

## Kalite kapıları

```bash
npm run lint      # beklenen: 0 error, ≤7 warning
npm run build     # beklenen: hatasız (Next 16 rota boyutu göstermez; JS ölçümü Lighthouse ile)
npm outdated      # beklenen: yalnızca typescript (7.x), eslint (10.x), @types/node (26.x) — hepsi spec Kapsam Dışı
```

## Ölçüm (FR-025) — önce ve sonra aynı koşullarla

```bash
npm run build && npm run start      # :3000
for u in / /providers /providers/1 /chat; do
  for i in 1 2 3; do
    npx lighthouse@12 "http://localhost:3000$u" --only-categories=performance \
      --form-factor=mobile --throttling-method=simulate --output=json --quiet \
      --chrome-flags="--headless=new" --output-path="/tmp/lh$(echo $u|tr / _)-$i.json"
  done
done
```

Medyan LCP/CLS/TBT ve Script transferSize toplamı `baseline.md`'ye (aynı `measure.sh` betiği). Logo: `du -ck public/brands/*.webp` (tamamı ≤300 KB, tek dosya ≤10 KB).

SC-002: `for i in 1 2 3 4 5; do curl -s -o /dev/null -w "%{time_starttransfer}\n" localhost:3000/providers/<id>; done` medyanı ≤ `max(curl localhost:8080/api/providers/<id>, curl …/ratings)` + 50 ms.

## Elle senaryolar

| # | Adım | Beklenen |
|---|---|---|
| 1 | `/providers/999999`, `/providers/abc` | Türkçe 404, durum kodu 404 (`curl -o /dev/null -w "%{http_code}"`) |
| 2 | `/rastgele` | Türkçe 404 |
| 3 | `/providers/1?page=0`, `?page=-3`, `?page=abc` | İlk yorum sayfası; backend loglarında `page=-1` yok |
| 4 | `/providers?brandId=abc&size=99999` | Liste çalışır, backend'e `NaN` gitmez |
| 5 | Backend'de `/api/brands` kapalıyken (ör. geçici olarak yanlış `NEXT_PUBLIC_API_URL` meta için mock) `/providers` | Dükkanlar listelenir, marka filtresi boş |
| 6 | Adı `<img src=x onerror=alert(1)>` olan dükkan (admin ile oluştur/düzenle) → haritada tıkla | Metin düz görünür, alert yok |
| 7 | Ağ paneli: `/`, `/login`, `/chat` | `leaflet`, `recaptcha`, `stomp` istekleri yok |
| 8 | Üye olarak `/providers/1` | recaptcha isteği yok; anonim + site key ile var |
| 9 | JS kapalı `/` | Koyu tema |
| 10 | Tema değiştir | `<meta name="theme-color">` değişir |
| 11 | `/brands` → kartı klavyeyle aç/kapa | Enter/Space çalışır; ekran okuyucu açık/kapalı der |
| 12 | `/login`, `/register`, `/forgot-password` sekme başlığı | "Giriş \| Sanayi", "Kayıt Ol \| Sanayi", "Şifremi Unuttum \| Sanayi" |
| 13 | Tüm rotalar iki temada + 375 px | Görünüm 001 öncesiyle aynı (yan yana ekran görüntüsü) |
| 14 | Kayıt → doğrulama → giriş → puan ver → sohbet mesajı → admin işlemleri | Önceki gibi çalışır |
| 15 | Backend'i durdur, `/providers/<id>` aç (no-store) | Türkçe RouteError, ham hata metni yok; backend'i başlat → "Tekrar dene" → sayfa veriyle gelir |
| 16 | Kök düzen hatası (geçici olarak Header'da `throw`) | `global-error` Türkçe ekran, Geist fontu, seçili tema |
| 17 | `/brands?sort=evil&dir=x` | Varsayılan sıralama, backend'e geçersiz değer gitmez |
| 18 | Harita rotaları iki temada | Leaflet CSS sırası değişse de görünüm aynı |
