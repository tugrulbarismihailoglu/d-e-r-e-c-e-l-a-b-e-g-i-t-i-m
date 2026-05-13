// =====================================================
// DereceLab Auth Helper
// Tüm sayfalarda kullanılır — header auth durumunu yönetir
// =====================================================


// Dynamically compute the base URL of the project
const _scriptUrl = document.currentScript ? document.currentScript.src : window.location.href;
// auth.js artık kök dizinde olduğu için regex'i buna göre güncelliyoruz
const _basePathMatch = _scriptUrl.match(/^(.*)\/auth\.js/);
const BASE_URL = _basePathMatch ? _basePathMatch[1] : '';

const DereceLab = window.DereceLab || {};
window.DereceLab = DereceLab;
DereceLab.Auth = DereceLab.Auth || {};
DereceLab.Auth.BASE_URL = BASE_URL; // Expose globally

Object.assign(DereceLab.Auth, {
  currentUser: undefined,
  onReadyCallbacks: [],

  init() {
    // Hızlı gösterim için cache'deki veriyi kullan
    const cachedUser = localStorage.getItem('derecelab_user');
    if (cachedUser) {
      try {
        this.updateHeaderUI(JSON.parse(cachedUser));
      } catch(e) {}
    }

    auth.onAuthStateChanged(async (user) => {
      this.currentUser = user;
      
      if (user) {
        // Kullanıcı verisini cache'e at
        localStorage.setItem('derecelab_user', JSON.stringify({
          displayName: user.displayName,
          email: user.email,
          uid: user.uid
        }));

        // Satın alınan kursları çek ve sepet UI'ını güncelle
        const purchasedIds = await this.getPurchasedCourses(user.uid);
        if (window.DereceLab && window.DereceLab.Cart) {
          window.DereceLab.Cart.setPurchased(purchasedIds);
        }
      } else {
        // Giriş yapılmamışsa listeleri temizle
        localStorage.removeItem('derecelab_user');
        localStorage.removeItem('derecelab_purchased');
        if (window.DereceLab && window.DereceLab.Cart) {
          window.DereceLab.Cart.setPurchased([]);
        }
      }

      this.updateHeaderUI(user);
      this.onReadyCallbacks.forEach(cb => cb(user));
    });
  },

  onReady(callback) {
    if (this.currentUser !== undefined) {
      callback(this.currentUser);
    }
    this.onReadyCallbacks.push(callback);
  },

  // Header'a auth butonları ekler
  updateHeaderUI(user) {
    const headerRight = document.querySelector('.flex.items-center.gap-2.sm\\:gap-4.z-10') ||
                        document.querySelector('.flex.items-center.gap-2.z-10');
    if (!headerRight) return;

    // Eski auth butonlarını kontrol et
    let authDiv = headerRight.querySelector('#auth-buttons');
    const isFirstLoad = !authDiv;

    if (isFirstLoad) {
      authDiv = document.createElement('div');
      authDiv.id = 'auth-buttons';
      authDiv.className = 'flex items-center gap-2 transition-opacity duration-500';
      
      // Eğer önbellekte veri yoksa başlangıçta gizli başlasın (fade-in için)
      // Önbellekte veri varsa direkt görünür başlasın
      if (!localStorage.getItem('derecelab_user')) {
        authDiv.classList.add('opacity-0');
        headerRight.appendChild(authDiv);
        setTimeout(() => authDiv.classList.remove('opacity-0'), 10);
      } else {
        headerRight.appendChild(authDiv);
      }
    }

    
    if (user) {
      const initial = (user.displayName || user.email || '?')[0].toUpperCase();
      authDiv.innerHTML = `
        <div class="relative group">
          <button class="flex items-center gap-2 px-3 py-1.5 rounded-lg text-white hover:bg-orange-700 transition-colors text-[13px] font-semibold">
            <span class="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold text-white border border-white/30">${initial}</span>
            Hesabım
          </button>
          <div class="absolute right-0 top-full pt-2 hidden group-hover:block z-50">
            <div class="w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1">
              <a href="${BASE_URL}/panel/" class="block px-4 py-2 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600 font-bold">Kurslarıma Git</a>
              <button onclick="DereceLab.Auth.signOut()" class="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 font-bold">
                  <span class="material-symbols-outlined text-[18px]">logout</span> Çıkış Yap
              </button>
            </div>
          </div>
        </div>
      `;
    } else {
      authDiv.innerHTML = `
        <a href="${BASE_URL}/giris/" class="px-2 md:px-3 py-1.5 rounded-lg text-white hover:bg-orange-700 transition-colors text-[11px] md:text-[13px] font-semibold">Giriş Yap</a>
        <a href="${BASE_URL}/kayit/" class="px-2 md:px-3 py-1.5 rounded-lg bg-white text-orange-600 hover:bg-orange-50 transition-colors text-[11px] md:text-[13px] font-bold">Kayıt Ol</a>
      `;
    }

    // Hero title and buttons update
    const heroTitle = document.querySelector('#top h1');
    const heroButtons = document.getElementById('hero-auth-buttons');

    if (user) {
      if (heroTitle) {
          const name = user.displayName || user.email.split('@')[0];
          heroTitle.innerHTML = `<span class="block">Hoş geldin,</span>\n<span class="block text-orange-600">${name}!</span>`;
          // Eğer önbellekten geliyorsa animasyonsuz göster, yoksa fade-in yap
          if (localStorage.getItem('derecelab_user')) {
              heroTitle.classList.remove('opacity-0', 'transition-opacity');
          } else {
              heroTitle.classList.remove('opacity-0');
          }
      }
      if (heroButtons) {
        heroButtons.innerHTML = `
          <a href="${BASE_URL}/panel/" class="px-8 py-3 rounded-xl font-bold text-sm bg-orange-600 text-white hover:bg-orange-700 transition-all duration-200 shadow-lg shadow-orange-100">
            Kurslarıma Git
          </a>
        `;
        if (localStorage.getItem('derecelab_user')) {
            heroButtons.classList.remove('opacity-0', 'transition-opacity');
        } else {
            heroButtons.classList.remove('opacity-0');
        }
      }
    } else {
      if (heroTitle) {
          heroTitle.innerHTML = `<span class="block">Kurslarımız ile</span>\n<span class="block">derece yolunda</span>\n<span class="block text-orange-600">rakiplerinin önüne geç.</span>`;
          heroTitle.classList.remove('opacity-0');
      }
      if (heroButtons) {
        heroButtons.innerHTML = `
          <a href="${BASE_URL}/giris/" class="px-8 py-3 rounded-xl font-bold text-sm bg-white text-orange-600 border-2 border-orange-600 hover:bg-orange-50 transition-all duration-200 shadow-sm">
            Giriş Yap
          </a>
          <a href="${BASE_URL}/kayit/" class="px-8 py-3 rounded-xl font-bold text-sm bg-orange-600 text-white hover:bg-orange-700 transition-all duration-200 shadow-lg shadow-orange-100">
            Kayıt Ol
          </a>
        `;
        heroButtons.classList.remove('opacity-0');
      }
    }
  },

  // Çıkış yap
  async signOut() {
    try {
      localStorage.removeItem('derecelab_cart');
      localStorage.removeItem('derecelab_user');
      localStorage.removeItem('derecelab_purchased');
      await auth.signOut();
      window.location.href = BASE_URL + '/';
    } catch (error) {
      console.error('Çıkış hatası:', error);
    }
  },

  // Sayfa koruması — giriş yapmamışları yönlendir
  requireAuth() {
    return new Promise((resolve) => {
      auth.onAuthStateChanged((user) => {
        if (!user) {
          window.location.href = `${BASE_URL}/giris/`;
        } else {
          resolve(user);
        }
      });
    });
  },

  // Kullanıcı profilini Firestore'dan getir
  async getUserProfile(uid) {
    try {
      const doc = await db.collection('users').doc(uid).get();
      return doc.exists ? doc.data() : null;
    } catch (error) {
      console.error('Profil getirme hatası:', error);
      return null;
    }
  },

  // Kullanıcı profilini güncelle
  async updateUserProfile(uid, data) {
    try {
      await db.collection('users').doc(uid).update(data);
      return true;
    } catch (error) {
      console.error('Profil güncelleme hatası:', error);
      return false;
    }
  },

  // Satın alınan kursları getir
  async getPurchasedCourses(uid) {
    try {
      const doc = await db.collection('users').doc(uid).get();
      if (doc.exists) {
        return doc.data().purchasedCourses || [];
      }
      return [];
    } catch (error) {
      console.error('Kurs getirme hatası:', error);
      return [];
    }
  },

  // Tamamlanan bölümleri getir
  async getCompletedParts(uid) {
    try {
      const doc = await db.collection('users').doc(uid).get();
      if (doc.exists) {
        return doc.data().completedParts || [];
      }
      return [];
    } catch (error) {
      console.error('Tamamlanan bölüm getirme hatası:', error);
      return [];
    }
  },

  // Bir bölümün tamamlanma durumunu değiştir
  async togglePartCompletion(uid, partId, isCompleted) {
    try {
      const doc = await db.collection('users').doc(uid).get();
      let existing = [];
      if (doc.exists) {
        existing = doc.data().completedParts || [];
      }
      
      let newParts;
      if (isCompleted) {
        newParts = [...new Set([...existing, partId])];
      } else {
        newParts = existing.filter(id => id !== partId);
      }
      
      await db.collection('users').doc(uid).update({
        completedParts: newParts
      });
      return newParts;
    } catch (error) {
      console.error('Tamamlanma durumu güncelleme hatası:', error);
      return null;
    }
  },

  // Kurs satın alma (simülasyon)
  async purchaseCourses(uid, courseIds) {
    try {
      const doc = await db.collection('users').doc(uid).get();
      let existing = [];
      if (doc.exists) {
        existing = doc.data().purchasedCourses || [];
      }
      const merged = [...new Set([...existing, ...courseIds])];
      await db.collection('users').doc(uid).update({
        purchasedCourses: merged,
        lastPurchase: firebase.firestore.FieldValue.serverTimestamp()
      });
      return true;
    } catch (error) {
      console.error('Satın alma hatası:', error);
      return false;
    }
  },

  // Shopier'e yönlendir (Satın Al butonu için)
  buyNow(courseId) {
    const user = this.currentUser;
    if (!user) {
      const currentUrl = window.location.href;
      window.location.href = this.BASE_URL + '/giris/?redirect=' + encodeURIComponent(currentUrl);
      return;
    }

    const SHOPIER_LINKS = {
      'course_1': 'https://www.shopier.com/DereceLab/47135332',
      'course_2': 'https://www.shopier.com/DereceLab/47159074',
      'course_3': 'https://www.shopier.com/DereceLab/47159083',
      'course_4': 'https://www.shopier.com/DereceLab/47159325'
    };

    const shopierBase = SHOPIER_LINKS[courseId];
    if (!shopierBase) {
      console.error('Hata: Geçersiz Kurs ID');
      return;
    }

    const shopierUrl = `${shopierBase}?email=${encodeURIComponent(user.email)}&custom=${encodeURIComponent(courseId)}`;
    window.open(shopierUrl, '_blank');
  },

  // Kurs sahipliğini kontrol et ve UI'ı güncelle
  async checkCourseOwnership(courseId) {
    const purchaseContainer = document.getElementById('purchase-action-container');
    if (!purchaseContainer) return;

    let isUIRendered = false;

    // 1. Hızlı gösterim için localStorage kontrolü
    const cachedOwned = JSON.parse(localStorage.getItem('derecelab_purchased')) || [];
    if (cachedOwned.includes(courseId) || cachedOwned.includes('course_4')) {
        this.renderOwnedState(purchaseContainer);
        isUIRendered = true;
    }

    // 2. Firebase'den doğrula ve güncelle
    auth.onAuthStateChanged(async (user) => {
      if (user) {
        const profile = await this.getUserProfile(user.uid);
        const ownedCourses = profile?.purchasedCourses || [];
        
        // LocalStorage'ı sessizce güncelle
        localStorage.setItem('derecelab_purchased', JSON.stringify(ownedCourses));
        
        const isOwned = ownedCourses.includes(courseId) || ownedCourses.includes('course_4');

        if (isOwned) {
          // Eğer zaten cache'den render edildiyse tekrar render etme (titremeyi önler)
          if (!isUIRendered) {
            this.renderOwnedState(purchaseContainer);
            isUIRendered = true;
          }
        } else {
          // Eğer cache hatalıysa veya kullanıcı sahip değilse orijinal butonu göster
          purchaseContainer.style.opacity = '1';
          isUIRendered = true;
        }
      } else {
        // Giriş yapılmamışsa butonu göster
        purchaseContainer.style.opacity = '1';
        isUIRendered = true;
      }
    });
  },

  renderOwnedState(container) {
    // Sadece eğer zaten owned state'de değilse içeriği değiştir
    if (container.querySelector('.bg-green-50')) {
        container.style.opacity = '1';
        return;
    }

    container.style.opacity = '0';
    container.innerHTML = `
      <div class="bg-green-50 border border-green-200 rounded-xl p-6 text-center shadow-sm animate-fade-in">
        <div class="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span class="material-symbols-outlined text-green-600 text-2xl">verified</span>
        </div>
        <h3 class="text-green-800 font-extrabold text-lg mb-1">Bu kursa zaten sahipsin</h3>
        <p class="text-green-700/70 text-xs mb-4">Harika! Bu içerik kütüphanende erişime açık.</p>
        <a href="${this.BASE_URL}/panel/" class="inline-flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg font-black text-sm hover:bg-green-700 transition-all shadow-md shadow-green-100">
          <span class="material-symbols-outlined text-base">dashboard</span>
          Kurslarıma Git
        </a>
      </div>
    `;
    setTimeout(() => { container.style.opacity = '1'; }, 50);
  }
});

// Otomatik sahiplik kontrolü (Eğer sayfada data-check-ownership varsa)
document.addEventListener('DOMContentLoaded', () => {
    const el = document.querySelector('[data-course-id]');
    if (el && el.hasAttribute('data-check-ownership')) {
        const cid = el.getAttribute('data-course-id');
        DereceLab.Auth.checkCourseOwnership(cid);
    }
});

// Sayfa yüklendiğinde auth'u HEMEN başlat (DOMContentLoaded bekleme)
DereceLab.Auth.init();
