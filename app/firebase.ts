import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyDBOmdxfRixu9DGdCEf4HD2DCxbHX2LNNU",
  authDomain: "finding-service-auth.firebaseapp.com",
  projectId: "finding-service-auth",
  storageBucket: "finding-service-auth.appspot.com",
  messagingSenderId: "404280706761",
  appId: "1:404280706761:web:8c808b583447b133832f18"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { auth, db, storage };