
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
            {
                id: 'c1_p1', title: '1. Bölüm', videoUrl: 'https://player.mediadelivery.net/embed/688322/ffaf8608-33e3-49d7-8a9e-d37d0bfb2e32?autoplay=false&loop=false&muted=true&preload=true&responsive=true'
            },
            { id: 'c1_p2', title: '2. Bölüm', videoUrl: 'https://player.mediadelivery.net/embed/688322/1189514e-84a3-4232-b4f2-0f565b796651?autoplay=false&loop=false&muted=true&preload=true&responsive=true' },
            { id: 'c1_p3', title: '3. Bölüm', videoUrl: 'https://player.mediadelivery.net/embed/688322/081fb6b3-bbbc-4c86-a1df-ba449a049999?autoplay=false&loop=false&muted=true&preload=true&responsive=true' },
            { id: 'c1_p4', title: '4. Bölüm', videoUrl: 'https://player.mediadelivery.net/embed/688322/03f6315c-8e87-44b9-998a-f9248f1350b7?autoplay=false&loop=false&muted=true&preload=true&responsive=true' },
            { id: 'c1_p5', title: '5. Bölüm', videoUrl: 'https://player.mediadelivery.net/embed/688322/0c5e132e-6029-4b9c-935d-2740af2ca1aa?autoplay=false&loop=false&muted=true&preload=true&responsive=true' },
            { id: 'c1_p6', title: '6. Bölüm', videoUrl: 'https://player.mediadelivery.net/embed/688322/e63c3f9a-3f15-4332-8ccb-c2e0ed34990b?autoplay=false&loop=false&muted=true&preload=true&responsive=true' }
        ]
    },
    'course_2': {
        id: 'course_2', name: 'Zaman Yönetimi Video Seti', price: 349.90, url: CATALOG_BASE_URL + '/kurslar/zaman-yonetimi/',
        img: CATALOG_BASE_URL + '/Images/zaman-yonetimi.webp',
        badge: 'YENİ',
        titleHtml: 'Zaman Yönetimi <span class="block text-sm mt-1 font-semibold text-gray-500">Video Seti</span>',
        features: ['Pomodoro Tekniği İle Çalışma', 'Günlük Planlama Stratejileri', 'Erteleme Alışkanlığını Yenme'],
        parts: [
            { id: 'c2_p1', title: '1. Bölüm: Zaman Hırsızlarını Tanımak', videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ' },
            { id: 'c2_p2', title: '2. Bölüm: Önceliklendirme Matrisi (Eisenhower)', videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ' },
            { id: 'c2_p3', title: '3. Bölüm: Ertelemeyi Yenme Stratejileri', videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ' }
        ]
    },
    'course_3': {
        id: 'course_3', name: 'Çalışma Rotasyonları Video Seti', price: 429.90, url: CATALOG_BASE_URL + '/kurslar/calisma-rotasyonlari/',
        img: CATALOG_BASE_URL + '/Images/calisma-rotasyon.webp',
        badge: 'KAPSAMLI',
        titleHtml: 'Çalışma Rotasyonları <span class="block text-sm mt-1 font-semibold text-gray-500">Video Seti</span>',
        features: ['Dersler Arası Geçiş Stratejileri', 'Enerji Yönetimi Teknikleri', 'Günlük Verimi Artıran Programlar'],
        parts: [
            { id: 'c3_p1', title: '1. Bölüm: Zihin Haritalama ile Ders Geçişleri', videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ' },
            { id: 'c3_p2', title: '2. Bölüm: Aktif Geri Çağırma (Active Recall)', videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ' },
            { id: 'c3_p3', title: '3. Bölüm: Aralıklı Tekrar Sistemi (Spaced Repetition)', videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ' }
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
