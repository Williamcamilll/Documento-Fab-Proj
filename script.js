/* =========================================================
   script.js — Fábrica de Projetos (UNIMAR) — SUPER TURBO
   - Sumário automático + busca
   - ScrollSpy + destaque
   - Progresso de leitura + progresso por seções concluídas
   - Copiar tudo / copiar seção / toast fila
   - Reveal animations
   - Confetti + partículas
   - Typewriter sutil
   - TTS (leitura por voz)
   - Modo Zen + marcar concluído
   - Easter egg (Konami)
   ========================================================= */

(() => {
  "use strict";

  /* -------------------------
     Helpers
  --------------------------*/
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

  const sanitizeText = (text) => String(text || "")
    .replace(/\u00A0/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  const wait = (ms) => new Promise(r => setTimeout(r, ms));

  const store = {
    get(key, fallback = null) {
      try {
        const v = localStorage.getItem(key);
        return v === null ? fallback : v;
      } catch { return fallback; }
    },
    set(key, value) {
      try { localStorage.setItem(key, value); } catch {}
    },
    del(key) {
      try { localStorage.removeItem(key); } catch {}
    }
  };

  /* -------------------------
     Toast (fila)
  --------------------------*/
  const toastEl = $("#toast");
  let toastQueue = [];
  let toastBusy = false;

  function toast(msg) {
    if (!toastEl) return;
    toastQueue.push(msg);
    if (!toastBusy) runToastQueue();
  }

  async function runToastQueue() {
    toastBusy = true;
    while (toastQueue.length) {
      const msg = toastQueue.shift();
      toastEl.textContent = msg;
      toastEl.classList.add("show");
      await wait(1550);
      toastEl.classList.remove("show");
      await wait(240);
    }
    toastBusy = false;
  }

  /* -------------------------
     Clipboard (fallback)
  --------------------------*/
  async function copyToClipboard(text) {
    const payload = sanitizeText(text);
    if (!payload) {
      toast("Nada para copiar 😅");
      return false;
    }
    try {
      await navigator.clipboard.writeText(payload);
      toast("Copiado ✔️");
      return true;
    } catch {
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
        toast("Copiado ✔️");
        return true;
      } catch {
        toast("Falha ao copiar 😕");
        return false;
      }
    }
  }

  /* -------------------------
     Micro SFX (opcional)
  --------------------------*/
  const KEY_SFX = "fp_sfx_enabled"; // "1" ou "0"
  function playBeep() {
    if (store.get(KEY_SFX, "0") !== "1") return;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "sine";
      o.frequency.value = 740;
      g.gain.value = 0.03;
      o.connect(g); g.connect(ctx.destination);
      o.start();
      setTimeout(() => { o.stop(); ctx.close(); }, 90);
    } catch {}
  }

  /* -------------------------
     Inject minimal extra styles
  --------------------------*/
  function injectStyles() {
    const style = document.createElement("style");
    style.textContent = `
      /* Sumário ativo */
      #sumarioAuto a{padding:2px 6px;border-radius:10px;display:inline-block;transition:background .15s ease, transform .15s ease}
      #sumarioAuto a.active{background:rgba(11,59,145,.12);transform:translateX(2px)}
      /* Top progress bars */
      #readingProgress, #sectionsProgress{position:fixed;left:0;height:4px;z-index:9998}
      #readingProgress{top:0;background:linear-gradient(90deg,#0b3b91,#2563eb,#60a5fa);box-shadow:0 8px 18px rgba(2,6,23,.18)}
      #sectionsProgress{top:4px;background:linear-gradient(90deg,#10b981,#34d399,#a7f3d0)}
      /* Floating HUD */
      .fpHud{position:fixed;right:16px;bottom:72px;z-index:9998;display:flex;flex-direction:column;gap:10px}
      .fpFab{width:46px;height:46px;border-radius:14px;border:0;cursor:pointer;font-weight:900;font-size:16px;
        background:rgba(15,23,42,.08);color:inherit;backdrop-filter:blur(10px);
        box-shadow:0 16px 30px rgba(2,6,23,.12);transition:transform .15s ease, filter .15s ease, opacity .2s ease}
      .fpFab:hover{transform:translateY(-1px);filter:brightness(1.05)}
      .fpFab:active{transform:scale(.98)}
      /* Zen focus */
      html[data-zen="1"] .infoGrid, html[data-zen="1"] nav.card, html[data-zen="1"] .footer, html[data-zen="1"] #integrantes{
        opacity:.18;filter:blur(1px);transition:opacity .2s ease, filter .2s ease
      }
      html[data-zen="1"] article.qa.card{outline:2px solid rgba(11,59,145,.18)}
      .fpGlow{box-shadow:0 0 0 3px rgba(11,59,145,.18), 0 18px 40px rgba(2,6,23,.08) !important}
      /* Done badge */
      .fpDoneBadge{margin-left:10px;font-size:.8rem;font-weight:900;color:#10b981}
      /* Search input */
      .fpSearchWrap{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-top:8px}
      .fpSearch{
        width:min(520px,100%);padding:10px 12px;border-radius:12px;border:1px solid rgba(148,163,184,.35);
        background:rgba(255,255,255,.75);outline:none
      }
      .fpSearch:focus{box-shadow:0 0 0 3px rgba(11,59,145,.18)}
      /* Tiny chips */
      .fpChip{padding:6px 10px;border-radius:999px;border:1px solid rgba(148,163,184,.35);background:rgba(241,245,249,.75);font-weight:800;cursor:pointer}
      /* Reveal */
      .fpReveal{opacity:0;transform:translateY(10px);transition:opacity .35s ease, transform .35s ease}
      .fpReveal.in{opacity:1;transform:translateY(0)}
      /* Confetti canvas */
      #fpConfetti{position:fixed;inset:0;pointer-events:none;z-index:9999}
      /* Particles */
      .fpParticle{position:fixed;width:8px;height:8px;border-radius:999px;pointer-events:none;z-index:9999;opacity:.9}
    `;
    document.head.appendChild(style);
  }

  /* -------------------------
     Reading progress bar
  --------------------------*/
  function createProgressBars() {
    const bar = document.createElement("div");
    bar.id = "readingProgress";
    bar.style.width = "0%";

    const bar2 = document.createElement("div");
    bar2.id = "sectionsProgress";
    bar2.style.width = "0%";

    document.body.appendChild(bar);
    document.body.appendChild(bar2);

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
     HUD buttons (Topo / Zen / TTS / SFX)
  --------------------------*/
  function createHUD() {
    const hud = document.createElement("div");
    hud.className = "fpHud";

    const btnTop = mkFab("↑", "Voltar ao topo");
    const btnZen = mkFab("🎯", "Modo Zen (foco)");
    const btnSpeak = mkFab("🗣️", "Ler seção atual");
    const btnSfx = mkFab("🔊", "Ativar/desativar som ao copiar");

    // Initial state
    btnSfx.style.opacity = store.get(KEY_SFX, "0") === "1" ? "1" : ".7";

    btnTop.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: prefersReducedMotion ? "auto" : "smooth" });
      toast("Topo ↑");
    });

    btnZen.addEventListener("click", () => toggleZen());

    btnSpeak.addEventListener("click", () => speakCurrentSection());

    btnSfx.addEventListener("click", () => {
      const on = store.get(KEY_SFX, "0") !== "1";
      store.set(KEY_SFX, on ? "1" : "0");
      btnSfx.style.opacity = on ? "1" : ".7";
      toast(on ? "Som ativado 🔊" : "Som desativado 🔇");
      if (on) playBeep();
    });

    hud.append(btnTop, btnZen, btnSpeak, btnSfx);
    document.body.appendChild(hud);
  }

  function mkFab(label, aria) {
    const b = document.createElement("button");
    b.className = "fpFab";
    b.type = "button";
    b.textContent = label;
    b.setAttribute("aria-label", aria);
    return b;
  }

  /* -------------------------
     Typewriter effect (subtitle)
  --------------------------*/
  async function typewriter() {
    if (prefersReducedMotion) return;
    const sub = $(".subtitle");
    if (!sub) return;

    const original = sub.textContent.trim();
    if (!original) return;

    // só uma vez
    if (store.get("fp_typewriter_done", "0") === "1") return;
    store.set("fp_typewriter_done", "1");

    sub.textContent = "";
    const cursor = document.createElement("span");
    cursor.textContent = "▍";
    cursor.style.opacity = ".65";
    sub.appendChild(cursor);

    for (let i = 0; i < original.length; i++) {
      cursor.insertAdjacentText("beforebegin", original[i]);
      await wait(18);
    }
    cursor.remove();
  }

  /* -------------------------
     Reading time estimate
  --------------------------*/
  function addReadingTime() {
    const content = $(".content");
    const sub = $(".subtitle");
    if (!content || !sub) return;

    const text = sanitizeText(content.innerText);
    const words = text.split(/\s+/).filter(Boolean).length;
    const wpm = 200;
    const minutes = Math.max(1, Math.round(words / wpm));

    const badge = document.createElement("div");
    badge.className = "mini";
    badge.style.marginTop = "6px";
    badge.textContent = `Tempo estimado de leitura: ~${minutes} min`;
    sub.insertAdjacentElement("afterend", badge);
  }

  /* -------------------------
     Build TOC + Search + Chips
  --------------------------*/
  function buildTOC() {
    const toc = $("#sumarioAuto");
    if (!toc) return;

    const nav = toc.closest("nav.card");
    const articles = $$("article.qa.card");
    if (!articles.length) return;

    // Search UI
    const wrap = document.createElement("div");
    wrap.className = "fpSearchWrap";

    const input = document.createElement("input");
    input.className = "fpSearch";
    input.type = "search";
    input.placeholder = "Buscar no sumário (ex.: segurança, escopo, BD, fluxo...)";
    input.setAttribute("aria-label", "Buscar no sumário");

    const chipAll = mkChip("Tudo");
    const chipCore = mkChip("Essenciais");
    const chipSec = mkChip("Segurança");
    const chipDb = mkChip("Banco");
    const chipFlow = mkChip("Fluxo");

    wrap.append(input, chipAll, chipCore, chipSec, chipDb, chipFlow);
    nav.insertBefore(wrap, toc);

    // Build items
    toc.innerHTML = "";
    for (const art of articles) {
      if (!art.id) {
        const title = art.getAttribute("data-title") || $("h2", art)?.innerText || "sec";
        art.id = slugify(title);
      }
      const title = art.getAttribute("data-title") || $("h2", art)?.innerText || art.id;

      // Add a "done toggle" button per section
      const li = document.createElement("li");

      const a = document.createElement("a");
      a.href = `#${art.id}`;
      a.textContent = title;
      a.dataset.tocFor = art.id;

      a.addEventListener("click", (e) => {
        if (!prefersReducedMotion) {
          e.preventDefault();
          document.getElementById(art.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
          history.pushState(null, "", `#${art.id}`);
        }
      });

      const doneBtn = document.createElement("button");
      doneBtn.type = "button";
      doneBtn.className = "fpChip";
      doneBtn.style.marginLeft = "10px";
      doneBtn.style.padding = "5px 10px";
      doneBtn.textContent = "✅";
      doneBtn.title = "Marcar seção como concluída";
      doneBtn.setAttribute("aria-label", "Marcar seção como concluída");
      doneBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleDone(art.id);
      });

      li.appendChild(a);
      li.appendChild(doneBtn);
      toc.appendChild(li);
    }

    // Search filter
    input.addEventListener("input", () => filterTOC(input.value));

    // Chips
    chipAll.addEventListener("click", () => { input.value = ""; filterTOC(""); toast("Sumário: tudo ✅"); });
    chipCore.addEventListener("click", () => { input.value = "introdução objetivo escopo tecnologias"; filterTOC(input.value); toast("Filtrando essenciais ✨"); });
    chipSec.addEventListener("click", () => { input.value = "segurança lgpd sigilo"; filterTOC(input.value); toast("Filtrando segurança 🔐"); });
    chipDb.addEventListener("click", () => { input.value = "banco modelagem sql"; filterTOC(input.value); toast("Filtrando banco 🗄️"); });
    chipFlow.addEventListener("click", () => { input.value = "fluxo arquitetura"; filterTOC(input.value); toast("Filtrando fluxo 🧭"); });

    // init done badges
    applyDoneAll();
    updateSectionsProgress();
  }

  function mkChip(label) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "fpChip";
    b.textContent = label;
    return b;
  }

  function slugify(title) {
    return String(title)
      .toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\w\s-]/g, "")
      .trim().replace(/\s+/g, "-") || `sec-${Math.random().toString(16).slice(2)}`;
  }

  function filterTOC(query) {
    const q = query.toLowerCase().trim();
    const items = $$("#sumarioAuto li");
    if (!items.length) return;

    for (const li of items) {
      const a = $("a", li);
      const text = a?.textContent?.toLowerCase() || "";
      li.style.display = (!q || text.includes(q) || q.split(/\s+/).some(w => w && text.includes(w)))
        ? "" : "none";
    }
  }

  /* -------------------------
     ScrollSpy
  --------------------------*/
  function initScrollSpy() {
    const links = $$("#sumarioAuto a[data-toc-for]");
    if (!links.length) return;

    const sections = links
      .map(a => document.getElementById(a.dataset.tocFor))
      .filter(Boolean);

    const setActive = (id) => {
      links.forEach(a => a.classList.toggle("active", a.dataset.tocFor === id));
    };

    let current = sections[0]?.id;

    const obs = new IntersectionObserver((entries) => {
      const visible = entries
        .filter(e => e.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

      if (visible?.target?.id && visible.target.id !== current) {
        current = visible.target.id;
        setActive(current);
        // highlight section
        flash(document.getElementById(current));
      }
    }, { threshold: [0.18, 0.30, 0.45, 0.60] });

    sections.forEach(s => obs.observe(s));
    if (current) setActive(current);
  }

  function flash(el) {
    if (!el) return;
    el.classList.add("fpGlow");
    setTimeout(() => el.classList.remove("fpGlow"), 520);
  }

  /* -------------------------
     Copy actions + "copy current section"
  --------------------------*/
  function bindCopyAndPrint() {
    // Buttons with data-copy
    document.addEventListener("click", async (e) => {
      const btn = e.target.closest("[data-copy]");
      if (!btn) return;
      const selector = btn.dataset.copy;
      const el = selector ? $(selector) : null;
      if (!el) { toast("Não achei o conteúdo 😕"); return; }

      const ok = await copyToClipboard(el.innerText);
      if (ok) {
        playBeep();
        confettiBurst();
      }
    });

    // Copy all
    $("#btnCopyAll")?.addEventListener("click", async () => {
      const content = $(".content");
      if (!content) return;
      const ok = await copyToClipboard(content.innerText);
      if (ok) {
        playBeep();
        confettiRain(900);
        toast("Documento inteiro copiado! 🎉");
      }
    });

    // Print
    $("#btnPrint")?.addEventListener("click", () => {
      toast("Abrindo impressão/PDF 🖨️");
      window.print();
    });
  }

  function getCurrentSection() {
    const activeLink = $("#sumarioAuto a.active");
    const id = activeLink?.dataset?.tocFor;
    return id ? document.getElementById(id) : null;
  }

  async function copyCurrentSection() {
    const sec = getCurrentSection();
    if (!sec) { toast("Nenhuma seção ativa 😅"); return; }
    const ok = await copyToClipboard(sec.innerText);
    if (ok) { playBeep(); confettiBurst(); toast("Seção atual copiada ✅"); }
  }

  /* -------------------------
     Reveal animations
  --------------------------*/
  function initRevealAnimations() {
    if (prefersReducedMotion) return;

    const targets = $$(".card, .cover, .top");
    targets.forEach(el => el.classList.add("fpReveal"));

    const obs = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          obs.unobserve(e.target);
        }
      }
    }, { threshold: 0.12 });

    targets.forEach(t => obs.observe(t));
  }

  /* -------------------------
     Zen mode (focus)
  --------------------------*/
  const KEY_ZEN = "fp_zen_mode";
  function toggleZen(force) {
    const curr = document.documentElement.dataset.zen === "1";
    const next = typeof force === "boolean" ? force : !curr;
    document.documentElement.dataset.zen = next ? "1" : "0";
    store.set(KEY_ZEN, next ? "1" : "0");
    toast(next ? "Modo Zen ativado 🎯" : "Modo Zen desativado ✅");
  }

  function initZen() {
    const on = store.get(KEY_ZEN, "0") === "1";
    document.documentElement.dataset.zen = on ? "1" : "0";
  }

  /* -------------------------
     Done sections (persist)
  --------------------------*/
  const KEY_DONE = "fp_done_sections_v1"; // JSON array
  function getDoneSet() {
    const raw = store.get(KEY_DONE, "[]");
    try { return new Set(JSON.parse(raw)); } catch { return new Set(); }
  }
  function saveDoneSet(set) {
    store.set(KEY_DONE, JSON.stringify(Array.from(set)));
  }

  function toggleDone(sectionId) {
    const set = getDoneSet();
    if (set.has(sectionId)) set.delete(sectionId);
    else set.add(sectionId);

    saveDoneSet(set);
    applyDone(sectionId);
    updateSectionsProgress();

    toast(set.has(sectionId) ? "Seção marcada como concluída ✅" : "Seção desmarcada ↩️");
    if (set.has(sectionId)) confettiBurst();
  }

  function applyDone(sectionId) {
    const set = getDoneSet();
    const sec = document.getElementById(sectionId);
    const link = $(`#sumarioAuto a[data-toc-for="${CSS.escape(sectionId)}"]`);
    if (!sec || !link) return;

    // Badge in section title
    const h2 = $("h2", sec);
    if (!h2) return;

    let badge = $(".fpDoneBadge", h2.parentElement || sec);
    if (!badge) {
      badge = document.createElement("span");
      badge.className = "fpDoneBadge";
      badge.textContent = "✓ Concluído";
      h2.insertAdjacentElement("afterend", badge);
    }

    const done = set.has(sectionId);
    badge.style.display = done ? "inline" : "none";
    link.style.opacity = done ? ".75" : "1";
    sec.style.opacity = done ? ".98" : "1";
  }

  function applyDoneAll() {
    const set = getDoneSet();
    $$("#sumarioAuto a[data-toc-for]").forEach(a => applyDone(a.dataset.tocFor));
  }

  function updateSectionsProgress() {
    const bar = $("#sectionsProgress");
    if (!bar) return;

    const all = $$("#sumarioAuto a[data-toc-for]").length || 1;
    const done = getDoneSet().size;
    const p = (done / all) * 100;
    bar.style.width = `${clamp(p, 0, 100).toFixed(2)}%`;

    // quando completa tudo: confetti
    if (done === all && all > 3) {
      toast("Você concluiu todas as seções! 🏆");
      confettiRain(1200);
    }
  }

  /* -------------------------
     Confetti (canvas)
  --------------------------*/
  let confettiCanvas, confettiCtx, confettiParticles = [], confettiRAF = null;

  function ensureConfettiCanvas() {
    if (confettiCanvas) return;
    confettiCanvas = document.createElement("canvas");
    confettiCanvas.id = "fpConfetti";
    confettiCanvas.width = window.innerWidth;
    confettiCanvas.height = window.innerHeight;
    document.body.appendChild(confettiCanvas);
    confettiCtx = confettiCanvas.getContext("2d");

    window.addEventListener("resize", () => {
      confettiCanvas.width = window.innerWidth;
      confettiCanvas.height = window.innerHeight;
    }, { passive: true });
  }

  function confettiBurst() {
    if (prefersReducedMotion) return;
    ensureConfettiCanvas();
    const cx = window.innerWidth / 2;
    const cy = Math.min(220, window.innerHeight * 0.25);

    for (let i = 0; i < 80; i++) {
      confettiParticles.push({
        x: cx, y: cy,
        vx: (Math.random() - 0.5) * 9,
        vy: (Math.random() - 1.2) * 10,
        g: 0.22 + Math.random() * 0.10,
        s: 3 + Math.random() * 3,
        a: 1,
        r: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.2,
        c: randomConfettiColor()
      });
    }
    startConfettiLoop();
    setTimeout(stopConfettiLoopIfEmpty, 1600);
  }

  function confettiRain(duration = 900) {
    if (prefersReducedMotion) return;
    ensureConfettiCanvas();
    const start = performance.now();

    const spawn = () => {
      const now = performance.now();
      if (now - start > duration) return;

      for (let i = 0; i < 10; i++) {
        confettiParticles.push({
          x: Math.random() * window.innerWidth,
          y: -10,
          vx: (Math.random() - 0.5) * 1.5,
          vy: 2 + Math.random() * 3,
          g: 0.08 + Math.random() * 0.06,
          s: 3 + Math.random() * 3,
          a: 1,
          r: Math.random() * Math.PI,
          vr: (Math.random() - 0.5) * 0.1,
          c: randomConfettiColor()
        });
      }
      requestAnimationFrame(spawn);
    };

    spawn();
    startConfettiLoop();
    setTimeout(stopConfettiLoopIfEmpty, duration + 1400);
  }

  function randomConfettiColor() {
    const colors = ["#0b3b91", "#2563eb", "#60a5fa", "#10b981", "#34d399", "#f59e0b", "#ef4444"];
    return colors[(Math.random() * colors.length) | 0];
  }

  function startConfettiLoop() {
    if (confettiRAF) return;
    const loop = () => {
      confettiRAF = requestAnimationFrame(loop);
      renderConfetti();
    };
    loop();
  }

  function stopConfettiLoopIfEmpty() {
    if (!confettiParticles.length && confettiRAF) {
      cancelAnimationFrame(confettiRAF);
      confettiRAF = null;
      confettiCtx?.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
    }
  }

  function renderConfetti() {
    if (!confettiCtx) return;
    confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);

    confettiParticles = confettiParticles.filter(p => p.a > 0.02 && p.y < window.innerHeight + 30);

    for (const p of confettiParticles) {
      p.vy += p.g;
      p.x += p.vx;
      p.y += p.vy;
      p.r += p.vr;
      p.a *= 0.985;

      confettiCtx.save();
      confettiCtx.globalAlpha = p.a;
      confettiCtx.translate(p.x, p.y);
      confettiCtx.rotate(p.r);
      confettiCtx.fillStyle = p.c;
      confettiCtx.fillRect(-p.s / 2, -p.s / 2, p.s * 1.6, p.s);
      confettiCtx.restore();
    }
  }

  /* -------------------------
     Click particles
  --------------------------*/
  function clickParticles(e) {
    if (prefersReducedMotion) return;
    const n = 12;
    for (let i = 0; i < n; i++) {
      const p = document.createElement("div");
      p.className = "fpParticle";
      p.style.left = `${e.clientX}px`;
      p.style.top = `${e.clientY}px`;
      p.style.background = randomConfettiColor();
      document.body.appendChild(p);

      const dx = (Math.random() - 0.5) * 90;
      const dy = (Math.random() - 0.9) * 90;
      const s = 0.8 + Math.random() * 1.4;

      p.animate([
        { transform: `translate(0,0) scale(${s})`, opacity: 0.95 },
        { transform: `translate(${dx}px,${dy}px) scale(0.1)`, opacity: 0 }
      ], { duration: 520 + Math.random() * 260, easing: "cubic-bezier(.2,.8,.2,1)" });

      setTimeout(() => p.remove(), 900);
    }
  }

  function bindClickParticles() {
    document.addEventListener("click", (e) => {
      // evita em inputs
      const tag = (e.target.tagName || "").toLowerCase();
      if (tag === "input" || tag === "textarea") return;
      clickParticles(e);
    });
  }

  /* -------------------------
     TTS (Text-to-Speech)
  --------------------------*/
  const tts = {
    active: false,
    utter: null
  };

  function speak(text) {
    if (!("speechSynthesis" in window)) {
      toast("Leitura por voz não suportada 😕");
      return;
    }
    stopSpeak();
    const u = new SpeechSynthesisUtterance(sanitizeText(text));
    u.lang = "pt-BR";
    u.rate = 1.02;
    u.pitch = 1.0;
    u.onstart = () => { tts.active = true; toast("Lendo… 🗣️"); };
    u.onend = () => { tts.active = false; toast("Leitura finalizada ✅"); };
    u.onerror = () => { tts.active = false; toast("Falha na leitura 😕"); };
    tts.utter = u;
    speechSynthesis.speak(u);
  }

  function pauseSpeak() {
    if (!("speechSynthesis" in window)) return;
    if (speechSynthesis.speaking && !speechSynthesis.paused) {
      speechSynthesis.pause();
      toast("Pausado ⏸️");
    }
  }

  function resumeSpeak() {
    if (!("speechSynthesis" in window)) return;
    if (speechSynthesis.paused) {
      speechSynthesis.resume();
      toast("Continuando ▶️");
    }
  }

  function stopSpeak() {
    if (!("speechSynthesis" in window)) return;
    if (speechSynthesis.speaking || speechSynthesis.paused) {
      speechSynthesis.cancel();
    }
    tts.active = false;
  }

  function speakCurrentSection() {
    const sec = getCurrentSection();
    if (!sec) { toast("Nenhuma seção ativa 😅"); return; }
    speak(sec.innerText);
  }

  /* -------------------------
     Hotkeys
  --------------------------*/
  function initHotkeys() {
    document.addEventListener("keydown", (e) => {
      // Ctrl+K -> foco na busca do sumário
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        const input = $(".fpSearch");
        if (input) {
          input.focus();
          input.select();
          toast("Busca do sumário 🔎");
        }
      }

      // Alt+ArrowUp -> topo
      if (e.altKey && e.key === "ArrowUp") {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: prefersReducedMotion ? "auto" : "smooth" });
        toast("Topo ↑");
      }

      // Ctrl+Shift+C -> copiar seção atual
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "c") {
        e.preventDefault();
        copyCurrentSection();
      }

      // Ctrl+Shift+L -> ler seção atual
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "l") {
        e.preventDefault();
        speakCurrentSection();
      }

      // Espaço + TTS ativo -> pausar/retomar (se não estiver em input)
      const tag = (document.activeElement?.tagName || "").toLowerCase();
      if (e.code === "Space" && tts.active && tag !== "input" && tag !== "textarea") {
        e.preventDefault();
        if (speechSynthesis.paused) resumeSpeak();
        else pauseSpeak();
      }

      // Esc -> parar TTS + sair do zen
      if (e.key === "Escape") {
        stopSpeak();
        toggleZen(false);
      }
    });
  }

  /* -------------------------
     Konami Easter Egg
  --------------------------*/
  function initKonami() {
    const seq = ["ArrowUp","ArrowUp","ArrowDown","ArrowDown","ArrowLeft","ArrowRight","ArrowLeft","ArrowRight","b","a"];
    let idx = 0;
    document.addEventListener("keydown", (e) => {
      const k = e.key;
      const match = (k === seq[idx]) || (k.toLowerCase() === seq[idx]);
      if (match) idx++;
      else idx = 0;

      if (idx === seq.length) {
        idx = 0;
        toast("Modo PARTY ativado 🕺🎉");
        confettiRain(1800);
      }
    });
  }

  /* -------------------------
     Final: Init
  --------------------------*/
  function init() {
    injectStyles();
    initZen();
    createProgressBars();
    createHUD();

    addReadingTime();
    buildTOC();
    initScrollSpy();

    bindCopyAndPrint();
    initRevealAnimations();
    bindClickParticles();

    typewriter();
    initHotkeys();
    initKonami();

    toast("Documento pronto ✅");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

})();
