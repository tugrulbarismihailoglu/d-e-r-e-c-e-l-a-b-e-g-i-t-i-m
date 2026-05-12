const admin = require('firebase-admin');

// Firebase Admin'i başlat
if (!admin.apps.length) {
    try {
        // Vercel Environment Variables'dan gelen JSON'u parse et
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
    } catch (e) {
        console.error("Firebase Admin başlatma hatası:", e);
    }
}

const db = admin.firestore();

// Ham gövdeyi okumak için yardımcı fonksiyon
async function getRawBody(readable) {
    const chunks = [];
    for await (const chunk of readable) {
        chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
    }
    return Buffer.concat(chunks).toString('utf8');
}

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    try {
        // Ham veriyi oku
        const rawBody = await getRawBody(req);
        console.log("[Shopier] Ham Body:", rawBody);

        // Form verisi mi yoksa JSON mı?
        let data = {};
        try {
            if (rawBody.startsWith('{')) {
                data = JSON.parse(rawBody);
            } else {
                // query string gibi parse et
                const params = new URLSearchParams(rawBody);
                data = Object.fromEntries(params.entries());
            }
        } catch (e) {
            console.log("[Shopier] Parse Hatası:", e.message);
        }

        console.log("[Shopier] İşlenen Veri:", JSON.stringify(data));

        const buyerEmail = data.buyer_email || data.email;
        const courseId = data.custom;
        const status = data.status;
        
        // Test aşamasında her zaman OK dön
        if (!buyerEmail || !courseId) {
            console.log("[Shopier] Test veya Eksik Veri Geldi.");
            return res.status(200).send("OK");
        }

        console.log(`[Shopier] İşlem Başladı: ${buyerEmail} -> ${courseId}`);

        // 1. Kullanıcıyı bul
        const userQuery = await db.collection('users').where('email', '==', buyerEmail).get();

        if (userQuery.empty) {
            console.error("[Shopier] Kullanıcı veritabanında bulunamadı:", buyerEmail);
            // Shopier'e 200 dönüyoruz ki tekrar tekrar denemesin, ama biz logladık.
            return res.status(200).send("Kullanıcı bulunamadı");
        }

        const userDoc = userQuery.docs[0];
        const uid = userDoc.id;
        const userData = userDoc.data();
        
        // 2. Kurs tanımlama
        let purchasedCourses = userData.purchasedCourses || [];
        
        if (!purchasedCourses.includes(courseId)) {
            purchasedCourses.push(courseId);
            
            // Üçlü paket mantığı
            if (courseId === 'course_4') {
                ['course_1', 'course_2', 'course_3'].forEach(id => {
                    if (!purchasedCourses.includes(id)) purchasedCourses.push(id);
                });
            }

            await db.collection('users').doc(uid).update({
                purchasedCourses: purchasedCourses,
                lastPurchaseDate: admin.firestore.FieldValue.serverTimestamp()
            });

            console.log(`[Shopier] BAŞARILI: ${buyerEmail} kullanıcısına ${courseId} tanımlandı.`);
        } else {
            console.log(`[Shopier] Atlandı: ${buyerEmail} zaten bu kursa sahip.`);
        }

        // Shopier'e OK dön
        res.status(200).send("OK");

    } catch (error) {
        console.error("[Shopier] Sunucu Hatası:", error);
        res.status(500).send("Internal Server Error");
    }
};
