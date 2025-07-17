const socket = io("https://play2love-serverx-1.onrender.com");

// Elements
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const colorPicker = document.getElementById("colorPicker");
const sizeSlider = document.getElementById("sizeSlider");
const eraserBtn = document.getElementById("eraserBtn");
const brushBtn = document.getElementById("brushBtn");
const clearBtn = document.getElementById("clearBtn");
const undoBtn = document.getElementById("undoBtn");
const redoBtn = document.getElementById("redoBtn");
const musicControl = document.getElementById("musicControl");
const messages = document.getElementById("messages");
const msgInput = document.getElementById("msgInput");
const sendBtn = document.getElementById("sendBtn");
const partnerStatus = document.getElementById("partnerStatus");

let painting = false;
let isEraser = false;
let roomCode = localStorage.getItem("roomCode");
let username = localStorage.getItem("username");
let partnerJoined = false;

let drawingHistory = [];
let undoneHistory = [];

const music = new Audio("assets/music.mp3");
music.loop = true;

function resizeCanvas() {
  canvas.width = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

// Drawing functions
function startDraw(e) {
  if (!partnerJoined) return;
  painting = true;
  draw(e);
}
function endDraw() {
  painting = false;
  ctx.beginPath();
  drawingHistory.push(canvas.toDataURL());
  undoneHistory = [];
}
function draw(e) {
  if (!painting || !partnerJoined) return;
  const rect = canvas.getBoundingClientRect();
  const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
  const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;

  ctx.lineWidth = sizeSlider.value;
  ctx.lineCap = "round";
  ctx.strokeStyle = isEraser ? "#ffffff" : colorPicker.value;

  ctx.lineTo(x, y);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x, y);

  socket.emit("draw", { x, y, color: ctx.strokeStyle, size: ctx.lineWidth, isEraser });
}
canvas.addEventListener("mousedown", startDraw);
canvas.addEventListener("mouseup", endDraw);
canvas.addEventListener("mousemove", draw);
canvas.addEventListener("touchstart", startDraw);
canvas.addEventListener("touchend", endDraw);
canvas.addEventListener("touchmove", draw);

// Sync drawing
socket.on("draw", ({ x, y, color, size, isEraser }) => {
  ctx.lineWidth = size;
  ctx.lineCap = "round";
  ctx.strokeStyle = isEraser ? "#ffffff" : color;
  ctx.lineTo(x, y);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x, y);
});

// Clear, Undo, Redo
clearBtn.onclick = () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawingHistory.push(canvas.toDataURL());
  undoneHistory = [];
  socket.emit("clear");
};
undoBtn.onclick = () => {
  if (drawingHistory.length > 0) {
    undoneHistory.push(drawingHistory.pop());
    let img = new Image();
    img.onload = () => ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    img.src = drawingHistory[drawingHistory.length - 1] || "";
  }
};
redoBtn.onclick = () => {
  if (undoneHistory.length > 0) {
    let imgData = undoneHistory.pop();
    drawingHistory.push(imgData);
    let img = new Image();
    img.onload = () => ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    img.src = imgData;
  }
};
socket.on("clear", () => ctx.clearRect(0, 0, canvas.width, canvas.height));

// Brush / Eraser
eraserBtn.onclick = () => { isEraser = true; };
brushBtn.onclick = () => { isEraser = false; };

// Chat
sendBtn.onclick = () => {
  const msg = msgInput.value.trim();
  if (msg && partnerJoined) {
    socket.emit("message", { msg, username });
    addMessage(username, msg);
    msgInput.value = "";
  }
};
socket.on("message", ({ msg, username }) => addMessage(username, msg));
function addMessage(user, msg) {
  const div = document.createElement("div");
  div.textContent = `${user}: ${msg}`;
  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
}

// Music
musicControl.onclick = () => {
  if (music.paused) {
    music.play();
    musicControl.textContent = "Pause Music";
  } else {
    music.pause();
    musicControl.textContent = "Play Music";
  }
};

// Room and partner
socket.emit("join-room", roomCode, username);
socket.on("room-joined", () => {
  partnerStatus.textContent = "✅ Partner joined";
  partnerJoined = true;
});
socket.on("room-not-found", () => {
  alert("Invalid room code. Returning to home.");
  window.location.href = "index.html";
});
socket.on("waiting", () => {
  partnerStatus.textContent = "⏳ Waiting for your partner...";
});
