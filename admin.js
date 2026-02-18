import { db } from "./firebase.js";
import { doc, getDoc, collection, getDocs, updateDoc, addDoc, query, orderBy, limit, onSnapshot, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Récupérer éléments HTML
const usersTable = document.getElementById("usersTable");
const addBalanceForm = document.getElementById("addBalanceForm");
const challengeForm = document.getElementById("challengeForm");
const activityFeed = document.getElementById("activityFeedAdmin");

// Charger utilisateurs
async function loadUsers(){
    const snapshot = await getDocs(collection(db,"users"));
    usersTable.innerHTML = "";
    snapshot.forEach(docSnap => {
        const data = docSnap.data();
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${data.email}</td>
            <td>$${(data.balance||0).toFixed(2)}</td>
            <td>${data.totalSteps||0}</td>
            <td>
                <button class="btnAdd" data-uid="${docSnap.id}">Ajouter</button>
                <button class="btnSubtract" data-uid="${docSnap.id}">Retirer</button>
            </td>
        `;
        usersTable.appendChild(tr);
    });

    // Ajouter événements boutons
    document.querySelectorAll(".btnAdd").forEach(btn=>{
        btn.onclick=()=>modifyBalance(btn.dataset.uid,true);
    });
    document.querySelectorAll(".btnSubtract").forEach(btn=>{
        btn.onclick=()=>modifyBalance(btn.dataset.uid,false);
    });
}

// Ajouter ou retirer solde
async function modifyBalance(userId, isAdd){
    const value = parseFloat(prompt(`Montant à ${isAdd ? 'ajouter':'retirer'}:`));
    if(isNaN(value)) return alert("Valeur invalide");
    const userRef = doc(db,"users",userId);
    const snap = await getDoc(userRef);
    if(!snap.exists()) return;
    const data = snap.data();
    const newBalance = isAdd ? (data.balance||0)+value : Math.max(0,(data.balance||0)-value);
    await updateDoc(userRef,{ balance: newBalance });
    loadUsers();
}

// Créer challenge
challengeForm?.addEventListener("submit", async e=>{
    e.preventDefault();
    const title = challengeForm.title.value.trim();
    const description = challengeForm.description.value.trim();
    const reward = parseFloat(challengeForm.reward.value);
    if(!title || !description || isNaN(reward)) return alert("Remplir tous les champs");

    await addDoc(collection(db,"challenges"),{
        title, description, reward, participants:[], createdAt: serverTimestamp()
    });

    alert("Challenge publié !");
    challengeForm.reset();
});

// Feed communautaire en temps réel
function listenActivities(){
    const q = query(collection(db,"activities"), orderBy("createdAt","desc"), limit(50));
    onSnapshot(q, snapshot=>{
        if(!activityFeed) return;
        activityFeed.innerHTML="";
        snapshot.forEach(docSnap=>{
            const data = docSnap.data();
            const time = data.createdAt?.seconds ? new Date(data.createdAt.seconds*1000).toLocaleTimeString() : "";
            const li = document.createElement("li");
            li.innerHTML = `<strong>${data.username}</strong> [${time}]: ${data.message}`;
            activityFeed.appendChild(li);
        });
    });
}

listenActivities();
loadUsers();
