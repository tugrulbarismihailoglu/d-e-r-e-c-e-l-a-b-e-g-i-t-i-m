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
        console.warn('[Shopier] ⚠️ Hash uyuşmadı! İstek reddedildi.');
        return res.status(200).send('success');
    }

    console.log('[Shopier] ✅ Hash doğrulama başarılı.');

    let data;
    try {
        data = JSON.parse(Buffer.from(resData, 'base64').toString('utf8'));
    } catch (e) {
        console.error('[Shopier] Base64/JSON çözme hatası', e);
        return res.status(200).send('success');
    }

    const email   = data.email?.toLowerCase().trim();
    const orderId = data.orderid?.toString() || `${email}_${Date.now()}`;

    console.log(`[Shopier] Sipariş: ${orderId} | Email: ${email} | isTest: ${data.istest}`);
    console.log(`[Shopier] Ham veri: productid=${data.productid}, productcount=${data.productcount}, productlist=`, data.productlist);

    if (!email) {
        return res.status(200).send('success');
    }

    // ---------------------------------------------------------------
    // Sepetteki TÜM ürünleri topla:
    // Shopier hem tekli (productid) hem çoklu (productlist) durumları için
    // farklı alanlar gönderebilir.
    // ---------------------------------------------------------------
    const courseIds = new Set();

    // 1) productlist: [{productid: "...", ...}, ...] şeklinde dizi gelebilir
    if (Array.isArray(data.productlist) && data.productlist.length > 0) {
        for (const item of data.productlist) {
            const pid = item.productid?.toString();
            if (pid && PRODUCT_MAPPING[pid]) {
                courseIds.add(PRODUCT_MAPPING[pid]);
            }
        }
    }

    // 2) productlist string ise (virgülle ayrılmış ID'ler) parse et
    if (typeof data.productlist === 'string' && data.productlist.trim()) {
        for (const pid of data.productlist.split(',')) {
            const trimmed = pid.trim();
            if (trimmed && PRODUCT_MAPPING[trimmed]) {
                courseIds.add(PRODUCT_MAPPING[trimmed]);
            }
        }
    }

    // 3) Tekli satın alım: sadece productid varsa
    if (courseIds.size === 0 && data.productid) {
        const pid      = data.productid.toString();
        const courseId = data.custom || PRODUCT_MAPPING[pid];
        if (courseId) courseIds.add(courseId);
    }

    // 4) Hiçbir eşleşme yoksa fallback
    if (courseIds.size === 0) {
        console.warn('[Shopier] ⚠️ Hiçbir kurs eşleşmedi! Fallback: course_1');
        courseIds.add('course_1');
    }

    const courseList = [...courseIds];
    console.log(`[Shopier] Atanacak kurslar: ${courseList.join(', ')}`);

    try {
        const snapshot = await db.collection('users').where('email', '==', email).get();

        if (!snapshot.empty) {
            const targetDoc       = snapshot.docs.find(d => d.id.length > 25) || snapshot.docs[0];
            const userData        = targetDoc.data();
            const existing        = userData.purchasedCourses  || [];
            const processedOrders = userData.processedOrders   || [];

            if (processedOrders.includes(orderId)) {
                console.log(`[Shopier] Sipariş ${orderId} zaten işlenmiş, atlanıyor.`);
                return res.status(200).send('success');
            }

            // Yeni kursları mevcut listeye ekle (tekrar yok)
            const newCourses = [...new Set([...existing, ...courseList])];

            const updateData = {
                processedOrders:  [...processedOrders, orderId],
                purchasedCourses: newCourses,
                lastPurchase:     admin.firestore.FieldValue.serverTimestamp()
            };
            await targetDoc.ref.update(updateData);
            console.log(`[Shopier] ✅ Kullanıcı güncellendi: ${email} → kurslar: ${newCourses.join(', ')}`);
        } else {
            await db.collection('users').doc(email).set({
                email,
                purchasedCourses: courseList,
                processedOrders:  [orderId],
                createdAt:        admin.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
            console.log(`[Shopier] ✅ Yeni kullanıcı oluşturuldu: ${email} → kurslar: ${courseList.join(', ')}`);
        }
    } catch (dbError) {
        console.error('[Shopier] DB Hatası:', dbError);
    }

    return res.status(200).send('success');
}
