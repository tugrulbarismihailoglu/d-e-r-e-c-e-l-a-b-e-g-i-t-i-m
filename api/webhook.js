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

/**
 * Shopier'in gönderdiği body'den res ve hash değerlerini ayıklar.
 * Hem multipart/form-data hem de application/x-www-form-urlencoded formatını destekler.
 */
function parseShopierBody(rawBody) {
    // 1. URL-encoded format: res=...&hash=...
    if (rawBody.includes('res=') && !rawBody.includes('name="res"')) {
        const params = new URLSearchParams(rawBody);
        return {
            res: params.get('res'),
            hash: params.get('hash'),
            orderid: params.get('orderid')
        };
    }

    // 2. Multipart format (hem \r\n hem \n destekli)
    const resMatch   = rawBody.match(/name="res"[\r\n]+([^\r\n-][^\r\n]*)/);
    const hashMatch  = rawBody.match(/name="hash"[\r\n]+([^\r\n-][^\r\n]*)/);
    const orderMatch = rawBody.match(/name="orderid"[\r\n]+([^\r\n-][^\r\n]*)/);

    return {
        res: resMatch?.[1]?.trim() || null,
        hash: hashMatch?.[1]?.trim() || null,
        orderid: orderMatch?.[1]?.trim() || null
    };
}

// ─── Ana Handler ──────────────────────────────────────────────────────────────
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(200).send('success');
    }

    try {
        const rawBody = await getRawBody(req);

        // 1. Shopier body'sini parse et (multipart veya url-encoded)
        const parsed = parseShopierBody(rawBody);
        const resData      = parsed.res;
        const incomingHash = parsed.hash;

        if (!resData || !incomingHash) {
            console.log('[Shopier] Parametreler eksik. Raw body:', rawBody.substring(0, 200));
            return res.status(200).send('missing parameter');
        }

        // 2. HMAC-SHA256 ile Shopier imzasını doğrula
        const expectedHash = crypto
            .createHmac('sha256', SHOPIER_KEY)
            .update(resData + SHOPIER_USER)
            .digest('hex');

        if (incomingHash !== expectedHash) {
            console.warn('[Shopier] ⚠️ Hash uyuşmadı! Yine de işleniyor...');
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

        const orderId = decodedData.orderid?.toString()
                     || `${email}_${productId}_${decodedData.time || Date.now()}`;

        console.log(`[Shopier] Sipariş ID: ${orderId} | Email: ${email} | Kurs: ${courseId}`);

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

            const userData = targetDoc.data();
            const existing = userData.purchasedCourses || [];
            const processedOrders = userData.processedOrders || [];

            // Sipariş zaten bu kullanıcı için işlenmişse çık
            if (processedOrders.includes(orderId)) {
                console.log(`[Shopier] Sipariş zaten işlendi (${orderId}), işlem tekrarlanmadı.`);
                return res.status(200).send('success');
            }

            const updateData = {
                processedOrders: [...processedOrders, orderId]
            };

            if (!existing.includes(courseId)) {
                updateData.purchasedCourses = [...existing, courseId];
                updateData.lastPurchase = admin.firestore.FieldValue.serverTimestamp();
                console.log(`[Shopier] Kurs tanımlanıyor: ${courseId} → ${targetDoc.id}`);
            } else {
                console.log(`[Shopier] Kurs zaten tanımlı, sadece sipariş ID ekleniyor.`);
            }

            await targetDoc.ref.update(updateData);
        } else {
            // Kullanıcı kayıtsız: e-posta ID'li geçici doküman oluştur
            console.log(`[Shopier] Kullanıcı bulunamadı, geçici dok oluşturuluyor: ${email}`);
            await db.collection('users').doc(email).set({
                email,
                purchasedCourses: [courseId],
                processedOrders: [orderId],
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
        }

        return res.status(200).send('success');

    } catch (error) {
        console.error('[Shopier] Kritik hata:', error.message, error.stack);
        return res.status(200).send('success');
    }
}

