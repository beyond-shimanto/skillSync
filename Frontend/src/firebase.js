// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getMessaging, getToken } from "firebase/messaging";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCxmZJyLrhD_Sn_Q7-hLe10DXobes5MVtg",
  authDomain: "skillsync-3113e.firebaseapp.com",
  projectId: "skillsync-3113e",
  storageBucket: "skillsync-3113e.firebasestorage.app",
  messagingSenderId: "287861887918",
  appId: "1:287861887918:web:b49ece4c76deb5b1352e3f"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const messaging = getMessaging(app);

export async function getExistingToken() {
    try {
        if (Notification.permission !== 'granted') return null

        const token = await getToken(messaging, {
            vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY
        })

        return token || null
    } catch (e) {
        return null
    }
}

export async function requestNotificationPermission(api) {
    try {
        const permission = await Notification.requestPermission()
        if (permission !== 'granted') return false

        const token = await getToken(messaging, {
            vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY
        })

        await api.post('/study-groups/save-fcm-token', { token })
        return true

    } catch (e) {
        console.log('Error getting notification permission:', e)
        return false
    }
}
