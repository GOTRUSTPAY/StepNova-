import { db } from "./firebase.js";
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const chatBox = document.getElementById("chatBox");
const input = document.getElementById("chatInput");

window.sendMessage = async function(){
    if(!input.value) return;
    await addDoc(collection(db,"chat"),{
        message: input.value,
        userId: localStorage.getItem("currentUser"),
        username: "Utilisateur",
        createdAt: serverTimestamp()
    });
    input.value="";
}


const q = query(collection(db,"chat"), orderBy("createdAt","asc"));
onSnapshot(q, snapshot=>{
    chatBox.innerHTML="";
    snapshot.forEach(docSnap=>{
        const data = docSnap.data();
        let div = document.createElement("div");
        div.innerText = `${data.username}: ${data.message}`;
        chatBox.appendChild(div);
        chatBox.scrollTop = chatBox.scrollHeight;
    });
});

// feed activité
const feed = document.getElementById("activityFeed");
const actQ = query(collection(db,"activities"), orderBy("createdAt","desc"));
onSnapshot(actQ, snapshot=>{
    feed.innerHTML="";
    snapshot.forEach(docSnap=>{
        const data = docSnap.data();
        const li = document.createElement("li");
        li.innerText = `${data.username}: ${data.message}`;
        feed.appendChild(li);
    });
});
