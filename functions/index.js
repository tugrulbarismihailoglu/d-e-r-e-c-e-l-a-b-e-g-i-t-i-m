const functions = require("firebase-functions");
const admin     = require("firebase-admin");
const crypto    = require("crypto");
const Busboy    = require("busboy");

if (!admin.apps.length) {
    admin.initializeApp();
}
const db = admin.firestore();

const SHOPIER_USER = process.env.SHOPIER_USER;
const SHOPIER_KEY  = process.env.SHOPIER_KEY;

const PRODUCT_MAPPING = {
    "47135332": "course_1",
    "47159074": "course_2",
    "47159083": "course_3",
    "47159325": "course_4"
};

exports.shopierwebhook = functions.https.onRequest((req, res) => {
    if (req.method !== 'POST') {
        return res.status(200).send('success');
    }

    const formData = {};

    // 1) Eğer JSON ya da url-encoded ise (Express otomatik parse ettiyse)
    if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body) && Object.keys(req.body).length > 0) {
        Object.assign(formData, req.body);
    } 

    // 2) Eğer multipart/form-data ise Busboy ile parse et
    if (req.headers['content-type'] && req.headers['content-type'].includes('multipart/form-data')) {
        const busboy = Busboy({ headers: req.headers });
        
        busboy.on('field', (fieldname, val) => {
            formData[fieldname] = val;
        });

        busboy.on('finish', async () => {
            await processShopier(formData, res);
        });

        if (req.rawBody) {
            busboy.end(req.rawBody);
        } else {
            req.pipe(busboy);
        }
        return;
    }

    // Multipart değilse direkt işle
    processShopier(formData, res).catch(err => {
        console.error("Hata:", err);
        res.status(200).send('success');
    });
});

async function processShopier(formData, res) {
    const resData = formData.res;
    const incomingHash = formData.hash;

    console.log('[Shopier] Gelen Veri:', { res: !!resData, hash: !!incomingHash });

    if (!resData || !incomingHash) {
        console.log('[Shopier] res veya hash eksik.');
        return res.status(200).send('success'); 
    }

    const expectedHash = crypto
        .createHmac('sha256', SHOPIER_KEY)
        .update(resData + SHOPIER_USER)
        .digest('hex');

    if (incomingHash !== expectedHash) {
        console.warn('[Shopier] ⚠️ Hash uyuşmadı! (Belki test isteği)');
    } else {
        console.log('[Shopier] ✅ Hash doğrulama başarılı.');
    }

    let data;
    try {
        data = JSON.parse(Buffer.from(resData, 'base64').toString('utf8'));
    } catch (e) {
        console.error('[Shopier] Base64/JSON çözme hatası', e);
        return res.status(200).send('success');
    }

    const email     = data.email?.toLowerCase().trim();
    const productId = data.productid?.toString();
    const courseId  = data.custom || PRODUCT_MAPPING[productId] || 'course_1';
    const orderId   = data.orderid?.toString() || `${email}_${productId}_${Date.now()}`;

    console.log(`[Shopier] Sipariş: ${orderId} | Email: ${email} | Kurs: ${courseId} | isTest: ${data.istest}`);

    if (!email) {
        return res.status(200).send('success');
    }

    try {
        const snapshot = await db.collection('users').where('email', '==', email).get();

        if (!snapshot.empty) {
            const targetDoc       = snapshot.docs.find(d => d.id.length > 25) || snapshot.docs[0];
            const userData        = targetDoc.data();
            const existing        = userData.purchasedCourses  || [];
            const processedOrders = userData.processedOrders   || [];

            if (processedOrders.includes(orderId)) {
                return res.status(200).send('success');
            }

            const updateData = { processedOrders: [...processedOrders, orderId] };
            if (!existing.includes(courseId)) {
                updateData.purchasedCourses = [...existing, courseId];
                updateData.lastPurchase     = admin.firestore.FieldValue.serverTimestamp();
            }
            await targetDoc.ref.update(updateData);
        } else {
            await db.collection('users').doc(email).set({
                email,
                purchasedCourses: [courseId],
                processedOrders:  [orderId],
                createdAt:        admin.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
        }
    } catch (dbError) {
        console.error('[Shopier] DB Hatası:', dbError);
    }

    return res.status(200).send('success');
}
