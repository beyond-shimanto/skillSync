importScripts('https://www.gstatic.com/firebasejs/10.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.0.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyCxmZJyLrhD_Sn_Q7-hLe10DXobes5MVtg",
  authDomain: "skillsync-3113e.firebaseapp.com",
  projectId: "skillsync-3113e",
  storageBucket: "skillsync-3113e.firebasestorage.app",
  messagingSenderId: "287861887918",
  appId: "1:287861887918:web:b49ece4c76deb5b1352e3f"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  self.registration.showNotification(payload.notification.title, {
    body: payload.notification.body,
    icon: '/icon.png'
  });
});