/* Parts shared by every page: header and menu, footer with backup buttons,
   number/date formatting, progress rings, a confirm dialog and the page
   start-up. A page calls  Site.start(render)  and `render` runs again when the
   language changes. All text from data goes in with textContent (through el()). */
(function () {
  "use strict";
  const { t } = Core;
  const page = document.body.dataset.page;

  /* ---------- tiny DOM helper ---------- */
  function el(tag, props, ...children) {
    const node = document.createElement(tag);
    Object.entries(props || {}).forEach(([key, value]) => {
      if (value === null || value === undefined || value === false) return;
      if (key === "class") node.className = value;
      else if (key === "text") node.textContent = value;
      else if (key.startsWith("on")) node.addEventListener(key.slice(2), value);
      else node.setAttribute(key, value === true ? "" : value);
    });
    children.flat(Infinity).forEach((c) => {
      if (c !== null && c !== undefined && c !== false) node.append(c);
    });
    return node;
  }
  const SVG_NS = "http://www.w3.org/2000/svg";
  function svgEl(tag, attrs, ...children) {
    const node = document.createElementNS(SVG_NS, tag);
    Object.entries(attrs || {}).forEach(([k, v]) => v !== null && v !== undefined && node.setAttribute(k, v));
    children.flat().forEach((c) => c && node.append(c));
    return node;
  }

  /* ---------- icons (Lucide, ISC licence; fixed strings, not user data) ---------- */
  const ICONS = {
    home: '<path d="M3 10.5 12 3l9 7.5V21h-6v-6H9v6H3z"/>',
    list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
    chart: '<path d="M3 3v18h18"/><path d="M7 16V9M12 16V5M17 16v-4"/>',
    target: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
    library: '<path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>',
    plus: '<path d="M5 12h14M12 5v14"/>',
    minus: '<path d="M5 12h14"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>',
    moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    trash: '<path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>',
    copy: '<rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
    edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
    flame: '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',
    clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
    trophy: '<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22M18 2H6v7a6 6 0 0 0 12 0V2Z"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>',
    upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>',
    refresh: '<path d="M3 12a9 9 0 0 1 15.5-6.2L21 8M21 3v5h-5M21 12a9 9 0 0 1-15.5 6.2L3 16M3 21v-5h5"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
    // workout types
    strength: '<path d="m6.5 6.5 11 11M21 21l-1-1M3 3l1 1M18 22l4-4M2 6l4-4M3 10l7-7M14 21l7-7"/>',
    cardio: '<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>',
    sport: '<circle cx="12" cy="12" r="10"/><path d="m12 7 4.5 3.3-1.7 5.2H9.2l-1.7-5.2zM12 2v5M21.5 9.2l-5 1.1M18 20l-3.2-4.5M6 20l3.2-4.5M2.5 9.2l5 1.1"/>',
    flex: '<circle cx="12" cy="4" r="2"/><path d="M12 6v6M12 12l-4 8M12 12l4 8M5 9h14"/>',
  };
  function icon(name, size = 20) {
    const svg = svgEl("svg", {
      viewBox: "0 0 24 24", width: size, height: size, fill: "none", stroke: "currentColor", "stroke-width": 2,
      "stroke-linecap": "round", "stroke-linejoin": "round", "aria-hidden": "true", class: "icon icon-" + name,
    });
    svg.innerHTML = ICONS[name] || "";
    return svg;
  }

  /* ---------- numbers and units ---------- */
  // Thousands grouping by hand (Uzbek number formatting is missing in some browsers).
  function num(n, decimals = 0) {
    const lang = Core.getLang();
    const fixed = Number(n || 0).toFixed(decimals);
    const [int, frac] = fixed.split(".");
    const sep = lang === "en" ? "," : " ";
    const dec = lang === "en" ? "." : ",";
    return int.replace(/\B(?=(\d{3})+(?!\d))/g, sep) + (frac ? dec + frac : "");
  }
  const unit = (n, u, decimals = 0) => num(n, decimals) + " " + t("unit." + u);
  // 45 → "45 min", 95 → "1 h 35 min"
  function duration(min) {
    const h = Math.floor(min / 60);
    const m = Math.round(min % 60);
    return h ? t("dur.hm", { h, m: String(m).padStart(2, "0") }) : t("dur.m", { m });
  }
  // minutes per km → "5:42 /km"
  function pace(minPerKm) {
    if (!minPerKm) return "—";
    let m = Math.floor(minPerKm);
    let s = Math.round((minPerKm - m) * 60);
    if (s === 60) { m++; s = 0; }
    return `${m}:${String(s).padStart(2, "0")} ${t("unit.pace")}`;
  }

  // Pace for running and rowing, speed (km/h) for cycling.
  function rate(w) {
    const ex = w.cardio && Fit.exercise(w.cardio.exId);
    if (ex && ex.speed && w.cardio.km > 0 && w.duration > 0) return unit(w.cardio.km / (w.duration / 60), "kmh", 1);
    return pace(Fit.pace(w));
  }
  const rateLabel = (w) => {
    const ex = w.cardio && Fit.exercise(w.cardio.exId);
    return t(ex && ex.speed ? "stat.speed" : "stat.pace");
  };

  /* ---------- dates ----------
     Some browsers have no Uzbek month or day names, so Uzbek is done by hand. */
  const UZ_MONTHS = ["yanvar", "fevral", "mart", "aprel", "may", "iyun", "iyul", "avgust", "sentabr", "oktabr", "noyabr", "dekabr"];
  const UZ_DAYS = ["dushanba", "seshanba", "chorshanba", "payshanba", "juma", "shanba", "yakshanba"];
  const UZ_DAYS_SHORT = ["Du", "Se", "Ch", "Pa", "Ju", "Sh", "Ya"];
  const mondayIndex = (d) => (d.getDay() + 6) % 7;

  function date(isoDate, { weekday = false, year = false } = {}) {
    const d = Fit.dates.parse(isoDate);
    if (Core.getLang() === "uz") {
      let s = d.getDate() + "-" + UZ_MONTHS[d.getMonth()];
      if (year) s += ", " + d.getFullYear();
      return weekday ? UZ_DAYS[mondayIndex(d)] + ", " + s : s;
    }
    const opts = { day: "numeric", month: "long" };
    if (year) opts.year = "numeric";
    if (weekday) opts.weekday = "long";
    return Core.formatDate(d, opts);
  }
  const shortDate = (isoDate) => {
    const d = Fit.dates.parse(isoDate);
    if (Core.getLang() === "uz") return d.getDate() + "-" + UZ_MONTHS[d.getMonth()].slice(0, 3);
    return Core.formatDate(d, { day: "numeric", month: "short" });
  };
  // Short day name, Monday = 0.
  function dayShort(i) {
    if (Core.getLang() === "uz") return UZ_DAYS_SHORT[i];
    const monday = new Date(2024, 0, 1 + i); // 1 Jan 2024 was a Monday
    return Core.formatDate(monday, { weekday: "short" });
  }
  // "This week", "Last week" or "3 – 9 November"
  function weekLabel(start) {
    const thisWeek = Fit.dates.weekStart(Fit.dates.today());
    if (start === thisWeek) return t("week.this");
    if (start === Fit.dates.addDays(thisWeek, -7)) return t("week.last");
    return shortDate(start) + " – " + shortDate(Fit.dates.addDays(start, 6));
  }

  /* ---------- progress ring ---------- */
  // ring({ value, target, label, text }) — an SVG ring with the numbers in the middle.
  function ring({ value, target, label, text, sub }) {
    const pct = target > 0 ? Math.min(1, value / target) : 0;
    const r = 42;
    const c = 2 * Math.PI * r;
    return el("figure", { class: "ring" + (target > 0 && value >= target ? " is-done" : "") },
      svgEl("svg", { viewBox: "0 0 100 100", width: 112, height: 112, "aria-hidden": "true" },
        svgEl("circle", { class: "ring-track", cx: 50, cy: 50, r, fill: "none", "stroke-width": 10 }),
        svgEl("circle", {
          class: "ring-value", cx: 50, cy: 50, r, fill: "none", "stroke-width": 10, "stroke-linecap": "round",
          "stroke-dasharray": `${(pct * c).toFixed(1)} ${c.toFixed(1)}`, transform: "rotate(-90 50 50)",
        })
      ),
      el("figcaption", null,
        el("span", { class: "ring-text", text }),
        sub && el("span", { class: "ring-sub", text: sub }),
        el("span", { class: "ring-label", text: label })
      )
    );
  }

  /* ---------- confirm dialog (returns a Promise<boolean>) ---------- */
  function confirmBox({ title, text, ok, cancel = t("action.cancel"), danger = false }) {
    return new Promise((resolve) => {
      const back = document.activeElement;
      const dialog = el("dialog", { class: "confirm", "aria-labelledby": "confirmTitle" },
        el("h2", { id: "confirmTitle", text: title }),
        text && el("p", { text }),
        el("div", { class: "dialog-actions" },
          el("button", { type: "button", class: "btn btn-ghost", "data-v": "no", text: cancel }),
          el("button", { type: "button", class: "btn" + (danger ? " btn-danger" : ""), "data-v": "yes", text: ok })
        )
      );
      // The buttons close the dialog themselves (the "close" event isn't reliable everywhere).
      const finish = (answer) => {
        dialog.close();
        dialog.remove();
        if (back && back.focus) back.focus();
        resolve(answer);
      };
      dialog.addEventListener("click", (e) => {
        const b = e.target.closest("[data-v]");
        if (b) finish(b.dataset.v === "yes");
      });
      dialog.addEventListener("cancel", (e) => {
        e.preventDefault();
        finish(false);
      });
      document.body.append(dialog);
      dialog.showModal();
      dialog.querySelector('[data-v="no"]').focus();
    });
  }

  /* ---------- header ---------- */
  const NAV = [
    ["today", "index.html", "home"],
    ["log", "log.html", "list"],
    ["progress", "progress.html", "chart"],
    ["goals", "goals.html", "target"],
    ["exercises", "exercises.html", "library"],
  ];
  // Detail pages belong to a menu item.
  const SECTION = { today: "today", log: "log", workout: "log", progress: "progress", goals: "goals", exercises: "exercises", exercise: "exercises" };

  function renderHeader() {
    const host = document.getElementById("site-header");
    if (!host) return;
    const current = SECTION[page];
    const menuBtn = el("button", { type: "button", class: "icon-btn menu-btn", "aria-expanded": "false", "aria-controls": "site-nav", "data-i18n-aria": "nav.menu" }, icon("menu"), icon("x"));
    const nav = el("nav", { id: "site-nav", class: "site-nav", "data-i18n-aria": "nav.label" },
      el("ul", null, NAV.map(([key, href, ic]) =>
        el("li", null, el("a", { href, "aria-current": current === key ? "page" : null }, icon(ic, 18), el("span", { "data-i18n": "page." + key })))
      ))
    );
    const add = el("a", { class: "btn add-btn", href: "edit.html", "aria-current": page === "edit" ? "page" : null }, icon("plus", 18), el("span", { "data-i18n": "action.add" }));
    const langs = el("div", { class: "seg", role: "group", "data-i18n-aria": "lang.label" },
      ["uz", "ru", "en"].map((code) => el("button", { type: "button", "data-lang": code, lang: code, text: code.toUpperCase() }))
    );
    const theme = el("button", { type: "button", id: "themeToggle", class: "icon-btn" }, icon("sun", 18), icon("moon", 18));

    host.append(el("div", { class: "container header-bar" },
      el("a", { class: "brand", href: "index.html", "data-i18n": "brand" }),
      nav,
      el("div", { class: "header-tools" }, add, langs, theme, menuBtn)
    ));

    const setOpen = (open) => {
      menuBtn.setAttribute("aria-expanded", String(open));
      menuBtn.setAttribute("aria-label", t(open ? "nav.close" : "nav.menu"));
      host.classList.toggle("menu-open", open);
    };
    menuBtn.addEventListener("click", () => setOpen(menuBtn.getAttribute("aria-expanded") !== "true"));
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && host.classList.contains("menu-open")) {
        setOpen(false);
        menuBtn.focus();
      }
    });
  }

  /* ---------- footer: backup, restore, demo reset ---------- */
  function renderFooter() {
    const host = document.getElementById("site-footer");
    if (!host) return;
    const file = el("input", { type: "file", accept: "application/json,.json", id: "importFile", class: "visually-hidden" });
    file.addEventListener("change", async () => {
      const f = file.files[0];
      file.value = "";
      if (!f) return;
      if (f.size > 2 * 1024 * 1024) return Core.toast(t("data.importBad"));
      const ok = await confirmBox({ title: t("data.importQ"), text: t("data.importText"), ok: t("data.import") });
      if (!ok) return;
      try {
        const n = Fit.importData(await f.text());
        Core.toast(t("data.imported", { count: n }));
      } catch {
        Core.toast(t("data.importBad"));
      }
    });
    host.append(el("div", { class: "container footer-inner" },
      el("p", { "data-i18n": "footer.note" }),
      el("div", { class: "footer-actions" },
        el("button", { type: "button", class: "btn btn-ghost btn-small", onclick: exportFile }, icon("download", 16), el("span", { "data-i18n": "data.export" })),
        el("label", { class: "btn btn-ghost btn-small", for: "importFile" }, icon("upload", 16), el("span", { "data-i18n": "data.import" })),
        file,
        el("button", {
          type: "button", class: "btn btn-ghost btn-small",
          onclick: async () => {
            const ok = await confirmBox({ title: t("data.resetQ"), text: t("data.resetText"), ok: t("data.reset"), danger: true });
            if (ok) {
              Fit.resetDemo();
              Core.toast(t("data.resetDone"));
            }
          },
        }, icon("refresh", 16), el("span", { "data-i18n": "data.reset" }))
      ),
      el("p", { class: "footer-copy", "data-i18n": "footer.copy" })
    ));
  }

  // Saves a backup file the page builds itself (nothing is downloaded from the web).
  function exportFile() {
    const blob = new Blob([Fit.exportData()], { type: "application/json" });
    const a = el("a", { href: URL.createObjectURL(blob), download: `fitness-backup-${Fit.dates.today()}.json` });
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    Core.toast(t("data.exported"));
  }

  /* ---------- small shared pieces ---------- */
  const typeTag = (type) => el("span", { class: "type-tag type-" + type }, icon(type, 14), el("span", { text: t("type." + type) }));
  const feelText = (n) => t("feel." + n);

  // A compact workout card used on Today and in the Log.
  function workoutCard(w) {
    const facts = [duration(w.duration)];
    if (w.type === "strength") facts.push(t("stat.exercises", { count: w.exercises.length }), unit(Fit.volume(w), "kg"));
    if (w.type === "cardio" && w.cardio) facts.push(unit(w.cardio.km, "km", 1), rate(w));
    return el("a", { class: "workout-card type-" + w.type, href: "workout.html?id=" + encodeURIComponent(w.id) },
      el("span", { class: "wc-icon" }, icon(w.type, 20)),
      el("span", { class: "wc-main" },
        el("span", { class: "wc-name", text: Fit.workoutName(w) }),
        el("span", { class: "wc-meta", text: date(w.date, { weekday: true }) + (w.time ? " · " + w.time : "") }),
        el("span", { class: "wc-facts", text: facts.join(" · ") })
      ),
      el("span", { class: "wc-feel", title: t("field.feel"), text: "★ " + w.feel })
    );
  }

  /* ---------- page title and start ---------- */
  let titleFn = null;
  function setTitle() {
    const part = titleFn ? titleFn() : "";
    document.title = part ? part + " — " + t("brand") : t("meta.title");
  }

  function start(render, options = {}) {
    titleFn = options.title || null;
    renderHeader();
    renderFooter();
    Core.onLang(() => {
      render();
      setTitle();
    });
    Fit.onChange(() => (options.onChange ? options.onChange() : render()));
    Core.init();
  }

  window.Site = {
    el, svgEl, icon, num, unit, duration, pace, rate, rateLabel, date, shortDate, dayShort, weekLabel,
    ring, confirm: confirmBox, typeTag, feelText, workoutCard, setTitle, start,
  };
})();
