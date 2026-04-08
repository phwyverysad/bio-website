const songs = [
    "blue - yung kai.mp3",
    "Van Gogh (feat. Ashley Alisha).mp3",
    "Winter blossom (feat. Ashley Alisha & nobody likes you pat).mp3"
];

let currentSongIndex = 0;
let isPlaying = false;
const audio = new Audio();
let lastVolume = 0.5;
let currentVolume = lastVolume;

audio.volume = lastVolume;

window.MusicPlayer = window.MusicPlayer || {};

let audioCtx, gainNode, analyser, sourceNode;

function initAudioContext() {
    if (audioCtx) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    
    audioCtx = new AudioContext();
    gainNode = audioCtx.createGain();
    analyser = audioCtx.createAnalyser();
    
    sourceNode = audioCtx.createMediaElementSource(audio);
    sourceNode.connect(gainNode);
    gainNode.connect(analyser);
    analyser.connect(audioCtx.destination);
    
    gainNode.gain.value = currentVolume;
    
    window.MusicPlayer.audioCtx = audioCtx;
    window.MusicPlayer.analyser = analyser;
    window.MusicPlayer.gainNode = gainNode;
}

function shuffleArray(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

let shuffledSongs = shuffleArray(songs);

function initMusicPlayer() {
    loadSong(currentSongIndex);
    audio.addEventListener('ended', nextSong);
}

function startMusicAfterTerminal() {
    initAudioContext();
    if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    isPlaying = true;
    audio.play()
        .catch(error => {
            console.error("Music playback error:", error);
            setTimeout(() => {
                audio.play().catch(e => console.error("Retry error:", e));
            }, 1000);
        });
}

function loadSong(index) {
    audio.src = `./assets/music/${shuffledSongs[index]}`;
    
    if (isPlaying) {
        audio.play().catch(error => console.error("Play error:", error));
    }
}

function nextSong() {
    currentSongIndex = Math.floor(Math.random() * shuffledSongs.length);
    loadSong(currentSongIndex);
}

function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

function setupVolumeControls() {
    const musicControls = document.getElementById('music-controls');
    const volumeSlider = document.getElementById('volume-slider');
    const muteButton = document.querySelector('[data-volume-action="mute"]');
    const controlButtons = document.querySelectorAll('[data-volume-action]');

    if (!musicControls || !volumeSlider || !muteButton || controlButtons.length === 0) {
        return;
    }

    function syncVolumeUI() {
        const isMuted = currentVolume === 0;
        const sliderValue = Math.round((isMuted ? 0 : currentVolume) * 100);

        volumeSlider.value = sliderValue;
        musicControls.style.setProperty('--volume-percent', `${sliderValue}%`);
        
        const icon = muteButton.querySelector('i');
        if (icon) {
            if (isMuted || sliderValue === 0) {
                icon.className = 'fa-solid fa-volume-xmark';
            } else if (sliderValue <= 50) {
                icon.className = 'fa-solid fa-volume-low';
            } else {
                icon.className = 'fa-solid fa-volume-high';
            }
        }
    }

    function setVolume(nextVolume) {
        const safeVolume = clamp(nextVolume, 0, 1);
        currentVolume = safeVolume;
        
        audio.volume = safeVolume;
        audio.muted = safeVolume === 0;

        if (gainNode) {
            gainNode.gain.value = safeVolume;
        }

        if (safeVolume > 0) {
            lastVolume = safeVolume;
        }

        syncVolumeUI();
    }

    volumeSlider.addEventListener('input', (event) => {
        setVolume(Number(event.target.value) / 100);
    });

    controlButtons.forEach((button) => {
        button.addEventListener('click', () => {
            const action = button.dataset.volumeAction;

            if (action === 'increase') {
                setVolume((currentVolume === 0 ? lastVolume : currentVolume) + 0.1);
                return;
            }

            if (action === 'decrease') {
                setVolume((currentVolume === 0 ? lastVolume : currentVolume) - 0.1);
                return;
            }

            if (action === 'mute') {
                if (currentVolume === 0) {
                    setVolume(lastVolume || 0.5);
                } else {
                    lastVolume = currentVolume;
                    setVolume(0);
                }
            }
        });
    });

    syncVolumeUI();
}

document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
        if (gainNode) {
            gainNode.gain.value = 0;
        }
        audio.muted = true;
        audio.pause();
    } else {
        if (gainNode) {
            gainNode.gain.value = currentVolume;
        }
        audio.muted = currentVolume === 0;
        
        if (isPlaying) {
            audio.play().catch(e => console.error("Resume playback error:", e));
        }
    }
});

document.addEventListener('DOMContentLoaded', () => {
    shuffledSongs = shuffleArray([...songs]);
    initMusicPlayer();
    setupVolumeControls();
});

window.MusicPlayer.start = startMusicAfterTerminal;
window.MusicPlayer.getAudio = () => audio;
