import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
    apiKey: "AIzaSyAfNB4Bur4FUDo7xFNnLK1yUXcnBMGjn50",
    authDomain: "hawsni-ceafc.firebaseapp.com",
    projectId: "hawsni-ceafc",
    storageBucket: "hawsni-ceafc.firebasestorage.app",
    messagingSenderId: "165507639857",
    appId: "1:165507639857:web:6dcc7b2efcb951a96bc310",
    measurementId: "G-L3WFP4EX6N"
};

// Initialize Firebase only if it hasn't been initialized yet
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
