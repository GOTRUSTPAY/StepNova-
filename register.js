import { registerUser } from "./auth.js";

const btn = document.getElementById("btnRegister");

btn.addEventListener("click", async () => {
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    try {
        await registerUser(email, password);
        alert("✅ Votre compte a été créé avec succès !");
        window.location.href = "dashboard.html";
    } catch(error) {
        alert("❌ Erreur : " + error.message);
        console.error(error);
    }
});
