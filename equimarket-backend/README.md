# 🐎 EquiMarket Backend API

Türkiye'nin Yarış Atı Pazaryeri için RESTful API.

## 🚀 Hızlı Başlangıç

### Gereksinimler

- Node.js 18+
- MongoDB (Atlas önerilir - ücretsiz)
- npm veya yarn

### Kurulum

1. **Bağımlılıkları yükle:**
```bash
cd equimarket-backend
npm install
```

2. **Environment dosyasını oluştur:**
```bash
cp .env.example .env
```

3. **`.env` dosyasını düzenle:**
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://USERNAME:PASSWORD@cluster.mongodb.net/equimarket
JWT_SECRET=guclu_bir_secret_key_buraya
JWT_EXPIRE=30d
CLIENT_URL=http://localhost:3000
```

4. **MongoDB Atlas Kurulumu:**
   - https://www.mongodb.com/cloud/atlas adresine git
   - Ücretsiz hesap oluştur
   - Yeni Cluster oluştur (M0 Free Tier)
   - Database Access'ten kullanıcı ekle
   - Network Access'ten IP adresini ekle (0.0.0.0/0 tüm IP'ler için)
   - Connect > Connect your application > Connection string'i kopyala
   - `.env` dosyasına yapıştır

5. **Sunucuyu başlat:**
```bash
# Development (hot reload)
npm run dev

# Production
npm start
```

## 📚 API Endpoints

### Auth
| Method | Endpoint | Açıklama | Auth |
|--------|----------|----------|------|
| POST | `/api/auth/register` | Kayıt | ❌ |
| POST | `/api/auth/login` | Giriş | ❌ |
| GET | `/api/auth/me` | Mevcut kullanıcı | ✅ |
| PUT | `/api/auth/password` | Şifre güncelle | ✅ |

### Horses (İlanlar)
| Method | Endpoint | Açıklama | Auth |
|--------|----------|----------|------|
| GET | `/api/horses` | Tüm ilanlar | ❌ |
| GET | `/api/horses/:id` | İlan detayı | ❌ |
| POST | `/api/horses` | Yeni ilan | ✅ Seller |
| PUT | `/api/horses/:id` | İlan güncelle | ✅ Owner |
| DELETE | `/api/horses/:id` | İlan sil | ✅ Owner |
| GET | `/api/horses/user/my-listings` | Benim ilanlarım | ✅ |
| POST | `/api/horses/:id/favorite` | Favori toggle | ✅ |

### Messages (Mesajlar)
| Method | Endpoint | Açıklama | Auth |
|--------|----------|----------|------|
| GET | `/api/messages/conversations` | Konuşmalar | ✅ |
| GET | `/api/messages/conversations/:id` | Mesajlar | ✅ |
| POST | `/api/messages/send` | Mesaj gönder | ✅ |
| PUT | `/api/messages/:id/offer-response` | Teklif yanıtla | ✅ |
| GET | `/api/messages/unread-count` | Okunmamış sayısı | ✅ |

### Users (Kullanıcılar)
| Method | Endpoint | Açıklama | Auth |
|--------|----------|----------|------|
| GET | `/api/users/profile` | Profil | ✅ |
| PUT | `/api/users/profile` | Profil güncelle | ✅ |
| GET | `/api/users/seller/:id` | Satıcı profili | ❌ |
| GET | `/api/users/favorites` | Favoriler | ✅ |
| GET | `/api/users/dashboard/stats` | Dashboard | ✅ Seller |

## 🔍 Filtreleme Örneği

```
GET /api/horses?breed=ingiliz&minPrice=500000&maxPrice=2000000&city=istanbul&sort=price_asc&page=1&limit=12
```

**Kullanılabilir Filtreler:**
- `breed`: ingiliz, arap, turk, diger
- `gender`: erkek, disi, igdis
- `color`: doru, kir, yagiz, al, diger
- `city`: Şehir adı
- `minPrice`, `maxPrice`: Fiyat aralığı
- `minAge`, `maxAge`: Yaş aralığı
- `search`: Metin araması
- `featured`: true (öne çıkanlar)
- `sort`: price_asc, price_desc, newest, oldest
- `page`, `limit`: Sayfalama

## 🔐 Authentication

API, JWT (JSON Web Token) kullanır. Token'ı header'da gönder:

```
Authorization: Bearer <token>
```

## 📁 Proje Yapısı

```
equimarket-backend/
├── src/
│   ├── config/
│   │   └── db.js           # MongoDB bağlantısı
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── horseController.js
│   │   ├── messageController.js
│   │   └── userController.js
│   ├── middlewares/
│   │   └── auth.js         # JWT doğrulama
│   ├── models/
│   │   ├── User.js
│   │   ├── Horse.js
│   │   └── Message.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── horses.js
│   │   ├── messages.js
│   │   └── users.js
│   └── server.js           # Ana dosya
├── public/
│   └── uploads/            # Yüklenen dosyalar
├── .env.example
├── package.json
└── README.md
```

## 🛠️ Geliştirme

```bash
# Test
npm test

# Lint
npm run lint
```

## 📦 Deployment

### Render.com (Önerilen - Ücretsiz)
1. GitHub'a push et
2. render.com'da hesap aç
3. New Web Service > GitHub repo seç
4. Environment variables ekle
5. Deploy!

### Railway.app
1. railway.app'e git
2. New Project > GitHub repo
3. Variables ekle
4. Otomatik deploy

## 📞 Destek

Sorularınız için: destek@equimarket.com

---

Made with ❤️ for EquiMarket
