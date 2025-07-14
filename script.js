const socket = io("https://play2love-serverx-1.onrender.com", {
  transports: ["websocket"]
});

const urlParams = new URLSearchParams(window.location.search);
const room = urlParams.get("room");
const name = urlParams.get("name");
const avatar = urlParams.get("avatar");

// Elements
const canvas = document.getElementById("drawCanvas");
const ctx = canvas.getContext("2d");
const chatBox = document.getElementById("chatBox");
const chatInput = document.getElementById("chatInput");
const sendBtn = document.getElementById("sendBtn");
const clearBtn = document.getElementById("clearBtn");
const undoBtn = document.getElementById("undoBtn");
const redoBtn = document.getElementById("redoBtn");
const brushSize = document.getElementById("brushSize");
const colorPicker = document.getElementById("colorPicker");
const partnerStatus = document.getElementById("partnerStatus");

// Canvas setup
canvas.width = canvas.offsetWidth;
canvas.height = 300;

let drawing = false;
let paths = [];
let undonePaths = [];
let currentPath = [];

function getMousePos(e) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (e.clientX || e.touches[0].clientX) - rect.left,
    y: (e.clientY || e.touches[0].clientY) - rect.top
  };
}

function startDraw(e) {
  drawing = true;
  currentPath = [];
  const { x, y } = getMousePos(e);
  lastX = x;
  lastY = y;
}

function draw(e) {
  if (!drawing) return;
  const { x, y } = getMousePos(e);
  ctx.strokeStyle = colorPicker.value;
  ctx.lineWidth = brushSize.value;
  ctx.lineCap = "round";

  ctx.beginPath();
  ctx.moveTo(lastX, lastY);
  ctx.lineTo(x, y);
  ctx.stroke();

  currentPath.push({
    fromX: lastX,
    fromY: lastY,
    x,
    y,
    color: ctx.strokeStyle,
    size: ctx.lineWidth,
  });

  lastX = x;
  lastY = y;
}

function stopDraw() {
  if (currentPath.length > 0) {
    paths.push(currentPath);
    socket.emit("drawing", { path: currentPath, room });
    undonePaths = [];
  }
  drawing = false;
}

// Events
canvas.addEventListener("mousedown", startDraw);
canvas.addEventListener("mousemove", draw);
canvas.addEventListener("mouseup", stopDraw);
canvas.addEventListener("mouseout", stopDraw);

canvas.addEventListener("touchstart", startDraw);
canvas.addEventListener("touchmove", draw);
canvas.addEventListener("touchend", stopDraw);

// Sync partner drawing
socket.on("drawing", ({ path }) => {
  for (const p of path) {
    ctx.strokeStyle = p.color;
    ctx.lineWidth = p.size;
    ctx.beginPath();
    ctx.moveTo(p.fromX, p.fromY);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
  }
});

// Join room
socket.emit("joinRoom", { room, username: name });

socket.on("partnerJoined", ({ username }) => {
  partnerStatus.textContent = `💑 Partner: ${username}`;
});

// Chat
sendBtn.onclick = () => {
  const message = chatInput.value.trim();
  if (!message) return;
  socket.emit("chat", { message, room });
  appendMessage(name, message);
  chatInput.value = "";
};

socket.on("chat", ({ message, username }) => {
  appendMessage(username, message);
});

function appendMessage(sender, msg) {
  const p = document.createElement("p");
  p.innerHTML = `<strong>${sender}:</strong> ${msg}`;
  chatBox.appendChild(p);
  chatBox.scrollTop = chatBox.scrollHeight;
}

// Undo/Redo
undoBtn.onclick = () => {
  if (paths.length > 0) {
    undonePaths.push(paths.pop());
    redrawCanvas();
  }
};

redoBtn.onclick = () => {
  if (undonePaths.length > 0) {
    paths.push(undonePaths.pop());
    redrawCanvas();
  }
};

function redrawCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (const path of paths) {
    for (const p of path) {
      ctx.strokeStyle = p.color;
      ctx.lineWidth = p.size;
      ctx.beginPath();
      ctx.moveTo(p.fromX, p.fromY);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
    }
  }
}

// Clear
clearBtn.onclick = () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  paths = [];
  undonePaths = [];
  socket.emit("clear", room);
};

socket.on("clear", () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
});
