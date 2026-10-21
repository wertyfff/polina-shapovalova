(function () {
  var S = window.SITE || {};
  var doc = document.documentElement;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  doc.classList.add("js");

  /* --- При обновлении всегда начинаем с первого экрана --- */
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  if (location.hash) history.replaceState(null, "", location.pathname + location.search);
  window.scrollTo(0, 0);
  window.addEventListener("pageshow", function () { window.scrollTo(0, 0); });

  /* --- Якорные ссылки: плавный скролл без # в адресе --- */
  document.addEventListener("click", function (e) {
    var a = e.target.closest('a[href^="#"]');
    if (!a) return;
    var id = a.getAttribute("href").slice(1);
    var target = id === "top" ? document.body : document.getElementById(id);
    if (!target) return;
    e.preventDefault();
    var y = id === "top" ? 0 : target.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: y, behavior: reduce ? "auto" : "smooth" });
  });

  /* --- Данные из content.js --- */
  function get(path) {
    return path.split(".").reduce(function (o, k) { return o ? o[k] : undefined; }, S);
  }
  document.querySelectorAll("[data-field]").forEach(function (el) {
    var v = get(el.getAttribute("data-field"));
    if (v) el.textContent = v; else el.classList.add("is-tbd");
  });

  var imgs = S.images || {};
  document.querySelectorAll("[data-img]").forEach(function (fig) {
    var src = imgs[fig.getAttribute("data-img")];
    if (!src) { fig.setAttribute("aria-hidden", "true"); return; }
    var img = new Image();
    img.src = src;
    img.alt = fig.getAttribute("data-alt") || "";
    img.loading = fig.closest(".hero") ? "eager" : "lazy";
    img.decoding = "async";
    fig.appendChild(img);
  });

  /* --- Контакты --- */
  var c = S.contacts || {};
  var channels = [
    { key: "telegram", label: "Telegram", href: function (v) { return v; } },
    { key: "whatsapp", label: "WhatsApp", href: function (v) { return v; } },
    { key: "phone", label: "Позвонить", href: function (v) { return "tel:" + v.replace(/[^\d+]/g, ""); } },
    { key: "email", label: "Почта", href: function (v) { return "mailto:" + v; } }
  ];
  var list = document.querySelector("[data-contacts]");
  var filled = channels.filter(function (ch) { return c[ch.key]; });
  if (filled.length) {
    filled.forEach(function (ch) {
      var li = document.createElement("li");
      var a = document.createElement("a");
      a.href = ch.href(c[ch.key]);
      if (/^https?:/.test(a.href)) { a.target = "_blank"; a.rel = "noopener"; }
      a.textContent = ch.label;
      li.appendChild(a);
      list.appendChild(li);
    });
  } else {
    ["Telegram", "WhatsApp", "Телефон"].forEach(function (label) {
      var li = document.createElement("li");
      var s = document.createElement("span");
      s.textContent = label;
      li.appendChild(s);
      list.appendChild(li);
    });
    var note = document.createElement("li");
    note.className = "mono contacts__note";
    note.textContent = "Контакты появятся после согласования";
    list.appendChild(note);
  }

  /* --- Выбор формата из кнопок записи --- */
  var chosen = document.querySelector("[data-chosen]");
  var names = { offline: "личная встреча в Москве", online: "онлайн-консультация" };
  document.querySelectorAll("[data-format]").forEach(function (a) {
    a.addEventListener("click", function () {
      chosen.textContent = "Вы выбрали: " + names[a.getAttribute("data-format")];
      chosen.hidden = false;
    });
  });

  /* --- Меню --- */
  var menuBtn = document.querySelector(".float__menu");
  var menu = document.getElementById("menu");
  function setMenu(open) {
    menuBtn.setAttribute("aria-expanded", String(open));
    menuBtn.textContent = open ? "Закрыть" : "Меню";
    menu.hidden = !open;
    document.body.style.overflow = open ? "hidden" : "";
  }
  menuBtn.addEventListener("click", function () { setMenu(menu.hidden); });
  menu.addEventListener("click", function (e) { if (e.target.closest("a")) setMenu(false); });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !menu.hidden) { setMenu(false); menuBtn.focus(); }
  });

  /* --- Вопросы: открыт только один ответ --- */
  var qas = document.querySelectorAll(".qa");
  qas.forEach(function (qa) {
    var btn = qa.querySelector("button");
    btn.addEventListener("click", function () {
      var open = !qa.classList.contains("is-open");
      qas.forEach(function (other) {
        other.classList.remove("is-open");
        other.querySelector("button").setAttribute("aria-expanded", "false");
      });
      if (open) {
        qa.classList.add("is-open");
        btn.setAttribute("aria-expanded", "true");
      }
    });
  });

  /* --- Имя на всю ширину --- */
  var fits = document.querySelectorAll("[data-fit]");
  function fit() {
    fits.forEach(function (el) {
      el.style.fontSize = "100px";
      var w = el.getBoundingClientRect().width;
      var avail = el.parentElement.clientWidth;
      el.style.fontSize = (100 * avail / w * 0.995).toFixed(2) + "px";
    });
  }
  var rt;
  window.addEventListener("resize", function () { clearTimeout(rt); rt = setTimeout(fit, 80); });

  /* --- Появление при прокрутке: только крупный текст --- */
  var revealables = document.querySelectorAll(".title, .recog__list li, .topics__words span, .about__big, .final__h, .formats__h");
  if ("IntersectionObserver" in window && !reduce) {
    revealables.forEach(function (el) { el.classList.add("rv"); });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
      });
    }, { rootMargin: "0px 0px -10% 0px" });
    revealables.forEach(function (el) { io.observe(el); });
  }

  /* --- Старт после загрузки шрифтов, чтобы имя не прыгало --- */
  function ready() {
    fit();
    requestAnimationFrame(function () { doc.classList.add("is-ready"); });
  }
  if (document.fonts && document.fonts.ready) {
    Promise.race([document.fonts.ready, new Promise(function (r) { setTimeout(r, 1500); })]).then(ready);
  } else ready();
})();
