/* Progress: totals and charts for the last 4, 8 or 12 weeks, and personal
   records per exercise. */
(function () {
  "use strict";
  const { t, store } = Core;
  const { el } = Site;
  const $ = (id) => document.getElementById(id);
  const RANGES = [4, 8, 12];
  let weeks = RANGES.includes(Number(store.get("range", 8))) ? Number(store.get("range", 8)) : 8;

  function renderRange() {
    $("rangeRadios").replaceChildren(
      ...RANGES.map((n) =>
        el("label", null,
          el("input", { type: "radio", name: "range", value: n, checked: n === weeks, class: "visually-hidden" }),
          el("span", { text: t("progress.weeks", { count: n }) })
        )
      )
    );
  }
  $("rangeRadios").addEventListener("change", (e) => {
    weeks = Number(e.target.value);
    store.set("range", String(weeks));
    renderCharts();
  });

  function renderCharts() {
    $("rangeRadios").querySelectorAll("input").forEach((i) => {
      i.checked = Number(i.value) === weeks;
      i.parentElement.classList.toggle("is-on", i.checked);
    });
    const data = Fit.weekly(weeks);
    const goals = Fit.goals();
    const sum = (k) => data.reduce((s, w) => s + w[k], 0);

    $("totals").replaceChildren(
      ...[
        [t("goal.workouts"), Site.num(sum("count"))],
        [t("goal.minutes"), Site.duration(sum("minutes"))],
        [t("goal.volume"), Site.unit(sum("volume"), "kg")],
        [t("goal.km"), Site.unit(sum("km"), "km", 1)],
      ].map(([label, value]) => el("div", { class: "total" }, el("span", { class: "total-value", text: value }), el("span", { class: "total-label", text: label })))
    );

    const items = (key, fmt) => data.map((w) => ({
      label: Site.weekLabel(w.start), short: Site.shortDate(w.start), value: w[key], tip: fmt(w[key]),
    }));

    $("minChart").replaceChildren(
      Charts.bars(items("minutes", (v) => Site.unit(v, "min")), {
        title: t("progress.minutes"), format: (v) => Site.num(v), goal: goals.minutes.on ? goals.minutes.target : 0, valueHeader: t("goal.minutes"),
      })
    );
    $("volChart").replaceChildren(
      Charts.line(items("volume", (v) => Site.unit(v, "kg")), {
        title: t("progress.volume"), format: (v) => (v >= 1000 ? Site.num(v / 1000, v % 1000 ? 1 : 0) + "k" : Site.num(v)), valueHeader: t("goal.volume"),
      })
    );

    const byType = Fit.TYPES.map((type) => {
      const count = data.reduce((s, w) => s + w.byType[type], 0);
      return { label: t("type." + type), value: count, tip: t("progress.typeCount", { count }), cls: "type-" + type };
    });
    $("typeChart").replaceChildren(Charts.donut(byType, { title: t("progress.types"), centre: Site.num(sum("count")) }));
  }

  // Personal records: best result per exercise, newest first.
  function renderRecords() {
    const recs = [...Fit.records().values()].sort((a, b) => b.date.localeCompare(a.date));
    if (!recs.length) {
      $("records").replaceChildren(el("p", { class: "hint", text: t("progress.noRecords") }));
      return;
    }
    const best = (r) => {
      const ex = Fit.exercise(r.exId);
      if (ex.kind === "weight") return Site.unit(r.detail.kg, "kg", r.detail.kg % 1 ? 1 : 0) + " × " + r.detail.reps;
      if (ex.kind === "time") return Site.unit(r.value, "sec");
      if (ex.kind === "cardio") return Site.unit(r.value, "km", 1);
      return t("progress.reps", { count: r.value });
    };
    $("records").replaceChildren(
      el("table", { class: "records-table" },
        el("thead", null, el("tr", null,
          el("th", { scope: "col", text: t("progress.exercise") }),
          el("th", { scope: "col", text: t("progress.best") }),
          el("th", { scope: "col", text: t("field.date") })
        )),
        el("tbody", null, recs.map((r) => {
          const ex = Fit.exercise(r.exId);
          return el("tr", null,
            el("th", { scope: "row" }, el("a", { href: "exercise.html?id=" + ex.id, text: Fit.exName(ex) })),
            el("td", { text: best(r) }),
            el("td", null, el("a", { href: "workout.html?id=" + encodeURIComponent(r.workoutId), text: Site.date(r.date) }))
          );
        }))
      )
    );
  }

  function render() {
    renderRange();
    renderCharts();
    renderRecords();
  }

  Site.start(render, { title: () => t("page.progress") });
})();
