/* Spectre Engine landing — JS
   - background particles
   - theme toggle (dark/light)
   - waitlist modal (mailto draft)
   - command palette (Ctrl+K)
   - tiny toast utility
*/

(() => {
  const $ = (q, el = document) => el.querySelector(q);
  const $$ = (q, el = document) => Array.from(el.querySelectorAll(q));

  // ---------------------------
  // Theme
  // ---------------------------
  const THEME_KEY = "spectre_theme";
  const html = document.documentElement;

  function applyTheme(theme) {
    html.setAttribute("data-theme", theme);
    try { localStorage.setItem(THEME_KEY, theme); } catch {}
  }

  function toggleTheme() {
    const current = html.getAttribute("data-theme") || "dark";
    applyTheme(current === "dark" ? "light" : "dark");
    toast(`Theme: ${html.getAttribute("data-theme")}`);
    resizeBg();
  }

  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === "light" || saved === "dark") applyTheme(saved);
  } catch {}

  $("#themeBtn")?.addEventListener("click", toggleTheme);
  $("#toggleThemeFooter")?.addEventListener("click", toggleTheme);

  // ---------------------------
  // Smooth scroll (minimal)
  // ---------------------------
  function smoothTo(hash) {
    const el = $(hash);
    if (!el) return;
    el.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
  }
  $$(".navLink").forEach(a => a.addEventListener("click", (e) => {
    const href = a.getAttribute("href") || "";
    if (href.startsWith("#")) { e.preventDefault(); smoothTo(href); }
  }));

  // ---------------------------
  // Toast
  // ---------------------------
  const toastEl = $("#toast");
  let toastT = null;
  function toast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    clearTimeout(toastT);
    toastT = setTimeout(() => toastEl.classList.remove("show"), 1600);
  }

  // ---------------------------
  // Footer year
  // ---------------------------
  const yearEl = $("#year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  // ---------------------------
  // Copy email
  // ---------------------------
  const defaultEmail = { value: "hello@spectre.engine" };
  function getEmail() {
    const el = $("#contactEmail");
    return el?.textContent?.trim() || defaultEmail.value;
  }
  $("#copyEmail")?.addEventListener("click", async () => {
    const email = getEmail();
    try {
      await navigator.clipboard.writeText(email);
      toast("Email copied");
    } catch {
      toast(email);
    }
  });

  // ---------------------------
  // Waitlist modal
  // ---------------------------
  const modal = $("#modal");
  const modalClose = $("#modalClose");
  const waitlistOpen = $("#waitlistOpen");
  const waitlistForm = $("#waitlistForm");
  const editEmailBtn = $("#editEmail");

  function openModal() {
    if (!modal) return;
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
    const input = $("#waitlistForm input[name='email']");
    setTimeout(() => input?.focus(), 0);
  }

  function closeModal() {
    if (!modal) return;
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
  }

  waitlistOpen?.addEventListener("click", openModal);
  modalClose?.addEventListener("click", closeModal);
  modal?.addEventListener("click", (e) => {
    const t = e.target;
    if (!(t instanceof HTMLElement)) return;
    if (t.dataset.close === "true") closeModal();
  });
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal?.classList.contains("open")) closeModal();
  });

  editEmailBtn?.addEventListener("click", () => {
    const current = getEmail();
    const next = prompt("Set contact email for draft:", current);
    if (!next) return;
    $("#contactEmail").textContent = next.trim();
    toast("Updated contact email");
  });

  waitlistForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    const fd = new FormData(waitlistForm);
    const email = String(fd.get("email") || "").trim();
    const note = String(fd.get("note") || "").trim();

    if (!email) return;

    const to = getEmail();
    const subject = encodeURIComponent("Spectre Engine — Early access request");
    const body = encodeURIComponent(
      `Hey,\n\nI'd like early access to Spectre Engine.\n\nMy email: ${email}\n\nNote:\n${note || "(none)"}\n\n—`
    );
    const href = `mailto:${encodeURIComponent(to)}?subject=${subject}&body=${body}`;

    closeModal();
    toast("Drafting email…");
    window.location.href = href;
  });

  // ---------------------------
  // Command palette
  // ---------------------------
  const cmdk = $("#cmdk");
  const cmdkBtn = $("#cmdkBtn");
  const openCmdkBtn = $("#openCmdk");
  const cmdkInput = $("#cmdkInput");
  const cmdkList = $("#cmdkList");

  const commands = [
    { name: "Top", desc: "Back to the hero section", key: "T", action: () => smoothTo("#top") },
    { name: "Status", desc: "Private build intent and scope", key: "S", action: () => smoothTo("#status") },
    { name: "Philosophy", desc: "Sharp by design, minimalist but robust", key: "P", action: () => smoothTo("#philosophy") },
    { name: "Pipeline", desc: "Unity-style flow: import → catalog → compose", key: "L", action: () => smoothTo("#pipeline") },
    { name: "Stack", desc: "C++ + raylib + Dear ImGui", key: "K", action: () => smoothTo("#stack") },
    { name: "Roadmap", desc: "Signals, not promises", key: "R", action: () => smoothTo("#roadmap") },
    { name: "Contact", desc: "Copy email or request early access", key: "C", action: () => smoothTo("#contact") },
    { name: "Toggle theme", desc: "Swap dark/light", key: "◐", action: () => toggleTheme() },
    { name: "Request early access", desc: "Open the private request modal", key: "E", action: () => openModal() },
  ];

  let filtered = commands.slice();
  let selected = 0;

  function renderList() {
    if (!cmdkList) return;
    cmdkList.innerHTML = "";
    if (filtered.length === 0) {
      const div = document.createElement("div");
      div.className = "cmdkItem";
      div.innerHTML = `<div class="cmdkLeft"><div class="cmdkName">No results</div><div class="cmdkDesc">Try fewer words.</div></div><div class="cmdkKey">—</div>`;
      cmdkList.appendChild(div);
      return;
    }
    filtered.forEach((c, i) => {
      const item = document.createElement("div");
      item.className = "cmdkItem";
      item.setAttribute("role", "option");
      item.setAttribute("aria-selected", i === selected ? "true" : "false");
      item.innerHTML = `
        <div class="cmdkLeft">
          <div class="cmdkName">${escapeHtml(c.name)}</div>
          <div class="cmdkDesc">${escapeHtml(c.desc)}</div>
        </div>
        <div class="cmdkKey">${escapeHtml(c.key)}</div>
      `;
      item.addEventListener("click", () => runCommand(i));
      cmdkList.appendChild(item);
    });

    // Ensure selected visible
    const sel = cmdkList.querySelector('[aria-selected="true"]');
    sel?.scrollIntoView({ block: "nearest" });
  }

  function filterList(q) {
    const s = q.trim().toLowerCase();
    filtered = !s
      ? commands.slice()
      : commands.filter(c => (c.name + " " + c.desc).toLowerCase().includes(s));
    selected = 0;
    renderList();
  }

  function openCmdk() {
    if (!cmdk) return;
    cmdk.classList.add("open");
    cmdk.setAttribute("aria-hidden", "false");
    filterList("");
    setTimeout(() => { cmdkInput?.focus(); cmdkInput?.select(); }, 0);
  }

  function closeCmdk() {
    if (!cmdk) return;
    cmdk.classList.remove("open");
    cmdk.setAttribute("aria-hidden", "true");
  }

  function runCommand(idx) {
    const cmd = filtered[idx];
    if (!cmd) return;
    closeCmdk();
    setTimeout(() => cmd.action(), 0);
    toast(cmd.name);
  }

  cmdkBtn?.addEventListener("click", openCmdk);
  openCmdkBtn?.addEventListener("click", openCmdk);

  cmdk?.addEventListener("click", (e) => {
    const t = e.target;
    if (!(t instanceof HTMLElement)) return;
    if (t.dataset.cmdkClose === "true") closeCmdk();
  });

  cmdkInput?.addEventListener("input", () => filterList(cmdkInput.value));

  window.addEventListener("keydown", (e) => {
    const isMac = navigator.platform.toLowerCase().includes("mac");
    const mod = isMac ? e.metaKey : e.ctrlKey;

    // Ctrl+K toggles
    if (mod && e.key.toLowerCase() === "k") {
      e.preventDefault();
      if (cmdk?.classList.contains("open")) closeCmdk();
      else openCmdk();
      return;
    }

    // "/" opens (when not in an input)
    if (!cmdk?.classList.contains("open") && e.key === "/" && !isTypingInField()) {
      e.preventDefault();
      openCmdk();
      return;
    }

    if (!cmdk?.classList.contains("open")) return;

    if (e.key === "Escape") { e.preventDefault(); closeCmdk(); return; }
    if (e.key === "ArrowDown") { e.preventDefault(); selected = Math.min(selected + 1, filtered.length - 1); renderList(); return; }
    if (e.key === "ArrowUp") { e.preventDefault(); selected = Math.max(selected - 1, 0); renderList(); return; }
    if (e.key === "Enter") { e.preventDefault(); runCommand(selected); return; }
  });

  function isTypingInField() {
    const el = document.activeElement;
    if (!el) return false;
    const tag = el.tagName.toLowerCase();
    return tag === "input" || tag === "textarea" || (el instanceof HTMLElement && el.isContentEditable);
  }

  // ---------------------------
  // Background canvas (particles + scanlines)
  // ---------------------------
  const canvas = $("#bg");
  const ctx = canvas?.getContext("2d", { alpha: true });
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  let W = 0, H = 0, DPR = 1;
  let particles = [];
  const N = 120;

  function resizeBg() {
    if (!canvas || !ctx) return;
    DPR = Math.min(2, window.devicePixelRatio || 1);
    W = canvas.width = Math.floor(window.innerWidth * DPR);
    H = canvas.height = Math.floor(window.innerHeight * DPR);
    canvas.style.width = "100%";
    canvas.style.height = "100%";

    // regenerate particles
    particles = new Array(N).fill(0).map(() => ({
      x: Math.random() * W,
      y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.22 * DPR,
      vy: (Math.random() - 0.5) * 0.22 * DPR,
      r: (Math.random() * 1.2 + 0.6) * DPR
    }));
  }

  function colorForTheme(alpha) {
    // Particles should always contrast the background.
    const theme = html.getAttribute("data-theme") || "dark";
    return theme === "dark" ? `rgba(245,247,248,${alpha})` : `rgba(11,12,13,${alpha})`;
  }

  function tick() {
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, W, H);

    // soft vignette
    const g = ctx.createRadialGradient(W*0.5, H*0.5, Math.min(W,H)*0.12, W*0.5, H*0.5, Math.max(W,H)*0.62);
    g.addColorStop(0, "rgba(0,0,0,0)");
    g.addColorStop(1, colorForTheme(0.08));
    ctx.fillStyle = g;
    ctx.fillRect(0,0,W,H);

    // particles + links
    ctx.fillStyle = colorForTheme(0.55);
    ctx.strokeStyle = colorForTheme(0.08);
    ctx.lineWidth = 1 * DPR;

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;

      if (p.x < -40) p.x = W + 40;
      if (p.x > W + 40) p.x = -40;
      if (p.y < -40) p.y = H + 40;
      if (p.y > H + 40) p.y = -40;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();

      // links
      for (let j = i + 1; j < particles.length; j++) {
        const q = particles[j];
        const dx = p.x - q.x;
        const dy = p.y - q.y;
        const d2 = dx*dx + dy*dy;
        const max = (170 * DPR) * (170 * DPR);
        if (d2 < max) {
          const a = 1 - (d2 / max);
          ctx.strokeStyle = colorForTheme(0.07 * a);
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(q.x, q.y);
          ctx.stroke();
        }
      }
    }

    // scanlines
    ctx.fillStyle = colorForTheme(0.03);
    const gap = 6 * DPR;
    for (let y = 0; y < H; y += gap) {
      ctx.fillRect(0, y, W, 1 * DPR);
    }

    if (!reduceMotion) requestAnimationFrame(tick);
  }

  window.addEventListener("resize", () => {
    resizeBg();
    if (reduceMotion) tick();
  });

  resizeBg();
  tick();

  // ---------------------------
  // Small affordances
  // ---------------------------
  $("#cmdkBtn")?.addEventListener("mouseenter", () => toast("Ctrl+K"));
  $("#openCmdk")?.addEventListener("mouseenter", () => toast("Ctrl+K"));

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[c]));
  }
})();
