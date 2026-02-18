import { auth, db } from "./firebase.js";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { doc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

export async function registerUser(email, password) {

    if(!email || !password) throw new Error("Remplis tous les champs");

    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const uid = userCredential.user.uid;

    await setDoc(doc(db, "users", uid), {
        email,
        balance: 0,
        steps: 0,
        createdAt: serverTimestamp()
    });

    localStorage.setItem("currentUser", uid);
}

export async function loginUser(email, password) {

    if(!email || !password) throw new Error("Remplis tous les champs");

    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    localStorage.setItem("currentUser", userCredential.user.uid);
}
