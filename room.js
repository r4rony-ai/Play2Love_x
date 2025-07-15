const socket = io("https://play2love-serverx-1.onrender.com");

const canvas = document.getElementById("drawCanvas"); const ctx = canvas.getContext("2d"); const colorPicker = document.getElementById("colorPicker"); const brushSize = document.getElementById("brushSize"); const chatBox = document.getElementById("chatBox"); const chatInput = document.getElementById("chatInput"); const sendBtn = document.getElementById("sendBtn"); const clearBtn = document.getElementById("clearBtn"); const partnerStatus = document.getElementById("partnerStatus");

const music = document.getElementById("bgMusic"); music.play().catch(() => {});

let drawing = false; let isPartnerJoined = false; const brush = { color: colorPicker.value, size: brushSize.value };

canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight;

const username = localStorage.getItem("username") || "User"; const room = localStorage.getItem("room") || "none";

socket.emit("joinRoom", { room, username });

socket.on("partnerJoined", ({ username }) => { isPartnerJoined = true; partnerStatus.textContent = ${username} joined!; });

// Draw canvas.addEventListener("mousedown", () => { if (isPartnerJoined) drawing = true; }); canvas.addEventListener("mouseup", () => { drawing = false; ctx.beginPath(); }); canvas.addEventListener("mouseout", () => { drawing = false; ctx.beginPath(); }); canvas.addEventListener("mousemove", (e) => { if (!drawing || !isPartnerJoined) return; const x = e.offsetX; const y = e.offsetY; ctx.lineWidth = brush.size; ctx.lineCap = "round"; ctx.strokeStyle = brush.color; ctx.lineTo(x, y); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x, y); socket.emit("drawing", { x, y, brushColor: brush.color, brushSize: brush.size }); });

socket.on("drawing", ({ x, y, brushColor, brushSize }) => { ctx.lineWidth = brushSize; ctx.strokeStyle = brushColor; ctx.lineTo(x, y); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x, y); });

// Chat sendBtn.addEventListener("click", () => { const msg = chatInput.value.trim(); if (msg && isPartnerJoined) { appendChat(You: ${msg}); socket.emit("chat", { message: msg }); chatInput.value = ""; } });

socket.on("chat", ({ username, message }) => { appendChat(${username}: ${message}); });

function appendChat(msg) { const p = document.createElement("p"); p.textContent = msg; chatBox.appendChild(p); chatBox.scrollTop = chatBox.scrollHeight; }

// Clear clearBtn.addEventListener("click", () => { ctx.clearRect(0, 0, canvas.width, canvas.height); socket.emit("clear"); });

socket.on("clear", () => { ctx.clearRect(0, 0, canvas.width, canvas.height); });

// Brush updates colorPicker.addEventListener("input", (e) => brush.color = e.target.value); brushSize.addEventListener("input", (e) => brush.size = e.target.value);

