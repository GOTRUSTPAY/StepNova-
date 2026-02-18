// ===================== FIREBASE =====================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
  getFirestore, collection, getDocs, doc, getDoc, updateDoc,
  addDoc, query, orderBy, onSnapshot, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import { firebaseConfig } from "./firebase.js"; // config partagée

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ===================== DASHBOARD ADMIN =====================
const usersTable = document.getElementById("usersTable");
const addBalanceForm = document.getElementById("addBalanceForm");
const challengeForm = document.getElementById("challengeForm");

// ===================== CHARGER LES UTILISATEURS =====================
async function loadUsers() {
    const snapshot = await getDocs(collection(db,"users"));
    usersTable.innerHTML = "";
    snapshot.forEach(docSnap => {
        const data = docSnap.data();
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td><i class="fas fa-user"></i> ${data.username}</td>
            <td>$${(data.balance||0).toFixed(2)}</td>
            <td>${data.totalSteps||0}</td>
            <td><button class="btnAdd" data-uid="${docSnap.id}"><i class="fas fa-plus"></i> Ajouter</button>
                <button class="btnSubtract" data-uid="${docSnap.id}"><i class="fas fa-minus"></i> Retirer</button></td>
        `;
        usersTable.appendChild(tr);
    });

    // ajouter événements boutons
    document.querySelectorAll(".btnAdd").forEach(btn => {
        btn.onclick = () => modifyBalance(btn.dataset.uid,true);
    });
    document.querySelectorAll(".btnSubtract").forEach(btn => {
        btn.onclick = () => modifyBalance(btn.dataset.uid,false);
    });
}
loadUsers();

// ===================== AJOUT / RETRAIT SOLDE =====================
async function modifyBalance(userId, isAdd) {
    const value = parseFloat(prompt(`Montant à ${isAdd?'ajouter':'retirer'}:`));
    if(isNaN(value)) return alert("Valeur invalide");
    const userRef = doc(db,"users",userId);
    const snap = await getDoc(userRef);
    if(!snap.exists()) return;
    const data = snap.data();
    const newBalance = isAdd ? (data.balance||0)+value : Math.max(0,(data.balance||0)-value);
    await updateDoc(userRef,{ balance: newBalance });
    loadUsers();
}

// ===================== CREER / PUBLIER CHALLENGE =====================
challengeForm.onsubmit = async function(e) {
    e.preventDefault();
    const title = challengeForm.title.value.trim();
    const description = challengeForm.description.value.trim();
    const reward = parseFloat(challengeForm.reward.value);
    if(!title || !description || isNaN(reward)) return alert("Remplir tous les champs");

    const newChallenge = {
        title,
        description,
        reward,
        participants: [],
        createdAt: serverTimestamp()
    };
    await addDoc(collection(db,"challenges"), newChallenge);
    alert("Challenge publié !");
    challengeForm.reset();
}

// ===================== FEED COMMUNAUTAIRE =====================
function listenActivities() {
    const q = query(collection(db,"activities"), orderBy("createdAt","desc"), limit(50));
    onSnapshot(q, snapshot => {
        const feed = document.getElementById("activityFeedAdmin");
        feed.innerHTML = "";
        snapshot.forEach(docSnap => {
            const data = docSnap.data();
            const li = document.createElement("li");
            const time = data.createdAt?.seconds ? new Date(data.createdAt.seconds*1000).toLocaleTimeString() : "";
            li.innerHTML = `<i class="fas fa-walking"></i> <strong>${data.username}</strong> [${time}]: ${data.message}`;
            feed.appendChild(li);
        });
    });
}
listenActivities();

// ===================== ICÔNES & STYLE =====================
/* 
Dans style.css :
#usersTable td button { margin: 2px; padding:3px 6px; border-radius:5px; }
#usersTable td button i { margin-right:2px; }
#activityFeedAdmin { max-height:300px; overflow-y:auto; border:1px solid #00c896; padding:5px; border-radius:10px; background: rgba(0,200,150,0.05); }
*/
