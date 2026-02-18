// dashboard.js
import { auth, db } from "./firebase.js";
import { doc, getDoc, collection, addDoc, updateDoc, query, where, orderBy, limit, onSnapshot, getDocs, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

let uid = localStorage.getItem("currentUser") || null;
let steps = 0, isTracking = false, lastAcc = 0, lastStepTime = 0;
const minStepInterval = 300; // ms
const stepThreshold = 12;
const maxStepAcc = 30;
let sessionStart = null;

// ===================== INITIALISATION UI =====================
const ctx = document.getElementById('historyChart').getContext('2d');
const historyChart = new Chart(ctx,{
    type:'line',
    data:{ labels: [], datasets:[{ label:'Gains ($)', data:[], borderColor:'rgba(75,192,192,1)', backgroundColor:'rgba(75,192,192,0.2)', fill:true, tension:0.3 }] },
    options:{ responsive:true, animation:{duration:200}, plugins:{legend:{display:true}}, scales:{y:{beginAtZero:true}} }
});

// ===================== PROFIL =====================
async function loadProfile(){
    if(!uid) return;
    const snap = await getDoc(doc(db,"users",uid));
    if(!snap.exists()) return;
    const data = snap.data();
    document.getElementById("userAvatar").src = data.avatar || 'default-avatar.png';
    document.getElementById("userId").innerText = uid;
    document.getElementById("userEmail").innerText = data.email;
    document.getElementById("totalBalance").innerText = (data.balance||0).toFixed(2);
    document.getElementById("todayBalance").innerText = (((data.todaySteps||0)/1000)*0.01).toFixed(4);
    updateBadges(data.totalSteps||0);
}
loadProfile();

window.logout = function(){
    if(!uid) return;
    auth.signOut().then(()=>{ localStorage.removeItem("currentUser"); window.location="index.html"; });
}

// ===================== BADGES =====================
function updateBadges(totalSteps){
    const badgesEl = document.getElementById("badges");
    badgesEl.innerHTML="";
    if(totalSteps>=100) badgesEl.innerHTML+='<img src="badge1.png" alt="Débutant">';
    if(totalSteps>=1000) badgesEl.innerHTML+='<img src="badge2.png" alt="Explorateur">';
    if(totalSteps>=10000) badgesEl.innerHTML+='<img src="badge3.png" alt="Pro">';
}

// ===================== ACTIVITÉS =====================
async function addActivity(message,color='green'){
    const ul = document.getElementById("activityList");
    const li = document.createElement("li");
    li.innerText = message;
    li.style.color=color;
    ul.prepend(li);
    setTimeout(()=> li.style.opacity = 1,50);
    if(ul.children.length > 20) ul.removeChild(ul.lastChild);

    try{
        let username = "Invité";
        if(uid){
            const snap = await getDoc(doc(db,"users",uid));
            if(snap.exists()) username = snap.data().username || "Utilisateur";
        }
        await addDoc(collection(db,"activities"),{ message, createdAt:serverTimestamp(), userId:uid||"guest", username });
    }catch(e){console.error("Erreur activité:",e);}
}

// ===================== FEED COMMUNAUTAIRE =====================
function listenRecentActivities(){
    const q = query(collection(db,"activities"), orderBy("createdAt","desc"), limit(20));
    onSnapshot(q,(snapshot)=>{
        const listEl = document.getElementById("recentActivities");
        listEl.innerHTML="";
        snapshot.forEach(docSnap=>{
            const data = docSnap.data();
            const timestamp = data.createdAt?.seconds ? new Date(data.createdAt.seconds*1000).toLocaleTimeString() : "";
            const li = document.createElement("li");
            li.innerHTML = `<strong>${data.username||"Invité"}</strong> [${timestamp}]: ${data.message}`;
            listEl.appendChild(li);
        });
        updateGlobalTable();
    });
}
listenRecentActivities();

// ===================== TRACKING PAS =====================
function handleMotion(event){
    const acc = event.accelerationIncludingGravity;
    if(!acc) return;
    const totalAcc = Math.sqrt(acc.x*acc.x + acc.y*acc.y + acc.z*acc.z);
    const delta = Math.abs(totalAcc-lastAcc);
    const now = Date.now();
    if(delta>maxStepAcc || delta<stepThreshold || now-lastStepTime<minStepInterval) return;
    steps++; lastStepTime=now; lastAcc=totalAcc;
    updateUI();
}

window.startTracking = function(){
    if(isTracking) return;
    steps=0; isTracking=true; sessionStart=new Date();
    document.getElementById("status").innerText="Actif";
    addActivity("Suivi démarré","blue");

    if(DeviceMotionEvent && DeviceMotionEvent.requestPermission){
        DeviceMotionEvent.requestPermission().then(resp=>{
            if(resp==='granted') window.addEventListener('devicemotion', handleMotion);
            else alert("Permission refusée");
        });
    } else window.addEventListener('devicemotion', handleMotion);
}

window.stopTracking = function(){
    if(!isTracking) return;
    isTracking=false;
    window.removeEventListener('devicemotion', handleMotion);
    document.getElementById("status").innerText="Stop";
    addActivity("Suivi arrêté","orange");
    saveSession();
}

// ===================== UI & HISTORIQUE =====================
function updateUI(){
    document.getElementById("steps").innerText=steps;
    const distance = steps*0.75/1000;
    document.getElementById("distance").innerText=distance.toFixed(2);
    const gains = (steps/1000)*0.01;
    document.getElementById("gains").innerText=gains.toFixed(4);
    document.getElementById("points").innerText=(steps*0.01).toFixed(2);

    const now = new Date().toLocaleTimeString();
    historyChart.data.labels.push(now);
    historyChart.data.datasets[0].data.push(gains.toFixed(4));
    if(historyChart.data.labels.length>20){
        historyChart.data.labels.shift();
        historyChart.data.datasets[0].data.shift();
    }
    historyChart.update();
}

// ===================== SAUVEGARDE SESSION =====================
async function saveSession(){
    if(!uid) return;
    const snap = await getDoc(doc(db,"users",uid));
    if(!snap.exists()) return;
    const data = snap.data();
    const gains = (steps/1000)*0.01;

    await addDoc(collection(db,"sessions"),{
        userId: uid,
        steps,
        distance: steps*0.75/1000,
        gains,
        start: sessionStart,
        end: new Date()
    });

    await updateDoc(doc(db,"users",uid),{
        balance: (data.balance||0)+gains,
        totalSteps: (data.totalSteps||0)+steps,
        todaySteps: (data.todaySteps||0)+steps
    });

    loadProfile();
    loadSessionsHistory();
}

// ===================== HISTORIQUE SESSIONS =====================
async function loadSessionsHistory(){
    if(!uid) return;
    const q = query(collection(db,"sessions"), where("userId","==",uid), orderBy("end","desc"));
    const snapshot = await getDocs(q);
    const el = document.getElementById("sessionHistory");
    el.innerHTML="";
    snapshot.forEach(docSnap=>{
        const d = docSnap.data();
        const start = new Date(d.start.seconds*1000).toLocaleString();
        const end = new Date(d.end.seconds*1000).toLocaleString();
        const li = document.createElement("li");
        li.innerHTML = `<strong>${start} → ${end}</strong><br>Pas: ${d.steps} | Gains: $${d.gains.toFixed(4)} | Distance: ${d.distance.toFixed(2)} km`;
        el.appendChild(li);
    });
}

// ===================== LEADERBOARD =====================
async function loadLeaderboard(){
    const q = query(collection(db,"users"), orderBy("balance","desc"), limit(5));
    const snapshot = await getDocs(q);
    const el = document.getElementById("leaderboard");
    el.innerHTML="";
    snapshot.forEach(docSnap=>{
        const data = docSnap.data();
        const li = document.createElement("li");
        li.innerText = `${data.username||docSnap.id} - $${(data.balance||0).toFixed(2)}`;
        el.appendChild(li);
    });
}
loadLeaderboard();

// ===================== CHALLENGES =====================
async function loadChallenges(){
    const snapshot = await getDocs(collection(db,"challenges"));
    const el = document.getElementById("challengesList");
    const listEl = document.getElementById("challengeList");
    el.innerHTML=""; listEl.innerHTML="";
    snapshot.forEach(docSnap=>{
        const d = docSnap.data();
        const div = document.createElement("div");
        div.classList.add("challenge-card");
        div.innerHTML = `<h4>${d.title}</h4><p>${d.description}</p><p>Récompense: $${d.reward}</p><p>Participants: ${d.participants?.length || 0}</p>`;
        el.appendChild(div);

        const li = document.createElement("li");
        li.innerText = `${d.title} - $${d.reward}`;
        listEl.appendChild(li);
    });
}
loadChallenges();

// ===================== TABLEAU SOLDE =====================
async function updateGlobalTable(){
    const snapshot = await getDocs(collection(db,"users"));
    const tbody = document.getElementById("usersTable");
    tbody.innerHTML="";
    snapshot.forEach(docSnap=>{
        const user = docSnap.data();
        const tr = document.createElement("tr");
        tr.innerHTML = `<td>${user.username||docSnap.id}</td><td>${user.email||"-"}</td><td>${user.totalSteps||0}</td><td>${(user.balance||0).toFixed(4)}</td><td>${((user.todaySteps||0)/1000*0.01).toFixed(4)}</td>`;
        tbody.appendChild(tr);
    });
}
updateGlobalTable();
