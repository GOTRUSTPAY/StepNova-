import { db } from "./firebase.js";
import { doc, getDoc, collection, addDoc, updateDoc, serverTimestamp, query, orderBy, limit, onSnapshot } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

let uid = localStorage.getItem("currentUser");
let steps = 0;
let isTracking = false;
let lastAcc = 0;
let lastStepTime = 0;
const minStepInterval = 500;
const stepThreshold = 15;
const maxStepAcc = 30;
let sessionStart;

const ctx = document.getElementById('historyChart')?.getContext('2d');
const historyChart = ctx ? new Chart(ctx,{
    type:'line',
    data:{ labels: [], datasets:[{ label:'Gains ($)', data:[], borderColor:'rgba(75,192,192,1)', backgroundColor:'rgba(75,192,192,0.2)', fill:true, tension:0.3 }] },
    options:{ responsive:true, animation:{duration:200}, plugins:{legend:{display:true}}, scales:{y:{beginAtZero:true}} }
}) : null;

// Charger profil
async function loadProfile(){
    if(!uid) return;
    const snap = await getDoc(doc(db,"users",uid));
    if(!snap.exists()) return;
    const data = snap.data();
    document.getElementById("totalBalance").innerText = (data.balance||0).toFixed(2);
    document.getElementById("todayBalance").innerText = (((data.todaySteps||0)/1000)*0.01).toFixed(4);
}
loadProfile();

// Mettre à jour UI à chaque pas
function updateUI(){
    document.getElementById("steps").innerText = steps;
    let gains = (steps/1000)*0.01;
    document.getElementById("gains").innerText = gains.toFixed(4);

    const now = new Date().toLocaleTimeString();
    if(historyChart){
        historyChart.data.labels.push(now);
        historyChart.data.datasets[0].data.push(gains.toFixed(4));
        if(historyChart.data.labels.length>20){
            historyChart.data.labels.shift();
            historyChart.data.datasets[0].data.shift();
        }
        historyChart.update();
    }

    addActivity(`Utilisateur a fait un pas. Total: ${steps}`);
}

// Ajouter activité dans feed
async function addActivity(message){
    const ul = document.getElementById("activityList");
    if(ul){
        const li = document.createElement("li");
        li.innerText = message;
        ul.prepend(li);
        if(ul.children.length>10) ul.removeChild(ul.lastChild);
    }

    await addDoc(collection(db,"activities"),{
        message,
        userId: uid,
        username: "Utilisateur",
        createdAt: serverTimestamp()
    });
}

// Détection mouvements
function handleMotion(event){
    let acc = event.accelerationIncludingGravity;
    if(!acc) return;
    let totalAcc = Math.sqrt(acc.x*acc.x + acc.y*acc.y + acc.z*acc.z);
    let delta = Math.abs(totalAcc-lastAcc);
    let now = Date.now();
    if(delta>maxStepAcc || delta<stepThreshold || now-lastStepTime<minStepInterval) return;
    steps++; lastStepTime=now; lastAcc=totalAcc;
    updateUI();
}

// Commencer suivi
window.startTracking = function(){
    if(isTracking) return;
    steps=0; isTracking=true; sessionStart=new Date();
    document.getElementById("status").innerText="Actif";
    addActivity("Suivi démarré");

    if(DeviceMotionEvent && DeviceMotionEvent.requestPermission){
        DeviceMotionEvent.requestPermission().then(resp=>{
            if(resp==='granted') window.addEventListener('devicemotion', handleMotion);
        });
    } else window.addEventListener('devicemotion', handleMotion);
}

// Stop suivi
window.stopTracking = async function(){
    if(!isTracking) return;
    isTracking=false;
    window.removeEventListener("devicemotion", handleMotion);
    document.getElementById("status").innerText="Stop";
    addActivity("Suivi arrêté");

    const snap = await getDoc(doc(db,"users",uid));
    if(!snap.exists()) return;
    const data = snap.data();

    let gains = (steps/1000)*0.01;

    await addDoc(collection(db,"sessions"),{
        userId: uid, steps, gains, start: sessionStart, end: new Date()
    });

    await updateDoc(doc(db,"users",uid),{
        balance: (data.balance||0)+gains,
        todaySteps: (data.todaySteps||0)+steps,
        totalSteps: (data.totalSteps||0)+steps
    });

    loadProfile();
}
