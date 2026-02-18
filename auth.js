// 🔹 Import Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, setDoc, serverTimestamp, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// 🔹 Config Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCwzUODVlb3EdiWqZ4t2X-lWg2TXyeyW4Q",
  authDomain: "stepnova-1426b.firebaseapp.com",
  projectId: "stepnova-1426b",
  storageBucket: "stepnova-1426b.appspot.com",
  messagingSenderId: "835775629094",
  appId: "1:835775629094:web:8499cbcd43466bb1e9e3e7"
};

// 🔹 Initialisation Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

/* ===================== INSCRIPTION ===================== */
export async function registerUser(email, password) {
    if(!email || !password) throw new Error("Merci de remplir tous les champs");

    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const uid = userCredential.user.uid;

    // Créer document Firestore
    await setDoc(doc(db, "users", uid), {
        username: email.split("@")[0],
        email: email,
        steps: 0,
        points: 0,
        balance: 0,
        friends: [],
        badges: [],
        role: "user",
        createdAt: serverTimestamp()
    });

    localStorage.setItem("currentUser", uid);
    return uid;
}

/* ===================== LOGIN ===================== */
export async function loginUser(email, password) {
    if(!email || !password) throw new Error("Merci de remplir tous les champs");

    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const uid = userCredential.user.uid;

    localStorage.setItem("currentUser", uid);
    return uid;
}

/* ===================== LOGOUT ===================== */
export function logoutUser() {
    localStorage.removeItem("currentUser");
    window.location.href = "login.html";
}

/* ===================== PROTECT PAGE ===================== */
export async function protectPage() {
    const uid = localStorage.getItem("currentUser");
    if(!uid) window.location.href = "login.html";

    const docRef = doc(db, "users", uid);
    const docSnap = await getDoc(docRef);
    if(docSnap.exists()) return docSnap.data();
    else return null;
}
