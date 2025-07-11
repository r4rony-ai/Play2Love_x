const socket = io("https://play2love-serverx-1.onrender.com");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let username = localStorage.getItem("username") || "Partner";
let room = new URLSearchParams(window.location.search).get("room");
let color = "black";
let brush = 3;
let drawing = false;

document.getElementById("room-name").textContent = "Room: " + room;
canvas.width = window.innerWidth;
canvas.height = window.innerHeight - 60;

document.getElementById("colorPicker").onchange = e => color = e.target.value;
document.getElementById("brushSize").oninput = e => brush = e.target.value;

// Desktop
canvas.addEventListener("mousedown", () => drawing = true);
canvas.addEventListener("mouseup", () => drawing = false);
canvas.addEventListener("mousemove", draw);

// Mobile
canvas.addEventListener("touchstart", () => drawing = true);
canvas.addEventListener("touchend", () => drawing = false);
canvas.addEventListener("touchmove", drawTouch);

function draw(e) {
  if (!drawing) return;
  const x = e.clientX;
  const y = e.clientY - 60;
  drawCircle(x, y, color, brush);
  socket.emit("draw", { room, x, y, color, brush });
}

function drawTouch(e) {
  if (!drawing) return;
  const touch = e.touches[0];
  const x = touch.clientX;
  const y = touch.clientY - 60;
  drawCircle(x, y, color, brush);
  socket.emit("draw", { room, x, y, color, brush });
}

function drawCircle(x, y, color, brush) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, brush, 0, Math.PI * 2);
  ctx.fill();
}

socket.on("draw", ({ x, y, color, brush }) => drawCircle(x, y, color, brush));

socket.emit("join", { room, username });

socket.on("joined", (users) => {
  document.getElementById("status").textContent = "💑 Partner Joined!";
  updateAvatars(users);
});

socket.on("user-list", updateAvatars);

function updateAvatars(users) {
  const avatarBox = document.getElementById("avatars");
  avatarBox.innerHTML = "";
  users.forEach(name => {
    const div = document.createElement("div");
    div.className = "avatar";
    div.textContent = `😊 ${name}`;
    avatarBox.appendChild(div);
  });
}

// Mini game
let secretWord = "apple";
function startGame() {
  document.getElementById("guessBox").style.display = "block";
  socket.emit("start-game", { room, word: secretWord });
}

socket.on("start-game", () => {
  document.getElementById("guessBox").style.display = "block";
});

function submitGuess() {
  const guess = document.getElementById("guessInput").value.toLowerCase();
  document.getElementById("guessResult").textContent =
    guess === secretWord ? "✅ Correct!" : "❌ Try Again!";
}
