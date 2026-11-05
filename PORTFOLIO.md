# Fares Elzouhiry — Portfolio

**Websites from another dimension.** A one-page portfolio built around a live particle engine written from scratch in WebGL2: about 41,000 points of light that start as a tesseract (a cube rotating through the fourth dimension), then reshape themselves into an emblem for each project, assemble into that project's real screen, and end as a ringed planet. The words are kept to a minimum; the motion does the talking.

- **Live site:** https://fareselzouhiry.github.io/Fares-Elzouhiry/
- **Repository:** https://github.com/FaresElzouhiry/Fares-Elzouhiry
- **Languages:** English (default) and Arabic, switched with the button in the top bar. A link can open the Arabic version directly: `…/Fares-Elzouhiry/?lang=ar`.

![Link preview](img/og.jpg)

---

## The journey

Scrolling drives everything. Each shape holds while you read, then every particle flies (with a little swirl, each at its own moment) into the next one.

| # | Section | Link | What the particles become |
|---|---|---|---|
| 0 | Intro | `#top` | A **4D tesseract**: the 32 edges of a four-dimensional cube, rotated in four dimensions and projected into 3D. Moving the mouse turns it through the fourth dimension |
| 1 | Alliance Investment | `#alliance` | A **globe** of the world's land in light, Saudi Arabia in gold, and a line from Riyadh to each of the 15 other network countries with a pulse running out along it → then **the Alliance home page** |
| 2 | Doctor Dashboard | `#doctor` | A **QR code** inside a scanner's viewfinder, with a scan line passing over it → then **the dashboard and a student's phone** saying "Checked in" |
| 3 | University App | `#uni` | A **focus timer**: a ring with a light running round it, minute ticks, and "25:00" written in particles → then **three screens of the app** |
| 4 | TSUB Global Services | `#tsub` | **Three ribbons**, white, green and red, rising from one point around a dotted globe (the company's logo idea) → then **the TSUB home page** |
| 5 | Contact | `#contact` | A **ringed planet** — "Let's build something out of this world." |

When a project's screen forms, it first appears as a mosaic of particles (each particle takes the colour of its pixel), then the sharp picture sweeps in behind a bright scan line. Clicking it, or **Screens**, opens a gallery of that project's pictures with captions.

Under Alliance, a row of six small thumbnails shows **the six design directions made for the CEO** (Gateway was chosen and became the website); each opens in the gallery.

### The projects

| Project | Links |
|---|---|
| **Alliance Investment** — a six-language website for an investment holding in Riyadh, opening on a live 3D globe of its 16-country network | [Live](https://fareselzouhiry.github.io/Alliance/) · [Code](https://github.com/FaresElzouhiry/Alliance) |
| **Doctor Dashboard** (Juster) — students scan the doctor's QR code and appear live, only from inside the hall | [Code](https://github.com/FaresElzouhiry/Uni-app) |
| **University App** (Juster) — the student app: live schedule, tasks, focus rooms; installable and offline | [Code](https://github.com/FaresElzouhiry/Uni-app) |
| **TSUB Global Services** — a cinematic site linking Saudi Arabia and Bangladesh around a 3D globe and the logo's ribbons | [Live](https://fareselzouhiry.github.io/TSUB/) · [Code](https://github.com/FaresElzouhiry/TSUB) |

The dashboard screenshots use **sample data**: they were taken locally with the attendance API answered by a small script, so nothing reached the real server, and the QR code in them points to this portfolio.

---

## How it works

Everything is in `index.html` (HTML, CSS and JavaScript) plus the pictures in `img/`. No 3D library: the engine is plain WebGL2, about 400 lines.

| Part | How it is done |
|---|---|
| Particles | 40,960 on computers, 24,576 on phones. Every shape is stored on the graphics card as a texture of positions and a texture of colours; one draw call renders them all |
| Morphing | The vertex shader reads the particle's place in two shapes and blends between them; each particle starts at a slightly different moment, and a swirl is added mid-flight |
| The fourth dimension | The tesseract's points have four coordinates; the shader rotates them in the XW, YW and ZW planes and projects them into 3D with a perspective divide on W |
| Effects | Light pulses run out along the Alliance lines, a scan line crosses the QR code, and a light runs round the timer ring — all computed per particle in the shader |
| Screens | Each project picture is sampled into a grid of particles for the mosaic, then drawn sharp on a quad whose shader reveals it top-down with a scan line and a slight colour split |
| Scroll | A smoothed scroll value decides which shape is shown and how far into the next; each project holds its emblem, then its screen, while its text is shown |
| Layout | The shapes are sized and placed in the free space beside the text (below it on phones), and mirrored for Arabic |
| Extras | A starfield, film grain, a vignette, a cursor ring that grows over anything clickable, and titles that decode from noise when their section arrives |
| Speed | About 700 KB on first load, 60 frames a second in testing; if a device can't keep up, the page renders at a lower resolution instead of stuttering |
| Fallback | Without WebGL2, or when `index.html` is opened straight from disk, it becomes a plain page with the same words and pictures; the gallery still works |
| Reduced motion | With the system's reduced-motion setting on, the swirl, spins and decoding stop |

## Files

```
index.html     the whole site
img/           full-size screenshots (gallery) and og.jpg (link preview)
img/stage/     the four pictures the particles assemble into (1600×1000)
img/xs/        thumbnails
serve.ps1      small local server for previewing
README.md      short guide in Arabic
PORTFOLIO.md   this file
```

## Running it locally

The 3D needs the page to be served over HTTP (browsers block reading images into WebGL on pages opened from disk):

```
powershell -ExecutionPolicy Bypass -File serve.ps1
```

Then open http://localhost:8765

## Editing

| To change | Look for |
|---|---|
| Text | Each sentence is written twice: `class="en"` for English and `class="ar"` for Arabic |
| A project | Its `<section class="sec proj" id="…">` |
| What the particles become | `ST` in the script (the order of shapes) and the `sh…` functions that build each shape |
| How long each shape holds | `buildHolds` in the script |
| A project's picture | `img/stage/<name>.jpg` (1600×1000) |
| Gallery pictures and captions | `GAL` in the script; each picture needs a copy in `img/` and in `img/xs/` |
| Email | Search for `fa872328@gmail.com` |

## Publishing

GitHub Pages from the `main` branch. Push `index.html` and the whole `img/` folder and the live site updates within a minute or two.
