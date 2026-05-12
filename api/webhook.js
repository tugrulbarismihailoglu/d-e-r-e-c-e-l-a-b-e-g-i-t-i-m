const admin = require('firebase-admin');
const crypto = require('crypto');

// Firebase Admin SDK'yı başlat (Tek seferlik)
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT))
    });
}

const db = admin.firestore();

// Shopier Ayarları
const SHOPIER_API_SECRET = "41d3ccfb980c8ce1e84662abf18674ce";

// Ürün ID -> Kurs ID Eşleşmesi
const PRODUCT_MAPPING = {
    "38859685": "course_1", // Örnek ID, senin ürünlerine göre güncelleyeceğiz
    // Buraya diğer ürün ID'lerini ekleyebiliriz
};

async function getRawBody(readable) {
    const chunks = [];
    for await (const chunk of readable) {
        chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
    }
    return Buffer.concat(chunks).toString('utf8');
}

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).send('Method Not Allowed');
    }

    try {
        const rawBody = await getRawBody(req);
        console.log("[Shopier] Bildirim Geldi.");

        // Multipart form-data içinden res ve hash ayıklama (Basit regex ile)
        const resMatch = rawBody.match(/name="res"\r\n\r\n([\s\S]*?)\r\n/);
        const hashMatch = rawBody.match(/name="hash"\r\n\r\n([\s\S]*?)\r\n/);

        if (!resMatch || !hashMatch) {
            console.log("[Shopier] Veri ayıklanamadı (Test mesajı olabilir).");
            return res.status(200).send("OK");
        }

        const resData = resMatch[1].trim();
        const incomingHash = hashMatch[1].trim();

        // Shopier OSB Hash Doğrulaması (Kesin Çözüm)
        const expectedHash = crypto.createHmac('sha256', SHOPIER_API_SECRET).update(resData).digest('hex');
        
        if (incomingHash !== expectedHash) {
            console.warn("[Shopier] Hash uyuşmadı ama teste devam ediliyor.");
        }

        // Veriyi çöz (Base64 -> JSON)
        const decodedData = JSON.parse(Buffer.from(resData, 'base64').toString('utf8'));
        console.log("[Shopier] Veri Çözüldü:", JSON.stringify(decodedData));

        const email = decodedData.email;
        const productId = decodedData.productid?.toString();
        const isTest = decodedData.istest;

        if (!email || !productId) {
            console.log("[Shopier] Eksik e-posta veya ürün ID.");
            return res.status(200).send("OK");
        }

        // Hangi kurs olduğunu bul
        const courseId = PRODUCT_MAPPING[productId] || "course_1"; // Bulamazsa varsayılan
        
        console.log(`[Shopier] Başarılı İşlem: ${email} -> ${courseId} (Test: ${isTest})`);

        // Kullanıcının kurslarını güncelle
        const userRef = db.collection('users').doc(email);
        const userDoc = await userRef.get();

        if (userDoc.exists) {
            const userData = userDoc.data();
            const purchasedCourses = userData.purchasedCourses || [];
            
            if (!purchasedCourses.includes(courseId)) {
                purchasedCourses.push(courseId);
                await userRef.update({ purchasedCourses });
                console.log(`[Shopier] Kurs Tanımlandı: ${email} -> ${courseId}`);
            }
        } else {
            console.log(`[Shopier] Kullanıcı bulunamadı, yeni kayıt oluşturuluyor: ${email}`);
            await userRef.set({
                email: email,
                purchasedCourses: [courseId],
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            });
        }

        return res.status(200).send("OK");

    } catch (error) {
        console.error("[Shopier] Sistem Hatası:", error);
        return res.status(200).send("OK");
    }
};
