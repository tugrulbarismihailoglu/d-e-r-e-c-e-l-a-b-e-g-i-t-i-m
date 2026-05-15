const fs = require('fs');
const path = require('path');

const footerTemplate = (depth) => {
    const prefix = '../'.repeat(depth);
    return `
  <!-- Footer -->
  <footer class="w-full px-8 border-t border-gray-100 bg-white py-12 mt-12">
    <div class="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-10">
      <!-- Left Section: Logo & Social -->
      <div class="flex flex-col items-center gap-2">
        <div class="font-black text-2xl text-neutral-900 tracking-tighter cursor-pointer"
          onclick="window.scrollTo({top: 0, behavior: 'smooth'})">
          <div class="flex items-center gap-0.5">
            <img alt="DereceLab Logo" class="w-10 h-10 object-contain mr-1" src="${prefix}Images/logo-siyah.png">
            <span>DereceLab</span>
          </div>
        </div>
        <!-- Social Media Icons -->
        <div class="flex items-center gap-6 text-orange-600">
          <a href="https://www.instagram.com/derecelabcom/" target="_blank"
            class="hover:scale-110 transition-transform">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
              stroke-linecap="round" stroke-linejoin="round">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
              <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
            </svg>
          </a>
          <a href="https://www.youtube.com/@DereceLab" target="_blank" class="hover:scale-110 transition-transform">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
              stroke-linecap="round" stroke-linejoin="round">
              <path
                d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.42a2.78 2.78 0 0 0-1.94 2C1 8.14 1 12 1 12s0 3.86.42 5.58a2.78 2.78 0 0 0 1.94 2c1.71.42 8.6.42 8.6.42s6.88 0 8.6-.42a2.78 2.78 0 0 0 1.94-2C23 15.86 23 12 23 12s0-3.86-.42-5.58z">
              </path>
              <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02"></polygon>
            </svg>
          </a>
        </div>
      </div>
      <!-- Center Section: Legal Links -->
      <div class="flex flex-wrap justify-center gap-x-6 gap-y-2">
        <a href="${prefix}bilgi/#iletisim"
          class="text-sm text-gray-500 hover:text-orange-600 font-medium transition-colors">Kullanıcı Yardım Merkezi</a>
        <a href="${prefix}bilgi/#sss"
          class="text-sm text-gray-500 hover:text-orange-600 font-medium transition-colors">Sık Sorulan Sorular</a>
        <a href="${prefix}bilgi/#on-bilgilendirme"
          class="text-sm text-gray-500 hover:text-orange-600 font-medium transition-colors">Ön Bilgilendirme Formu</a>
        <a href="${prefix}bilgi/#kvkk" class="text-sm text-gray-500 hover:text-orange-600 font-medium transition-colors">KVKK
          Aydınlatma Metni</a>
        <a href="${prefix}bilgi/#kullanim-sartlari"
          class="text-sm text-gray-500 hover:text-orange-600 font-medium transition-colors">Kullanım Şartları</a>
        <a href="${prefix}bilgi/#satis-teslimat"
          class="text-sm text-gray-500 hover:text-orange-600 font-medium transition-colors">Satış ve Teslimat
          Bilgilendirmesi</a>
      </div>
      <!-- Right Section: Payment Logos -->
      <div class="flex flex-col items-center gap-1">
        <img src="${prefix}Images/visamasttroy.png" alt="Ödeme Yöntemleri" class="h-10 w-auto object-contain">
        <img src="${prefix}Images/shopier.png" alt="Shopier" class="h-6 w-auto object-contain opacity-90">
      </div>
    </div>
  </footer>`;
};

const files = [
    { path: 'giris/index.html', depth: 1 },
    { path: 'kayit/index.html', depth: 1 },
    { path: 'odeme/index.html', depth: 1 },
    { path: 'kurslar/verimlilik-optimizasyonu/index.html', depth: 2 },
    { path: 'kurslar/calisma-rotasyonlari/index.html', depth: 2 },
    { path: 'kurslar/zaman-yonetimi/index.html', depth: 2 },
    { path: 'kurslar/uclu-paket/index.html', depth: 2 }
];

const basePath = '/Users/tugrulbaris/Desktop/DereceLab';

files.forEach(f => {
    const fullPath = path.join(basePath, f.path);
    if (!fs.existsSync(fullPath)) {
        console.log(`Skipping missing file: ${f.path}`);
        return;
    }
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Replace <footer>...</footer> block
    const footerRegex = /<footer[\s\S]*?<\/footer>/;
    if (footerRegex.test(content)) {
        content = content.replace(footerRegex, footerTemplate(f.depth));
        fs.writeFileSync(fullPath, content);
        console.log(`Updated footer in: ${f.path}`);
    } else {
        console.log(`No footer found in: ${f.path}`);
    }
});
