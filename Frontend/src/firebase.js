// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
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