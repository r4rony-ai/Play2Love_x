function createRoom() {
  const name = document.getElementById("username").value.trim();
  const room = document.getElementById("roomCode").value.trim() || Math.floor(Math.random() * 10000);
  if (name) {
    window.location.href = `room.html?name=${name}&room=${room}`;
  } else {
    alert("Please enter your name");
  }
}

function joinRoom() {
  const name = document.getElementById("username").value.trim();
  const room = document.getElementById("roomCode").value.trim();
  if (name && room) {
    window.location.href = `room.html?name=${name}&room=${room}`;
  } else {
    alert("Please enter name and room code");
  }
}

function selectAvatar(gender) {
  document.querySelectorAll(".avatar").forEach(el => el.classList.remove("selected"));
  document.getElementById(gender).classList.add("selected");
  localStorage.setItem("avatar", `assets/avatar-${gender}.png`);
}

function toggleMusic() {
  const music = document.getElementById("bg-music");
  if (music.paused) {
    music.play();
  } else {
    music.pause();
  }
}
