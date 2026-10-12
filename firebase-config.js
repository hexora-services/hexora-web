// HEXORA-ის ახალი, ცალკე Firebase პროექტის PUBLIC Web App config.
// Firebase Console → Project settings → Your apps → Web app → Config.
// ეს მნიშვნელობები კონფიდენციალური გასაღებები არ არის, მაგრამ Firestore Rules აუცილებელია.
export const firebaseConfig = {
  apiKey: "PASTE_FIREBASE_API_KEY",
  authDomain: "PASTE_PROJECT_ID.firebaseapp.com",
  projectId: "PASTE_PROJECT_ID",
  storageBucket: "PASTE_PROJECT_ID.firebasestorage.app",
  messagingSenderId: "PASTE_SENDER_ID",
  appId: "PASTE_APP_ID"
};
export const configured = Boolean(firebaseConfig.apiKey && firebaseConfig.appId &&
 !Object.values(firebaseConfig).some(x => String(x).includes('PASTE_')));
