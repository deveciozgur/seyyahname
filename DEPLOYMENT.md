# Seyyahname AI Coach v2: Node.js Sunucuya Kurulum

Seyyahname artık tek bir Node.js sunucusu olarak çalışır: sayfalar, kilit ekranı, veri dosyaları ve Gemini bağlantısı aynı süreçte. Ayrı bir PHP köprüsü ya da statik paket yoktur.

## Nasıl çalışır?

| Parça | Nerede | Görevi |
|---|---|---|
| Arayüz | `app/src/app/(coach)/*`, `/unlock` | Next.js App Router sayfaları. Koçluk mantığı (SM-2, alt bant, müfredat, hata defteri) tarayıcıda çalışır. |
| Kapı | `app/src/proxy.ts` | Oturum yoksa her sayfa `/unlock`'a yönlenir. |
| API | `/api/auth`, `/api/state`, `/api/feedback`, `/api/chat` | PIN → JWT oturum çerezi; veri dosyalarını atomik okuma/yazma; Gemini JSON geri bildirimi ve akışlı sohbet. |
| Kurallar | `CLAUDE.md` | Build sırasında `.next/standalone/` içine kopyalanır ve Gemini'ye sistem talimatı olarak gönderilir. |
| Veri | `DATA_DIR` (varsayılan `app/data/`) | `profile.json`, `vocabulary.md`, `error_ledger.md`, `sessions/`. Yoksa ilk istekte şablonlardan oluşturulur. |

## Gereksinimler

- **Node.js 20.9 veya üstü** (22 LTS önerilir). Paylaşımlı hostingde panelde "Node.js uygulaması" özelliği olmalı (cPanel "Setup Node.js App", Plesk "Node.js", DirectAdmin vb.). Sadece PHP/FTP sunan paketlerde çalışmaz.
- Veri klasörü için yazma izni.

## 1. Kodu sunucuya al

```bash
git clone https://github.com/deveciozgur/claude-english-coach.git seyyahname
cd seyyahname/app
npm ci
npm run build          # .next/standalone/ oluşur; public/, static/ ve CLAUDE.md içine kopyalanır
```

`npm run build` sonunda tüm `/api/*` rotaları `ƒ (Dynamic)` olarak listelenir.

## 2. Ortam değişkenleri

Panelin "Environment variables" bölümüne gir (ya da `app/.env` dosyası oluştur; şablon: `app/.env.example`).

| Değişken | Zorunlu | Açıklama |
|---|---|---|
| `APP_SECRET_PIN` | **Evet** | Kilit ekranının istediği PIN. Boşsa API 503 döner. |
| `APP_SESSION_SECRET` | **Evet** (üretimde) | Oturum JWT'sini imzalayan uzun rastgele metin. Değiştirmek herkesi çıkış yaptırır. Üret: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `GEMINI_API_KEY` | Önerilir | Koç sohbeti ve yapay zekâ geri bildirimi. Yoksa çevrimdışı geri bildirim motoru çalışır. |
| `GEMINI_MODEL` | Hayır | Varsayılan `gemini-flash-latest` (Google'ın güncel Flash modeli). |
| `DATA_DIR` | Hayır | Veri klasörü. Göreli yollar `app/` klasöründen başlar; en güvenlisi uygulamanın dışında mutlak bir yol (`/home/KULLANICI/seyyahname-data`). |
| `SESSION_DAYS` | Hayır | Oturum süresi, gün (varsayılan 7). |
| `SITE_URL` | Hayır | Paylaşım önizlemeleri (OpenGraph/Twitter) için genel adres, örn. `https://coach.ozgurdeveci.com`. |
| `PORT` | Panel ayarlar | `npm start` portu (varsayılan 3000). |

## 3. Başlat

**Hosting paneli (cPanel / Plesk):**
- Uygulama kökü: `seyyahname/app`
- Başlangıç dosyası (startup file): `.next/standalone/server.js`
- Node sürümü: 22
- Kaydet ve "Restart" de. Panel `PORT`'u kendisi verir; `server.js` bunu okur.

**VPS (pm2 + Nginx):**

```bash
cd seyyahname/app
PORT=3000 pm2 start npm --name seyyahname -- start
pm2 save
```

Nginx'te `proxy_pass http://127.0.0.1:3000;` ile yönlendir. Sohbet akışı için `proxy_buffering off;` ekle; API zaten `X-Accel-Buffering: no` gönderir. Gerçek ziyaretçi IP'si için `proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;` ve HTTPS için `proxy_set_header X-Forwarded-Proto $scheme;` ekle.

## 4. PHP sürümünden veri taşıma

Eski kurulumdaki ilerlemen sunucudaki `data/` klasöründe duruyor (`profile.json`, `vocabulary.md`, `error_ledger.md`, `sessions/`).

1. Eski sunucudan `data/` klasörünü FTP ile indir.
2. Yeni sunucuda `DATA_DIR` klasörüne (varsayılan `app/data/`) aynen kopyala. `.version`, `backups/` gibi dosyalar da gelebilir; zararsızdır.
3. Uygulamayı yeniden başlat. Dosya biçimleri değişmedi; hiçbir anahtar silinmez veya yeniden adlandırılmaz.

Kayıtlı tema tercihi tarayıcıda yeni anahtara (`seyyahname.theme`) geçtiği için bir kez varsayılana (Sistem) döner; eski oturum çerezleri geçersizdir, bir kez PIN girmek yeterli.

## 5. Güvenlik

- **Veri klasörü web'den erişilemez:** Next.js yalnızca `public/` ve derleme çıktısını sunar; `DATA_DIR`, `.env` ve `CLAUDE.md` hiçbir adresten okunamaz.
- **Oturum:** Doğru PIN, `jose` ile HS256 imzalı, süreli (varsayılan 7 gün) bir JWT üretir. Çerez: `seyyahname_session; HttpOnly; Path=/; SameSite=Lax; Secure` (üretimde ve HTTPS arkasında her zaman `Secure`).
- **PIN karşılaştırması:** sabit sürede (`timingSafeEqual`).
- **Deneme sınırı:** Aynı IP'den 5 yanlış PIN o IP'yi 15 dakika kilitler; tüm IP'lerden 30 yanlış deneme herkesi 15 dakika kilitler. IP, ters proxy'nin eklediği son `X-Forwarded-For` girdisidir (istemcinin yazdıkları dikkate alınmaz).
- **Başka sitelerden gelen istekler:** Veri değiştiren her istek `x-requested-with: seyyahname` başlığı ister; `SameSite=Lax` çerezle birlikte siteler arası istekleri engeller.
- **Kaydetme:** Yalnızca `profile.json`, `vocabulary.md`, `error_ledger.md` ve `sessions/YYYY-MM-DD.md` yazılabilir (her biri en fazla 1 MB; `profile.json` geçerli bir JSON nesnesi olmalı). Yazmalar geçici dosyaya yapılıp atomik `rename` ile yerine konur; kilit dosyası aynı anda iki yazmayı önler; sürüm numarası iki cihazın birbirinin üzerine yazmasını engeller (409 → güncel veri yüklenip işlem tekrarlanır).
- **Başlıklar:** `X-Powered-By` kapalı; `X-Content-Type-Options`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy` (mikrofon yalnızca bu site için) gönderilir. API yanıtları `no-store` ve `noindex`.
- **Kilit ekranı anonim:** `/unlock` ekranında yalnızca PIN kutusu ve "Giriş" düğmesi var; sekme başlığı "Giriş". Not: paylaşım önizlemeleri için sayfa başlığında (görünmeyen meta etiketlerde) Seyyahname adı ve açıklaması bulunur.

## 6. Güncelleme

```bash
cd seyyahname && git pull
cd app && npm ci && npm run build
# panelde "Restart" ya da: pm2 restart seyyahname
```

Veri klasörü derleme çıktısının dışında olduğu için güncelleme ilerlemeye dokunmaz.

## 7. Yedekleme

- **Otomatik:** Her gün ilk kayıttan önce `DATA_DIR/backups/YYYY-MM-DD/` altına bir kopya alınır; son 14 gün saklanır.
- **Elle:** `DATA_DIR` klasörünü ara sıra indir.

## 8. Sürekli entegrasyon

`.github/workflows/ci.yml` her push ve pull request'te `npm ci`, `npm run typecheck`, `npm test` ve `npm run build` çalıştırır.

## 9. Sorun giderme

| Belirti | Çözüm |
|---|---|
| "APP_SECRET_PIN tanımlı değil" | Ortam değişkenini panelde ekle ve uygulamayı yeniden başlat. |
| "Veri klasörü hazırlanamadı" | `DATA_DIR` klasörüne yazma izni ver ya da yazılabilir mutlak bir yol ayarla. |
| PIN doğru ama tekrar kilit ekranı geliyor | Site HTTP üzerinden açılıyor olabilir (`Secure` çerez yalnızca HTTPS'te saklanır). HTTPS kullan; proxy arkasındaysan `X-Forwarded-Proto` gönderildiğinden emin ol. |
| Sohbet yanıtı parça parça değil, en sonda geliyor | Ters proxy yanıtı tamponluyor: Nginx'te `proxy_buffering off;`. |
| "Gemini modeli bulunamadı" | `GEMINI_MODEL` değerini düzelt (ör. `gemini-flash-latest`). |
| "Gemini API anahtarını kabul etmedi" | `GEMINI_API_KEY` değerini kontrol et. |
| Sayfa stilleri yüklenmiyor | `npm run build` sonrası `postbuild` adımı çalışmamış olabilir: `node scripts/standalone-assets.mjs`. |
