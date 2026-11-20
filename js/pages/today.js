/* Today: greeting, this week's rings against the goals, streak, the week
   strip and the last 3 workouts. */
(function () {
  "use strict";
  const { t } = Core;
  const { el, icon } = Site;
  const $ = (id) => document.getElementById(id);

  function greeting() {
    const h = new Date().getHours();
    return t(h < 5 ? "today.night" : h < 12 ? "today.morning" : h < 18 ? "today.afternoon" : "today.evening");
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

    $("todayDate").textContent = Site.date(Fit.dates.today(), { weekday: true });
    $("greeting").textContent = greeting();
    $("emptyAll").hidden = list.length > 0;
    $("nudge").textContent = list.length ? nudge(week, goals) : "";

    // Rings: workouts, minutes and volume (or km) against the weekly goals.
    const third = goals.km.on && !goals.volume.on ? "km" : "volume";
    const rings = [
      ["workouts", week.count, (v) => Site.num(v)],
      ["minutes", week.minutes, (v) => Site.num(v)],
      [third, third === "km" ? week.km : week.volume, (v) => Site.num(v, third === "km" ? 1 : 0)],
    ];
    $("rings").replaceChildren(
      ...rings.map(([key, value, fmt]) => {
        const g = goals[key];
        return Site.ring({
          value, target: g.on ? g.target : 0, text: fmt(value),
          sub: g.on ? t("today.of", { target: fmt(g.target) }) : "",
          label: t("goal." + key),
        });
      })
    );

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
        return el("li", { class: "day" + (done.length ? " is-done" : "") + (isToday ? " is-today" : ""), "aria-current": isToday ? "date" : null },
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
