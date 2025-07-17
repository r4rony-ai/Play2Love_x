const socket = io("https://play2love-serverx-1.onrender.com");

const canvas = document.getElementById("drawCanvas");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth * 0.9;
canvas.height = window.innerHeight * 0.45;

const roomCode = new URLSearchParams(window.location.search).get("room");
document.getElementById("roomCodeDisplay").innerText = `Room: ${roomCode}`;

let drawing = false;
let paths = [];
let undoStack = [];

const user1 = document.getElementById("user1");
const user2 = document.getElementById("user2");

let color = document.getElementById("colorPicker").value;
let brushSize = document.getElementById("brushSize").value;

document.getElementById("colorPicker").addEventListener("change", e => color = e.target.value);
document.getElementById("brushSize").addEventListener("input", e => brushSize = e.target.value);

canvas.addEventListener("mousedown", startDraw);
canvas.addEventListener("mousemove", draw);
canvas.addEventListener("mouseup", () => (drawing = false));
canvas.addEventListener("mouseout", () => (drawing = false));

canvas.addEventListener("touchstart", e => {
  const touch = e.touches[0];
  const mouseEvent = new MouseEvent("mousedown", {
    clientX: touch.clientX,
    clientY: touch.clientY
  });
  canvas.dispatchEvent(mouseEvent);
});

canvas.addEventListener("touchmove", e => {
  const touch = e.touches[0];
  const mouseEvent = new MouseEvent("mousemove", {
    clientX: touch.clientX,
    clientY: touch.clientY
  });
  canvas.dispatchEvent(mouseEvent);
});

canvas.addEventListener("touchend", () => {
  const mouseEvent = new MouseEvent("mouseup", {});
  canvas.dispatchEvent(mouseEvent);
});

function startDraw(e) {
  drawing = true;
  draw(e);
}

function draw(e) {
  if (!drawing) return;
  const x = e.clientX - canvas.getBoundingClientRect().left;
  const y = e.clientY - canvas.getBoundingClientRect().top;

  ctx.lineWidth = brushSize;
  ctx.strokeStyle = color;
  ctx.lineCap = "round";

  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + 0.1, y + 0.1); // tiny offset to prevent dotting
  ctx.stroke();

  const path = { x, y, color, brushSize };
  paths.push(path);
  socket.emit("drawing", { room: roomCode, ...path });
}

socket.on("draw", ({ x, y, color, brushSize }) => {
  ctx.lineWidth = brushSize;
  ctx.strokeStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + 0.1, y + 0.1);
  ctx.stroke();
});

document.getElementById("clearBtn").addEventListener("click", () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  socket.emit("clear", roomCode);
});

socket.on("clear", () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
});

document.getElementById("undoBtn").addEventListener("click", () => {
  if (paths.length > 0) {
    undoStack.push(paths.pop());
    redraw();
  }
});

document.getElementById("redoBtn").addEventListener("click", () => {
  if (undoStack.length > 0) {
    paths.push(undoStack.pop());
    redraw();
  }
});

function redraw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (const p of paths) {
    ctx.lineWidth = p.brushSize;
    ctx.strokeStyle = p.color;
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(p.x + 0.1, p.y + 0.1);
    ctx.stroke();
  }
}

// Chat
const chatInput = document.getElementById("chatInput");
const chatBox = document.getElementById("chatBox");

chatInput.addEventListener("keypress", e => {
  if (e.key === "Enter") {
    const msg = chatInput.value;
    if (msg.trim() !== "") {
      socket.emit("chat", { room: roomCode, message: msg });
      appendMessage(`You: ${msg}`);
      chatInput.value = "";
    }
  }
});

socket.on("chat", msg => {
  appendMessage(`Partner: ${msg}`);
});

function appendMessage(msg) {
  const div = document.createElement("div");
  div.innerText = msg;
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
}

// Music control
const music = document.getElementById("musicPlayer");
const musicToggle = document.getElementById("musicToggle");

musicToggle.addEventListener("click", () => {
  if (music.paused) {
    music.play();
    musicToggle.innerText = "🎵 Pause";
  } else {
    music.pause();
    musicToggle.innerText = "🎵 Play";
  }
});

// Room join
socket.emit("join-room", roomCode);

socket.on("user-update", users => {
  user1.innerText = users[0] || "Waiting...";
  user2.innerText = users[1] || "Waiting...";
});

socket.on("room-invalid", () => {
  alert("Invalid or non-existent room. Redirecting...");
  window.location.href = "/";
});
