/**
 * EquiMarket Database Seed Script
 *
 * Usage: node src/scripts/seed.js
 *
 * Creates:
 * - 1 Admin user
 * - 3 Seller/buyer users
 * - 12 Sample horse listings
 * - 3 Blog posts
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const slugify = require('slugify');

// Models
const User = require('../models/User');
const Horse = require('../models/Horse');
const Blog = require('../models/Blog');

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('MONGODB_URI is not set in .env file');
    process.exit(1);
}

// --- Seed Data ---

const users = [
    {
        name: 'Admin',
        email: 'admin@equimarket.com',
        password: 'Admin123!',
        phone: '05001234567',
        role: 'admin',
        isVerified: true,
        isActive: true,
        location: { city: 'Istanbul', district: 'Beşiktaş' },
        sellerInfo: {
            companyName: 'EquiMarket Yönetim',
            isVerifiedSeller: true,
            verifiedAt: new Date(),
            memberSince: new Date()
        }
    },
    {
        name: 'Ahmet Yılmaz',
        email: 'ahmet@example.com',
        password: 'Test1234!',
        phone: '05321112233',
        role: 'seller',
        isVerified: true,
        isActive: true,
        bio: 'İstanbul merkezli profesyonel at yetiştiricisi. 15 yıllık deneyim.',
        location: { city: 'Istanbul', district: 'Şile' },
        sellerInfo: {
            companyName: 'Yılmaz Çiftliği',
            tjkLicenseNo: 'TJK-2024-001',
            isVerifiedSeller: true,
            verifiedAt: new Date(),
            rating: 4.8,
            totalSales: 12,
            totalReviews: 8,
            memberSince: new Date('2023-06-15'),
            specialties: ['yarış atı', 'İngiliz']
        }
    },
    {
        name: 'Fatma Demir',
        email: 'fatma@example.com',
        password: 'Test1234!',
        phone: '05339998877',
        role: 'seller',
        isVerified: true,
        isActive: true,
        bio: 'Arap atları konusunda uzman, Bursa bölgesinde faaliyet gösteriyorum.',
        location: { city: 'Bursa', district: 'Nilüfer' },
        sellerInfo: {
            companyName: 'Demir Haras',
            tjkLicenseNo: 'TJK-2024-002',
            isVerifiedSeller: true,
            verifiedAt: new Date(),
            rating: 4.5,
            totalSales: 7,
            totalReviews: 5,
            memberSince: new Date('2023-09-01'),
            specialties: ['Arap atı', 'engel atı']
        }
    },
    {
        name: 'Mehmet Kara',
        email: 'mehmet@example.com',
        password: 'Test1234!',
        phone: '05441234567',
        role: 'buyer',
        isVerified: true,
        isActive: true,
        location: { city: 'Ankara', district: 'Çankaya' },
        sellerInfo: {
            memberSince: new Date()
        }
    }
];

const createHorses = (sellerIds) => [
    {
        name: 'Storm Chaser',
        breed: 'ingiliz',
        gender: 'erkek',
        color: 'doru',
        birthDate: new Date('2020-03-15'),
        height: 165,
        weight: 480,
        price: 850000,
        priceNegotiable: true,
        location: { city: 'Istanbul', district: 'Şile' },
        description: 'Yarış kariyerinde 5 birinciliği bulunan İngiliz tam kan aygır. Mükemmel soy ağacı ve sağlık geçmişi. Yüksek performanslı yarışçı, eğitimli ve uyumlu. TJK tescilli, tüm sağlık belgeleri mevcut.',
        images: [{ url: 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?w=800', isMain: true, order: 0 }],
        pedigree: { sire: 'Thunder Bolt', dam: 'Sea Breeze', sireOfSire: 'Lightning King' },
        racingHistory: { totalRaces: 18, wins: 5, places: 4, earnings: 1250000, bestTime: '1:34.2' },
        health: { vaccinated: true, lastVetCheck: new Date('2025-12-01') },
        status: 'active',
        listingPackage: 'featured',
        isFeatured: true,
        seller: sellerIds[0],
        stats: { views: 342, favorites: 28, inquiries: 12 },
        tags: ['yarış', 'şampiyon', 'tam kan']
    },
    {
        name: 'Çölün Rüzgarı',
        breed: 'arap',
        gender: 'disi',
        color: 'kir',
        birthDate: new Date('2019-05-20'),
        height: 152,
        weight: 420,
        price: 620000,
        priceNegotiable: false,
        location: { city: 'Bursa', district: 'Nilüfer' },
        description: 'Saf kan Arap kısrağı. Zarif yapısı ve güçlü dayanıklılığı ile dikkat çeken bu güzel at, hem yarış hem de damızlık amaçlı idealdir. Sakin mizacı ve eğitime yatkın yapısıyla aile çiftlikleri için de uygundur.',
        images: [{ url: 'https://images.unsplash.com/photo-1598974357801-cbca100e65d3?w=800', isMain: true, order: 0 }],
        pedigree: { sire: 'Sahara Prince', dam: 'Desert Rose' },
        racingHistory: { totalRaces: 12, wins: 3, places: 5, earnings: 780000, bestTime: '1:36.8' },
        health: { vaccinated: true, lastVetCheck: new Date('2025-11-15') },
        status: 'active',
        listingPackage: 'featured',
        isFeatured: true,
        seller: sellerIds[1],
        stats: { views: 256, favorites: 35, inquiries: 9 },
        tags: ['arap', 'damızlık', 'saf kan']
    },
    {
        name: 'Yıldırım',
        breed: 'ingiliz',
        gender: 'erkek',
        color: 'yagiz',
        birthDate: new Date('2021-01-10'),
        height: 168,
        weight: 490,
        price: 1200000,
        priceNegotiable: true,
        location: { city: 'Istanbul', district: 'Beykoz' },
        description: 'Genç ve yetenekli İngiliz tam kan aygır. Yarış kariyerine yeni başlamış olmasına rağmen son derece umut vaat eden performans sergiliyor. Profesyonel antrenör eşliğinde eğitim almıştır.',
        images: [{ url: 'https://images.unsplash.com/photo-1534773728080-aa7e00e5e24f?w=800', isMain: true, order: 0 }],
        pedigree: { sire: 'Golden Arrow', dam: 'Midnight Star' },
        racingHistory: { totalRaces: 6, wins: 2, places: 3, earnings: 450000, bestTime: '1:33.5' },
        health: { vaccinated: true, lastVetCheck: new Date('2026-01-10') },
        status: 'active',
        listingPackage: 'premium',
        isFeatured: true,
        seller: sellerIds[0],
        stats: { views: 189, favorites: 22, inquiries: 7 },
        tags: ['yarış', 'genç', 'yetenek']
    },
    {
        name: 'Safir',
        breed: 'arap',
        gender: 'erkek',
        color: 'al',
        birthDate: new Date('2018-08-12'),
        height: 155,
        weight: 440,
        price: 480000,
        priceNegotiable: true,
        location: { city: 'Bursa', district: 'Mudanya' },
        description: 'Deneyimli Arap aygırı. Hem yarışlarda hem de gösteri organizasyonlarında başarılı geçmişe sahip. Sakin ve uyumlu yapısıyla her seviyedeki biniciye uygun. Bakımlı ve sağlıklı.',
        images: [{ url: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800', isMain: true, order: 0 }],
        pedigree: { sire: 'Royal Prince', dam: 'Pearl' },
        racingHistory: { totalRaces: 24, wins: 6, places: 8, earnings: 920000 },
        health: { vaccinated: true, lastVetCheck: new Date('2025-10-20') },
        status: 'active',
        seller: sellerIds[1],
        stats: { views: 198, favorites: 18, inquiries: 5 },
        tags: ['deneyimli', 'gösteri', 'uyumlu']
    },
    {
        name: 'Rüzgar',
        breed: 'turk',
        gender: 'erkek',
        color: 'doru',
        birthDate: new Date('2020-11-05'),
        height: 148,
        weight: 400,
        price: 350000,
        priceNegotiable: false,
        location: { city: 'Ankara', district: 'Altındağ' },
        description: 'Saf Türk atı ırkından güçlü ve dayanıklı bir aygır. Uzun mesafe yarışlarında üstün performans gösteren bu at, Anadolu bozkırlarının gerçek bir temsilcisidir. Eğitimli, bakımlı ve sağlıklıdır.',
        images: [{ url: 'https://images.unsplash.com/photo-1509130298739-651801c76e96?w=800', isMain: true, order: 0 }],
        pedigree: { sire: 'Bozkurt', dam: 'Ayla' },
        health: { vaccinated: true, lastVetCheck: new Date('2025-09-15') },
        status: 'active',
        seller: sellerIds[0],
        stats: { views: 134, favorites: 14, inquiries: 4 },
        tags: ['türk atı', 'dayanıklı', 'saf kan']
    },
    {
        name: 'Luna',
        breed: 'ingiliz',
        gender: 'disi',
        color: 'kir',
        birthDate: new Date('2019-06-22'),
        height: 162,
        weight: 460,
        price: 750000,
        priceNegotiable: true,
        location: { city: 'Izmir', district: 'Urla' },
        description: 'Şampiyon soyundan gelen İngiliz tam kan kısrak. Hem yarış kariyeri hem de damızlık potansiyeli açısından son derece değerli. Zarif yapısı ve güçlü fiziksel özellikleri ile öne çıkmaktadır.',
        images: [{ url: 'https://images.unsplash.com/photo-1560939336-76e8ad4e9d1c?w=800', isMain: true, order: 0 }],
        pedigree: { sire: 'Silver Moon', dam: 'Night Queen' },
        racingHistory: { totalRaces: 14, wins: 4, places: 6, earnings: 680000, bestTime: '1:35.1' },
        health: { vaccinated: true, lastVetCheck: new Date('2025-11-30') },
        status: 'active',
        listingPackage: 'featured',
        isFeatured: true,
        seller: sellerIds[1],
        stats: { views: 287, favorites: 42, inquiries: 11 },
        tags: ['şampiyon soyu', 'damızlık', 'kısrak']
    },
    {
        name: 'Karayel',
        breed: 'ingiliz',
        gender: 'erkek',
        color: 'yagiz',
        birthDate: new Date('2022-02-14'),
        height: 170,
        weight: 500,
        price: 950000,
        priceNegotiable: true,
        location: { city: 'Istanbul', district: 'Çatalca' },
        description: 'Çok genç ve son derece yetenekli İngiliz tam kan aygır. Antrenman performansları olağanüstü, yarış kariyerine hazırlanıyor. Profesyonel bakım altında ve tüm aşıları tam.',
        images: [{ url: 'https://images.unsplash.com/photo-1551884831-bbf3cdc6469e?w=800', isMain: true, order: 0 }],
        pedigree: { sire: 'Dark Knight', dam: 'Wind Song' },
        health: { vaccinated: true, lastVetCheck: new Date('2026-01-20') },
        status: 'active',
        seller: sellerIds[0],
        stats: { views: 156, favorites: 19, inquiries: 6 },
        tags: ['genç', 'potansiyel', 'antrenman']
    },
    {
        name: 'Altın',
        breed: 'arap',
        gender: 'disi',
        color: 'doru',
        birthDate: new Date('2017-04-08'),
        height: 150,
        weight: 410,
        price: 380000,
        priceNegotiable: true,
        location: { city: 'Antalya', district: 'Kemer' },
        description: 'Deneyimli ve sakin Arap kısrağı. Damızlık olarak mükemmel soy ağacına sahip. Daha önce iki sağlıklı tay doğurmuştur. Binicilere karşı çok uyumlu ve güvenli bir attır.',
        images: [{ url: 'https://images.unsplash.com/photo-1596662951482-0c4ba74a6df6?w=800', isMain: true, order: 0 }],
        pedigree: { sire: 'Golden Sun', dam: 'Amber' },
        racingHistory: { totalRaces: 20, wins: 5, places: 7, earnings: 560000 },
        health: { vaccinated: true, lastVetCheck: new Date('2025-08-10') },
        status: 'active',
        seller: sellerIds[1],
        stats: { views: 145, favorites: 21, inquiries: 8 },
        tags: ['damızlık', 'deneyimli', 'sakin']
    },
    {
        name: 'Fırtına',
        breed: 'ingiliz',
        gender: 'igdis',
        color: 'al',
        birthDate: new Date('2018-09-30'),
        height: 163,
        weight: 475,
        price: 420000,
        priceNegotiable: false,
        location: { city: 'Adana', district: 'Yüreğir' },
        description: 'Yarış kariyerini tamamlamış İngiliz tam kan. Artık hobi ve gezi amaçlı biniciliğe çok uygun. Sakin mizacı ve tecrübesi ile her seviyedeki binici için güvenilir bir partner.',
        images: [{ url: 'https://images.unsplash.com/photo-1580052614034-c55d20b96f4b?w=800', isMain: true, order: 0 }],
        racingHistory: { totalRaces: 30, wins: 7, places: 10, earnings: 1100000 },
        health: { vaccinated: true, lastVetCheck: new Date('2025-07-20') },
        status: 'active',
        seller: sellerIds[0],
        stats: { views: 98, favorites: 11, inquiries: 3 },
        tags: ['hobi', 'gezi', 'tecrübeli']
    },
    {
        name: 'Prenses',
        breed: 'arap',
        gender: 'disi',
        color: 'kir',
        birthDate: new Date('2021-07-18'),
        height: 149,
        weight: 400,
        price: 550000,
        priceNegotiable: true,
        location: { city: 'Bursa', district: 'Osmangazi' },
        description: 'Genç ve zarif Arap kısrağı. Çok güzel hareketlere sahip, gösteri ve yarış performansı yüksek. Eğitime çok yatkın ve sahibine bağlı bir at. Soy belgesi ve tüm evrakları tamdır.',
        images: [{ url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800', isMain: true, order: 0 }],
        pedigree: { sire: 'Desert King', dam: 'White Pearl' },
        health: { vaccinated: true, lastVetCheck: new Date('2025-12-15') },
        status: 'active',
        seller: sellerIds[1],
        stats: { views: 201, favorites: 31, inquiries: 10 },
        tags: ['zarif', 'gösteri', 'genç']
    },
    {
        name: 'Bulut',
        breed: 'turk',
        gender: 'erkek',
        color: 'kir',
        birthDate: new Date('2019-12-01'),
        height: 150,
        weight: 420,
        price: 280000,
        priceNegotiable: true,
        location: { city: 'Konya', district: 'Selçuklu' },
        description: 'Güçlü ve dayanıklı Türk atı aygırı. Uzun mesafe gezileri ve doğa sporları için ideal. Soğuk hava koşullarına dayanıklı yapısıyla Anadolu coğrafyasına mükemmel uyum sağlar.',
        images: [{ url: 'https://images.unsplash.com/photo-1557761018-e99ca37baa00?w=800', isMain: true, order: 0 }],
        health: { vaccinated: true, lastVetCheck: new Date('2025-10-01') },
        status: 'active',
        seller: sellerIds[0],
        stats: { views: 87, favorites: 9, inquiries: 2 },
        tags: ['doğa', 'dayanıklı', 'gezi']
    },
    {
        name: 'Şimşek',
        breed: 'ingiliz',
        gender: 'erkek',
        color: 'doru',
        birthDate: new Date('2022-05-10'),
        height: 166,
        weight: 470,
        price: 1500000,
        priceNegotiable: true,
        location: { city: 'Istanbul', district: 'Pendik' },
        description: 'Son derece değerli genç İngiliz tam kan aygır. Şampiyon babası ve annesi ile olağanüstü genetik potansiyele sahip. İlk yarışlarında büyük başarı göstermiş, geleceğin yıldız adayı.',
        images: [{ url: 'https://images.unsplash.com/photo-1508336120949-bc1f12d068e2?w=800', isMain: true, order: 0 }],
        pedigree: { sire: 'Champion Star', dam: 'Victory Lane', sireOfSire: 'Grand Master' },
        racingHistory: { totalRaces: 4, wins: 3, places: 1, earnings: 350000, bestTime: '1:32.8' },
        health: { vaccinated: true, lastVetCheck: new Date('2026-02-01') },
        status: 'active',
        listingPackage: 'premium',
        isFeatured: true,
        seller: sellerIds[0],
        stats: { views: 412, favorites: 56, inquiries: 18 },
        tags: ['şampiyon soyu', 'yıldız', 'premium']
    }
];

const blogPosts = [
    {
        title: 'Yarış Atı Satın Alırken Dikkat Edilmesi Gerekenler',
        slug: 'yaris-ati-satin-alirken-dikkat-edilmesi-gerekenler',
        excerpt: 'Yarış atı satın almak büyük bir yatırımdır. İşte doğru atı seçmenize yardımcı olacak uzman tavsiyeleri.',
        content: `
# Yarış Atı Satın Alırken Dikkat Edilmesi Gerekenler

Yarış atı satın almak hem finansal hem de duygusal açıdan büyük bir karardır. Doğru atı seçmek için dikkat etmeniz gereken pek çok faktör vardır.

## 1. Soy Ağacını İnceleyin
Atın soy ağacı, gelecekteki performansı hakkında en önemli ipucunu verir. Baba ve anne tarafındaki yarış geçmişini mutlaka araştırın.

## 2. Veteriner Kontrolü Yaptırın
Satın alma öncesinde bağımsız bir veteriner tarafından kapsamlı sağlık kontrolü mutlaka yaptırılmalıdır. Kemik yapısı, solunum sistemi ve genel sağlık durumu değerlendirilmelidir.

## 3. Yarış Geçmişini Analiz Edin
Atın geçmiş yarışlardaki performansı, hangi pist koşullarında daha başarılı olduğu ve rakiplerine karşı gösterdiği performans detaylı incelenmelidir.

## 4. Yaş ve Potansiyel
Genç atlar daha yüksek potansiyel sunar ancak risk de daha fazladır. Deneyimli atlar daha güvenilir ancak kalan yarış ömürleri sınırlı olabilir.

## 5. Bütçe Planlaması
Sadece satın alma fiyatı değil, bakım, eğitim, veteriner masrafları ve yarış giriş ücretlerini de hesaba katın.
        `,
        category: 'rehber',
        tags: ['satın alma', 'yarış atı', 'rehber', 'yatırım'],
        status: 'published',
        seo: {
            metaTitle: 'Yarış Atı Satın Alma Rehberi | EquiMarket',
            metaDescription: 'Yarış atı satın alırken nelere dikkat etmelisiniz? Uzman tavsiyeleri ve detaylı rehber.'
        },
        stats: { views: 1250 }
    },
    {
        title: 'Türkiye\'de At Yarışçılığının Tarihi',
        slug: 'turkiyede-at-yarisciligin-tarihi',
        excerpt: 'Osmanlı döneminden günümüze Türkiye\'de at yarışçılığının gelişimi ve önemli dönüm noktaları.',
        content: `
# Türkiye'de At Yarışçılığının Tarihi

At yarışçılığı, Türkiye'de köklü bir geleneğe sahiptir. Osmanlı İmparatorluğu döneminden başlayan bu gelenek, günümüzde modern bir sektöre dönüşmüştür.

## Osmanlı Dönemi
Osmanlı İmparatorluğu'nda at yarışları, saray kültürünün önemli bir parçasıydı. Padişahlar özel yarış atları yetiştirtir ve yarışlar düzenletirdi.

## Cumhuriyet Dönemi
1924 yılında kurulan Türkiye Jokey Kulübü (TJK), Türk at yarışçılığının modern temellerini atmıştır. İlk resmi yarışlar Ankara Hipodromu'nda düzenlenmiştir.

## Günümüz
Bugün Türkiye, yılda binlerce yarışın düzenlendiği, güçlü bir at yarışçılığı sektörüne sahiptir. İstanbul, Ankara, İzmir ve Adana'daki hipodromlar bu geleneği yaşatmaktadır.
        `,
        category: 'tarih',
        tags: ['tarih', 'TJK', 'Türkiye', 'at yarışı'],
        status: 'published',
        seo: {
            metaTitle: 'Türkiye\'de At Yarışçılığının Tarihi | EquiMarket',
            metaDescription: 'Osmanlı\'dan günümüze Türk at yarışçılığının hikayesi.'
        },
        stats: { views: 870 }
    },
    {
        title: 'At Bakımında Temel İlkeler',
        slug: 'at-bakiminda-temel-ilkeler',
        excerpt: 'Sağlıklı ve mutlu bir at için temel bakım rehberi. Beslenme, barınak, egzersiz ve sağlık kontrolleri.',
        content: `
# At Bakımında Temel İlkeler

Bir ata sahip olmak büyük bir sorumluluktur. İşte sağlıklı ve mutlu bir at için bilmeniz gereken temel bakım ilkeleri.

## Beslenme
Kaliteli kuru ot, yulaf ve temiz su atınızın temel ihtiyaçlarıdır. Günlük vitamin ve mineral takviyesi de düşünülmelidir.

## Barınak
Temiz, kuru ve havadar bir ahır sağlamak atınızın konforunu ve sağlığını doğrudan etkiler. Düzenli temizlik şarttır.

## Egzersiz
Düzenli egzersiz hem fiziksel hem de mental sağlık için kritiktir. Her atın ihtiyacına göre bir egzersiz programı oluşturulmalıdır.

## Sağlık Kontrolleri
Düzenli veteriner kontrolleri, aşılama takvimi ve diş bakımı ihmal edilmemelidir. Erken teşhis, tedavinin en önemli parçasıdır.

## Nalcı Bakımı
6-8 haftada bir nalcı kontrolü ve gerektiğinde nal değişimi yapılmalıdır. Tırnak sağlığı genel sağlığı doğrudan etkiler.
        `,
        category: 'bakım',
        tags: ['bakım', 'beslenme', 'sağlık', 'rehber'],
        status: 'published',
        seo: {
            metaTitle: 'At Bakım Rehberi | EquiMarket',
            metaDescription: 'At bakımında temel ilkeler: beslenme, barınak, egzersiz ve sağlık kontrolleri.'
        },
        stats: { views: 643 }
    }
];

// --- Seed Function ---

async function seed() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('Connected.\n');

        // Ask for confirmation
        const args = process.argv.slice(2);
        const force = args.includes('--force');

        if (!force) {
            const userCount = await User.countDocuments();
            const horseCount = await Horse.countDocuments();
            if (userCount > 0 || horseCount > 0) {
                console.log(`Database already has ${userCount} users and ${horseCount} horses.`);
                console.log('Use --force to clear and reseed.');
                process.exit(0);
            }
        }

        // Clear existing data
        console.log('Clearing existing data...');
        await User.deleteMany({});
        await Horse.deleteMany({});
        await Blog.deleteMany({});
        console.log('Cleared.\n');

        // Create users (password hashing handled by pre-save hook)
        console.log('Creating users...');
        const createdUsers = [];
        for (const userData of users) {
            const user = await User.create(userData);
            createdUsers.push(user);
            console.log(`  + ${user.name} (${user.email}) [${user.role}]`);
        }

        // Get seller IDs (Ahmet and Fatma)
        const sellerIds = [createdUsers[1]._id, createdUsers[2]._id];

        // Create horses
        console.log('\nCreating horse listings...');
        const horses = createHorses(sellerIds);
        for (const horseData of horses) {
            // Set slug and age manually since we use create()
            horseData.slug = slugify(horseData.name, { lower: true, strict: true });
            if (horseData.birthDate) {
                horseData.age = new Date().getFullYear() - new Date(horseData.birthDate).getFullYear();
            }
            const breedNames = { 'ingiliz': 'İngiliz (Thoroughbred)', 'arap': 'Arap', 'turk': 'Türk Atı', 'diger': 'Diğer' };
            horseData.breedDisplay = breedNames[horseData.breed] || horseData.breed;
            horseData.expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000); // 90 days

            const horse = await Horse.create(horseData);
            console.log(`  + ${horse.name} (${horse.breedDisplay}, ₺${horse.price.toLocaleString('tr-TR')})`);
        }

        // Create blog posts
        console.log('\nCreating blog posts...');
        for (const blogData of blogPosts) {
            blogData.author = createdUsers[0]._id; // Admin is author
            const blog = await Blog.create(blogData);
            console.log(`  + ${blog.title}`);
        }

        console.log('\n========================================');
        console.log('  Seed completed successfully!');
        console.log('========================================');
        console.log(`\n  Users:    ${createdUsers.length}`);
        console.log(`  Horses:   ${horses.length}`);
        console.log(`  Blogs:    ${blogPosts.length}`);
        console.log('\n  Login credentials:');
        console.log('  Admin:   admin@equimarket.com / Admin123!');
        console.log('  Seller:  ahmet@example.com / Test1234!');
        console.log('  Seller:  fatma@example.com / Test1234!');
        console.log('  Buyer:   mehmet@example.com / Test1234!');
        console.log('');

    } catch (error) {
        console.error('Seed error:', error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

seed();
