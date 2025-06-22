// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAaIZLCUMWdOAOJCi3Wzhzvkv7tYVEm3Qg",
  authDomain: "growth-app-9ef4a.firebaseapp.com",
  projectId: "growth-app-9ef4a",
  storageBucket: "growth-app-9ef4a.appspot.com",
  messagingSenderId: "566792372772",
  appId: "1:566792372772:web:a5ab4918754b4f1816ceb1",
  measurementId: "G-MKSHENGTGY"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore and get a reference to the service
const db = getFirestore(app);

// Initialize Firebase Authentication and get a reference to the service
const auth = getAuth(app);

export { db, auth }; 