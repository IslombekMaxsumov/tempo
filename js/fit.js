/* Fitness logic: workouts, goals, demo data and every calculation
   (volume, calories, pace, streaks, records, weekly totals).
   Saved in localStorage through Core.store. No backend.

   A workout:
   { id, type: "strength"|"cardio"|"sport"|"flex", name, nameKey, date: "YYYY-MM-DD",
     time: "HH:MM", duration (minutes), feel (1–5), notes,
     exercises: [{ exId, sets: [{ reps, kg }] }],   // strength
     cardio: { exId, km } }                        // cardio
   nameKey is only used by demo workouts, so their names follow the language. */
(function () {
  "use strict";
  const { store, t } = Core;
  const EX = window.EXERCISES;
  const exById = new Map(EX.map((e) => [e.id, e]));
  const TYPES = ["strength", "cardio", "sport", "flex"];
  const BODY_KG = 70; // body weight used for calorie estimates

  /* ---------- dates ("YYYY-MM-DD", local time) ---------- */
  const pad = (n) => String(n).padStart(2, "0");
  const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const parse = (s) => {
    const [y, m, d] = s.split("-").map(Number);
    return new Date(y, m - 1, d, 12); // noon: safe from daylight-saving jumps
  };
  const today = () => iso(new Date());
  const addDays = (s, n) => {
    const d = parse(s);
    d.setDate(d.getDate() + n);
    return iso(d);
  };
  // Weeks start on Monday.
  const weekStart = (s) => {
    const d = parse(s);
    return addDays(s, -((d.getDay() + 6) % 7));
  };
  const isDate = (s) => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(parse(s));

  /* ---------- storage ---------- */
  const DEFAULT_GOALS = {
    workouts: { on: true, target: 4 },
    minutes: { on: true, target: 180 },
    volume: { on: true, target: 12000 },
    km: { on: false, target: 15 },
  };

  function emit() {
    window.dispatchEvent(new Event("fit:change"));
  }
  function onChange(fn) {
    window.addEventListener("fit:change", fn);
    window.addEventListener("storage", (e) => {
      if (e.key && e.key.startsWith(window.APP_NS + ":") && !/:(lang|theme)$/.test(e.key)) fn();
    });
  }

  // Keeps only well-formed workouts (the data may come from an imported file).
  function clean(list) {
    if (!Array.isArray(list)) return [];
    return list.filter((w) =>
      w && typeof w.id === "string" && TYPES.includes(w.type) && isDate(w.date) &&
      Number.isFinite(w.duration) && w.duration > 0
    ).map((w) => ({
      id: w.id, type: w.type, name: String(w.name || ""), nameKey: w.nameKey || "",
      date: w.date, time: /^\d{2}:\d{2}$/.test(w.time) ? w.time : "",
      duration: Math.round(w.duration), feel: Math.min(5, Math.max(1, Math.round(w.feel) || 3)),
      notes: String(w.notes || ""),
      exercises: Array.isArray(w.exercises) ? w.exercises.filter((e) => exById.has(e.exId) && Array.isArray(e.sets))
        .map((e) => ({ exId: e.exId, sets: e.sets.map((s) => ({ reps: Math.max(0, Number(s.reps) || 0), kg: Math.max(0, Number(s.kg) || 0) })) })) : [],
      cardio: w.cardio && exById.has(w.cardio.exId) ? { exId: w.cardio.exId, km: Math.max(0, Number(w.cardio.km) || 0) } : null,
    }));
  }

  function all() {
    if (!store.get("seeded", "")) seedDemo();
    return clean(store.getJSON("workouts", [])).sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));
  }
  function save(list) {
    store.setJSON("workouts", list);
    emit();
  }
  const get = (id) => all().find((w) => w.id === id) || null;

  function upsert(workout) {
    const list = all().filter((w) => w.id !== workout.id);
    list.push(workout);
    save(list);
    return workout;
  }
  // Returns the removed workout so it can be put back (Undo).
  function remove(id) {
    const w = get(id);
    save(all().filter((x) => x.id !== id));
    return w;
  }
  const newId = () => "w" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

  function goals() {
    const saved = store.getJSON("goals", null) || {};
    const out = {};
    for (const [k, def] of Object.entries(DEFAULT_GOALS)) {
      const g = saved[k] || {};
      out[k] = { on: typeof g.on === "boolean" ? g.on : def.on, target: Number.isFinite(g.target) && g.target > 0 ? g.target : def.target };
    }
    return out;
  }
  function setGoal(key, patch) {
    const g = goals();
    g[key] = { ...g[key], ...patch };
    store.setJSON("goals", g);
    emit();
  }

  /* ---------- numbers for one workout ---------- */
  const exercise = (id) => exById.get(Number(id));
  const exName = (ex) => ex.name[Core.getLang()] || ex.name.en;
  const exHow = (ex) => ex.how[Core.getLang()] || ex.how.en;
  const workoutName = (w) => w.name || (w.nameKey ? t(w.nameKey) : t("type." + w.type));

  const setsCount = (w) => w.exercises.reduce((n, e) => n + e.sets.length, 0);
  // Volume = reps × kg over all sets ("time" exercises like the plank don't count).
  const volume = (w) => w.exercises.reduce((sum, e) => {
    const ex = exercise(e.exId);
    if (!ex || ex.kind === "time") return sum;
    return sum + e.sets.reduce((s, set) => s + set.reps * set.kg, 0);
  }, 0);
  const km = (w) => (w.type === "cardio" && w.cardio ? w.cardio.km : 0);
  // Minutes per km, or 0.
  const pace = (w) => (km(w) > 0 ? w.duration / km(w) : 0);
  // Calories ≈ MET × body weight × hours (a common rough formula).
  function kcal(w) {
    const met = { strength: 5, sport: 7, flex: 2.5 }[w.type] ||
      (w.cardio && exercise(w.cardio.exId) ? exercise(w.cardio.exId).met : 8);
    return Math.round(met * BODY_KG * (w.duration / 60));
  }

  /* ---------- weeks, streaks, goals ---------- */
  // Totals for the last n weeks (oldest first), ending with the current week.
  function weekly(n, list = all()) {
    const thisWeek = weekStart(today());
    const weeks = [];
    for (let i = n - 1; i >= 0; i--) {
      const start = addDays(thisWeek, -7 * i);
      weeks.push({ start, end: addDays(start, 6), count: 0, minutes: 0, volume: 0, km: 0, byType: { strength: 0, cardio: 0, sport: 0, flex: 0 } });
    }
    const byStart = new Map(weeks.map((w) => [w.start, w]));
    list.forEach((w) => {
      const wk = byStart.get(weekStart(w.date));
      if (!wk) return;
      wk.count++;
      wk.minutes += w.duration;
      wk.volume += volume(w);
      wk.km += km(w);
      wk.byType[w.type]++;
    });
    return weeks;
  }

  // Days in a row with at least one workout. Today counts if you trained;
  // if not (yet), the streak runs up to yesterday.
  function streak(list = all()) {
    const days = new Set(list.map((w) => w.date));
    let day = days.has(today()) ? today() : addDays(today(), -1);
    let current = 0;
    while (days.has(day)) {
      current++;
      day = addDays(day, -1);
    }
    let best = 0;
    let run = 0;
    let prev = null;
    [...days].sort().forEach((d) => {
      run = prev && addDays(prev, 1) === d ? run + 1 : 1;
      best = Math.max(best, run);
      prev = d;
    });
    return { current, best: Math.max(best, current) };
  }

  const GOAL_VALUE = { workouts: (wk) => wk.count, minutes: (wk) => wk.minutes, volume: (wk) => wk.volume, km: (wk) => wk.km };
  // Hit or missed for each of the last n weeks (the current week is "in progress").
  function goalHistory(key, n = 8) {
    const g = goals()[key];
    return weekly(n).map((wk, i, arr) => {
      const value = GOAL_VALUE[key](wk);
      return { ...wk, value, hit: value >= g.target, current: i === arr.length - 1 };
    });
  }

  /* ---------- records ---------- */
  // Best result per exercise: heaviest set (weight), most reps (body),
  // longest hold (time) or longest distance (cardio).
  function records(list = all()) {
    const best = new Map();
    const consider = (exId, value, detail, date, workoutId) => {
      const cur = best.get(exId);
      if (!cur || value > cur.value) best.set(exId, { exId, value, detail, date, workoutId });
    };
    // Oldest first, and only a strictly better result counts, so a tie keeps
    // the record with the workout that set it first.
    [...list].sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)).forEach((w) => {
      w.exercises.forEach((e) => {
        const ex = exercise(e.exId);
        e.sets.forEach((s) => {
          if (ex.kind === "weight") consider(e.exId, s.kg, s, w.date, w.id);
          else consider(e.exId, s.reps, s, w.date, w.id);
        });
      });
      if (w.cardio) consider(w.cardio.exId, w.cardio.km, { km: w.cardio.km, minutes: w.duration }, w.date, w.id);
    });
    return best;
  }

  // One point per workout that used this exercise: its best value that day.
  function history(exId, list = all()) {
    const ex = exercise(exId);
    const points = [];
    list.forEach((w) => {
      if (ex.kind === "cardio") {
        if (w.cardio && w.cardio.exId === ex.id) points.push({ date: w.date, value: w.cardio.km, workoutId: w.id, minutes: w.duration });
        return;
      }
      const e = w.exercises.find((x) => x.exId === ex.id);
      if (!e || !e.sets.length) return;
      const value = Math.max(...e.sets.map((s) => (ex.kind === "weight" ? s.kg : s.reps)));
      points.push({ date: w.date, value, workoutId: w.id, sets: e.sets });
    });
    return points.sort((a, b) => a.date.localeCompare(b.date));
  }

  /* ---------- demo data: 6 weeks that get a little heavier each week ---------- */
  function rng(seed) {
    return () => {
      seed = (seed + 0x6d2b79f5) | 0;
      let r = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
      return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
  }
  function seedDemo() {
    const rand = rng(20261120);
    const round = (kg, step = 2.5) => Math.round(kg / step) * step;
    const sets = (n, reps, kg) => Array.from({ length: n }, () => ({ reps, kg }));
    const list = [];
    const thisWeek = weekStart(today());
    for (let k = 0; k < 6; k++) {
      const start = addDays(thisWeek, -7 * (5 - k)); // k = 0 is 5 weeks ago
      const plan = [
        [0, "strength", "demo.push", "18:30", () => [
          { exId: 1, sets: sets(4, 8, round(50 + 2.5 * k)) },
          { exId: 14, sets: sets(3, 8, round(30 + 1.25 * k)) },
          { exId: 15, sets: sets(3, 12, 8) },
          { exId: 20, sets: sets(3, 12, round(20 + k)) },
        ]],
        [1, "cardio", "demo.run", "07:00", null],
        [2, "cardio", "demo.ride", "18:00", null],
        [3, "strength", "demo.pull", "18:30", () => [
          { exId: 6, sets: sets(3, 5, round(80 + 5 * k)) },
          { exId: 5, sets: sets(3, 6 + Math.floor(k / 2), 0) },
          { exId: 7, sets: sets(3, 8, round(45 + 2.5 * k)) },
          { exId: 17, sets: sets(3, 10, round(12 + 0.5 * k, 1)) },
        ]],
        [5, "strength", "demo.legs", "10:00", () => [
          { exId: 9, sets: sets(4, 6, round(60 + 5 * k)) },
          { exId: 12, sets: sets(3, 8, round(50 + 2.5 * k)) },
          { exId: 10, sets: sets(3, 10, 12) },
          { exId: 21, sets: sets(3, 45 + 5 * k, 0) },
        ]],
        [6, k % 2 ? "sport" : "flex", k % 2 ? "demo.football" : "demo.yoga", "17:00", null],
      ];
      plan.forEach(([offset, type, nameKey, time, makeExercises], i) => {
        const date = addDays(start, offset);
        if (date >= today()) return; // today is left for the visitor to log
        if (offset === 2 && rand() < 0.6) return; // the bike ride is occasional
        if (rand() < 0.1) return; // some days get skipped, like real life
        const w = {
          id: `demo-${date}-${i}`, type, name: "", nameKey, date, time,
          duration: 0, feel: 3 + Math.floor(rand() * 3), notes: "", exercises: [], cardio: null,
        };
        if (type === "strength") {
          w.exercises = makeExercises();
          w.duration = Math.round(setsCount(w) * 3.2 + 8);
        } else if (nameKey === "demo.run") {
          const dist = Math.round((4.5 + rand() * 2 + k * 0.2) * 10) / 10;
          w.cardio = { exId: 25, km: dist };
          w.duration = Math.round(dist * (6.2 - k * 0.08 + rand() * 0.3));
        } else if (nameKey === "demo.ride") {
          const dist = Math.round(14 + rand() * 8);
          w.cardio = { exId: 26, km: dist };
          w.duration = Math.round(dist * 2.6);
        } else {
          w.duration = type === "sport" ? 75 : 40;
        }
        list.push(w);
      });
    }
    store.setJSON("workouts", list);
    store.set("seeded", "1");
  }

  function resetDemo() {
    store.set("seeded", "");
    store.setJSON("goals", DEFAULT_GOALS);
    all(); // re-seeds
    emit();
  }

  /* ---------- backup ---------- */
  function exportData() {
    return JSON.stringify({ app: "fitness", version: 1, exported: new Date().toISOString(), workouts: all(), goals: goals() }, null, 2);
  }
  // Returns the number of workouts imported, or throws if the file is not a backup.
  function importData(text) {
    const data = JSON.parse(text);
    if (!data || data.app !== "fitness" || !Array.isArray(data.workouts)) throw new Error("not a backup");
    const list = clean(data.workouts);
    store.setJSON("workouts", list);
    if (data.goals) store.setJSON("goals", data.goals);
    store.set("seeded", "1");
    emit();
    return list.length;
  }

  window.Fit = {
    TYPES, EX, MUSCLE_GROUPS: window.MUSCLE_GROUPS, EQUIPMENT: window.EQUIPMENT,
    dates: { iso, parse, today, addDays, weekStart, isDate },
    all, get, upsert, remove, newId, onChange,
    goals, setGoal,
    exercise, exName, exHow, workoutName,
    setsCount, volume, km, pace, kcal,
    weekly, streak, goalHistory, records, history,
    resetDemo, exportData, importData,
  };
})();
