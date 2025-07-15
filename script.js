const socket = io('https://play2love-serverx-1.onrender.com'); // 🔗 Your deployed server URL

// Elements
const nameInput = document.getElementById('name');
const roomInput = document.getElementById('room');
const createBtn = document.getElementById('createRoom');
const joinBtn = document.getElementById('joinRoom');
const avatars = document.querySelectorAll('.avatar');
const musicToggle = document.getElementById('musicToggle');
const music = new Audio('assets/music.mp3');

let selectedAvatar = '';

// Avatar selection
avatars.forEach((avatar) => {
  avatar.addEventListener('click', () => {
    avatars.forEach(a => a.classList.remove('selected'));
    avatar.classList.add('selected');
    selectedAvatar = avatar.getAttribute('data-avatar');
  });
});

// Music toggle
let isPlaying = false;
musicToggle.addEventListener('click', () => {
  isPlaying = !isPlaying;
  if (isPlaying) {
    music.play();
  } else {
    music.pause();
  }
});

// Create room
createBtn.addEventListener('click', () => {
  const name = nameInput.value.trim();
  const room = roomInput.value.trim() || generateRoomCode();

  if (!name || !selectedAvatar) {
    alert('Please enter your name and select an avatar.');
    return;
  }

  localStorage.setItem('username', name);
  localStorage.setItem('room', room);
  localStorage.setItem('avatar', selectedAvatar);
  localStorage.setItem('isCreator', 'true');

  window.location.href = 'room.html';
});

// Join room
joinBtn.addEventListener('click', () => {
  const name = nameInput.value.trim();
  const room = roomInput.value.trim();

  if (!name || !room || !selectedAvatar) {
    alert('Please enter your name, room code and select an avatar.');
    return;
  }

  localStorage.setItem('username', name);
  localStorage.setItem('room', room);
  localStorage.setItem('avatar', selectedAvatar);
  localStorage.setItem('isCreator', 'false');

  window.location.href = 'room.html';
});

// Random room code generator
function generateRoomCode() {
  return Math.floor(1000 + Math.random() * 9000).toString(); // 4-digit room
}
