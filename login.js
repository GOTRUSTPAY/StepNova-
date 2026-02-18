// 🔹 Import Firebase
import { auth } from "./firebase.js";
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// 🔹 Fonction Connexion
window.login = async function() {
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    if(!email || !password){
        alert("Merci de remplir tous les champs");
        return;
    }

    alert("Connexion en cours..."); // message statut

    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const uid = userCredential.user.uid;

        // Stocker session locale
        localStorage.setItem("currentUser", uid);

        alert("Connexion réussie !");
        window.location.href = "dashboard.html";

    } catch(error) {
        console.error("Erreur connexion :", error);
        alert("Erreur : " + error.message);
    }
}
