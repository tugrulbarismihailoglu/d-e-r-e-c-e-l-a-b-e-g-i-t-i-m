// =====================================================
// DereceLab Firebase Configuration
// =====================================================

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCOR8_nmhEtZTfNdkh3wyhfBU2qNbhXRC0",
  authDomain: "derecelab-1477b.firebaseapp.com",
  projectId: "derecelab-1477b",
  storageBucket: "derecelab-1477b.firebasestorage.app",
  messagingSenderId: "311690135096",
  appId: "1:311690135096:web:617ee47976c8c378ac88cd",
  measurementId: "G-XNBXD1H17Q"
};

// Initialize Firebase (Kullandığımız CDN v10 compat sürümüne uygun şekilde)
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// Initialize services
const auth = firebase.auth();
const db = firebase.firestore();

// Auth language - Turkish
auth.languageCode = 'tr';

// Firestore settings
db.settings({ timestampsInSnapshots: true });

console.log('[DereceLab] Firebase initialized.');
