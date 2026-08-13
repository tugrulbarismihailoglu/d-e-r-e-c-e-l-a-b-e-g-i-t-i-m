const fs = require('fs');
const path = require('path');

const footerTemplate = (depth) => {
  const prefix = '../'.repeat(depth);
  return `
  <!-- Footer -->
  <footer class="w-full px-8 border-t border-gray-100 bg-white py-12 mt-12">
    <div class="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-10">
      <div class="flex flex-col items-center gap-2 text-center">
        <div class="font-black text-2xl text-neutral-900 tracking-tighter cursor-pointer"
          onclick="window.scrollTo({top: 0, behavior: 'smooth'})">
          <div class="flex items-center justify-center gap-0.5">
            <img alt="DereceLab Logo" class="w-10 h-10 object-contain mr-1" src="${prefix}Images/logo-siyah.webp">
            <span>DereceLab</span>
          </div>
        </div>
        <span class="text-xs text-gray-500 font-medium mt-1">derecelabcom@gmail.com</span>
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
        <img src="${prefix}Images/visamasttroy.webp" alt="Ödeme Yöntemleri" class="h-10 w-auto object-contain">
        <img src="${prefix}Images/shopier.webp" alt="Shopier" class="h-6 w-auto object-contain opacity-90">
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
