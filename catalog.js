
// Dynamically compute the base URL of the project
const _catalogScriptUrl = document.currentScript ? document.currentScript.src : window.location.href;
// Since catalog.js is in root, we take the path up to the last slash
const CATALOG_BASE_URL = _catalogScriptUrl.substring(0, _catalogScriptUrl.lastIndexOf('/'));

window.DereceLab = window.DereceLab || {};

window.DereceLab.Catalog = {
    'course_1': {
        id: 'course_1', name: 'Verimlilik Optimizasyonu Video Seti', price: 319.90, url: CATALOG_BASE_URL + '/kurslar/verimlilik-optimizasyonu/',
        img: CATALOG_BASE_URL + '/Images/verimlilik.webp',
        badge: 'POPÜLER',
        titleHtml: 'Verimlilik Optimizasyonu <span class="block text-sm mt-1 font-semibold text-gray-500">Video Seti</span>',
        features: ['Stratejik Planlama Teknikleri', 'Odaklanma Egzersizleri', 'Zihinsel Dayanıklılık Pratikleri'],
        parts: [
            { id: 'c1_p1', title: '1. Bölüm', videoUrl: 'https://player.mediadelivery.net/embed/688322/47a3883c-f42a-40d3-b0ec-bfa1e118d4cd?autoplay=false&loop=false&muted=true&preload=true&responsive=true' },
            { id: 'c1_p2', title: '2. Bölüm', videoUrl: 'https://player.mediadelivery.net/embed/688322/ba5e01e0-9284-4172-9f4a-867d5fe1401c?autoplay=false&loop=false&muted=true&preload=true&responsive=true' },
            { id: 'c1_p3', title: '3. Bölüm', videoUrl: 'https://player.mediadelivery.net/embed/688322/93aa57c5-0529-4d55-a084-aea3fce4c5c0?autoplay=false&loop=false&muted=true&preload=true&responsive=true' },
            { id: 'c1_p4', title: '4. Bölüm', videoUrl: 'https://player.mediadelivery.net/embed/688322/e860d516-39fb-4d6f-b343-b17ccf28b482?autoplay=false&loop=false&muted=true&preload=true&responsive=true' },
            { id: 'c1_p5', title: '5. Bölüm', videoUrl: 'https://player.mediadelivery.net/embed/688322/50c1c2a0-91f4-46db-9b52-86e45b2ba272?autoplay=false&loop=false&muted=true&preload=true&responsive=true' },
            { id: 'c1_p6', title: '6. Bölüm', videoUrl: 'https://player.mediadelivery.net/embed/688322/97104c05-fdc2-4768-a6da-768805555ac0?autoplay=false&loop=false&muted=true&preload=true&responsive=true' }
        ]
    },
    'course_2': {
        id: 'course_2', name: 'Zaman Yönetimi Video Seti', price: 349.90, url: CATALOG_BASE_URL + '/kurslar/zaman-yonetimi/',
        img: CATALOG_BASE_URL + '/Images/zaman-yonetimi.webp',
        badge: 'YENİ',
        titleHtml: 'Zaman Yönetimi <span class="block text-sm mt-1 font-semibold text-gray-500">Video Seti</span>',
        features: ['Pomodoro Tekniği İle Çalışma', 'Günlük Planlama Stratejileri', 'Erteleme Alışkanlığını Yenme'],
        parts: [
            { id: 'c2_p1', title: '1. Bölüm', videoUrl: 'https://player.mediadelivery.net/embed/688322/c727136c-3e58-4e2c-b020-f55332bc9195?autoplay=false&loop=false&muted=true&preload=true&responsive=true' }
        ]
    },
    'course_3': {
        id: 'course_3', name: 'Çalışma Rotasyonları Video Seti', price: 429.90, url: CATALOG_BASE_URL + '/kurslar/calisma-rotasyonlari/',
        img: CATALOG_BASE_URL + '/Images/calisma-rotasyon.webp',
        badge: 'KAPSAMLI',
        titleHtml: 'Çalışma Rotasyonları <span class="block text-sm mt-1 font-semibold text-gray-500">Video Seti</span>',
        features: ['Dersler Arası Geçiş Stratejileri', 'Enerji Yönetimi Teknikleri', 'Günlük Verimi Artıran Programlar'],
        parts: [
            { id: 'c3_p1', title: '1. Bölüm', videoUrl: 'https://player.mediadelivery.net/embed/688322/a14ff68b-8423-41a4-a0b8-0bf0187c14ea?autoplay=false&loop=false&muted=true&preload=true&responsive=true' },
            { id: 'c3_p2', title: '2. Bölüm', videoUrl: 'https://player.mediadelivery.net/embed/688322/ed594333-1b8a-47e7-ad36-2b8b69700b71?autoplay=false&loop=false&muted=true&preload=true&responsive=true' },
            { id: 'c3_p3', title: '3. Bölüm', videoUrl: 'https://player.mediadelivery.net/embed/688322/7b3f4063-cec4-4b19-a2cd-e36ed9ec286b?autoplay=false&loop=false&muted=true&preload=true&responsive=true' }
        ]
    },
    'course_4': {
        id: 'course_4', name: 'DereceLab Üçlü Paket', price: 829.90, url: CATALOG_BASE_URL + '/kurslar/uclu-paket/',
        img: CATALOG_BASE_URL + '/Images/avantajli.webp',
        badge: 'AVANTAJLI',
        titleHtml: 'DereceLab Üçlü Paket <span class="block text-sm mt-1 font-semibold text-gray-500">3 Video Seti Bir Arada</span>',
        features: ['Tüm Kurslara Sınırsız Erişim', 'Özel Öğrenci Topluluğu', 'Birebir Mentorluk İndirimi']
    }
};
