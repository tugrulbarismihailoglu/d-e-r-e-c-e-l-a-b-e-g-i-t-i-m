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

module.exports = async (req, res) => {
    // Sadece POST kabul et
    if (req.method !== 'POST') {
        return res.status(405).send('Method Not Allowed');
    }

    try {
        // Shopier verileri (req.body Vercel tarafından otomatik parse edilir)
        const data = req.body;
        
        // Shopier parametreleri: buyer_email, custom (kursId), status
        const buyerEmail = data.buyer_email;
        const courseId = data.custom; 
        
        if (!buyerEmail || !courseId) {
            console.log("Geçersiz veri paketi:", data);
            return res.status(400).send("Eksik veri");
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
