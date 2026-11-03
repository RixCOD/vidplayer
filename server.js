const express = require("express");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { spawn } = require("child_process");

const app = express();

const VIDEO_FOLDER = path.join(__dirname, "anime");
const CACHE_FOLDER = path.join(__dirname, "cache");
const HLS_FOLDER = path.join(CACHE_FOLDER, "hls");
const THUMB_FOLDER = path.join(CACHE_FOLDER, "thumbs");

fs.mkdirSync(HLS_FOLDER, { recursive: true });
fs.mkdirSync(THUMB_FOLDER, { recursive: true });

app.use(express.static("public"));
app.use("/hls", express.static(HLS_FOLDER));
app.use("/thumbs", express.static(THUMB_FOLDER));

function safeName(file) {
    return crypto
        .createHash("md5")
        .update(file)
        .digest("hex");
}

function getEpisodeNumber(name) {
    const match =
        name.match(/E(\d+)/i);

    return match
        ? parseInt(match[1])
        : 9999;
}

// =========================
// VIDEO LIST
// =========================

app.get("/api/videos", (req, res) => {

    const videos =
        fs.readdirSync(VIDEO_FOLDER)
        .filter(file =>
            /\.(mkv|mp4|avi)$/i.test(file)
        )
        .sort((a, b) =>
            getEpisodeNumber(a) -
            getEpisodeNumber(b)
        );

    res.json(videos);
});

// =========================
// THUMBNAIL
// =========================

app.get("/thumb/:file", (req, res) => {

    const file =
        decodeURIComponent(
            req.params.file
        );

    const videoPath =
        path.join(
            VIDEO_FOLDER,
            file
        );

    const thumbPath =
        path.join(
            THUMB_FOLDER,
            safeName(file) + ".jpg"
        );

    if (fs.existsSync(thumbPath)) {
        return res.sendFile(thumbPath);
    }

    const ffmpeg =
        spawn("ffmpeg", [
            "-y",
            "-ss",
            "00:00:20",
            "-i",
            videoPath,
            "-frames:v",
            "1",
            "-q:v",
            "2",
            thumbPath
        ]);

    ffmpeg.on("close", () => {

        if (
            fs.existsSync(
                thumbPath
            )
        ) {
            return res.sendFile(
                thumbPath
            );
        }

        res.status(500).send(
            "Thumbnail generation failed"
        );
    });
});

// =========================
// HEALTH CHECK
// =========================

function verifyEpisode(file) {

    const id =
        safeName(file);

    const playlist =
        path.join(
            HLS_FOLDER,
            id,
            "playlist.m3u8"
        );

    const issues = [];

    if (
        !fs.existsSync(
            path.join(
                VIDEO_FOLDER,
                file
            )
        )
    ) {
        issues.push(
            "Video Missing"
        );
    }

    if (
        !fs.existsSync(
            path.join(
                THUMB_FOLDER,
                id + ".jpg"
            )
        )
    ) {
        issues.push(
            "Thumbnail Missing"
        );
    }

    if (
        !fs.existsSync(
            playlist
        )
    ) {
        issues.push(
            "Playlist Missing"
        );
    }

    return {
        ok:
            issues.length === 0,
        issues
    };
}

function repairEpisode(file) {

    const id =
        safeName(file);

    const hlsDir =
        path.join(
            HLS_FOLDER,
            id
        );

    fs.rmSync(
        hlsDir,
        {
            recursive: true,
            force: true
        }
    );

    const thumb =
        path.join(
            THUMB_FOLDER,
            id + ".jpg"
        );

    if (
        fs.existsSync(thumb)
    ) {
        fs.unlinkSync(
            thumb
        );
    }

    console.log(
        "[AUTO REPAIR]",
        file
    );
}

app.get(
    "/health/:file",
    (req, res) => {

        const file =
            decodeURIComponent(
                req.params.file
            );

        const result =
            verifyEpisode(
                file
            );

        if (
            !result.ok
        ) {

            repairEpisode(
                file
            );

            return res.json({
                status:
                    "repaired",
                issues:
                    result.issues
            });
        }

        res.json({
            status: "ok"
        });
    }
);

// =========================
// PLAY VIDEO
// =========================

app.get("/play/:file", (req, res) => {

    const file =
        decodeURIComponent(
            req.params.file
        );

    const videoPath =
        path.join(
            VIDEO_FOLDER,
            file
        );

    const id =
        safeName(file);

    const outputDir =
        path.join(
            HLS_FOLDER,
            id
        );

    const playlist =
        path.join(
            outputDir,
            "playlist.m3u8"
        );

    fs.mkdirSync(
        outputDir,
        {
            recursive: true
        }
    );

    if (
        fs.existsSync(
            playlist
        )
    ) {

        return res.json({
            playlist:
                `/hls/${id}/playlist.m3u8`
        });
    }

    const ffmpeg =
        spawn("ffmpeg", [
            "-y",
            "-i",
            videoPath,

            "-map", "0:v:0",
            "-map", "0:a:0?",

            "-c:v", "copy",
            "-c:a", "aac",

            "-b:a", "192k",

            "-hls_time", "10",
            "-hls_playlist_type", "vod",

            "-hls_segment_filename",
            path.join(
                outputDir,
                "segment%d.ts"
            ),

            playlist
        ]);

    ffmpeg.stderr.on(
        "data",
        data => {
            console.log(
                data.toString()
            );
        }
    );

    ffmpeg.on(
        "close",
        code => {

            if (
                code !== 0
            ) {

                return res
                    .status(500)
                    .json({
                        error:
                            "FFmpeg failed"
                    });
            }

            res.json({
                playlist:
                    `/hls/${id}/playlist.m3u8`
            });
        }
    );
});

// =========================

app.listen(3000, () => {

    console.log(
        "Server running at http://localhost:3000"
    );
});