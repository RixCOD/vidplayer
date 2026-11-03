let currentVideo = "";
let currentIndex = 0;
let videos = [];
let hls = null;

const player = document.getElementById("player");

// =====================
// Load Episodes
// =====================

async function loadVideos() {
    try {

        const res = await fetch("/api/videos");
        videos = await res.json();

        const list =
            document.getElementById("videoList");

        list.innerHTML = "";

        videos.forEach((video, index) => {

            const li =
                document.createElement("li");

            li.innerHTML = `
                <div class="episode-card">
                    <img
                        class="episode-thumb"
                        src="/thumb/${encodeURIComponent(video)}"
                        loading="lazy">

                    <div class="episode-info">
                        <div class="episode-title">
                            ${cleanTitle(video)}
                        </div>
                    </div>
                </div>
            `;

            li.addEventListener(
                "click",
                () => {

                    currentIndex = index;
                    currentVideo = video;

                    updateActiveEpisode();
                    playVideo();
                }
            );

            list.appendChild(li);
        });

        if (videos.length > 0) {

            currentIndex = 0;
            currentVideo = videos[0];

            updateActiveEpisode();
            playVideo();
        }

    } catch (err) {

        console.error(
            "Video list error:",
            err
        );
    }
}

// =====================
// Clean Title
// =====================

function cleanTitle(filename) {

    const ep =
        filename.match(
            /E(\d+)/i
        );

    if (ep) {
        return `Episode ${parseInt(ep[1])}`;
    }

    return filename
        .replace(/\.[^/.]+$/, "")
        .replace(/\./g, " ");
}

// =====================
// Highlight Active Episode
// =====================

function updateActiveEpisode() {

    document
        .querySelectorAll(
            ".episode-card"
        )
        .forEach(card =>
            card.classList.remove(
                "active"
            )
        );

    const cards =
        document.querySelectorAll(
            ".episode-card"
        );

    if (cards[currentIndex]) {

        cards[currentIndex]
            .classList.add(
                "active"
            );

        cards[currentIndex]
            .scrollIntoView({
                behavior: "smooth",
                block: "nearest"
            });
    }
}

// =====================
// Play Video
// =====================

async function playVideo() {

    if (!currentVideo) return;

    try {

        document.getElementById(
            "episodeName"
        ).textContent =
            cleanTitle(currentVideo);

        // Health Check
        await fetch(
            "/health/" +
            encodeURIComponent(
                currentVideo
            )
        );

        const response =
            await fetch(
                "/play/" +
                encodeURIComponent(
                    currentVideo
                )
            );

        const data =
            await response.json();

        if (hls) {

            hls.destroy();
            hls = null;
        }

        player.pause();
        player.removeAttribute("src");
        player.load();

        const saved =
            localStorage.getItem(
                "watch_" +
                currentVideo
            );

        if (
            Hls.isSupported()
        ) {

            hls =
                new Hls({
                    enableWorker: true,
                    lowLatencyMode: true
                });

            hls.loadSource(
                data.playlist +
                "?v=" +
                Date.now()
            );

            hls.attachMedia(
                player
            );

            hls.on(
                Hls.Events.MANIFEST_PARSED,
                () => {

                    if (saved) {

                        player.currentTime =
                            parseFloat(
                                saved
                            );
                    }

                    player.play();
                }
            );

        } else if (
            player.canPlayType(
                "application/vnd.apple.mpegurl"
            )
        ) {

            player.src =
                data.playlist;

            player.addEventListener(
                "loadedmetadata",
                () => {

                    if (saved) {

                        player.currentTime =
                            parseFloat(
                                saved
                            );
                    }

                    player.play();
                },
                { once: true }
            );
        }

    } catch (err) {

        console.error(
            "Play Error:",
            err
        );
    }
}

// =====================
// Reload
// =====================

function reloadVideo() {

    if (currentVideo) {
        playVideo();
    }
}

// =====================
// Prev Episode
// =====================

function prevEpisode() {

    if (currentIndex <= 0)
        return;

    currentIndex--;
    currentVideo =
        videos[currentIndex];

    updateActiveEpisode();
    playVideo();
}

// =====================
// Next Episode
// =====================

function nextEpisode() {

    if (
        currentIndex >=
        videos.length - 1
    )
        return;

    currentIndex++;

    currentVideo =
        videos[currentIndex];

    updateActiveEpisode();
    playVideo();
}

// =====================
// Seek
// =====================

function seekBack() {

    player.currentTime =
        Math.max(
            0,
            player.currentTime - 10
        );
}

function seekForward() {

    player.currentTime =
        Math.min(
            player.duration || 999999,
            player.currentTime + 10
        );
}

// =====================
// Fullscreen
// =====================

function fullscreen() {

    if (
        player.requestFullscreen
    ) {
        player.requestFullscreen();
    }
}

// =====================
// Loader
// =====================

player.addEventListener(
    "waiting",
    () => {

        const loader =
            document.getElementById(
                "loader"
            );

        if (loader) {
            loader.style.display =
                "block";
        }
    }
);

player.addEventListener(
    "playing",
    () => {

        const loader =
            document.getElementById(
                "loader"
            );

        if (loader) {
            loader.style.display =
                "none";
        }
    }
);

// =====================
// Speed Control
// =====================

const speed =
    document.getElementById(
        "speed"
    );

if (speed) {

    speed.addEventListener(
        "change",
        e => {

            player.playbackRate =
                parseFloat(
                    e.target.value
                );
        }
    );
}

// =====================
// Auto Next
// =====================

player.addEventListener(
    "ended",
    nextEpisode
);

// =====================
// Save Progress
// =====================

setInterval(() => {

    if (!currentVideo)
        return;

    localStorage.setItem(
        "watch_" +
        currentVideo,
        player.currentTime
    );

}, 5000);

// =====================
// Keyboard Shortcuts
// =====================

document.addEventListener(
    "keydown",
    e => {

        switch (e.code) {

            case "Space":

                e.preventDefault();

                if (
                    player.paused
                ) {
                    player.play();
                } else {
                    player.pause();
                }

                break;

            case "ArrowLeft":
                seekBack();
                break;

            case "ArrowRight":
                seekForward();
                break;

            case "KeyN":
                nextEpisode();
                break;

            case "KeyP":
                prevEpisode();
                break;

            case "KeyF":
                fullscreen();
                break;
        }
    }
);

// =====================
// Start
// =====================

loadVideos();