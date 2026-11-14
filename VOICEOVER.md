# Voiceovers

**Status:** no recordings yet (`audio/vo/manifest.json` is empty). Until recordings are added, the game reads each line with the browser's built-in speech voice, which sounds robotic. Subtitles are always shown, and the 🔊 button mutes speech.

The game is ready for real recordings: put a file named after each line in `audio/vo/`, list it in the manifest, and the game plays it instead of the browser voice.

## The lines

All 53 lines are in [`audio/vo/lines.csv`](audio/vo/lines.csv), with columns `file`, `speaker`, `voice` and `text`. Each `file` value is the exact file name to save. The text comes from `shared/voice.js` (`VO_LINES`). If you change a line there, run `node tools/export-voice-lines.js` to rebuild the CSV.

| Speaker | Lines | Suggested voice |
|---|---|---|
| `control` | 16 | Project RECLAIM Mission Control, 2075: calm, clear, female |
| `narrator` | 28 | Real-history narrator: warm documentary voice, male |
| `capcom` | 6 | Houston CAPCOM in 1972 (dramatised), guiding the Apollo 17 fender repair: crisp, male. The game adds a radio filter, so record it clean |
| `ana` | 3 | Dr Ana Ruiz, the stranded geologist: relieved, female |

The CAPCOM lines are dramatised. They follow what happened (John Young and engineers worked the fix out overnight and it was read up by radio), but they are not quotes from the mission transcript.

## Making the files with VoiceStudio

[VoiceStudio](https://github.com/debpalash/VoiceStudio) is a free desktop app (AGPL-3.0) that runs on Windows, macOS and Linux, and works on a CPU without a graphics card (it's just slower).

1. Install VoiceStudio from its [latest release](https://github.com/debpalash/VoiceStudio/releases/latest). It asks before downloading any voice model.
2. Choose or design four voices, one per speaker in the table above. Reuse the same voice for every line from the same speaker.
3. For each row of `lines.csv`, generate the `text` with that speaker's voice. Its **Narrate & batch** feature can queue them all.
4. Export each one as MP3 (mono is fine) and save it in `audio/vo/` with the exact name from the `file` column, for example `audio/vo/a17_fender_1.mp3`.
5. From the project folder, run `node tools/update-voice-manifest.js`. This lists every MP3 in `audio/vo/manifest.json`.
6. Commit and push `audio/vo/`. GitHub Pages serves the files and the game plays them.

You can add the recordings a few at a time. Any line without a file falls back to the browser voice.

## How the game uses them

`shared/voice.js` queues lines so they never talk over each other. Each line is typed out as a subtitle that disappears after a few seconds. The mute choice is remembered (`reclaimMute` in local storage).
