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
      } catch (e) { }
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
        // Giriş yapılmamışsa listeleri temizle
        localStorage.removeItem('derecelab_user');
        this._clearCache();
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
          <button class="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-md rounded-xl text-white transition-all duration-300 shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:shadow-[0_0_25px_rgba(255,255,255,0.3)] text-[14px] font-bold group">
            <span class="relative w-7 h-7 rounded-full bg-gradient-to-br from-orange-300 to-orange-500 flex items-center justify-center text-[13px] font-black text-white shadow-inner group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 border border-white/40 overflow-hidden">
              <span class="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity"></span>
              ${initial}
            </span>
            <span class="tracking-wide">Hesabım</span>
            <span class="material-symbols-outlined text-[18px] opacity-70 group-hover:opacity-100 group-hover:translate-y-0.5 transition-all duration-300">keyboard_arrow_down</span>
          </button>
          <div class="absolute right-0 top-full pt-2 hidden group-hover:block z-50">
            <div class="w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1">
              <a href="${BASE_URL}/panel/" class="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600 font-bold">
                  <span class="material-symbols-outlined text-[18px]">school</span> Kurslarıma Git
              </a>
              <a href="${BASE_URL}/panel/#profile" class="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600 font-bold">
                  <span class="material-symbols-outlined text-[18px]">manage_accounts</span> Profil Ayarları
              </a>
              <div class="border-t border-gray-100 my-1"></div>
              <button onclick="DereceLab.Auth.signOut()" class="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 font-bold">
                  <span class="material-symbols-outlined text-[18px]">logout</span> Çıkış Yap
              </button>
            </div>
          </div>
        </div>
      `;
    } else {
      authDiv.innerHTML = `
        <a href="${BASE_URL}/giris/" class="group flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-md text-white transition-all duration-300 text-[11px] md:text-[13px] font-bold shadow-sm hover:shadow-md">
          <span class="material-symbols-outlined text-[16px] transition-transform duration-300 group-hover:-translate-x-0.5">login</span> Giriş Yap
        </a>
        <a href="${BASE_URL}/kayit/" class="group flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-br from-white to-orange-50 hover:from-white hover:to-white text-orange-600 transition-all duration-300 text-[11px] md:text-[13px] font-extrabold shadow-sm hover:shadow-[0_0_15px_rgba(255,255,255,0.4)] hover:-translate-y-0.5 overflow-hidden border border-white/50">
          <span class="material-symbols-outlined text-[16px] transition-transform duration-300 group-hover:rotate-12">person_add</span> Kayıt Ol
        </a>
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
          <a href="${BASE_URL}/panel/" class="group relative flex items-center justify-center gap-3 px-8 py-3.5 bg-gradient-to-r from-orange-500 via-orange-600 to-orange-500 bg-[length:200%_auto] hover:bg-right text-white rounded-xl font-extrabold text-[15px] transition-all duration-500 shadow-[0_0_20px_rgba(234,88,12,0.4)] hover:shadow-[0_0_30px_rgba(234,88,12,0.6)] hover:-translate-y-1 border border-orange-400/50">
            <span class="absolute -inset-1 rounded-xl bg-gradient-to-r from-orange-400 to-orange-600 opacity-20 group-hover:opacity-40 blur transition-opacity duration-500"></span>
            <div class="relative z-10 flex items-center justify-center w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 group-hover:bg-white/30 transition-colors duration-300">
              <span class="material-symbols-outlined text-[20px]">school</span>
            </div>
            <span class="relative z-10 tracking-wide drop-shadow-sm">Kurslarıma Git</span>
            <span class="relative z-10 material-symbols-outlined text-[18px] opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300">arrow_forward</span>
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
        heroTitle.innerHTML = `<span class="block">Kurslarımız ile derece yolunda</span>\n<span class="block text-orange-600">rakiplerinin önüne geç.</span>`;
        heroTitle.classList.remove('opacity-0');
      }
      if (heroButtons) {
        heroButtons.innerHTML = `
          <a href="${BASE_URL}/giris/" class="group relative flex items-center justify-center gap-2 px-8 py-3.5 bg-white text-orange-600 rounded-xl font-extrabold text-[15px] transition-all duration-500 shadow-sm hover:shadow-[0_0_20px_rgba(234,88,12,0.15)] hover:-translate-y-1 border-2 border-orange-100 hover:border-orange-300 overflow-hidden">
            <span class="absolute inset-0 bg-orange-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
            <span class="relative z-10 material-symbols-outlined text-[20px] transition-transform duration-300 group-hover:-translate-x-0.5">login</span>
            <span class="relative z-10 tracking-wide">Giriş Yap</span>
          </a>
          <a href="${BASE_URL}/kayit/" class="group relative flex items-center justify-center gap-2 px-8 py-3.5 bg-gradient-to-r from-orange-500 via-orange-600 to-orange-500 bg-[length:200%_auto] hover:bg-right text-white rounded-xl font-extrabold text-[15px] transition-all duration-500 shadow-[0_0_20px_rgba(234,88,12,0.3)] hover:shadow-[0_0_30px_rgba(234,88,12,0.5)] hover:-translate-y-1 border border-orange-400/50 overflow-hidden">
            <span class="absolute -inset-1 rounded-xl bg-gradient-to-r from-orange-400 to-orange-600 opacity-20 group-hover:opacity-40 blur transition-opacity duration-500"></span>
            <span class="relative z-10 material-symbols-outlined text-[20px] opacity-90 transition-transform duration-300 group-hover:rotate-12">person_add</span>
            <span class="relative z-10 tracking-wide drop-shadow-sm">Kayıt Ol</span>
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
      this._clearCache(); // timestamp’lu önbelleği de temizle
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

  // ─── PAYLAŞILAN SORGURU VE BELGE ÖNBELLEĞİ ──────────────────────────────────
  _userDocPromise: null,
  _fetchUid: null,

  async _getUserDocument(uid, force = false) {
    if (force || this._fetchUid !== uid || !this._userDocPromise) {
      this._fetchUid = uid;
      console.log('[Firestore] Kullanıcı dokümanı çekiliyor (1 Read)...');
      this._userDocPromise = db.collection('users').doc(uid).get().then(doc => {
        return doc.exists ? doc.data() : {};
      }).catch(err => {
        this._userDocPromise = null;
        this._fetchUid = null;
        throw err;
      });
    }
    return this._userDocPromise;
  },

  // Kullanıcı profilini Firestore'dan getir
  async getUserProfile(uid) {
    try {
      const data = await this._getUserDocument(uid);
      return Object.keys(data).length > 0 ? data : null;
    } catch (error) {
      console.error('Profil getirme hatası:', error);
      return null;
    }
  },

  // Kullanıcı profilini güncelle
  async updateUserProfile(uid, data) {
    try {
      await db.collection('users').doc(uid).update(data);
      this._userDocPromise = null; // Bellek önbelleğini temizle
      return true;
    } catch (error) {
      console.error('Profil güncelleme hatası:', error);
      return false;
    }
  },

  // ─── ÖNBELLEKLEME YARDIMCILARI ─────────────────────────────────────────────
  _CACHE_TTL_MS: 24 * 60 * 60 * 1000, // 24 saat

  /** Kullanıcıya özel önbellek anahtarını döndürür */
  _getCacheKey() {
    let uid = this.currentUser?.uid;
    if (!uid) {
      try {
        const cachedUser = localStorage.getItem('derecelab_user');
        if (cachedUser) uid = JSON.parse(cachedUser).uid;
      } catch(e) {}
    }
    return `derecelab_purchased_${uid || 'guest'}`;
  },

  /** Önbellekte taze veri var mı? */
  _isCacheFresh(maxAgeMs = null) {
    try {
      const key = this._getCacheKey();
      const raw = localStorage.getItem(key);
      if (!raw) return false;
      const { ts } = JSON.parse(raw);
      const limit = maxAgeMs !== null ? maxAgeMs : this._CACHE_TTL_MS;
      return (Date.now() - ts) < limit;
    } catch { return false; }
  },

  /** Önbellekteki kurs listesini döndürür (boş array fallback). */
  _readCache() {
    try {
      const key = this._getCacheKey();
      const raw = localStorage.getItem(key);
      if (!raw) return [];
      return JSON.parse(raw).data || [];
    } catch { return []; }
  },

  /** Kurs listesini timestamp ile önbelleğe yazar. */
  _writeCache(courses) {
    try {
      const key = this._getCacheKey();
      localStorage.setItem(key, JSON.stringify({
        ts: Date.now(),
        data: courses
      }));
    } catch (e) {
      console.warn('[Cache] localStorage yazılamadı:', e);
    }
  },

  /** Önbelleği temizler (zorla Firebase'den çekim için). */
  _clearCache() {
    const key = this._getCacheKey();
    localStorage.removeItem(key);
    this._userDocPromise = null; // Bellek önbelleğini de temizle
  },

  // ─── SATIN ALINAN KURSLARI GETİR (ÖNBELLEKLE) ───────────────────────────────
  /**
   * Kullanıcının satın aldığı kursları döndürür.
   * - Önbellekte belirtilen maxAgeMs veya 24 saatten taze veri varsa → Firebase'e gitme.
   * - Eskiyse veya yoksa → Firebase'den çek, önbelleği güncelle.
   * @param {string} uid
   * @param {boolean} [force=false] - true ise önbelleği atlayıp Firebase'den çeker.
   * @param {number|null} [maxAgeMs=null] - Özel önbellek süresi (ms)
   */
  async getPurchasedCourses(uid, force = false, maxAgeMs = null) {
    try {
      // 1. Önbellek kontrolü
      if (!force && this._isCacheFresh(maxAgeMs)) {
        console.log('[Cache] Taze önbellekten okunuyor.');
        return this._readCache();
      }

      // 2. Firebase'den çek (ortak fonksiyonu kullanarak tek sorguda birleştirir)
      console.log('[Cache] Güncel kurs verisi isteniyor...');
      const data = await this._getUserDocument(uid, force);
      const courses = data.purchasedCourses || [];

      // 3. Önbelleğe yaz
      this._writeCache(courses);
      console.log('[Cache] Önbellek güncellendi, kurs sayısı:', courses.length);

      return courses;
    } catch (error) {
      console.error('Kurs getirme hatası:', error);
      // Hata durumunda önbellekte ne varsa dön (ESKİ DE OLSA)
      return this._readCache();
    }
  },

  /**
   * Önbelleği temizler ve Firebase'den güncel kurs listesini zorla çeker.
   * Yeni kurs satın alındığında veya "Kursları Güncelle" butonuna basıldığında çağrılır.
   * @param {string} uid
   */
  async refreshPurchasedCourses(uid) {
    console.log('[Cache] Force-refresh başlatıldı...');
    this._clearCache();
    const courses = await this.getPurchasedCourses(uid, true);
    // Cart modülünü de güncelle
    if (window.DereceLab?.Cart) {
      window.DereceLab.Cart.setPurchased(courses);
    }
    return courses;
  },


  // Tamamlanan bölümleri getir
  async getCompletedParts(uid) {
    try {
      const data = await this._getUserDocument(uid, false);
      return data.completedParts || [];
    } catch (error) {
      console.error('Tamamlanan bölüm getirme hatası:', error);
      return [];
    }
  },

  // Bir bölümün tamamlanma durumunu değiştir
  async togglePartCompletion(uid, partId, isCompleted) {
    try {
      const data = await this._getUserDocument(uid, false);
      let existing = data.completedParts || [];

      let newParts;
      if (isCompleted) {
        newParts = [...new Set([...existing, partId])];
      } else {
        newParts = existing.filter(id => id !== partId);
      }

      await db.collection('users').doc(uid).update({
        completedParts: newParts
      });
      this._userDocPromise = null; // Bellek önbelleğini sıfırla ki sonraki okumada güncel gelsin
      return newParts;
    } catch (error) {
      console.error('Tamamlanma durumu güncelleme hatası:', error);
      return null;
    }
  },

  // Kurs satın alma (simülasyon)
  async purchaseCourses(uid, courseIds) {
    try {
      const data = await this._getUserDocument(uid, false);
      let existing = data.purchasedCourses || [];
      const merged = [...new Set([...existing, ...courseIds])];
      await db.collection('users').doc(uid).update({
        purchasedCourses: merged,
        lastPurchase: firebase.firestore.FieldValue.serverTimestamp()
      });
      this._userDocPromise = null; // Bellek önbelleğini sıfırla
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

    // Ödeme sayfasına yönlenirken önbelleği temizle ki geri döndüğünde yeni kursu anında çekebilsin
    this._clearCache();

    window.open(shopierBase, '_blank');
  },

  // Kurs sahipliğini kontrol et ve UI’ı güncelle
  async checkCourseOwnership(courseId) {
    const purchaseContainer = document.getElementById('purchase-action-container');
    if (!purchaseContainer) return;

    let isUIRendered = false;

    // 1. Hızlı gösterim: önbellekte taze veri varsa hemen UI’ı çiz
    if (this._isCacheFresh()) {
      const cachedOwned = this._readCache();
      if (cachedOwned.includes(courseId) || cachedOwned.includes('course_4')) {
        this.renderOwnedState(purchaseContainer);
        isUIRendered = true;
      }
    }

    // 2. Firebase’den doğrula (veya önbellek bayatsa yenile)
    auth.onAuthStateChanged(async (user) => {
      try {
        if (user) {
          // getPurchasedCourses önbelleği kendi yönetir
          const ownedCourses = await this.getPurchasedCourses(user.uid);
          const isOwned = ownedCourses.includes(courseId) || ownedCourses.includes('course_4');

          if (isOwned) {
            if (!isUIRendered) {
              this.renderOwnedState(purchaseContainer);
              isUIRendered = true;
            }
          } else {
            purchaseContainer.style.opacity = '1';
            isUIRendered = true;
          }
        } else {
          purchaseContainer.style.opacity = '1';
          isUIRendered = true;
        }
      } catch (err) {
        console.error('Ownership check error:', err);
        purchaseContainer.style.opacity = '1';
      }
    });

    // 3. Güvenlik: Eğer 3 saniye içinde hala render edilmediyse (bağlantı hatası vb.) göster
    setTimeout(() => {
      if (!isUIRendered) {
        purchaseContainer.style.opacity = '1';
      }
    }, 3000);
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

// Otomatik sahiplik kontrolü
const initOwnershipCheck = () => {
  const el = document.querySelector('[data-check-ownership]');
  if (el) {
    const cid = el.getAttribute('data-course-id');
    if (cid) DereceLab.Auth.checkCourseOwnership(cid);
  }
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initOwnershipCheck);
} else {
  initOwnershipCheck();
}

// Sayfa yüklendiğinde auth'u HEMEN başlat (DOMContentLoaded bekleme)
DereceLab.Auth.init();
