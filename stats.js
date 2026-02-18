let userName = localStorage.getItem("currentUser")
let user = JSON.parse(localStorage.getItem(userName))

document.getElementById("totalSteps").innerText = user.steps
document.getElementById("totalMoney").innerText = (user.points / 1000) + " $"
