const songs = [
    "blue - yung kai.mp3",
    "Van Gogh (feat. Ashley Alisha).mp3",
    "Winter blossom (feat. Ashley Alisha & nobody likes you pat).mp3"
];

let currentSongIndex = 0;
let isPlaying = false;
const audio = new Audio();
let lastVolume = 0.5;

audio.volume = lastVolume;

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
        const isMuted = audio.muted || audio.volume === 0;
        const sliderValue = Math.round((isMuted ? 0 : audio.volume) * 100);

        volumeSlider.value = sliderValue;
        musicControls.style.setProperty('--volume-percent', `${sliderValue}%`);
        muteButton.classList.toggle('is-muted', isMuted);
    }

    function setVolume(nextVolume) {
        const safeVolume = clamp(nextVolume, 0, 1);
        audio.volume = safeVolume;
        audio.muted = safeVolume === 0;

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
                setVolume((audio.muted ? lastVolume : audio.volume) + 0.1);
                return;
            }

            if (action === 'decrease') {
                setVolume((audio.muted ? lastVolume : audio.volume) - 0.1);
                return;
            }

            if (action === 'mute') {
                if (audio.muted || audio.volume === 0) {
                    audio.muted = false;
                    setVolume(lastVolume || 0.5);
                } else {
                    lastVolume = audio.volume || lastVolume;
                    audio.muted = true;
                    syncVolumeUI();
                }
            }
        });
    });

    syncVolumeUI();
}

document.addEventListener('DOMContentLoaded', () => {
    shuffledSongs = shuffleArray([...songs]);
    initMusicPlayer();
    setupVolumeControls();
});

window.MusicPlayer = {
    start: startMusicAfterTerminal,
    getAudio: () => audio
};
