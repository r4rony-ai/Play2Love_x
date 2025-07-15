let socket; let isRoomCreator = false; let avatar = ""; let drawingAllowed = false;

function selectAvatar(type) { avatar = type; document.querySelectorAll('.avatar').forEach(a => a.classList.remove('selected')); document.getElementById(${type}Avatar).classList.add('selected'); }

function toggleMusic() { const music = document.getElementById("bgMusic"); if (music.paused) music.play(); else music.pause(); }

function createRoom() { const username = document.getElementById("username").value.trim(); const roomCode = document.getElementById("roomCode").value.trim() || Math.random().toString(36).substring(2, 7); if (!username || !avatar) return alert("Enter name and select avatar");

localStorage.setItem("room", roomCode); localStorage.setItem("username", username); localStorage.setItem("isRoomCreator", true);

window.location.href = "room.html"; }

function joinRoom() { const username = document.getElementById("username").value.trim(); const roomCode = document.getElementById("roomCode").value.trim(); if (!username || !avatar || !roomCode) return alert("Enter name, room code, and select avatar");

localStorage.setItem("room", roomCode); localStorage.setItem("username", username); localStorage.setItem("isRoomCreator", false);

window.location.href = "room.html"; }

window.addEventListener("DOMContentLoaded", () => { const canvas = document.getElementById("drawCanvas"); if (!canvas) return;

const ctx = canvas.getContext("2d"); let painting = false; let brushColor = "#ff70a6"; let brushSize = 4;

const socketURL = "https://play2love-serverx-1.onrender.com"; socket = io(socketURL, { transports: ["websocket"] });

const room = localStorage.getItem("room"); const username = localStorage.getItem("username"); isRoomCreator = localStorage.getItem("isRoomCreator") === "true";

const bgMusic = document.getElementById("bgMusic"); if (bgMusic) bgMusic.play().catch(() => {});

if (isRoomCreator) { socket.emit("createRoom", { room, username }); } else { socket.emit("joinRoom", { room, username }); }

socket.on("joinError", (msg) => { alert(msg); window.location.href = "index.html"; });

socket.on("partnerJoined", ({ username }) => { const status = document.getElementById("partnerStatus"); if (status) status.textContent = ${username} joined!; drawingAllowed = true; });

// Drawing logic canvas.addEventListener("mousedown", (e) => { if (drawingAllowed) { painting = true; draw(e); } }); canvas.addEventListener("mouseup", () => painting = false); canvas.addEventListener("mouseleave", () => painting = false); canvas.addEventListener("mousemove", draw);

function draw(e) { if (!painting || !drawingAllowed) return; const x = e.offsetX; const y = e.offsetY; ctx.lineWidth = brushSize; ctx.lineCap = "round"; ctx.strokeStyle = brushColor; ctx.lineTo(x, y); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x, y); socket.emit("drawing", { x, y, brushColor, brushSize }); }

socket.on("drawing", (data) => { ctx.lineWidth = data.brushSize; ctx.strokeStyle = data.brushColor; ctx.lineTo(data.x, data.y); ctx.stroke(); ctx.beginPath(); ctx.moveTo(data.x, data.y); });

// Color and brush size document.getElementById("colorPicker").addEventListener("input", e => brushColor = e.target.value); document.getElementById("brushSize").addEventListener("input", e => brushSize = e.target.value);

// Chat document.getElementById("sendBtn").addEventListener("click", () => { const input = document.getElementById("chatInput"); const msg = input.value.trim(); if (msg) { addMessage(You: ${msg}); socket.emit("chat", { message: msg }); input.value = ""; } });

socket.on("chat", ({ username, message }) => { addMessage(${username}: ${message}); });

function addMessage(msg) { const box = document.getElementById("chatBox"); const p = document.createElement("p"); p.textContent = msg; box.appendChild(p); box.scrollTop = box.scrollHeight; }

// Clear document.getElementById("clearBtn").addEventListener("click", () => { ctx.clearRect(0, 0, canvas.width, canvas.height); socket.emit("clear"); }); socket.on("clear", () => ctx.clearRect(0, 0, canvas.width, canvas.height)); });

  
