/* One workout (workout.html?id=...): stats, exercises with every set,
   new records, and Edit / Repeat / Delete (with Undo). */
(function () {
  "use strict";
  const { t } = Core;
  const { el, icon } = Site;
  const view = document.getElementById("view");
  const params = new URLSearchParams(location.search);
  const id = params.get("id");
  let deleted = null; // the removed workout, kept for Undo

  function notFound() {
    view.replaceChildren(
      el("div", { class: "empty" },
        el("h1", { text: t("workout.notFound") }),
        el("p", { text: t("workout.notFoundText") }),
        el("a", { class: "btn", href: "log.html", text: t("action.back") })
      )
    );
  }

  function deletedView() {
    view.replaceChildren(
      el("div", { class: "empty", role: "status" },
        el("h1", { id: "delTitle", tabindex: "-1", text: t("workout.deleted") }),
        el("p", { text: Fit.workoutName(deleted) + " · " + Site.date(deleted.date) }),
        el("div", { class: "form-actions" },
          el("button", {
            type: "button", class: "btn", text: t("action.undo"),
            onclick: () => {
              Fit.upsert(deleted);
              deleted = null;
              render();
              Core.toast(t("workout.restored"));
            },
          }),
          el("a", { class: "btn btn-ghost", href: "log.html", text: t("action.back") })
        )
      )
    );
    document.getElementById("delTitle").focus();
  }

  function stat(label, value) {
    return el("div", { class: "stat" }, el("dt", { text: label }), el("dd", { text: value }));
  }

  function render() {
    if (deleted) return deletedView();
    const w = Fit.get(id);
    if (!w) return notFound();
    const records = Fit.records();

    const stats = [stat(t("stat.duration"), Site.duration(w.duration)), stat(t("field.feel"), w.feel + "/5 · " + Site.feelText(w.feel))];
    if (w.type === "strength") {
      stats.push(stat(t("stat.sets"), Site.num(Fit.setsCount(w))), stat(t("stat.volume"), Site.unit(Fit.volume(w), "kg")));
    }
    if (w.type === "cardio" && w.cardio) {
      stats.push(stat(t("stat.distance"), Site.unit(w.cardio.km, "km", 1)), stat(Site.rateLabel(w), Site.rate(w)));
    }
    stats.push(stat(t("stat.kcal"), "≈ " + Site.unit(Fit.kcal(w), "kcal")));

    const exercises = w.exercises.map((e) => {
      const ex = Fit.exercise(e.exId);
      const pr = records.get(ex.id);
      const isPr = pr && pr.workoutId === w.id;
      const valueHead = ex.kind === "time" ? t("field.seconds") : t("field.reps");
      return el("section", { class: "ex-block" },
        el("h3", null,
          el("a", { href: "exercise.html?id=" + ex.id, text: Fit.exName(ex) }),
          isPr && el("span", { class: "pr-badge" }, icon("trophy", 14), el("span", { text: t("workout.pr") }))
        ),
        el("table", { class: "sets-table" },
          el("thead", null, el("tr", null,
            el("th", { scope: "col", text: t("field.set") }),
            el("th", { scope: "col", text: valueHead }),
            ex.kind !== "time" && el("th", { scope: "col", text: t("field.kg") })
          )),
          el("tbody", null, e.sets.map((s, i) => el("tr", null,
            el("th", { scope: "row", text: String(i + 1) }),
            el("td", { text: Site.num(s.reps) }),
            ex.kind !== "time" && el("td", { text: s.kg ? Site.num(s.kg, s.kg % 1 ? 1 : 0) : "—" })
          )))
        )
      );
    });

    const cardioEx = w.cardio && Fit.exercise(w.cardio.exId);
    view.replaceChildren(
      el("a", { href: "log.html", class: "back-link", text: t("action.back") }),
      params.get("saved") && el("p", { class: "notice notice-ok", role: "status", text: t("workout.saved") }),
      el("div", { class: "workout-head" },
        Site.typeTag(w.type),
        el("h1", { text: Fit.workoutName(w) }),
        el("p", { class: "workout-when", text: Site.date(w.date, { weekday: true, year: true }) + (w.time ? " · " + w.time : "") })
      ),
      el("dl", { class: "stats" }, stats),
      cardioEx && el("p", { class: "cardio-line" }, el("a", { href: "exercise.html?id=" + cardioEx.id, text: Fit.exName(cardioEx) })),
      exercises.length > 0 && el("section", { class: "section", "aria-labelledby": "exTitle" },
        el("h2", { id: "exTitle", text: t("edit.exercises") }),
        el("div", { class: "ex-blocks" }, exercises)
      ),
      w.notes && el("section", { class: "section notes", "aria-labelledby": "notesTitle" },
        el("h2", { id: "notesTitle", text: t("field.notes") }),
        el("p", { text: w.notes })
      ),
      el("div", { class: "form-actions" },
        el("a", { class: "btn", href: "edit.html?id=" + encodeURIComponent(w.id) }, icon("edit", 18), el("span", { text: t("action.edit") })),
        el("a", { class: "btn btn-ghost", href: "edit.html?copy=" + encodeURIComponent(w.id) }, icon("copy", 18), el("span", { text: t("action.repeat") })),
        el("button", {
          type: "button", class: "btn btn-danger-ghost",
          onclick: () => {
            deleted = Fit.remove(w.id);
            render();
          },
        }, icon("trash", 18), el("span", { text: t("action.delete") }))
      )
    );
  }

  Site.start(render, {
    title: () => {
      const w = Fit.get(id);
      return w ? Fit.workoutName(w) : t("workout.notFound");
    },
  });
})();
