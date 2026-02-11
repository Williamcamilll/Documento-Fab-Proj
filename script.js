(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const toastEl = $("#toast");
  let toastTimer = null;

  function toast(msg, ms = 1400) {
    if (!toastEl) return;
    clearTimeout(toastTimer);
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    toastTimer = setTimeout(() => toastEl.classList.remove("show"), ms);
  }

  // Pega texto "limpo" e com quebras de linha melhores (ul/li, parágrafos etc.)
  function getReadableText(el) {
    if (!el) return "";
    // Clona para não mexer no DOM real
    const clone = el.cloneNode(true);

    // Remove botões e itens não-imprimíveis se existirem dentro
    $$(".no-print", clone).forEach((n) => n.remove());

    // Transforma <li> em linhas com bullet
    $$("li", clone).forEach((li) => {
      li.textContent = "• " + (li.textContent || "").trim();
    });

    // Garante que parágrafos virem blocos com quebra
    $$("p", clone).forEach((p) => {
      p.textContent = (p.textContent || "").trim();
      p.insertAdjacentText("afterend", "\n");
    });

    // Garante quebra após listas
    $$("ul", clone).forEach((ul) => {
      ul.insertAdjacentText("afterend", "\n");
    });

    let text = (clone.innerText || "")
      .replace(/\n{3,}/g, "\n\n")
      .replace(/[ \t]+\n/g, "\n")
      .trim();

    return text;
  }

  async function copyText(text) {
    text = (text || "").trim();
    if (!text) return toast("Nada para copiar");

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        return toast("Copiado ✅");
      }
    } catch {}

    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      ta.style.top = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
      toast("Copiado ✅");
    } catch {
      toast("Não consegui copiar 😕");
    }
  }

  // Print / PDF
  $("#btnPrint")?.addEventListener("click", () => window.print());

  // Botões individuais de copiar via data-copy
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-copy]");
    if (!btn) return;

    const target = btn.getAttribute("data-copy");
    const el = $(target);
    if (!el) return toast("Não achei o texto pra copiar");

    // Se for lista de integrantes, formata melhor
    if (target === "#groupList") {
      const items = $$("#groupList li").map((li) => li.textContent.trim()).filter(Boolean);
      const text = "Integrantes:\n" + items.map((x) => `• ${x.replace(/\s+/g, " ")}`).join("\n");
      return copyText(text);
    }

    copyText(getReadableText(el));
  });

  // Copiar tudo (agora pega TODOS os QAs automaticamente)
  $("#btnCopyAll")?.addEventListener("click", () => {
    const parts = [];

    // Cabeçalho principal
    const title = $("h1")?.innerText?.trim();
    if (title) parts.push(title);

    const subtitle = $(".subtitle")?.innerText?.trim();
    if (subtitle) parts.push(subtitle);

    // Meta (curso, termo etc.)
    const metaLines = $$(".docMeta > div").map((d) => d.innerText.trim()).filter(Boolean);
    if (metaLines.length) parts.push(metaLines.join("\n"));

    // Órgão e grupo
    const org = $(".infoGrid .info strong")?.innerText?.trim();
    if (org) parts.push("Órgão/Tema:\n" + org);

    const groupName = $$(".infoGrid .info strong")[1]?.innerText?.trim();
    const leader = $(".infoGrid .info .mini b")?.innerText?.trim();
    if (groupName) parts.push(`Grupo:\n${groupName}${leader ? `\nLíder: ${leader}` : ""}`);

    // Integrantes
    const members = $$("#groupList li").map((li) => li.textContent.trim()).filter(Boolean);
    if (members.length) parts.push("Integrantes:\n" + members.map((m) => `• ${m}`).join("\n"));

    // Todos os blocos de pergunta/resposta (qualquer card .qa)
    const cards = $$(".qa.card");
    cards.forEach((card) => {
      const q = $(".q", card)?.innerText?.trim();
      const aEl = $(".a", card);
      const a = getReadableText(aEl);
      if (q && a) parts.push(`${q}\n${a}`);
    });

    copyText(parts.join("\n\n"));
  });
})();

