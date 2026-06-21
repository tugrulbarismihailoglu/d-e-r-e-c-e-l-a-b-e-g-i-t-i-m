
// Dynamically compute the base URL of the project
const _catalogScriptUrl = document.currentScript ? document.currentScript.src : window.location.href;
// Since catalog.js is in root, we take the path up to the last slash
const CATALOG_BASE_URL = _catalogScriptUrl.substring(0, _catalogScriptUrl.lastIndexOf('/'));

window.DereceLab = window.DereceLab || {};

window.DereceLab.Catalog = {
    'course_1': {
        id: 'course_1', name: 'Verimlilik Optimizasyonu Video Seti', price: 319.90, url: CATALOG_BASE_URL + '/kurslar/verimlilik-optimizasyonu/',
        img: CATALOG_BASE_URL + '/Images/verimlilik.png',
        badge: 'POPÜLER',
        titleHtml: 'Verimlilik Optimizasyonu <span class="block text-sm mt-1 font-semibold text-gray-500">Video Seti</span>',
        features: ['Stratejik Planlama Teknikleri', 'Odaklanma Egzersizleri', 'Zihinsel Dayanıklılık Pratikleri'],
        parts: [
            {
                id: 'c1_p1', title: '1. Bölüm: Stratejik Planlamanın Temelleri', videoUrl: 'https://player.mediadelivery.net/play/688322/869331ad-a74d-4ade-9b3f-4a2416056e1b'
            },
            { id: 'c1_p2', title: '2. Bölüm: Derin Odaklanma Egzersizleri', videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ' },
            { id: 'c1_p3', title: '3. Bölüm: Zihinsel Dayanıklılık ve Pratikler', videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ' }
        ]
    },
    'course_2': {
        id: 'course_2', name: 'Zaman Yönetimi Video Seti', price: 349.90, url: CATALOG_BASE_URL + '/kurslar/zaman-yonetimi/',
        img: CATALOG_BASE_URL + '/Images/zaman-yonetimi.png',
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
        img: CATALOG_BASE_URL + '/Images/calisma-rotasyon.png',
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
        img: CATALOG_BASE_URL + '/Images/avantajli.png',
        badge: 'AVANTAJLI',
        titleHtml: 'DereceLab Üçlü Paket <span class="block text-sm mt-1 font-semibold text-gray-500">3 Video Seti Bir Arada</span>',
        features: ['Tüm Kurslara Sınırsız Erişim', 'Özel Öğrenci Topluluğu', 'Birebir Mentorluk İndirimi']
    }
};
