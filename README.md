# Project RECLAIM: Abandoned, Not Forgotten

An interactive educational game for the **2026 NASA Space Apps Challenge**, challenge *"Abandoned but not Forgotten: Storytelling about NASA's Discarded Equipment on the Moon and Mars"*.

> The year is 2075. Project RECLAIM sends an astronaut to four NASA rovers that were left behind. Fly to each one, find out what really went wrong, repair or investigate it with your own hands, then take it on one last short drive.
>
> *Their journeys ended. Our exploration continues.*

The 2075 expedition is **fiction**. Each rover's history comes from **NASA**, and the game labels which is which.

## The four missions

| Mission | Real history you act out | 2075 drive (fiction) |
|---|---|---|
| **Apollo 15 LRV** · Hadley–Apennine, Moon, 1971 | Front steering did not respond on the first drive; troubleshooting did not fix it; it worked again on the second moonwalk (cause never confirmed) | Science drive to Hadley Rille, St. George crater and Spur crater in any order, picking the right rock at each sampling stop, then back to the rocket |
| **Apollo 17 LRV** · Taurus–Littrow, Moon, 1972 | Broken right-rear fender extension: the dust "rooster tail", the tape that would not stick, the four-map fender with clamps | Emergency run against a timer to a stranded geologist; climb off, carry the spare battery and connect it |
| **Spirit** · Gusev Crater, Mars, 2004–2010 | Right-front wheel motor failure, and the silica soil its dragging wheel uncovered | Remote-control drive out of soft soil onto a north-facing slope (tilted panels catch the winter Sun), with wheel slip, sinkage, a power budget and the silica trail left by the dead wheel |
| **Opportunity** · Endeavour Crater, Mars, 2004–2018 | The 2018 planet-wide dust storm and the power decisions it forced | Remote-control drive to a signal ridge on a limited battery (in the repair bay: free choice of systems in the storm, and a Give Up option that reveals what really happened) |

## Game flow

`index.html` (choose Moon or Mars, then a rover) → `story.html` (rocket flight, landing, walk as an astronaut) → `repair.html` (hand-tracked repair bay) → `story.html` (driving mission, walk back, take off) → back to mission select. Completing all four unlocks the ending.

## Files

| File | What it is |
|---|---|
| `index.html` | Story Mode hub: destinations, rover cards with live 3D previews, progress, ending unlock |
| `story.html` | Rocket travel, third-person astronaut, shared driving system, four drive missions, ending |
| `repair.html` | The hand-tracked repair bay (formerly v8). Opened with `?story=1&mission=…` it runs only that mission's repairs and returns to the story; opened on its own it is free play with all repairs |
| `shared/models.js` | Rover 3D models, NASA mission history, and the 2075 story data, used by all three pages |
| `shared/voice.js` | Spoken lines with typed, disappearing subtitles and a mute button. Plays `audio/vo/*.mp3` when present, otherwise the browser's speech voice |
| `VOICEOVER.md`, `audio/vo/`, `tools/` | Voiceover scripts (`lines.csv`) and how to record them with VoiceStudio |
| `drafts/` | Earlier versions (v6, v7) |

## Controls

- **Repairs:** you choose at the first repair (with "Never ask again" / "Ask again"); scroll to zoom. Webcam hand tracking (pinch to grab, drag, open fingers to release, twist to turn, point to scan, open palm to wipe, two hands for cat's cradle tape and tow lines), or the mouse.
- **Walking:** WASD, Shift to run, drag the mouse to look, E to interact.
- **Driving:** W/S, A/D, Shift for slow and careful, E to interact.

## Running it

It is a static site with no build step. The webcam only works on **https** or **localhost**, so serve the folder rather than opening the file directly, for example:

```
python -m http.server 8000
```

then open http://localhost:8000. Camera video is processed in the browser and never uploaded.

## Credits

- Historical information: NASA (Apollo 15 and 17 mission summaries, NASA History SP-4029; NASA Science pages for Spirit and the Mars Exploration Rovers). Links are in the game.
- Libraries: [three.js](https://threejs.org) r128, [p5.js](https://p5js.org) 1.9, [MediaPipe Hands](https://developers.google.com/mediapipe).
- Hand-landmark smoothing uses the One Euro filter (Casiez, Roussel & Vogel, CHI 2012), an idea taken from [open-source-hands](https://github.com/abouchedidxcode/open-source-hands) (MIT); the implementation here is our own.
- Driving feel and chase camera were informed by mrdoob's [Starter Kit Racing](https://github.com/mrdoob/Starter-Kit-Racing) (MIT); no code was copied.
- 3D models are simplified illustrations built in code, not to scale.
- The first draft of the Opportunity storm power model was written by an external model (NVIDIA Nemotron 3 Ultra, through OpenRouter), then reviewed and corrected.
