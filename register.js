import { loginUser } from "./auth.js";

window.login = async function() {

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    try {
        await loginUser(email, password);
        alert("Connexion réussie !");
        window.location.href = "dashboard.html";
    } catch(error) {
        alert(error.message);
    }
}
