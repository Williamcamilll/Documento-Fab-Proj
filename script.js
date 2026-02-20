/* =========================================================
   script.js — Fábrica de Projetos (UNIMAR)
   Recursos premium: sumário automático, scrollspy, progresso,
   copiar, toast, animações, modo foco, atalhos, etc.
   ========================================================= */

(() => {
  "use strict";

  /* -------------------------
     Helpers
  --------------------------*/
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }

  function sanitizeText(text) {
    // Mantém texto limpo para clipboard (evita lixo invisível)
    return String(text || "")
      .replace(/\u00A0/g, " ")
      .replace(/[ \t]+\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  /* -------------------------
     Toast (fila)
  --------------------------*/
  const toastEl = $("#toast");
  let toastQueue = [];
  let toastBusy = false;

  function showToast(message, type = "info") {
    if (!toastEl) return;

    toastQueue.push({ message, type });
    if (!toastBusy) runToastQueue();
  }

  async function runToastQueue() {
    toastBusy = true;

    while (toastQueue.length) {
      const { message } = toastQueue.shift();
      toastEl.textContent = message;
      toastEl.classList.add("show");
      await wait(1600);
      toastEl.classList.remove("show");
      await wait(240);
    }

    toastBusy = false;
  }

  function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

  /* -------------------------
     Clipboard (com fallback)
  --------------------------*/
  async function copyToClipboard(text) {
    const payload = sanitizeText(text);
    if (!payload) {
      showToast("Nada para copiar 😅");
      return false;
    }

    try {
      await navigator.clipboard.writeText(payload);
      showToast("Copiado ✔️");
      return true;
    } catch (err) {
      // fallback: textarea
      try {
        const ta = document.createElement("textarea");
        ta.value = payload;
        ta.setAttribute("readonly", "");
        ta.style.position = "fixed";
        ta.style.top = "-9999px";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
        showToast("Copiado ✔️");
        return true;
      } catch (e) {
        showToast("Falha ao copiar 😕");
        return false;
      }
    }
  }

  /* -------------------------
     Progresso de leitura (top bar)
  --------------------------*/
  function createProgressBar() {
    const bar = document.createElement("div");
    bar.id = "readingProgress";
    bar.style.position = "fixed";
    bar.style.top = "0";
    bar.style.left = "0";
    bar.style.height = "4px";
    bar.style.width = "0%";
    bar.style.zIndex = "9998";
    bar.style.background = "linear-gradient(90deg, #0b3b91, #2563eb, #60a5fa)";
    bar.style.boxShadow = "0 8px 18px rgba(2,6,23,.18)";
    document.body.appendChild(bar);

    const update = () => {
      const doc = document.documentElement;
      const scrollTop = doc.scrollTop || document.body.scrollTop;
      const scrollHeight = doc.scrollHeight - doc.clientHeight;
      const p = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
      bar.style.width = `${clamp(p, 0, 100).toFixed(2)}%`;
    };

    window.addEventListener("scroll", update, { passive: true });
    update();
  }

  /* -------------------------
     Botão flutuante: topo
  --------------------------*/
  function createBackToTop() {
    const btn = document.createElement("button");
    btn.id = "btnTop";
    btn.type = "button";
    btn.setAttribute("aria-label", "Voltar ao topo");
    btn.textContent = "↑";
    btn.style.position = "fixed";
    btn.style.right = "16px";
    btn.style.bottom = "16px";
    btn.style.width = "44px";
    btn.style.height = "44px";
    btn.style.borderRadius = "14px";
    btn.style.border = "0";
    btn.style.cursor = "pointer";
    btn.style.fontWeight = "900";
    btn.style.fontSize = "18px";
    btn.style.zIndex = "9998";
    btn.style.background = "rgba(15,23,42,.08)";
    btn.style.color = "inherit";
    btn.style.backdropFilter = "blur(10px)";
    btn.style.boxShadow = "0 16px 30px rgba(2,6,23,.12)";
    btn.style.opacity = "0";
    btn.style.pointerEvents = "none";
    btn.style.transform = "translateY(8px)";
    btn.style.transition = "opacity .2s ease, transform .2s ease, filter .2s ease";

    document.body.appendChild(btn);

    const show = () => {
      btn.style.opacity = "1";
      btn.style.pointerEvents = "auto";
      btn.style.transform = "translateY(0)";
    };
    const hide = () => {
      btn.style.opacity = "0";
      btn.style.pointerEvents = "none";
      btn.style.transform = "translateY(8px)";
    };

    const onScroll = () => {
      const y = window.scrollY || document.documentElement.scrollTop;
      if (y > 500) show();
      else hide();
    };

    btn.addEventListener("mouseenter", () => btn.style.filter = "brightness(1.04)");
    btn.addEventListener("mouseleave", () => btn.style.filter = "none");

    btn.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: prefersReducedMotion ? "auto" : "smooth" });
    });

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* -------------------------
     Estimativa de leitura
  --------------------------*/
  function addReadingTime() {
    const content = $(".content");
    const subtitle = $(".subtitle");
    if (!content || !subtitle) return;

    const text = sanitizeText(content.innerText);
    const words = text.split(/\s+/).filter(Boolean).length;
    const wpm = 200; // leitura média
    const minutes = Math.max(1, Math.round(words / wpm));

    const badge = document.createElement("span");
    badge.className = "mini";
    badge.style.display = "inline-block";
    badge.style.marginTop = "6px";
    badge.textContent = `Tempo estimado de leitura: ~${minutes} min`;

    subtitle.insertAdjacentElement("afterend", badge);
  }

  /* -------------------------
     Sumário automático + âncoras
  --------------------------*/
  function buildTOC() {
    const toc = $("#sumarioAuto");
    if (!toc) return;

    const articles = $$("article.qa.card");
    if (!articles.length) return;

    toc.innerHTML = "";

    for (const art of articles) {
      // Cada article tem id e data-title
      if (!art.id) {
        // cria id baseado no título
        const title = art.getAttribute("data-title") || $("h2", art)?.innerText || "sec";
        const slug = title
          .toLowerCase()
          .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
          .replace(/[^\w\s-]/g, "")
          .trim().replace(/\s+/g, "-");
        art.id = slug || `sec-${Math.random().toString(16).slice(2)}`;
      }

      const title = art.getAttribute("data-title") || $("h2", art)?.innerText || art.id;

      const li = document.createElement("li");
      const a = document.createElement("a");
      a.href = `#${art.id}`;
      a.textContent = title;
      a.dataset.tocFor = art.id;

      a.addEventListener("click", (e) => {
        // navegação suave
        if (!prefersReducedMotion) {
          e.preventDefault();
          const target = document.getElementById(art.id);
          target?.scrollIntoView({ behavior: "smooth", block: "start" });
          history.pushState(null, "", `#${art.id}`);
        }
      });

      li.appendChild(a);
      toc.appendChild(li);
    }

    // adiciona “pequeno” atalho de foco no sumário
    toc.setAttribute("tabindex", "0");
  }

  /* -------------------------
     ScrollSpy (destacar item do sumário)
  --------------------------*/
  function initScrollSpy() {
    const tocLinks = $$("[data-toc-for]");
    if (!tocLinks.length) return;

    const map = new Map(tocLinks.map(a => [a.dataset.tocFor, a]));

    const sections = tocLinks
      .map(a => document.getElementById(a.dataset.tocFor))
      .filter(Boolean);

    const setActive = (id) => {
      for (const a of tocLinks) {
        a.classList.toggle("active", a.dataset.tocFor === id);
      }
    };

    // CSS inline minimal pra destacar ativo (sem mexer no CSS global)
    for (const a of tocLinks) {
      a.style.padding = "2px 6px";
      a.style.borderRadius = "10px";
      a.style.display = "inline-block";
      a.style.transition = "background .15s ease, transform .15s ease";
    }
    const applyActiveStyle = () => {
      for (const a of tocLinks) {
        if (a.classList.contains("active")) {
          a.style.background = "rgba(11,59,145,.12)";
          a.style.transform = "translateX(2px)";
        } else {
          a.style.background = "transparent";
          a.style.transform = "none";
        }
      }
    };

    let current = sections[0]?.id;

    const obs = new IntersectionObserver((entries) => {
      // pega a seção mais visível
      const visible = entries
        .filter(e => e.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

      if (visible?.target?.id && visible.target.id !== current) {
        current = visible.target.id;
        setActive(current);
        applyActiveStyle();
      }
    }, { root: null, threshold: [0.15, 0.25, 0.35, 0.5, 0.65] });

    sections.forEach(sec => obs.observe(sec));

    // set inicial
    if (current) {
      setActive(current);
      applyActiveStyle();
    }

    // hover melhora leitura
    tocLinks.forEach(a => {
      a.addEventListener("mouseenter", () => {
        if (!a.classList.contains("active")) a.style.background = "rgba(15,23,42,.06)";
      });
      a.addEventListener("mouseleave", () => applyActiveStyle());
    });

    // guardamos para acessos rápidos
    map; // (mantém)
  }

  /* -------------------------
     Copiar por botão data-copy + copiar tudo + imprimir
  --------------------------*/
  function bindActions() {
    // Copiar seção (qualquer botão com data-copy)
    document.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-copy]");
      if (!btn) return;

      const selector = btn.dataset.copy;
      const el = selector ? $(selector) : null;

      if (!el) {
        showToast("Não encontrei o conteúdo para copiar 😕");
        return;
      }

      copyToClipboard(el.innerText);
    });

    // Copiar tudo
    $("#btnCopyAll")?.addEventListener("click", () => {
      const content = $(".content");
      if (!content) return;
      copyToClipboard(content.innerText);
    });

    // Imprimir / PDF
    $("#btnPrint")?.addEventListener("click", () => window.print());
  }

  /* -------------------------
     Animações ao entrar (IntersectionObserver)
  --------------------------*/
  function initRevealAnimations() {
    if (prefersReducedMotion) return;

    const cards = $$(".card, .cover");
    cards.forEach(el => {
      el.style.opacity = "0";
      el.style.transform = "translateY(10px)";
      el.style.transition = "opacity .35s ease, transform .35s ease";
    });

    const obs = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          e.target.style.opacity = "1";
          e.target.style.transform = "translateY(0)";
          obs.unobserve(e.target);
        }
      }
    }, { threshold: 0.12 });

    cards.forEach(el => obs.observe(el));
  }

  /* -------------------------
     Modo foco (surpresa)
  --------------------------*/
  function createFocusModeToggle() {
    const titleRow = $(".titleRow");
    if (!titleRow) return;

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn btn--soft no-print";
    btn.id = "btnFocusMode";
    btn.textContent = "Modo foco";
    btn.style.marginLeft = "auto";

    const actions = $(".actions");
    if (actions) actions.appendChild(btn);

    const KEY = "fp_focus_mode";
    const setFocus = (on) => {
      document.documentElement.dataset.focusMode = on ? "1" : "0";
      localStorage.setItem(KEY, on ? "1" : "0");
      showToast(on ? "Modo foco ativado 🎯" : "Modo foco desativado ✅");
    };

    // estilos injetados só para o modo foco
    const style = document.createElement("style");
    style.textContent = `
      html[data-focus-mode="1"] .infoGrid,
      html[data-focus-mode="1"] nav.card,
      html[data-focus-mode="1"] .footer,
      html[data-focus-mode="1"] #integrantes{
        opacity:.18;
        filter: blur(1px);
        transition: opacity .2s ease, filter .2s ease;
      }
      html[data-focus-mode="1"] article.qa.card{
        outline: 2px solid rgba(11,59,145,.18);
      }
    `;
    document.head.appendChild(style);

    const initial = localStorage.getItem(KEY) === "1";
    document.documentElement.dataset.focusMode = initial ? "1" : "0";

    btn.addEventListener("click", () => {
      const on = document.documentElement.dataset.focusMode !== "1";
      setFocus(on);
    });
  }

  /* -------------------------
     Atalhos de teclado (surpresa)
  --------------------------*/
  function initHotkeys() {
    document.addEventListener("keydown", (e) => {
      // Ctrl+P -> imprimir
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "p") {
        // Deixa o navegador fazer a ação nativa, mas avisamos
        showToast("Abrindo impressão/PDF 🖨️");
        return;
      }

      // Ctrl+K -> foco no sumário
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        const toc = $("#sumarioAuto");
        if (toc) {
          toc.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", block: "center" });
          toc.focus({ preventScroll: true });
          showToast("Sumário focado 🔎");
        }
      }

      // Alt+ArrowUp -> topo
      if (e.altKey && e.key === "ArrowUp") {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: prefersReducedMotion ? "auto" : "smooth" });
        showToast("Topo ↑");
      }
    });
  }

  /* -------------------------
     Micro UX: destacar seção ao clicar no sumário
  --------------------------*/
  function highlightOnHashChange() {
    const flash = (el) => {
      if (!el) return;
      const prev = el.style.boxShadow;
      el.style.boxShadow = "0 0 0 3px rgba(11,59,145,.18), 0 18px 40px rgba(2,6,23,.08)";
      if (!prefersReducedMotion) el.style.transition = "box-shadow .25s ease";
      setTimeout(() => { el.style.boxShadow = prev; }, 650);
    };

    const run = () => {
      const id = location.hash.replace("#", "");
      if (!id) return;
      flash(document.getElementById(id));
    };

    window.addEventListener("hashchange", run);
    run();
  }

  /* -------------------------
     Init
  --------------------------*/
  function init() {
    createProgressBar();
    createBackToTop();
    addReadingTime();

    buildTOC();
    initScrollSpy();

    bindActions();
    initRevealAnimations();

    createFocusModeToggle();
    initHotkeys();
    highlightOnHashChange();

    // Boas-vindas sutil
    showToast("Documento pronto ✅");
  }

  // DOM ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

})();
