/* Today: the training week number, one big number for this week (active
   minutes) with the other goals small beside it, streak, the week strip and
   the last 3 workouts. */
(function () {
  "use strict";
  const { t } = Core;
  const { el, icon } = Site;
  const $ = (id) => document.getElementById(id);

  // ISO week number (weeks start on Monday; week 1 holds the first Thursday).
  function isoWeek(isoDate) {
    const d = Fit.dates.parse(isoDate);
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7) + 3); // Thursday of this week
    const jan4 = new Date(d.getFullYear(), 0, 4, 12);
    return 1 + Math.round(((d - jan4) / 86400000 - 3 + ((jan4.getDay() + 6) % 7)) / 7);
  }

  // "2 more workouts to reach this week's goal", or a well-done message only
  // when every goal that is switched on has been reached.
  function nudge(week, goals) {
    const left = (key, value) => (goals[key].on ? goals[key].target - value : 0);
    if (left("workouts", week.count) > 0) return t("today.nudgeLeft", { count: left("workouts", week.count) });
    if (left("minutes", week.minutes) > 0) return t("today.nudgeMinutes", { minutes: Math.ceil(left("minutes", week.minutes)) });
    if (left("volume", week.volume) > 0) return t("today.nudgeVolume", { amount: Site.unit(left("volume", week.volume), "kg") });
    if (left("km", week.km) > 0) return t("today.nudgeKm", { amount: Site.unit(left("km", week.km), "km", 1) });
    return t("today.nudgeDone");
  }

  function render() {
    const list = Fit.all();
    const goals = Fit.goals();
    const [week] = Fit.weekly(1, list);

    // "Week 47" / "Day 5 of 7 · Friday 20 November", like a training plan.
    const today = Fit.dates.today();
    const dayN = ((Fit.dates.parse(today).getDay() + 6) % 7) + 1;
    $("greeting").textContent = t("today.weekNo", { n: isoWeek(today) });
    $("todayDate").textContent = t("today.dayLine", { n: dayN, date: Site.date(today, { weekday: true }) });
    $("emptyAll").hidden = list.length > 0;
    $("nudge").textContent = list.length ? nudge(week, goals) : "";

    // One hero number (active minutes this week), the other goals small beside it.
    const m = goals.minutes;
    const pct = m.on ? Math.min(100, Math.round((week.minutes / m.target) * 100)) : 0;
    const hero = el("div", { class: "hero-metric" },
      el("p", { class: "hero-label", id: "heroLabel", text: t("today.heroLabel") }),
      el("p", { class: "hero-value" }, Site.measure(week.minutes, "min")),
      m.on && el("p", { class: "hero-sub", text: t("today.ofGoal", { target: Site.unit(m.target, "min"), pct }) }),
      m.on && el("div", { class: "hero-bar", role: "progressbar", "aria-labelledby": "heroLabel", "aria-valuemin": 0, "aria-valuemax": 100, "aria-valuenow": pct },
        el("span", { class: "hero-fill" + (pct >= 100 ? " is-done" : ""), style: `width:${pct}%` }))
    );
    const third = goals.km.on && !goals.volume.on ? "km" : "volume";
    const small = [
      ["workouts", week.count, (v) => Site.num(v), ""],
      [third, third === "km" ? week.km : week.volume, (v) => Site.num(v, third === "km" ? 1 : 0), third === "km" ? "km" : "kg"],
    ].map(([key, value, fmt, u]) => {
      const g = goals[key];
      const ring = Site.ring({
        value, target: g.on ? g.target : 0, metric: key, text: Site.measure(value, u, key === "km" ? 1 : 0),
        sub: g.on ? t("today.of", { target: fmt(g.target) }) : "",
        label: t("goal." + key),
      });
      ring.classList.add("ring-small");
      return ring;
    });
    $("rings").replaceChildren(hero, el("div", { class: "side-metrics" }, small));

    // Streak
    const s = Fit.streak(list);
    $("streak").replaceChildren(
      el("span", { class: "streak-icon" }, icon("flame", 22)),
      el("span", { class: "streak-num", text: String(s.current) }),
      el("span", { class: "streak-text" },
        el("strong", { text: t("today.streakLabel", { count: s.current }) }),
        el("span", { text: t("today.best", { count: s.best }) })
      )
    );

    // Week strip: Monday to Sunday, a dot on training days.
    const start = Fit.dates.weekStart(Fit.dates.today());
    $("weekStrip").replaceChildren(
      ...Array.from({ length: 7 }, (_, i) => {
        const day = Fit.dates.addDays(start, i);
        const done = list.filter((w) => w.date === day);
        const isToday = day === Fit.dates.today();
        return el("li", { class: "day" + (done.length ? " is-done type-" + done[0].type : "") + (isToday ? " is-today" : ""), "aria-current": isToday ? "date" : null },
          el("span", { class: "day-name", "aria-hidden": "true", text: Site.dayShort(i) }),
          el("span", { class: "day-dot", "aria-hidden": "true" }, done.length ? icon("check", 14) : ""),
          el("span", { class: "visually-hidden", text: Site.date(day, { weekday: true }) + ": " + (done.length ? t("today.trained", { count: done.length }) : t("today.rest")) })
        );
      })
    );

    $("recent").replaceChildren(...list.slice(0, 3).map(Site.workoutCard));
  }

  Site.start(render, { title: () => t("page.today") });
})();
