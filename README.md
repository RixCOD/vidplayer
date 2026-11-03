# 📺 Anime Streaming Server (Node.js + FFmpeg + HLS)

A lightweight anime streaming backend built with Node.js, Express, and FFmpeg that automatically lists, processes, caches, and streams video content for web consumption.

---

## 🌟 Features

*   ✅ **Automatic Anime Episode Discovery:** Automatically detects and indexes local video files.
*   ✅ **Episode Sorting:** Smart ordering based on episode numbers (`E01`, `E02`, etc.).
*   ✅ **Thumbnail Generation & Caching:** Dynamically extracts video frames and caches thumbnails.
*   ✅ **HLS Video Streaming:** On-demand conversion to `.m3u8` playlists for web streaming.
*   ✅ **Cache Management:** Optimized caching for both thumbnails and HLS video segments.
*   ✅ **Health Check API:** Built-in endpoint to check status and verify integrity.
*   ✅ **Auto-Repair System:** Automatically recovers from missing or corrupted cache data.
*   ✅ **Broad File Format Support:** Works seamlessly with `.mkv`, `.mp4`, and `.avi`.

---

## 📁 Project Structure

```text
project/
│
├── server.js
├── package.json
│
├── anime/
│   ├── Anime E01.mkv
│   ├── Anime E02.mkv
│   └── Anime E03.mkv
│
├── cache/
│   ├── hls/
│   └── thumbs/
│
└── public/
    ├── index.html
    ├── script.js
    └── style.css
```

---

## 🛠️ Prerequisites & Requirements

### 1. Node.js
*   **Requirement:** Node.js `v18+` recommended.
*   **Download:** [nodejs.org](https://nodejs.org)

### 2. FFmpeg
FFmpeg is required for generating video thumbnails and performing HLS conversion.

*   **Check Installation:**
    ```bash
    ffmpeg -version
    ```
*   **Install on Ubuntu / Debian:**
    ```bash
    sudo apt update && sudo apt install -y ffmpeg
    ```
*   **Install on Windows:**
    1. Download binaries from [ffmpeg.org/download.html](https://ffmpeg.org/download.html).
    2. Add the FFmpeg `bin` folder to your system environment `PATH`.

---

## 🚀 Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/anime-stream-server.git
   cd anime-stream-server
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the server:**
   ```bash
   node server.js
   ```

4. **Access the application:**
   The server will output:
   ```text
   Server running at http://localhost:3000
   ```
   Open `http://localhost:3000` in your browser.

---

## 📑 API Documentation

### 1. List Available Videos
Retrieves a list of available episodes, sorted automatically by episode number.

*   **Endpoint:** `GET /api/videos`
*   **Response:**
    ```json
    [
      "Anime E01.mkv",
      "Anime E02.mkv",
      "Anime E03.mkv"
    ]
    ```

---

### 2. Generate Thumbnail
Returns a JPG thumbnail extracted from the 20-second mark (`00:00:20`) of the video. Submitting a request caches the generated image in `cache/thumbs/`.

*   **Endpoint:** `GET /thumb/:file`
*   **Example:** `GET /thumb/Anime%20E01.mkv`
*   **Response:** `image/jpeg`

---

### 3. Health Check
Checks if the source video, generated thumbnail, and HLS playlist exist. Auto-repairs missing cache components when queried.

*   **Endpoint:** `GET /health/:file`
*   **Example:** `GET /health/Anime%20E01.mkv`
*   **Healthy Response:**
    ```json
    {
      "status": "ok"
    }
    ```
*   **Auto-Repaired Response:**
    ```json
    {
      "status": "repaired",
      "issues": [
        "Thumbnail Missing",
        "Playlist Missing"
      ]
    }
    ```

---

### 4. Stream Video
Initiates HLS conversion (if not already cached) and returns the relative path to the `.m3u8` playlist.

*   **Endpoint:** `GET /play/:file`
*   **Example:** `GET /play/Anime%20E01.mkv`
*   **Response:**
    ```json
    {
      "playlist": "/hls/2dd1c2f97d6a8b0f/playlist.m3u8"
    }
    ```

---

## ⚡ HLS & Cache Architecture

### HLS Processing Workflow
When a video is requested for the first time:

```text
Anime File  ──>  FFmpeg  ──>  HLS Playlist  ──>  playlist.m3u8
                                           └──>  segment1.ts
                                           └──>  segment2.ts
                                           └──>  segment3.ts
```

### Cache System
*   **HLS Cache (`cache/hls/`):** Video segments and playlists are generated once per episode and reused on subsequent requests.
*   **Thumbnail Cache (`cache/thumbs/`):** Extracted image files are saved to avoid repetitive processing.

### Auto-Repair Mechanism
If a cache file or thumbnail is detected as missing or corrupted:
1. Clears broken cache associated with the file.
2. Removes invalid entries.
3. Automatically triggers regeneration.

```text
[AUTO REPAIR] Anime E01.mkv
```

---

## 💡 Frontend Flow Example

```text
Frontend Application
      │
      ├──> GET /api/videos ─────────> Fetch Episode List
      │
      └──> User selects episode
                 │
                 ├──> GET /play/Anime E01.mkv
                 │          │
                 │          └──> Returns playlist.m3u8 path
                 │
                 └──> HLS.js initializes playback
```

---

## ⚙️ FFmpeg Commands Used

### Thumbnail Extraction
```bash
ffmpeg -y \
  -ss 00:00:20 \
  -i video.mkv \
  -frames:v 1 \
  -q:v 2 \
  thumbnail.jpg
```

### HLS Transcoding
```bash
ffmpeg -y \
  -i video.mkv \
  -map 0:v:0 \
  -map 0:a:0? \
  -c:v copy \
  -c:a aac \
  -b:a 192k \
  -hls_time 10 \
  -hls_playlist_type vod \
  -hls_segment_filename segment%d.ts \
  playlist.m3u8
```

---

## 🌐 Browser Support

| Browser | HLS Support | Implementation Note |
| :--- | :---: | :--- |
| **Chrome** | ✅ | Requires `HLS.js` |
| **Edge** | ✅ | Requires `HLS.js` |
| **Firefox** | ✅ | Requires `HLS.js` |
| **Brave** | ✅ | Requires `HLS.js` |
| **Safari** | ✅ | Supported natively |

---

## 🔮 Future Improvements

*   [ ] Multi-quality adaptive streaming (1080p / 720p / 480p)
*   [ ] Automatic anime metadata scraping
*   [ ] Episode progress tracking
*   [ ] Subtitle support (`.srt` / `.ass`)
*   [ ] Watch history and "Continue Watching" state
*   [ ] Admin management dashboard
*   [ ] Pre-generation batch worker for HLS playlists

---

## 📄 License

This project is open-source under the [MIT License](LICENSE).

---

## 👤 Author & Built With

Built By RixCOD(Anshu) with **Node.js**, **Express.js**, **FFmpeg**, and **HLS Streaming**. Perfect for hosting and streaming personal anime collections through a custom web interface! 🚀
