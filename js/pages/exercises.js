/* Exercise library: search (any language), muscle-group chips and an
   equipment filter. Filters live in the URL (exercises.html?group=legs). */
(function () {
  "use strict";
  const { t } = Core;
  const { el, icon } = Site;
  const $ = (id) => document.getElementById(id);
  const form = $("exFilters");
  const params = new URLSearchParams(location.search);
  const state = {
    q: params.get("q") || "",
    group: Fit.MUSCLE_GROUPS.includes(params.get("group")) ? params.get("group") : "",
    equipment: Fit.EQUIPMENT.includes(params.get("eq")) ? params.get("eq") : "",
  };
  const norm = (s) => s.toLowerCase().replace(/['ʻʼ‘’`"]/g, "").replace(/ё/g, "е");

  function writeURL() {
    const p = new URLSearchParams();
    if (state.q) p.set("q", state.q);
    if (state.group) p.set("group", state.group);
    if (state.equipment) p.set("eq", state.equipment);
    history.replaceState(null, "", location.pathname + (p.toString() ? "?" + p : ""));
  }

  function renderFilters() {
    form.q.value = state.q;
    $("groupChips").replaceChildren(
      ...["", ...Fit.MUSCLE_GROUPS].map((g) =>
        el("label", { class: "chip" },
          el("input", { type: "radio", name: "group", value: g, checked: state.group === g }),
          el("span", { text: g ? t("muscle." + g) : t("filters.all") })
        )
      )
    );
    $("equipment").replaceChildren(
      el("option", { value: "", text: t("filters.anyEquipment") }),
      ...Fit.EQUIPMENT.map((e) => el("option", { value: e, text: t("equip." + e) }))
    );
    $("equipment").value = state.equipment;
  }

  function renderGrid() {
    const words = norm(state.q).trim().split(/\s+/).filter(Boolean);
    const records = Fit.records();
    const list = Fit.EX.filter((ex) =>
      (!state.group || ex.group === state.group) &&
      (!state.equipment || ex.equipment === state.equipment) &&
      words.every((w) => norm(Object.values(ex.name).join(" ")).includes(w))
    ).sort((a, b) => Fit.exName(a).localeCompare(Fit.exName(b), Core.getLang()));

    $("resultCount").textContent = t("ex.count", { count: list.length });
    $("empty").hidden = list.length > 0;
    $("grid").replaceChildren(
      ...list.map((ex) => {
        const pr = records.get(ex.id);
        return el("li", null,
          el("a", { class: "ex-card group-" + ex.group, href: "exercise.html?id=" + ex.id },
            el("span", { class: "ex-icon" }, icon(ex.kind === "cardio" ? "cardio" : "strength", 22)),
            el("span", { class: "ex-name", text: Fit.exName(ex) }),
            el("span", { class: "ex-meta", text: t("muscle." + ex.group) + " · " + t("equip." + ex.equipment) }),
            pr && el("span", { class: "ex-pr" }, icon("trophy", 14), el("span", { text: t("ex.yourBest") + ": " + bestText(ex, pr) }))
          )
        );
      })
    );
  }

  function bestText(ex, pr) {
    if (ex.kind === "weight") return Site.unit(pr.detail.kg, "kg", pr.detail.kg % 1 ? 1 : 0);
    if (ex.kind === "time") return Site.unit(pr.value, "sec");
    if (ex.kind === "cardio") return Site.unit(pr.value, "km", 1);
    return t("progress.reps", { count: pr.value });
  }

  function render() {
    renderFilters();
    renderGrid();
  }

  let timer = 0;
  form.addEventListener("input", (e) => {
    state.q = form.q.value.trim();
    state.group = form.querySelector('[name="group"]:checked').value;
    state.equipment = $("equipment").value;
    clearTimeout(timer);
    const apply = () => {
      writeURL();
      renderGrid();
    };
    if (e.target === form.q) timer = setTimeout(apply, 200);
    else apply();
  });
  form.addEventListener("submit", (e) => e.preventDefault());
  $("emptyClear").addEventListener("click", () => {
    Object.assign(state, { q: "", group: "", equipment: "" });
    writeURL();
    render();
    form.q.focus();
  });

  Site.start(render, { title: () => t("page.exercises"), onChange: renderGrid });
})();
