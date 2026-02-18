import { registerUser } from "./auth.js";

document.getElementById("btnRegister").addEventListener("click", async () => {

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    try {
        await registerUser(email, password);
        alert("Compte créé !");
        window.location.href = "dashboard.html";
    } catch(error) {
        alert(error.message);
    }
});
