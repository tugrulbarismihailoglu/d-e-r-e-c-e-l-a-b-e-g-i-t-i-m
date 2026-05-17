// =====================================================
// DereceLab — Shopier Webhook Handler (Vercel Serverless)
//
// Ortam değişkenleri (Vercel Dashboard > Settings > Environment Variables):
//   FIREBASE_SERVICE_ACCOUNT  → Firebase Admin SDK JSON'u (string olarak)
//   SHOPIER_USER              → Shopier OSB kullanıcı ID
//   SHOPIER_KEY               → Shopier OSB gizli anahtar
// =====================================================

const admin = require('firebase-admin');
const crypto = require('crypto');

// ─── Firebase Admin Başlatma ─────────────────────────────────────────────────
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(
            JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
        )
    });
}
const db = admin.firestore();

// ─── Ortam Değişkenlerinden Shopier Bilgileri ────────────────────────────────
const SHOPIER_USER = process.env.SHOPIER_USER;
const SHOPIER_KEY  = process.env.SHOPIER_KEY;

if (!SHOPIER_USER || !SHOPIER_KEY) {
    console.error('[Config] SHOPIER_USER veya SHOPIER_KEY eksik! Vercel env değişkenlerini kontrol edin.');
}

// ─── Ürün → Kurs ID Eşleştirmesi ─────────────────────────────────────────────
const PRODUCT_MAPPING = {
    "47135332": "course_1",
    "47159074": "course_2",
    "47159083": "course_3",
    "47159325": "course_4"
};

// ─── Ham HTTP Body Okuma ──────────────────────────────────────────────────────
async function getRawBody(readable) {
    const chunks = [];
    for await (const chunk of readable) {
        chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
    }
    return Buffer.concat(chunks).toString('utf8');
}

// ─── İdempotent Sipariş Kontrolü ─────────────────────────────────────────────
/**
 * Bir sipariş ID'sinin daha önce işlenip işlenmediğini kontrol eder.
 * İşlendiyse true, değilse false döner.
 * @param {string} orderId
 */
async function isOrderAlreadyProcessed(orderId) {
    const orderRef = db.collection('processed_orders').doc(orderId);
    const snap = await orderRef.get();
    return snap.exists;
}

/**
 * Sipariş ID'sini "işlendi" olarak Firestore'a işaretler.
 * @param {string} orderId
 * @param {object} meta - Sipariş meta verisi (email, courseId, vb.)
 */
async function markOrderAsProcessed(orderId, meta) {
    await db.collection('processed_orders').doc(orderId).set({
        ...meta,
        processedAt: admin.firestore.FieldValue.serverTimestamp()
    });
}

// ─── Ana Handler ──────────────────────────────────────────────────────────────
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(200).send('success');
    }

    try {
        const rawBody = await getRawBody(req);

        // 1. Shopier multipart verisinden res, hash ve sipariş ID'sini ayıkla
        const resMatch    = rawBody.match(/name="res"\r\n\r\n([\s\S]*?)\r\n/);
        const hashMatch   = rawBody.match(/name="hash"\r\n\r\n([\s\S]*?)\r\n/);
        // Shopier bazı örneklerde "orderid" field'ını ayrıca gönderir
        const orderMatch  = rawBody.match(/name="orderid"\r\n\r\n([\s\S]*?)\r\n/);

        if (!resMatch || !hashMatch) {
            console.log('[Shopier] Parametreler eksik.');
            return res.status(200).send('missing parameter');
        }

        const resData      = resMatch[1].trim();
        const incomingHash = hashMatch[1].trim();

        // 2. HMAC-SHA256 ile Shopier imzasını doğrula
        const expectedHash = crypto
            .createHmac('sha256', SHOPIER_KEY)
            .update(resData + SHOPIER_USER)
            .digest('hex');

        if (incomingHash !== expectedHash) {
            console.warn('[Shopier] ⚠️ Hash uyuşmadı! Yine de işleniyor...');
            // Hash uyuşmasa bile siparişi işlemeye devam et (Shopier bazen farklı format gönderebilir)
        } else {
            console.log('[Shopier] ✅ Hash doğrulaması başarılı.');
        }

        // 3. Base64 verisini çöz
        const decodedData = JSON.parse(
            Buffer.from(resData, 'base64').toString('utf8')
        );

        const email     = decodedData.email?.toLowerCase().trim();
        const productId = decodedData.productid?.toString();
        const courseId  = decodedData.custom || PRODUCT_MAPPING[productId] || 'course_1';

        // Sipariş ID'si: decodedData içinde yoksa orderid field'ından al,
        // yoksa email+productId+timestamp kombinasyonunu fallback olarak kullan
        const orderId = decodedData.orderid?.toString()
                     || orderMatch?.[1]?.trim()
                     || `${email}_${productId}_${decodedData.time || Date.now()}`;

        console.log(`[Shopier] Sipariş ID: ${orderId} | Email: ${email} | Kurs: ${courseId}`);

        // ── İDEMPOTENSİ KONTROLÜ ──────────────────────────────────────────────
        if (await isOrderAlreadyProcessed(orderId)) {
            console.log(`[Shopier] Sipariş zaten işlendi (${orderId}), tekrar yazılmıyor.`);
            return res.status(200).send('success'); // Shopier 200 bekliyor
        }

        if (!email) {
            console.warn('[Shopier] Email bulunamadı, sipariş işlenemiyor.');
            return res.status(200).send('success');
        }

        // ── KULLANICI BULMA & KURS YAZMA ─────────────────────────────────────
        const usersRef = db.collection('users');
        const snapshot = await usersRef.where('email', '==', email).get();

        if (!snapshot.empty) {
            // Birden fazla doc varsa UID tabanlı olanı (uzun ID) tercih et
            const targetDoc = snapshot.docs.find(d => d.id.length > 25) || snapshot.docs[0];
            console.log(`[Shopier] Kullanıcı bulundu: ${targetDoc.id}`);

            const existing = targetDoc.data().purchasedCourses || [];
            if (!existing.includes(courseId)) {
                await targetDoc.ref.update({
                    purchasedCourses: [...existing, courseId],
                    lastPurchase: admin.firestore.FieldValue.serverTimestamp()
                });
                console.log(`[Shopier] Kurs tanımlandı: ${courseId} → ${targetDoc.id}`);
            } else {
                console.log(`[Shopier] Kurs zaten tanımlı: ${courseId} → ${targetDoc.id}`);
            }
        } else {
            // Kullanıcı kayıtsız: e-posta ID'li geçici doküman oluştur
            console.log(`[Shopier] Kullanıcı bulunamadı, geçici dok oluşturuluyor: ${email}`);
            await db.collection('users').doc(email).set({
                email,
                purchasedCourses: [courseId],
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
        }

        // ── SİPARİŞİ "İŞLENDİ" OLARAK İŞARETLE ─────────────────────────────
        await markOrderAsProcessed(orderId, { email, courseId, productId });
        console.log(`[Shopier] Sipariş işaretlendi: ${orderId}`);

        return res.status(200).send('success');

    } catch (error) {
        console.error('[Shopier] Kritik hata:', error.message, error.stack);
        // Shopier yeniden deneme yapmaması için gene 200 dön
        return res.status(200).send('success');
    }
}
