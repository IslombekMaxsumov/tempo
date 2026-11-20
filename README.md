# TEMPO — fitness tracker

**Live site: https://islombekmaxsumov.github.io/tempo/**

Site #4 of my 10-websites course project. A multi-page workout tracker in plain HTML, CSS and JavaScript (no framework, no build step, no backend). Design: "Cool Mineral / Performance Instrument": blue-grey mineral and graphite, petrol teal as the brand colour, citron only for key data (records, this week). Logo: an instrument dial with a citron pivot (assets/brand, wordmark outlined from Space Grotesk Bold). Space Grotesk (Geologica for Cyrillic) + Inter. All text colours pass WCAG AA.

## Pages
| Page | What it does |
| --- | --- |
| `index.html` | Today: this week's rings against the goals, streak, week strip, recent workouts |
| `log.html` | All workouts grouped by week; filter by type and dates, search (any language) |
| `workout.html?id=…` | One workout: stats, every set, personal bests; Edit, Repeat, Delete with Undo |
| `edit.html` | Add or edit a workout: sets × reps × kg, cardio distance, live summary, field checks |
| `progress.html` | Charts for 4 / 8 / 12 weeks (minutes, volume, types) and personal records |
| `goals.html` | Weekly goals with steppers, progress bars and an 8-week hit/miss history |
| `exercises.html` / `exercise.html?id=…` | 30 exercises with filters; each has a how-to, muscles, your best and a history chart |

## Features
- UZ / RU / EN, dark / light mode, mobile-first, keyboard and screen-reader friendly (charts have a table version)
- Comes with 6 weeks of demo workouts that get gradually heavier, so the charts show real progress
- Backup: save the data to a file and load it back; reset to the demo data
- New exercises copy your sets from the last time you did them

## Code
- `js/data-exercises.js`: the 30 exercises · `js/fit.js`: storage, demo data and all calculations
- `js/layout.js`: header, footer, formatting, rings, dialog · `js/charts.js`: SVG charts
- `js/pages/*.js`: one file per page

Run locally: `node ../_shared/serve.mjs . 5176`.
