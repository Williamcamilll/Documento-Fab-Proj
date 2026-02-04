(() => {
  const $ = (sel, root = document) => root.querySelector(sel);

  const toastEl = $("#toast");
  let toastTimer = null;

  function toast(msg, ms = 1400) {
    if (!toastEl) return;
    clearTimeout(toastTimer);
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    toastTimer = setTimeout(() => toastEl.classList.remove("show"), ms);
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

  $("#btnPrint")?.addEventListener("click", () => window.print());

  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-copy]");
    if (!btn) return;

    const target = btn.getAttribute("data-copy");
    const el = $(target);
    if (!el) return toast("Não achei o texto pra copiar");

    copyText(el.innerText);
  });

  $("#btnCopyAll")?.addEventListener("click", () => {
    const parts = [];

    const title = $("h1")?.innerText;
    if (title) parts.push(title);

    const group = $("#groupList")?.innerText;
    if (group) parts.push("Integrantes:\n" + group);

    ["#q1", "#q2", "#q3", "#q4"].forEach((id) => {
      const q = $(`${id} .q`)?.innerText;
      const a = $(`${id} .a`)?.innerText;
      if (q && a) parts.push(`${q}\n${a}`);
    });

    copyText(parts.join("\n\n"));
  });
})();
