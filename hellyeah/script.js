// -----------------------------
// VIDEO SETUP
// -----------------------------
const videoIDs = [
  "1",
  "2",
  "3"
];

const videoURLs = videoIDs.map(id => `videos/video${id}.mp4`);
const thumbnailURLs = videoIDs.map(id => `thumbnails/thumbnail${id}.png`);

let currentVideoIndex = Math.floor(Math.random() * videoIDs.length);

// -----------------------------
// SONG SETUP
// -----------------------------
const songs = [
  {
    url: "songs/song1.mp3",
    artworkurl: "artwork/artwork1.png",
    title: "Fortunate Son",
    artist: "Creedence Clearwater Revival"
  },
  {
    url: "songs/song2.mp3",
    artworkurl: "artwork/artwork2.png",
    title: "Sabotage",
    artist: "Beastie Boys"
  },
  {
    url: "songs/song3.mp3",
    artworkurl: "artwork/artwork3.png",
    title: "Bring Me To Life",
    artist: "Evanescence"
  }
];

let currentSongIndex = Math.floor(Math.random() * songs.length);

// -----------------------------
// ELEMENTS
// -----------------------------
const activeVideo = document.getElementById("activeVideo");
const carouselThumbnail = document.getElementById("carouselThumbnail");
const carouselPrev = document.getElementById("carouselPrev");
const carouselNext = document.getElementById("carouselNext");

const songArtwork = document.getElementById("songArtwork");
const songTitle = document.getElementById("songTitle");
const songArtist = document.getElementById("songArtist");
const progressBarInner = document.getElementById("progressBarInner");

const prevSongBtn = document.getElementById("prevSongBtn");
const playPauseBtn = document.getElementById("playPauseBtn");
const nextSongBtn = document.getElementById("nextSongBtn");

// Separate audio object for music
const audioPlayer = new Audio();
audioPlayer.preload = "metadata";

// -----------------------------
// VIDEO FUNCTIONS
// -----------------------------
function updateVideoUI() {
  activeVideo.src = videoURLs[currentVideoIndex];
  activeVideo.muted = true;
  activeVideo.loop = true;
  activeVideo.playsInline = true;
  activeVideo.play().catch(() => {
    // Some browsers may block autoplay until user interaction.
  });

  carouselThumbnail.src = thumbnailURLs[currentVideoIndex];
  carouselThumbnail.alt = `Thumbnail for video ${videoIDs[currentVideoIndex]}`;
}

function showNextVideo() {
  currentVideoIndex = (currentVideoIndex + 1) % videoURLs.length;
  updateVideoUI();
}

function showPrevVideo() {
  currentVideoIndex = (currentVideoIndex - 1 + videoURLs.length) % videoURLs.length;
  updateVideoUI();
}

// -----------------------------
// SONG FUNCTIONS
// -----------------------------
function updateSongInfoUI() {
  const currentSong = songs[currentSongIndex];
  songArtwork.src = currentSong.artworkurl;
  songArtwork.alt = `${currentSong.title} artwork`;
  songTitle.textContent = currentSong.title;
  songArtist.textContent = currentSong.artist;
}

function loadSong(index, shouldPlay = true) {
  currentSongIndex = (index + songs.length) % songs.length;
  const currentSong = songs[currentSongIndex];

  audioPlayer.src = currentSong.url;
  updateSongInfoUI();
  updatePlayPauseButton();

  if (shouldPlay) {
    audioPlayer.play().then(() => {
      updatePlayPauseButton();
    }).catch(() => {
      // Browsers may block autoplay until user interaction.
      updatePlayPauseButton();
    });
  }
}

function playNextSong() {
  loadSong(currentSongIndex + 1, true);
}

function playPrevSong() {
  loadSong(currentSongIndex - 1, true);
}

function togglePlayPause() {
  if (audioPlayer.paused) {
    audioPlayer.play().then(() => {
      updatePlayPauseButton();
    }).catch(() => {
      updatePlayPauseButton();
    });
  } else {
    audioPlayer.pause();
    updatePlayPauseButton();
  }
}

function updatePlayPauseButton() {
  playPauseBtn.textContent = audioPlayer.paused ? "▶" : "⏸";
}

// -----------------------------
// PROGRESS BAR
// -----------------------------
function updateProgressBar() {
  if (!audioPlayer.duration || Number.isNaN(audioPlayer.duration)) {
    progressBarInner.style.width = "0%";
    return;
  }

  const percent = (audioPlayer.currentTime / audioPlayer.duration) * 100;
  progressBarInner.style.width = `${percent}%`;
}

// -----------------------------
// EVENTS
// -----------------------------
carouselPrev.addEventListener("click", showPrevVideo);
carouselNext.addEventListener("click", showNextVideo);

prevSongBtn.addEventListener("click", playPrevSong);
playPauseBtn.addEventListener("click", togglePlayPause);
nextSongBtn.addEventListener("click", playNextSong);

audioPlayer.addEventListener("timeupdate", updateProgressBar);
audioPlayer.addEventListener("loadedmetadata", updateProgressBar);
audioPlayer.addEventListener("ended", playNextSong);
audioPlayer.addEventListener("play", updatePlayPauseButton);
audioPlayer.addEventListener("pause", updatePlayPauseButton);

// -----------------------------
// INITIAL LOAD
// -----------------------------
window.addEventListener("load", () => {
  updateVideoUI();
  loadSong(currentSongIndex, true);
});