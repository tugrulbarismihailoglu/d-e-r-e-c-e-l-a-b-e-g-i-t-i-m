const admin = require('firebase-admin');
const crypto = require('crypto');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT))
    });
}

const db = admin.firestore();

// Ürün ID -> Kurs ID Eşleşmesi
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
    console.log("[Shopier] İstek geldi, metod:", req.method);

    if (req.method !== 'POST') {
        return res.status(200).send('OK');
    }

    try {
        const rawBody = await getRawBody(req);
        console.log("[Shopier] Ham Veri:", rawBody);

        const resMatch = rawBody.match(/name="res"\r\n\r\n([\s\S]*?)\r\n/);
        const hashMatch = rawBody.match(/name="hash"\r\n\r\n([\s\S]*?)\r\n/);

        if (!resMatch || !hashMatch) {
            console.log("[Shopier] Res veya Hash bulunamadı.");
            return res.status(200).send("OK");
        }

        const resData = resMatch[1].trim();
        const incomingHash = hashMatch[1].trim();

        // Gelen veriyi çöz
        const decodedData = JSON.parse(Buffer.from(resData, 'base64').toString('utf8'));
        const email = decodedData.email;
        const productId = decodedData.productid?.toString();

        console.log(`[Shopier] Çözülen Veri: ${email} - Ürün: ${productId}`);

        if (email && productId) {
            const courseId = PRODUCT_MAPPING[productId] || "course_1";
            const userRef = db.collection('users').doc(email);
            const userDoc = await userRef.get();

            if (userDoc.exists) {
                const purchasedCourses = userDoc.data().purchasedCourses || [];
                if (!purchasedCourses.includes(courseId)) {
                    purchasedCourses.push(courseId);
                    await userRef.update({ purchasedCourses });
                    console.log("[Shopier] Kurs eklendi.");
                }
            } else {
                await userRef.set({
                    email: email,
                    purchasedCourses: [courseId],
                    createdAt: admin.firestore.FieldValue.serverTimestamp()
                });
                console.log("[Shopier] Yeni kullanıcı ve kurs oluşturuldu.");
            }
        }

        return res.status(200).send("OK");

    } catch (error) {
        console.error("[Shopier] HATA:", error.message);
        return res.status(200).send("OK");
    }
}
