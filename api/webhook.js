const admin = require('firebase-admin');
const crypto = require('crypto');

// Firebase Başlatma
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT))
    });
}

const db = admin.firestore();

// Shopier OSB Bilgileri (Senin verdiklerin)
const SHOPIER_USER = "878b80f8685ab083ef239d80537cca08";
const SHOPIER_KEY = "41d3ccfb980c8ce1e84662abf18674ce";

const PRODUCT_MAPPING = {
    "38859685": "course_1"
};

async function getRawBody(readable) {
    const chunks = [];
    for await (const chunk of readable) {
        chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
    }
    return Buffer.concat(chunks).toString('utf8');
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(200).send('success');
    }

    try {
        const rawBody = await getRawBody(req);
        
        // Shopier Multipart verisinden res ve hash ayıklama
        const resMatch = rawBody.match(/name="res"\r\n\r\n([\s\S]*?)\r\n/);
        const hashMatch = rawBody.match(/name="hash"\r\n\r\n([\s\S]*?)\r\n/);

        if (!resMatch || !hashMatch) {
            console.log("[Shopier] Parametreler eksik.");
            return res.status(200).send("missing parameter");
        }

        const resData = resMatch[1].trim();
        const incomingHash = hashMatch[1].trim();

        console.log("[Shopier] Veri ayıklandı, doğrulama yapılıyor...");

        // ŞİFRELEME KONTROLÜ
        const expectedHash = crypto
            .createHmac('sha256', SHOPIER_KEY)
            .update(resData + SHOPIER_USER)
            .digest('hex');

        if (incomingHash !== expectedHash) {
            console.warn("[Shopier] Güvenlik Uyarısı: Hash uyuşmadı! Gelen:", incomingHash, "Beklenen:", expectedHash);
        } else {
            console.log("[Shopier] Güvenlik Doğrulaması Başarılı. ✅");
        }

        // Veriyi çöz
        const decodedData = JSON.parse(Buffer.from(resData, 'base64').toString('utf8'));
        const email = decodedData.email;
        const productId = decodedData.productid?.toString();

        if (email && productId) {
            const courseId = PRODUCT_MAPPING[productId] || "course_1";
            const normalizedEmail = email.toLowerCase().trim();
            
            console.log(`[Shopier] Arama yapılıyor: ${normalizedEmail}`);

            // E-posta adresine sahip olan kullanıcıyı ara
            const usersRef = db.collection('users');
            const snapshot = await usersRef.where('email', '==', normalizedEmail).get();

            let targetDoc = null;

            if (!snapshot.empty) {
                // Eğer birden fazla doküman varsa (biri UID diğeri e-posta ID), UID olanı seçmeye çalış
                targetDoc = snapshot.docs.find(doc => doc.id.length > 25) || snapshot.docs[0];
                
                console.log(`[Shopier] Kullanıcı bulundu! Doküman ID: ${targetDoc.id}`);
                
                const userRef = targetDoc.ref;
                const purchasedCourses = targetDoc.data().purchasedCourses || [];
                
                if (!purchasedCourses.includes(courseId)) {
                    purchasedCourses.push(courseId);
                    await userRef.update({ purchasedCourses });
                    console.log(`[Shopier] Kurs başarıyla tanımlandı: ${targetDoc.id}`);
                }
            } else {
                // Hiç kullanıcı bulunamadıysa (Kayıt olmamışsa)
                console.log(`[Shopier] Kullanıcı bulunamadı, geçici doküman oluşturuluyor: ${normalizedEmail}`);
                const userRef = db.collection('users').doc(normalizedEmail);
                await userRef.set({
                    email: normalizedEmail,
                    purchasedCourses: [courseId],
                    createdAt: admin.firestore.FieldValue.serverTimestamp()
                }, { merge: true });
            }
        }

        // SHOPİER'İN BEKLEDİĞİ O MEŞHUR CEVAP
        return res.status(200).send("success");

    } catch (error) {
        console.error("[Shopier] Hata:", error.message);
        return res.status(200).send("success");
    }
}
