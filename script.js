const socket = io("https://play2love-serverx-1.onrender.com");

const canvas = document.getElementById("drawingCanvas");
const ctx = canvas.getContext("2d");
canvas.width = canvas.offsetWidth;
canvas.height = canvas.offsetHeight;

const colorPicker = document.getElementById("colorPicker");
const brushSize = document.getElementById("brushSize");
const messages = document.getElementById("messages");
const chatForm = document.getElementById("chatForm");
const chatInput = document.getElementById("chatInput");
const bgMusic = document.getElementById("bgMusic");

let drawing = false;
let paths = [];
let undone = [];
let currentPath = [];
let lastX = 0, lastY = 0;

const params = new URLSearchParams(window.location.search);
const room = params.get("room");
const name = params.get("name");
const avatar = params.get("avatar");

// Join room
socket.emit("join-room", { room, name, avatar });

// Show partner joined
socket.on("partner-joined", (data) => {
  document.getElementById("status").textContent = `💑 Partner: ${data.name}`;
});

// Drawing handlers
canvas.addEventListener("mousedown", (e) => {
  drawing = true;
  currentPath = [];
  const { x, y } = getXY(e);
  lastX = x;
  lastY = y;
});

canvas.addEventListener("mouseup", () => {
  drawing = false;
  if (currentPath.length > 0) {
    paths.push(currentPath);
    socket.emit("draw", { room, path: currentPath });
    undone = [];
  }
});

canvas.addEventListener("mousemove", (e) => {
  if (!drawing) return;
  const { x, y } = getXY(e);
  const color = colorPicker.value;
  const size = brushSize.value;

  ctx.strokeStyle = color;
  ctx.lineWidth = size;
  ctx.lineCap = "round";

  ctx.beginPath();
  ctx.moveTo(lastX, lastY);
  ctx.lineTo(x, y);
  ctx.stroke();

  currentPath.push({ x, y, fromX: lastX, fromY: lastY, color, size });
  lastX = x;
  lastY = y;
});

function getXY(e) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top
  };
}

// Receive drawing from partner
socket.on("draw", ({ path }) => {
  for (const p of path) {
    ctx.strokeStyle = p.color;
    ctx.lineWidth = p.size;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(p.fromX, p.fromY);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
  }
});

// Clear drawing
function clearCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  paths = [];
  undone = [];
  socket.emit("clear", room);
}

socket.on("clear", () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
});

// Undo/Redo
function undo() {
  if (paths.length > 0) {
    undone.push(paths.pop());
    redrawAll();
  }
}

function redo() {
  if (undone.length > 0) {
    paths.push(undone.pop());
    redrawAll();
  }
}

function redrawAll() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (const path of paths) {
    for (const p of path) {
      ctx.strokeStyle = p.color;
      ctx.lineWidth = p.size;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(p.fromX, p.fromY);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
    }
  }
}

// Chat
chatForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const msg = chatInput.value.trim();
  if (!msg) return;
  socket.emit("chat", { room, name, text: msg });
  chatInput.value = "";
});

socket.on("chat", ({ name, text }) => {
  const div = document.createElement("div");
  div.innerHTML = `<b>${name}:</b> ${text}`;
  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
});

// Music control
function toggleMusic() {
  if (bgMusic.paused) {
    bgMusic.play();
    document.getElementById("playMusicBtn").textContent = "⏸ Pause Music";
  } else {
    bgMusic.pause();
    document.getElementById("playMusicBtn").textContent = "🎵 Play Music";
  }
    }
