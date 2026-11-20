/* One exercise (exercise.html?id=3): how to do it, muscles worked, your
   personal best, a chart of your history and the recent sessions. */
(function () {
  "use strict";
  const { t } = Core;
  const { el, icon } = Site;
  const view = document.getElementById("view");
  const ex = Fit.exercise(new URLSearchParams(location.search).get("id"));

  const valueText = (v) =>
    ex.kind === "weight" ? Site.unit(v, "kg", v % 1 ? 1 : 0)
      : ex.kind === "time" ? Site.unit(v, "sec")
        : ex.kind === "cardio" ? Site.unit(v, "km", 1)
          : t("progress.reps", { count: v });

  function render() {
    if (!ex) {
      view.replaceChildren(el("div", { class: "empty" },
        el("h1", { text: t("ex.notFound") }),
        el("a", { class: "btn", href: "exercises.html", text: t("action.back") })
      ));
      return;
    }
    const points = Fit.history(ex.id);
    const pr = Fit.records().get(ex.id);
    const metricKey = { weight: "ex.metricKg", body: "ex.metricReps", time: "ex.metricTime", cardio: "ex.metricKm" }[ex.kind];

    view.replaceChildren(
      el("a", { href: "exercises.html", class: "back-link", text: t("page.exercises") }),
      el("div", { class: "ex-head group-" + ex.group },
        el("span", { class: "ex-icon" }, icon(ex.kind === "cardio" ? "cardio" : "strength", 28)),
        el("div", null,
          el("h1", { text: Fit.exName(ex) }),
          el("p", { class: "ex-meta", text: t("muscle." + ex.group) + " · " + t("equip." + ex.equipment) })
        )
      ),
      el("div", { class: "ex-info" },
        el("section", { "aria-labelledby": "howTitle" },
          el("h2", { id: "howTitle", text: t("ex.how") }),
          el("p", { text: Fit.exHow(ex) })
        ),
        el("section", { "aria-labelledby": "musTitle" },
          el("h2", { id: "musTitle", text: t("ex.muscles") }),
          el("ul", { class: "muscle-list" }, ex.muscles.map((m, i) => el("li", { class: i === 0 ? "is-main" : null, text: t("mus." + m) })))
        ),
        el("section", { class: "ex-best", "aria-labelledby": "bestTitle" },
          el("h2", { id: "bestTitle", text: t("ex.yourBest") }),
          pr
            ? el("p", null,
              icon("trophy", 20),
              el("strong", { text: valueText(pr.value) + (ex.kind === "weight" ? " × " + pr.detail.reps : "") }),
              el("a", { href: "workout.html?id=" + encodeURIComponent(pr.workoutId), text: Site.date(pr.date, { year: true }) })
            )
            : el("p", { class: "hint", text: t("ex.noBest") })
        )
      ),
      el("section", { class: "section chart-section", "aria-labelledby": "histTitle" },
        el("h2", { id: "histTitle", text: t("ex.history") + " — " + t(metricKey) }),
        points.length > 1
          ? Charts.line(points.map((p) => ({ label: Site.date(p.date), short: Site.shortDate(p.date), value: p.value, tip: valueText(p.value) })), {
            title: t("ex.history"), format: (v) => Site.num(v), valueHeader: t(metricKey),
          })
          : el("p", { class: "hint", text: t(points.length ? "ex.oneSession" : "ex.noHistory") })
      ),
      points.length > 0 && el("section", { class: "section", "aria-labelledby": "recentTitle" },
        el("h2", { id: "recentTitle", text: t("ex.recent") }),
        el("ul", { class: "session-list" },
          points.slice(-5).reverse().map((p) => el("li", null,
            el("a", { href: "workout.html?id=" + encodeURIComponent(p.workoutId), text: Site.date(p.date, { weekday: true }) }),
            el("span", { text: p.sets ? p.sets.map((s) => (ex.kind === "weight" ? `${s.reps}×${Site.num(s.kg, s.kg % 1 ? 1 : 0)}` : String(s.reps))).join(", ") : valueText(p.value) })
          ))
        )
      ),
      el("div", { class: "form-actions" },
        el("a", { class: "btn", href: "edit.html?ex=" + ex.id }, icon("plus", 18), el("span", { text: t("ex.start") }))
      )
    );
  }

  Site.start(render, { title: () => (ex ? Fit.exName(ex) : t("ex.notFound")) });
})();
