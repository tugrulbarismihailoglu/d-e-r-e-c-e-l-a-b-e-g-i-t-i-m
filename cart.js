// =====================================================
// DereceLab Cart Manager - BASTAN YARATILDI (v2)
// =====================================================

(function() {
    const Cart = {
        items: [],
        purchasedIds: [],
        STORAGE_KEY: 'derecelab_cart',

        init: function() {
            this.load();
            // Cache'den satın alınanları yükle (hızlı gösterim için)
            try {
                const cached = localStorage.getItem('derecelab_purchased');
                if (cached) this.purchasedIds = JSON.parse(cached);
            } catch(e) {}
            this.updateUI();
        },

        setPurchased: function(ids) {
            let purchased = Array.isArray(ids) ? ids.map(id => String(id)) : [];
            
            // Üçlü paket (course_4) sahipliği durumunda alt kursları da sahiplenmiş sayalım
            if (purchased.includes('course_4')) {
                const subCourses = ['course_1', 'course_2', 'course_3'];
                subCourses.forEach(id => {
                    if (!purchased.includes(id)) purchased.push(id);
                });
            }
            
            this.purchasedIds = purchased;
            // Cache'e kaydet
            localStorage.setItem('derecelab_purchased', JSON.stringify(this.purchasedIds));
            this.updateUI();
        },

        clear: function() {
            this.items = [];
            this.save();
        },

                load: function() {
            try {
                const data = localStorage.getItem(this.STORAGE_KEY);
                if (data) {
                    let parsed = JSON.parse(data);
                    if (!Array.isArray(parsed)) parsed = [];
                    // Temizlik yapalim, bozuk verileri cikaralim
                    this.items = parsed.filter(i => i && i.id && i.id !== 'undefined' && i.id !== 'null' && i.name && i.name !== 'undefined' && i.name !== '');
                    
                    // If lengths differ, it means we had corrupt data, save the clean version
                    if (this.items.length !== parsed.length) {
                        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.items));
                    }
                } else {
                    this.items = [];
                }
            } catch(e) {
                this.items = [];
                localStorage.setItem(this.STORAGE_KEY, "[]");
            }
        },

        save: function() {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.items));
            this.updateUI();
        },

        add: function(id, name, price) {
            id = String(id);
            const exists = this.items.find(i => String(i.id) === id);
            if (!exists) {
                this.items.push({ id, name, price: parseFloat(price) || 0 });
                this.save();
                this.openCart();
            }
        },

        remove: function(id) {
            id = String(id);
            this.items = this.items.filter(i => String(i.id) !== id);
            this.save();
        },

        toggle: function(id, name, price) {
            id = String(id);
            // Satın alınan ürün sepetten çıkarılamaz/eklenemez
            if (this.purchasedIds.includes(id)) return;
            
            const exists = this.items.find(i => String(i.id) === id);
            if (exists) {
                this.remove(id);
            } else {
                this.add(id, name, price);
            }
        },

        getTotal: function() {
            return this.items.reduce((sum, item) => sum + item.price, 0);
        },

        openCart: function() {
            const drawer = document.getElementById('cart-drawer');
            const overlay = document.getElementById('cart-overlay');
            if (drawer) {
                drawer.classList.remove('translate-x-full');
                drawer.classList.add('translate-x-0');
            }
            if (overlay) {
                overlay.classList.remove('opacity-0', 'pointer-events-none');
                overlay.classList.add('opacity-100');
            }
            document.body.style.overflow = 'hidden';
        },

        closeCart: function() {
            const drawer = document.getElementById('cart-drawer');
            const overlay = document.getElementById('cart-overlay');
            if (drawer) {
                drawer.classList.add('translate-x-full');
                drawer.classList.remove('translate-x-0');
            }
            if (overlay) {
                overlay.classList.add('opacity-0', 'pointer-events-none');
                overlay.classList.remove('opacity-100');
            }
            document.body.style.overflow = '';
        },

        updateUI: function() {
            // Sepet Badge
            const badges = document.querySelectorAll('#cart-badge, #cart-count');
            badges.forEach(b => b.textContent = this.items.length);

            // Container guncelleme
            const container = document.getElementById('cart-items-container') || document.getElementById('cart-list');
            const parentContent = document.getElementById('cart-drawer');
            
            if (parentContent) {
                const emptyState = document.getElementById('cart-empty-state');
                const footer = document.getElementById('cart-footer');
                
                if (this.items.length === 0) {
                    if (emptyState) {
                        emptyState.style.display = 'flex';
                        emptyState.classList.remove('hidden');
                    }
                    if (container) container.classList.add('hidden');
                    if (footer) footer.classList.add('hidden');
                } else {
                    if (emptyState) {
                        emptyState.style.display = 'none';
                        emptyState.classList.add('hidden');
                    }
                    if (footer) footer.classList.remove('hidden');
                    
                    if (container) {
                        container.classList.remove('hidden');
                        container.innerHTML = ''; // Temizle
                        
                        this.items.forEach(item => {
                            const div = document.createElement('div');
                            div.className = 'cart-item flex items-center gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100 mb-3';
                            div.innerHTML = `
                                <div class="flex-1">
                                    <h4 class="font-bold text-gray-900 text-sm">${item.name}</h4>
                                    <p class="text-orange-600 font-bold text-sm mt-1">₺${item.price.toLocaleString('tr-TR', {minimumFractionDigits: 2})}</p>
                                </div>
                                <button class="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" onclick="DereceLab.Cart.remove('${item.id}')">
                                    <span class="material-symbols-outlined text-xl">delete</span>
                                </button>
                            `;
                            container.appendChild(div);
                        });
                    }
                    
                    const totalEl = document.getElementById('cart-total');
                    if (totalEl) {
                        totalEl.textContent = `₺${this.getTotal().toLocaleString('tr-TR', {minimumFractionDigits: 2})}`;
                    }
                }
            }

            // Sayfadaki butonlari guncelle
            const buttons = document.querySelectorAll('.add-to-cart-btn');
            buttons.forEach(btn => {
                const rawId = btn.getAttribute('data-id') || btn.getAttribute('data-product-id');
                let id = rawId;
                if (!id) {
                    const oc = btn.getAttribute('onclick');
                    if (oc && (oc.includes("toggle('"))) {
                        // Extract from onclick string reliably
                        const match = oc.match(/'([^']+)'/);
                        if (match) id = match[1];
                    }
                }
                if (!id) return;

                const exists = this.items.find(i => String(i.id) === String(id));
                const isPurchased = this.purchasedIds.includes(String(id));
                
                const isFlex1 = btn.classList.contains('flex-1');
                const isWFull = btn.classList.contains('w-full');
                
                let baseClasses = ['add-to-cart-btn', 'rounded-lg', 'font-bold', 'transition-all', 'flex', 'items-center', 'justify-center', 'gap-2'];
                if (isFlex1) {
                    baseClasses.push('flex-1', 'py-2', 'text-xs', 'shadow-sm');
                } else if (isWFull) {
                    baseClasses.push('w-full', 'py-3', 'text-sm', 'shadow-md', 'mt-auto');
                } else {
                    baseClasses.push('w-full', 'py-2', 'text-xs');
                }

                btn.className = baseClasses.join(' ');

                if (isPurchased) {
                    btn.innerHTML = `<div class="flex flex-col items-center gap-1">
                        <div class="flex items-center gap-1.5">
                            <span class="material-symbols-outlined text-base">check_circle</span>
                            <span class="btn-text">Zaten bu kursa sahipsin</span>
                        </div>
                        <a href="${window.DereceLab.Auth.BASE_URL || ''}/panel/" class="text-inherit font-black underline hover:text-green-900 transition-colors">Kurslarıma git</a>
                    </div>`;
                    btn.classList.add('bg-green-100', 'text-green-700', 'border-2', 'border-green-200', 'cursor-default', 'py-3');
                    btn.classList.remove('bg-orange-600', 'text-white', 'hover:bg-orange-700', 'bg-white', 'text-orange-600', 'border-orange-600');
                    btn.onclick = null; 
                    // Linke tıklanmasını engelleme (butonun kendisi de gitmesin diye)
                    const link = btn.querySelector('a');
                    if (link) {
                        link.onclick = (e) => {
                            e.stopPropagation();
                        };
                    }
                } else if (exists) {
                    btn.innerHTML = `<span class="material-symbols-outlined text-base">check_circle</span> <span class="btn-text">Sepete Eklendi</span>`;
                    btn.classList.add('bg-white', 'text-orange-600', 'border-2', 'border-orange-600');
                    btn.classList.remove('bg-orange-600', 'text-white', 'hover:bg-orange-700', 'bg-green-100', 'text-green-700', 'border-green-200', 'cursor-default');
                } else {
                    btn.innerHTML = `<span class="material-symbols-outlined text-base">add_shopping_cart</span> <span class="btn-text">Sepete Ekle</span>`;
                    btn.classList.add('bg-orange-600', 'text-white', 'hover:bg-orange-700');
                    btn.classList.remove('bg-white', 'text-orange-600', 'border-2', 'border-orange-600', 'bg-green-100', 'text-green-700', 'border-green-200', 'cursor-default');
                }
            });
        }
    };

    window.DereceLab = window.DereceLab || {};
    window.DereceLab.Cart = Cart;

    window.openCart = () => Cart.openCart();
    window.closeCart = () => Cart.closeCart();
    window.toggleCartItem = (id, name, price) => Cart.toggle(id, name, price);

    document.addEventListener('DOMContentLoaded', () => Cart.init());
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        Cart.init();
    }
})();
