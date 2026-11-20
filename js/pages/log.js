/* Log: every workout, grouped by week, newest first. Filters for type,
   dates and search; they're kept in the URL (log.html?type=cardio&q=run). */
(function () {
  "use strict";
  const { t } = Core;
  const { el } = Site;
  const $ = (id) => document.getElementById(id);
  const form = $("filters");

  const params = new URLSearchParams(location.search);
  const state = {
    q: params.get("q") || "",
    types: (params.get("type") || "").split(",").filter((x) => Fit.TYPES.includes(x)),
    from: Fit.dates.isDate(params.get("from")) ? params.get("from") : "",
    to: Fit.dates.isDate(params.get("to")) ? params.get("to") : "",
  };

  function writeURL() {
    const p = new URLSearchParams();
    if (state.q) p.set("q", state.q);
    if (state.types.length) p.set("type", state.types.join(","));
    if (state.from) p.set("from", state.from);
    if (state.to) p.set("to", state.to);
    history.replaceState(null, "", location.pathname + (p.toString() ? "?" + p : ""));
  }

  // Search looks in the name, the notes and the exercise names (any language).
  const norm = (s) => s.toLowerCase().replace(/['ʻʼ‘’`]/g, "").replace(/ё/g, "е");
  function matches(w, q) {
    const words = norm(q).trim().split(/\s+/).filter(Boolean);
    if (!words.length) return true;
    const hay = norm([
      Fit.workoutName(w), w.notes, t("type." + w.type),
      ...w.exercises.flatMap((e) => Object.values(Fit.exercise(e.exId).name)),
      ...(w.cardio ? Object.values(Fit.exercise(w.cardio.exId).name) : []),
    ].join(" "));
    return words.every((word) => hay.includes(word));
  }

  const badRange = () => state.from && state.to && state.from > state.to;

  function filtered() {
    return Fit.all().filter((w) =>
      (!state.types.length || state.types.includes(w.type)) &&
      (!state.from || badRange() || w.date >= state.from) &&
      (!state.to || badRange() || w.date <= state.to) &&
      matches(w, state.q)
    );
  }

  function renderChips() {
    $("typeChips").replaceChildren(
      ...Fit.TYPES.map((type) =>
        el("label", { class: "chip type-" + type },
          el("input", { type: "checkbox", name: "type", value: type, checked: state.types.includes(type) }),
          Site.icon(type, 16),
          el("span", { text: t("type." + type) })
        )
      )
    );
  }

  function renderList() {
    const list = filtered();
    $("resultCount").textContent = t("log.count", { count: list.length });
    $("empty").hidden = list.length > 0;
    $("dateError").textContent = badRange() ? t("filters.dateError") : "";
    form.to.setAttribute("aria-invalid", String(Boolean(badRange())));

    // Group by week (Monday start) with a small total per week.
    const groups = new Map();
    list.forEach((w) => {
      const start = Fit.dates.weekStart(w.date);
      if (!groups.has(start)) groups.set(start, []);
      groups.get(start).push(w);
    });
    $("weeks").replaceChildren(
      ...[...groups.entries()].map(([start, items]) => {
        const minutes = items.reduce((s, w) => s + w.duration, 0);
        const id = "wk-" + start;
        return el("section", { class: "week-group", "aria-labelledby": id },
          el("div", { class: "week-head" },
            el("h2", { id, text: Site.weekLabel(start) }),
            el("p", { class: "week-total", text: t("log.weekTotal", { count: items.length, time: Site.duration(minutes) }) })
          ),
          el("div", { class: "workout-list" }, items.map(Site.workoutCard))
        );
      })
    );
  }

  function render() {
    form.q.value = state.q;
    form.from.value = state.from;
    form.to.value = state.to;
    renderChips();
    renderList();
  }

  let timer = 0;
  form.addEventListener("input", (e) => {
    state.q = form.q.value.trim();
    state.types = [...form.querySelectorAll('[name="type"]:checked')].map((b) => b.value);
    state.from = form.from.value;
    state.to = form.to.value;
    clearTimeout(timer);
    const apply = () => {
      writeURL();
      renderList();
    };
    if (e.target === form.q) timer = setTimeout(apply, 200);
    else apply();
  });
  form.addEventListener("submit", (e) => e.preventDefault());

  const clearAll = () => {
    Object.assign(state, { q: "", types: [], from: "", to: "" });
    writeURL();
    render();
    form.q.focus();
  };
  $("clear").addEventListener("click", clearAll);
  $("emptyClear").addEventListener("click", clearAll);

  Site.start(render, { title: () => t("page.log"), onChange: renderList });
})();
