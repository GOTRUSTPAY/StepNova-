import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCwzUODVlb3EdiWqZ4t2X-lWg2TXyeyW4Q",
  authDomain: "stepnova-1426b.firebaseapp.com",
  projectId: "stepnova-1426b",
  storageBucket: "stepnova-1426b.appspot.com",
  messagingSenderId: "835775629094",
  appId: "1:835775629094:web:8499cbcd43466bb1e9e3e7"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
