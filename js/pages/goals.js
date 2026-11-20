/* Goals: weekly targets (workouts, minutes, volume, km). Each shows this
   week's progress, the last 8 weeks as hit/missed squares, and can be
   switched on/off and changed with a stepper. Saved straight away. */
(function () {
  "use strict";
  const { t } = Core;
  const { el, icon } = Site;
  const $ = (id) => document.getElementById(id);

  // step and limits for each goal's stepper
  const CONF = {
    workouts: { step: 1, min: 1, max: 14, fmt: (v) => Site.num(v), unit: "" },
    minutes: { step: 15, min: 15, max: 1200, fmt: (v) => Site.num(v), unit: "min" },
    volume: { step: 1000, min: 1000, max: 100000, fmt: (v) => Site.num(v), unit: "kg" },
    km: { step: 1, min: 1, max: 300, fmt: (v) => Site.num(v, v % 1 ? 1 : 0), unit: "km" },
  };
  const shown = (key, v) => CONF[key].fmt(v) + (CONF[key].unit ? " " + t("unit." + CONF[key].unit) : "");

  function goalCard(key) {
    const g = Fit.goals()[key];
    const conf = CONF[key];
    const history = Fit.goalHistory(key, 8);
    const now = history[history.length - 1];
    const pct = Math.min(100, Math.round((now.value / g.target) * 100));
    const done = g.on && now.value >= g.target;
    const inputId = "goal-" + key;
    const titleId = "goalTitle-" + key;

    const setTarget = (v) => {
      const clamped = Math.min(conf.max, Math.max(conf.min, Math.round(v / conf.step) * conf.step || conf.min));
      Fit.setGoal(key, { target: clamped });
    };

    return el("article", { class: "goal" + (g.on ? "" : " is-off") + (done ? " is-done" : ""), "aria-labelledby": titleId, "data-goal": key },
      el("div", { class: "goal-head" },
        el("h2", { id: titleId, text: t("goal." + key) }),
        el("label", { class: "switch" },
          el("input", { type: "checkbox", role: "switch", checked: g.on, onchange: (e) => Fit.setGoal(key, { on: e.target.checked }) }),
          el("span", { text: t("goals.on") })
        )
      ),
      g.on && el("div", { class: "goal-body" },
        el("p", { class: "goal-now" },
          el("strong", { text: shown(key, now.value) }),
          el("span", { text: " / " + shown(key, g.target) + " " + t("goals.thisWeek") })
        ),
        el("div", { class: "bar", role: "progressbar", "aria-valuemin": 0, "aria-valuemax": 100, "aria-valuenow": pct, "aria-labelledby": titleId },
          el("span", { class: "bar-fill", style: `width:${pct}%` })
        ),
        // A calm message when the goal is reached (no motion needed to understand it).
        done && el("p", { class: "goal-done", role: "status" }, icon("trophy", 18), el("span", { text: t("goals.done") })),
        !done && el("p", { class: "hint", text: t("goals.left", { value: shown(key, Math.max(0, g.target - now.value)) }) }),

        el("div", { class: "field goal-edit" },
          el("label", { for: inputId, text: t("goals.target") }),
          el("div", { class: "stepper" },
            el("button", { type: "button", class: "icon-btn", "aria-label": t("goals.less"), disabled: g.target <= conf.min, onclick: () => setTarget(g.target - conf.step) }, icon("minus", 18)),
            el("input", {
              id: inputId, type: "number", class: "input", min: conf.min, max: conf.max, step: conf.step, value: g.target, inputmode: "numeric",
              onchange: (e) => setTarget(Number(e.target.value)),
            }),
            el("button", { type: "button", class: "icon-btn", "aria-label": t("goals.more"), disabled: g.target >= conf.max, onclick: () => setTarget(g.target + conf.step) }, icon("plus", 18))
          )
        ),

        el("div", { class: "goal-history" },
          el("p", { class: "field-label", text: t("goals.history") }),
          el("ol", { class: "squares" },
            history.map((w) => el("li", {
              class: "square" + (w.current ? " is-current" : w.hit ? " is-hit" : " is-miss"),
              title: Site.weekLabel(w.start) + ": " + shown(key, w.value),
            },
              el("span", { class: "visually-hidden", text: Site.weekLabel(w.start) + ": " + shown(key, w.value) + ", " + t(w.current ? "goals.inProgress" : w.hit ? "goals.hit" : "goals.missed") }),
              el("span", { "aria-hidden": "true" }, w.current ? "" : w.hit ? icon("check", 14) : "")
            ))
          ),
          el("p", { class: "hint", text: t("goals.hitCount", { count: history.filter((w) => !w.current && w.hit).length, total: history.length - 1 }) })
        )
      )
    );
  }

  function render() {
    // Keep focus on the same control after redrawing (e.g. after pressing +).
    const active = document.activeElement;
    const card = active && active.closest("[data-goal]");
    const focusKey = card && card.dataset.goal;
    const focusLabel = active && (active.getAttribute("aria-label") || active.type);
    $("goals").replaceChildren(...Object.keys(CONF).map(goalCard));
    if (focusKey) {
      const again = [...document.querySelectorAll(`[data-goal="${focusKey}"] button, [data-goal="${focusKey}"] input`)]
        .find((n) => (n.getAttribute("aria-label") || n.type) === focusLabel && !n.disabled);
      (again || document.getElementById("goal-" + focusKey) || document.querySelector(`[data-goal="${focusKey}"] input`)).focus();
    }
  }

  Site.start(render, { title: () => t("page.goals") });
})();
