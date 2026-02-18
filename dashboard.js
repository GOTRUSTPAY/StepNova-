import { db } from "./firebase.js";
import { doc, getDoc, collection, addDoc, updateDoc, query, where, orderBy, getDocs, onSnapshot, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

let uid = localStorage.getItem("currentUser");
let steps = 0;
let isTracking = false;
let lastAcc = 0;
let sessionStart;
let lastStepTime = 0;
const minStepInterval = 300;
const stepThreshold = 12;
const maxStepAcc = 30;

const ctx = document.getElementById('historyChart').getContext('2d');
const historyChart = new Chart(ctx,{
    type:'line',
    data:{ labels: [], datasets:[{ label:'Gains ($)', data:[], borderColor:'rgba(75,192,192,1)', backgroundColor:'rgba(75,192,192,0.2)', fill:true, tension:0.3 }] },
    options:{ responsive:true, animation:{duration:200}, plugins:{legend:{display:true}}, scales:{y:{beginAtZero:true}} }
});

async function loadProfile(){
    if(!uid) return;
    const userRef = doc(db,"users",uid);
    const snap = await getDoc(userRef);
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

function updateBadges(totalSteps){
    const badgesEl = document.getElementById("badges");
    badgesEl.innerHTML="";
    if(totalSteps>=100) badgesEl.innerHTML+='<img src="badge1.png">';
    if(totalSteps>=1000) badgesEl.innerHTML+='<img src="badge2.png">';
    if(totalSteps>=10000) badgesEl.innerHTML+='<img src="badge3.png">';
}

function updateUI(){
    document.getElementById("steps").innerText = steps;
    let distance = steps*0.75/1000;
    document.getElementById("distance").innerText = distance.toFixed(2);
    let gains = (steps/1000)*0.01;
    document.getElementById("gains").innerText = gains.toFixed(4);
    document.getElementById("points").innerText = (steps*0.01).toFixed(2);

    const now = new Date().toLocaleTimeString();
    historyChart.data.labels.push(now);
    historyChart.data.datasets[0].data.push(gains.toFixed(4));
    if(historyChart.data.labels.length>20){
        historyChart.data.labels.shift();
        historyChart.data.datasets[0].data.shift();
    }
    historyChart.update();

    addActivity(`Utilisateur a fait un pas. Total: ${steps}`);
}

async function addActivity(message){
    const ul = document.getElementById("activityList");
    const li = document.createElement("li");
    li.innerText = message;
    ul.prepend(li);
    if(ul.children.length>10) ul.removeChild(ul.lastChild);

    await addDoc(collection(db,"activities"),{
        message,
        userId: uid,
        username: "Utilisateur",
        createdAt: serverTimestamp()
    });
}

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

window.stopTracking = async function(){
    if(!isTracking) return;
    isTracking=false;
    window.removeEventListener("devicemotion", handleMotion);
    document.getElementById("status").innerText="Stop";
    addActivity("Suivi arrêté");

    const userRef = doc(db,"users",uid);
    const snap = await getDoc(userRef);
    if(!snap.exists()) return;
    const data = snap.data();
    let distance = steps*0.75/1000;
    let gains = (steps/1000)*0.01;

    await addDoc(collection(db,"sessions"),{
        userId: uid, steps, distance, gains, start: sessionStart, end: new Date()
    });

    await updateDoc(userRef,{
        balance: (data.balance||0)+gains,
        todaySteps: (data.todaySteps||0)+steps,
        totalSteps: (data.totalSteps||0)+steps
    });

    loadProfile();
}
