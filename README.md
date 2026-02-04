# EquiMarket

Turkiye'nin Yaris Ati Pazaryeri - Full Stack Web Uygulamasi

## Proje Nedir?

EquiMarket, yaris ati alim-satim islemlerinin yapildigi bir pazar yeridir:
- **Alicilar**: Atlari kesfeder, favorilere ekler, saticilarla mesajlasir
- **Saticilar**: Ilan verir, teklifleri degerlendirir, profil olusturur
- **Admin**: Ilanlari onaylar, kullanicilari yonetir

## Teknoloji Stack'i

| Katman | Teknoloji |
|--------|-----------|
| Frontend | Vanilla JS, HTML5, CSS3 |
| Backend | Node.js, Express.js |
| Database | MongoDB Atlas |
| Auth | JWT (JSON Web Token) |

---

## Calistirma Talimatlari

### 1. Backend Calistirma

```bash
# Backend klasorune gec
cd equimarket-backend

# Bagimliliklari yukle (ilk seferde)
npm install

# .env dosyasini olustur
cp .env.example .env

# .env'i duzenle (MongoDB URI, JWT_SECRET vb.)

# Development modunda calistir (hot reload)
npm run dev

# VEYA Production modunda
npm start
```

**Backend URL:** `http://localhost:5000`

### 2. Frontend Calistirma

Frontend statik HTML/JS dosyalarindan olusur. Iki yontem var:

#### Yontem A: Live Server (VS Code)
```
1. VS Code'da "Live Server" extension'i yukle
2. equimarket-frontend klasorunu ac
3. Herhangi bir HTML dosyasina sag tikla > "Open with Live Server"
```
**Frontend URL:** `http://127.0.0.1:5500`

#### Yontem B: Python HTTP Server
```bash
cd equimarket-frontend
python -m http.server 3000
```
**Frontend URL:** `http://localhost:3000`

#### Yontem C: Node.js serve
```bash
npx serve equimarket-frontend -p 3000
```

---

## Live Server vs Backend - Fark Nedir?

| Ozellik | Live Server (Frontend) | Backend Server |
|---------|----------------------|----------------|
| **Port** | 5500 veya 3000 | 5000 |
| **Gorevi** | HTML/CSS/JS dosyalarini sunar | API isteklerini isler |
| **Veri** | Statik dosyalar | MongoDB'den dinamik veri |
| **Ornek** | `homepage_v2.html` sunar | `/api/horses` endpoint'i |

**Onemli:** Her iki sunucu da ayni anda calistirilmalidir:
- Live Server: Sayfanin kendisini gosterir
- Backend: API cagrilarina cevap verir

---

## Proje Kurallari

### 1. Frontend JS Baglama Kurali

Script siralama KRITIK. Her zaman su sirada bagla:

```html
<!-- 1. Temel API katmani -->
<script src="js/api.js"></script>

<!-- 2. Loader utility (standart) -->
<script src="js/loader.js"></script>

<!-- 3. Auth servisi (gerekiyorsa) -->
<script src="js/auth.js"></script>

<!-- 4. Service dosyalari -->
<script src="js/horse.service.js"></script>
<script src="js/admin.service.js"></script>

<!-- 5. UI helper'lar -->
<script src="js/horses.js"></script>
<script src="js/messages.js"></script>

<!-- 6. Sayfa-spesifik inline script -->
<script>
    // Sayfa mantigi
</script>

<!-- 7. Utility'ler (en son) -->
<script src="js/pwa.js"></script>
<script src="js/cookie-consent.js"></script>
```

**Kural:** Bir script, kendinden ONCE yuklenen script'lere bagimli olabilir, SONRAKILERE olamaz.

### 2. Service Olusturma Kriterleri

**Yeni service OLUSTUR:**
- 3+ farkli sayfada ayni API cagrisi kullaniliyorsa
- API mantigi UI'dan bagimsizsafonksiyonlar iceriyorsa
- Ornek: `HorseApi`, `AdminService`, `MessageService`

**Service OLUSTURMA:**
- Sadece 1 sayfada kullanilan API cagrisi
- Basit, tek satirlik fetch islemleri
- UI-spesifik helper fonksiyonlar

**Service dosya yapisi:**
```javascript
const ServiceName = {
    async getAll() { ... },
    async getById(id) { ... },
    async create(data) { ... },
    async update(id, data) { ... },
    async delete(id) { ... }
};
window.ServiceName = ServiceName;
```

### 3. Loader ve Error Handling Standardi

**MUTLAKA uy:**

```javascript
async function loadData() {
    Loader.show('Yukleniyor...');  // Baslangicta
    try {
        const result = await SomeService.getData();
        if (!result.success) {
            throw new Error(result.message || 'Islem basarisiz');
        }
        // Basarili islem...
    } catch (error) {
        console.error('Hata:', error);
        Loader.error('Kullanici dostu hata mesaji');  // Toast goster
    } finally {
        Loader.hide();  // MUTLAKA finally'de kapat!
    }
}
```

**Loader API:**
| Metot | Kullanim |
|-------|----------|
| `Loader.show(msg)` | Loading overlay goster |
| `Loader.hide()` | Loading overlay kapat |
| `Loader.error(msg)` | Kirmizi toast goster |
| `Loader.success(msg)` | Yesil toast goster |
| `Loader.warning(msg)` | Sari toast goster |
| `Loader.button(btn, loading)` | Buton loading durumu |

### 4. AI (Claude) ile Calisma Kurallari

**Kod yazarken:**
- Her HTML dosyasinda script sirasini koru
- Yeni service eklerken tum ilgili sayfalara import ekle
- try/catch/finally pattern'ini atla
- Loader.hide() finally'de OLMALI

**Commit mesajlari:**
- Turkce veya Ingilizce, tutarli ol
- Ne yapildigini KISA acikla
- Claude session linki otomatik eklenir

**Dosya degisiklikleri:**
- Bir dosyayi okumadan DUZENLEME
- Gereksiz dosya OLUSTURMA
- README/dokuman sadece ISTENIRSE yaz

**Test kurali:**
- Buyuk degisikliklerden sonra tarayicide test et
- Console hatalarini kontrol et
- Network isteklerini dogrula

---

## API Endpoints Ozeti

### Auth
| Method | Endpoint | Auth |
|--------|----------|------|
| POST | `/api/auth/register` | Hayir |
| POST | `/api/auth/login` | Hayir |
| GET | `/api/auth/me` | Evet |

### Horses
| Method | Endpoint | Auth |
|--------|----------|------|
| GET | `/api/horses` | Hayir |
| GET | `/api/horses/:id` | Hayir |
| POST | `/api/horses` | Evet |
| PUT | `/api/horses/:id` | Evet (Owner) |
| DELETE | `/api/horses/:id` | Evet (Owner) |
| GET | `/api/horses/user/my-listings` | Evet |

### Messages
| Method | Endpoint | Auth |
|--------|----------|------|
| GET | `/api/messages/conversations` | Evet |
| POST | `/api/messages/send` | Evet |
| GET | `/api/messages/unread-count` | Evet |

### Users
| Method | Endpoint | Auth |
|--------|----------|------|
| GET | `/api/users/profile` | Evet |
| PUT | `/api/users/profile` | Evet |
| GET | `/api/users/seller/:id` | Hayir |

---

## Proje Yapisi

```
equimarket/
├── equimarket-backend/
│   ├── src/
│   │   ├── config/db.js
│   │   ├── controllers/
│   │   ├── middlewares/
│   │   ├── models/
│   │   ├── routes/
│   │   └── server.js
│   ├── .env.example
│   └── package.json
│
├── equimarket-frontend/
│   ├── js/
│   │   ├── api.js           # Temel API client
│   │   ├── loader.js        # Loading & toast utility
│   │   ├── auth.js          # Auth islemleri
│   │   ├── horse.service.js # Horse API servisi
│   │   ├── horses.js        # UI helper'lar
│   │   ├── messages.js      # Mesajlasma
│   │   └── users.js         # Kullanici islemleri
│   ├── css/
│   ├── images/
│   ├── homepage_v2.html
│   ├── ilanlar.html
│   ├── horse_detail.html
│   ├── dashboard.html
│   └── ...
│
└── README.md                 # Bu dosya
```

---

## Ortam Degiskenleri (.env)

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/equimarket
JWT_SECRET=guclu_secret_key
JWT_EXPIRE=30d
CLIENT_URL=http://localhost:3000
```

---

## Destek

Sorular icin: destek@equimarket.com
