import { db, auth } from "./firebase-config.js";
import { collection, addDoc, doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

let steps = 0;
let isTracking = false;
let lastAcceleration = 0;
let stepThreshold = 12;
let sessionStart = null;

window.startTracking = function() {
    if (isTracking) return;

    steps = 0;
    isTracking = true;
    sessionStart = new Date();
    document.getElementById("status").innerText = "Actif";

    if(typeof DeviceMotionEvent.requestPermission === 'function'){
        DeviceMotionEvent.requestPermission().then(response => {
            if(response === 'granted') window.addEventListener("devicemotion", handleMotion);
            else alert("Permission capteur refusée !");
        });
    } else {
        window.addEventListener("devicemotion", handleMotion);
    }
}

window.stopTracking = function() {
    if(!isTracking) return;

    isTracking = false;
    window.removeEventListener("devicemotion", handleMotion);
    document.getElementById("status").innerText = "Stop";

    saveSession();
}

function handleMotion(event){
    let acc = event.accelerationIncludingGravity;
    if(!acc) return;

    let totalAcc = Math.sqrt(acc.x*acc.x + acc.y*acc.y + acc.z*acc.z);
    let delta = Math.abs(totalAcc - lastAcceleration);

    if(delta > 40) return; // anti-triche

    if(delta > stepThreshold){
        steps++;
        updateUI();
    }

    lastAcceleration = totalAcc;
}

function updateUI(){
    document.getElementById("steps").innerText = steps;
    let distance = steps * 0.75 / 1000;
    document.getElementById("distance").innerText = distance.toFixed(2);
    let gains = (steps / 1000) * 0.01;
    document.getElementById("gains").innerText = gains.toFixed(4);
}

async function saveSession(){
    const user = auth.currentUser;
    if(!user) return;

    let sessionEnd = new Date();
    let distance = steps * 0.75 / 1000;
    let gains = (steps / 1000) * 0.01;

    await addDoc(collection(db,"sessions"),{
        userId: user.uid,
        steps: steps,
        distance: distance,
        gains: gains,
        start: sessionStart,
        end: sessionEnd
    });

    const userRef = doc(db,"users",user.uid);
    const userSnap = await getDoc(userRef);
    const data = userSnap.data();

    let newBalance = (data.balance || 0) + gains;
    let todaySteps = (data.todaySteps || 0) + steps;

    await updateDoc(userRef,{
        balance: newBalance,
        todaySteps: todaySteps
    });

    document.getElementById("totalBalance").innerText = newBalance.toFixed(2);
    document.getElementById("todayBalance").innerText = (todaySteps/1000*0.01).toFixed(4);
}
