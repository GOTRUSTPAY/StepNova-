let steps = 0
let points = 0

function addSteps(){

steps += 500
points += 5

document.getElementById("steps").innerText = steps
document.getElementById("points").innerText = points

}
let steps = Math.floor(Math.random()*5000)
let points = steps / 100

document.getElementById("steps").innerText = steps
document.getElementById("points").innerText = points
