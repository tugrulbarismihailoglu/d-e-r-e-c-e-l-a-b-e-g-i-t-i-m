/**
 * DereceLab Cart Helper (Legacy - Shopping cart system removed)
 * Now primarily used to track purchased courses for UI state.
 */

window.DereceLab = window.DereceLab || {};

window.DereceLab.Cart = {
    purchasedCourses: JSON.parse(localStorage.getItem('derecelab_purchased')) || [],

    init() {
        // No-op: Cart UI is removed
    },

    setPurchased(ids) {
        this.purchasedCourses = ids;
        localStorage.setItem('derecelab_purchased', JSON.stringify(ids));
        this.updateButtons();
    },

    updateButtons() {
        // Update any "Kursu Görüntüle" or "Hemen Satın Al" buttons if course is already owned
        const ownedIds = this.purchasedCourses;
        
        // In the new flow, if a user owns a course, we might want to change "Hemen Satın Al" 
        // to "Kursu İzle" or similar, but the panel handles the main library.
        // For now, we just ensure no "Sepete Ekle" remnants are trying to sync.
    },

    // Legacy methods kept as no-ops to prevent JS errors if called
    toggle() { console.log('Cart system is disabled.'); },
    openCart() { console.log('Cart system is disabled.'); },
    closeCart() { console.log('Cart system is disabled.'); },
    checkout() { console.log('Cart system is disabled.'); }
};

// Auto-init
window.DereceLab.Cart.init();
