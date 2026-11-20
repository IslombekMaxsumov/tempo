/* Add or edit a workout.
   edit.html            new workout
   edit.html?id=X       edit workout X
   edit.html?copy=X     new workout copied from X ("Repeat")
   edit.html?ex=3       new workout that starts with exercise 3

   Strength workouts have exercises with sets (reps × kg). Cardio workouts
   have an activity and a distance. A live summary updates while typing. */
(function () {
  "use strict";
  const { t } = Core;
  const { el, icon } = Site;
  const $ = (id) => document.getElementById(id);
  const form = $("wForm");
  const params = new URLSearchParams(location.search);
  const editId = params.get("id");
  const copyId = params.get("copy");
  const startEx = Fit.exercise(params.get("ex"));
  const CARDIO = Fit.EX.filter((e) => e.kind === "cardio");
  const nowTime = () => new Date().toTimeString().slice(0, 5);

  /* ---------- the workout being edited ---------- */
  let model;
  let dirty = false;
  const source = Fit.get(editId || copyId);

  if (editId && !source) {
    $("notFound").hidden = false;
    form.hidden = true;
  } else if (source) {
    model = JSON.parse(JSON.stringify(source));
    if (copyId) {
      model.id = Fit.newId();
      model.date = Fit.dates.today();
      model.time = nowTime();
    }
  } else {
    model = {
      id: Fit.newId(), type: startEx && startEx.kind === "cardio" ? "cardio" : "strength", name: "", nameKey: "",
      date: Fit.dates.today(), time: nowTime(), duration: 45, feel: 4, notes: "",
      exercises: [], cardio: { exId: startEx && startEx.kind === "cardio" ? startEx.id : CARDIO[0].id, km: 5 },
    };
    if (startEx && startEx.kind !== "cardio") model.exercises.push({ exId: startEx.id, sets: defaultSets(startEx.id) });
  }
  if (model && !model.cardio) model.cardio = { exId: CARDIO[0].id, km: 0 };

  // New exercise: copy the sets from the last time you did it, or a sensible start.
  function defaultSets(exId) {
    const past = Fit.history(exId);
    const last = past[past.length - 1];
    if (last && last.sets) return last.sets.map((s) => ({ ...s }));
    const ex = Fit.exercise(exId);
    return [0, 1, 2].map(() => ({ reps: ex.kind === "time" ? 30 : 10, kg: 0 }));
  }

  /* ---------- reading numbers from inputs ---------- */
  const numberOf = (input) => {
    const v = parseFloat(String(input.value).replace(",", "."));
    return Number.isFinite(v) ? v : NaN;
  };

  /* ---------- drawing ---------- */
  function renderTypes() {
    $("typeRadios").replaceChildren(
      ...Fit.TYPES.map((type) =>
        el("label", { class: "chip type-" + type },
          el("input", { type: "radio", name: "type", value: type, checked: model.type === type }),
          icon(type, 16), el("span", { text: t("type." + type) })
        )
      )
    );
  }

  function renderFeel() {
    $("feelRadios").replaceChildren(
      ...[1, 2, 3, 4, 5].map((n) =>
        el("label", { class: "feel-opt" },
          el("input", { type: "radio", name: "feel", value: n, checked: model.feel === n }),
          el("span", { class: "feel-num", text: String(n) }),
          el("span", { class: "feel-word", text: Site.feelText(n) })
        )
      )
    );
  }

  function renderPickers() {
    const keep = $("exPick").value;
    $("exPick").replaceChildren(
      ...Fit.MUSCLE_GROUPS.filter((g) => g !== "cardio").map((g) =>
        el("optgroup", { label: t("muscle." + g) },
          Fit.EX.filter((e) => e.group === g && e.kind !== "cardio").map((e) => el("option", { value: e.id, text: Fit.exName(e) }))
        )
      )
    );
    if (keep) $("exPick").value = keep;
    $("activity").replaceChildren(...CARDIO.map((e) => el("option", { value: e.id, text: Fit.exName(e) })));
    $("activity").value = model.cardio.exId;
  }

  // One exercise with its sets. Inputs carry data-ex (exercise index),
  // data-set (set index) and data-f ("reps" or "kg").
  function exerciseBlock(e, ei) {
    const ex = Fit.exercise(e.exId);
    const name = Fit.exName(ex);
    const repsLabel = ex.kind === "time" ? t("field.seconds") : t("field.reps");
    return el("fieldset", { class: "ex-edit", "data-ex": ei },
      el("legend", null, el("span", { class: "ex-num", text: String(ei + 1) }), el("span", { text: name })),
      el("div", { class: "set-head", "aria-hidden": "true" },
        el("span", { text: t("field.set") }), el("span", { text: repsLabel }), ex.kind !== "time" ? el("span", { text: t("field.kg") }) : el("span")
      ),
      el("ol", { class: "set-rows" },
        e.sets.map((s, si) => el("li", { class: "set-row" },
          el("span", { class: "set-n", "aria-hidden": "true", text: String(si + 1) }),
          el("input", {
            type: "number", class: "input", min: 1, max: 1000, inputmode: "numeric", value: s.reps,
            "data-ex": ei, "data-set": si, "data-f": "reps",
            "aria-label": t("edit.setField", { n: si + 1, field: repsLabel, name }),
          }),
          ex.kind !== "time"
            ? el("input", {
              type: "number", class: "input", min: 0, max: 500, step: 0.5, inputmode: "decimal", value: s.kg,
              "data-ex": ei, "data-set": si, "data-f": "kg",
              "aria-label": t("edit.setField", { n: si + 1, field: t("field.kg"), name }),
            })
            : el("span"),
          el("button", {
            type: "button", class: "icon-btn", "data-act": "delSet", "data-ex": ei, "data-set": si,
            "aria-label": t("edit.removeSet", { n: si + 1, name }), disabled: e.sets.length === 1,
          }, icon("minus", 16))
        ))
      ),
      el("div", { class: "ex-actions" },
        el("button", { type: "button", class: "btn btn-ghost btn-small", "data-act": "addSet", "data-ex": ei }, icon("plus", 16), el("span", { text: t("edit.addSet") })),
        el("button", { type: "button", class: "btn btn-danger-ghost btn-small", "data-act": "delEx", "data-ex": ei }, icon("trash", 16), el("span", { text: t("edit.removeExercise", { name }) }))
      )
    );
  }

  function renderExercises(focusSel) {
    $("exList").replaceChildren(
      ...(model.exercises.length
        ? model.exercises.map(exerciseBlock)
        : [el("p", { class: "hint", text: t("edit.noExercises") })])
    );
    if (focusSel) {
      const target = $("exList").querySelector(focusSel) || $("exPick");
      target.focus();
    }
  }

  function showSections() {
    $("strengthSection").hidden = model.type !== "strength";
    $("cardioSection").hidden = model.type !== "cardio";
  }

  function renderSummary() {
    const w = { ...model, cardio: model.type === "cardio" ? model.cardio : null, exercises: model.type === "strength" ? model.exercises : [] };
    const rows = [[t("stat.duration"), Site.duration(model.duration || 0)]];
    if (model.type === "strength") {
      rows.push([t("stat.sets"), Site.num(Fit.setsCount(w))], [t("stat.volume"), Site.unit(Fit.volume(w), "kg")]);
    }
    if (model.type === "cardio") rows.push([Site.rateLabel(w), Site.rate(w)]);
    rows.push([t("stat.kcal"), "≈ " + Site.unit(model.duration > 0 ? Fit.kcal(w) : 0, "kcal")]);
    $("liveSum").replaceChildren(...rows.map(([k, v]) => el("div", null, el("dt", { text: k }), el("dd", { text: v }))));
  }

  function fillFields() {
    form.name.value = model.name || (model.nameKey ? t(model.nameKey) : "");
    form.name.placeholder = t("type." + model.type);
    form.date.value = model.date;
    form.date.max = Fit.dates.today();
    form.time.value = model.time;
    form.duration.value = model.duration;
    form.km.value = model.cardio.km || "";
    form.notes.value = model.notes;
  }

  /* ---------- checks: return [field id, error key] pairs ---------- */
  function problems() {
    const out = [];
    if (!Fit.dates.isDate(model.date)) out.push(["date", "err.date"]);
    else if (model.date > Fit.dates.today()) out.push(["date", "err.dateFuture"]);
    if (!Number.isInteger(model.duration) || model.duration < 1 || model.duration > 600) out.push(["duration", "err.duration"]);
    if (model.type === "strength") {
      if (!model.exercises.length) out.push(["exPick", "err.noExercise"]);
      else {
        const badReps = $("exList").querySelector('[data-f="reps"][aria-invalid="true"]');
        const badKg = $("exList").querySelector('[data-f="kg"][aria-invalid="true"]');
        if (badReps) out.push([badReps, "err.reps"]);
        if (badKg) out.push([badKg, "err.kg"]);
      }
    }
    if (model.type === "cardio" && !(model.cardio.km > 0 && model.cardio.km <= 300)) out.push(["km", "err.km"]);
    return out;
  }

  // Marks each set input as valid or not (called on every change).
  function checkSetInputs() {
    $("exList").querySelectorAll("input[data-f]").forEach((input) => {
      const v = numberOf(input);
      const ok = input.dataset.f === "reps" ? Number.isInteger(v) && v >= 1 && v <= 1000 : v >= 0 && v <= 500;
      input.setAttribute("aria-invalid", String(!ok));
    });
  }

  function showFieldErrors(list) {
    const byField = Object.fromEntries(list.filter(([f]) => typeof f === "string").map(([f, key]) => [f, key]));
    ["date", "duration", "km"].forEach((f) => {
      form[f].setAttribute("aria-invalid", String(Boolean(byField[f])));
      $(f + "-err").textContent = byField[f] ? t(byField[f]) : "";
    });
    const exErr = list.find(([f]) => f === "exPick" || typeof f !== "string");
    $("ex-err").textContent = exErr ? t(exErr[1]) : "";
  }

  /* ---------- events ---------- */
  form.addEventListener("input", (e) => {
    dirty = true;
    const target = e.target;
    if (target.dataset.f) {
      const set = model.exercises[target.dataset.ex].sets[target.dataset.set];
      const v = numberOf(target);
      set[target.dataset.f] = Number.isFinite(v) ? v : 0;
      checkSetInputs();
    } else if (target.name === "type") {
      model.type = target.value;
      form.name.placeholder = t("type." + model.type);
      showSections();
    } else if (target.name === "feel") model.feel = Number(target.value);
    else if (target.id === "name") model.name = target.value.trim();
    else if (target.id === "date") model.date = target.value;
    else if (target.id === "time") model.time = target.value;
    else if (target.id === "duration") model.duration = Math.round(numberOf(target)) || 0;
    else if (target.id === "km") model.cardio.km = numberOf(target) || 0;
    else if (target.id === "notes") model.notes = target.value;
    else if (target.id === "activity") model.cardio.exId = Number(target.value);
    if (submitted) showFieldErrors(problems());
    renderSummary();
  });
  form.addEventListener("change", (e) => {
    if (e.target.id === "activity") {
      model.cardio.exId = Number(e.target.value);
      renderSummary();
    }
  });

  // Buttons inside the exercise list: add/remove sets and exercises.
  $("exList").addEventListener("click", (e) => {
    const b = e.target.closest("[data-act]");
    if (!b) return;
    dirty = true;
    const ei = Number(b.dataset.ex);
    const ex = model.exercises[ei];
    if (b.dataset.act === "addSet") {
      const last = ex.sets[ex.sets.length - 1];
      ex.sets.push({ ...last });
      renderExercises(`[data-ex="${ei}"][data-set="${ex.sets.length - 1}"][data-f="reps"]`);
    } else if (b.dataset.act === "delSet") {
      ex.sets.splice(Number(b.dataset.set), 1);
      renderExercises(`[data-act="addSet"][data-ex="${ei}"]`);
    } else if (b.dataset.act === "delEx") {
      const [removed] = model.exercises.splice(ei, 1);
      renderExercises(`[data-act="addSet"][data-ex="${Math.max(0, ei - 1)}"]`);
      Core.toast(t("edit.exRemoved", { name: Fit.exName(Fit.exercise(removed.exId)) }), {
        label: t("action.undo"),
        onClick: () => {
          model.exercises.splice(ei, 0, removed);
          renderExercises(`[data-act="addSet"][data-ex="${ei}"]`);
          renderSummary();
        },
      });
    }
    checkSetInputs();
    renderSummary();
  });

  $("addEx").addEventListener("click", () => {
    const exId = Number($("exPick").value);
    model.exercises.push({ exId, sets: defaultSets(exId) });
    dirty = true;
    renderExercises(`[data-ex="${model.exercises.length - 1}"][data-set="0"][data-f="reps"]`);
    checkSetInputs();
    if (submitted) showFieldErrors(problems());
    renderSummary();
  });

  let submitted = false;
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    submitted = true;
    checkSetInputs();
    const list = problems();
    showFieldErrors(list);
    const summary = $("errorSummary");
    if (list.length) {
      summary.hidden = false;
      summary.replaceChildren(
        el("p", { text: t("err.summary", { count: list.length }) }),
        el("ul", null, list.map(([field, key]) => {
          const target = typeof field === "string" ? $(field) : field;
          return el("li", null, el("a", { href: "#" + (target.id || "exList"), text: t(key), onclick: (ev) => { ev.preventDefault(); target.focus(); } }));
        }))
      );
      summary.focus();
      return;
    }
    summary.hidden = true;

    // Demo workouts keep their translated name unless it was changed.
    const typedName = form.name.value.trim();
    const keepKey = model.nameKey && typedName === t(model.nameKey);
    const workout = {
      id: model.id, type: model.type, date: model.date, time: model.time,
      name: keepKey ? "" : typedName, nameKey: keepKey ? model.nameKey : "",
      duration: model.duration, feel: model.feel, notes: model.notes.trim(),
      exercises: model.type === "strength" ? model.exercises : [],
      cardio: model.type === "cardio" ? { exId: model.cardio.exId, km: Math.round(model.cardio.km * 100) / 100 } : null,
    };
    Fit.upsert(workout);
    dirty = false;
    location.href = "workout.html?id=" + encodeURIComponent(workout.id) + "&saved=1";
  });

  // Leaving with unsaved changes asks first.
  window.addEventListener("beforeunload", (e) => {
    if (dirty) e.preventDefault();
  });
  $("cancelLink").addEventListener("click", async (e) => {
    if (!dirty) return;
    e.preventDefault();
    const href = e.currentTarget.href; // read it now: currentTarget is gone after the await
    const leave = await Site.confirm({ title: t("edit.leaveQ"), text: t("edit.leaveText"), ok: t("edit.leave"), danger: true });
    if (leave) {
      dirty = false;
      location.href = href;
    }
  });
  if (editId) {
    $("cancelLink").href = "workout.html?id=" + encodeURIComponent(editId);
    document.querySelector(".back-link").href = $("cancelLink").href;
  }

  function render() {
    $("editTitle").textContent = t(editId ? "edit.titleEdit" : copyId ? "edit.titleCopy" : "edit.titleNew");
    if (!model) return;
    renderTypes();
    renderFeel();
    renderPickers();
    fillFields();
    renderExercises();
    checkSetInputs();
    showSections();
    renderSummary();
    if (submitted) showFieldErrors(problems());
  }

  Site.start(render, {
    title: () => t(editId ? "edit.titleEdit" : "edit.titleNew"),
    onChange: () => {}, // don't redraw a form while someone is typing in it
  });
})();
